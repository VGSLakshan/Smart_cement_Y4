// src/services/api/cementClickerApi.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const analyzeCementImage = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cement-clicker/analyze`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary for FormData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw new Error(error.message || 'Failed to analyze image. Please check your connection and try again.');
  }
};

export const getAnalysisHistory = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/cement-clicker/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    throw error;
  }
};

export const downloadReport = async (analysisId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cement-clicker/report/${analysisId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cement-analysis-report-${analysisId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading report:', error);
    throw error;
  }
};