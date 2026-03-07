from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from pathlib import Path

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
    docs_url="/docs",
    redoc_url="/redoc"
)

# ----------------------------
# CORS Settings
# ----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Include Routers
# ----------------------------

# Kanchana
try:
    from app.routes.kanchana.predict import router as kanchana_router
    app.include_router(kanchana_router)
    logger.info("✓ Kanchana router loaded")
except Exception as e:
    logger.warning(f"Kanchana router not loaded: {e}")

# Hirumi
try:
    from app.routes.hirumi.hirumi import router as hirumi_router
    app.include_router(hirumi_router, prefix="/api")
    logger.info("✓ Hirumi router loaded")
except Exception as e:
    logger.warning(f"Hirumi router not loaded: {e}")

# Sanchitha
try:
    from app.routes.sanchitha.sanchitha import router as sanchitha_router
    app.include_router(sanchitha_router, prefix="/api")
    logger.info("✓ Sanchitha router loaded")
except Exception as e:
    logger.warning(f"Sanchitha router not loaded: {e}")

# Chamudini ← YOLO11 (no Keras, no TensorFlow)
try:
    from app.routes.chamudini.chamudini import router as chamudini_router
    logger.info("✓ Chamudini router imported")
    app.include_router(chamudini_router, prefix="/api")
    logger.info("✓ Chamudini router loaded (YOLO11)")
except Exception as e:
    logger.error(f"Chamudini router not loaded: {e}")
    import traceback
    logger.error(traceback.format_exc())

# ----------------------------
# Startup
# ----------------------------

@app.on_event("startup")
async def startup():
    logger.info("=" * 50)
    logger.info("Starting Cement Clinker Classifier API")
    logger.info("=" * 50)

    # Sanchitha crack model
    try:
        from app.services.sanchitha.model_service import crack_service
        crack_service.load_model()
        logger.info("✅ Sanchitha crack model loaded")
    except Exception as e:
        logger.warning(f"⚠️ Sanchitha model not loaded: {e}")

    # Chamudini YOLO11
    try:
        from app.services.chamudini.model_service import chamudini_model_service
        if chamudini_model_service.is_loaded:
            logger.info("✅ Chamudini YOLO11 model loaded")
            logger.info(f"   Classes : {chamudini_model_service.class_names}")
        else:
            logger.warning(
                "⚠️  Chamudini YOLO11 model not loaded.\n"
                "    Copy clinker_yolo11_best.pt into backend/ml_models/chamudini/"
            )
    except Exception as e:
        logger.warning(f"⚠️ Chamudini model error: {e}")

# ----------------------------
# Base Endpoints
# ----------------------------

@app.get("/")
async def root():
    try:
        from app.services.chamudini.model_service import chamudini_model_service
        chamudini_loaded = chamudini_model_service.is_loaded
    except Exception:
        chamudini_loaded = False

    return {
        "message"         : "Cement Clinker Classifier API",
        "status"          : "running",
        "version"         : "1.0.0",
        "docs"            : "/docs",
        "chamudini_model" : "loaded" if chamudini_loaded else "not loaded",
        "endpoints"       : {
            "chamudini_health"  : "/api/chamudini/health",
            "chamudini_predict" : "/api/chamudini/predict",
            "chamudini_batch"   : "/api/chamudini/predict/batch",
            "chamudini_info"    : "/api/chamudini/model/info",
            "chamudini_classes" : "/api/chamudini/classes",
        }
    }

@app.get("/api/health")
async def health_check():
    try:
        from app.services.chamudini.model_service import chamudini_model_service
        chamudini_loaded = chamudini_model_service.is_loaded
    except Exception:
        chamudini_loaded = False

    return {
        "status"          : "healthy",
        "version"         : "1.0.0",
        "chamudini_model" : "loaded" if chamudini_loaded else "not loaded",
    }

@app.get("/api/test-direct")
async def test_direct():
    return {"message": "This is a direct route test"}

# ----------------------------
# Run Server
# ----------------------------
if __name__ == "__main__":
    import uvicorn
    from app.config import Settings
    settings = Settings()
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)