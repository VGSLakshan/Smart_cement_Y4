// src/components/CementClickerImageAnalyser/ResultsPage.js
import React from 'react';

function ResultsPage({ analysisData, onReset }) {
  if (!analysisData) return null;

  console.log('Analysis Data:', analysisData); // Debug log

  const {
    predicted_class,
    confidence,
    all_probabilities,
    processing_time_ms,
    timestamp,
    filename,
    success
  } = analysisData;

  // Get phase information
  const getPhaseInfo = (phase) => {
    const phases = {
      'C2S': {
        name: 'Belite (Dicalcium Silicate)',
        color: '#3b82f6',
        description: 'Contributes to long-term strength development'
      },
      'C3S': {
        name: 'Alite (Tricalcium Silicate)',
        color: '#10b981',
        description: 'Primary contributor to early strength'
      },
      'C3A': {
        name: 'Tricalcium Aluminate',
        color: '#f59e0b',
        description: 'Affects setting time and heat generation'
      },
      'C4AF': {
        name: 'Brownmillerite (Tetracalcium Aluminoferrite)',
        color: '#ef4444',
        description: 'Contributes to color and minor strength'
      }
    };
    return phases[phase] || { name: phase, color: '#6b7280', description: 'Unknown phase' };
  };

  const phaseInfo = getPhaseInfo(predicted_class);
  const confidencePercent = (confidence * 100).toFixed(2);

  // Sort probabilities by value
  const sortedProbabilities = Object.entries(all_probabilities || {})
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="results-page">
      <div className="results-header">
        <h1 className="results-title">Cement Clinker Analysis Results</h1>
        <button className="btn btn-secondary" onClick={onReset}>
          Analyze New Image
        </button>
      </div>

      <div className="results-content">
        <div className="results-grid">
          {/* Detection Status */}
          <div className="results-card status-card">
            <h2>Detected Phase</h2>
            <div className="status-indicator detected">
              <div className="phase-icon" style={{ backgroundColor: phaseInfo.color }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </div>
              <h3>{predicted_class}</h3>
              <p className="phase-full-name">{phaseInfo.name}</p>
              <p className="confidence">Confidence: {confidencePercent}%</p>
              <div className="confidence-bar">
                <div 
                  className="confidence-fill" 
                  style={{ 
                    width: `${confidencePercent}%`,
                    backgroundColor: phaseInfo.color 
                  }}
                />
              </div>
            </div>
          </div>

          {/* All Probabilities */}
          <div className="results-card probabilities-card">
            <h2>All Phase Probabilities</h2>
            <div className="probabilities-list">
              {sortedProbabilities.map(([phase, probability]) => {
                const info = getPhaseInfo(phase);
                const percent = (probability * 100).toFixed(2);
                return (
                  <div key={phase} className="probability-item">
                    <div className="probability-header">
                      <span className="phase-label">
                        <span 
                          className="phase-dot" 
                          style={{ backgroundColor: info.color }}
                        />
                        {phase}
                      </span>
                      <span className="probability-value">{percent}%</span>
                    </div>
                    <div className="probability-bar">
                      <div 
                        className="probability-fill"
                        style={{ 
                          width: `${percent}%`,
                          backgroundColor: info.color 
                        }}
                      />
                    </div>
                    <p className="phase-description">{info.name}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phase Information */}
          <div className="results-card info-card">
            <h2>Phase Information</h2>
            <div className="info-content">
              <div className="info-section">
                <h4>{phaseInfo.name}</h4>
                <p>{phaseInfo.description}</p>
              </div>
              
              <div className="info-stats">
                <div className="stat-item">
                  <span className="stat-label">Processing Time</span>
                  <span className="stat-value">
                    {processing_time_ms ? `${processing_time_ms.toFixed(2)} ms` : 'N/A'}
                  </span>
                </div>
                {filename && (
                  <div className="stat-item">
                    <span className="stat-label">Filename</span>
                    <span className="stat-value">{filename}</span>
                  </div>
                )}
                {timestamp && (
                  <div className="stat-item">
                    <span className="stat-label">Analysis Time</span>
                    <span className="stat-value">
                      {new Date(timestamp).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Significance */}
          <div className="results-card recommendations-card">
            <h2>Clinical Significance</h2>
            <div className="recommendations-list">
              {predicted_class === 'C3S' && (
                <>
                  <div className="recommendation-item">
                    <div className="rec-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" strokeWidth="2"/>
                      </svg>
                    </div>
                    <p>High early strength development expected</p>
                  </div>
                  <div className="recommendation-item">
                    <div className="rec-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" strokeWidth="2"/>
                      </svg>
                    </div>
                    <p>Primary component for rapid setting applications</p>
                  </div>
                </>
              )}
              
              {predicted_class === 'C2S' && (
                <>
                  <div className="recommendation-item">
                    <div className="rec-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" strokeWidth="2"/>
                      </svg>
                    </div>
                    <p>Contributes to long-term strength and durability</p>
                  </div>
                  <div className="recommendation-item">
                    <div className="rec-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" strokeWidth="2"/>
                      </svg>
                    </div>
                    <p>Lower heat of hydration compared to C3S</p>
                  </div>
                </>
              )}
              
              {predicted_class === 'C3A' && (
                <>
                  <div className="recommendation-item">
                    <div className="rec-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" strokeWidth="2"/>
                      </svg>
                    </div>
                    <p>Fast hydration rate affects setting time</p>
                  </div>
                  <div className="recommendation-item">
                    <div className="rec-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" strokeWidth="2"/>
                      </svg>
                    </div>
                    <p>High heat generation during hydration</p>
                  </div>
                  <div className="recommendation-item">
                    <div className="rec-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" strokeWidth="2"/>
                      </svg>
                    </div>
                    <p>Susceptible to sulfate attack</p>
                  </div>
                </>
              )}
              
              {predicted_class === 'C4AF' && (
                <>
                  <div className="recommendation-item">
                    <div className="rec-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" strokeWidth="2"/>
                      </svg>
                    </div>
                    <p>Provides characteristic gray color to cement</p>
                  </div>
                  <div className="recommendation-item">
                    <div className="rec-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" strokeWidth="2"/>
                      </svg>
                    </div>
                    <p>Minor contribution to strength development</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Export Options */}
          <div className="results-card export-card">
            <h2>Export Report</h2>
            <div className="export-buttons">
              <button 
                className="btn btn-outline"
                onClick={() => {
                  const dataStr = JSON.stringify(analysisData, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `cement-analysis-${Date.now()}.json`;
                  link.click();
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2"/>
                  <polyline points="14 2 14 8 20 8" strokeWidth="2"/>
                </svg>
                Download JSON
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => {
                  const reportText = `
CEMENT CLINKER ANALYSIS REPORT
================================

Detected Phase: ${predicted_class}
Full Name: ${phaseInfo.name}
Confidence: ${confidencePercent}%
Processing Time: ${processing_time_ms?.toFixed(2) || 'N/A'} ms
Analysis Date: ${timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}

ALL PROBABILITIES:
${sortedProbabilities.map(([phase, prob]) => 
  `${phase}: ${(prob * 100).toFixed(2)}%`
).join('\n')}

Description: ${phaseInfo.description}
                  `.trim();
                  
                  const blob = new Blob([reportText], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `cement-report-${Date.now()}.txt`;
                  link.click();
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2"/>
                  <polyline points="7 10 12 15 17 10" strokeWidth="2"/>
                  <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2"/>
                </svg>
                Download Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;