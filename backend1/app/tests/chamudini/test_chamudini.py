import io
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from main import app

client = TestClient(app)

CLASS_NAMES = ['alite', 'belite', 'celite', 'free_lime']

MOCK_PREDICTION_SUCCESS = {
    'predicted_class'  : 'alite',
    'raw_class'        : 'alite',
    'confidence'       : 0.92,
    'rejected'         : False,
    'all_probabilities': {c: 0.25 for c in CLASS_NAMES},
    'top3'             : [('alite', 0.92), ('belite', 0.05), ('celite', 0.02)],
}

MOCK_PREDICTION_REJECTED = {
    'predicted_class'  : 'UNKNOWN',
    'raw_class'        : 'belite',
    'confidence'       : 0.30,
    'rejected'         : True,
    'all_probabilities': {c: 0.25 for c in CLASS_NAMES},
    'top3'             : [('belite', 0.30), ('alite', 0.28), ('celite', 0.22)],
}


def make_dummy_image(size: int = 224, fmt: str = 'JPEG') -> bytes:
    """Create a minimal in-memory RGB image for testing."""
    img = Image.new('RGB', (size, size), color=(120, 80, 60))
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


# ── Health ─────────────────────────────────────────────────────────────────────

def test_health_check():
    r = client.get('/api/v1/chamudini/health')
    assert r.status_code == 200
    body = r.json()
    assert body['status'] == 'healthy'
    assert 'loaded' in body


# ── Classes ────────────────────────────────────────────────────────────────────

def test_get_classes():
    r = client.get('/api/v1/chamudini/classes')
    assert r.status_code == 200
    body = r.json()
    assert 'class_names' in body
    assert 'num_classes'  in body
    assert isinstance(body['class_names'], list)
    assert len(body['class_names']) > 0


# ── Model Info ─────────────────────────────────────────────────────────────────

def test_model_info():
    r = client.get('/api/v1/chamudini/model-info')
    assert r.status_code == 200
    body = r.json()
    assert body['status'] == 'loaded'
    assert 'class_names'  in body
    assert 'num_classes'   in body
    assert 'img_size'      in body
    assert 'framework'     in body


# ── Single Prediction ──────────────────────────────────────────────────────────

@patch('app.services.chamudini.model_service.ChamudiniModelService.predict')
def test_predict_success(mock_predict):
    mock_predict.return_value = MOCK_PREDICTION_SUCCESS

    r = client.post(
        '/api/v1/chamudini/predict',
        files={'file': ('test.jpg', make_dummy_image(), 'image/jpeg')},
    )
    assert r.status_code == 200
    body = r.json()
    assert body['success'] is True
    assert body['filename'] == 'test.jpg'
    assert body['result']['predicted_class'] == 'alite'
    assert body['result']['confidence'] == 0.92
    assert body['result']['rejected'] is False
    assert len(body['result']['top3']) == 3
    assert 'alite' in body['result']['all_probabilities']


@patch('app.services.chamudini.model_service.ChamudiniModelService.predict')
def test_predict_rejected(mock_predict):
    mock_predict.return_value = MOCK_PREDICTION_REJECTED

    r = client.post(
        '/api/v1/chamudini/predict',
        files={'file': ('test.jpg', make_dummy_image(), 'image/jpeg')},
    )
    assert r.status_code == 200
    body = r.json()
    assert body['success'] is True
    assert body['result']['predicted_class'] == 'UNKNOWN'
    assert body['result']['rejected'] is True
    assert body['result']['confidence'] == 0.30


def test_predict_invalid_extension():
    r = client.post(
        '/api/v1/chamudini/predict',
        files={'file': ('test.txt', b'not an image at all', 'text/plain')},
    )
    assert r.status_code == 200
    body = r.json()
    assert body['success'] is False
    assert body['error'] is not None


def test_predict_corrupted_image():
    r = client.post(
        '/api/v1/chamudini/predict',
        files={'file': ('bad.jpg', b'this is not jpeg data', 'image/jpeg')},
    )
    assert r.status_code == 200
    body = r.json()
    assert body['success'] is False


def test_predict_no_file():
    r = client.post('/api/v1/chamudini/predict')
    assert r.status_code == 422


def test_predict_png_format():
    mock_pred = MOCK_PREDICTION_SUCCESS.copy()
    with patch(
        'app.services.chamudini.model_service.ChamudiniModelService.predict',
        return_value=mock_pred
    ):
        r = client.post(
            '/api/v1/chamudini/predict',
            files={'file': ('test.png', make_dummy_image(fmt='PNG'), 'image/png')},
        )
    assert r.status_code == 200
    assert r.json()['success'] is True


# ── Batch Prediction ───────────────────────────────────────────────────────────

@patch('app.services.chamudini.model_service.ChamudiniModelService.predict')
def test_predict_batch_success(mock_predict):
    mock_predict.return_value = MOCK_PREDICTION_SUCCESS

    files = [
        ('files', (f'img{i}.jpg', make_dummy_image(), 'image/jpeg'))
        for i in range(3)
    ]
    r = client.post('/api/v1/chamudini/predict-batch', files=files)
    assert r.status_code == 200
    body = r.json()
    assert body['success'] is True
    assert body['total'] == 3
    assert len(body['results']) == 3
    for result in body['results']:
        assert result['success'] is True


@patch('app.services.chamudini.model_service.ChamudiniModelService.predict')
def test_predict_batch_mixed(mock_predict):
    """Batch with some valid and some invalid files."""
    mock_predict.return_value = MOCK_PREDICTION_SUCCESS

    files = [
        ('files', ('good.jpg', make_dummy_image(), 'image/jpeg')),
        ('files', ('bad.txt',  b'not image',       'text/plain')),
        ('files', ('good2.jpg', make_dummy_image(), 'image/jpeg')),
    ]
    r = client.post('/api/v1/chamudini/predict-batch', files=files)
    assert r.status_code == 200
    body = r.json()
    assert body['total'] == 3
    successes = [res for res in body['results'] if res['success']]
    failures  = [res for res in body['results'] if not res['success']]
    assert len(successes) == 2
    assert len(failures)  == 1


def test_predict_batch_too_many_files():
    files = [
        ('files', (f'img{i}.jpg', make_dummy_image(), 'image/jpeg'))
        for i in range(21)
    ]
    r = client.post('/api/v1/chamudini/predict-batch', files=files)
    assert r.status_code == 400
    assert 'Maximum 20' in r.json()['detail']


def test_predict_batch_no_files():
    r = client.post('/api/v1/chamudini/predict-batch')
    assert r.status_code == 422