import React, { useState, useEffect } from 'react';
import '../App.css';

function CementStrengthHistory({ onNavigate }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDays, setFilterDays] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch predictions
  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = 'http://localhost:5000/api/cement-predictions';
      
      if (filterDays !== 'all') {
        url = `http://localhost:5000/api/cement-predictions/recent/${filterDays}?limit=100`;
      } else {
        url += '?limit=100&sortBy=createdAt&order=desc';
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch predictions');
      }

      const data = await response.json();
      setPredictions(data.data || data.predictions || []);
      
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/cement-predictions/statistics/summary');
      if (response.ok) {
        const data = await response.json();
        setStatistics(data.statistics);
      }
    } catch (err) {
      console.warn('Failed to fetch statistics:', err);
    }
  };

  useEffect(() => {
    fetchPredictions();
    fetchStatistics();
  }, [filterDays]);

  // Delete prediction
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prediction?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/cement-predictions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPredictions();
        fetchStatistics();
      } else {
        alert('Failed to delete prediction');
      }
    } catch (err) {
      alert('Error deleting prediction: ' + err.message);
    }
  };

  // Filter predictions by search term
  const filteredPredictions = predictions.filter(pred => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    const fineness = pred.inputParameters?.grinding?.fineness?.toString() || '';
    const strength28d = pred.predictions?.strength_28d?.toString() || '';
    const strength56d = pred.predictions?.strength_56d?.toString() || '';
    const date = new Date(pred.createdAt).toLocaleDateString();
    
    return (
      fineness.includes(search) ||
      strength28d.includes(search) ||
      strength56d.includes(search) ||
      date.includes(search)
    );
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPredictions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPredictions.length / itemsPerPage);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="cement-history-container">
      {/* Header */}
      <div className="history-header">
        <div className="header-content">
          <button 
            onClick={() => onNavigate && onNavigate('cement-strength')}
            className="btn-back">
            ← Back to Predictions
          </button>
          <h1>Cement Strength Prediction History</h1>
          <p className="subtitle">View and manage all past predictions</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-value">{statistics.totalPredictions}</div>
              <div className="stat-label">Total Predictions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-value">{statistics.average28dStrength?.toFixed(1)} MPa</div>
              <div className="stat-label">Avg 28D Strength</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-value">{statistics.average56dStrength?.toFixed(1)} MPa</div>
              <div className="stat-label">Avg 56D Strength</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-value">{statistics.recentPredictions7Days}</div>
              <div className="stat-label">Last 7 Days</div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="history-controls">
        <div className="search-box">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Search by fineness, strength, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <select 
            value={filterDays} 
            onChange={(e) => setFilterDays(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Time</option>
            <option value="1">Last 24 Hours</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
          
          <button onClick={fetchPredictions} className="refresh-btn">
            Refresh
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading predictions...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <p>❌ {error}</p>
          <button onClick={fetchPredictions} className="retry-btn">Try Again</button>
        </div>
      )}

      {/* Predictions List */}
      {!loading && !error && (
        <>
          <div className="predictions-count">
            Showing {currentItems.length} of {filteredPredictions.length} predictions
          </div>

          <div className="predictions-list">
            {currentItems.map((pred) => (
              <div key={pred._id || pred.id} className="prediction-card">
                <div className="prediction-header">
                  <div className="prediction-date">
                    {formatDate(pred.createdAt)}
                  </div>
                  <div className="prediction-actions">
                    <button
                      onClick={() => handleDelete(pred._id || pred.id)}
                      className="delete-btn"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="prediction-body">
                  {/* Input Parameters */}
                  <div className="section">
                    <h4>Grinding Parameters</h4>
                    <div className="params-grid">
                      <div className="param-item">
                        <span className="param-label">Initial Time:</span>
                        <span className="param-value">{pred.inputParameters?.grinding?.initial_min} min</span>
                      </div>
                      <div className="param-item">
                        <span className="param-label">Final Time:</span>
                        <span className="param-value">{pred.inputParameters?.grinding?.final_min} min</span>
                      </div>
                      <div className="param-item">
                        <span className="param-label">Fineness:</span>
                        <span className="param-value">{pred.inputParameters?.grinding?.fineness} cm²/g</span>
                      </div>
                      <div className="param-item">
                        <span className="param-label">Residue 45µm:</span>
                        <span className="param-value">{pred.inputParameters?.grinding?.residue_45um}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Chemical Composition */}
                  <div className="section">
                    <h4>Chemical Composition</h4>
                    <div className="chem-grid">
                      <span>SiO₂: {pred.inputParameters?.chemicalComposition?.sio2}%</span>
                      <span>Al₂O₃: {pred.inputParameters?.chemicalComposition?.al2o3}%</span>
                      <span>Fe₂O₃: {pred.inputParameters?.chemicalComposition?.fe2o3}%</span>
                      <span>CaO: {pred.inputParameters?.chemicalComposition?.cao}%</span>
                      <span>MgO: {pred.inputParameters?.chemicalComposition?.mgo}%</span>
                      <span>SO₃: {pred.inputParameters?.chemicalComposition?.so3}%</span>
                    </div>
                  </div>

                  {/* Predictions */}
                  <div className="section">
                    <h4>Predicted Strengths</h4>
                    <div className="strength-timeline">
                      {[
                        { label: '1D', value: pred.predictions?.strength_1d },
                        { label: '2D', value: pred.predictions?.strength_2d },
                        { label: '7D', value: pred.predictions?.strength_7d },
                        { label: '28D', value: pred.predictions?.strength_28d, highlight: true },
                        { label: '56D', value: pred.predictions?.strength_56d, highlight: true }
                      ].map((item, idx) => (
                        <div key={idx} className={`strength-item ${item.highlight ? 'highlight' : ''}`}>
                          <div className="strength-day">{item.label}</div>
                          <div className="strength-value">{item.value?.toFixed(1)} MPa</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Model Info */}
                  <div className="model-info">
                    <span className="model-badge">{pred.modelInfo?.modelUsed || 'Ensemble Model'}</span>
                    <span className="confidence-badge">{pred.modelInfo?.confidence || 'High'} Confidence</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="page-btn"
              >
                ← Previous
              </button>
              
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                Next →
              </button>
            </div>
          )}

          {/* Empty State */}
          {filteredPredictions.length === 0 && (
            <div className="empty-state">
              <h3>No predictions found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .cement-history-container {
          padding: 0;
          min-height: 100vh;
          background: #f5f7fa;
        }

        .history-header {
          background: linear-gradient(135deg, #f8d3d3ff 0%, #f8d3d3ff 100%);
          color: black;
          padding: 3rem 2rem;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .history-header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2.5rem;
        }

        .subtitle {
          margin: 0;
          opacity: 0.85;
          font-size: 1.1rem;
        }

        .btn-back {
          background: rgba(0,0,0,0.05);
          color: black;
          border: 2px solid rgba(0,0,0,0.2);
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
          margin-bottom: 1rem;
          font-size: 1rem;
        }

        .btn-back:hover {
          background: rgba(0,0,0,0.1);
          border-color: rgba(0,0,0,0.3);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          max-width: 1400px;
          margin: -2rem auto 2rem;
          padding: 0 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          text-align: center;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #2d3748;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #718096;
        }

        .history-controls {
          max-width: 1400px;
          margin: 0 auto 2rem;
          padding: 0 2rem;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 300px;
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: white;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .search-icon {
          color: #718096;
          flex-shrink: 0;
        }

        .search-box input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 1rem;
          width: 100%;
        }

        .filter-controls {
          display: flex;
          gap: 1rem;
        }

        .filter-select {
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          font-size: 1rem;
          cursor: pointer;
        }

        .refresh-btn {
          padding: 0.75rem 1.5rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .refresh-btn:hover {
          background: #5568d3;
          transform: translateY(-2px);
        }

        .predictions-count { max-width: 1400px;
          margin: 0 auto 1rem;
          padding: 0 2rem;
          color: #718096;
        }

        .predictions-list {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .prediction-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          overflow: hidden;
          transition: all 0.3s;
        }

        .prediction-card:hover {
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
          transform: translateY(-2px);
        }

        .prediction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #f7fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .prediction-date {
          color: #4a5568;
          font-weight: 600;
        }

        .delete-btn {
          background: #fee;
          color: #e53e3e;
          border: none;
          padding: 0.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .delete-btn:hover {
          background: #fc8181;
          color: white;
        }

        .prediction-body {
          padding: 1.5rem;
        }

        .section {
          margin-bottom: 1.5rem;
        }

        .section h4 {
          margin: 0 0 1rem 0;
          color: #2d3748;
          font-size: 1.1rem;
        }

        .params-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .param-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          background: #f7fafc;
          border-radius: 6px;
        }

        .param-label {
          color: #718096;
          font-size: 0.9rem;
        }

        .param-value {
          font-weight: 600;
          color: #2d3748;
        }

        .chem-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.75rem;
          font-size: 0.9rem;
          color: #4a5568;
        }

        .strength-timeline {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .strength-item {
          flex: 1;
          min-width: 100px;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 8px;
          text-align: center;
          border: 2px solid transparent;
        }

        .strength-item.highlight {
          background: #fef5e7;
          border-color: #f39c12;
        }

        .strength-day {
          font-weight: 700;
          color: #718096;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .strength-value {
          font-size: 1.3rem;
          font-weight: 700;
          color: #2d3748;
        }

        .model-info {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .model-badge, .confidence-badge {
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .model-badge {
          background: #e6f7ff;
          color: #0066cc;
        }

        .confidence-badge {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .pagination {
          max-width: 1400px;
          margin: 2rem auto;
          padding: 0 2rem;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
        }

        .page-btn {
          padding: 0.75rem 1.5rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .page-btn:hover:not(:disabled) {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          color: #4a5568;
          font-weight: 600;
        }

        .loading-state, .error-state, .empty-state {
          max-width: 600px;
          margin: 4rem auto;
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 12px;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e2e8f0;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .retry-btn {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .empty-state h3 {
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #718096;
        }

        @media (max-width: 768px) {
          .history-header h1 {
            font-size: 1.8rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .history-controls {
            flex-direction: column;
          }

          .search-box {
            min-width: 100%;
          }

          .filter-controls {
            flex-wrap: wrap;
          }

          .strength-timeline {
            flex-direction: column;
          }

          .params-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default CementStrengthHistory;
