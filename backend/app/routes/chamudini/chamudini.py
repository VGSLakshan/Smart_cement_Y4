# ========================================
# File: app/routes/chamudini.py
# ========================================
"""
Chamudini's Routes - Cement Clinker Classification API
File: backend/app/routes/chamudini.py
"""
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from fastapi.responses import JSONResponse
import time
from pathlib import Path
import logging

from app.config import settings
from app.models.chamudini_schemas import (
    PredictionResponse, 
    ModelInfoResponse, 
    ErrorResponse,
    BatchPredictionResponse,
    BatchPredictionItem,
    HealthCheckResponse
)
from app.services.chamudini.model_service import get_model
from app.services.chamudini.image_processor import ImageProcessor
from app.utils.file_handler import FileHandler

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chamudini", tags=["Chamudini - Cement Classifier"])

# Initialize services
image_processor = ImageProcessor(target_size=(settings.IMG_HEIGHT, settings.IMG_WIDTH))
file_handler = FileHandler(upload_dir=settings.UPLOAD_DIR)

# Initialize model
try:
    model = get_model(
        model_path=str(settings.CHAMUDINI_MODEL_PATH),
        class_names_path=str(settings.CHAMUDINI_CLASS_NAMES_PATH)
    )
    logger.info("✓ Chamudini's model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    model = None


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
        if model is None or not model.is_loaded():
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
            prediction = model.predict(img_array)
            
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
        if model is None or not model.is_loaded():
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
                prediction = model.predict(img_array)
                
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
        if model is None or not model.is_loaded():
            return ModelInfoResponse(
                model_name="Cement Clinker Classifier",
                model_type="Transfer Learning (MobileNetV2)",
                classes=["C2S", "C3A", "C3S", "C4AF"],
                input_shape=(224, 224, 3),
                model_loaded=False,
                model_path=str(settings.CHAMUDINI_MODEL_PATH)
            )
        
        info = model.get_model_info()
        
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
        model_loaded=model is not None and model.is_loaded()
    )
