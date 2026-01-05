// src/components/CementClickerImageAnalyser/index.js
import React from 'react';
import ImageUploadScreen from './ImageUploadScreen';
import ResultsPage from './ResultsPage';

function CementClickerImageAnalyser({ 
  currentView, 
  analysisData, 
  onAnalysisComplete, 
  onReset 
}) {
  return (
    <div className="cement-clicker-container">
      {currentView === 'upload' ? (
        <ImageUploadScreen onAnalysisComplete={onAnalysisComplete} />
      ) : (
        <ResultsPage analysisData={analysisData} onReset={onReset} />
      )}
    </div>
  );
}

export default CementClickerImageAnalyser; // Make sure this line exists