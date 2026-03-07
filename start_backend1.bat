@echo off
REM FastAPI Backend1 Startup Script
REM This script starts the Cement Clinker Image Analyser backend on port 9000

echo ========================================
echo Starting Backend1 on Port 9000
echo ========================================
echo.

REM Change to backend1 directory
cd /d "%~dp0backend1"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if uvicorn is installed
python -m uvicorn --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Uvicorn is not installed
    echo Installing uvicorn...
    pip install uvicorn[standard]
)

echo Starting FastAPI server...
echo Server will be available at: http://127.0.0.1:9000
echo API Documentation: http://127.0.0.1:9000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
python -m uvicorn app.main:app --reload --port 9000

pause
