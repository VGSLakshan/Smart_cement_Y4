"""
File Handler Utility
File: backend/app/utils/file_handler.py
"""
from fastapi import UploadFile
from pathlib import Path
import uuid
import shutil
from typing import Dict
import logging

from app.config import settings

logger = logging.getLogger(__name__)

class FileHandler:
    """Handles file upload, validation, and management"""
    
    def __init__(self, upload_dir: Path = None):
        self.upload_dir = upload_dir or settings.UPLOAD_DIR
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def validate_file(self, file: UploadFile) -> Dict[str, any]:
        """
        Validate uploaded file
        
        Args:
            file: UploadFile object from FastAPI
            
        Returns:
            Dictionary with validation result
        """
        # Check if file exists
        if not file:
            return {"valid": False, "error": "No file provided"}
        
        # Check filename
        if not file.filename:
            return {"valid": False, "error": "Filename is empty"}
        
        # Check file extension
        file_ext = Path(file.filename).suffix.lower().lstrip('.')
        if file_ext not in settings.ALLOWED_EXTENSIONS:
            return {
                "valid": False, 
                "error": f"Invalid file type. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            }
        
        # Check file size (if available)
        if hasattr(file, 'size') and file.size:
            if file.size > settings.MAX_FILE_SIZE:
                max_size_mb = settings.MAX_FILE_SIZE / (1024 * 1024)
                return {
                    "valid": False,
                    "error": f"File too large. Maximum size: {max_size_mb}MB"
                }
        
        return {"valid": True, "error": None}
    
    async def save_upload_file(self, file: UploadFile) -> Path:
        """
        Save uploaded file to disk
        
        Args:
            file: UploadFile object
            
        Returns:
            Path to saved file
        """
        # Generate unique filename
        file_ext = Path(file.filename).suffix.lower()
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = self.upload_dir / unique_filename
        
        # Save file
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            logger.info(f"File saved: {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"Error saving file: {e}")
            raise
    
    def delete_file(self, file_path: Path) -> bool:
        """
        Delete a file
        
        Args:
            file_path: Path to file
            
        Returns:
            True if deleted, False otherwise
        """
        try:
            if file_path.exists():
                file_path.unlink()
                logger.debug(f"File deleted: {file_path}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting file: {e}")
            return False
    
    def cleanup_old_files(self, max_age_hours: int = 24):
        """
        Clean up files older than specified hours
        
        Args:
            max_age_hours: Maximum age in hours
        """
        import time
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        deleted_count = 0
        for file_path in self.upload_dir.iterdir():
            if file_path.is_file():
                file_age = current_time - file_path.stat().st_mtime
                if file_age > max_age_seconds:
                    self.delete_file(file_path)
                    deleted_count += 1
        
        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} old files")