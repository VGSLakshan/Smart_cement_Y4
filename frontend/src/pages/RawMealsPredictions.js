import React, { useState } from "react";
import { Trash2, FileDown, Filter } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RawMealsPredictions({ predictions, onDelete }) {
  const [filter, setFilter] = useState("all");

  const generateReport = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Raw Meal Particle Analysis Report", 14, 20);

    const tableData = predictions.map((item) => [
      item.sampleName,
      item.microscopic ? "Yes" : "No",
      item.particleCounts?.dark_red || 0,
      item.particleCounts?.light_red || 0,
      item.particleCounts?.white || 0,
      new Date(item.createdAt).toLocaleString(),
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["Sample", "Microscopic", "Dark Red", "Light Red", "White", "Date"]],
      body: tableData,
    });

    doc.save("RawMealParticleReport.pdf");
  };

  const filteredPredictions = predictions.filter((item) => {
    if (filter === "microscopic") return item.microscopic;
    if (filter === "non-microscopic") return !item.microscopic;
    return true;
  });

  if (predictions.length === 0) {
    return (
      <p className="text-gray-500 text-center mt-10 text-lg">
        No predictions yet
      </p>
    );
  }

  return (
    <div className="space-y-6">

      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">

        {/* Filters */}
        <div className="flex items-center gap-3 bg-white shadow rounded-xl p-2">
          <Filter size={18} className="text-gray-500 ml-2" />

          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === "all"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            All
          </button>

          <button
            onClick={() => setFilter("microscopic")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === "microscopic"
                ? "bg-green-600 text-white"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            Microscopic
          </button>

          <button
            onClick={() => setFilter("non-microscopic")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === "non-microscopic"
                ? "bg-red-600 text-white"
                : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}
          >
            Non-Microscopic
          </button>
        </div>

        {/* Report Button */}
        <button
          onClick={generateReport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow transition"
        >
          <FileDown size={18} />
          Download Report
        </button>
      </div>

      {/* Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {filteredPredictions.map((item) => (
          <div
            key={item._id}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
          >

            {/* Image */}
            <div className="relative">
              <img
                src={`http://localhost:5000/uploads/${item.sampleName}`}
                alt="Prediction"
                className="h-44 w-full object-cover"
              />

              {/* Delete Button */}
              <button
                onClick={() => onDelete(item._id)}
                className="absolute top-2 right-2 bg-white/90 backdrop-blur p-2 rounded-full shadow hover:text-red-600 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-3">

              {/* Date */}
              <p className="text-xs text-gray-500">
                {new Date(item.createdAt).toLocaleString()}
              </p>

              {/* Status Badge */}
              <span
                className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                  item.microscopic
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {item.microscopic
                  ? "Microscopic Image"
                  : "Not Microscopic"}
              </span>

              {/* Particle Data */}
              {!item.microscopic ? (
                <p className="text-red-600 font-medium text-sm text-center">
                  Not a Microscopic Image
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3 text-center pt-2">

                  <div className="bg-red-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Dark Red</p>
                    <p className="font-bold text-red-600 text-lg">
                      {item.particleCounts?.dark_red || 0}
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Light Red</p>
                    <p className="font-bold text-orange-500 text-lg">
                      {item.particleCounts?.light_red || 0}
                    </p>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-2">
                    <p className="text-xs text-gray-500">White</p>
                    <p className="font-bold text-gray-700 text-lg">
                      {item.particleCounts?.white || 0}
                    </p>
                  </div>

                </div>
              )}

            </div>
          </div>
        ))}

      </div>
    </div>
  );
}