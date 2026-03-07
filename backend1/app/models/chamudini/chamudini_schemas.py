from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Tuple


class PredictionResult(BaseModel):
    predicted_class: str = Field(
        ..., description="Predicted clinker phase class name"
    )
    confidence: float = Field(
        ..., description="Confidence score between 0.0 and 1.0"
    )
    rejected: bool = Field(
        ..., description="True if confidence is below reject threshold"
    )
    top3: List[Tuple[str, float]] = Field(
        ..., description="Top 3 predictions with confidence scores"
    )
    all_probabilities: Dict[str, float] = Field(
        ..., description="Probability for every class"
    )


class PredictionResponse(BaseModel):
    success: bool
    filename: str
    result: Optional[PredictionResult] = None
    error: Optional[str] = None


class ModelInfoResponse(BaseModel):
    model_name: str
    model_variant: str
    framework: str
    num_classes: int
    class_names: List[str]
    img_size: int
    reject_threshold: float
    status: str


class BatchPredictionResponse(BaseModel):
    success: bool
    total: int
    results: List[PredictionResponse]