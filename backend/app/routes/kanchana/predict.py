from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
from pathlib import Path
import requests

from app.services.kanchana.yolo_service import predict_particles

router = APIRouter(prefix="/api/kanchana", tags=["Kanchana YOLO"])

UPLOAD_DIR = Path("app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

NODE_API = "http://localhost:5000/api/particle-identification"

@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    image_path = UPLOAD_DIR / file.filename

    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = predict_particles(str(image_path))

    # Prepare data for MongoDB API
    payload = {
        "sampleName": file.filename,
        "imagePath": file.filename,  # Store only filename, not full path
        "microscopic": result.get("microscopic"),
        "particleCounts": {
            "dark_red": result.get("dark_red", 0),
            "light_red": result.get("light_red", 0),
            "white": result.get("white", 0)
        }
    }

    # Send to Node.js backend
    try:
        requests.post(NODE_API, json=payload)
    except:
        print("⚠️ Could not send data to MongoDB API")

    return {
        "filename": file.filename,
        "counts": result
    }
