# 🚀 Quick Start Guide - Cement Clinker Image Analyser

## ✅ Current Status

Your **Cement Clinker Image Analyser** is now **fully integrated and working**!

### What's Been Completed

1. ✅ **Frontend Card Added**: "Cement Clinker Image Analyser" card appears on the home page
2. ✅ **Image Upload Page Created**: Full-featured upload interface with drag-and-drop
3. ✅ **Backend1 Server Configured**: Running on port 8002 (separate from main backend on 8000) 
4. ✅ **YOLO11 Model Loaded**: Clinker phase classification model ready
5. ✅ **API Integration Complete**: Frontend successfully connects to Backend1
6. ✅ **All Endpoints Tested**: Health, classes, model-info, predict endpoints working

---

## 🏃 How to Start Everything

### Step 1: Start Backend1 (Port 8002) - Clinker Analyser
```powershell
cd backend1
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8002
```

**Expected Output**:
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
✅ Chamudini YOLO11 model loaded
   Classes : ['C2S', 'C3A', 'C3S', 'C4AF', 'cement_clinker_models']
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8002
```

### Step 2: Start Backend (Port 8000) - Other Components
*In a new terminal:*
```powershell
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 3: Start Frontend
*In a new terminal:*
```powershell
cd frontend
npm start
```

**Frontend will open at**: http://localhost:3000

---

## 🎯 How to Use the Cement Clinker Image Analyser

### 1. Navigate to the Analyser
- Open frontend: http://localhost:3000
- Click on **"Cement Clinker Image Analyser"** card
- You'll see the upload interface

### 2. Upload an Image
**Method 1: Drag & Drop**
- Drag a clinker microscopy image into the upload area
- Image will preview automatically

**Method 2: Click to Upload**
- Click on the upload area
- Select an image file (JPG, PNG, JPEG)

**Supported Images**:
- Clinker microscopy images
- C2S, C3A, C3S, C4AF phases
- Recommended: Clear, well-lit microscopy images

### 3. Analyze
- Click **"Analyze Image"** button
- Wait for processing (1-2 seconds)
- View results below

### 4. Interpret Results

**Prediction Card** shows:
- **Predicted Class**: C2S, C3A, C3S, C4AF, or cement_clinker_models
- **Confidence**: Percentage (0-100%)
- **Rejection Warning**: If confidence < 50% on all classes

**Top 3 Predictions** shows:
- The 3 most likely classes with confidence scores
- Helps understand alternative classifications

**All Probabilities** shows:
- Complete breakdown across all 5 classes
- Useful for borderline cases

### Example Result:
```
✓ Predicted Class: C3S
  Confidence: 89%

Top 3 Predictions:
1. C3S - 89%
2. C2S - 6%  
3. C3A - 3%

All Probabilities:
C2S: 6%
C3A: 3%
C3S: 89% ✓
C4AF: 1%
cement_clinker_models: 1%
```

---

## 🧪 Testing the Setup

### Quick Health Check
```powershell
# Test Backend1 (Clinker Analyser)
Invoke-WebRequest -Uri "http://127.0.0.1:8002/api/chamudini/health"

# Should return:
# {"status":"healthy","model":"yolo11m-cls","loaded":true}
```

### Test Model Info
```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8002/api/chamudini/model-info"

# Returns full model configuration
```

### Test Classes
```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8002/api/chamudini/classes"

# Returns:
# {"class_names":["C2S","C3A","C3S","C4AF","cement_clinker_models"],"num_classes":5}
```

---

## ⚙️ Configuration Summary

| Component | Location | Port | Status |
|-----------|----------|------|--------|
| **Backend1** (Clinker) | `backend1/` | 8002 | ✅ Running |
| **Backend** (Others) | `backend/` | 8000 | ⚠️ Configure separately |
| **Frontend** | `frontend/` | 3000 | ⚠️ Start with `npm start` |

### Key Files Modified
- ✅ `frontend/src/pages/Home.js` - Added Cement Clinker card
- ✅ `frontend/src/pages/ClinkerAnalyser.js` - Created upload page (Backend URL: 8002)
- ✅ `frontend/src/App.js` - Added routing for "clincker-analyser"
- ✅ `backend1/app/config.py` - Set PORT = 8002
- ✅ `backend1/app/main.py` - Loaded chamudini router

---

## 🔍 Understanding the Clinker Classes

### C3S (Tricalcium Silicate - Alite)
- **Most abundant phase** in Portland cement
- Responsible for **early strength** (first 28 days)
- Typically 50-70% of clinker

### C2S (Dicalcium Silicate - Belite)
- Contributes to **long-term strength** (after 28 days)
- Typically 15-30% of clinker

### C3A (Tricalcium Aluminate)
- **Most reactive** phase
- Affects setting time and early strength
- Typically 5-10% of clinker

### C4AF (Tetracalcium Aluminoferrite)
- Flux phase
- Affects clinker color
- Typically 5-15% of clinker

---

## 🐛 Troubleshooting

### Issue: Backend1 won't start - Port 8002 in use
**Solution**:
```powershell
# Kill process on port 8002
Get-NetTCPConnection -LocalPort 8002 -ErrorAction SilentlyContinue | ForEach-Object { 
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
}
```

### Issue: 404 Error when uploading image
**Check**:
1. Is Backend1 running on port 8002?
   ```powershell
   Invoke-WebRequest -Uri "http://127.0.0.1:8002/api/health"
   ```
2. Check `ClinkerAnalyser.js` has correct URL:
   ```javascript
   const BACKEND_URL = "http://127.0.0.1:8002";
   ```

### Issue: Model not loading
**Check startup logs** for:
- `✅ Chamudini YOLO11 model loaded`
- Model file exists: `backend1/ml_models/chamudini/clinker_yolo11_best.pt`

### Issue: Low confidence / Rejected predictions
**Reasons**:
- Image is not a clinker microscopy image
- Image quality is poor
- Lighting/focus issues
- Image doesn't match trained classes

**Solutions**:
- Use high-quality microscopy images
- Ensure proper lighting
- Verify image shows clinker phases clearly

---

## 📚 API Reference

### Base URL
```
http://127.0.0.1:8002/api/chamudini
```

### Endpoints

#### 1. Health Check
```http
GET /api/chamudini/health
```
Response:
```json
{
  "status": "healthy",
  "model": "yolo11m-cls",
  "loaded": true
}
```

#### 2. Get Classes
```http
GET /api/chamudini/classes
```
Response:
```json
{
  "class_names": ["C2S", "C3A", "C3S", "C4AF", "cement_clinker_models"],
  "num_classes": 5
}
```

#### 3. Get Model Info
```http
GET /api/chamudini/model-info
```
Response:
```json
{
  "model_name": "clinker_yolo11",
  "model_variant": "yolo11m-cls",
  "framework": "PyTorch / Ultralytics YOLO11",
  "num_classes": 5,
  "class_names": ["C2S", "C3A", "C3S", "C4AF", "cement_clinker_models"],
  "img_size": 224,
  "reject_threshold": 0.5,
  "status": "loaded"
}
```

#### 4. Predict Single Image
```http
POST /api/chamudini/predict
Content-Type: multipart/form-data

Parameters:
- file: image file (JPG/PNG/JPEG)
```

Response:
```json
{
  "success": true,
  "filename": "clinker.jpg",
  "result": {
    "predicted_class": "C3S",
    "confidence": 0.89,
    "rejected": false,
    "top3": [
      {"class": "C3S", "confidence": 0.89},
      {"class": "C2S", "confidence": 0.06},
      {"class": "C3A", "confidence": 0.03}
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

#### 5. Batch Predict (Multiple Images)
```http
POST /api/chamudini/predict-batch
Content-Type: multipart/form-data

Parameters:
- files: multiple image files
```

---

## ✨ What's Next?

Your Cement Clinker Image Analyser is ready to use! 

### Future Enhancements (Optional)
- 📊 Add prediction history storage
- 📈 Add batch analysis results export
- 🔍 Add region-of-interest selection
- 🎯 Add confidence threshold adjustment
- 📷 Add webcam/live capture support

---

**Setup Complete** ✅  
**Status**: All systems operational  
**Date**: March 7, 2026

For questions or issues, refer to:
- `BACKEND_ARCHITECTURE.md` - Detailed backend configuration
- `PROJECT_DOCUMENTATION.md` - Full project documentation
- `INTEGRATION_GUIDE.md` - Integration details
