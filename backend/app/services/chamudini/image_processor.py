"""
Image Processing Service for Chamudini's Cement Classifier
File: backend/app/services/chamudini/image_processor.py
"""
import numpy as np
from PIL import Image
import io
import base64
from pathlib import Path
from typing import Union, Tuple

class ImageProcessor:
    """Handles image preprocessing for the cement clinker classifier"""
    
    def __init__(self, target_size: Tuple[int, int] = (224, 224)):
        self.target_size = target_size
    
    def load_from_file(self, file_path: Union[str, Path]) -> np.ndarray:
        """
        Load and preprocess image from file path
        
        Args:
            file_path: Path to image file
            
        Returns:
            Preprocessed image array ready for model input
        """
        img = Image.open(file_path)
        return self._preprocess_image(img)
    
    def load_from_bytes(self, image_bytes: bytes) -> np.ndarray:
        """
        Load and preprocess image from bytes
        
        Args:
            image_bytes: Image data as bytes
            
        Returns:
            Preprocessed image array ready for model input
        """
        img = Image.open(io.BytesIO(image_bytes))
        return self._preprocess_image(img)
    
    def load_from_base64(self, base64_string: str) -> np.ndarray:
        """
        Load and preprocess image from base64 string
        
        Args:
            base64_string: Base64 encoded image (with or without data URI prefix)
            
        Returns:
            Preprocessed image array ready for model input
        """
        # Remove data URI prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_bytes = base64.b64decode(base64_string)
        return self.load_from_bytes(image_bytes)
    
    def _preprocess_image(self, img: Image.Image) -> np.ndarray:
        """
        Preprocess PIL Image for model input
        
        Args:
            img: PIL Image object
            
        Returns:
            Preprocessed image array (1, height, width, 3) normalized to [0, 1]
        """
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to target size
        img = img.resize(self.target_size, Image.Resampling.LANCZOS)
        
        # Convert to numpy array
        img_array = np.array(img, dtype=np.float32)
        
        # Normalize to [0, 1]
        img_array = img_array / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    
    def validate_image(self, file_path: Union[str, Path]) -> Tuple[bool, str]:
        """
        Validate if file is a valid image
        
        Args:
            file_path: Path to file
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            img = Image.open(file_path)
            img.verify()  # Verify it's actually an image
            
            # Re-open after verify (verify closes the file)
            img = Image.open(file_path)
            
            # Check dimensions
            if img.size[0] < 50 or img.size[1] < 50:
                return False, "Image too small (minimum 50x50 pixels)"
            
            if img.size[0] > 5000 or img.size[1] > 5000:
                return False, "Image too large (maximum 5000x5000 pixels)"
            
            return True, ""
            
        except Exception as e:
            return False, f"Invalid image file: {str(e)}"
    
    def get_image_info(self, file_path: Union[str, Path]) -> dict:
        """
        Get information about an image
        
        Args:
            file_path: Path to image file
            
        Returns:
            Dictionary with image information
        """
        img = Image.open(file_path)
        return {
            "format": img.format,
            "mode": img.mode,
            "size": img.size,
            "width": img.width,
            "height": img.height
        }