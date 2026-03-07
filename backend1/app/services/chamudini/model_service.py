import json
import logging
from pathlib import Path
from typing import Optional

import torch
from ultralytics import YOLO

logger = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────────────
# backend/app/services/chamudini/model_service.py
# parents[0] = chamudini/
# parents[1] = services/
# parents[2] = app/
# parents[3] = backend/   ← ml_models is inside backend
BASE_DIR   = Path(__file__).resolve().parents[3]
MODEL_DIR  = BASE_DIR / 'ml_models' / 'chamudini'
MODEL_PATH = MODEL_DIR / 'clinker_yolo11_best.pt'
META_PATH  = MODEL_DIR / 'clinker_yolo11_metadata.json'


class ChamudiniModelService:
    """
    Singleton service that loads the YOLO11 classification model once
    at startup and serves predictions for cement clinker phase detection.
    """

    _instance: Optional['ChamudiniModelService'] = None
    _model:    Optional[YOLO] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        self.class_names      = ['C2S', 'C3A', 'C3S', 'C4AF']
        self.num_classes      = 4
        self.img_size         = 224
        self.reject_threshold = 0.50
        self.device           = 'cuda' if torch.cuda.is_available() else 'cpu'

        if self._model is None:
            self._load_model()

    # ── Load ───────────────────────────────────────────────────────────────────

    def _load_model(self):
        try:
            print(f"📁 BASE_DIR   : {BASE_DIR}")
            print(f"📁 MODEL_DIR  : {MODEL_DIR}")
            print(f"📁 MODEL_PATH : {MODEL_PATH}")
            print(f"📁 EXISTS     : {MODEL_PATH.exists()}")

            if not MODEL_PATH.exists():
                logger.warning(
                    f'\n⚠️   Model file not found: {MODEL_PATH}'
                    f'\n    Copy clinker_yolo11_best.pt into:'
                    f'\n    {MODEL_DIR}'
                )
                return

            if not META_PATH.exists():
                logger.warning(
                    f'\n⚠️   Metadata file not found: {META_PATH}'
                    f'\n    Copy clinker_yolo11_metadata.json into:'
                    f'\n    {MODEL_DIR}'
                )
                return

            with open(META_PATH) as f:
                config = json.load(f)

            self.class_names      = config.get('class_names',      self.class_names)
            self.num_classes      = config.get('num_classes',      self.num_classes)
            self.img_size         = config.get('img_size',         self.img_size)
            self.reject_threshold = config.get('reject_threshold', self.reject_threshold)

            logger.info(f'Loading YOLO11 model from: {MODEL_PATH}')
            self._model = YOLO(str(MODEL_PATH))

            logger.info('✅ YOLO11 model loaded successfully')
            logger.info(f'   Classes   : {self.class_names}')
            logger.info(f'   Device    : {self.device}')
            logger.info(f'   Img size  : {self.img_size}')
            logger.info(f'   Threshold : {self.reject_threshold}')

        except Exception as e:
            logger.error(f'❌ Model load failed: {e}')
            self._model = None

    # ── Predict ────────────────────────────────────────────────────────────────

    def predict(self, image_path: str) -> dict:
        if not self.is_loaded:
            return self._error_result(
                'YOLO11 model not loaded. '
                'Copy clinker_yolo11_best.pt into ml_models/chamudini/'
            )

        try:
            results = self._model.predict(
                source  = str(image_path),
                imgsz   = self.img_size,
                device  = self.device,
                verbose = False,
            )

            r     = results[0]
            probs = r.probs

            if probs is None:
                return self._error_result('Model returned no probabilities')

            prob_arr  = probs.data.cpu().numpy()
            pred_idx  = int(probs.top1)
            pred_conf = float(probs.top1conf)
            pred_name = (
                self.class_names[pred_idx]
                if pred_idx < len(self.class_names)
                else 'UNKNOWN'
            )
            rejected = pred_conf < self.reject_threshold

            all_probs = {
                self.class_names[i]: round(float(prob_arr[i]), 4)
                for i in range(len(self.class_names))
            }
            top3 = sorted(all_probs.items(), key=lambda x: -x[1])[:3]

            return {
                'predicted_class'  : pred_name if not rejected else 'UNKNOWN',
                'raw_class'        : pred_name,
                'confidence'       : round(pred_conf, 4),
                'rejected'         : rejected,
                'all_probabilities': all_probs,
                'top3'             : top3,
            }

        except Exception as e:
            logger.error(f'Prediction error on {image_path}: {e}')
            return self._error_result(str(e))

    def predict_batch(self, image_paths: list) -> list:
        return [self.predict(p) for p in image_paths]

    # ── Info ───────────────────────────────────────────────────────────────────

    def get_model_info(self) -> dict:
        return {
            'model_name'      : 'clinker_yolo11',
            'model_variant'   : 'yolo11m-cls',
            'framework'       : 'PyTorch / Ultralytics YOLO11',
            'num_classes'     : self.num_classes,
            'class_names'     : self.class_names,
            'img_size'        : self.img_size,
            'reject_threshold': self.reject_threshold,
            'model_path'      : str(MODEL_PATH),
            'model_found'     : MODEL_PATH.exists(),
            'status'          : 'loaded' if self.is_loaded else 'not loaded',
        }

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _error_result(self, message: str) -> dict:
        return {
            'predicted_class'  : 'ERROR',
            'raw_class'        : 'ERROR',
            'confidence'       : 0.0,
            'rejected'         : True,
            'all_probabilities': {},
            'top3'             : [],
            'error'            : message,
        }


# ── Singleton instance ─────────────────────────────────────────────────────────
chamudini_model_service = ChamudiniModelService()