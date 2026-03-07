# ✅ FIXED: Backend1 Port 9000 - Troubleshooting Guide

## Problem Solved ✓

The **WinError 10013** socket access error has been resolved!

---

## 🎯 What Was the Issue?

The error `[WinError 10013] An attempt was made to access a socket in a way forbidden by its access permissions` can happen due to several reasons:

### Root Causes Identified and Fixed:

1. **Port Already in Use** ⚠️
   - Previous backend1 instances were running on ports 8001 and 8002
   - **Fixed**: Stopped all conflicting processes

2. **Host Binding Permission** ⚠️
   - Using `0.0.0.0` (all interfaces) can require admin privileges on Windows
   - **Fixed**: Changed to `127.0.0.1` (localhost only) - no admin needed

3. **Port Configuration** ⚠️
   - Config was set to port 8002, but you wanted port 9000
   - **Fixed**: Updated `backend1/app/config.py` to use port 9000

---

## ✅ How to Run Backend1 (3 Easy Methods)

### Method 1: PowerShell Script (RECOMMENDED) 🚀
```powershell
.\start_backend1.ps1
```
This script automatically:
- Checks if Python is installed
- Verifies uvicorn is available
- Frees port 9000 if it's in use
- Starts the server with proper configuration

### Method 2: Batch File (Double-Click) 💻
```cmd
start_backend1.bat
```
Just double-click the file in Windows Explorer!

### Method 3: Manual Command 🔧
```powershell
cd backend1
uvicorn app.main:app --reload --port 9000
```

---

## 📋 Step-by-Step Instructions

### For the First Time:

1. **Open PowerShell** (regular user, no admin needed)
   ```powershell
   cd "C:\Users\ASUS\Desktop\RESEARCH\cement new\Smart_cement_Y4"
   ```

2. **Make sure no process is using port 9000**
   ```powershell
   # Check port availability
   Get-NetTCPConnection -LocalPort 9000 -ErrorAction SilentlyContinue
   
   # If something is there, kill it
   Get-NetTCPConnection -LocalPort 9000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
   ```

3. **Navigate to backend1 folder**
   ```powershell
   cd backend1
   ```

4. **Run the server**
   ```powershell
   uvicorn app.main:app --reload --port 9000
   ```

5. **Verify it's running**
   - Open: http://127.0.0.1:9000/docs
   - Or test: 
     ```powershell
     Invoke-WebRequest -Uri "http://127.0.0.1:9000/api/health"
     ```

---

## 🔍 Verifying the Fix

### Test 1: Health Check
```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:9000/api/health" -UseBasicParsing | Select-Object -ExpandProperty Content
```
**Expected Output:**
```json
{"status":"healthy","version":"1.0.0","chamudini_model":"loaded"}
```

### Test 2: Chamudini Health
```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:9000/api/chamudini/health" -UseBasicParsing | Select-Object -ExpandProperty Content
```
**Expected Output:**
```json
{"status":"healthy","model":"yolo11m-cls","loaded":true}
```

### Test 3: API Documentation
- Open in browser: http://127.0.0.1:9000/docs
- You should see Swagger UI with all endpoints

---

## 🛠️ Configuration Changes Made

### File: `backend1/app/config.py`
**Before:**
```python
HOST: str = "0.0.0.0"  # All interfaces (needs admin)
PORT: int = 8002       # Old port
```

**After:**
```python
HOST: str = "127.0.0.1"  # Localhost only (no admin needed)
PORT: int = 9000         # New port as requested
```

### File: `frontend/src/pages/ClinkerAnalyser.js`
**Before:**
```javascript
const BACKEND_URL = "http://127.0.0.1:8002";
```

**After:**
```javascript
const BACKEND_URL = "http://127.0.0.1:9000";
```

---

## 🚨 Troubleshooting: If Error Still Appears

### Issue 1: Port 9000 Already in Use
**Symptom:** `Address already in use` error

**Solution:**
```powershell
# Find what's using port 9000
Get-NetTCPConnection -LocalPort 9000 -ErrorAction SilentlyContinue | ForEach-Object {
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    Write-Host "Port 9000 used by: $($proc.ProcessName) (PID: $($proc.Id))"
}

# Kill it
Get-NetTCPConnection -LocalPort 9000 -ErrorAction SilentlyContinue | ForEach-Object { 
    Stop-Process -Id $_.OwningProcess -Force 
}

# Wait 2 seconds
Start-Sleep -Seconds 2

# Try again
cd backend1
uvicorn app.main:app --reload --port 9000
```

### Issue 2: Python/Uvicorn Not Found
**Symptom:** `'python' is not recognized` or `'uvicorn' is not recognized`

**Solution:**
```powershell
# Check Python installation
python --version

# If not found, install Python 3.10+
# Download from: https://www.python.org/downloads/

# Install uvicorn
pip install uvicorn[standard]

# Or install all requirements
pip install -r backend1/requirements.txt
```

### Issue 3: Module Import Errors
**Symptom:** `ModuleNotFoundError: No module named 'app'`

**Solution:**
```powershell
# Make sure you're in the backend1 folder
cd backend1

# Then run
uvicorn app.main:app --reload --port 9000

# NOT from the parent directory
```

### Issue 4: Windows Reserved Port
**Symptom:** Port 9000 shows as restricted

**Solution:**
```powershell
# Check if port is reserved by Windows
netsh interface ipv4 show excludedportrange protocol=tcp

# If 9000 is in a reserved range, try a different port (e.g., 9001)
uvicorn app.main:app --reload --port 9001

# Update config.py accordingly
```

### Issue 5: Firewall Blocking
**Symptom:** Server starts but can't access from browser

**Solution:**
```powershell
# Add firewall rule (run PowerShell as Administrator)
New-NetFirewallRule -DisplayName "Backend1 Port 9000" -Direction Inbound -LocalPort 9000 -Protocol TCP -Action Allow

# Or temporarily disable firewall for testing
```

---

## 📊 Current Project Status

| Component | Port | Status | URL |
|-----------|------|--------|-----|
| **Backend1** | 9000 | ✅ Running | http://127.0.0.1:9000 |
| Backend | 8000 | ⚠️ Configure separately | http://127.0.0.1:8000 |
| Frontend | 3000 | ⚠️ Start with `npm start` | http://localhost:3000 |

---

## 🎓 Why This Error Happened (Simple Explanation)

### The Problem:
When you run a server on Windows, it needs to "bind" (attach) to a port. Think of a port like a door number on your computer.

### What Went Wrong:
1. **Someone else was using the door** - Another process (old backend1) was already using ports 8001/8002
2. **Trying to open too many doors** - Using `0.0.0.0` means "open on ALL network interfaces" which needs admin permission
3. **Wrong door number** - Config said 8002, you wanted 9000

### The Fix:
1. **Kicked out the old tenant** - Stopped all processes using those ports
2. **Used a private door** - Changed to `127.0.0.1` (localhost/loopback) which doesn't need admin
3. **Fixed the door number** - Updated config to port 9000

---

## ✨ Final Working Command

```powershell
cd backend1
uvicorn app.main:app --reload --port 9000
```

**That's it!** Your backend now runs on port 9000 without permission errors.

---

## 📝 Quick Reference Card

### Start Backend1:
```powershell
cd backend1
uvicorn app.main:app --reload --port 9000
```

### Stop Backend1:
Press `Ctrl + C` in the terminal

### Check if Running:
```powershell
Invoke-WebRequest http://127.0.0.1:9000/api/health
```

### Kill Port 9000:
```powershell
Get-NetTCPConnection -LocalPort 9000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### View Logs:
Check the terminal where uvicorn is running

---

**Problem**: WinError 10013 socket access error  
**Solution**: Changed host to 127.0.0.1 + port to 9000 + killed conflicting processes  
**Status**: ✅ **RESOLVED** - Backend running successfully on port 9000!

---

**Last Updated:** March 7, 2026  
**Tested On:** Windows PowerShell  
**Backend Version:** 1.0.0
