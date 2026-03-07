import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle, AlertCircle, Calendar, Filter, RefreshCw, ArrowLeft } from 'lucide-react';

function ReportGeneration({ onNavigate }) {
  const [predictions, setPredictions] = useState([]);
  const [selectedPredictions, setSelectedPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterDays, setFilterDays] = useState('30');

  // Fetch predictions from the database
  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `http://localhost:5000/api/cement-predictions/recent/${filterDays}?limit=50`;
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

  useEffect(() => {
    fetchPredictions();
  }, [filterDays]);

  // Handle selection toggle
  const toggleSelection = (predictionId) => {
    setSelectedPredictions(prev => {
      if (prev.includes(predictionId)) {
        return prev.filter(id => id !== predictionId);
      } else {
        return [...prev, predictionId];
      }
    });
  };

  // Select all predictions
  const selectAll = () => {
    if (selectedPredictions.length === predictions.length) {
      setSelectedPredictions([]);
    } else {
      setSelectedPredictions(predictions.map(p => p._id));
    }
  };

  // Generate report
  const handleGenerateReport = async () => {
    if (selectedPredictions.length === 0) {
      setError('Please select at least one prediction to generate a report');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('http://localhost:8000/api/hirumi/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          predictionIds: selectedPredictions
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cement-strength-report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(`Successfully generated report for ${selectedPredictions.length} prediction(s)`);
      setSelectedPredictions([]);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="report-generation-container">
      {/* Header */}
      <div className="header-section">
        <div className="header-content">
          <button onClick={() => onNavigate('reports')} className="btn-back">
            <ArrowLeft size={20} />
            <span>Back to Report Selection</span>
          </button>
          <h1>Generate Reports</h1>
          <p className="subtitle">Cement Strength Prediction Reports</p>
          <p className="description">
            Select one or more predictions to generate a comprehensive PDF report
          </p>
        </div>
      </div>

      <div className="content-wrapper">
        {/* Controls Section */}
        <div className="card controls-card">
          <div className="controls-header">
            <div className="controls-title">
              <Filter size={20} />
              <h3>Filter & Select</h3>
            </div>
            <button onClick={fetchPredictions} className="btn-refresh" disabled={loading}>
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="controls-grid">
            <div className="control-group">
              <label>Time Period</label>
              <select 
                value={filterDays} 
                onChange={(e) => setFilterDays(e.target.value)}
                className="select-input"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div className="control-group">
              <label>Selection</label>
              <button onClick={selectAll} className="btn-select-all">
                {selectedPredictions.length === predictions.length && predictions.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            <div className="control-group">
              <label>Selected Count</label>
              <div className="count-badge">{selectedPredictions.length} / {predictions.length}</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Predictions Table */}
        <div className="card">
          <div className="card-header">
            <h2>Available Predictions</h2>
            <button 
              onClick={handleGenerateReport}
              disabled={selectedPredictions.length === 0 || generating}
              className="btn-generate"
            >
              {generating ? (
                <>
                  <div className="spinner"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Generate PDF Report</span>
                </>
              )}
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner-large"></div>
              <p>Loading predictions...</p>
            </div>
          ) : predictions.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <h3>No Predictions Found</h3>
              <p>There are no cement strength predictions available for the selected time period.</p>
              <button onClick={() => onNavigate('cement-strength')} className="btn-primary">
                Create New Prediction
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="predictions-table">
                <thead>
                  <tr>
                    <th className="th-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedPredictions.length === predictions.length && predictions.length > 0}
                        onChange={selectAll}
                      />
                    </th>
                    <th>Date</th>
                    <th>Fineness (cm²/g)</th>
                    <th>1-Day (MPa)</th>
                    <th>7-Day (MPa)</th>
                    <th>28-Day (MPa)</th>
                    <th>56-Day (MPa)</th>
                    <th>Model</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((pred) => (
                    <tr 
                      key={pred._id}
                      className={selectedPredictions.includes(pred._id) ? 'selected' : ''}
                      onClick={() => toggleSelection(pred._id)}
                    >
                      <td className="td-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedPredictions.includes(pred._id)}
                          onChange={() => toggleSelection(pred._id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td>{formatDate(pred.createdAt)}</td>
                      <td>{pred.inputParameters?.grinding?.fineness || 'N/A'}</td>
                      <td className="strength-value">{pred.predictions?.strength_1d?.toFixed(2) || 'N/A'}</td>
                      <td className="strength-value">{pred.predictions?.strength_7d?.toFixed(2) || 'N/A'}</td>
                      <td className="strength-value highlight">{pred.predictions?.strength_28d?.toFixed(2) || 'N/A'}</td>
                      <td className="strength-value">{pred.predictions?.strength_56d?.toFixed(2) || 'N/A'}</td>
                      <td>
                        <span className="model-badge">{pred.predictions?.model_used || 'N/A'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .report-generation-container {
          padding: 0;
          flex: 1;
          margin: 0;
          background: #f9fafb;
          min-height: 100vh;
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
          position: relative;
        }

        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.9);
          color: #1f2937;
          border: 1px solid rgba(31, 41, 55, 0.2);
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 1rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .btn-back:hover {
          background: white;
          border-color: #dc2626;
          color: #dc2626;
          transform: translateX(-3px);
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
        }

        .header-icon {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
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
          margin: 0 auto;
          line-height: 1.6;
          color: #6b7280;
        }

        .content-wrapper {
          max-width: 1400px;
          margin: -2rem auto 0;
          padding: 0 2rem 4rem;
          position: relative;
          z-index: 10;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.1);
          margin-bottom: 2rem;
          border: 1px solid rgba(220, 38, 38, 0.1);
          border-top: 3px solid #dc2626;
        }

        .controls-card {
          padding: 1.5rem;
        }

        .controls-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .controls-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #374151;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .btn-refresh {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-refresh:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #dc2626;
          color: #dc2626;
        }

        .btn-refresh:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .controls-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .control-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #4b5563;
        }

        .select-input {
          padding: 0.625rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9375rem;
          color: #374151;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .select-input:focus {
          outline: none;
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        .btn-select-all {
          padding: 0.625rem 1rem;
          background: white;
          border: 1px solid #dc2626;
          border-radius: 6px;
          color: #dc2626;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-select-all:hover {
          background: #dc2626;
          color: white;
        }

        .count-badge {
          padding: 0.625rem 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          font-size: 0.9375rem;
          font-weight: 600;
          text-align: center;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .alert-error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .alert-success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #86efac;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid rgba(220, 38, 38, 0.1);
        }

        .card-header h2 {
          margin: 0;
          color: #1f2937;
          font-size: 1.375rem;
          font-weight: 600;
        }

        .btn-generate {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
        }

        .btn-generate:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(16, 185, 129, 0.3);
        }

        .btn-generate:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .spinner-large {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(220, 38, 38, 0.2);
          border-top-color: #dc2626;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #6b7280;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .empty-state h3 {
          color: #374151;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0.5rem 0;
        }

        .empty-state p {
          margin: 0 0 1.5rem 0;
        }

        .btn-primary {
          padding: 0.75rem 1.75rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          background: #b91c1c;
          transform: translateY(-1px);
        }

        .table-container {
          overflow-x: auto;
        }

        .predictions-table {
          width: 100%;
          border-collapse: collapse;
        }

        .predictions-table thead {
          background: #f9fafb;
          border-bottom: 2px solid #e5e7eb;
        }

        .predictions-table th {
          padding: 0.875rem 1rem;
          text-align: left;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #4b5563;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .th-checkbox {
          width: 40px;
          text-align: center;
        }

        .predictions-table td {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          font-size: 0.875rem;
          color: #374151;
        }

        .td-checkbox {
          text-align: center;
        }

        .predictions-table tbody tr {
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .predictions-table tbody tr:hover {
          background: #f9fafb;
        }

        .predictions-table tbody tr.selected {
          background: #fef2f2;
        }

        .strength-value {
          font-weight: 600;
          color: #1f2937;
        }

        .strength-value.highlight {
          color: #dc2626;
          font-weight: 700;
        }

        .model-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: #eff6ff;
          color: #1e40af;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #dc2626;
        }

        @media (max-width: 768px) {
          .controls-grid {
            grid-template-columns: 1fr;
          }

          .card-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .table-container {
            overflow-x: scroll;
          }
        }
      `}</style>
    </div>
  );
}

export default ReportGeneration;
