# FastAPI Backend1 Startup Script (PowerShell)
# This script starts the Cement Clinker Image Analyser backend on port 9000

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Backend1 on Port 9000" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to backend1 directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptPath\backend1"

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    pause
    exit 1
}

# Check if uvicorn is installed
try {
    python -m uvicorn --version 2>&1 | Out-Null
    Write-Host "✓ Uvicorn is installed" -ForegroundColor Green
} catch {
    Write-Host "⚠ Uvicorn not found. Installing..." -ForegroundColor Yellow
    pip install uvicorn[standard]
}

# Check if port 9000 is available
$portInUse = Get-NetTCPConnection -LocalPort 9000 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠ WARNING: Port 9000 is already in use!" -ForegroundColor Yellow
    Write-Host "Attempting to free port 9000..." -ForegroundColor Yellow
    
    $portInUse | ForEach-Object {
        $pid = $_.OwningProcess
        Write-Host "Stopping process PID: $pid" -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    
    Start-Sleep -Seconds 2
    Write-Host "✓ Port 9000 is now free" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting FastAPI server..." -ForegroundColor Green
Write-Host "Server URL: http://127.0.0.1:9000" -ForegroundColor Cyan
Write-Host "API Docs: http://127.0.0.1:9000/docs" -ForegroundColor Cyan
Write-Host "Health Check: http://127.0.0.1:9000/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
python -m uvicorn app.main:app --reload --port 9000
