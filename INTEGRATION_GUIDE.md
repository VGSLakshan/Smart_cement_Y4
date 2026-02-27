# 🔗 Frontend-Backend Integration Guide

## ✅ What Was Implemented

The Compressive Strength Detail page now saves test data to MongoDB when users click the "Save Test to Database" button.

### Features Added:

1. **Form State Management** - All input fields are now connected to React state
2. **MongoDB Integration** - Data is saved to the strength-backend API
3. **Auto-Calculations** - Backend automatically calculates:
   - Average Area (mm²)
   - Compressive Strength (MPa)
   - Pass/Fail Status
4. **Image Upload** - Crack images are uploaded to MongoDB after test creation
5. **Real-time Results Display** - Shows calculated results from backend
6. **Notification System** - Success/error messages with auto-dismiss

## 🚀 How to Use

### 1. Start the Backend Server

```powershell
# Navigate to backend directory
cd "c:\Users\ASUS\Desktop\RESEARCH\cement new\Smart_cement_Y4_testing\strength-backend"

# Make sure MongoDB is running
net start MongoDB

# Start the server
node src/server.js
```

The backend should be running at: `http://localhost:5000`

### 2. Start the Frontend

```powershell
# Navigate to frontend directory
cd "c:\Users\ASUS\Desktop\RESEARCH\cement new\Smart_cement_Y4_testing\frontend"

# Start React app
npm start
```

The frontend should be running at: `http://localhost:3000`

### 3. Test the Integration

1. **Fill in all required fields** (marked with \*):
   - Cube ID (e.g., "CUBE-2026-001")
   - Cube Made Date
   - Testing Time
   - Predict Grade (select from dropdown)
   - Test Date
   - Applied Load (kN) (e.g., 450)
   - Curing Days (e.g., 7 or 28)
   - Avg Length (mm) (default: 150.12)
   - Avg Width (mm) (default: 149.98)

2. **Click "💾 Save Test to Database"**

3. **See the results**:
   - Green notification: "✓ Test saved successfully!"
   - Results appear in "Average Test Data" section
   - Compressive Strength calculated automatically
   - Pass/Fail status determined by grade threshold

4. **Optional: Add crack image**:
   - Capture or upload an image
   - Click "Analyze Crack"
   - Image will be automatically uploaded to MongoDB when you save

## 📊 Database Structure

Each test record in MongoDB contains:

```javascript
{
  _id: "65abc123...",
  cubeId: "CUBE-2026-001",
  cubeMadeDate: "2026-02-01",
  testDate: "2026-02-25",
  testingTime: "09:30",
  predictGrade: "M20",
  cubeGrade: "M20",
  curingDays: 24,
  avgLengthMm: 150.12,
  avgWidthMm: 149.98,
  avgAreaMm2: 22518.58,        // Auto-calculated
  appliedLoadKn: 450,
  compressiveStrengthMpa: 19.98, // Auto-calculated
  status: "Passed",             // Auto-determined
  crackImageUrl: "http://...",  // If image uploaded
  crackImageLocalPath: "...",
  imageUploadedAt: "2026-02-25...",
  createdAt: "2026-02-25...",
  updatedAt: "2026-02-25..."
}
```

## 🔧 API Endpoints Used

### 1. Create Test Record

```
POST http://localhost:5000/api/strength-tests
Content-Type: application/json

Body: {
  cubeId, cubeMadeDate, testDate, testingTime,
  predictGrade, curingDays, appliedLoadKn,
  avgLengthMm, avgWidthMm, cubeGrade
}
```

### 2. Upload Crack Image

```
POST http://localhost:5000/api/strength-tests/:id/image
Content-Type: multipart/form-data

Body: FormData with "image" field
```

## 🎯 Grade Thresholds

The backend uses these thresholds for Pass/Fail:

| Grade | Minimum Strength (MPa) |
| ----- | ---------------------- |
| M10   | 10                     |
| M15   | 15                     |
| M20   | 20                     |
| M25   | 25                     |
| M30   | 30                     |
| M35   | 35                     |
| M40   | 40                     |
| M45   | 45                     |
| M50   | 50                     |

## 📝 Example Test Data

**High-Strength Pass Example:**

```
Cube ID: CUBE-2026-001
Cube Made Date: 2026-01-28
Test Date: 2026-02-25
Testing Time: 10:00
Predict Grade: M20
Curing Days: 28
Applied Load: 480 kN
Avg Length: 150 mm
Avg Width: 150 mm

Expected Result:
✓ Passed - 21.33 MPa (M20 threshold: 20 MPa)
```

**Borderline Fail Example:**

```
Cube ID: CUBE-2026-002
Cube Made Date: 2026-02-18
Test Date: 2026-02-25
Testing Time: 11:30
Predict Grade: M25
Curing Days: 7
Applied Load: 500 kN
Avg Length: 150 mm
Avg Width: 150 mm

Expected Result:
✗ Failed - 22.22 MPa (M25 threshold: 25 MPa)
```

## 🐛 Troubleshooting

### "Failed to save test" Error

**Check:**

1. Is MongoDB running? `net start MongoDB`
2. Is backend server running? Check `http://localhost:5000/health`
3. Are all required fields filled in?
4. Check browser console (F12) for detailed errors

### Backend Connection Refused

```powershell
# Check if backend is running on correct port
netstat -ano | findstr :5000

# Restart backend
cd strength-backend
node src/server.js
```

### CORS Error

The backend has CORS enabled. If you still see CORS errors:

1. Make sure backend is running on `http://localhost:5000`
2. Frontend should be on `http://localhost:3000`
3. Check browser console for specific error message

### Image Upload Fails

1. Check file size (max 5MB)
2. Supported formats: JPG, JPEG, PNG
3. Test record must be saved first
4. Check `/uploads/strength` folder exists

## 🧪 Testing with Browser DevTools

Open browser console (F12) to see:

- API request details
- Response data
- Error messages
- Network activity

## 📱 View Saved Data

### Option 1: MongoDB Compass

1. Download: https://www.mongodb.com/products/compass
2. Connect to: `mongodb://localhost:27017`
3. Open database: `cement_strength_db`
4. Collection: `strengthtests`

### Option 2: API

```powershell
# Get all tests
Invoke-RestMethod -Uri "http://localhost:5000/api/strength-tests"

# Get specific test
Invoke-RestMethod -Uri "http://localhost:5000/api/strength-tests/{test_id}"
```

## 🎉 Success Indicators

When everything works correctly:

1. ✅ Green notification appears
2. ✅ Test ID is displayed in notification
3. ✅ Results section updates with calculated values
4. ✅ Page shows calculated compressive strength
5. ✅ Pass/Fail status is determined
6. ✅ Data visible in MongoDB

## 📚 Next Steps

- [ ] Add validation messages for invalid inputs
- [ ] Implement update functionality for existing tests
- [ ] Add loading spinner during save
- [ ] Create history view to see past tests
- [ ] Add export to PDF/Excel functionality
- [ ] Implement user authentication

---

**Need Help?** Check the backend logs and browser console for detailed error messages.
