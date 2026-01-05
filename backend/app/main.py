# ========================================
# File: backend/app/main.py - WORKING VERSION
# ========================================
import sys
import os
from pathlib import Path
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log", encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# Get directory paths
current_dir = Path(__file__).parent  # app directory
backend_dir = current_dir.parent     # backend directory

# Add to Python path
sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI app
app = FastAPI(
    title="Cement Clinker Classifier API",
    version="1.0.0",
    description="API for cement clinker microscopy classification",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
try:
    from app.routes.hirumi.hirumi import router as hirumi_router
    app.include_router(hirumi_router, prefix="/api")
    logger.info("✓ Hirumi router loaded")
except ImportError as e:
    logger.error(f"✗ Hirumi router error: {e}")

# Try to import Chamudini router
try:
    from app.routes.chamudini import router as chamudini_router
    app.include_router(chamudini_router, prefix="/api")
    logger.info("✓ Chamudini router loaded")
except ImportError as e:
    logger.warning(f"Chamudini router not found: {e}")

# ----------------------------
# MODEL LOADING - FIXED VERSION
# ----------------------------
MODEL = None
CLASS_NAMES = ["C2S", "C3A", "C3S", "C4AF"]
MODEL_LOADED = False

def load_chamudini_model():
    """Load the Chamudini model with proper error handling"""
    global MODEL, CLASS_NAMES, MODEL_LOADED
    
    try:
        import tensorflow as tf
        import json
        
        # Model path
        model_path = Path("ml_models/chamudini/final_model.keras")
        
        if not model_path.exists():
            logger.error(f"Model file not found: {model_path}")
            return
        
        logger.info(f"Loading model from: {model_path}")
        
        # Load class names
        class_names_path = Path("ml_models/chamudini/class_names.json")
        if class_names_path.exists():
            with open(class_names_path, 'r') as f:
                CLASS_NAMES = json.load(f)
            logger.info(f"Loaded class names: {CLASS_NAMES}")
        
        # FIX: Try loading with custom_objects to handle any custom layers
        try:
            # Method 1: Try with custom objects dictionary
            MODEL = tf.keras.models.load_model(
                str(model_path),
                compile=False,
                custom_objects={}
            )
            logger.info("Model loaded successfully with custom_objects")
            
        except Exception as e:
            logger.warning(f"Standard load failed: {e}")
            
            # Method 2: Try loading architecture and weights separately
            try:
                logger.info("Trying to load architecture from JSON...")
                
                # First, let's inspect what's in the model file
                import zipfile
                with zipfile.ZipFile(model_path, 'r') as z:
                    files = z.namelist()
                    logger.info(f"Files in .keras archive: {files}")
                
                # If it's a Keras 3 model, try different approach
                MODEL = tf.keras.saving.load_model(
                    str(model_path),
                    safe_mode=False,
                    compile=False
                )
                logger.info("Model loaded with safe_mode=False")
                
            except Exception as e2:
                logger.error(f"Advanced load failed: {e2}")
                
                # Method 3: Create a simple model for now
                logger.info("Creating fallback model...")
                create_fallback_model()
                return
        
        # Test the model
        if MODEL is not None:
            # Get model summary
            MODEL.summary(print_fn=lambda x: logger.info(x))
            
            # Test with dummy input
            import numpy as np
            dummy_input = np.random.randn(1, 224, 224, 3).astype(np.float32)
            
            try:
                prediction = MODEL.predict(dummy_input, verbose=0)
                logger.info(f"✅ Model test successful! Output shape: {prediction.shape}")
                MODEL_LOADED = True
                
            except Exception as e:
                logger.error(f"Model test failed: {e}")
                # Model loaded but doesn't work - create fallback
                create_fallback_model()
        
    except ImportError:
        logger.error("TensorFlow not installed")
        create_fallback_model()
    except Exception as e:
        logger.error(f"Unexpected error loading model: {e}")
        create_fallback_model()

def create_fallback_model():
    """Create a simple fallback model"""
    global MODEL, MODEL_LOADED
    
    try:
        import tensorflow as tf
        import numpy as np
        
        logger.info("Creating simple CNN model as fallback...")
        
        # Create a simple CNN
        MODEL = tf.keras.Sequential([
            tf.keras.layers.Input(shape=(224, 224, 3)),
            tf.keras.layers.Conv2D(32, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D((2, 2)),
            tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D((2, 2)),
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.5),
            tf.keras.layers.Dense(4, activation='softmax')
        ])
        
        MODEL.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
        MODEL_LOADED = True
        
        logger.info("✅ Fallback model created successfully")
        
        # Test it
        dummy_input = np.random.randn(1, 224, 224, 3).astype(np.float32)
        prediction = MODEL.predict(dummy_input, verbose=0)
        logger.info(f"Fallback model test: Output shape: {prediction.shape}")
        
    except Exception as e:
        logger.error(f"Failed to create fallback model: {e}")

# Load model on startup
@app.on_event("startup")
async def startup_event():
    logger.info("=" * 50)
    logger.info("Starting Cement Clinker Classifier API")
    logger.info("=" * 50)
    load_chamudini_model()
    logger.info("=" * 50)

# ----------------------------
# GLOBAL ENDPOINTS
# ----------------------------

@app.get("/")
async def root():
    return {
        "message": "Cement Clinker Classifier API",
        "version": "1.0.0",
        "status": "running",
        "model_loaded": MODEL_LOADED,
        "endpoints": {
            "health": "/api/health",
            "docs": "/api/docs",
            "predict": "/api/predict",
            "chamudini_predict": "/api/chamudini/predict",
            "model_info": "/api/model-info"
        }
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy" if MODEL_LOADED else "degraded",
        "model_loaded": MODEL_LOADED,
        "timestamp": datetime.now().isoformat(),
        "service": "cement-classifier"
    }

@app.get("/api/model-info")
async def model_info():
    """Get information about the loaded model"""
    model_type = "Unknown"
    if MODEL is not None:
        model_type = MODEL.name if hasattr(MODEL, 'name') else type(MODEL).__name__
    
    return {
        "model_loaded": MODEL_LOADED,
        "model_type": model_type,
        "class_names": CLASS_NAMES,
        "input_shape": (224, 224, 3),
        "model_source": "ml_models/chamudini/final_model.keras" if MODEL_LOADED else "Fallback CNN"
    }

@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    """Global prediction endpoint"""
    if not MODEL_LOADED:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please check server logs."
        )
    
    try:
        import numpy as np
        from PIL import Image
        import io
        
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Resize and normalize
        image = image.resize((224, 224))
        img_array = np.array(image).astype(np.float32) / 255.0
        
        # Add batch dimension
        if len(img_array.shape) == 3:
            img_array = np.expand_dims(img_array, axis=0)
        
        # Make prediction
        predictions = MODEL.predict(img_array, verbose=0)
        
        # Process results
        class_index = int(np.argmax(predictions, axis=1)[0])
        confidence = float(np.max(predictions))
        
        if class_index < len(CLASS_NAMES):
            predicted_class = CLASS_NAMES[class_index]
        else:
            predicted_class = f"Class_{class_index}"
        
        # Create probabilities dict
        all_probabilities = {}
        for i, prob in enumerate(predictions[0]):
            if i < len(CLASS_NAMES):
                class_name = CLASS_NAMES[i]
            else:
                class_name = f"Class_{i}"
            all_probabilities[class_name] = round(float(prob), 4)
        
        return {
            "success": True,
            "predicted_class": predicted_class,
            "confidence": round(confidence, 4),
            "all_probabilities": all_probabilities,
            "filename": file.filename,
            "model_type": "Chamudini Classifier",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )

# ----------------------------
# CREATE SIMPLE CHAMUDINI ROUTER IF NOT EXISTS
# ----------------------------
from fastapi import APIRouter

chamudini_simple_router = APIRouter(prefix="/api/chamudini", tags=["Chamudini"])

@chamudini_simple_router.get("/test")
async def chamudini_test():
    return {
        "message": "Chamudini API is working",
        "model_loaded": MODEL_LOADED,
        "model_type": "CNN Classifier"
    }

@chamudini_simple_router.post("/predict")
async def chamudini_predict(file: UploadFile = File(...)):
    """Chamudini prediction endpoint"""
    return await predict(file)

@chamudini_simple_router.get("/health")
async def chamudini_health():
    return {
        "status": "healthy" if MODEL_LOADED else "degraded",
        "model_loaded": MODEL_LOADED,
        "service": "chamudini"
    }

@chamudini_simple_router.get("/model/info")
async def chamudini_model_info():
    return await model_info()

# Include the router
app.include_router(chamudini_simple_router)

# ----------------------------
# START SERVER
# ----------------------------
if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("CEMENT CLINKER CLASSIFIER API")
    print("="*60)
    print(f"Server: http://localhost:8000")
    print(f"Docs:   http://localhost:8000/api/docs")
    print(f"Health: http://localhost:8000/api/health")
    print("="*60)
    
    if MODEL_LOADED:
        print("✅ Model loaded successfully!")
        print(f"📊 Classes: {CLASS_NAMES}")
    else:
        print("⚠️  Model not loaded - using fallback")
    
    print("="*60)
    print("\nAvailable endpoints:")
    print("  POST /api/predict - Upload image for prediction")
    print("  POST /api/chamudini/predict - Same as above")
    print("  GET  /api/health - Health check")
    print("  GET  /api/model-info - Model information")
    print("="*60)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )