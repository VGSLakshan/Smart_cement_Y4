from ultralytics import YOLO
from app.config import settings
import logging

logger = logging.getLogger(__name__)

CLASS_NAMES = ["dark red", "light red", "white"]
# IDENTIFIER_CLASSES = ["non_microscopic", "microscopic"]

try:
    particle_model = YOLO(settings.KANCHANA_MODEL_PATH)
    logger.info(f"✅ Particle model loaded from {settings.KANCHANA_MODEL_PATH}")
except Exception as e:
    logger.error(f"❌ Failed to load particle model: {e}")
    particle_model = None

try:
    identifier_model = YOLO(settings.KANCHANA_IDENTIFIER_MODEL_PATH)
    logger.info(f"✅ Identifier model loaded from {settings.KANCHANA_IDENTIFIER_MODEL_PATH}")
except Exception as e:
    logger.error(f"❌ Failed to load identifier model: {e}")
    identifier_model = None


def predict_particles(image_path: str):

    # -----------------------------
    # STEP 1: Check if microscopic
    # -----------------------------
    id_results = identifier_model.predict(image_path)
    
    probs = id_results[0].probs.data.cpu().numpy()
    class_index = int(probs.argmax())
    confidence = float(probs[class_index])

    # Get class name directly from model
    label = identifier_model.names[class_index]

    if label == "non_microscopic":
        return {
            "microscopic": False,
            "message": "Uploaded image is not microscopic",
            "confidence": round(confidence, 4)
        }

    # -----------------------------
    # STEP 2: Particle Detection
    # -----------------------------
    results = particle_model.predict(image_path, conf=0.3)

    counts = {name: 0 for name in CLASS_NAMES}

    for r in results:
        if r.boxes is not None:
            classes = r.boxes.cls.cpu().numpy().astype(int)
            for cls in classes:
                counts[CLASS_NAMES[cls]] += 1

    return {
        "microscopic": True,
        "confidence": round(confidence, 4),
        "dark_red": counts["dark red"],
        "light_red": counts["light red"],
        "white": counts["white"],
    }