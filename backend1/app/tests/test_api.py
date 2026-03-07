"""
API Tests for SMART_CEMENT Backend
File: backend/tests/test_api.py

Run with: pytest tests/test_api.py -v
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
    """Create a test image"""
    img = Image.new('RGB', size, color)
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes


class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "app" in data
        assert "version" in data
        assert data["status"] == "running"
    
    def test_global_health_check(self):
        """Test global health check"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestChamudimiEndpoints:
    """Test Chamudini's cement classifier endpoints"""
    
    def test_model_info(self):
        """Test model information endpoint"""
        response = client.get("/api/chamudini/model/info")
        assert response.status_code == 200
        data = response.json()
        assert "model_name" in data
        assert "classes" in data
        assert len(data["classes"]) == 4
        assert set(data["classes"]) == {"C2S", "C3A", "C3S", "C4AF"}
    
    def test_service_health(self):
        """Test service health check"""
        response = client.get("/api/chamudini/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "chamudini-cement-classifier"
    
    def test_predict_with_valid_image(self):
        """Test prediction with valid image"""
        img_bytes = create_test_image()
        files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
        
        response = client.post("/api/chamudini/predict", files=files)
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
    
    def test_batch_predict(self):
        """Test batch prediction"""
        files = [
            ("files", ("test1.jpg", create_test_image(), "image/jpeg")),
            ("files", ("test2.jpg", create_test_image(color=(0, 255, 0)), "image/jpeg")),
            ("files", ("test3.jpg", create_test_image(color=(0, 0, 255)), "image/jpeg"))
        ]
        
        response = client.post("/api/chamudini/predict/batch", files=files)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["total_images"] == 3
        assert len(data["predictions"]) == 3
    
    def test_batch_predict_exceeds_limit(self):
        """Test batch prediction with too many files"""
        files = [
            ("files", (f"test{i}.jpg", create_test_image(), "image/jpeg"))
            for i in range(25)  # More than the limit of 20
        ]
        
        response = client.post("/api/chamudini/predict/batch", files=files)
        assert response.status_code == 400


class TestImageProcessor:
    """Test image processing functionality"""
    
    def test_image_validation(self):
        """Test image validation"""
        from app.services.chamudini.image_processor import ImageProcessor
        
        processor = ImageProcessor()
        
        # Create and save a test image
        img_path = Path("test_temp.jpg")
        img = Image.new('RGB', (224, 224), (255, 0, 0))
        img.save(img_path)
        
        try:
            is_valid, error_msg = processor.validate_image(img_path)
            assert is_valid is True
            assert error_msg == ""
        finally:
            if img_path.exists():
                img_path.unlink()
    
    def test_image_preprocessing(self):
        """Test image preprocessing"""
        from app.services.chamudini.image_processor import ImageProcessor
        
        processor = ImageProcessor(target_size=(224, 224))
        img_bytes = create_test_image()
        
        img_array = processor.load_from_bytes(img_bytes.read())
        
        assert img_array.shape == (1, 224, 224, 3)
        assert img_array.dtype == np.float32
        assert img_array.min() >= 0.0
        assert img_array.max() <= 1.0


class TestFileHandler:
    """Test file handling functionality"""
    
    def test_file_validation(self):
        """Test file validation"""
        from app.utils.file_handler import FileHandler
        from fastapi import UploadFile
        
        handler = FileHandler()
        
        # Valid file
        img_bytes = create_test_image()
        upload_file = UploadFile(
            filename="test.jpg",
            file=img_bytes
        )
        
        result = handler.validate_file(upload_file)
        assert result["valid"] is True
        
        # Invalid extension
        upload_file = UploadFile(
            filename="test.txt",
            file=io.BytesIO(b"text")
        )
        
        result = handler.validate_file(upload_file)
        assert result["valid"] is False


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])