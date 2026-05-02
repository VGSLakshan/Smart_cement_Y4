@echo off
cd /d "d:\reserach bacup\Smart_cement_Y4"
call .venv\Scripts\activate.bat
echo Installing PyTorch and CLIP...
python -m pip install --upgrade pip
python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
python -m pip install git+https://github.com/openai/CLIP.git@main
echo Done!
