// src/components/CementClickerImageAnalyser/ResultsPage.js
import React from 'react';

function ResultsPage({ analysisData, onReset }) {
  if (!analysisData) return null;

  const {
    image_url,
    crack_detected,
    crack_severity,
    crack_length,
    crack_width,
    affected_area,
    confidence_score,
    recommendations,
    analysis_date
  } = analysisData;

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="results-page">
      <div className="results-header">
        <h1 className="results-title">Analysis Results</h1>
        <button className="btn btn-secondary" onClick={onReset}>
          Analyze New Image
        </button>
      </div>

      <div className="results-content">
        <div className="results-grid">
          {/* Image Display */}
          <div className="results-card image-card">
            <h2>Analyzed Image</h2>
            <div className="analyzed-image">
              <img src={image_url} alt="Analyzed cement" />
            </div>
          </div>

          {/* Detection Status */}
          <div className="results-card status-card">
            <h2>Detection Status</h2>
            <div className={`status-indicator ${crack_detected ? 'detected' : 'no-crack'}`}>
              <div className="status-icon">
                {crack_detected ? (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeWidth="2"/>
                    <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2" strokeLinecap="round"/>
                    <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <h3>{crack_detected ? 'Cracks Detected' : 'No Cracks Detected'}</h3>
              <p className="confidence">Confidence: {(confidence_score * 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* Crack Metrics */}
          {crack_detected && (
            <>
              <div className="results-card metrics-card">
                <h2>Crack Severity</h2>
                <div className="severity-display">
                  <div 
                    className="severity-badge"
                    style={{ backgroundColor: getSeverityColor(crack_severity) }}
                  >
                    {crack_severity?.toUpperCase() || 'N/A'}
                  </div>
                  <div className="severity-meter">
                    <div className="meter-bar">
                      <div 
                        className="meter-fill"
                        style={{ 
                          width: crack_severity === 'low' ? '33%' : 
                                 crack_severity === 'medium' ? '66%' : '100%',
                          backgroundColor: getSeverityColor(crack_severity)
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="results-card metrics-card">
                <h2>Measurements</h2>
                <div className="metrics-grid">
                  <div className="metric-item">
                    <span className="metric-label">Crack Length</span>
                    <span className="metric-value">{crack_length || 'N/A'} mm</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Crack Width</span>
                    <span className="metric-value">{crack_width || 'N/A'} mm</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Affected Area</span>
                    <span className="metric-value">{affected_area || 'N/A'} cm²</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Analysis Date</span>
                    <span className="metric-value">
                      {analysis_date ? new Date(analysis_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Recommendations */}
          <div className="results-card recommendations-card">
            <h2>Recommendations</h2>
            <div className="recommendations-list">
              {recommendations && recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-item">
                    <div className="rec-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="9 11 12 14 22 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p>{rec}</p>
                  </div>
                ))
              ) : (
                <p className="no-recommendations">
                  {crack_detected 
                    ? 'No specific recommendations available. Please consult a structural engineer.'
                    : 'The cement structure appears to be in good condition. Continue regular monitoring.'}
                </p>
              )}
            </div>
          </div>

          {/* Export Options */}
          <div className="results-card export-card">
            <h2>Export Report</h2>
            <div className="export-buttons">
              <button className="btn btn-outline">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2"/>
                  <polyline points="14 2 14 8 20 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download PDF
              </button>
              <button className="btn btn-outline">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="7 10 12 15 17 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download Image
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;