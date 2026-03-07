# Backend Architecture - Dual Server Configuration

## Overview

The Smart Cement Platform uses a **dual backend architecture** with two separate FastAPI servers running simultaneously to handle different research components.

## Server Configuration

### Backend (Primary) - Port 8000

**Location**: `backend/`  
**Port**: `8000`  
**Components**:

- ✅ **Compressive Strength Predictor** (Hirumi)
- ✅ **Cement Strength Prediction**
- ✅ **Raw Meal Analysis** (Kanchana)
- ✅ **Crack Detection** (Sanchitha)

**Models Used**:

- TensorFlow/Keras models
- XGBoost & LightGBM models
- Traditional ML models

**Endpoints**:

- `http://127.0.0.1:8000/api/health`
- `http://127.0.0.1:8000/api/hirumi/*`
- `http://127.0.0.1:8000/api/kanchana/*`
- `http://127.0.0.1:8000/api/sanchitha/*`

### Backend1 (Secondary) - Port 8002

**Location**: `backend1/`  
**Port**: `8002`  
**Components**:

- ✅ **Cement Clinker Image Analyser** (Chamudini) - **YOLO11 Classifier**

**Models Used**:

- **YOLO11m-cls** (PyTorch/Ultralytics)
  - Clinker phase classification
  - 5 classes: C2S, C3A, C3S, C4AF, cement_clinker_models
  - Confidence threshold: 0.5
  - Image size: 224x224

**Endpoints**:

- `http://127.0.0.1:8002/api/health`
- `http://127.0.0.1:8002/api/chamudini/health`
- `http://127.0.0.1:8002/api/chamudini/classes`
- `http://127.0.0.1:8002/api/chamudini/model-info`
- `http://127.0.0.1:8002/api/chamudini/predict`
- `http://127.0.0.1:8002/api/chamudini/predict-batch`

## Why Two Backends?

### 📦 **Dependency Isolation**

- Backend (8000): Keras/TensorFlow + traditional ML libraries
- Backend1 (8002): PyTorch + Ultralytics YOLO11
- Prevents potential conflicts between TensorFlow and PyTorch

### ⚡ **Performance**

- Isolates YOLO11 workload from other models
- Better resource management
- Faster response times

### 🔧 **Maintainability**

- Easier to update one server without affecting the other
- Clearer separation of concerns
- Simplified debugging

## How to Run Both Servers

### Terminal 1 - Start Backend (Port 8000)

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Start Backend1 (Port 8002)

```bash
cd backend1
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8002
```

## Frontend Configuration

The React frontend automatically connects to the correct backend based on the component:

### Home Page Navigation

| Card Name                         | Component     | Backend URL                 |
| --------------------------------- | ------------- | --------------------------- |
| Compressive Strength Predictor    | Hirumi        | `http://127.0.0.1:8000`     |
| Cement Strength Prediction        | -             | `http://127.0.0.1:8000`     |
| Raw Meal Analysis                 | Kanchana      | `http://127.0.0.1:8000`     |
| **Cement Clinker Image Analyser** | **Chamudini** | **`http://127.0.0.1:8002`** |

### Frontend Files Updated

- `frontend/src/pages/ClinkerAnalyser.js`: Points to Backend1 (8002)
- All other components: Point to Backend (8000)

## API Testing

### Test Backend (Port 8000)

```powershell
# Health check
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/health"

# Hirumi info
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/hirumi/info"
```

### Test Backend1 (Port 8002)

```powershell
# Health check
Invoke-WebRequest -Uri "http://127.0.0.1:8002/api/health"

# Chamudini health
Invoke-WebRequest -Uri "http://127.0.0.1:8002/api/chamudini/health"

# Get clinker classes
Invoke-WebRequest -Uri "http://127.0.0.1:8002/api/chamudini/classes"

# Get model info
Invoke-WebRequest -Uri "http://127.0.0.1:8002/api/chamudini/model-info"
```

## Chamudini YOLO11 Model Details

### Model Specifications

- **Architecture**: YOLO11m-cls (medium variant, classification)
- **Framework**: PyTorch + Ultralytics
- **Input Size**: 224x224 pixels
- **Device**: CPU (can be configured for GPU)
- **Model File**: `backend1/ml_models/chamudini/clinker_yolo11_best.pt`

### Classification Classes

1. **C2S** - Dicalcium Silicate (Belite)
2. **C3A** - Tricalcium Aluminate
3. **C3S** - Tricalcium Silicate (Alite)
4. **C4AF** - Tetracalcium Aluminoferrite
5. **cement_clinker_models** - General clinker category

### Response Format

```json
{
  "success": true,
  "filename": "clinker_sample.jpg",
  "result": {
    "predicted_class": "C3S",
    "confidence": 0.89,
    "rejected": false,
    "top3": [
      { "class": "C3S", "confidence": 0.89 },
      { "class": "C2S", "confidence": 0.06 },
      { "class": "C3A", "confidence": 0.03 }
    ],
    "all_probabilities": {
      "C2S": 0.06,
      "C3A": 0.03,
      "C3S": 0.89,
      "C4AF": 0.01,
      "cement_clinker_models": 0.01
    }
  }
}
```

### Rejection Logic

- If **all class confidences** < 0.5 (50%), prediction is marked as `rejected: true`
- User receives warning: "⚠️ Low confidence - Image may not be a recognizable clinker phase"

## Troubleshooting

### Port Already in Use

If you get `[Errno 10048] error while attempting to bind`, kill the process using that port:

```powershell
# Find and kill process on port 8000
$proc = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess
if($proc) { Stop-Process -Id $proc -Force }

# Find and kill process on port 8002
$proc = Get-NetTCPConnection -LocalPort 8002 -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess
if($proc) { Stop-Process -Id $proc -Force }
```

### Router Not Loading

Check the server logs for:

- Model loading errors
- Import errors
- Pydantic schema validation warnings (non-critical)

### 404 Errors

- Verify the server is running: `Invoke-WebRequest -Uri "http://127.0.0.1:PORT/api/health"`
- Check the correct port is being used
- Ensure the router was loaded successfully (check startup logs for "✓ Chamudini router loaded")

## Status Summary

✅ **Backend (8000)**: Running - 3 components active  
✅ **Backend1 (8002)**: Running - Chamudini YOLO11 active  
✅ **Frontend (3000)**: Running - All 4 cards configured  
✅ **Models**: All loaded successfully

---

**Last Updated**: March 7, 2026  
**Configuration Version**: 2.0
