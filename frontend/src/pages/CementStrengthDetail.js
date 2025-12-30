import React, { useState } from 'react';
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
    } catch (err) {
      setError(err.message || 'Failed to get prediction');
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
        <h1>🏗️ Cement Compressive Strength Prediction</h1>
        <p className="subtitle">Multi-Output Ensemble Model (XGBoost + LightGBM)</p>
        <p className="description">
          Predict cement compressive strength at 1D, 2D, 7D, 28D, and 56D using advanced machine learning
        </p>
      </div>

      <div className="content-wrapper">
        <div className="form-section">
          <div className="card">
            <div className="card-header">
              <h2>📊 Input Parameters</h2>
              <button onClick={loadSampleData} className="btn-secondary">
                Load Sample Data
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-section-group">
                <h3>⏱️ Grinding Parameters</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Initial Time (min)</label>
                    <input
                      type="number"
                      name="initial_min"
                      value={formData.initial_min}
                      onChange={handleInputChange}
                      placeholder="e.g., 30"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Final Time (min)</label>
                    <input
                      type="number"
                      name="final_min"
                      value={formData.final_min}
                      onChange={handleInputChange}
                      placeholder="e.g., 120"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Residue 45µm (%)</label>
                    <input
                      type="number"
                      name="residue_45um"
                      value={formData.residue_45um}
                      onChange={handleInputChange}
                      placeholder="e.g., 8.5"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fineness (cm²/g)</label>
                    <input
                      type="number"
                      name="fineness"
                      value={formData.fineness}
                      onChange={handleInputChange}
                      placeholder="e.g., 3200"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>L.O.I.</label>
                    <input
                      type="number"
                      name="loi"
                      value={formData.loi}
                      onChange={handleInputChange}
                      placeholder="e.g., 2.5"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section-group">
                <h3>🧪 Chemical Composition (%)</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>SiO₂</label>
                    <input
                      type="number"
                      name="sio2"
                      value={formData.sio2}
                      onChange={handleInputChange}
                      placeholder="e.g., 20.5"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Al₂O₃</label>
                    <input
                      type="number"
                      name="al2o3"
                      value={formData.al2o3}
                      onChange={handleInputChange}
                      placeholder="e.g., 5.2"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fe₂O₃</label>
                    <input
                      type="number"
                      name="fe2o3"
                      value={formData.fe2o3}
                      onChange={handleInputChange}
                      placeholder="e.g., 3.1"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>CaO</label>
                    <input
                      type="number"
                      name="cao"
                      value={formData.cao}
                      onChange={handleInputChange}
                      placeholder="e.g., 63.5"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>MgO</label>
                    <input
                      type="number"
                      name="mgo"
                      value={formData.mgo}
                      onChange={handleInputChange}
                      placeholder="e.g., 1.8"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>SO₃</label>
                    <input
                      type="number"
                      name="so3"
                      value={formData.so3}
                      onChange={handleInputChange}
                      placeholder="e.g., 2.3"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>K₂O</label>
                    <input
                      type="number"
                      name="k2o"
                      value={formData.k2o}
                      onChange={handleInputChange}
                      placeholder="e.g., 0.5"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Na₂O</label>
                    <input
                      type="number"
                      name="na2o"
                      value={formData.na2o}
                      onChange={handleInputChange}
                      placeholder="e.g., 0.3"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Cl</label>
                    <input
                      type="number"
                      name="cl"
                      value={formData.cl}
                      onChange={handleInputChange}
                      placeholder="e.g., 0.01"
                      step="0.001"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="button-group">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? '🔄 Predicting...' : '🚀 Predict Strength'}
                </button>
                <button type="button" onClick={handleReset} className="btn-secondary">
                  🔄 Reset
                </button>
              </div>
            </form>
          </div>
        </div>

        {error && (
          <div className="card error-card">
            <h3>❌ Error</h3>
            <p>{error}</p>
          </div>
        )}

        {prediction && prediction.success && (
          <div className="results-section">
            <div className="card">
              <div className="card-header">
                <h2>📈 Prediction Results</h2>
                <span className="badge">{prediction.predictions.model_used}</span>
              </div>

              <div className="results-grid">
                <div className="result-card strength-1d">
                  <div className="result-header">
                    <span className="result-icon">📊</span>
                    <span className="result-label">1-Day Strength</span>
                  </div>
                  <div className="result-value">
                    {prediction.predictions.strength_1d.toFixed(2)} MPa
                  </div>
                </div>

                <div className="result-card strength-2d">
                  <div className="result-header">
                    <span className="result-icon">📊</span>
                    <span className="result-label">2-Day Strength</span>
                  </div>
                  <div className="result-value">
                    {prediction.predictions.strength_2d.toFixed(2)} MPa
                  </div>
                </div>

                <div className="result-card strength-7d">
                  <div className="result-header">
                    <span className="result-icon">📊</span>
                    <span className="result-label">7-Day Strength</span>
                  </div>
                  <div className="result-value">
                    {prediction.predictions.strength_7d.toFixed(2)} MPa
                  </div>
                </div>

                <div className="result-card strength-28d">
                  <div className="result-header">
                    <span className="result-icon">⭐</span>
                    <span className="result-label">28-Day Strength</span>
                  </div>
                  <div className="result-value">
                    {prediction.predictions.strength_28d.toFixed(2)} MPa
                  </div>
                </div>

                <div className="result-card strength-56d">
                  <div className="result-header">
                    <span className="result-icon">🏆</span>
                    <span className="result-label">56-Day Strength</span>
                  </div>
                  <div className="result-value">
                    {prediction.predictions.strength_56d.toFixed(2)} MPa
                  </div>
                </div>
              </div>

              <div className="model-info">
                <div className="info-item">
                  <strong>Model Type:</strong> {prediction.predictions.model_used}
                </div>
                <div className="info-item">
                  <strong>Confidence:</strong> {prediction.predictions.confidence}
                </div>
                <div className="info-item">
                  <strong>Engineered Features:</strong> {prediction.engineered_features_count}
                </div>
              </div>

              <div className="strength-progression">
                <h3>📈 Strength Development Over Time</h3>
                <div className="progression-chart">
                  {[
                    { day: '1D', value: prediction.predictions.strength_1d },
                    { day: '2D', value: prediction.predictions.strength_2d },
                    { day: '7D', value: prediction.predictions.strength_7d },
                    { day: '28D', value: prediction.predictions.strength_28d },
                    { day: '56D', value: prediction.predictions.strength_56d }
                  ].map((item, idx) => {
                    const maxStrength = prediction.predictions.strength_56d;
                    const percentage = (item.value / maxStrength) * 100;
                    return (
                      <div key={idx} className="progression-bar-container">
                        <span className="progression-label">{item.day}</span>
                        <div className="progression-bar">
                          <div 
                            className="progression-fill" 
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="progression-value">{item.value.toFixed(1)} MPa</span>
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
      </div>

      <style jsx>{`
        .cement-strength-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }

        .header-section {
          text-align: center;
          color: white;
          margin-bottom: 3rem;
        }

        .header-section h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .subtitle {
          font-size: 1.2rem;
          opacity: 0.9;
          margin-bottom: 0.5rem;
        }

        .description {
          font-size: 1rem;
          opacity: 0.8;
        }

        .content-wrapper {
          display: grid;
          gap: 2rem;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e0e0e0;
        }

        .card-header h2 {
          margin: 0;
          color: #333;
          font-size: 1.5rem;
        }

        .badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .form-section-group {
          margin-bottom: 2rem;
        }

        .form-section-group h3 {
          color: #555;
          margin-bottom: 1rem;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #555;
          font-size: 0.9rem;
        }

        .form-group input {
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .button-group {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn-primary, .btn-secondary {
          padding: 1rem 2rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          flex: 1;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f5f5f5;
          color: #333;
        }

        .btn-secondary:hover {
          background: #e0e0e0;
        }

        .error-card {
          background: #fee;
          border-left: 4px solid #f44;
        }

        .error-card h3 {
          color: #c00;
          margin-top: 0;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .result-card {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
          transition: transform 0.3s ease;
        }

        .result-card:hover {
          transform: translateY(-5px);
        }

        .strength-28d {
          background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
        }

        .strength-56d {
          background: linear-gradient(135deg, #81ecec 0%, #00b894 100%);
        }

        .result-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .result-icon {
          font-size: 1.5rem;
        }

        .result-label {
          font-weight: 600;
          color: #555;
          font-size: 0.9rem;
        }

        .result-value {
          font-size: 2rem;
          font-weight: 700;
          color: #333;
        }

        .model-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .info-item {
          font-size: 0.95rem;
          color: #555;
        }

        .info-item strong {
          color: #333;
        }

        .strength-progression {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 2px solid #e0e0e0;
        }

        .strength-progression h3 {
          margin-bottom: 1.5rem;
          color: #333;
        }

        .progression-chart {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .progression-bar-container {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .progression-label {
          font-weight: 600;
          min-width: 50px;
          color: #555;
        }

        .progression-bar {
          flex: 1;
          height: 40px;
          background: #f0f0f0;
          border-radius: 20px;
          overflow: hidden;
          position: relative;
        }

        .progression-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 1rem;
          transition: width 0.6s ease;
          min-width: 80px;
        }

        .progression-value {
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .cement-strength-container {
            padding: 1rem;
          }

          .header-section h1 {
            font-size: 1.8rem;
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
        }
      `}</style>
    </div>
  );
}

export default CementStrengthPrediction;
