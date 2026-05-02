#!/usr/bin/env python
"""Diagnose chamudini router import issue."""
import sys
import traceback

print("=" * 60)
print("Checking chamudini router import chain...")
print("=" * 60)

checks = [
    ("torch", None),
    ("torchvision", None),
    ("clip", None),
    ("ultralytics", None),
    ("cv2", None),
]

for pkg, _ in checks:
    try:
        __import__(pkg)
        print(f"✅ {pkg:20s} — available")
    except ImportError as e:
        print(f"❌ {pkg:20s} — MISSING: {e}")

print("\n" + "=" * 60)
print("Attempting full app import...")
print("=" * 60)

try:
    from app.routes.chamudini import chamudini
    print("✅ chamudini router imported successfully!")
except Exception as e:
    print(f"❌ Failed to import chamudini router:")
    traceback.print_exc()
