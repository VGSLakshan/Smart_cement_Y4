@echo off
REM Install chamudini dependencies and restart backend

echo.
echo ======================================================================
echo Installing chamudini dependencies (torch, clip, ultralytics)...
echo ======================================================================
echo.

REM Activate virtualenv
call "d:\reserach bacup\Smart_cement_Y4\.venv\Scripts\activate.bat"

REM Install dependencies
python -m pip install --upgrade pip
echo.
echo Installing PyTorch (CPU version)...
python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

echo.
echo Installing OpenAI CLIP...
python -m pip install git+https://github.com/openai/CLIP.git@main

echo.
echo Installing ultralytics...
python -m pip install ultralytics

echo.
echo ======================================================================
echo ✅ Installation complete!
echo ======================================================================
echo.
echo NEXT STEPS:
echo 1. Restart the uvicorn server (Ctrl+C in the terminal running the server)
echo 2. Run: uvicorn app.main:app --reload --port 9000
echo 3. Test the endpoint: curl http://127.0.0.1:9000/api/chamudini/health
echo.
pause
