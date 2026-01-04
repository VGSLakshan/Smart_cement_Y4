import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import CompressiveStrengthDetail from './pages/CompressiveStrengthDetail';
import CementStrengthDetail from './pages/CementStrengthDetail';
import RawMealPages from './pages/RawMealPages';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'compressive-strength':
        return <CompressiveStrengthDetail />;
      case 'cement-strength':
        return <CementStrengthDetail />;
      case 'raw-meal':
        return <RawMealPages />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar onNavigate={setCurrentPage} currentPage={currentPage} />
      {renderPage()}
    </div>
  );
}