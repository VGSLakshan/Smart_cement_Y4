import logging
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.chamudini.chamudini_schemas import (
    BatchPredictionResponse,
    ModelInfoResponse,
    PredictionResponse,
    PredictionResult,
)
from app.services.chamudini import (
    chamudini_model_service,
    cleanup_upload,
    preprocess_image,
    save_upload,
    validate_image,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix='/chamudini',
    tags=['Chamudini — Clinker Phase Classification'],
)


# ── Health ─────────────────────────────────────────────────────────────────────

@router.get('/health')
async def health_check():
    """Check if the service and model are running."""
    return {
        'status' : 'healthy',
        'model'  : 'yolo11m-cls',
        'loaded' : chamudini_model_service.is_loaded,
    }


# ── Classes ────────────────────────────────────────────────────────────────────

@router.get('/classes')
async def get_classes():
    """Return all supported clinker phase class names."""
    return {
        'class_names': chamudini_model_service.class_names,
        'num_classes': chamudini_model_service.num_classes,
    }


# ── Model Info ─────────────────────────────────────────────────────────────────

@router.get('/model-info', response_model=ModelInfoResponse)
async def get_model_info():
    """Return model configuration and metadata."""
    try:
        return ModelInfoResponse(**chamudini_model_service.get_model_info())
    except Exception as e:
        logger.error(f'model-info error: {e}')
        raise HTTPException(status_code=500, detail=str(e))


# ── Single Prediction ──────────────────────────────────────────────────────────

@router.post('/predict', response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    """
    Upload one clinker microscopy image and receive a phase classification.

    - Returns predicted class name and confidence score
    - If confidence < threshold, predicted_class will be 'UNKNOWN'
    - Also returns top-3 predictions and all class probabilities
    """
    image_path = None

    try:
        file_bytes = await file.read()

        # Validate
        is_valid, error_msg = validate_image(file_bytes, file.filename)
        if not is_valid:
            return PredictionResponse(
                success  = False,
                filename = file.filename,
                error    = error_msg,
            )

        # Save + preprocess
        image_path = save_upload(file_bytes, file.filename)
        preprocess_image(
            image_path,
            target_size=chamudini_model_service.img_size,
        )

        # Inference
        prediction = chamudini_model_service.predict(str(image_path))

        if 'error' in prediction:
            return PredictionResponse(
                success  = False,
                filename = file.filename,
                error    = prediction['error'],
            )

        return PredictionResponse(
            success  = True,
            filename = file.filename,
            result   = PredictionResult(
                predicted_class   = prediction['predicted_class'],
                confidence        = prediction['confidence'],
                rejected          = prediction['rejected'],
                top3              = prediction['top3'],
                all_probabilities = prediction['all_probabilities'],
            ),
        )

    except Exception as e:
        logger.error(f'/predict error: {e}')
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if image_path:
            cleanup_upload(image_path)


# ── Batch Prediction ───────────────────────────────────────────────────────────

@router.post('/predict-batch', response_model=BatchPredictionResponse)
async def predict_batch(files: list[UploadFile] = File(...)):
    """
    Upload up to 20 clinker images and receive predictions for all.

    Each image is processed independently.
    Invalid images return an error entry without stopping the batch.
    """
    if len(files) > 20:
        raise HTTPException(
            status_code=400,
            detail='Maximum 20 images allowed per batch request.',
        )

    saved_paths = []   # (original_filename, saved_path)
    responses   = []

    try:
        # ── Save + validate all files first ───────────────────────────────────
        for file in files:
            file_bytes = await file.read()
            is_valid, error_msg = validate_image(file_bytes, file.filename)

            if not is_valid:
                responses.append(PredictionResponse(
                    success  = False,
                    filename = file.filename,
                    error    = error_msg,
                ))
                continue

            image_path = save_upload(file_bytes, file.filename)
            preprocess_image(
                image_path,
                target_size=chamudini_model_service.img_size,
            )
            saved_paths.append((file.filename, image_path))

        # ── Run inference on all valid images ─────────────────────────────────
        for original_name, image_path in saved_paths:
            prediction = chamudini_model_service.predict(str(image_path))

            if 'error' in prediction:
                responses.append(PredictionResponse(
                    success  = False,
                    filename = original_name,
                    error    = prediction['error'],
                ))
            else:
                responses.append(PredictionResponse(
                    success  = True,
                    filename = original_name,
                    result   = PredictionResult(
                        predicted_class   = prediction['predicted_class'],
                        confidence        = prediction['confidence'],
                        rejected          = prediction['rejected'],
                        top3              = prediction['top3'],
                        all_probabilities = prediction['all_probabilities'],
                    ),
                ))

        return BatchPredictionResponse(
            success = True,
            total   = len(responses),
            results = responses,
        )

    except Exception as e:
        logger.error(f'/predict-batch error: {e}')
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        for _, path in saved_paths:
            cleanup_upload(path)