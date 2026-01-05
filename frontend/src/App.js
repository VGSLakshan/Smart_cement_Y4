import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import CompressiveStrengthDetail from "./pages/CompressiveStrengthDetail";
import CementStrengthDetail from "./pages/CementStrengthDetail";
import RawMealPages from "./pages/RawMealPages";
import Login from "./pages/Login";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage("home"); // Reset to home page on logout
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <Home onNavigate={setCurrentPage} />;
      case "compressive-strength":
        return (
          <CompressiveStrengthDetail onBack={() => setCurrentPage("home")} />
        );
      case "cement-strength":
        return <CementStrengthDetail />;
      case "raw-meal":
        return <RawMealPages />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar
        onNavigate={setCurrentPage}
        currentPage={currentPage}
        onLogout={handleLogout}
      />
      {renderPage()}
    </div>
  );
}
