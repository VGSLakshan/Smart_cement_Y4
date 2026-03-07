# 🗄️ Cement Clinker MongoDB Integration - Complete Guide

## ✅ What's Been Added

Your Cement Clinker Image Analyser now has **full MongoDB integration**! Here's what's new:

### New Features:

1. ✅ **Automatic Database Saving** - Every prediction is automatically saved to MongoDB
2. ✅ **Local Image Storage** - Images are saved in `strength-backend/uploads/clinker/`
3. ✅ **Image Path in Database** - Database stores the file path, not the image itself
4. ✅ **History Interface** - Beautiful UI to view all past predictions
5. ✅ **Statistics Dashboard** - See total predictions, average confidence, and class distribution
6. ✅ **Search & Filter** - Find predictions by sample name or class
7. ✅ **Export to CSV** - Download all your data
8. ✅ **Delete Records** - Remove unwanted predictions
9. ✅ **View Details** - Click to see full prediction details with image

---

## 📁 Files Created/Modified

### ✨ New Files Created:

#### Backend (strength-backend):

1. **`src/models/ClinkerPrediction.js`** - MongoDB schema for clinker predictions
2. **`src/routes/clinkerPredictions.js`** - API routes for CRUD operations

#### Frontend:

3. **`src/pages/ClinkerHistory.js`** - History viewing interface

### 🔧 Modified Files:

#### Backend (strength-backend):

1. **`src/server.js`** - Added clinker predictions route

#### Frontend:

2. **`src/pages/ClinkerAnalyser.js`** - Added auto-save to MongoDB after prediction
3. **`src/App.js`** - Added clinker history page route

---

## 🚀 How It Works

### The Complete Flow:

```
1. User uploads image in ClinkerAnalyser page
   ↓
2. Image sent to backend1 (port 9000) for YOLO11 prediction
   ↓
3. Backend1 returns prediction result (class, confidence, probabilities)
   ↓
4. Frontend automatically sends image + results to strength-backend (port 5000)
   ↓
5. Strength-backend saves image to uploads/clinker/ folder
   ↓
6. Strength-backend stores prediction data + image path in MongoDB
   ↓
7. User can view all history in "View History" page
```

### Database Schema:

```javascript
{
  sampleName: "Clinker-2026-03-07",
  imagePath: "/uploads/clinker/clinker-1234567890-123456789.jpg",
  originalFilename: "my-clinker-sample.jpg",
  predictedClass: "C3S",
  confidence: 0.89,
  rejected: false,
  top3Predictions: [
    { class: "C3S", confidence: 0.89 },
    { class: "C2S", confidence: 0.06 },
    { class: "C3A", confidence: 0.03 }
  ],
  allProbabilities: {
    "C2S": 0.06,
    "C3A": 0.03,
    "C3S": 0.89,
    "C4AF": 0.01,
    "cement_clinker_models": 0.01
  },
  phaseDescription: "Alite (Tricalcium Silicate) - Main contributor to early strength",
  createdAt: "2026-03-07T10:30:00.000Z"
}
```

---

## 🛠️ Setup Instructions

### Step 1: Make Sure MongoDB is Running

Your strength-backend already has MongoDB configured. Just make sure MongoDB is running:

```powershell
# Check if MongoDB is running
Get-Process mongod

# If not running, start MongoDB service
net start MongoDB
```

### Step 2: Verify strength-backend Configuration

Check your `.env` file in `strength-backend/`:

```env
# strength-backend/.env
MONGODB_URI=mongodb://localhost:27017/smart_cement
PORT=5000
```

### Step 3: Start strength-backend

```powershell
cd strength-backend
npm install  # Make sure multer is installed (already in package.json)
npm run dev  # Or npm start
```

**Expected Output:**

```
✅ MongoDB Connected: localhost
📊 Database: smart_cement
🚀 Server running on port 5000
```

### Step 4: Start backend1 (Clinker Analyser)

```powershell
cd backend1
uvicorn app.main:app --reload --port 9000
```

**Expected Output:**

```
✅ Chamudini YOLO11 model loaded
INFO:     Uvicorn running on http://127.0.0.1:9000
```

### Step 5: Start Frontend

```powershell
cd frontend
npm start
```

**Frontend opens at:** http://localhost:3000

---

## 🎯 How to Use

### 1. Analyze a Clinker Image

1. Go to **Dashboard** (Home page)
2. Click on **"Cement Clinker Image Analyser"** card
3. Upload an image (drag & drop or click)
4. Click **"Analyze Image"**
5. Wait for prediction results
6. **Automatically saved!** You'll see: "✓ Saved to database successfully"

### 2. View History

**Option 1:** Click the **"View History"** button (top right of Clinker Analyser page)

**Option 2:** Navigate manually:

- From App.js, the route is `clinker-history`

### 3. In the History Page:

#### 📊 Statistics Dashboard (Top)

- **Total Predictions** - How many analyses you've done
- **Average Confidence** - Overall model confidence
- **Rejected Count** - Low confidence predictions
- **Most Common Class** - Which phase appears most often

#### 🔍 Search & Filter

- **Search Box** - Type sample name or class (e.g., "C3S", "Clinker-2026")
- **Filter Dropdown** - Filter by specific class (C2S, C3A, C3S, C4AF)

#### 📋 Predictions Table

Shows all predictions with:

- Thumbnail image
- Sample name & original filename
- Predicted class (color-coded)
- Confidence bar
- Status (Confident / Low Confidence)
- Date & time
- Actions (View Details, Delete)

#### 👁️ View Details

Click the **eye icon** to see:

- Full-size image
- Complete prediction details
- All phase probabilities with progress bars
- Top 3 predictions
- Phase description

#### 🗑️ Delete

Click the **trash icon** to delete a prediction (both database record and image file)

#### 📥 Export CSV

Click **"Export CSV"** button to download all data as CSV file

---

## 🌐 API Endpoints

Your strength-backend now has these new endpoints:

### 1. Save Clinker Prediction

```http
POST http://localhost:5000/api/clinker-predictions
Content-Type: multipart/form-data

Body:
- image: (file)
- sampleName: "Clinker-2026-03-07"
- predictedClass: "C3S"
- confidence: 0.89
- rejected: false
- top3Predictions: JSON string
- allProbabilities: JSON string
- phaseDescription: "Alite..."
```

### 2. Get All Predictions

```http
GET http://localhost:5000/api/clinker-predictions?limit=50&sortBy=createdAt&order=desc
```

### 3. Get Single Prediction

```http
GET http://localhost:5000/api/clinker-predictions/:id
```

### 4. Delete Prediction

```http
DELETE http://localhost:5000/api/clinker-predictions/:id
```

### 5. Get Statistics

```http
GET http://localhost:5000/api/clinker-predictions/statistics/summary
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 42,
    "classDistribution": [
      { "_id": "C3S", "count": 18, "avgConfidence": 0.87 },
      { "_id": "C2S", "count": 12, "avgConfidence": 0.82 }
    ],
    "rejectedCount": 3,
    "rejectedPercentage": 7.14,
    "overallAvgConfidence": 0.85
  }
}
```

---

## 📂 File Storage

Images are saved in:

```
strength-backend/
└── uploads/
    └── clinker/
        ├── clinker-1234567890-123456789.jpg
        ├── clinker-1234567891-987654321.png
        └── ...
```

- **Filename Format:** `clinker-<timestamp>-<random>.<ext>`
- **Max Size:** 10MB per image
- **Allowed Types:** JPG, JPEG, PNG, TIFF, BMP
- **Served via:** `http://localhost:5000/uploads/clinker/<filename>`

---

## 🎨 UI Features

### ClinkerAnalyser Page (Updated):

- ✅ **"View History" Button** - Top right corner (blue button)
- ✅ **Save Status Indicator** - Shows "Saving to database..." → "✓ Saved to database successfully"
- ✅ Color-coded status messages (green for success, yellow for warning, blue for loading)

### ClinkerHistory Page (New):

- ✅ **Statistics Cards** - Visual dashboard with icons
- ✅ **Search Bar** - Real-time search
- ✅ **Filter Dropdown** - Filter by class
- ✅ **Results Counter** - "Showing X of Y predictions"
- ✅ **Responsive Table** - Works on all screen sizes
- ✅ **Color-Coded Classes** - Each phase has its own color
- ✅ **Confidence Bars** - Visual representation
- ✅ **Action Buttons** - View details & delete with icons
- ✅ **Detail Modal** - Full-screen popup with all info
- ✅ **Export CSV** - Download button (green)
- ✅ **Empty State** - Nice message when no data

---

## 🔧 Configuration

### Backend URLs:

```javascript
// frontend/src/pages/ClinkerAnalyser.js
const BACKEND_URL = "http://127.0.0.1:9000"; // backend1 (YOLO11 prediction)
const STRENGTH_BACKEND_URL = "http://localhost:5000"; // strength-backend (MongoDB)

// frontend/src/pages/ClinkerHistory.js
const STRENGTH_BACKEND_URL = "http://localhost:5000"; // strength-backend
```

### MongoDB Collection:

- **Database:** smart_cement
- **Collection:** clinkerpredictions

---

## 🚨 Troubleshooting

### Issue 1: "Failed to save to database"

**Check:**

1. Is strength-backend running on port 5000?

   ```powershell
   # In strength-backend terminal, you should see:
   🚀 Server running on port 5000
   ```

2. Is MongoDB connected?

   ```powershell
   # Look for:
   ✅ MongoDB Connected: localhost
   ```

3. Test the endpoint manually:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:5000/api/clinker-predictions" -Method GET
   ```

### Issue 2: Images not displaying in history

**Check:**

1. uploads folder exists:

   ```powershell
   Test-Path "strength-backend\uploads\clinker"
   # Should return: True
   ```

2. Images are being saved:

   ```powershell
   Get-ChildItem "strength-backend\uploads\clinker"
   ```

3. CORS is enabled in strength-backend (already configured):
   ```javascript
   // src/server.js
   app.use(cors());
   app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
   ```

### Issue 3: "Prediction not found" or 404 errors

**Check:**

1. MongoDB connection string in `.env`:

   ```env
   MONGODB_URI=mongodb://localhost:27017/smart_cement
   ```

2. Collection name is correct (should be auto-created)

3. Restart strength-backend after any changes

### Issue 4: History page is empty

**Cause:** No predictions saved yet

**Solution:**

1. Go to Clinker Analyser page
2. Upload and analyze an image
3. Wait for "✓ Saved to database successfully"
4. Click "View History" - you should see your prediction

---

## 📊 Sample Data for Testing

If you want to test with sample data, you can use MongoDB Compass or mongosh:

```javascript
// Connect to MongoDB
use smart_cement

// Insert test data
db.clinkerpredictions.insertOne({
  sampleName: "Test Clinker Sample",
  imagePath: "/uploads/clinker/test-image.jpg",
  originalFilename: "test.jpg",
  predictedClass: "C3S",
  confidence: 0.89,
  rejected: false,
  top3Predictions: [
    { class: "C3S", confidence: 0.89 },
    { class: "C2S", confidence: 0.06 },
    { class: "C3A", confidence: 0.03 }
  ],
  allProbabilities: {
    C2S: 0.06,
    C3A: 0.03,
    C3S: 0.89,
    C4AF: 0.01,
    cement_clinker_models: 0.01
  },
  phaseDescription: "Alite (Tricalcium Silicate) - Main contributor to early strength",
  createdAt: new Date()
})

// Verify
db.clinkerpredictions.find()
```

---

## ✅ Testing Checklist

- [ ] strength-backend running on port 5000
- [ ] backend1 running on port 9000
- [ ] Frontend running on port 3000
- [ ] MongoDB connected
- [ ] Upload an image in Clinker Analyser
- [ ] See "✓ Saved to database successfully"
- [ ] Click "View History" button
- [ ] See the prediction in the table
- [ ] Click eye icon to view details
- [ ] Try search functionality
- [ ] Try filter by class
- [ ] Export CSV
- [ ] Delete a prediction
- [ ] Verify statistics cards update

---

## 🎉 Success Criteria

You'll know everything is working when:

1. ✅ You upload an image → Get prediction
2. ✅ You see: "✓ Saved to database successfully"
3. ✅ Click "View History" → See your prediction with thumbnail
4. ✅ Statistics show correct numbers
5. ✅ Search and filter work
6. ✅ Can view full details
7. ✅ Can delete predictions
8. ✅ CSV export works

---

## 📝 Quick Start Commands

```powershell
# Terminal 1 - MongoDB (if not running as service)
mongod

# Terminal 2 - strength-backend
cd strength-backend
npm run dev

# Terminal 3 - backend1
cd backend1
uvicorn app.main:app --reload --port 9000

# Terminal 4 - frontend
cd frontend
npm start
```

**All services ready!** 🚀

---

## 🌟 Additional Features in History Page

### Statistics Dashboard:

- **Total Predictions** - Track your analysis volume
- **Average Confidence** - Monitor model reliability
- **Rejected Predictions** - See low-confidence results
- **Most Common Class** - Identify trends

### Data Management:

- **Search** - Find specific predictions quickly
- **Filter** - View specific clinker phases
- **Sort** - By date (newest first by default)
- **Export** - Download all data as CSV
- **Delete** - Clean up unwanted records

### Visual Features:

- **Color-coded phases** - Easy identification
- **Confidence bars** - Visual confidence levels
- **Image thumbnails** - Quick preview
- **Status badges** - Confident vs Low Confidence
- **Responsive design** - Works on all screens

---

## 🔒 Important Notes

1. **No Changes to backend or backend1** - As requested, only strength-backend and frontend were modified
2. **Images stored locally** - Not in MongoDB, only path is stored
3. **Automatic saving** - No extra clicks needed after analysis
4. **MongoDB required** - Make sure MongoDB service is running
5. **Port 5000** - strength-backend must be on port 5000
6. **Port 9000** - backend1 must be on port 9000

---

## 📞 Need Help?

Check these in order:

1. All 3 servers running? (strength-backend, backend1, frontend)
2. MongoDB connected? (check terminal logs)
3. Correct ports? (5000, 9000, 3000)
4. Console errors? (F12 in browser)
5. Network errors? (check browser Network tab)

---

**Status:** ✅ **COMPLETE - Ready to Use!**

Your Cement Clinker Image Analyser now has full MongoDB integration with a beautiful history interface! 🎉

---

**Date:** March 7, 2026  
**Version:** 2.0 - MongoDB Integration Release
