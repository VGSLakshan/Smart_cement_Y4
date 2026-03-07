from pydantic import BaseModel, Field
from typing import Optional


class CementDataInput(BaseModel):
    """Input schema for cement strength prediction"""
    initial_min: float = Field(..., description="Initial grinding time in minutes")
    final_min: float = Field(..., description="Final grinding time in minutes")
    residue_45um: float = Field(..., description="Residue 45µm(%)")
    fineness: float = Field(..., description="Fineness(cm2/g)")
    loi: float = Field(..., description="Loss on Ignition (L.O.I.)")
    sio2: float = Field(..., description="Silicon Dioxide content")
    al2o3: float = Field(..., description="Aluminum Oxide content")
    fe2o3: float = Field(..., description="Iron Oxide content")
    cao: float = Field(..., description="Calcium Oxide content")
    mgo: float = Field(..., description="Magnesium Oxide content")
    so3: float = Field(..., description="Sulfur Trioxide content")
    k2o: float = Field(..., description="Potassium Oxide content")
    na2o: float = Field(..., description="Sodium Oxide content")
    cl: float = Field(..., description="Chloride content")

    class Config:
        json_schema_extra = {
            "example": {
                "initial_min": 30.0,
                "final_min": 120.0,
                "residue_45um": 8.5,
                "fineness": 3200.0,
                "loi": 2.5,
                "sio2": 20.5,
                "al2o3": 5.2,
                "fe2o3": 3.1,
                "cao": 63.5,
                "mgo": 1.8,
                "so3": 2.3,
                "k2o": 0.5,
                "na2o": 0.3,
                "cl": 0.01
            }
        }


class StrengthPrediction(BaseModel):
    """Output schema for strength predictions"""
    strength_1d: float = Field(..., description="1-Day compressive strength (MPa)")
    strength_2d: float = Field(..., description="2-Day compressive strength (MPa)")
    strength_7d: float = Field(..., description="7-Day compressive strength (MPa)")
    strength_28d: float = Field(..., description="28-Day compressive strength (MPa)")
    strength_56d: float = Field(..., description="56-Day compressive strength (MPa)")
    model_used: str = Field(default="Ensemble (XGBoost + LightGBM)", description="Model algorithm used")
    confidence: Optional[str] = Field(default="High", description="Prediction confidence level")


class PredictionResponse(BaseModel):
    """Response schema for prediction endpoint"""
    success: bool
    message: str
    input_data: CementDataInput
    predictions: StrengthPrediction
    engineered_features_count: int = Field(default=0, description="Number of engineered features used")
