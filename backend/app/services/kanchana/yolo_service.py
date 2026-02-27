from ultralytics import YOLO
from app.config import settings
import logging

logger = logging.getLogger(__name__)

CLASS_NAMES = ["dark red", "light red", "white"]

try:
    model = YOLO(settings.KANCHANA_MODEL_PATH)
    logger.info(f"✅ Kanchana YOLO model loaded from {settings.KANCHANA_MODEL_PATH}")
except Exception as e:
    logger.error(f"❌ Failed to load Kanchana YOLO model: {e}")
    model = None

def predict_particles(image_path: str):
    results = model.predict(image_path, conf=0.3)

    counts = {name: 0 for name in CLASS_NAMES}

    for r in results:
        if r.boxes is not None:
            classes = r.boxes.cls.cpu().numpy().astype(int)
            for cls in classes:
                counts[CLASS_NAMES[cls]] += 1

    return {
        "dark_red": counts["dark red"],
        "light_red": counts["light red"],
        "white": counts["white"],
    }
