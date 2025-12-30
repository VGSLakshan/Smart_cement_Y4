from fastapi import APIRouter, HTTPException, status
from app.models.hirumi.hirumi_schemas import (
    CementDataInput,
    StrengthPrediction,
    PredictionResponse
)
from app.services.hirumi.model_service import get_model_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/hirumi",
    tags=["Hirumi - Cement Strength Prediction"]
)


@router.get("/info")
async def get_model_info():
    """Get information about the Hirumi cement strength prediction model"""
    return {
        "success": True,
        "model_name": "Hirumi Cement Strength Predictor",
        "model_type": "Ensemble (XGBoost + LightGBM)",
        "description": "Multi-output gradient boosting model for predicting cement compressive strength",
        "targets": ["1D", "2D", "7D", "28D", "56D"],
        "features": [
            "Initial grinding time",
            "Final grinding time",
            "Residue 45µm",
            "Fineness",
            "L.O.I.",
            "Chemical compositions (SiO2, Al2O3, Fe2O3, CaO, MgO, SO3, K2O, Na2O, Cl)"
        ],
        "feature_engineering": "Yes - 30+ engineered features including interactions, ratios, and transformations",
        "version": "1.0.0"
    }


@router.post("/predict", response_model=PredictionResponse)
async def predict_strength(input_data: CementDataInput):
    """
    Predict cement compressive strength for multiple time periods (1D, 2D, 7D, 28D, 56D)
    
    Takes cement composition and grinding parameters as input and returns predicted
    compressive strengths using an ensemble of XGBoost and LightGBM models.
    """
    try:
        # Get model service
        model_service = get_model_service()
        
        # Convert input to dict
        input_dict = input_data.model_dump()
        
        # Make predictions
        predictions = model_service.predict(input_dict)
        
        # Create response
        strength_prediction = StrengthPrediction(
            strength_1d=predictions['1D'],
            strength_2d=predictions['2D'],
            strength_7d=predictions['7D'],
            strength_28d=predictions['28D'],
            strength_56d=predictions['56D'],
            model_used="Ensemble (XGBoost + LightGBM)",
            confidence="High"
        )
        
        response = PredictionResponse(
            success=True,
            message="Prediction completed successfully",
            input_data=input_data,
            predictions=strength_prediction,
            engineered_features_count=len(model_service.feature_columns)
        )
        
        logger.info(f"Prediction successful: {predictions}")
        return response
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


@router.post("/batch-predict")
async def batch_predict(inputs: list[CementDataInput]):
    """
    Predict cement strength for multiple samples at once
    """
    try:
        model_service = get_model_service()
        
        results = []
        for input_data in inputs:
            input_dict = input_data.model_dump()
            predictions = model_service.predict(input_dict)
            
            results.append({
                "input": input_dict,
                "predictions": {
                    "1D": predictions['1D'],
                    "2D": predictions['2D'],
                    "7D": predictions['7D'],
                    "28D": predictions['28D'],
                    "56D": predictions['56D']
                }
            })
        
        return {
            "success": True,
            "message": f"Batch prediction completed for {len(results)} samples",
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction failed: {str(e)}"
        )


@router.get("/model-performance")
async def get_model_performance():
    """Get model performance metrics"""
    try:
        model_service = get_model_service()
        
        # Load performance metrics from config if available
        import json
        from pathlib import Path
        
        config_path = Path(__file__).parent.parent.parent.parent / 'ml_models' / 'hirumi' / 'model_config.json'
        
        if config_path.exists():
            with open(config_path, 'r') as f:
                config = json.load(f)
                performance_metrics = config.get('performance_metrics', [])
                
            return {
                "success": True,
                "metrics": performance_metrics,
                "message": "Performance metrics retrieved successfully"
            }
        else:
            return {
                "success": False,
                "message": "Performance metrics not available"
            }
            
    except Exception as e:
        logger.error(f"Error retrieving performance metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve performance metrics: {str(e)}"
        )
