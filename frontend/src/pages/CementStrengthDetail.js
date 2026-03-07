import React, { useState } from 'react';
import { ClipboardList, FileEdit, Timer, Beaker, Rocket, RotateCcw, AlertTriangle, CheckCircle, BarChart3, TrendingUp, Award, Star, Bot, Target, Settings, History, ArrowLeft } from 'lucide-react';
import '../App.css';

function CementStrengthPrediction({ onNavigate }) {
  const [formData, setFormData] = useState({
    initial_min: '',
    final_min: '',
    residue_45um: '',
    fineness: '',
    loi: '',
    sio2: '',
    al2o3: '',
    fe2o3: '',
    cao: '',
    mgo: '',
    so3: '',
    k2o: '',
    na2o: '',
    cl: ''
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cementGrade, setCementGrade] = useState('OPC43'); // Default grade

  // Cement grade standards (ASTM/EN)
  const gradeStandards = {
    OPC33: { name: 'OPC 33 Grade', min28d: 33, min7d: 16, min2d: 10 },
    OPC43: { name: 'OPC 43 Grade', min28d: 43, min7d: 23, min2d: 13 },
    OPC53: { name: 'OPC 53 Grade', min28d: 53, min7d: 27, min2d: 16 }
  };

  // Evaluate quality status based on predicted strength
  const evaluateQuality = (predictedStrength, day, grade) => {
    const standard = gradeStandards[grade];
    if (!standard) return { status: 'unknown', color: 'gray', message: 'Unknown grade' };

    let minRequired = 0;
    if (day === '28D') minRequired = standard.min28d;
    else if (day === '7D') minRequired = standard.min7d;
    else if (day === '2D') minRequired = standard.min2d;
    else return { status: 'n/a', color: 'gray', message: 'No standard for this day' };

    const margin = ((predictedStrength - minRequired) / minRequired) * 100;

    if (predictedStrength >= minRequired + 5) {
      return {
        status: 'Pass',
        color: 'green',
        icon: '✓',
        message: `Exceeds ${standard.name} requirement by ${margin.toFixed(1)}%`,
        percentage: margin
      };
    } else if (predictedStrength >= minRequired) {
      return {
        status: 'Warning',
        color: 'orange',
        icon: '!',
        message: `Meets ${standard.name} requirement but low margin (+${margin.toFixed(1)}%)`,
        percentage: margin
      };
    } else {
      return {
        status: 'Reject',
        color: 'red',
        icon: '✕',
        message: `Below ${standard.name} requirement by ${Math.abs(margin).toFixed(1)}%`,
        percentage: margin
      };
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save prediction to MongoDB
  const savePredictionToDatabase = async (predictionData, inputData) => {
    try {
      const response = await fetch('http://localhost:5000/api/cement-predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputParameters: {
            grinding: {
              initial_min: parseFloat(inputData.initial_min),
              final_min: parseFloat(inputData.final_min),
              residue_45um: parseFloat(inputData.residue_45um),
              fineness: parseFloat(inputData.fineness),
              loi: parseFloat(inputData.loi)
            },
            chemicalComposition: {
              sio2: parseFloat(inputData.sio2),
              al2o3: parseFloat(inputData.al2o3),
              fe2o3: parseFloat(inputData.fe2o3),
              cao: parseFloat(inputData.cao),
              mgo: parseFloat(inputData.mgo),
              so3: parseFloat(inputData.so3),
              k2o: parseFloat(inputData.k2o),
              na2o: parseFloat(inputData.na2o),
              cl: parseFloat(inputData.cl)
            }
          },
          predictions: {
            strength_1d: predictionData.predictions.strength_1d,
            strength_2d: predictionData.predictions.strength_2d,
            strength_7d: predictionData.predictions.strength_7d,
            strength_28d: predictionData.predictions.strength_28d,
            strength_56d: predictionData.predictions.strength_56d
          },
          modelInfo: {
            modelUsed: predictionData.predictions.model_used || "Ensemble (XGBoost + LightGBM)",
            confidence: predictionData.predictions.confidence || "High",
            engineeredFeaturesCount: predictionData.engineered_features_count || 0
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Prediction saved to database:', result.data._id);
        return result.data._id;
      }
    } catch (error) {
      console.warn('⚠️ Failed to save prediction to database:', error.message);
      // Don't throw error - saving to DB is optional, prediction still works
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);
    setShowSuccess(false);

    try {
      // Convert all values to numbers
      const payload = Object.keys(formData).reduce((acc, key) => {
        acc[key] = parseFloat(formData[key]) || 0;
        return acc;
      }, {});

      const response = await fetch('http://localhost:8000/api/hirumi/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Prediction failed');
      }

      const data = await response.json();
      setPrediction(data);
      setShowSuccess(true);
      
      // Save to MongoDB database
      await savePredictionToDatabase(data, formData);
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(err.message || 'Failed to get prediction. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      initial_min: '',
      final_min: '',
      residue_45um: '',
      fineness: '',
      loi: '',
      sio2: '',
      al2o3: '',
      fe2o3: '',
      cao: '',
      mgo: '',
      so3: '',
      k2o: '',
      na2o: '',
      cl: ''
    });
    setPrediction(null);
    setError(null);
  };

  const loadSampleData = () => {
    setFormData({
      initial_min: '160',
      final_min: '200',
      residue_45um: '3.2',
      fineness: '3790',
      loi: '4.37',
      sio2: '30.05',
      al2o3: '10.45',
      fe2o3: '4.84',
      cao: '45.88',
      mgo: '1.5',
      so3: '2.02',
      k2o: '0.53',
      na2o: '0.31',
      cl: '0.025'
    });
  };

  return (
    <div className="cement-strength-container">
      <div className="header-section">
        <div className="header-content">
          
          <h1>Cement Compressive Strength Predictor</h1>
          <p className="subtitle">Advanced Multi-Output Ensemble Model</p>
          <p className="description">
            Predict cement compressive strength at 1D, 2D, 7D, 28D, and 56D using state-of-the-art machine learning algorithms
          </p>
          
          <button 
            onClick={() => onNavigate && onNavigate('cement-strength-history')}
            className="btn-view-history"
            type="button"
          >
            <History size={20} /> View Prediction History
          </button>
          
        </div>
      </div>

      <div className="content-wrapper">
        <div className="form-section">
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span className="title-icon"><ClipboardList size={24} /></span>
                <h2>Input Parameters</h2>
              </div>
              <button onClick={loadSampleData} className="btn-load-sample" type="button">
                <FileEdit size={18} /> Load Sample Data
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Cement Grade Selection */}
              <div className="form-section-group">
                <div className="section-header">
                  <h3><span className="section-icon"><Target size={20} /></span> Quality Standards</h3>
                  <p className="section-description">Select cement grade for automatic quality evaluation</p>
                </div>
                <div className="grade-selector">
                  {Object.keys(gradeStandards).map((grade) => (
                    <label key={grade} className={`grade-option ${cementGrade === grade ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="cementGrade"
                        value={grade}
                        checked={cementGrade === grade}
                        onChange={(e) => setCementGrade(e.target.value)}
                      />
                      <div className="grade-content">
                        <span className="grade-name">{gradeStandards[grade].name}</span>
                        <span className="grade-requirement">28D: ≥{gradeStandards[grade].min28d} MPa</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section-group">
                <div className="section-header">
                  <h3><span className="section-icon"><Timer size={20} /></span> Grinding Parameters</h3>
                  <p className="section-description">Physical properties and grinding specifications</p>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Initial Time <span className="unit">(minutes)</span></label>
                    <input
                      type="number"
                      name="initial_min"
                      value={formData.initial_min}
                      onChange={handleInputChange}
                      placeholder="e.g., 160"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Final Time <span className="unit">(minutes)</span></label>
                    <input
                      type="number"
                      name="final_min"
                      value={formData.final_min}
                      onChange={handleInputChange}
                      placeholder="e.g., 200"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Residue 45µm <span className="unit">(%)</span></label>
                    <input
                      type="number"
                      name="residue_45um"
                      value={formData.residue_45um}
                      onChange={handleInputChange}
                      placeholder="e.g., 3.2"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fineness <span className="unit">(cm²/g)</span></label>
                    <input
                      type="number"
                      name="fineness"
                      value={formData.fineness}
                      onChange={handleInputChange}
                      placeholder="e.g., 3790"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>L.O.I. <span className="unit">(Loss on Ignition)</span></label>
                    <input
                      type="number"
                      name="loi"
                      value={formData.loi}
                      onChange={handleInputChange}
                      placeholder="e.g., 4.37"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section-group">
                <div className="section-header">
                  <h3><span className="section-icon"><Beaker size={20} /></span> Chemical Composition</h3>
                  <p className="section-description">Oxide percentages in cement mixture</p>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>SiO₂ <span className="unit">(%)</span></label>
                    <input
                      type="number"
                      name="sio2"
                      value={formData.sio2}
                      onChange={handleInputChange}
                      placeholder="e.g., 30.05"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Al₂O₃ <span className="unit">(%)</span></label>
                    <input
                      type="number"
                      name="al2o3"
                      value={formData.al2o3}
                      onChange={handleInputChange}
                      placeholder="e.g., 10.45"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fe₂O₃ <span className="unit">(%)</span></label>
                    <input
                      type="number"
                      name="fe2o3"
                      value={formData.fe2o3}
                      onChange={handleInputChange}
                      placeholder="e.g., 4.84"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>CaO <span className="unit">(%)</span></label>
                    <input
                      type="number"
                      name="cao"
                      value={formData.cao}
                      onChange={handleInputChange}
                      placeholder="e.g., 45.88"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>MgO <span className="unit">(%)</span></label>
                    <input
                      type="number"
                      name="mgo"
                      value={formData.mgo}
                      onChange={handleInputChange}
                      placeholder="e.g., 1.5"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>SO₃ <span className="unit">(%)</span></label>
                    <input
                      type="number"
                      name="so3"
                      value={formData.so3}
                      onChange={handleInputChange}
                      placeholder="e.g., 2.02"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>K₂O <span className="unit">(%)</span></label>
                    <input
                      type="number"
                      name="k2o"
                      value={formData.k2o}
                      onChange={handleInputChange}
                      placeholder="e.g., 0.53"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Na₂O <span className="unit">(%)</span></label>
                    <input
                      type="number"
                      name="na2o"
                      value={formData.na2o}
                      onChange={handleInputChange}
                      placeholder="e.g., 0.31"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Cl <span className="unit">(%)</span></label>
                    <input
                      type="number"
                      name="cl"
                      value={formData.cl}
                      onChange={handleInputChange}
                      placeholder="e.g., 0.025"
                      step="0.001"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="button-group">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Rocket size={18} />
                      <span>Predict Strength</span>
                    </>
                  )}
                </button>
                <button type="button" onClick={handleReset} className="btn-secondary" disabled={loading}>
                  <RotateCcw size={18} />
                  <span>Reset Form</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {error && (
          <div className="card error-card">
            <div className="error-content">
              <div className="error-icon"><AlertTriangle size={48} /></div>
              <div>
                <h3>Prediction Error</h3>
                <p>{error}</p>
                <p className="error-hint">Please check if the backend server is running on port 8000</p>
              </div>
            </div>
          </div>
        )}

        {prediction && prediction.success && (
          <div className="results-section" id="results-section">
            {showSuccess && (
              <div className="success-banner">
                <span className="success-icon"><CheckCircle size={24} /></span>
                <span>Prediction completed successfully!</span>
              </div>
            )}
            
            <div className="card results-card">
              <div className="card-header">
                <div className="card-title">
                  <span className="title-icon"><BarChart3 size={24} /></span>
                  <h2>Prediction Results</h2>
                </div>
                <div className="model-badge-large">
                  <div className="badge-text">
                    <span className="badge-label">Model</span>
                    <span className="badge-value">{prediction.predictions.model_used}</span>
                  </div>
                  <div className="confidence-indicator">
                    <span className="confidence-label">Confidence</span>
                    <span className="confidence-value">{prediction.predictions.confidence}</span>
                  </div>
                </div>
              </div>

              {/* Overall Quality Assessment */}
              {(() => {
                const quality28d = evaluateQuality(prediction.predictions.strength_28d, '28D', cementGrade);
                return (
                  <div className={`overall-quality-banner quality-banner-${quality28d.color}`}>
                    <div className="banner-icon">{quality28d.icon}</div>
                    <div className="banner-content">
                      <div className="banner-title">
                        Quality Status: <strong>{quality28d.status}</strong> ({gradeStandards[cementGrade].name})
                      </div>
                      <div className="banner-message">{quality28d.message}</div>
                      {quality28d.status === 'Reject' && (
                        <div className="banner-recommendation">
                          <strong>Recommendation:</strong> Consider increasing fineness or adjusting chemical composition to meet strength requirements.
                        </div>
                      )}
                      {quality28d.status === 'Warning' && (
                        <div className="banner-recommendation">
                          <strong>Note:</strong> Strength meets minimum requirements but has low safety margin. Monitor quality closely.
                        </div>
                      )}
                      {quality28d.status === 'Pass' && (
                        <div className="banner-recommendation">
                          <strong>Excellent:</strong> Predicted strength significantly exceeds requirements with good safety margin.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="results-grid">
                <div className="result-card strength-1d">
                  <div className="result-icon-wrapper">
                    <div className="result-icon"><TrendingUp size={32} /></div>
                  </div>
                  <div className="result-content">
                    <div className="result-label">1-Day Strength</div>
                    <div className="result-value">{prediction.predictions.strength_1d.toFixed(2)}</div>
                    <div className="result-unit">MPa</div>
                  </div>
                </div>

                <div className="result-card strength-2d">
                  <div className="result-icon-wrapper">
                    <div className="result-icon"><TrendingUp size={32} /></div>
                  </div>
                  <div className="result-content">
                    <div className="result-label">2-Day Strength</div>
                    <div className="result-value">{prediction.predictions.strength_2d.toFixed(2)}</div>
                    <div className="result-unit">MPa</div>
                  </div>
                </div>

                <div className="result-card strength-7d">
                  <div className="result-icon-wrapper">
                    <div className="result-icon"><BarChart3 size={32} /></div>
                  </div>
                  <div className="result-content">
                    <div className="result-label">7-Day Strength</div>
                    <div className="result-value">{prediction.predictions.strength_7d.toFixed(2)}</div>
                    <div className="result-unit">MPa</div>
                  </div>
                </div>

                <div className="result-card strength-28d highlight">
                  <div className="result-badge">Standard</div>
                  <div className="result-icon-wrapper">
                    <div className="result-icon"><Star size={32} /></div>
                  </div>
                  <div className="result-content">
                    <div className="result-label">28-Day Strength</div>
                    <div className="result-value">{prediction.predictions.strength_28d.toFixed(2)}</div>
                    <div className="result-unit">MPa</div>
                  </div>
                </div>

                <div className="result-card strength-56d highlight">
                  <div className="result-badge">Long-term</div>
                  <div className="result-icon-wrapper">
                    <div className="result-icon"><Award size={32} /></div>
                  </div>
                  <div className="result-content">
                    <div className="result-label">56-Day Strength</div>
                    <div className="result-value">{prediction.predictions.strength_56d.toFixed(2)}</div>
                    <div className="result-unit">MPa</div>
                  </div>
                </div>
              </div>

              <div className="model-info-grid">
                <div className="info-card">
                  <div className="info-icon"><Bot size={28} /></div>
                  <div className="info-content">
                    <div className="info-label">Algorithm</div>
                    <div className="info-value">{prediction.predictions.model_used}</div>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon"><Target size={28} /></div>
                  <div className="info-content">
                    <div className="info-label">Confidence Level</div>
                    <div className="info-value">{prediction.predictions.confidence}</div>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon"><Settings size={28} /></div>
                  <div className="info-content">
                    <div className="info-label">Features Used</div>
                    <div className="info-value">{prediction.engineered_features_count}</div>
                  </div>
                </div>
              </div>

              <div className="strength-progression">
                <h3><span className="chart-icon"><TrendingUp size={20} /></span> Strength Development Timeline</h3>
                <p className="timeline-subtitle">Compressive strength progression over curing period</p>
                
                <div className="timeline-container">
                  <div className="timeline-line"></div>
                  {[
                    { day: '1D', value: prediction.predictions.strength_1d, label: '1 Day', color: '#e8f5e9', border: '#66bb6a' },
                    { day: '2D', value: prediction.predictions.strength_2d, label: '2 Days', color: '#e3f2fd', border: '#42a5f5' },
                    { day: '7D', value: prediction.predictions.strength_7d, label: '7 Days', color: '#fff3e0', border: '#ffa726' },
                    { day: '28D', value: prediction.predictions.strength_28d, label: '28 Days', color: '#fce4ec', border: '#ec407a', milestone: true },
                    { day: '56D', value: prediction.predictions.strength_56d, label: '56 Days', color: '#f3e5f5', border: '#ab47bc', milestone: true }
                  ].map((item, idx) => {
                    const maxStrength = prediction.predictions.strength_56d;
                    const percentage = (item.value / maxStrength) * 100;
                    const growth = idx > 0 ? ((item.value - [
                      prediction.predictions.strength_1d,
                      prediction.predictions.strength_2d,
                      prediction.predictions.strength_7d,
                      prediction.predictions.strength_28d
                    ][idx - 1]) / [
                      prediction.predictions.strength_1d,
                      prediction.predictions.strength_2d,
                      prediction.predictions.strength_7d,
                      prediction.predictions.strength_28d
                    ][idx - 1] * 100).toFixed(0) : 0;
                    
                    // Evaluate quality
                    const quality = evaluateQuality(item.value, item.day, cementGrade);
                    
                    return (
                      <div key={idx} className={`timeline-item ${item.milestone ? 'milestone' : ''}`}>
                        <div className="timeline-marker" style={{ borderColor: item.border }}>
                          <span className="timeline-icon">{item.day}</span>
                        </div>
                        <div className="timeline-content" style={{ backgroundColor: item.color, borderLeftColor: item.border }}>
                          <div className="timeline-header">
                            <div className="timeline-day-badge" style={{ backgroundColor: item.border }}>
                              {item.day}
                            </div>
                            <span className="timeline-label">{item.label}</span>
                          </div>
                          <div className="strength-value-display">
                            <span className="strength-number">{item.value.toFixed(1)}</span>
                            <span className="strength-unit">MPa</span>
                          </div>
                          
                          {/* Quality Status Badge */}
                          {quality.status !== 'n/a' && (
                            <div className={`quality-status quality-${quality.color}`}>
                              <span className="quality-icon">{quality.icon}</span>
                              <span className="quality-text">{quality.status}</span>
                            </div>
                          )}
                          
                          <div className="timeline-details">
                            <div className="detail-item">
                              <span className="detail-label">Progress:</span>
                              <span className="detail-value">{percentage.toFixed(0)}% of final</span>
                            </div>
                            {idx > 0 && (
                              <div className="detail-item growth">
                                <span className="detail-label">Growth:</span>
                                <span className="detail-value">+{growth}%</span>
                              </div>
                            )}
                            {quality.status !== 'n/a' && (
                              <div className="detail-item full-width">
                                <span className="quality-message">{quality.message}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Back to Dashboard Button */}
        <div className="back-button-container">
          <button 
            className="back-to-dashboard-btn"
            onClick={() => onNavigate && onNavigate('home')}
          >
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .cement-strength-container {
          padding: 0;
          flex: 1;
          margin: 0;
          background: #f3f4f6;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .header-section {
          background: linear-gradient(135deg, #f8d3d3ff 0%, #fecaca 100%);
          color: #1f2937;
          padding: 2rem 2rem 2rem;
          text-align: center;
          box-shadow: 0 4px 20px rgba(220, 38, 38, 0.2);
          border-bottom: 3px solid #dc2626;
        }

        .header-content {
          max-width: 900px;
          margin: 0 auto;
        }

        .header-icon {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .header-section h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .subtitle {
          font-size: 0.875rem;
          opacity: 0.9;
          margin-bottom: 0.5rem;
          font-weight: 500;
          letter-spacing: 0.2px;
        }

        .description {
          font-size: 0.875rem;
          opacity: 0.85;
          max-width: 700px;
          margin: 0 auto 1rem;
          line-height: 1.6;
          color: #6b7280;
        }

        .btn-view-history {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          background: #dc2626;
          color: white;
          border: 1px solid #dc2626;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
          box-shadow: 0 2px 6px rgba(220, 38, 38, 0.2);
          letter-spacing: 0.2px;
        }

        .btn-view-history:hover {
          background: #ef4444;
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(220, 38, 38, 0.3);
        }

        .model-badges {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          align-items: center;
          margin-top: 1rem;
        }

        .badge {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
          padding: 0.35rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
          border: 1px solid rgba(220, 38, 38, 0.2);
          box-shadow: 0 2px 4px rgba(220, 38, 38, 0.15);
          letter-spacing: 0.2px;
          color: #374151;
        }

        .content-wrapper {
          max-width: 1400px;
          margin: -2rem auto 0;
          padding: 0 2rem 4rem;
          position: relative;
          z-index: 10;
          width: 100%;
          box-sizing: border-box;
        }

        .card {
          background: white;
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
          margin-bottom: 2rem;
          border: 1px solid rgba(220, 38, 38, 0.1);
          border-top: 3px solid #dc2626;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid rgba(220, 38, 38, 0.2);
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .title-icon {
          font-size: 1.5rem;
        }

        .card-title h2 {
          margin: 0;
          color: #1f2937;
          font-size: 1.375rem;
          font-weight: 600;
          letter-spacing: 0.2px;
        }

        .btn-load-sample {
          background: #ef4444;
          color: white;
          padding: 0.65rem 1.25rem;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.2);
          letter-spacing: 0.2px;
        }

        .btn-load-sample:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(239, 68, 68, 0.3);
          background: #dc2626;
        }

        .form-section-group {
          margin-bottom: 2.5rem;
        }

        .section-header {
          margin-bottom: 1.5rem;
        }

        .section-header h3 {
          color: #dc2626;
          margin-bottom: 0.5rem;
          font-size: 1.125rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          letter-spacing: 0.2px;
        }

        .section-icon {
          font-size: 1.25rem;
        }

        .section-description {
          color: #6b7280;
          font-size: 0.875rem;
          margin: 0;
          font-weight: 400;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        }

        .grade-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .grade-option {
          position: relative;
          cursor: pointer;
          display: block;
        }

        .grade-option input[type="radio"] {
          position: absolute;
          opacity: 0;
        }

        .grade-content {
          padding: 1.2rem;
          border: 2px solid rgba(220, 38, 38, 0.2);
          border-radius: 10px;
          background: white;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          text-align: center;
        }

        .grade-option:hover .grade-content {
          border-color: rgba(220, 38, 38, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
        }

        .grade-option input[type="radio"]:checked + .grade-content {
          border-color: #dc2626;
          background: rgba(220, 38, 38, 0.05);
          box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
        }

        .grade-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.9375rem;
          letter-spacing: 0.2px;
        }

        .grade-requirement {
          font-size: 0.8125rem;
          color: #6b7280;
          font-weight: 500;
        }

        .grade-option input[type="radio"]:checked + .grade-content .grade-name {
          color: #dc2626;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #374151;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          letter-spacing: 0.2px;
        }

        .unit {
          font-weight: 400;
          color: #9ca3af;
          font-size: 0.8125rem;
        }

        .form-group input {
          padding: 0.75rem 0.875rem;
          border: 1px solid rgba(220, 38, 38, 0.25);
          border-radius: 8px;
          font-size: 0.9375rem;
          transition: all 0.2s ease;
          background: white;
          font-weight: 400;
        }

        .form-group input:focus {
          outline: none;
          border-color: #dc2626;
          background: white;
          box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
          transform: translateY(-1px);
        }

        .form-group input:hover:not(:focus) {
          border-color: rgba(220, 38, 38, 0.4);
        }

        .button-group {
          display: flex;
          gap: 1.5rem;
          margin-top: 2.5rem;
          justify-content: center;
        }

        .btn-primary, .btn-secondary {
          padding: 0.75rem 1.75rem;
          border: none;
          border-radius: 8px;
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 180px;
          justify-content: center;
          letter-spacing: 0.2px;
        }

        .btn-primary {
          background: #ef4444;
          color: white;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 3px 12px rgba(239, 68, 68, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          background: white;
          color: #1f2937;
          border: 2px solid rgba(220, 38, 38, 0.3);
        }

        .btn-secondary:hover:not(:disabled) {
          background: rgba(220, 38, 38, 0.05);
          border-color: #dc2626;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-card {
          background: #fff5f5;
          border-left: 4px solid #dc2626;
          animation: slideIn 0.3s ease-out;
        }

        .error-content {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
        }

        .error-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .error-card h3 {
          color: #dc2626;
          margin: 0 0 0.5rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          letter-spacing: 0.2px;
        }

        .error-card p {
          color: #991b1b;
          margin: 0.3rem 0;
          font-weight: 500;
        }

        .error-hint {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .success-banner {
          background: #f0fff4;
          color: #166534;
          padding: 1rem 1.5rem;
          border-radius: 10px;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 500;
          font-size: 0.9375rem;
          box-shadow: 0 2px 6px rgba(34, 197, 94, 0.15);
          animation: slideIn 0.5s ease-out;
          border: 1px solid #86efac;
          letter-spacing: 0.2px;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .success-icon {
          font-size: 1.25rem;
        }

        .results-card {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .model-badge-large {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .badge-text {
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          padding: 0.8rem 1.5rem;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        .badge-label {
          font-size: 0.75rem;
          opacity: 0.9;
          letter-spacing: 0.2px;
          font-weight: 500;
        }

        .badge-value {
          font-weight: 600;
          font-size: 0.9375rem;
        }

        .confidence-indicator {
          display: flex;
          flex-direction: column;
          background: #f0fff4;
          color: #166534;
          padding: 0.8rem 1.5rem;
          border-radius: 10px;
          border: 2px solid #86efac;
        }

        .confidence-label {
          font-size: 0.75rem;
          color: #16a34a;
          letter-spacing: 0.2px;
          font-weight: 500;
        }

        .confidence-value {
          font-weight: 600;
          font-size: 0.9375rem;
        }

        .overall-quality-banner {
          margin: 1.5rem 0 2rem 0;
          padding: 1.5rem;
          border-radius: 12px;
          display: flex;
          align-items: flex-start;
          gap: 1.2rem;
          border: 2px solid;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .quality-banner-green {
          background: #e8f5e9;
          border-color: #66bb6a;
          color: #1b5e20;
        }

        .quality-banner-orange {
          background: #fff3e0;
          border-color: #ffa726;
          color: #e65100;
        }

        .quality-banner-red {
          background: #ffebee;
          border-color: #ef5350;
          color: #b71c1c;
        }

        .banner-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .banner-content {
          flex: 1;
        }

        .banner-title {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          letter-spacing: 0.2px;
        }

        .banner-title strong {
          letter-spacing: 0.2px;
          font-weight: 600;
        }

        .banner-message {
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
          opacity: 0.9;
        }

        .banner-recommendation {
          font-size: 0.875rem;
          padding: 0.75rem;
          background: rgba(255,255,255,0.7);
          border-radius: 8px;
          margin-top: 0.75rem;
          font-weight: 500;
        }

        .banner-recommendation strong {
          font-weight: 600;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .result-card {
          background: white;
          padding: 2rem;
          border-radius: 14px;
          text-align: center;
          transition: all 0.3s ease;
          border: 2px solid rgba(220, 38, 38, 0.2);
          position: relative;
          overflow: hidden;
        }

        .result-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
        }

        .result-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(220, 38, 38, 0.2);
          border-color: #dc2626;
        }

        .result-card.highlight {
          background: #fef3c7;
          border-color: #fbbf24;
        }

        .result-card.highlight::before {
          background: linear-gradient(90deg, #f39c12 0%, #e67e22 100%);
        }

        .result-badge {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: rgba(220, 38, 38, 0.08);
          padding: 0.25rem 0.65rem;
          border-radius: 10px;
          font-size: 0.6875rem;
          font-weight: 500;
          letter-spacing: 0.2px;
          color: #dc2626;
          border: 1px solid rgba(220, 38, 38, 0.2);
        }

        .result-icon-wrapper {
          margin-bottom: 1rem;
        }

        .result-icon {
          font-size: 2rem;
          display: inline-block;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .result-content {
          margin-top: 0.5rem;
        }

        .result-label {
          font-weight: 600;
          color: #4b5563;
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
          letter-spacing: 0.2px;
        }

        .result-value {
          font-size: 2rem;
          font-weight: 700;
          color: #dc2626;
          line-height: 1;
          margin-bottom: 0.3rem;
        }

        .result-card.highlight .result-value {
          color: #d97706;
        }

        .result-unit {
          font-size: 0.875rem;
          color: #9ca3af;
          font-weight: 500;
        }

        .model-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .info-card {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          padding: 1.5rem;
          background: white;
          border-radius: 12px;
          border: 2px solid rgba(220, 38, 38, 0.2);
          transition: all 0.3s ease;
        }

        .info-card:hover {
          border-color: #dc2626;
          background: white;
          transform: translateX(5px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
        }

        .info-icon {
          font-size: 1.75rem;
          flex-shrink: 0;
        }

        .info-content {
          flex: 1;
        }

        .info-label {
          font-size: 0.8125rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
          letter-spacing: 0.2px;
          font-weight: 500;
        }

        .info-value {
          font-weight: 600;
          color: #1f2937;
          font-size: 1rem;
        }

        .strength-progression {
          margin-top: 2.5rem;
          padding-top: 2.5rem;
          border-top: 2px solid #e2e8f0;
        }

        .strength-progression h3 {
          margin-bottom: 0.5rem;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          letter-spacing: 0.2px;
        }

        .timeline-subtitle {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 1.75rem;
          font-style: italic;
        }

        .chart-icon {
          font-size: 1.375rem;
        }

        .timeline-container {
          position: relative;
          padding-left: 60px;
        }

        .timeline-line {
          position: absolute;
          left: 30px;
          top: 40px;
          bottom: 40px;
          width: 3px;
          background: linear-gradient(to bottom, 
            #66bb6a 0%, 
            #42a5f5 25%, 
            #ffa726 50%, 
            #ec407a 75%, 
            #ab47bc 100%);
          border-radius: 2px;
        }

        .timeline-item {
          position: relative;
          margin-bottom: 2rem;
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
        }

        .timeline-marker {
          position: absolute;
          left: -44px;
          top: 10px;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: white;
          border: 4px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          z-index: 2;
        }

        .timeline-icon {
          font-size: 0.75rem;
          font-weight: 600;
          color: #1f2937;
        }

        .timeline-item.milestone .timeline-marker {
          width: 50px;
          height: 50px;
          top: 6px;
          left: -48px;
          border-width: 5px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .timeline-content {
          flex: 1;
          padding: 1.3rem 1.5rem;
          border-radius: 12px;
          border-left: 5px solid;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.1);
          transition: all 0.2s ease;
        }

        .timeline-content:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(220, 38, 38, 0.15);
        }

        .timeline-header {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-bottom: 0.8rem;
        }

        .timeline-day-badge {
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 16px;
          font-weight: 600;
          font-size: 0.8125rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
          letter-spacing: 0.2px;
        }

        .timeline-label {
          font-weight: 600;
          color: #374151;
          font-size: 0.9375rem;
          letter-spacing: 0.2px;
        }

        .strength-value-display {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
          margin-bottom: 0.8rem;
        }

        .strength-number {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1f2937;
          line-height: 1;
        }

        .strength-unit {
          font-size: 0.9375rem;
          font-weight: 500;
          color: #6b7280;
        }

        .quality-status {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 16px;
          font-weight: 600;
          font-size: 0.8125rem;
          margin-top: 0.75rem;
          border: 1px solid;
          letter-spacing: 0.2px;
        }

        .quality-green {
          background: #e8f5e9;
          color: #2e7d32;
          border-color: #66bb6a;
        }

        .quality-orange {
          background: #fff3e0;
          color: #f57c00;
          border-color: #ffa726;
        }

        .quality-red {
          background: #ffebee;
          color: #c62828;
          border-color: #ef5350;
        }

        .quality-icon {
          font-size: 1.1rem;
        }

        .quality-text {
          letter-spacing: 0.2px;
          font-weight: 600;
        }

        .quality-message {
          color: #374151;
          font-size: 0.85rem;
          font-style: italic;
          line-height: 1.4;
          font-weight: 500;
        }

        .detail-item.full-width {
          flex-basis: 100%;
          background: transparent;
          padding: 0.6rem 0;
        }

        .timeline-details {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.8rem;
          background: rgba(220, 38, 38, 0.05);
          border-radius: 8px;
          font-size: 0.85rem;
          border: 1px solid rgba(220, 38, 38, 0.1);
        }

        .detail-item.growth {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.2);
        }

        .detail-label {
          color: #6b7280;
          font-weight: 500;
          letter-spacing: 0.2px;
          font-size: 0.75rem;
        }

        .detail-value {
          color: #1f2937;
          font-weight: 600;
        }

        .detail-item.growth .detail-value {
          color: #16a34a;
        }

        @media (max-width: 768px) {
          .cement-strength-container {
            padding: 0;
          }

          .header-section {
            padding: 3rem 1.5rem 2rem;
          }

          .header-section h1 {
            font-size: 2rem;
          }

          .content-wrapper {
            padding: 0 1rem 2rem;
          }

          .card {
            padding: 1.5rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .grade-selector {
            grid-template-columns: 1fr;
          }

          .overall-quality-banner {
            flex-direction: column;
            text-align: center;
          }

          .banner-icon {
            font-size: 2rem;
          }

          .button-group {
            flex-direction: column;
          }

          .results-grid {
            grid-template-columns: 1fr;
          }

          .model-badge-large {
            flex-direction: column;
            align-items: stretch;
          }

          .timeline-container {
            padding-left: 45px;
          }

          .timeline-line {
            left: 22px;
          }

          .timeline-marker {
            left: -37px;
            width: 36px;
            height: 36px;
          }

          .timeline-item.milestone .timeline-marker {
            width: 42px;
            height: 42px;
            left: -40px;
          }

          .timeline-icon {
            font-size: 1.2rem;
          }

          .timeline-content {
            padding: 1rem 1.2rem;
          }

          .strength-number {
            font-size: 1.8rem;
          }

          .timeline-details {
            gap: 0.8rem;
          }
        }

        .back-button-container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 2rem 2rem;
          text-align: center;
        }

        .back-to-dashboard-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
        }

        .back-to-dashboard-btn:hover {
          background: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
        }

        .back-to-dashboard-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

export default CementStrengthPrediction;
