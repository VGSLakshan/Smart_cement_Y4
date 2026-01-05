// src/components/CementClickerImageAnalyser/ImagePreview.js
import React from 'react';

function ImagePreview({ imageUrl, fileName }) {
  return (
    <div className="image-preview">
      <div className="preview-header">
        <h3>Image Preview</h3>
        <span className="file-name">{fileName}</span>
      </div>
      <div className="preview-image-wrapper">
        <img src={imageUrl} alt="Preview" className="preview-image" />
      </div>
    </div>
  );
}

export default ImagePreview;