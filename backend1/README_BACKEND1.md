# Backend1 - Cement Clinker Image Analyser API

This backend runs on **Port 8001** and serves the **Cement Clinker Image Analyser** component.

## Quick Start

### Windows (PowerShell)
```powershell
cd backend1
.\start-backend1.ps1
```

### Manual Start
```powershell
cd backend1
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## API Endpoints

- **Base URL**: `http://127.0.0.1:8001`
- **API Documentation**: `http://127.0.0.1:8001/docs`
- **Health Check**: `http://127.0.0.1:8001/api/health`

### Chamudini - Clinker Phase Classification
- `POST /api/chamudini/predict` - Predict clinker phase from image
- `GET /api/chamudini/health` - Check model health
- `GET /api/chamudini/classes` - Get supported classes
- `GET /api/chamudini/model-info` - Get model information

## Configuration

The configuration is in `app/config.py`:
- **Port**: 8001 (different from backend which uses 8000)
- **CORS**: Enabled for localhost:3000 and localhost:3001

## Components Served

### Cement Clinker Image Analyser
- **Frontend Component**: `frontend/src/pages/ClinkerAnalyser.js`
- **API Endpoint**: `/api/chamudini/predict`
- **Model Type**: YOLO11 Classification
- **Classes**: C2S, C3A, C3S, C4AF

## Notes

- Backend1 runs independently on port 8001
- Other components (Compressive Strength, Cement Strength Prediction, Raw Meal Analysis) use the main backend on port 8000
- Make sure both backends can run simultaneously
