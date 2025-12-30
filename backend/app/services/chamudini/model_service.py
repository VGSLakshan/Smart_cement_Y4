"""
ML Model Service for Chamudini's Cement Classifier
File: backend/app/services/chamudini/model_service.py
"""
import tensorflow as tf
import numpy as np
import json
from pathlib import Path
from typing import Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class CementClassifierModel:
    """Cement Clinker Phase Classifier Model Service"""
    
    def __init__(self, model_path: str, class_names_path: Optional[str] = None):
        """
        Initialize the model service
        
        Args:
            model_path: Path to the Keras model file
            class_names_path: Path to JSON file with class names (optional)
        """
        self.model_path = Path(model_path)
        self.class_names_path = Path(class_names_path) if class_names_path else None
        self.model = None
        self.class_names = ['C2S', 'C3A', 'C3S', 'C4AF']  # Default
        self._load_model()
        self._load_class_names()
    
    def _load_model(self):
        """Load the trained Keras model"""
        try:
            if not self.model_path.exists():
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            logger.info(f"Loading model from: {self.model_path}")
            self.model = tf.keras.models.load_model(self.model_path)
            logger.info("✓ Model loaded successfully")
            logger.info(f"  Input shape: {self.model.input_shape}")
            logger.info(f"  Output shape: {self.model.output_shape}")
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise RuntimeError(f"Could not load model: {e}")
    
    def _load_class_names(self):
        """Load class names from JSON file if available"""
        if self.class_names_path and self.class_names_path.exists():
            try:
                with open(self.class_names_path, 'r') as f:
                    self.class_names = json.load(f)
                logger.info(f"✓ Loaded class names: {self.class_names}")
            except Exception as e:
                logger.warning(f"Could not load class names, using defaults: {e}")
        else:
            logger.info(f"Using default class names: {self.class_names}")
    
    def predict(self, image_array: np.ndarray) -> Dict[str, any]:
        """
        Make prediction on preprocessed image
        
        Args:
            image_array: Preprocessed image array (1, 224, 224, 3)
            
        Returns:
            Dictionary with prediction results
        """
        if self.model is None:
            raise RuntimeError("Model not loaded")
        
        # Validate input shape
        expected_shape = (1, 224, 224, 3)
        if image_array.shape != expected_shape:
            raise ValueError(f"Invalid input shape: {image_array.shape}, expected {expected_shape}")
        
        # Make prediction
        predictions = self.model.predict(image_array, verbose=0)
        
        # Get predicted class
        predicted_idx = np.argmax(predictions[0])
        predicted_class = self.class_names[predicted_idx]
        confidence = float(predictions[0][predicted_idx])
        
        # Get all probabilities
        all_probabilities = {
            self.class_names[i]: float(predictions[0][i])
            for i in range(len(self.class_names))
        }
        
        return {
            'predicted_class': predicted_class,
            'confidence': confidence,
            'all_probabilities': all_probabilities,
            'raw_predictions': predictions[0].tolist()
        }
    
    def batch_predict(self, image_arrays: list) -> list:
        """
        Make predictions on multiple images
        
        Args:
            image_arrays: List of preprocessed image arrays
            
        Returns:
            List of prediction dictionaries
        """
        results = []
        for img_array in image_arrays:
            result = self.predict(img_array)
            results.append(result)
        return results
    
    def get_model_info(self) -> Dict[str, any]:
        """
        Get information about the loaded model
        
        Returns:
            Dictionary with model information
        """
        if self.model is None:
            return {"error": "Model not loaded"}
        
        return {
            "model_loaded": True,
            "model_path": str(self.model_path),
            "input_shape": self.model.input_shape,
            "output_shape": self.model.output_shape,
            "total_params": self.model.count_params(),
            "class_names": self.class_names,
            "num_classes": len(self.class_names)
        }
    
    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return self.model is not None

# Singleton instance
_model_instance: Optional[CementClassifierModel] = None

def get_model(model_path: str, class_names_path: Optional[str] = None) -> CementClassifierModel:
    """
    Get or create the model instance (Singleton pattern)
    
    Args:
        model_path: Path to model file
        class_names_path: Path to class names JSON
        
    Returns:
        CementClassifierModel instance
    """
    global _model_instance
    if _model_instance is None:
        _model_instance = CementClassifierModel(model_path, class_names_path)
    return _model_instance