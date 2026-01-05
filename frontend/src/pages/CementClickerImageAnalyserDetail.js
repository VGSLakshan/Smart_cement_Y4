// src/pages/CementClickerImageAnalyserDetail.js
import React, { useState } from 'react';
import CementClickerImageAnalyser from '../components/CementClickerImageAnalyser';
import '../components/CementClickerImageAnalyser/styles/CementClickerImageAnalyser.css';

export default function CementClickerImageAnalyserDetail() {
  const [currentView, setCurrentView] = useState('upload'); // 'upload' or 'results'
  const [analysisData, setAnalysisData] = useState(null);

  const handleAnalysisComplete = (data) => {
    setAnalysisData(data);
    setCurrentView('results');
  };

  const handleReset = () => {
    setCurrentView('upload');
    setAnalysisData(null);
  };

  return (
    <div className="flex-1 bg-gray-50">
      <CementClickerImageAnalyser 
        currentView={currentView}
        analysisData={analysisData}
        onAnalysisComplete={handleAnalysisComplete}
        onReset={handleReset}
      />
    </div>
  );
}