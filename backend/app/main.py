from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import tensorflow as tf
import numpy as np
from PIL import Image
import io
from app.routes.kanchana.predict import router as kanchana_router




# ----------------------------
# Logging Setup
# ----------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ----------------------------
# FastAPI App
# ----------------------------
app = FastAPI(
    title="Cement Clinker Classifier API",
    version="1.0.0",
    description="API for cement clinker microscopy classification",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)


app.include_router(kanchana_router)
# ----------------------------
# CORS Settings
# ----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Simplified for troubleshooting; restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Model Loading
# ----------------------------
MODEL_PATH = r"C:\Users\Acer\Desktop\cement\backend\ml_models\chamudini\final_model.keras"

model = None
class_names = ["C2S", "C3A", "C3S", "C4AF"]

@app.on_event("startup")
async def load_model():
    global model
    try:
        # The fix: Add compile=False
        model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        logger.info(f"✅ Model loaded successfully from {MODEL_PATH}")
    except Exception as e:
        logger.error(f"❌ Failed to load model: {str(e)}")
# ----------------------------
# Endpoints
# ----------------------------

@app.get("/")
async def root():
    return {
        "message": "Cement Clinker Classifier API",
        "status": "running",
        "model_loaded": model is not None,
        "docs": "/api/docs"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy" if model is not None else "degraded",
        "version": "1.0.0"
    }

@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded on server")
    
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Ensure image size matches model input (e.g., 224x224)
        image = image.resize((224, 224))
        img_array = np.array(image).astype(np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        predictions = model.predict(img_array)
        class_index = int(np.argmax(predictions, axis=1)[0])
        confidence = float(np.max(predictions))
        label = class_names[class_index]
        
        return {
            "filename": file.filename,
            "prediction": label,
            "confidence": round(confidence, 4),
            "class_index": class_index,
            "all_probabilities": {
                class_names[i]: float(predictions[0][i]) for i in range(len(class_names))
            }
        }

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing image")

# ----------------------------
# Run Server
# ----------------------------
if __name__ == "__main__":
    import uvicorn
    # Make sure this matches your file name (e.g., if this file is main.py, use "main:app")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)