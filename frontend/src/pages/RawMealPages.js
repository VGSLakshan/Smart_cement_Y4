import React, { useState, useEffect } from "react";
import RawMealParticles from "./RawMealParticles";
import RawMealsPredictions from "./RawMealsPredictions";

export default function RawMealPages() {
  const [activeTab, setActiveTab] = useState("analyze");
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/particle-identification");
      const result = await response.json();
      if (result.success) setPredictions(result.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPrediction = () => {
    fetchPredictions();
  };

  const handleDeletePrediction = (id) => {
    setPredictions(predictions.filter((p) => p._id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Raw Meal Analysis Dashboard
      </h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b pb-3">

        <button
          onClick={() => setActiveTab("analyze")}
          className={`px-5 py-2 rounded-lg font-medium transition ${
            activeTab === "analyze"
              ? "bg-red-600 text-white shadow"
              : "bg-white text-gray-700 hover:bg-gray-200"
          }`}
        >
          Analyze Image
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-2 rounded-lg font-medium transition ${
            activeTab === "history"
              ? "bg-red-600 text-white shadow"
              : "bg-white text-gray-700 hover:bg-gray-200"
          }`}
        >
          Prediction History
        </button>

      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow p-6">

        {activeTab === "analyze" && (
          <RawMealParticles onNewPrediction={handleNewPrediction} />
        )}

        {activeTab === "history" && (
          <>
            {loading ? (
              <p className="text-center text-gray-500">
                Loading predictions...
              </p>
            ) : (
              <RawMealsPredictions
                predictions={predictions}
                onDelete={handleDeletePrediction}
              />
            )}
          </>
        )}

      </div>
    </div>
  );
}