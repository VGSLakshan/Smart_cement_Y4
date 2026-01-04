import React, { useState, useEffect } from "react";
import RawMealParticles from "./RawMealParticles";
import RawMealsPredictions from "./RawMealsPredictions";

export default function RawMealPages() {
  const [activeTab, setActiveTab] = useState("analyze");
  const [predictions, setPredictions] = useState([]);

  // Load saved predictions
  useEffect(() => {
    const saved = localStorage.getItem("rawMealPredictions");
    if (saved) {
      setPredictions(JSON.parse(saved));
    }
  }, []);

  const handleNewPrediction = (prediction) => {
    const updated = [prediction, ...predictions];
    setPredictions(updated);
    localStorage.setItem("rawMealPredictions", JSON.stringify(updated));
  };

  const handleDeletePrediction = (indexToDelete) => {
    setPredictions((prev) =>
      prev.filter((_, index) => index !== indexToDelete)
    );
  };

  return (
    <div className="flex-1 p-6 bg-gray-100 min-h-screen">
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("analyze")}
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === "analyze"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Analyze Image
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === "history"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Previous Predictions
        </button>
      </div>

      {/* Content */}
      {activeTab === "analyze" && (
        <RawMealParticles onNewPrediction={handleNewPrediction} />
      )}

      {activeTab === "history" && (
        <RawMealsPredictions
          predictions={predictions}
          onDelete={handleDeletePrediction}   
        />
      )}
    </div>
  );
}
