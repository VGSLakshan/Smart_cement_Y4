# 🚀 Quick Start Guide

Follow these steps to get the Cement Strength Test Backend running:

## Step 1: Install Dependencies

Open PowerShell/Command Prompt and navigate to the strength-backend directory:

```powershell
cd "c:\Users\ASUS\Desktop\RESEARCH\cement new\Smart_cement_Y4_testing\strength-backend"
npm install
```

This will install:

- express
- mongoose
- dotenv
- multer
- cors

## Step 2: Start MongoDB

Make sure MongoDB is running on your system. If you have MongoDB installed locally:

```powershell
# Start MongoDB (if installed as a service)
net start MongoDB

# OR start manually
mongod
```

**Alternative: Use MongoDB Atlas (Cloud)**

If you prefer cloud MongoDB:

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Update `.env` file with your connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cement_strength_db
   ```

## Step 3: Start the Server

```powershell
npm start
```

You should see:

```
==================================================
🚀 Cement Strength Test API Server
==================================================
📡 Server running on port: 5000
🌐 URL: http://localhost:5000
🏥 Health check: http://localhost:5000/health
📁 Environment: development
==================================================

✅ MongoDB Connected: localhost
📊 Database: cement_strength_db
```

## Step 4: Test the API

### Option A: Using PowerShell

**1. Check health:**

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
```

**2. Create a test record:**

```powershell
$body = @{
    cubeId = "CUBE-2026-001"
    cubeMadeDate = "2026-02-01"
    testDate = "2026-02-25"
    testingTime = "09:30 AM"
    predictGrade = "M20"
    curingDays = 24
    appliedLoadKn = 450
    avgLengthMm = 150
    avgWidthMm = 150
    cubeGrade = "M20"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/strength-tests" -Method Post -Body $body -ContentType "application/json"
```

**3. Get all tests:**

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/strength-tests" -Method Get
```

### Option B: Using a Web Browser

1. Open your browser
2. Go to: `http://localhost:5000`
3. You'll see the API welcome page with all endpoints

For testing, use:

- **Postman**: https://www.postman.com/downloads/
- **Thunder Client** (VS Code extension)
- **REST Client** (VS Code extension)

## Step 5: Upload an Image (Optional)

Using PowerShell:

```powershell
# Replace {id} with actual test ID from previous step
# Replace path/to/image.jpg with your actual image path

$testId = "YOUR_TEST_ID_HERE"
$imagePath = "C:\path\to\your\image.jpg"

curl.exe -X POST "http://localhost:5000/api/strength-tests/$testId/image" -F "image=@$imagePath"
```

## 📋 Common Commands

```powershell
# Install dependencies
npm install

# Start server
npm start

# Start with auto-reload (requires nodemon)
npm install -D nodemon
npm run dev

# Check if server is running
Invoke-RestMethod -Uri "http://localhost:5000/health"
```

## 🔧 Troubleshooting

### MongoDB Connection Error

**Problem:** `MongoDB Connection Error: connect ECONNREFUSED`

**Solutions:**

1. Make sure MongoDB is running: `net start MongoDB`
2. Check if MongoDB is installed: `mongod --version`
3. Verify MONGODB_URI in `.env` file
4. Try using MongoDB Atlas (cloud) instead

### Port Already in Use

**Problem:** `Port 5000 is already in use`

**Solution:**

1. Change PORT in `.env` file to 5001 or another port
2. Or stop the process using port 5000:
   ```powershell
   netstat -ano | findstr :5000
   taskkill /F /PID <PID_NUMBER>
   ```

### Module Not Found

**Problem:** `Cannot find module 'express'`

**Solution:** Run `npm install` again

## 🎯 Next Steps

1. ✅ Server is running
2. ✅ API endpoints are accessible
3. 📱 Connect your frontend application
4. 🧪 Test all CRUD operations
5. 📊 Monitor MongoDB data using MongoDB Compass

## 📚 Resources

- **API Documentation**: See README.md
- **Test Data**: See test-data.json for example requests
- **MongoDB Compass**: https://www.mongodb.com/products/compass (GUI for MongoDB)

## 🎉 Success Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] MongoDB running
- [ ] Server starts without errors
- [ ] Health check returns success
- [ ] Can create a test record
- [ ] Can retrieve test records
- [ ] Can upload images

If all checked, you're ready to go! 🚀
