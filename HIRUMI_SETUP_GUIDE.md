# 🏗️ Hirumi Cement Strength Prediction - Complete Setup Guide

## ✅ What Has Been Created

### Backend Structure (Python/FastAPI)
```
backend/
├── app/
│   ├── models/
│   │   └── hirumi/
│   │       └── hirumi_schemas.py          ✅ Pydantic schemas for API
│   ├── routes/
│   │   └── hirumi/
│   │       └── hirumi.py                  ✅ API endpoints
│   ├── services/
│   │   └── hirumi/
│   │       ├── __init__.py
│   │       └── model_service.py           ✅ ML model service
│   ├── tests/
│   │   └── hirumi/
│   │       └── test_hirumi.py             ✅ Unit tests
│   └── main.py                            ✅ Updated with hirumi router
└── ml_models/
    └── hirumi/
        ├── README.md                       ✅ Documentation
        └── SETUP.md                        ✅ Setup instructions
```

### Frontend Structure (React)
```
frontend/
└── src/
    ├── App.js                              ✅ Updated with routing
    ├── components/
    │   └── Sidebar.js                      ✅ Updated with navigation
    ├── pages/
    │   ├── Home.js                         ✅ Updated with new card
    │   └── CementStrengthDetail.js         ✅ Full prediction UI
```

## 🎯 Features Implemented

### 1. **Backend API Endpoints**
- ✅ `GET /api/hirumi/info` - Model information
- ✅ `POST /api/hirumi/predict` - Single prediction
- ✅ `POST /api/hirumi/batch-predict` - Batch predictions
- ✅ `GET /api/hirumi/model-performance` - Performance metrics

### 2. **Frontend Features**
- ✅ Beautiful gradient UI design
- ✅ Input form with 14 parameters (grinding + chemical composition)
- ✅ Sample data loader
- ✅ Real-time predictions display
- ✅ Visual strength progression chart
- ✅ 5 strength predictions (1D, 2D, 7D, 28D, 56D)
- ✅ Responsive design

### 3. **Machine Learning Features**
- ✅ Advanced feature engineering (30+ features)
- ✅ Ensemble learning (XGBoost + LightGBM)
- ✅ Multi-output prediction
- ✅ Weighted ensemble based on R² scores

## 📦 Required Packages

### Backend (requirements.txt updated)
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
tensorflow>=2.15.0
numpy>=2.1.0
pillow>=10.3.0
xgboost>=2.0.0
lightgbm>=4.0.0
scikit-learn>=1.3.0
pandas>=2.0.0
pydantic==2.5.0
pytest==7.4.3
```

### Frontend
```
react
react-dom
react-scripts
```

## 🚀 How to Run

### Step 1: Train the Models (One-time setup)

1. **Create the training script** (save as `train_hirumi_model.py`):
   - Use the Python code you provided for training
   - Make sure to update the model saving path to save to a `models/` folder

2. **Run the training**:
```bash
# Install training dependencies
pip install pandas numpy xgboost lightgbm scikit-learn matplotlib seaborn openpyxl

# Run training
python train_hirumi_model.py
```

3. **Copy model files to backend**:
```bash
# Copy all model files
cp models/*.pkl backend/ml_models/hirumi/
cp models/model_config.json backend/ml_models/hirumi/
```

### Step 2: Start Backend

```bash
cd backend
pip install -r requirements.txt
cd app
python main.py
```

Backend will run on: **http://localhost:8000**

### Step 3: Start Frontend

```bash
cd frontend
npm install
npm start
```

Frontend will run on: **http://localhost:3000**

## 📝 Usage Example

### Using the Web Interface:
1. Open http://localhost:3000
2. Click on "Cement Strength Prediction (Multi-Output)" card
3. Click "Load Sample Data" or enter your own values
4. Click "🚀 Predict Strength"
5. View results with visual charts

### Using the API:
```bash
curl -X POST "http://localhost:8000/api/hirumi/predict" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

## 🧪 Testing

Run the test suite:
```bash
cd backend
pytest app/tests/hirumi/test_hirumi.py -v
```

## 📊 Input Parameters

### Grinding Parameters:
- **initial_min**: Initial grinding time (minutes)
- **final_min**: Final grinding time (minutes)
- **residue_45um**: Residue at 45µm (%)
- **fineness**: Fineness (cm²/g)
- **loi**: Loss on Ignition

### Chemical Composition (%):
- **sio2**: Silicon Dioxide (SiO₂)
- **al2o3**: Aluminum Oxide (Al₂O₃)
- **fe2o3**: Iron Oxide (Fe₂O₃)
- **cao**: Calcium Oxide (CaO)
- **mgo**: Magnesium Oxide (MgO)
- **so3**: Sulfur Trioxide (SO₃)
- **k2o**: Potassium Oxide (K₂O)
- **na2o**: Sodium Oxide (Na₂O)
- **cl**: Chloride (Cl)

## 📈 Output Predictions

The model predicts compressive strength (MPa) at:
- **1D**: 1-day strength
- **2D**: 2-day strength
- **7D**: 7-day strength
- **28D**: 28-day strength (standard)
- **56D**: 56-day strength

## 🎨 UI Features

- **Purple Gradient Theme**: Beautiful gradient background
- **Responsive Design**: Works on desktop and mobile
- **Interactive Charts**: Visual strength progression bars
- **Sample Data**: Quick test with pre-filled values
- **Real-time Validation**: Input validation and error handling
- **Loading States**: Visual feedback during predictions

## 🔧 Troubleshooting

### Backend Issues:

**Problem**: Models not loading
```bash
# Solution: Make sure model files exist
ls backend/ml_models/hirumi/
# Should show: xgb_*.pkl, lgb_*.pkl, model_config.json
```

**Problem**: Import errors
```bash
# Solution: Reinstall dependencies
pip install -r backend/requirements.txt
```

### Frontend Issues:

**Problem**: CORS errors
```bash
# Solution: Check backend CORS settings in main.py
# Should allow origins=["*"] for development
```

**Problem**: API connection failed
```bash
# Solution: Verify backend is running on port 8000
curl http://localhost:8000/api/hirumi/info
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## 🏆 Expected Performance

Based on training with feature engineering:
- **Average R² Score**: > 0.95
- **Average RMSE**: < 3.0 MPa
- **Average MAE**: < 2.0 MPa

## 🔐 Security Notes

For production deployment:
1. Update CORS settings to specific origins
2. Add authentication/authorization
3. Use environment variables for sensitive data
4. Enable HTTPS
5. Add rate limiting

## 📞 Support

For issues or questions:
1. Check the README files in each folder
2. Review the API documentation
3. Check the test files for usage examples
4. Review backend logs for errors

## 🎉 Success Checklist

- ✅ Backend folder structure created
- ✅ Frontend folder structure created
- ✅ API endpoints implemented
- ✅ Model service with feature engineering
- ✅ Pydantic schemas for validation
- ✅ Beautiful React UI
- ✅ Navigation and routing
- ✅ Tests created
- ✅ Documentation written
- ✅ Dependencies updated

## 🚀 Next Steps

1. **Train your models** using your dataset
2. **Copy model files** to `backend/ml_models/hirumi/`
3. **Start backend** and verify endpoints work
4. **Start frontend** and test the UI
5. **Deploy** to production when ready

---

**Developed by Hirumi for Smart Cement Y4 Project** 🏗️
