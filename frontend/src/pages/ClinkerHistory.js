import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import {
  History,
  Trash2,
  Eye,
  Download,
  Filter,
  Search,
  ArrowLeft,
  Calendar,
  BarChart3,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

const STRENGTH_BACKEND_URL = "http://localhost:5000";

export default function ClinkerHistory({ onBack }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [stats, setStats] = useState(null);
  const [selectedPrediction, setSelectedPrediction] = useState(null);

  useEffect(() => {
    fetchPredictions();
    fetchStatistics();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${STRENGTH_BACKEND_URL}/api/clinker-predictions?limit=100&sortBy=createdAt&order=desc`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch predictions");
      }

      const data = await response.json();
      setPredictions(data.data || []);
    } catch (err) {
      setError("Error loading predictions: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        `${STRENGTH_BACKEND_URL}/api/clinker-predictions/statistics/summary`,
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this prediction?")) {
      return;
    }

    try {
      const response = await fetch(
        `${STRENGTH_BACKEND_URL}/api/clinker-predictions/${id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete prediction");
      }

      setPredictions(predictions.filter((p) => p._id !== id));
      fetchStatistics(); // Refresh stats
    } catch (err) {
      alert("Error deleting prediction: " + err.message);
    }
  };

  const getPhaseColor = (phase) => {
    const colors = {
      C2S: "bg-blue-100 text-blue-800 border-blue-300",
      C3A: "bg-purple-100 text-purple-800 border-purple-300",
      C3S: "bg-green-100 text-green-800 border-green-300",
      C4AF: "bg-amber-100 text-amber-800 border-amber-300",
    };
    return colors[phase] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const exportToCSV = () => {
    const headers = [
      "Sample Name",
      "Predicted Class",
      "Confidence",
      "Rejected",
      "Date",
      "Image Path",
    ];

    const rows = filteredPredictions.map((p) => [
      p.sampleName,
      p.predictedClass,
      (p.confidence * 100).toFixed(2) + "%",
      p.rejected ? "Yes" : "No",
      new Date(p.createdAt).toLocaleString(),
      p.imagePath,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clinker-predictions-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPredictions = predictions.filter((p) => {
    const matchesSearch =
      p.sampleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.predictedClass.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterClass === "all" || p.predictedClass === filterClass;

    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <Navbar />
      <main className="flex-1 p-10 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Analyser
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <History className="h-8 w-8 text-red-600" />
                  Clinker Analysis History
                </h1>
                <p className="text-gray-600 mt-2">
                  View and manage all clinker phase classification results
                </p>
              </div>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-5 w-5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Total Predictions
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.total}
                    </p>
                  </div>
                  <BarChart3 className="h-10 w-10 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Avg Confidence</p>
                    <p className="text-3xl font-bold text-green-600">
                      {(stats.overallAvgConfidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Rejected</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {stats.rejectedCount}
                    </p>
                  </div>
                  <AlertCircle className="h-10 w-10 text-yellow-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Most Common</p>
                    <p className="text-xl font-bold text-purple-600">
                      {stats.classDistribution[0]?._id || "N/A"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.classDistribution[0]?.count || 0} predictions
                    </p>
                  </div>
                  <Calendar className="h-10 w-10 text-purple-600" />
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by sample name or class..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Classes</option>
                  <option value="C2S">C2S - Belite</option>
                  <option value="C3A">C3A - Tricalcium Aluminate</option>
                  <option value="C3S">C3S - Alite</option>
                  <option value="C4AF">C4AF - Brownmillerite</option>
                  <option value="cement_clinker_models">General Clinker</option>
                </select>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredPredictions.length} of {predictions.length}{" "}
              predictions
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          )}

          {/* Predictions Table */}
          {!loading && filteredPredictions.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
              <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Predictions Found
              </h3>
              <p className="text-gray-500">
                {searchTerm || filterClass !== "all"
                  ? "Try adjusting your filters"
                  : "Start analyzing clinker images to see results here"}
              </p>
            </div>
          )}

          {!loading && filteredPredictions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sample
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Predicted Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPredictions.map((prediction) => (
                      <tr
                        key={prediction._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <img
                              src={`${STRENGTH_BACKEND_URL}${prediction.imagePath}`}
                              alt={prediction.sampleName}
                              className="h-12 w-12 rounded object-cover border border-gray-200"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {prediction.sampleName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {prediction.originalFilename}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getPhaseColor(prediction.predictedClass)}`}
                          >
                            {prediction.predictedClass}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{
                                    width: `${prediction.confidence * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {(prediction.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {prediction.rejected ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Low Confidence
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Confident
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(prediction.createdAt).toLocaleDateString()}
                          <br />
                          <span className="text-xs">
                            {new Date(
                              prediction.createdAt,
                            ).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedPrediction(prediction)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(prediction._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detail Modal */}
          {selectedPrediction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Prediction Details
                    </h2>
                    <button
                      onClick={() => setSelectedPrediction(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image */}
                    <div>
                      <img
                        src={`${STRENGTH_BACKEND_URL}${selectedPrediction.imagePath}`}
                        alt={selectedPrediction.sampleName}
                        className="w-full rounded-lg border border-gray-200"
                      />
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Sample Name
                        </h3>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedPrediction.sampleName}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Predicted Class
                        </h3>
                        <span
                          className={`inline-flex px-4 py-2 text-sm font-semibold rounded-lg border ${getPhaseColor(selectedPrediction.predictedClass)}`}
                        >
                          {selectedPrediction.predictedClass}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Description
                        </h3>
                        <p className="text-sm text-gray-700">
                          {selectedPrediction.phaseDescription}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Confidence
                        </h3>
                        <p className="text-2xl font-bold text-green-600">
                          {(selectedPrediction.confidence * 100).toFixed(2)}%
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Top 3 Predictions
                        </h3>
                        <div className="space-y-2">
                          {selectedPrediction.top3Predictions.map(
                            (pred, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                              >
                                <span className="text-sm font-medium">
                                  {idx + 1}. {pred.class}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {(pred.confidence * 100).toFixed(2)}%
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500">
                          Date
                        </h3>
                        <p className="text-sm text-gray-700">
                          {new Date(
                            selectedPrediction.createdAt,
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* All Probabilities */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      All Phase Probabilities
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(selectedPrediction.allProbabilities || {})
                        .sort(([, a], [, b]) => b - a)
                        .map(([phase, probability]) => (
                          <div key={phase} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-gray-700">
                                {phase}
                              </span>
                              <span className="text-gray-600">
                                {(probability * 100).toFixed(2)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-red-600 h-2 rounded-full transition-all"
                                style={{ width: `${probability * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
