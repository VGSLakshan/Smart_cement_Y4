import json
import logging
import os
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import torch
from PIL import Image
from ultralytics import YOLO

logger = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parents[3]
MODEL_DIR  = BASE_DIR / 'ml_models' / 'chamudini'
MODEL_PATH = MODEL_DIR / 'clinker_yolo11_best.pt'
META_PATH  = MODEL_DIR / 'clinker_yolo11_metadata.json'


# ══════════════════════════════════════════════════════════════════════════════
#  STEP 1 — CLIP-based microscopy validator (loads once, runs locally forever)
# ══════════════════════════════════════════════════════════════════════════════

_clip_model      = None
_clip_preprocess = None
_clip_loaded     = False

_MICRO_PROMPTS = [
    "a cement clinker microscopy image showing crystalline phases",
    "a BSE or SEM microscopy image of cement clinker",
    "an optical microscope image of cement clinker mineral phases",
    "a reflected light microscopy image showing alite belite aluminate ferrite",
]
_OTHER_PROMPTS = [
    "a photograph of a person, animal, food, or cartoon character",
    "a regular photo taken with a phone or camera",
    "a screenshot, document, diagram, or chart",
    "a landscape, nature photo, or everyday object",
    "a cartoon, illustration, or computer-generated image",
]

def _load_clip():
    global _clip_model, _clip_preprocess, _clip_loaded
    if _clip_loaded:
        return True
    try:
        import clip
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _clip_model, _clip_preprocess = clip.load("ViT-B/32", device=device)
        _clip_loaded = True
        logger.info("✅ CLIP model loaded for microscopy validation")
        return True
    except Exception as e:
        logger.warning(f"⚠️  CLIP not available: {e} — falling back to heuristics only")
        return False


def _clip_check(image_path: str) -> tuple[bool, float, str]:
    if not _load_clip():
        return True, 0.5, "CLIP unavailable"
    try:
        import clip
        device = "cuda" if torch.cuda.is_available() else "cpu"
        image  = _clip_preprocess(Image.open(image_path).convert("RGB")).unsqueeze(0).to(device)

        micro_tokens = clip.tokenize(_MICRO_PROMPTS).to(device)
        other_tokens = clip.tokenize(_OTHER_PROMPTS).to(device)

        with torch.no_grad():
            img_f   = _clip_model.encode_image(image)
            micro_f = _clip_model.encode_text(micro_tokens)
            other_f = _clip_model.encode_text(other_tokens)

            img_f   = img_f   / img_f.norm(dim=-1, keepdim=True)
            micro_f = micro_f / micro_f.norm(dim=-1, keepdim=True)
            other_f = other_f / other_f.norm(dim=-1, keepdim=True)

            micro_scores = (img_f @ micro_f.T).squeeze().cpu().numpy()
            other_scores = (img_f @ other_f.T).squeeze().cpu().numpy()

        micro_score = float(np.max(micro_scores))
        other_score = float(np.max(other_scores))
        is_micro    = micro_score > other_score
        confidence  = micro_score / (micro_score + other_score + 1e-6)
        reason      = f"CLIP micro={micro_score:.3f} vs other={other_score:.3f}"
        return is_micro, confidence, reason

    except Exception as e:
        logger.warning(f"CLIP check error: {e}")
        return True, 0.5, f"CLIP error: {e}"


# ══════════════════════════════════════════════════════════════════════════════
#  STEP 2 — Heuristic validator (fast, zero extra dependencies)
# ══════════════════════════════════════════════════════════════════════════════

def _heuristic_check(image_path: str) -> tuple[bool, dict]:
    reasons = {}
    scores  = []
    try:
        img = cv2.imread(str(image_path))
        if img is None:
            return False, {"error": "Cannot read image"}

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        hsv  = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        # 1. Sharpness — microscopy is moderately sharp (not blurry, not cartoon-crisp)
        lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        if lap_var < 20:
            reasons["too_blurry"] = f"Too blurry (lap_var={lap_var:.1f})"
            scores.append(0)
        elif lap_var > 15000:
            reasons["unnatural_sharpness"] = f"Unnaturally sharp (lap_var={lap_var:.1f})"
            scores.append(0)
        else:
            scores.append(1)

        # 2. Color saturation — microscopy is muted (no vivid reds, greens, cartoon colors)
        mean_sat = float(np.mean(hsv[:, :, 1]))
        if mean_sat > 110:
            reasons["too_vivid"] = f"Too colorful for microscopy (sat={mean_sat:.1f})"
            scores.append(0)
        else:
            scores.append(1)

        # 3. Uniform color regions — cartoons have large flat-color blobs
        pixels      = img.reshape(-1, 3).astype(np.float32)
        dominant    = np.median(pixels, axis=0)
        dist        = np.linalg.norm(pixels - dominant, axis=1)
        uniform_pct = float(np.mean(dist < 30) * 100)
        if uniform_pct > 40:
            reasons["uniform_regions"] = (
                f"Too many uniform-color regions ({uniform_pct:.1f}%) — "
                "cartoon or solid background"
            )
            scores.append(0)
        else:
            scores.append(1)

        # 4. Texture complexity — microscopy has rich fine-grain texture everywhere
        kernel     = np.ones((8, 8), np.float32) / 64
        local_mean = cv2.filter2D(gray.astype(np.float32), -1, kernel)
        local_sq   = cv2.filter2D((gray.astype(np.float32))**2, -1, kernel)
        local_std  = np.sqrt(np.maximum(local_sq - local_mean**2, 0))
        tex_score  = float(np.std(local_std))
        if tex_score < 5.0:
            reasons["low_texture"] = f"Low texture complexity ({tex_score:.2f})"
            scores.append(0)
        else:
            scores.append(1)

        # 5. Dynamic range — microscopy uses full brightness range
        p5, p95   = np.percentile(gray, 5), np.percentile(gray, 95)
        dyn_range = float(p95 - p5)
        if dyn_range < 40:
            reasons["poor_dynamic_range"] = f"Narrow brightness range ({dyn_range:.1f})"
            scores.append(0)
        else:
            scores.append(1)

        # 6. Edge density — microscopy has many fine crystal-boundary edges
        edges        = cv2.Canny(gray, 50, 150)
        edge_density = float(np.mean(edges > 0) * 100)
        if edge_density < 3.0:
            reasons["too_few_edges"] = f"Too few edges ({edge_density:.1f}%)"
            scores.append(0)
        elif edge_density > 60:
            reasons["too_many_edges"] = f"Too many edges ({edge_density:.1f}%) — noise or cartoon"
            scores.append(0)
        else:
            scores.append(1)

        passed   = sum(scores)
        is_micro = passed >= 5   # must pass at least 5 of 6

        if not reasons:
            reasons["passed"] = f"All {passed}/{len(scores)} heuristic checks passed"

        return is_micro, reasons

    except Exception as e:
        logger.warning(f"Heuristic check error: {e}")
        return True, {"error": str(e)}


# ══════════════════════════════════════════════════════════════════════════════
#  Combined validator — CLIP + Heuristics (no API key needed)
# ══════════════════════════════════════════════════════════════════════════════

def is_clinker_microscopy(image_path: str) -> tuple[bool, str]:
    """
    Runs CLIP + heuristic checks. Both must agree it's microscopy to pass.
    If CLIP is unavailable, heuristics alone decide.
    Returns (is_valid: bool, reason: str)
    """
    clip_valid, clip_conf, clip_reason = _clip_check(image_path)
    heur_valid, heur_reasons           = _heuristic_check(image_path)

    heur_failures = {k: v for k, v in heur_reasons.items()
                     if k not in ("passed", "error")}

    if _clip_loaded:
        if clip_valid and heur_valid:
            return True, f"CLIP ✅ ({clip_conf:.2f}) + heuristics ✅"
        if not clip_valid and not heur_valid:
            reasons_str = "; ".join(list(heur_failures.values())[:2])
            return False, f"CLIP ❌ ({clip_reason}) + heuristics ❌: {reasons_str}"
        if not clip_valid:
            return False, f"CLIP rejected: {clip_reason}"
        if not heur_valid:
            reasons_str = "; ".join(list(heur_failures.values())[:2])
            return False, f"Heuristics rejected: {reasons_str}"

    # CLIP unavailable — heuristics only
    if not heur_valid:
        reasons_str = "; ".join(list(heur_failures.values())[:2])
        return False, f"Not a microscopy image: {reasons_str}"

    return True, "Heuristics ✅ (CLIP not loaded)"


# ══════════════════════════════════════════════════════════════════════════════
#  Model Service
# ══════════════════════════════════════════════════════════════════════════════

class ChamudiniModelService:
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
            _load_clip()   # pre-load CLIP at startup

    def _load_model(self):
        try:
            print(f"📁 BASE_DIR   : {BASE_DIR}")
            print(f"📁 MODEL_DIR  : {MODEL_DIR}")
            print(f"📁 MODEL_PATH : {MODEL_PATH}")
            print(f"📁 EXISTS     : {MODEL_PATH.exists()}")

            if not MODEL_PATH.exists():
                logger.warning(f'⚠️  Model not found: {MODEL_PATH}')
                return
            if not META_PATH.exists():
                logger.warning(f'⚠️  Metadata not found: {META_PATH}')
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
            logger.info(f'   Classes : {self.class_names}')

        except Exception as e:
            logger.error(f'❌ Model load failed: {e}')
            self._model = None

    def predict(self, image_path: str) -> dict:
        if not self.is_loaded:
            return self._error_result(
                'YOLO11 model not loaded. '
                'Copy clinker_yolo11_best.pt into ml_models/chamudini/'
            )

        # ── STEP 1: Microscopy check (CLIP + heuristics, no API key) ──────────
        is_micro, micro_reason = is_clinker_microscopy(image_path)
        if not is_micro:
            logger.info(f'🚫 Rejected: {Path(image_path).name} — {micro_reason}')
            return {
                'predicted_class'  : 'REJECTED',
                'raw_class'        : 'REJECTED',
                'confidence'       : 0.0,
                'rejected'         : True,
                'reject_reason'    : f'Not a clinker microscopy image — {micro_reason}',
                'all_probabilities': {c: 0.0 for c in self.class_names},
                'top3'             : [],
            }

        # ── STEP 2: YOLO classification ────────────────────────────────────────
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
                if pred_idx < len(self.class_names) else 'UNKNOWN'
            )
            rejected  = pred_conf < self.reject_threshold
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


# ── Singleton ──────────────────────────────────────────────────────────────────
chamudini_model_service = ChamudiniModelService()