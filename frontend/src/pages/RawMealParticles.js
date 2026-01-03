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
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Cement Raw Meal Particle Analysis
        </h1>

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
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
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
