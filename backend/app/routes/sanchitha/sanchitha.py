"""
Sanchitha - Crack Segmentation API Routes
"""
from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from app.services.sanchitha.model_service import crack_service
from app.models.sanchitha.sanchitha_schemas import (
    CrackSegmentationResponse,
    HealthCheckResponse
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sanchitha", tags=["Sanchitha - Crack Segmentation"])


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Check if the crack segmentation service is healthy"""
    return {
        "status": "healthy" if crack_service.model is not None else "model_not_loaded",
        "model_loaded": crack_service.model is not None,
        "model_path": str(crack_service.model_path)
    }


@router.post("/predict", response_model=CrackSegmentationResponse)
async def predict_crack(
    file: UploadFile = File(..., description="Image file for crack detection"),
    threshold: float = Query(0.5, ge=0.0, le=1.0, description="Threshold for binary mask (0.0-1.0)")
):
    """
    Detect and segment cracks in concrete images using U-Net model
    
    - **file**: Upload an image file (JPEG, PNG, etc.)
    - **threshold**: Sensitivity threshold (default 0.5, higher = less sensitive)
    
    Returns:
    - Binary segmentation mask as base64 PNG
    - Crack detection metrics (percentage, pixel count)
    - Detection status
    """
    if crack_service.model is None:
        raise HTTPException(
            status_code=503,
            detail="Crack segmentation model not loaded. Please check server logs."
        )
    
    try:
        # Read file contents
        contents = await file.read()
        
        # Perform prediction
        result = await crack_service.predict(contents, threshold)
        
        # Add filename to result
        result["filename"] = file.filename
        
        return result
        
    except Exception as e:
        logger.error(f"Prediction error for {file.filename}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )
