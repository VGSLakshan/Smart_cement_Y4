import React, { useState, useRef } from 'react';
import ImagePreview from './ImagePreview';
import AnalysisProgress from './AnalysisProgress';

// Validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const validateImage = (file) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
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
      error: `File size exceeds 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  return { isValid: true, error: null };
};

/**
 * API function to connect to Chamudini's FastAPI backend
 * Endpoint: POST /chamudini/predict
 */
const analyzeCementImage = async (formData, onProgress) => {
  // Use the absolute path. Note: no trailing slash after 'predict'
  const API_BASE_URL = 'http://127.0.0.1:8000/api/chamudini/predict';
  
  try {
    onProgress(20);
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      body: formData, // Browser automatically sets Content-Type for FormData
    });

    if (response.status === 404) {
      // Logic for fallback: your main.py also has a global /api/predict
      console.warn("Chamudini route failed, trying global route...");
      const fallbackResponse = await fetch('http://127.0.0.1:8000/api/predict', {
        method: 'POST',
        body: formData,
      });
      if (!fallbackResponse.ok) throw new Error("Both endpoints returned 404");
      return await fallbackResponse.json();
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Analysis failed');
    }

    const data = await response.json();
    onProgress(100);
    return data;
  } catch (error) {
    throw error;
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
    setDragActive(e.type === "dragenter" || e.type === "dragover");
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
      // MUST match backend 'file: UploadFile' parameter
      formData.append('file', selectedImage);

      const result = await analyzeCementImage(formData, setProgress);
      
      // Artificial delay so user sees the 100% state
      setTimeout(() => {
        onAnalysisComplete(result);
      }, 600);
      
    } catch (err) {
      setError(err.message);
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="upload-screen">
      <div className="upload-header">
        <h1 className="upload-title">Cement Clinker Analyser</h1>
        <p className="upload-subtitle">
          Identify C2S, C3S, C3A, and C4AF phases using MobileNetV2
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
              <h3>Drag and drop microscopy image</h3>
              <p>or click to browse local files</p>
              <p className="upload-formats">Supported: JPG, PNG (Max 10MB)</p>
              
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
                  Change Image
                </button>
                <button className="btn btn-primary" onClick={handleAnalyze}>
                  Run Analysis
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
                  <h4>Analysis Failed</h4>
                  <p>{error}</p>
                  {error.includes('connect to server') && (
                    <div className="error-help">
                      <strong>Backend Checklist:</strong>
                      <ol>
                        <li>Verify <code>uvicorn app.main:app --reload</code> is running.</li>
                        <li>Check if <code>CHAMUDINI_MODEL_PATH</code> is valid in logs.</li>
                        <li>Ensure CORS is enabled in FastAPI.</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
              <button className="btn btn-primary btn-retry" onClick={handleAnalyze}>
                Retry Analysis
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImageUploadScreen;