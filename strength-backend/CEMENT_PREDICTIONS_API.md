# Cement Strength Predictions API

Complete guide for storing cement strength prediction data in MongoDB.

## 📋 Overview

This API stores predictions from Hirumi's cement strength prediction model including:
- Input parameters (grinding properties + chemical composition)
- Predicted strengths (1D, 2D, 7D, 28D,56D)
- Metadata and timestamps

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd strength-backend
npm install
```

### 2. Setup MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB on your system
# Start MongoDB service
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `.env` file with your connection string

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env file
MONGODB_URI=mongodb://localhost:27017/smart_cement_db
PORT=5000
```

### 4. Start the Server

```bash
npm start
```

Server will run on `http://localhost:5000`

## 📊 Database Schema

### CementStrengthPrediction Collection

```javascript
{
  inputParameters: {
    grinding: {
      initial_min: Number,      // Initial grinding time (minutes)
      final_min: Number,        // Final grinding time (minutes)
      residue_45um: Number,     // Residue 45µm (%)
      fineness: Number,         // Fineness (cm²/g)
      loi: Number              // Loss on Ignition
    },
    chemicalComposition: {
      sio2: Number,            // Silicon Dioxide (%)
      al2o3: Number,           // Aluminum Oxide (%)
      fe2o3: Number,           // Iron Oxide (%)
      cao: Number,             // Calcium Oxide (%)
      mgo: Number,             // Magnesium Oxide (%)
      so3: Number,             // Sulfur Trioxide (%)
      k2o: Number,             // Potassium Oxide (%)
      na2o: Number,            // Sodium Oxide (%)
      cl: Number               // Chlorine (%)
    }
  },
  predictions: {
    strength_1d: Number,       // 1-day strength (MPa)
    strength_2d: Number,       // 2-day strength (MPa)
    strength_7d: Number,       // 7-day strength (MPa)
    strength_28d: Number,      // 28-day strength (MPa)
    strength_56d: Number       // 56-day strength (MPa)
  },
  modelInfo: {
    modelUsed: String,         // "Ensemble (XGBoost + LightGBM)"
    confidence: String,        // "High", "Medium", "Low"
    engineeredFeaturesCount: Number
  },
  userInfo: {
    userId: String,            // (Optional)
    sessionId: String,         // (Optional)
    userName: String           // (Optional)
  },
  notes: String,               // Optional notes
  tags: [String],             // Optional tags
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-generated
}
```

## 🔌 API Endpoints

### Base URL
```
http://localhost:5000/api/cement-predictions
```

### 1. Save New Prediction

```http
POST /api/cement-predictions
```

**Request Body:**
```json
{
  "inputParameters": {
    "grinding": {
      "initial_min": 160,
      "final_min": 200,
      "residue_45um": 3.2,
      "fineness": 3790,
      "loi": 4.37
    },
    "chemicalComposition": {
      "sio2": 30.05,
      "al2o3": 10.45,
      "fe2o3": 4.84,
      "cao": 45.88,
      "mgo": 1.5,
      "so3": 2.02,
      "k2o": 0.53,
      "na2o": 0.31,
      "cl": 0.025
    }
  },
  "predictions": {
    "strength_1d": 15.2,
    "strength_2d": 22.4,
    "strength_7d": 35.6,
    "strength_28d": 48.3,
    "strength_56d": 52.1
  },
  "modelInfo": {
    "modelUsed": "Ensemble (XGBoost + LightGBM)",
    "confidence": "High",
    "engineeredFeaturesCount": 30
  }
}
```

### 2. Get All Predictions

```http
GET /api/cement-predictions?page=1&limit=50&sortBy=createdAt&order=desc
```

### 3. Get Single Prediction

```http
GET /api/cement-predictions/:id
```

### 4. Get Recent Predictions

```http
GET /api/cement-predictions/recent/7?limit=50
```

### 5. Get Statistics

```http
GET /api/cement-predictions/statistics/summary
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "totalPredictions": 150,
    "average28dStrength": 45.6,
    "average56dStrength": 50.2,
    "max28dStrength": 65.3,
    "min28dStrength": 22.1,
    "recentPredictions7Days": 12
  }
}
```

### 6. Search Predictions

```http
POST /api/cement-predictions/search
```

**Request Body:**
```json
{
  "minStrength28d": 40,
  "maxStrength28d": 60,
  "minFineness": 3500,
  "maxFineness": 4000,
  "startDate": "2026-02-01",
  "endDate": "2026-03-01",
  "limit": 50
}
```

### 7. Update Prediction

```http
PUT /api/cement-predictions/:id
```

**Request Body:**
```json
{
  "notes": "High quality cement batch",
  "tags": ["high-strength", "quality-A"]
}
```

### 8. Delete Prediction

```http
DELETE /api/cement-predictions/:id
```

## 💻 Frontend Integration

### Update CementStrengthDetail.js

```javascript
// After getting prediction from ML model
const savePrediction = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/cement-predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputParameters: {
          grinding: {
            initial_min: formData.initial_min,
            final_min: formData.final_min,
            residue_45um: formData.residue_45um,
            fineness: formData.fineness,
            loi: formData.loi
          },
          chemicalComposition: {
            sio2: formData.sio2,
            al2o3: formData.al2o3,
            fe2o3: formData.fe2o3,
            cao: formData.cao,
            mgo: formData.mgo,
            so3: formData.so3,
            k2o: formData.k2o,
            na2o: formData.na2o,
            cl: formData.cl
          }
        },
        predictions: {
          strength_1d: prediction.predictions.strength_1d,
          strength_2d: prediction.predictions.strength_2d,
          strength_7d: prediction.predictions.strength_7d,
          strength_28d: prediction.predictions.strength_28d,
          strength_56d: prediction.predictions.strength_56d
        },
        modelInfo: {
          modelUsed: prediction.model_used,
          confidence: prediction.confidence,
          engineeredFeaturesCount: prediction.engineered_features_count
        }
      })
    });

    const data = await response.json();
    if (data.success) {
      console.log('✅ Prediction saved to database');
    }
  } catch (error) {
    console.error('❌ Failed to save prediction:', error);
  }
};
```

## 🧪 Testing

Use the included test file:

```bash
node test-api.js
```

Or test with curl:

```bash
# Health check
curl http://localhost:5000/health

# Save prediction
curl -X POST http://localhost:5000/api/cement-predictions \
  -H "Content-Type: application/json" \
  -d @test-data.json

# Get all predictions
curl http://localhost:5000/api/cement-predictions

# Get statistics
curl http://localhost:5000/api/cement-predictions/statistics/summary
```

## 📝 Notes

- The database will be created automatically when you first start the server
- Collection `cementstrengthpredictions` will be auto-created
- Indexes are automatically created for better query performance
- All timestamps are stored in UTC

##  ✅ Checklist

- [ ] MongoDB installed or Atlas account created
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Server started (`npm start`)
- [ ] Test API endpoints working
- [ ] Frontend integrated to save predictions

## 🆘 Troubleshooting

**MongoDB Connection Error:**
```
Error: MongoDB connection failed
```
Solution: Ensure MongoDB is running (`mongod`) or check your connection string in `.env`

**Port Already in Use:**
```
Error: Port 5000 is already in use
```
Solution: Change PORT in `.env` file or kill process using port 5000

## 📚 Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Express.js Documentation](https://expressjs.com/)
