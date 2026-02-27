import React, { useState } from 'react';
import { ClipboardList, FileEdit, Timer, Beaker, Rocket, RotateCcw, AlertTriangle, CheckCircle, BarChart3, TrendingUp, Award, Star, Bot, Target, Settings } from 'lucide-react';
import '../App.css';

function CementStrengthPrediction() {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
                <div className="progression-chart">
                  {[
                    { day: '1D', value: prediction.predictions.strength_1d, label: '1 Day' },
                    { day: '2D', value: prediction.predictions.strength_2d, label: '2 Days' },
                    { day: '7D', value: prediction.predictions.strength_7d, label: '7 Days' },
                    { day: '28D', value: prediction.predictions.strength_28d, label: '28 Days', highlight: true },
                    { day: '56D', value: prediction.predictions.strength_56d, label: '56 Days', highlight: true }
                  ].map((item, idx) => {
                    const maxStrength = prediction.predictions.strength_56d;
                    const percentage = (item.value / maxStrength) * 100;
                    return (
                      <div key={idx} className={`progression-item ${item.highlight ? 'highlight' : ''}`}>
                        <div className="progression-label-group">
                          <span className="progression-day">{item.day}</span>
                          <span className="progression-label">{item.label}</span>
                        </div>
                        <div className="progression-bar-wrapper">
                          <div className="progression-bar">
                            <div 
                              className="progression-fill" 
                              style={{ width: `${percentage}%` }}
                            >
                              <span className="progression-value">{item.value.toFixed(1)} MPa</span>
                            </div>
                          </div>
                          <span className="progression-percentage">{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .cement-strength-container {
          padding: 0;
          flex: 1;
          margin: 0;
          background: linear-gradient(135deg, #f4f1f1ff 0%, #f4f1f1ff 100%);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .header-section {
          background: linear-gradient(135deg, #f8d3d3ff 0%, #f8d3d3ff 100%);
          color: black;
          padding: 4rem 2rem 3rem;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .header-content {
          max-width: 900px;
          margin: 0 auto;
        }

        .header-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .header-section h1 {
          font-size: 2.8rem;
          margin-bottom: 0.8rem;
          font-weight: 700;
          text-shadow: 1px 1px 2px rgba(255,255,255,0.3);
          letter-spacing: -0.5px;
        }

        .subtitle {
          font-size: 1.3rem;
          opacity: 0.95;
          margin-bottom: 0.8rem;
          font-weight: 500;
        }

        .description {
          font-size: 1.05rem;
          opacity: 0.9;
          max-width: 700px;
          margin: 0 auto 1.5rem;
          line-height: 1.6;
        }

        .model-badges {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          margin-top: 1.5rem;
        }

        .badge {
          background: rgba(255,255,255,0.25);
          backdrop-filter: blur(10px);
          padding: 0.6rem 1.2rem;
          border-radius: 25px;
          font-size: 0.9rem;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
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
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          margin-bottom: 2rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #f0f0f0;
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .title-icon {
          font-size: 1.8rem;
        }

        .card-title h2 {
          margin: 0;
          color: #2d3748;
          font-size: 1.8rem;
          font-weight: 700;
        }

        .btn-load-sample {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          padding: 0.85rem 1.8rem;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .btn-load-sample:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
        }

        .form-section-group {
          margin-bottom: 2.5rem;
        }

        .section-header {
          margin-bottom: 1.5rem;
        }

        .section-header h3 {
          color: #2d3748;
          margin-bottom: 0.5rem;
          font-size: 1.4rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
        }

        .section-icon {
          font-size: 1.5rem;
        }

        .section-description {
          color: #718096;
          font-size: 0.95rem;
          margin: 0;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-weight: 600;
          margin-bottom: 0.6rem;
          color: #4a5568;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .unit {
          font-weight: 400;
          color: #a0aec0;
          font-size: 0.85rem;
        }

        .form-group input {
          padding: 0.85rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #f7fafc;
        }

        .form-group input:focus {
          outline: none;
          border-color: #ef4444;
          background: white;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
          transform: translateY(-1px);
        }

        .form-group input:hover:not(:focus) {
          border-color: #cbd5e0;
        }

        .button-group {
          display: flex;
          gap: 1.5rem;
          margin-top: 2.5rem;
          justify-content: center;
        }

        .btn-primary, .btn-secondary {
          padding: 1.1rem 2.5rem;
          border: none;
          border-radius: 12px;
          font-size: 1.05rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          min-width: 200px;
          justify-content: center;
        }

        .btn-primary {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.5);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          background: #f7fafc;
          color: #4a5568;
          border: 2px solid #e2e8f0;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #edf2f7;
          border-color: #cbd5e0;
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
          background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
          border-left: 4px solid #fc8181;
          animation: slideIn 0.3s ease-out;
        }

        .error-content {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
        }

        .error-icon {
          font-size: 2.5rem;
          flex-shrink: 0;
        }

        .error-card h3 {
          color: #c53030;
          margin: 0 0 0.5rem 0;
          font-size: 1.3rem;
        }

        .error-card p {
          color: #742a2a;
          margin: 0.3rem 0;
        }

        .error-hint {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .success-banner {
          background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
          color: #22543d;
          padding: 1.2rem 2rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(72, 187, 120, 0.2);
          animation: slideIn 0.5s ease-out;
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
          font-size: 1.5rem;
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
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          padding: 0.8rem 1.5rem;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .badge-label {
          font-size: 0.75rem;
          opacity: 0.9;
        }

        .badge-value {
          font-weight: 700;
          font-size: 0.95rem;
        }

        .confidence-indicator {
          display: flex;
          flex-direction: column;
          background: #f0fff4;
          color: #22543d;
          padding: 0.8rem 1.5rem;
          border-radius: 10px;
          border: 2px solid #c6f6d5;
        }

        .confidence-label {
          font-size: 0.75rem;
          color: #2f855a;
        }

        .confidence-value {
          font-weight: 700;
          font-size: 0.95rem;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .result-card {
          background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
          padding: 2rem;
          border-radius: 14px;
          text-align: center;
          transition: all 0.3s ease;
          border: 2px solid #e2e8f0;
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
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          border-color: #ef4444;
        }

        .result-card.highlight {
          background: linear-gradient(135deg, #fef5e7 0%, #fad7a0 100%);
          border-color: #f39c12;
        }

        .result-card.highlight::before {
          background: linear-gradient(90deg, #f39c12 0%, #e67e22 100%);
        }

        .result-badge {
          position: absolute;
          top: 0.8rem;
          right: 0.8rem;
          background: rgba(0,0,0,0.1);
          padding: 0.3rem 0.8rem;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .result-icon-wrapper {
          margin-bottom: 1rem;
        }

        .result-icon {
          font-size: 2.5rem;
          display: inline-block;
          animation: pulse 2s infinite;
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
          color: #4a5568;
          font-size: 0.95rem;
          margin-bottom: 0.8rem;
        }

        .result-value {
          font-size: 2.8rem;
          font-weight: 800;
          color: #2d3748;
          line-height: 1;
          margin-bottom: 0.3rem;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .result-card.highlight .result-value {
          background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .result-unit {
          font-size: 1rem;
          color: #718096;
          font-weight: 600;
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
          background: #f7fafc;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .info-card:hover {
          border-color: #ef4444;
          background: white;
          transform: translateX(5px);
        }

        .info-icon {
          font-size: 2.2rem;
          flex-shrink: 0;
        }

        .info-content {
          flex: 1;
        }

        .info-label {
          font-size: 0.85rem;
          color: #718096;
          margin-bottom: 0.3rem;
        }

        .info-value {
          font-weight: 700;
          color: #2d3748;
          font-size: 1.1rem;
        }

        .strength-progression {
          margin-top: 2.5rem;
          padding-top: 2.5rem;
          border-top: 2px solid #e2e8f0;
        }

        .strength-progression h3 {
          margin-bottom: 2rem;
          color: #2d3748;
          font-size: 1.5rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }

        .chart-icon {
          font-size: 1.7rem;
        }

        .progression-chart {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .progression-item {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.2rem;
          background: #f7fafc;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .progression-item:hover {
          background: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateX(5px);
        }

        .progression-item.highlight {
          background: linear-gradient(135deg, #fef5e7 0%, #fad7a0 100%);
        }

        .progression-label-group {
          display: flex;
          flex-direction: column;
          min-width: 80px;
        }

        .progression-day {
          font-weight: 700;
          font-size: 1.3rem;
          color: #2d3748;
        }

        .progression-label {
          font-size: 0.85rem;
          color: #718096;
        }

        .progression-bar-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .progression-bar {
          flex: 1;
          height: 46px;
          background: #e2e8f0;
          border-radius: 23px;
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .progression-fill {
          height: 100%;
          background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 1.2rem;
          transition: width 1s ease-out;
          min-width: 100px;
          position: relative;
        }

        .progression-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3));
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .progression-value {
          color: white;
          font-weight: 700;
          font-size: 1rem;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          position: relative;
          z-index: 1;
        }

        .progression-percentage {
          font-weight: 700;
          color: #4a5568;
          font-size: 1.1rem;
          min-width: 50px;
          text-align: right;
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

          .progression-item {
            flex-direction: column;
            align-items: stretch;
          }

          .progression-label-group {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}

export default CementStrengthPrediction;
