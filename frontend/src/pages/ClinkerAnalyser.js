import React, { useState } from "react";
import Navbar from "../components/Navbar";
import {
  Upload,
  Image as ImageIcon,
  Loader,
  CheckCircle,
  XCircle,
  History,
} from "lucide-react";

const BACKEND_URL = "http://127.0.0.1:9000";
const STRENGTH_BACKEND_URL = "http://localhost:5000";

export default function ClinkerAnalyser({ onBack, onNavigate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setResult(null);
    setError("");

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setResult(null);
      setError("");
      setSaveStatus("");
      setPreview(URL.createObjectURL(file));
    }
  };

  const getPhaseDescription = (phase) => {
    const descriptions = {
      C2S: "Belite (Dicalcium Silicate) - Responsible for long-term strength development",
      C3A: "Tricalcium Aluminate - Fast hydration, affects early strength",
      C3S: "Alite (Tricalcium Silicate) - Main contributor to early strength",
      C4AF: "Brownmillerite (Tetracalcium Aluminoferrite) - Flux phase, affects color",
    };
    return descriptions[phase] || phase;
  };

  const saveToDatabase = async (predictionResult, imageFile) => {
    try {
      setSaveStatus("Saving to database...");

      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append(
        "sampleName",
        `Clinker-${new Date().toISOString().split("T")[0]}`
      );
      formData.append("predictedClass", predictionResult.predicted_class);
      formData.append("confidence", predictionResult.confidence);
      formData.append("rejected", predictionResult.rejected);
      formData.append("top3Predictions", JSON.stringify(predictionResult.top3));
      formData.append(
        "allProbabilities",
        JSON.stringify(predictionResult.all_probabilities)
      );
      formData.append(
        "phaseDescription",
        getPhaseDescription(predictionResult.predicted_class)
      );

      const response = await fetch(
        `${STRENGTH_BACKEND_URL}/api/clinker-predictions`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save to database");
      }

      const data = await response.json();
      setSaveStatus("✓ Saved to database successfully");
      
      // Clear save status after 3 seconds
      setTimeout(() => setSaveStatus(""), 3000);
      
      return data;
    } catch (err) {
      console.error("Error saving to database:", err);
      setSaveStatus("⚠ Failed to save to database");
      setTimeout(() => setSaveStatus(""), 5000);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chamudini/predict`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Prediction failed");
      }

      const data = await response.json();

      // Check if the response indicates an error
      if (!data.success) {
        setError(data.error || "Prediction failed");
        return;
      }

      // Transform backend1 YOLO11 response format
      const transformedResult = {
        success: data.success,
        predicted_class: data.result.predicted_class,
        confidence: data.result.confidence,
        all_probabilities: data.result.all_probabilities,
        rejected: data.result.rejected,
        top3: data.result.top3,
        filename: data.filename,
      };

      setResult(transformedResult);

      // Save to MongoDB database via strength-backend
      await saveToDatabase(transformedResult, selectedFile);
    } catch (err) {
      setError(
        err.message ||
          "Error connecting to backend1. Make sure the server is running on port 8001.",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError("");
    setSaveStatus("");
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

  return (
    <>
      <Navbar />
      <main className="flex-1 p-10 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={() => onNavigate && onNavigate("clinker-history")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <History className="h-5 w-5" />
                View History
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Cement Clinker Image Analyser
            </h1>
            <p className="text-gray-600 mt-2">
              Analyze the relationship between material composition and the
              internal temperature of cement cubes for enhanced performance.
            </p>
            
            {/* Save Status Indicator */}
            {saveStatus && (
              <div className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium ${
                saveStatus.includes("✓") 
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : saveStatus.includes("⚠")
                  ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                  : "bg-blue-50 text-blue-800 border border-blue-200"
              }`}>
                {saveStatus}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Upload Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Upload Clinker Image
              </h2>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 mb-2">
                  <strong>Analysis Types:</strong>
                </p>
                <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                  <li>
                    <strong>C2S</strong> - Belite (Dicalcium Silicate)
                  </li>
                  <li>
                    <strong>C3A</strong> - Tricalcium Aluminate
                  </li>
                  <li>
                    <strong>C3S</strong> - Alite (Tricalcium Silicate)
                  </li>
                  <li>
                    <strong>C4AF</strong> - Brownmillerite
                  </li>
                </ul>
              </div>

              {/* Upload Area */}
              {!preview ? (
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("fileInput").click()}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">
                    Drag and drop your image here, or click to browse
                  </p>
                  <p className="text-sm text-gray-400">
                    Supports: JPG, PNG, TIFF, BMP
                  </p>
                  <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Image Preview */}
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="rounded-lg w-full h-64 object-cover border border-gray-200"
                    />
                    <button
                      onClick={handleReset}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>

                  {/* File Info */}
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                    <p>
                      <strong>File:</strong> {selectedFile?.name}
                    </p>
                    <p>
                      <strong>Size:</strong>{" "}
                      {(selectedFile?.size / 1024).toFixed(2)} KB
                    </p>
                  </div>

                  {/* Analyze Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="animate-spin h-5 w-5" />
                        Analyzing...
                      </span>
                    ) : (
                      "Analyze Image"
                    )}
                  </button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>

            {/* Right Column - Results Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Analysis Results
              </h2>

              {!result && !loading && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <ImageIcon className="h-16 w-16 mb-4" />
                  <p>Upload an image to see analysis results</p>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader className="animate-spin h-12 w-12 text-red-600 mb-4" />
                  <p className="text-gray-600">Processing image...</p>
                </div>
              )}

              {result && result.success && (
                <div className="space-y-6">
                  {/* Low Confidence Warning */}
                  {result.rejected && (
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 flex items-start gap-3">
                      <XCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-yellow-900 mb-1">
                          Low Confidence Warning
                        </h3>
                        <p className="text-sm text-yellow-800">
                          The model's confidence is below the threshold. The
                          prediction may not be reliable. Please verify the
                          image quality and try again with a clearer image.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Main Prediction */}
                  <div
                    className={`rounded-lg border-2 p-6 ${getPhaseColor(result.predicted_class)}`}
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-2xl font-bold mb-2">
                          {result.predicted_class}
                        </h3>
                        <p className="text-sm mb-3">
                          {getPhaseDescription(result.predicted_class)}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            Confidence:
                          </span>
                          <span className="text-lg font-bold">
                            {(result.confidence * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* All Probabilities */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      All Phase Probabilities
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(result.all_probabilities)
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
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  phase === result.predicted_class
                                    ? "bg-red-600"
                                    : "bg-gray-400"
                                }`}
                                style={{ width: `${probability * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Processing Time */}
                  {/* File Info */}
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                    <p>
                      <strong>Filename:</strong> {result.filename}
                    </p>
                    {result.top3 && result.top3.length > 0 && (
                      <div className="mt-3">
                        <strong>Top 3 Predictions:</strong>
                        <ul className="mt-1 space-y-1">
                          {result.top3.map(([className, conf], idx) => (
                            <li key={idx}>
                              {idx + 1}. {className} - {(conf * 100).toFixed(2)}
                              %
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
