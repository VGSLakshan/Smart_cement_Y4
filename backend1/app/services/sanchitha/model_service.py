"""
Sanchitha - Crack Segmentation Service
Uses U-Net model for concrete crack detection and segmentation
"""
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import logging
from pathlib import Path
from typing import Tuple, Optional
import base64

logger = logging.getLogger(__name__)

class CrackSegmentationService:
    def __init__(self):
        self.model: Optional[tf.keras.Model] = None
        self.model_path = Path(__file__).parent.parent.parent.parent / "ml_models" / "sanchitha" / "unet_seg_crack.h5"
        self.input_size = (256, 256)  # Standard U-Net input size
        
    def load_model(self):
        """Load the U-Net crack segmentation model"""
        try:
            if self.model_path.exists():
                self.model = tf.keras.models.load_model(str(self.model_path), compile=False)
                logger.info(f"✅ Sanchitha U-Net model loaded from {self.model_path}")
                return True
            else:
                logger.error(f"❌ Model file not found at {self.model_path}")
                return False
        except Exception as e:
            logger.error(f"❌ Failed to load Sanchitha model: {str(e)}")
            return False
    
    def preprocess_image(self, image: Image.Image) -> np.ndarray:
        """Preprocess image for U-Net model"""
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize to model input size
        image = image.resize(self.input_size)
        
        # Convert to array and normalize
        img_array = np.array(image).astype(np.float32) / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    
    def postprocess_mask(self, prediction: np.ndarray, threshold: float = 0.5) -> np.ndarray:
        """Convert model output to binary mask"""
        # Remove batch dimension
        mask = prediction[0]
        
        # If model outputs multiple channels, take the crack channel
        if len(mask.shape) == 3 and mask.shape[-1] > 1:
            mask = mask[:, :, 0]
        elif len(mask.shape) == 3:
            mask = mask[:, :, 0]
        
        # Apply threshold to create binary mask
        binary_mask = (mask > threshold).astype(np.uint8) * 255
        
        return binary_mask
    
    def calculate_crack_metrics(self, binary_mask: np.ndarray) -> dict:
        """Calculate crack detection metrics"""
        total_pixels = binary_mask.size
        crack_pixels = np.sum(binary_mask > 0)
        crack_percentage = (crack_pixels / total_pixels) * 100
        
        return {
            "total_pixels": int(total_pixels),
            "crack_pixels": int(crack_pixels),
            "crack_percentage": round(float(crack_percentage), 2),
            "has_crack": crack_percentage > 0.06  # Consider as crack if >0.5% of pixels
        }
    
    def mask_to_base64(self, mask: np.ndarray) -> str:
        """Convert mask to base64 encoded PNG"""
        mask_image = Image.fromarray(mask, mode='L')
        buffer = io.BytesIO()
        mask_image.save(buffer, format='PNG')
        buffer.seek(0)
        return base64.b64encode(buffer.read()).decode('utf-8')
    
    async def predict(self, image_bytes: bytes, threshold: float = 0.5) -> dict:
        """
        Perform crack segmentation prediction
        
        Args:
            image_bytes: Raw image bytes
            threshold: Threshold for binary mask creation (0.0-1.0)
        
        Returns:
            Dictionary with prediction results
        """
        if self.model is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        try:
            # Load and preprocess image
            image = Image.open(io.BytesIO(image_bytes))
            original_size = image.size
            
            preprocessed = self.preprocess_image(image)
            
            # Perform prediction
            prediction = self.model.predict(preprocessed, verbose=0)
            
            # Postprocess to binary mask
            binary_mask = self.postprocess_mask(prediction, threshold)
            
            # Calculate metrics
            metrics = self.calculate_crack_metrics(binary_mask)
            
            # Resize mask back to original size
            mask_resized = Image.fromarray(binary_mask, mode='L').resize(original_size, Image.NEAREST)
            mask_resized_array = np.array(mask_resized)
            
            # Convert mask to base64 for easy transmission
            mask_base64 = self.mask_to_base64(mask_resized_array)
            
            return {
                "success": True,
                "metrics": metrics,
                "mask_base64": mask_base64,
                "original_size": original_size,
                "threshold": threshold,
                "message": "Crack detected" if metrics["has_crack"] else "No crack detected"
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            raise

# Global service instance
crack_service = CrackSegmentationService()
