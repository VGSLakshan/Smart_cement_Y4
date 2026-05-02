#!/usr/bin/env python
"""Install all missing dependencies for chamudini router."""
import subprocess
import sys

packages = [
    ("torch", "torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu"),
    ("clip", "git+https://github.com/openai/CLIP.git@main"),
    ("ultralytics", "ultralytics"),
]

print("=" * 70)
print("Installing missing dependencies for chamudini router...")
print("=" * 70)

for pkg_name, pip_spec in packages:
    print(f"\n📦 Installing {pkg_name}...")
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", pip_spec],
            check=True,
            capture_output=False
        )
        print(f"✅ {pkg_name} installed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install {pkg_name}: {e}")
        sys.exit(1)

print("\n" + "=" * 70)
print("✅ All dependencies installed! Restart the uvicorn server.")
print("=" * 70)
