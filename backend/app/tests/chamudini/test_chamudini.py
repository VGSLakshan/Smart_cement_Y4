# ========================================
# File: tests/test_chamudini.py
# ========================================
"""
Tests for Chamudini's Cement Classifier API
File: backend/tests/test_chamudini.py

Run with: pytest tests/test_chamudini.py -v
"""
import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import io
from PIL import Image
import numpy as np

from app.main import app

client = TestClient(app)


def create_test_image(size=(224, 224), color=(255, 0, 0)):
    """Create a test image for testing"""
    img = Image.new('RGB', size, color)
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes


class TestChamudimiHealthEndpoints:
    """Test health check endpoints"""
    
    def test_service_health(self):
        """Test service health check"""
        response = client.get("/api/chamudini/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "chamudini-cement-classifier"
        assert "model_loaded" in data
    
    def test_model_info(self):
        """Test model information endpoint"""
        response = client.get("/api/chamudini/model/info")
        assert response.status_code == 200
        data = response.json()
        assert "model_name" in data
        assert "classes" in data
        assert len(data["classes"]) == 4
        assert set(data["classes"]) == {"C2S", "C3A", "C3S", "C4AF"}
        assert data["input_shape"] == [224, 224, 3]


class TestChamudimiPrediction:
    """Test prediction endpoints"""
    
    def test_predict_with_valid_image(self):
        """Test prediction with valid image"""
        img_bytes = create_test_image()
        files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
        
        response = client.post("/api/chamudini/predict", files=files)
        
        # If model is not loaded, expect 503
        if response.status_code == 503:
            data = response.json()
            assert "Model not loaded" in data["detail"]
            pytest.skip("Model not loaded - skipping prediction test")
        
        # If model is loaded, test prediction
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "predicted_class" in data
        assert data["predicted_class"] in ["C2S", "C3A", "C3S", "C4AF"]
        assert 0 <= data["confidence"] <= 1
        assert len(data["all_probabilities"]) == 4
        assert "processing_time_ms" in data
    
    def test_predict_without_file(self):
        """Test prediction without file"""
        response = client.post("/api/chamudini/predict")
        assert response.status_code == 422  # Validation error
    
    def test_predict_with_invalid_file_type(self):
        """Test prediction with invalid file type"""
        files = {"file": ("test.txt", b"not an image", "text/plain")}
        response = client.post("/api/chamudini/predict", files=files)
        assert response.status_code == 400
        data = response.json()
        assert "success" in data
        assert data["success"] is False
    
    def test_predict_with_small_image(self):
        """Test prediction with too small image"""
        img_bytes = create_test_image(size=(30, 30))
        files = {"file": ("small.jpg", img_bytes, "image/jpeg")}
        
        response = client.post("/api/chamudini/predict", files=files)
        
        # Should fail validation if model is loaded
        if response.status_code != 503:  # Skip if model not loaded
            assert response.status_code in [400, 500]


class TestChamudimiBatchPrediction:
    """Test batch prediction endpoints"""
    
    def test_batch_predict_success(self):
        """Test batch prediction with multiple images"""
        files = [
            ("files", ("test1.jpg", create_test_image(), "image/jpeg")),
            ("files", ("test2.jpg", create_test_image(color=(0, 255, 0)), "image/jpeg")),
            ("files", ("test3.jpg", create_test_image(color=(0, 0, 255)), "image/jpeg"))
        ]
        
        response = client.post("/api/chamudini/predict/batch", files=files)
        
        # If model not loaded, expect 503
        if response.status_code == 503:
            pytest.skip("Model not loaded - skipping batch prediction test")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["total_images"] == 3
        assert len(data["predictions"]) == 3
    
    def test_batch_predict_empty(self):
        """Test batch prediction with no files"""
        response = client.post("/api/chamudini/predict/batch", files=[])
        assert response.status_code == 400
    
    def test_batch_predict_exceeds_limit(self):
        """Test batch prediction with too many files"""
        files = [
            ("files", (f"test{i}.jpg", create_test_image(), "image/jpeg"))
            for i in range(25)  # More than the limit of 20
        ]
        
        response = client.post("/api/chamudini/predict/batch", files=files)
        assert response.status_code == 400
        data = response.json()
        assert "Maximum 20 images" in data["detail"]
    
    def test_batch_predict_mixed_valid_invalid(self):
        """Test batch prediction with mix of valid and invalid files"""
        files = [
            ("files", ("valid.jpg", create_test_image(), "image/jpeg")),
            ("files", ("invalid.txt", b"not an image", "text/plain")),
            ("files", ("valid2.jpg", create_test_image(color=(0, 255, 0)), "image/jpeg"))
        ]
        
        response = client.post("/api/chamudini/predict/batch", files=files)
        
        if response.status_code == 503:
            pytest.skip("Model not loaded")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_images"] == 3
        assert len(data["predictions"]) == 3
        
        # Check that invalid file was rejected
        invalid_pred = [p for p in data["predictions"] if p["filename"] == "invalid.txt"][0]
        assert invalid_pred["success"] is False
        assert "error" in invalid_pred


class TestImageProcessor:
    """Test image processing functionality"""
    
    def test_image_preprocessing_shape(self):
        """Test image preprocessing output shape"""
        from app.services.chamudini.image_processor import ImageProcessor
        
        processor = ImageProcessor(target_size=(224, 224))
        img_bytes = create_test_image()
        
        img_array = processor.load_from_bytes(img_bytes.read())
        
        assert img_array.shape == (1, 224, 224, 3)
        assert img_array.dtype == np.float32
    
    def test_image_preprocessing_normalization(self):
        """Test image preprocessing normalization"""
        from app.services.chamudini.image_processor import ImageProcessor
        
        processor = ImageProcessor(target_size=(224, 224))
        img_bytes = create_test_image()
        
        img_array = processor.load_from_bytes(img_bytes.read())
        
        assert img_array.min() >= 0.0
        assert img_array.max() <= 1.0
    
    def test_image_validation(self):
        """Test image validation"""
        from app.services.chamudini.image_processor import ImageProcessor
        
        processor = ImageProcessor()
        
        # Create and save a test image
        img_path = Path("test_temp_validation.jpg")
        img = Image.new('RGB', (224, 224), (255, 0, 0))
        img.save(img_path)
        
        try:
            is_valid, error_msg = processor.validate_image(img_path)
            assert is_valid is True
            assert error_msg == ""
        finally:
            if img_path.exists():
                img_path.unlink()


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])