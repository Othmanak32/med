from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import List
from pathlib import Path
from ..auth.utils import get_current_active_user
from ..services.backup_service import BackupService
from ..services.backup_scheduler import BackupScheduler
from pydantic import BaseModel

router = APIRouter()
backup_service = BackupService()
backup_scheduler = BackupScheduler()

class BackupResponse(BaseModel):
    name: str
    size: int
    created_at: str
    version: str
    path: str

@router.post("/backups/", response_model=str)
async def create_backup(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_active_user)
):
    """Create a new backup"""
    try:
        # Add backup task to background tasks
        def create_backup_task():
            return backup_service.create_backup()
        
        background_tasks.add_task(create_backup_task)
        return "Backup process started"
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/backups/", response_model=List[BackupResponse])
async def list_backups(
    current_user: dict = Depends(get_current_active_user)
):
    """List all available backups"""
    try:
        return backup_service.list_backups()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/backups/{backup_name}")
async def download_backup(
    backup_name: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Download a specific backup"""
    try:
        backup_path = Path("backups") / f"{backup_name}.zip"
        if not backup_path.exists():
            raise HTTPException(status_code=404, detail="Backup not found")
        
        return FileResponse(
            path=backup_path,
            filename=f"{backup_name}.zip",
            media_type="application/zip"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/backups/{backup_name}/restore")
async def restore_backup(
    backup_name: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_active_user)
):
    """Restore from a specific backup"""
    try:
        backup_path = Path("backups") / f"{backup_name}.zip"
        if not backup_path.exists():
            raise HTTPException(status_code=404, detail="Backup not found")
        
        # Add restore task to background tasks
        def restore_backup_task():
            return backup_service.restore_backup(str(backup_path))
        
        background_tasks.add_task(restore_backup_task)
        return "Restore process started"
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/backups/scheduler/start")
async def start_scheduler(
    current_user: dict = Depends(get_current_active_user)
):
    """Start the backup scheduler"""
    try:
        backup_scheduler.start()
        return {"message": "Backup scheduler started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/backups/scheduler/stop")
async def stop_scheduler(
    current_user: dict = Depends(get_current_active_user)
):
    """Stop the backup scheduler"""
    try:
        backup_scheduler.stop()
        return {"message": "Backup scheduler stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
