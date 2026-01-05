# ========================================
# File: app/routes/chamudini.py
# ========================================
"""
Chamudini's Routes - Cement Clinker Classification API
File: backend/app/routes/chamudini.py
"""
import sys
import os
from pathlib import Path

# Add parent directory to path for imports
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir.parent.parent))

from fastapi import APIRouter, File, UploadFile, HTTPException, status
from fastapi.responses import JSONResponse
import time
import logging
from datetime import datetime
import json

try:
    from models.chamudini_schemas import (
        PredictionResponse, 
        ModelInfoResponse, 
        ErrorResponse,
        BatchPredictionResponse,
        BatchPredictionItem,
        HealthCheckResponse
    )
except ImportError:
    # Fallback: define schemas inline if import fails
    from pydantic import BaseModel
    from typing import Dict, Optional, List
    
    class PredictionResponse(BaseModel):
        success: bool
        predicted_class: str
        confidence: float
        all_probabilities: Dict[str, float]
        processing_time_ms: float
        timestamp: datetime = datetime.utcnow()
    
    class ModelInfoResponse(BaseModel):
        model_name: str = "Cement Clinker Classifier"
        model_type: str = "Transfer Learning (MobileNetV2)"
        classes: List[str]
        input_shape: tuple
        model_loaded: bool
        model_path: str
    
    class BatchPredictionItem(BaseModel):
        success: bool
        filename: str
        predicted_class: Optional[str] = None
        confidence: Optional[float] = None
        all_probabilities: Optional[Dict[str, float]] = None
        error: Optional[str] = None
    
    class BatchPredictionResponse(BaseModel):
        success: bool = True
        total_images: int
        predictions: List[BatchPredictionItem]
        total_processing_time_ms: float
    
    class HealthCheckResponse(BaseModel):
        status: str = "healthy"
        timestamp: datetime = datetime.utcnow()
        service: str = "chamudini-cement-classifier"
        model_loaded: bool
    
    class ErrorResponse(BaseModel):
        success: bool = False
        error: str
        detail: Optional[str] = None
        timestamp: datetime = datetime.utcnow()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chamudini", tags=["Chamudini - Cement Classifier"])

# ----------------------------
# Settings
# ----------------------------
class Settings:
    """Simple settings class"""
    IMG_HEIGHT = 224
    IMG_WIDTH = 224
    UPLOAD_DIR = "uploads"
    
    # Try to find model paths
    backend_dir = Path(__file__).parent.parent.parent
    ml_models_dir = backend_dir / "ml_models" / "chamudini"
    
    CHAMUDINI_MODEL_PATH = None
    CHAMUDINI_CLASS_NAMES_PATH = None
    
    if ml_models_dir.exists():
        # Look for model files
        model_candidates = [
            ml_models_dir / "final_model.keras",
            ml_models_dir / "model.h5",
            ml_models_dir / "model.keras",
            ml_models_dir / "saved_model"
        ]
        
        for candidate in model_candidates:
            if candidate.exists():
                CHAMUDINI_MODEL_PATH = str(candidate)
                break
        
        # Look for class names
        class_names_path = ml_models_dir / "class_names.json"
        if class_names_path.exists():
            CHAMUDINI_CLASS_NAMES_PATH = str(class_names_path)

settings = Settings()

# ----------------------------
# Simple Service Classes (Fallback)
# ----------------------------
class SimpleModelService:
    """Simple model service for fallback implementation"""
    
    def __init__(self):
        self.model = None
        self.class_names = ["C2S", "C3A", "C3S", "C4AF"]
        self._load_model()
    
    def _load_model(self):
        """Try to load the model"""
        import tensorflow as tf
        import numpy as np
        import json
        
        if settings.CHAMUDINI_MODEL_PATH:
            try:
                self.model = tf.keras.models.load_model(settings.CHAMUDINI_MODEL_PATH, compile=False)
                logger.info(f"Model loaded from {settings.CHAMUDINI_MODEL_PATH}")
                
                # Load class names if available
                if settings.CHAMUDINI_CLASS_NAMES_PATH:
                    with open(settings.CHAMUDINI_CLASS_NAMES_PATH, 'r') as f:
                        self.class_names = json.load(f)
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
                self.model = None
    
    def is_loaded(self):
        return self.model is not None
    
    def predict(self, image_array):
        """Make prediction on image array"""
        if not self.is_loaded():
            raise Exception("Model not loaded")
        
        import numpy as np
        
        # Ensure image is correctly shaped
        if len(image_array.shape) == 3:
            image_array = np.expand_dims(image_array, axis=0)
        
        # Make prediction
        predictions = self.model.predict(image_array, verbose=0)
        class_index = int(np.argmax(predictions, axis=1)[0])
        confidence = float(np.max(predictions))
        
        # Get class name
        predicted_class = self.class_names[class_index] if class_index < len(self.class_names) else f"Class_{class_index}"
        
        # Create probabilities dictionary
        all_probabilities = {}
        for i, prob in enumerate(predictions[0]):
            class_name = self.class_names[i] if i < len(self.class_names) else f"Class_{i}"
            all_probabilities[class_name] = float(prob)
        
        return {
            'predicted_class': predicted_class,
            'confidence': confidence,
            'all_probabilities': all_probabilities
        }
    
    def get_model_info(self):
        """Get model information"""
        return {
            'class_names': self.class_names,
            'model_loaded': self.is_loaded(),
            'model_path': settings.CHAMUDINI_MODEL_PATH or "Not found"
        }

class SimpleImageProcessor:
    """Simple image processor"""
    
    def __init__(self, target_size=(224, 224)):
        self.target_size = target_size
    
    def load_from_file(self, file_path):
        """Load and preprocess image from file"""
        from PIL import Image
        import numpy as np
        
        image = Image.open(file_path).convert('RGB')
        image = image.resize(self.target_size)
        img_array = np.array(image).astype(np.float32) / 255.0
        return img_array
    
    def validate_image(self, file_path):
        """Validate image file"""
        from PIL import Image
        try:
            with Image.open(file_path) as img:
                img.verify()
            return True, "Image is valid"
        except Exception as e:
            return False, f"Invalid image: {str(e)}"

class SimpleFileHandler:
    """Simple file handler"""
    
    def __init__(self, upload_dir="uploads"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(exist_ok=True)
    
    def validate_file(self, file):
        """Validate uploaded file"""
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.tiff', '.bmp'}
        
        if not file.filename:
            return {"valid": False, "error": "No filename provided"}
        
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in allowed_extensions:
            return {"valid": False, "error": f"File type not allowed. Allowed: {allowed_extensions}"}
        
        return {"valid": True, "error": None}
    
    async def save_upload_file(self, file):
        """Save uploaded file temporarily"""
        import uuid
        file_path = self.upload_dir / f"{uuid.uuid4()}_{file.filename}"
        
        with open(file_path, 'wb') as f:
            content = await file.read()
            f.write(content)
        
        return str(file_path)
    
    def delete_file(self, file_path):
        """Delete temporary file"""
        try:
            Path(file_path).unlink(missing_ok=True)
        except Exception:
            pass

# Initialize services
image_processor = SimpleImageProcessor(target_size=(settings.IMG_HEIGHT, settings.IMG_WIDTH))
file_handler = SimpleFileHandler(upload_dir=settings.UPLOAD_DIR)
model_service = SimpleModelService()

# ----------------------------
# API Endpoints
# ----------------------------

@router.post("/predict", response_model=PredictionResponse)
async def predict_cement_phase(file: UploadFile = File(...)):
    """
    Predict cement clinker phase from uploaded microscopy image
    
    - **file**: Microscopy image file (JPG, PNG, TIFF, BMP)
    
    Returns prediction with confidence scores for all phases:
    - C2S (Belite - Dicalcium Silicate)
    - C3A (Tricalcium Aluminate)
    - C3S (Alite - Tricalcium Silicate)
    - C4AF (Brownmillerite - Tetracalcium Aluminoferrite)
    """
    start_time = time.time()
    
    try:
        # Check if model is loaded
        if not model_service.is_loaded():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Model not loaded. Please check server logs."
            )
        
        # Validate file
        validation_result = file_handler.validate_file(file)
        if not validation_result["valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=validation_result["error"]
            )
        
        # Save uploaded file temporarily
        file_path = await file_handler.save_upload_file(file)
        
        try:
            # Validate image
            is_valid, error_msg = image_processor.validate_image(file_path)
            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_msg
                )
            
            # Preprocess image
            img_array = image_processor.load_from_file(file_path)
            
            # Make prediction
            prediction = model_service.predict(img_array)
            
            # Calculate processing time
            processing_time_ms = (time.time() - start_time) * 1000
            
            # Build response
            response = PredictionResponse(
                success=True,
                predicted_class=prediction['predicted_class'],
                confidence=prediction['confidence'],
                all_probabilities=prediction['all_probabilities'],
                processing_time_ms=processing_time_ms
            )
            
            logger.info(f"Prediction: {prediction['predicted_class']} ({prediction['confidence']:.2%})")
            
            return response
            
        finally:
            # Clean up temporary file
            file_handler.delete_file(file_path)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


@router.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(files: list[UploadFile] = File(...)):
    """
    Predict cement clinker phases for multiple images
    
    - **files**: List of microscopy image files (max 20)
    
    Returns predictions for all uploaded images
    """
    start_time = time.time()
    
    try:
        if not model_service.is_loaded():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Model not loaded"
            )
        
        if len(files) > 20:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 20 images per batch"
            )
        
        if len(files) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No files provided"
            )
        
        predictions = []
        
        for file in files:
            # Validate file
            validation = file_handler.validate_file(file)
            if not validation["valid"]:
                predictions.append(BatchPredictionItem(
                    success=False,
                    filename=file.filename,
                    error=validation["error"]
                ))
                continue
            
            # Process file
            file_path = await file_handler.save_upload_file(file)
            
            try:
                img_array = image_processor.load_from_file(file_path)
                prediction = model_service.predict(img_array)
                
                predictions.append(BatchPredictionItem(
                    success=True,
                    filename=file.filename,
                    predicted_class=prediction['predicted_class'],
                    confidence=prediction['confidence'],
                    all_probabilities=prediction['all_probabilities']
                ))
            except Exception as e:
                predictions.append(BatchPredictionItem(
                    success=False,
                    filename=file.filename,
                    error=str(e)
                ))
            finally:
                file_handler.delete_file(file_path)
        
        total_time_ms = (time.time() - start_time) * 1000
        
        return BatchPredictionResponse(
            success=True,
            total_images=len(files),
            predictions=predictions,
            total_processing_time_ms=total_time_ms
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction failed: {str(e)}"
        )


@router.get("/model/info", response_model=ModelInfoResponse)
async def get_model_info():
    """
    Get information about the loaded model
    
    Returns model architecture details and class information
    """
    try:
        if not model_service.is_loaded():
            return ModelInfoResponse(
                model_name="Cement Clinker Classifier",
                model_type="Transfer Learning (MobileNetV2)",
                classes=["C2S", "C3A", "C3S", "C4AF"],
                input_shape=(224, 224, 3),
                model_loaded=False,
                model_path=settings.CHAMUDINI_MODEL_PATH or "Not found"
            )
        
        info = model_service.get_model_info()
        
        return ModelInfoResponse(
            model_name="Cement Clinker Classifier",
            model_type="Transfer Learning (MobileNetV2)",
            classes=info['class_names'],
            input_shape=(224, 224, 3),
            model_loaded=info['model_loaded'],
            model_path=info['model_path']
        )
    
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    Health check endpoint for Chamudini's service
    """
    return HealthCheckResponse(
        status="healthy",
        service="chamudini-cement-classifier",
        model_loaded=model_service.is_loaded()
    )