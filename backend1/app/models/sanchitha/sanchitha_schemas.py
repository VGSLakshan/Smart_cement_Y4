"""
Sanchitha - Crack Segmentation Pydantic Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional


class CrackMetrics(BaseModel):
    """Metrics calculated from crack segmentation"""
    total_pixels: int = Field(..., description="Total number of pixels in image")
    crack_pixels: int = Field(..., description="Number of pixels identified as crack")
    crack_percentage: float = Field(..., description="Percentage of image that is crack")
    has_crack: bool = Field(..., description="Whether crack was detected (>0.5%)")


class CrackSegmentationResponse(BaseModel):
    """Response from crack segmentation prediction"""
    success: bool = Field(..., description="Whether prediction was successful")
    metrics: CrackMetrics = Field(..., description="Crack detection metrics")
    mask_base64: str = Field(..., description="Base64 encoded binary mask (PNG)")
    original_size: tuple[int, int] = Field(..., description="Original image dimensions (width, height)")
    threshold: float = Field(..., description="Threshold used for binary mask")
    message: str = Field(..., description="Human-readable result message")
    filename: Optional[str] = Field(None, description="Original filename")


class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    model_loaded: bool = Field(..., description="Whether the model is loaded")
    model_path: str = Field(..., description="Path to the model file")
