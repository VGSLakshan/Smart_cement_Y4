import React, { useState } from "react";

export default function RawMealParticles({ onNewPrediction }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setResult(null);
    setError("");

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/kanchana/predict",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Prediction failed");
      }

      const data = await response.json();
      setResult(data.counts);

      onNewPrediction({
        image: preview,
        counts: data.counts,
        date: new Date().toLocaleString(),
      });
    } catch (err) {
      setError("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
    <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-xl">

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
        Cement Raw Meal Particle Analysis
      </h1>

      {/* Subtitle */}
      <p className="text-sm text-gray-500 text-center mb-6">
        AI Based Color Particle Dectection Of Microscopic Images
      </p>

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-700 mb-2">
          <strong>Purpose:</strong> This component analyzes microscopic images of cement raw meal
          and automatically counts particles based on color composition.
        </p>

        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
          <li>Detects <span className="font-medium">Dark Red</span>, <span className="font-medium">Light Red</span>, and <span className="font-medium">White</span> particles</li>
        </ul>
      </div>

      {/* Steps */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          How it works
        </h2>

        <div className="grid grid-cols-3 gap-3 text-xs text-center">
          <div className="bg-red-50 rounded-lg p-3">
            <p className="font-semibold text-red-600">Step 1</p>
            <p className="text-gray-600">Upload image</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-3">
            <p className="font-semibold text-orange-600">Step 2</p>
            <p className="text-gray-600">Click Analyze Image</p>
          </div>

          <div className="bg-gray-200 rounded-lg p-3">
            <p className="font-semibold text-gray-700">Step 3</p>
            <p className="text-gray-600">Get counts</p>
          </div>
        </div>
      </div>

      {/* Image Upload */}
      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full text-sm text-gray-600
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-red-50 file:text-red-600
            hover:file:bg-red-100"
        />
      </div>

      {/* Image Preview */}
      {preview && (
        <div className="mb-4">
          <img
            src={preview}
            alt="Preview"
            className="rounded-lg max-h-64 mx-auto border"
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition"
      >
        {loading ? "Analyzing..." : "Analyze Image"}
      </button>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">
            Particle Counts
          </h2>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-red-100 rounded-lg p-3">
              <p className="text-sm text-gray-600">Dark Red</p>
              <p className="text-xl font-bold text-red-700">
                {result.dark_red}
              </p>
            </div>

            <div className="bg-orange-100 rounded-lg p-3">
              <p className="text-sm text-gray-600">Light Red</p>
              <p className="text-xl font-bold text-orange-600">
                {result.light_red}
              </p>
            </div>

            <div className="bg-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-600">White</p>
              <p className="text-xl font-bold text-gray-800">
                {result.white}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

}
