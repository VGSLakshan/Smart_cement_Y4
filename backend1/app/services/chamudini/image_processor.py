import io
import logging
import uuid
from pathlib import Path
from typing import Tuple

from PIL import Image, ImageOps

logger = logging.getLogger(__name__)

# ── Upload directory ───────────────────────────────────────────────────────────
UPLOAD_DIR = Path(__file__).resolve().parents[5] / 'backend' / 'uploads'
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff', '.webp'}
MAX_FILE_SIZE_MB   = 10


def validate_image(file_bytes: bytes, filename: str) -> Tuple[bool, str]:
    """
    Validate an uploaded image file.

    Returns
    -------
    (True, '')           if valid
    (False, error_msg)   if invalid
    """
    # File size
    size_mb = len(file_bytes) / 1_000_000
    if size_mb > MAX_FILE_SIZE_MB:
        return False, (
            f'File too large ({size_mb:.1f} MB). '
            f'Maximum allowed size is {MAX_FILE_SIZE_MB} MB.'
        )

    # Extension
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, (
            f'File type "{ext}" is not supported. '
            f'Allowed types: {", ".join(sorted(ALLOWED_EXTENSIONS))}'
        )

    # Image integrity
    try:
        img = Image.open(io.BytesIO(file_bytes))
        img.verify()
    except Exception as e:
        return False, f'Invalid or corrupted image file: {e}'

    return True, ''


def save_upload(file_bytes: bytes, original_filename: str) -> Path:
    """
    Save raw file bytes to the uploads directory with a unique filename.

    Returns
    -------
    Path to the saved file.
    """
    ext       = Path(original_filename).suffix.lower()
    unique_id = uuid.uuid4().hex[:12]
    save_name = f'chamudini_{unique_id}{ext}'
    save_path = UPLOAD_DIR / save_name

    with open(save_path, 'wb') as f:
        f.write(file_bytes)

    logger.info(f'Upload saved: {save_path}')
    return save_path


def preprocess_image(image_path: Path, target_size: int = 224) -> Path:
    """
    Prepare an image for YOLO11 inference:
      1. Convert to RGB
      2. Auto-rotate based on EXIF data
      3. Pad to square and resize to target_size × target_size

    Saves the result back to the same path.

    Returns
    -------
    Path to the preprocessed image.
    """
    try:
        img = Image.open(image_path).convert('RGB')
        img = ImageOps.exif_transpose(img)
        img = ImageOps.pad(
            img,
            (target_size, target_size),
            color=(114, 114, 114),   # YOLO standard grey padding
        )
        img.save(image_path)
        return image_path

    except Exception as e:
        logger.error(f'Preprocessing failed for {image_path}: {e}')
        raise


def cleanup_upload(image_path: Path) -> None:
    """Delete a temporary upload file after inference is complete."""
    try:
        if image_path and image_path.exists():
            image_path.unlink()
            logger.debug(f'Cleaned up: {image_path}')
    except Exception as e:
        logger.warning(f'Could not clean up {image_path}: {e}')