# Hirumi - Cement Strength Prediction Module

## Overview
This module implements a multi-output ensemble machine learning model for predicting cement compressive strength at multiple time intervals (1D, 2D, 7D, 28D, and 56D) using XGBoost and LightGBM algorithms.

## Features
- **Multi-Output Predictions**: Predicts strength at 5 different time intervals
- **Ensemble Learning**: Combines XGBoost and LightGBM for improved accuracy
- **Advanced Feature Engineering**: 30+ engineered features including:
  - Chemical composition interactions
  - Ratio features
  - Polynomial transformations
  - Logarithmic transformations
- **RESTful API**: FastAPI-based backend for easy integration
- **Interactive Frontend**: React-based UI with real-time predictions

## Model Training

### Prerequisites
```bash
pip install pandas numpy xgboost lightgbm scikit-learn matplotlib seaborn openpyxl
```

### Training Steps
1. Place your `combined_dataset.xlsx` in the project root
2. Run the training script:
```bash
python train_model.py
```

3. The script will:
   - Load and preprocess data
   - Apply feature engineering
   - Train XGBoost and LightGBM models
   - Create ensemble predictions
   - Save models and configuration
   - Generate performance visualizations

### Output Files
After training, you'll get:
- `models/xgb_1D.pkl`, `models/xgb_2D.pkl`, etc. - XGBoost models
- `models/lgb_1D.pkl`, `models/lgb_2D.pkl`, etc. - LightGBM models
- `models/model_config.json` - Model configuration and weights
- Various PNG files showing model performance

## Installation

### Backend Setup
1. Navigate to the backend directory:
```bash
cd backend
```

2. Copy the trained models to the hirumi folder:
```bash
# Copy all .pkl files from your training directory
cp /path/to/models/*.pkl ml_models/hirumi/
cp /path/to/models/model_config.json ml_models/hirumi/
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Start the backend server:
```bash
cd app
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Get Model Info
```
GET /api/hirumi/info
```
Returns information about the model, features, and capabilities.

### Make Prediction
```
POST /api/hirumi/predict
```
Request body:
```json
{
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
```

Response:
```json
{
  "success": true,
  "message": "Prediction completed successfully",
  "predictions": {
    "strength_1d": 25.4,
    "strength_2d": 32.1,
    "strength_7d": 45.8,
    "strength_28d": 58.3,
    "strength_56d": 62.7,
    "model_used": "Ensemble (XGBoost + LightGBM)",
    "confidence": "High"
  }
}
```

### Batch Prediction
```
POST /api/hirumi/batch-predict
```
Send an array of input objects to get predictions for multiple samples.

### Model Performance
```
GET /api/hirumi/model-performance
```
Returns training performance metrics (R², RMSE, MAE) for all targets.

## Input Features

### Grinding Parameters
- `initial_min`: Initial grinding time (minutes)
- `final_min`: Final grinding time (minutes)
- `residue_45um`: Residue at 45µm (%)
- `fineness`: Fineness (cm²/g)
- `loi`: Loss on Ignition

### Chemical Composition (%)
- `sio2`: Silicon Dioxide (SiO₂)
- `al2o3`: Aluminum Oxide (Al₂O₃)
- `fe2o3`: Iron Oxide (Fe₂O₃)
- `cao`: Calcium Oxide (CaO)
- `mgo`: Magnesium Oxide (MgO)
- `so3`: Sulfur Trioxide (SO₃)
- `k2o`: Potassium Oxide (K₂O)
- `na2o`: Sodium Oxide (Na₂O)
- `cl`: Chloride (Cl)

## Model Architecture

### Feature Engineering
The model applies comprehensive feature engineering:

1. **Interaction Features**: CaO×SiO₂, CaO×Al₂O₃, etc.
2. **Ratio Features**: CaO/SiO₂, Al₂O₃/Fe₂O₃, etc.
3. **Aggregate Features**: Total Oxides, Total Alkalis, etc.
4. **Time-based Features**: Grinding Duration, Grinding Intensity
5. **Polynomial Features**: Squared terms for key variables
6. **Transformations**: Cube root and logarithmic transformations

### Ensemble Strategy
- Weighted average of XGBoost and LightGBM predictions
- Weights determined by R² scores on validation set
- Individual models for each target output

## Testing

Run backend tests:
```bash
cd backend
pytest app/tests/hirumi/test_hirumi.py -v
```

## Project Structure
```
backend/
├── app/
│   ├── models/
│   │   └── hirumi/
│   │       └── hirumi_schemas.py
│   ├── routes/
│   │   └── hirumi/
│   │       └── hirumi.py
│   ├── services/
│   │   └── hirumi/
│   │       ├── __init__.py
│   │       └── model_service.py
│   └── tests/
│       └── hirumi/
│           └── test_hirumi.py
└── ml_models/
    └── hirumi/
        ├── xgb_*.pkl
        ├── lgb_*.pkl
        └── model_config.json

frontend/
└── src/
    └── pages/
        └── CementStrengthDetail.js
```

## Performance Metrics
Expected performance (based on training):
- Average R² Score: > 0.95
- Average RMSE: < 3.0 MPa
- Average MAE: < 2.0 MPa

## Troubleshooting

### Models not loading
- Ensure all `.pkl` files are in `backend/ml_models/hirumi/`
- Check that `model_config.json` exists with correct structure
- Verify file permissions

### CORS errors
- Check that backend allows frontend origin
- Ensure backend is running on port 8000
- Verify frontend API URL matches backend address

### Prediction errors
- Validate all input fields are numeric
- Ensure no required fields are missing
- Check backend logs for detailed error messages

## Credits
Developed by Hirumi as part of Smart Cement Y4 Project

## License
MIT License
