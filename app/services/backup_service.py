import os
import shutil
import json
import zipfile
from datetime import datetime
from pathlib import Path
from typing import List, Optional
import subprocess
from sqlalchemy import create_engine
from ..config import settings

class BackupService:
    def __init__(self):
        self.backup_dir = Path("backups")
        self.backup_dir.mkdir(exist_ok=True)
        self.db_url = settings.DATABASE_URL
        self.engine = create_engine(self.db_url)

    def create_backup(self, backup_name: Optional[str] = None) -> str:
        """Create a full backup of the database and uploaded files"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = backup_name or f"backup_{timestamp}"
        backup_path = self.backup_dir / backup_name
        backup_path.mkdir(exist_ok=True)

        try:
            # Backup database
            self._backup_database(backup_path)

            # Backup uploaded files
            self._backup_uploads(backup_path)

            # Create metadata file
            self._create_metadata(backup_path)

            # Create zip file
            zip_path = self._create_zip(backup_path, backup_name)

            # Clean up temporary backup directory
            shutil.rmtree(backup_path)

            return str(zip_path)
        except Exception as e:
            if backup_path.exists():
                shutil.rmtree(backup_path)
            raise Exception(f"Backup failed: {str(e)}")

    def restore_backup(self, backup_path: str) -> bool:
        """Restore from a backup file"""
        if not os.path.exists(backup_path):
            raise FileNotFoundError("Backup file not found")

        # Create temporary directory for restoration
        temp_dir = self.backup_dir / "temp_restore"
        temp_dir.mkdir(exist_ok=True)

        try:
            # Extract backup
            with zipfile.ZipFile(backup_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)

            # Verify metadata
            self._verify_metadata(temp_dir)

            # Restore database
            self._restore_database(temp_dir)

            # Restore uploaded files
            self._restore_uploads(temp_dir)

            return True
        except Exception as e:
            raise Exception(f"Restore failed: {str(e)}")
        finally:
            if temp_dir.exists():
                shutil.rmtree(temp_dir)

    def list_backups(self) -> List[dict]:
        """List all available backups"""
        backups = []
        for backup_file in self.backup_dir.glob("*.zip"):
            try:
                with zipfile.ZipFile(backup_file, 'r') as zip_ref:
                    try:
                        metadata = json.loads(zip_ref.read('metadata.json'))
                    except:
                        metadata = {}
                
                backups.append({
                    "name": backup_file.stem,
                    "size": backup_file.stat().st_size,
                    "created_at": metadata.get('created_at', ''),
                    "version": metadata.get('version', ''),
                    "path": str(backup_file)
                })
            except:
                continue
        
        return sorted(backups, key=lambda x: x['created_at'], reverse=True)

    def _backup_database(self, backup_path: Path):
        """Backup the PostgreSQL database"""
        db_backup_path = backup_path / "database.sql"
        
        # Get database connection details from URL
        db_params = self.engine.url
        
        # Construct pg_dump command
        command = [
            "pg_dump",
            "-h", str(db_params.host),
            "-p", str(db_params.port or 5432),
            "-U", str(db_params.username),
            "-d", str(db_params.database),
            "-f", str(db_backup_path)
        ]
        
        # Set PGPASSWORD environment variable
        env = os.environ.copy()
        env["PGPASSWORD"] = str(db_params.password)
        
        # Execute pg_dump
        process = subprocess.run(
            command,
            env=env,
            capture_output=True,
            text=True
        )
        
        if process.returncode != 0:
            raise Exception(f"Database backup failed: {process.stderr}")

    def _backup_uploads(self, backup_path: Path):
        """Backup uploaded files"""
        uploads_dir = Path("uploads")
        if uploads_dir.exists():
            shutil.copytree(uploads_dir, backup_path / "uploads", dirs_exist_ok=True)

    def _create_metadata(self, backup_path: Path):
        """Create backup metadata file"""
        metadata = {
            "version": "1.0",
            "created_at": datetime.now().isoformat(),
            "database": self.engine.url.database,
            "includes_uploads": os.path.exists(backup_path / "uploads")
        }
        
        with open(backup_path / "metadata.json", 'w') as f:
            json.dump(metadata, f)

    def _create_zip(self, backup_path: Path, backup_name: str) -> Path:
        """Create a zip file of the backup"""
        zip_path = self.backup_dir / f"{backup_name}.zip"
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(backup_path):
                for file in files:
                    file_path = Path(root) / file
                    arcname = file_path.relative_to(backup_path)
                    zipf.write(file_path, arcname)
        return zip_path

    def _verify_metadata(self, restore_path: Path):
        """Verify backup metadata before restoration"""
        metadata_path = restore_path / "metadata.json"
        if not metadata_path.exists():
            raise Exception("Invalid backup: metadata.json not found")

        with open(metadata_path, 'r') as f:
            metadata = json.load(f)

        if metadata.get('database') != self.engine.url.database:
            raise Exception("Database mismatch in backup metadata")

    def _restore_database(self, restore_path: Path):
        """Restore the PostgreSQL database"""
        db_backup_path = restore_path / "database.sql"
        if not db_backup_path.exists():
            raise Exception("Database backup file not found")

        # Get database connection details
        db_params = self.engine.url

        # Construct psql command
        command = [
            "psql",
            "-h", str(db_params.host),
            "-p", str(db_params.port or 5432),
            "-U", str(db_params.username),
            "-d", str(db_params.database),
            "-f", str(db_backup_path)
        ]

        # Set PGPASSWORD environment variable
        env = os.environ.copy()
        env["PGPASSWORD"] = str(db_params.password)

        # Execute psql
        process = subprocess.run(
            command,
            env=env,
            capture_output=True,
            text=True
        )

        if process.returncode != 0:
            raise Exception(f"Database restore failed: {process.stderr}")

    def _restore_uploads(self, restore_path: Path):
        """Restore uploaded files"""
        uploads_backup = restore_path / "uploads"
        if uploads_backup.exists():
            uploads_dir = Path("uploads")
            if uploads_dir.exists():
                shutil.rmtree(uploads_dir)
            shutil.copytree(uploads_backup, uploads_dir)
