"""
Shared Pydantic schemas
"""
from pydantic import BaseModel, Field
from typing import Dict, Optional
from datetime import datetime


class PredictionResponse(BaseModel):
    """Response model for prediction"""
    success: bool
    predicted_class: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    all_probabilities: Dict[str, float]
    image_size: list
    processing_time: float
    timestamp: datetime


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    error: str
    detail: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    timestamp: datetime