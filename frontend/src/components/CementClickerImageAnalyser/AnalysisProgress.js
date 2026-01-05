// src/components/CementClickerImageAnalyser/AnalysisProgress.js
import React from 'react';

function AnalysisProgress() {
  return (
    <div className="analysis-progress">
      <div className="progress-content">
        <div className="spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <h3>Analyzing Image...</h3>
        <p>Our AI is processing your image to detect cracks and structural issues</p>
        <div className="progress-steps">
          <div className="step active">
            <div className="step-icon">1</div>
            <span>Uploading</span>
          </div>
          <div className="step active">
            <div className="step-icon">2</div>
            <span>Processing</span>
          </div>
          <div className="step">
            <div className="step-icon">3</div>
            <span>Analyzing</span>
          </div>
          <div className="step">
            <div className="step-icon">4</div>
            <span>Complete</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalysisProgress;