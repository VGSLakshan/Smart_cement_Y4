import React from 'react';
import { FileText } from 'lucide-react';

function ReportSelection({ onNavigate }) {
  return (
    <div className="report-selection-container">
      <div className="header-section">
        <h1>Report Generation</h1>
      </div>

      <div className="content-wrapper">
        <div className="report-card">
          <h3>Cement Strength Prediction Reports</h3>
          <button 
            className="btn-generate"
            onClick={() => onNavigate('cement-strength-reports')}
          >
            <FileText size={18} />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .report-selection-container {
          padding: 0;
          flex: 1;
          margin: 0;
          background: #f9fafb;
          min-height: 100vh;
        }

        .header-section {
          background: #fff;
          padding: 1.5rem 2rem;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border-bottom: 1px solid #e5e7eb;
        }

        .header-section h1 {
          font-size: 1.5rem;
          margin: 0;
          font-weight: 600;
          color: #111827;
        }

        .content-wrapper {
          max-width: 600px;
          margin: 3rem auto;
          padding: 0 2rem;
        }

        .report-card {
          background: white;
          border-radius: 10px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          border: 1px solid #e5e7eb;
          text-align: center;
        }

        .report-card h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 1.5rem 0;
        }

        .btn-generate {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-generate:hover {
          background: #b91c1c;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .content-wrapper {
            padding: 0 1rem;
            margin: 2rem auto;
          }

          .header-section {
            padding: 1.25rem 1rem;
          }

          .header-section h1 {
            font-size: 1.25rem;
          }

          .report-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default ReportSelection;
