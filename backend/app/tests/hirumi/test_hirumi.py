import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_hirumi_model_info():
    """Test model info endpoint"""
    response = client.get("/api/hirumi/info")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "Hirumi" in data["model_name"]
    assert data["model_type"] == "Ensemble (XGBoost + LightGBM)"


def test_hirumi_predict():
    """Test prediction endpoint with valid data"""
    test_data = {
        "initial_min": 30.0,
        "final_min": 120.0,
        "residue_45um": 8.5,
        "fineness": 3200.0,
        "loi": 2.5,
        "sio2": 20.5,
        "al2o3": 5.2,
        "fe2o3": 3.1,
        "cao": 63.5,
        "mgo": 1.8,
        "so3": 2.3,
        "k2o": 0.5,
        "na2o": 0.3,
        "cl": 0.01
    }
    
    response = client.post("/api/hirumi/predict", json=test_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "predictions" in data
    assert all(key in data["predictions"] for key in ["strength_1d", "strength_2d", "strength_7d", "strength_28d", "strength_56d"])


def test_hirumi_predict_invalid_data():
    """Test prediction endpoint with missing fields"""
    invalid_data = {
        "initial_min": 30.0,
        "final_min": 120.0
        # Missing required fields
    }
    
    response = client.post("/api/hirumi/predict", json=invalid_data)
    assert response.status_code == 422  # Validation error


def test_hirumi_batch_predict():
    """Test batch prediction endpoint"""
    test_data = [
        {
            "initial_min": 30.0,
            "final_min": 120.0,
            "residue_45um": 8.5,
            "fineness": 3200.0,
            "loi": 2.5,
            "sio2": 20.5,
            "al2o3": 5.2,
            "fe2o3": 3.1,
            "cao": 63.5,
            "mgo": 1.8,
            "so3": 2.3,
            "k2o": 0.5,
            "na2o": 0.3,
            "cl": 0.01
        },
        {
            "initial_min": 35.0,
            "final_min": 130.0,
            "residue_45um": 7.0,
            "fineness": 3400.0,
            "loi": 2.8,
            "sio2": 21.0,
            "al2o3": 5.5,
            "fe2o3": 3.0,
            "cao": 64.0,
            "mgo": 1.9,
            "so3": 2.5,
            "k2o": 0.6,
            "na2o": 0.4,
            "cl": 0.015
        }
    ]
    
    response = client.post("/api/hirumi/batch-predict", json=test_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert len(data["results"]) == 2
