# IMPORTANT: Model Files Required

This directory should contain the following files after training:

## Required Files:
1. xgb_1D.pkl - XGBoost model for 1-day strength prediction
2. xgb_2D.pkl - XGBoost model for 2-day strength prediction
3. xgb_7D.pkl - XGBoost model for 7-day strength prediction
4. xgb_28D.pkl - XGBoost model for 28-day strength prediction
5. xgb_56D.pkl - XGBoost model for 56-day strength prediction
6. lgb_1D.pkl - LightGBM model for 1-day strength prediction
7. lgb_2D.pkl - LightGBM model for 2-day strength prediction
8. lgb_7D.pkl - LightGBM model for 7-day strength prediction
9. lgb_28D.pkl - LightGBM model for 28-day strength prediction
10. lgb_56D.pkl - LightGBM model for 56-day strength prediction
11. model_config.json - Configuration file with feature names and ensemble weights

## How to Generate These Files:

1. Run the training script provided in the main directory
2. The script will train models and save them to a 'models/' directory
3. Copy all .pkl files and model_config.json to this directory

Example:
```bash
# After running the training script
cp models/*.pkl backend/ml_models/hirumi/
cp models/model_config.json backend/ml_models/hirumi/
```

## Model Config JSON Structure:
```json
{
  "feature_columns": ["Initial (min)", "Final (min)", ...],
  "target_columns": ["1D", "2D", "7D", "28D", "56D"],
  "ensemble_weights": {
    "1D": {"xgb": 0.52, "lgb": 0.48},
    "2D": {"xgb": 0.51, "lgb": 0.49},
    ...
  },
  "performance_metrics": [...]
}
```

## Note:
Without these files, the prediction API will not work. Make sure to train the models first using your dataset.
