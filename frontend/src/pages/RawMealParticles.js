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

      if (onNewPrediction) {
        onNewPrediction();
      }

    } catch (err) {
      setError("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center px-4">

      <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-2xl">

        {/* TITLE */}
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
          Cement Raw Meal Particle Analysis
        </h1>

        <p className="text-gray-500 text-center mb-6">
          AI Based Color Particle Detection Of Microscopic Images
        </p>

        {/* PURPOSE BOX */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
          <p className="text-gray-700 mb-2">
            <strong>Purpose:</strong> This component analyzes microscopic images
            of cement raw meal and automatically counts particles based on color composition.
          </p>

          <ul className="list-disc list-inside text-gray-600 text-sm">
            <li>
              Detects <span className="font-semibold text-red-600">Dark Red</span>,
              <span className="font-semibold text-orange-500"> Light Red</span>,
              and <span className="font-semibold text-gray-700"> White</span> particles
            </li>
          </ul>
        </div>

        {/* STEPS */}
        <div className="mb-6">

          <h2 className="font-semibold text-gray-700 mb-3">
            How it works
          </h2>

          <div className="grid grid-cols-3 gap-4 text-center">

            <div className="bg-red-50 border border-red-100 rounded-xl p-4 hover:shadow-md transition">
              <p className="font-bold text-red-600">Step 1</p>
              <p className="text-sm text-gray-600">Upload image</p>
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 hover:shadow-md transition">
              <p className="font-bold text-orange-600">Step 2</p>
              <p className="text-sm text-gray-600">Click Analyze Image</p>
            </div>

            <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
              <p className="font-bold text-gray-700">Step 3</p>
              <p className="text-sm text-gray-600">Get counts</p>
            </div>

          </div>
        </div>

        {/* UPLOAD BOX */}
        <div className="mb-5 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-400 transition">

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="text-sm"
          />

          <p className="text-gray-500 text-xs mt-2">
            Upload microscopic raw meal image
          </p>

        </div>

        {/* PREVIEW */}
        {preview && (
          <div className="mb-6">
            <img
              src={preview}
              alt="Preview"
              className="rounded-xl max-h-72 mx-auto border shadow"
            />
          </div>
        )}

        {/* ANALYZE BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition shadow-md"
        >
          {loading ? "Analyzing Image..." : "Analyze Image"}
        </button>

        {/* ERROR */}
        {error && (
          <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
        )}

        {/* RESULTS */}
        {result && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-5">

            {/* NOT MICROSCOPIC */}
            {!result.microscopic && (
              <div className="text-center">

                <h2 className="text-lg font-bold text-red-600 mb-2">
                  Not a Microscopic Image
                </h2>

                <p className="text-gray-600">{result.message}</p>

                <p className="text-sm text-gray-500 mt-2">
                  Confidence: {(result.confidence * 100).toFixed(1)}%
                </p>

              </div>
            )}

            {/* MICROSCOPIC RESULT */}
            {result.microscopic && (
              <>
                <h2 className="text-lg font-bold text-gray-700 mb-2">
                  Particle Counts
                </h2>

                <p className="text-sm text-gray-500 mb-4">
                  Confidence: {(result.confidence * 100).toFixed(1)}%
                </p>

                <div className="grid grid-cols-3 gap-4 text-center">

                  <div className="bg-red-100 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-600">Dark Red</p>
                    <p className="text-2xl font-bold text-red-700">
                      {result.dark_red}
                    </p>
                  </div>

                  <div className="bg-orange-100 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-600">Light Red</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {result.light_red}
                    </p>
                  </div>

                  <div className="bg-gray-200 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-600">White</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {result.white}
                    </p>
                  </div>

                </div>
              </>
            )}

          </div>
        )}

      </div>
    </div>
  );
}