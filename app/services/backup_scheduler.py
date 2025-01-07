from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from pathlib import Path
import logging
from .backup_service import BackupService

logger = logging.getLogger(__name__)

class BackupScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.backup_service = BackupService()
        self._setup_scheduler()

    def _setup_scheduler(self):
        """Setup the backup scheduler with default jobs"""
        # Daily backup at 2 AM
        self.scheduler.add_job(
            self._run_daily_backup,
            CronTrigger(hour=2),
            id='daily_backup',
            replace_existing=True
        )

        # Weekly backup on Sunday at 3 AM
        self.scheduler.add_job(
            self._run_weekly_backup,
            CronTrigger(day_of_week='sun', hour=3),
            id='weekly_backup',
            replace_existing=True
        )

        # Monthly backup on the 1st at 4 AM
        self.scheduler.add_job(
            self._run_monthly_backup,
            CronTrigger(day=1, hour=4),
            id='monthly_backup',
            replace_existing=True
        )

    def start(self):
        """Start the backup scheduler"""
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("Backup scheduler started")

    def stop(self):
        """Stop the backup scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Backup scheduler stopped")

    def _run_daily_backup(self):
        """Run daily backup job"""
        try:
            backup_name = f"daily_backup_{datetime.now().strftime('%Y%m%d')}"
            self.backup_service.create_backup(backup_name)
            self._cleanup_old_backups("daily", keep_days=7)
            logger.info(f"Daily backup completed: {backup_name}")
        except Exception as e:
            logger.error(f"Daily backup failed: {str(e)}")

    def _run_weekly_backup(self):
        """Run weekly backup job"""
        try:
            backup_name = f"weekly_backup_{datetime.now().strftime('%Y%m%d')}"
            self.backup_service.create_backup(backup_name)
            self._cleanup_old_backups("weekly", keep_days=30)
            logger.info(f"Weekly backup completed: {backup_name}")
        except Exception as e:
            logger.error(f"Weekly backup failed: {str(e)}")

    def _run_monthly_backup(self):
        """Run monthly backup job"""
        try:
            backup_name = f"monthly_backup_{datetime.now().strftime('%Y%m')}"
            self.backup_service.create_backup(backup_name)
            self._cleanup_old_backups("monthly", keep_days=365)
            logger.info(f"Monthly backup completed: {backup_name}")
        except Exception as e:
            logger.error(f"Monthly backup failed: {str(e)}")

    def _cleanup_old_backups(self, backup_type: str, keep_days: int):
        """Clean up old backups based on type and retention period"""
        try:
            backups = self.backup_service.list_backups()
            current_time = datetime.now()
            
            for backup in backups:
                if not backup['name'].startswith(f"{backup_type}_backup_"):
                    continue
                
                created_at = datetime.fromisoformat(backup['created_at'])
                days_old = (current_time - created_at).days
                
                if days_old > keep_days:
                    backup_path = Path(backup['path'])
                    if backup_path.exists():
                        backup_path.unlink()
                        logger.info(f"Deleted old backup: {backup['name']}")
        except Exception as e:
            logger.error(f"Backup cleanup failed: {str(e)}")
