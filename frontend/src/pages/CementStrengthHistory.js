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
  const [expandedPredictions, setExpandedPredictions] = useState(new Set());

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

  // Toggle prediction details
  const togglePrediction = (id) => {
    const newExpanded = new Set(expandedPredictions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedPredictions(newExpanded);
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
            {currentItems.map((pred) => {
              const isExpanded = expandedPredictions.has(pred._id || pred.id);
              
              return (
                <div key={pred._id || pred.id} className="prediction-card">
                  <div className="prediction-header">
                    <div className="prediction-info">
                      <div className="prediction-date">
                        {formatDate(pred.createdAt)}
                      </div>
                      <div className="prediction-summary">
                        <span className="summary-item">
                          <strong>Fineness:</strong> {pred.inputParameters?.grinding?.fineness} cm²/g
                        </span>
                        <span className="summary-divider">|</span>
                        <span className="summary-item">
                          <strong>28D Strength:</strong> {pred.predictions?.strength_28d?.toFixed(1)} MPa
                        </span>
                        <span className="summary-divider">|</span>
                        <span className="summary-item">
                          <strong>56D Strength:</strong> {pred.predictions?.strength_56d?.toFixed(1)} MPa
                        </span>
                      </div>
                    </div>
                    <div className="prediction-actions">
                      <button
                        onClick={() => togglePrediction(pred._id || pred.id)}
                        className="show-more-btn"
                      >
                        {isExpanded ? 'Show Less' : 'Show More'}
                      </button>
                      <button
                        onClick={() => handleDelete(pred._id || pred.id)}
                        className="delete-btn"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
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
                          <div className="param-item">
                            <span className="param-label">LOI:</span>
                            <span className="param-value">{pred.inputParameters?.grinding?.loi}%</span>
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
                          <span>K₂O: {pred.inputParameters?.chemicalComposition?.k2o}%</span>
                          <span>Na₂O: {pred.inputParameters?.chemicalComposition?.na2o}%</span>
                          <span>Cl: {pred.inputParameters?.chemicalComposition?.cl}%</span>
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
                  )}
                </div>
              );
            })}
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
          background: #f3f4f6;
        }

        .history-header {
          background: linear-gradient(135deg, #f8d3d3ff 0%, #fecaca 100%);
          color: #1f2937;
          padding: 2rem 2rem;
          text-align: center;
          box-shadow: 0 4px 20px rgba(220, 38, 38, 0.2);
          border-bottom: 3px solid #dc2626;
        }

        .history-header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 1.8rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: 800;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }

        .subtitle {
          margin: 0;
          opacity: 0.85;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #4b5563;
        }

        .btn-back {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          border: 2px solid #dc2626;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          transition: all 0.3s;
          margin-bottom: 0.75rem;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
        }

        .btn-back:hover {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-color: #ef4444;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.5);
          transform: translateY(-2px);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          max-width: 1400px;
          margin: -1.5rem auto 2rem;
          padding: 0 2rem;
        }

        .stat-card {
          background: white;
          padding: 1rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
          text-align: center;
          border-left: 4px solid #dc2626;
          border-top: 1px solid rgba(220, 38, 38, 0.3);
          transition: all 0.3s;
        }

        .stat-card:hover {
          border-left-color: #ef4444;
          box-shadow: 0 6px 16px rgba(220, 38, 38, 0.25);
          transform: translateY(-2px);
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 800;
          color: #1f2937;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.05);
        }

        .stat-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 0.5rem;
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
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.3);
          transition: all 0.3s;
        }

        .search-box:focus-within {
          border-color: #dc2626;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
        }

        .search-icon {
          color: #dc2626;
          flex-shrink: 0;
        }

        .search-box input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 1rem;
          width: 100%;
          background: transparent;
          color: #1f2937;
        }

        .search-box input::placeholder {
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.9rem;
        }

        .filter-controls {
          display: flex;
          gap: 1rem;
        }

        .filter-select {
          padding: 0.75rem 1rem;
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: 10px;
          background: white;
          color: #1f2937;
          font-size: 1rem;
          cursor: pointer;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.3s;
        }

        .filter-select:hover {
          border-color: #dc2626;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
        }

        .filter-select option {
          background: white;
        }

        .refresh-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
        }

        .refresh-btn:hover {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.5);
        }

        .predictions-count { max-width: 1400px;
          margin: 0 auto 1rem;
          padding: 0 2rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 0.85rem;
          font-weight: 600;
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
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.1);
          overflow: hidden;
          transition: all 0.3s;
          border-top: 3px solid #dc2626;
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-top: 3px solid #dc2626;
        }

        .prediction-card:hover {
          box-shadow: 0 8px 20px rgba(220, 38, 38, 0.2);
          transform: translateY(-2px);
          border-top-color: #ef4444;
        }

        .prediction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          background: rgba(220, 38, 38, 0.03);
          border-bottom: 1px solid rgba(220, 38, 38, 0.1);
        }

        .prediction-info {
          flex: 1;
        }

        .prediction-date {
          color: #dc2626;
          font-weight: 700;
          font-size: 0.95rem;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .prediction-summary {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: 0.5rem;
        }

        .summary-item {
          color: #1f2937;
          font-size: 0.9rem;
          background: rgba(220, 38, 38, 0.08);
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          border: 1px solid rgba(220, 38, 38, 0.2);
        }

        .summary-item strong {
          color: #dc2626;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .summary-divider {
          color: rgba(220, 38, 38, 0.3);
        }

        .prediction-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .show-more-btn {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 700;
          transition: all 0.2s;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);
        }

        .show-more-btn:hover {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 4px 10px rgba(220, 38, 38, 0.4);
          transform: translateY(-1px);
        }

        .delete-btn {
          background: rgba(220, 38, 38, 0.1);
          color: #fca5a5;
          border: 1px solid rgba(220, 38, 38, 0.3);
          padding: 0.6rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .delete-btn:hover {
          background: #dc2626;
          color: white;
          border-color: #dc2626;
        }

        .prediction-body {
          padding: 1.5rem;
          border-top: 1px solid rgba(220, 38, 38, 0.2);
          background: #f9fafb;
        }

        .section {
          margin-bottom: 1.5rem;
        }

        .section h4 {
          margin: 0 0 1rem 0;
          color: #dc2626;
          font-size: 1.1rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 700;
          border-bottom: 2px solid rgba(220, 38, 38, 0.3);
          padding-bottom: 0.5rem;
        }

        .params-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .param-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          background: white;
          border-radius: 6px;
          border: 1px solid rgba(220, 38, 38, 0.2);
          transition: all 0.2s;
        }

        .param-item:hover {
          background: rgba(220, 38, 38, 0.05);
          border-color: rgba(220, 38, 38, 0.3);
        }

        .param-label {
          color: #6b7280;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .param-value {
          font-weight: 700;
          color: #1f2937;
        }

        .chem-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.75rem;
          font-size: 0.9rem;
          color: #1f2937;
          font-weight: 600;
        }

        .chem-grid span {
          background: white;
          padding: 0.5rem;
          border-radius: 4px;
          border: 1px solid rgba(220, 38, 38, 0.2);
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
          background: white;
          border-radius: 8px;
          text-align: center;
          border: 2px solid rgba(220, 38, 38, 0.2);
          transition: all 0.3s;
        }

        .strength-item:hover {
          background: rgba(220, 38, 38, 0.05);
          border-color: rgba(220, 38, 38, 0.4);
        }

        .strength-item.highlight {
          background: #fef3c7;
          border-color: #fbbf24;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
        }

        .strength-day {
          font-weight: 700;
          color: #6b7280;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .strength-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1f2937;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.05);
        }

        .strength-item.highlight .strength-value {
          color: #d97706;
        }

        .model-info {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          flex-wrap: wrap;
        }

        .model-badge, .confidence-badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid;
        }

        .model-badge {
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(185, 28, 28, 0.1) 100%);
          color: #dc2626;
          border-color: rgba(220, 38, 38, 0.3);
        }

        .confidence-badge {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%);
          color: #16a34a;
          border-color: rgba(34, 197, 94, 0.3);
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
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          color: #1f2937;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .page-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          border-color: #dc2626;
          box-shadow: 0 4px 10px rgba(220, 38, 38, 0.3);
        }

        .page-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .page-info {
          color: #1f2937;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .loading-state, .error-state, .empty-state {
          max-width: 600px;
          margin: 4rem auto;
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 12px;
          border: 1px solid rgba(220, 38, 38, 0.3);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
        }

        .loading-state p, .error-state p {
          color: #1f2937;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(220, 38, 38, 0.2);
          border-top-color: #dc2626;
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
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
          transition: all 0.3s;
        }

        .retry-btn:hover {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.5);
        }

        .empty-state h3 {
          color: #1f2937;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .empty-state p {
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .history-header h1 {
            font-size: 1.3rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .stat-value {
            font-size: 1.5rem;
          }

          .history-controls {
            flex-direction: column;
          }

          .search-box {
            min-width: 100%;
          }

          .filter-controls {
            flex-wrap: wrap;
            width: 100%;
          }

          .filter-select, .refresh-btn {
            flex: 1;
          }

          .prediction-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .prediction-summary {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .summary-divider {
            display: none;
          }

          .prediction-actions {
            flex-direction: row;
            justify-content: flex-end;
          }

          .show-more-btn, .delete-btn {
            flex: 1;
          }

          .strength-timeline {
            flex-direction: column;
          }

          .params-grid {
            grid-template-columns: 1fr;
          }

          .chem-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

export default CementStrengthHistory;
