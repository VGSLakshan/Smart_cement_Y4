// src/components/CementClickerImageAnalyser/ImageUploadScreen.js
import React, { useState, useRef } from 'react';
import ImagePreview from './ImagePreview';
import AnalysisProgress from './AnalysisProgress';

// Validation function
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const validateImage = (file) => {
  if (!file) {
    return {
      isValid: false,
      error: 'No file selected'
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload a JPG or PNG image.'
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds 10MB. Please upload a smaller image. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  return {
    isValid: true,
    error: null
  };
};

// API function to connect to Flask backend
const analyzeCementImage = async (formData, onProgress) => {
  const API_BASE_URL = 'http://localhost:8000/api/docs';
  
  try {
    onProgress(20); // Upload starting
    
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });

    onProgress(60); // Processing

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to analyze image');
    }

    onProgress(90); // Almost done
    const data = await response.json();
    onProgress(100); // Complete
    
    return data;
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:8000');
    }
    throw new Error(error.message || 'Failed to analyze image. Please try again.');
  }
};

function ImageUploadScreen({ onAnalysisComplete }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    setError(null);
    
    const validation = validateImage(file);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const result = await analyzeCementImage(formData, setProgress);
      
      // Small delay to show 100% completion
      setTimeout(() => {
        onAnalysisComplete(result);
      }, 500);
      
    } catch (err) {
      setError(err.message || 'Failed to analyze image. Please try again.');
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetry = () => {
    setError(null);
    handleAnalyze();
  };

  return (
    <div className="upload-screen">
      <div className="upload-header">
        <h1 className="upload-title">Cement Clicker Image Analyser</h1>
        <p className="upload-subtitle">
          Upload an image of cement cracks for AI-powered analysis
        </p>
      </div>

      {isAnalyzing ? (
        <AnalysisProgress progress={progress} />
      ) : (
        <div className="upload-content">
          {!imagePreview ? (
            <div
              className={`upload-dropzone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="17 8 12 3 7 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Drag and drop your image here</h3>
              <p>or click to browse</p>
              <p className="upload-formats">Supported formats: JPG, PNG, JPEG (Max 10MB)</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleChange}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="preview-container">
              <ImagePreview imageUrl={imagePreview} fileName={selectedImage?.name} />
              
              <div className="button-group">
                <button className="btn btn-secondary" onClick={handleReset}>
                  Choose Different Image
                </button>
                <button className="btn btn-primary" onClick={handleAnalyze}>
                  Analyze Image
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="error-container">
              <div className="error-message">
                <div className="error-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="error-content">
                  <h4>Error</h4>
                  <p>{error}</p>
                  {error.includes('Cannot connect to server') && (
                    <div className="error-help">
                      <strong>How to fix:</strong>
                      <ol>
                        <li>Open a terminal in your backend folder</li>
                        <li>Run: <code>python app.py</code> or <code>flask run</code></li>
                        <li>Make sure the server is running on port 8000</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
              <button className="btn btn-primary btn-retry" onClick={handleRetry}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="23 4 23 10 17 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImageUploadScreen;