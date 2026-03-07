# Start Backend1 Server (Port 8001)
# This backend handles: Cement Clinker Image Analyser

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Starting Backend1 - Port 8001" -ForegroundColor Cyan
Write-Host "   Cement Clinker Image Analyser API" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (Test-Path ".venv\Scripts\Activate.ps1") {
    Write-Host "[√] Activating virtual environment..." -ForegroundColor Green
    & .venv\Scripts\Activate.ps1
} else {
    Write-Host "[!] Virtual environment not found." -ForegroundColor Yellow
    Write-Host "    Creating virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
    & .venv\Scripts\Activate.ps1
    Write-Host "[√] Installing dependencies..." -ForegroundColor Green
    pip install -r requirements.txt
}

Write-Host ""
Write-Host "[√] Starting FastAPI server on http://127.0.0.1:8001" -ForegroundColor Green
Write-Host "[√] API Documentation: http://127.0.0.1:8001/docs" -ForegroundColor Green
Write-Host ""

# Start the server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
