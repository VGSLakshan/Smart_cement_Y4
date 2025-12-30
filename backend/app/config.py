"""
SMART_CEMENT Backend Configuration
File: backend/app/config.py
"""
from pathlib import Path
from typing import List

class Settings:
    """Application settings"""
    
    # App Info
    APP_NAME: str = "Cement Clinker Classifier API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001"
    ]
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    ML_MODELS_DIR: Path = BASE_DIR / "ml_models"
    
    # Chamudini's model paths
    CHAMUDINI_MODEL_PATH: Path = ML_MODELS_DIR / "chamudini" / "final_model.keras"
    CHAMUDINI_CLASS_NAMES_PATH: Path = ML_MODELS_DIR / "chamudini" / "class_names.json"
    
    # Image Processing
    IMAGE_SIZE: int = 224
    IMG_HEIGHT: int = 224
    IMG_WIDTH: int = 224
    CLASS_NAMES: List[str] = ["C2S", "C3A", "C3S", "C4AF"]
    
    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "bmp", "tif", "tiff"]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    def __init__(self):
        # Create directories
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.ML_MODELS_DIR.mkdir(parents=True, exist_ok=True)
        (self.ML_MODELS_DIR / "chamudini").mkdir(exist_ok=True)

settings = Settings()