# ========================================
# File: app/models/chamudini_schemas.py
# ========================================
"""
Chamudini's Schemas - Cement Clinker Classification
File: backend/app/models/chamudini_schemas.py
"""
from pydantic import BaseModel, Field, validator
from typing import Dict, Optional, List
from datetime import datetime

class PredictionRequest(BaseModel):
    """Request model for prediction (if using base64)"""
    image_base64: Optional[str] = Field(None, description="Base64 encoded image")
    
    class Config:
        json_schema_extra = {
            "example": {
                "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
            }
        }

class PredictionResponse(BaseModel):
    """Response model for cement phase prediction"""
    success: bool = Field(True, description="Whether prediction was successful")
    predicted_class: str = Field(..., description="Predicted cement clinker phase")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Prediction confidence")
    all_probabilities: Dict[str, float] = Field(..., description="Probabilities for all classes")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "predicted_class": "C3S",
                "confidence": 0.9234,
                "all_probabilities": {
                    "C2S": 0.0123,
                    "C3A": 0.0421,
                    "C3S": 0.9234,
                    "C4AF": 0.0222
                },
                "processing_time_ms": 145.23,
                "timestamp": "2025-01-15T10:30:00.000Z"
            }
        }

class BatchPredictionItem(BaseModel):
    """Single prediction item in batch response"""
    success: bool
    filename: str
    predicted_class: Optional[str] = None
    confidence: Optional[float] = None
    all_probabilities: Optional[Dict[str, float]] = None
    error: Optional[str] = None

class BatchPredictionResponse(BaseModel):
    """Response for batch predictions"""
    success: bool = True
    total_images: int
    predictions: List[BatchPredictionItem]
    total_processing_time_ms: float
    
class ModelInfoResponse(BaseModel):
    """Model information response"""
    model_name: str = "Cement Clinker Classifier"
    model_type: str = "Transfer Learning (MobileNetV2)"
    classes: List[str] = ["C2S", "C3A", "C3S", "C4AF"]
    input_shape: tuple = (224, 224, 3)
    model_loaded: bool
    model_path: str
    
class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    service: str = "chamudini-cement-classifier"
    model_loaded: bool

class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)