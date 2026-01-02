from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
from pathlib import Path

from app.services.kanchana.yolo_service import predict_particles

router = APIRouter(prefix="/api/kanchana", tags=["Kanchana YOLO"])

UPLOAD_DIR = Path("app/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    image_path = UPLOAD_DIR / file.filename

    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = predict_particles(str(image_path))

    return {
        "filename": file.filename,
        "counts": result
    }
