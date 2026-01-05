import { useState, useRef } from "react";
import ViewHistory from "./ViewHistory";
import { Camera, Upload, Calendar, RotateCw, X } from "lucide-react";

export default function CompressiveStrengthDetail({ onBack }) {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [crackResult, setCrackResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL("image/jpeg", 0.9);
      setCapturedImage(imageData);

      const stream = videoRef.current.srcObject;
      stream?.getTracks().forEach((track) => track.stop());
      setShowCamera(false);
    }
  };

  const closeCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setShowCamera(false);
  };

  const retakePicture = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        setCrackResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeCrack = async () => {
    if (!uploadedImage && !capturedImage) {
      alert("Please upload or capture an image first");
      return;
    }

    const imageToAnalyze = uploadedImage || capturedImage;
    setIsAnalyzing(true);
    setCrackResult(null);

    try {
      const response = await fetch(imageToAnalyze);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("file", blob, "crack_image.jpg");
      formData.append("threshold", "0.5");

      const apiResponse = await fetch(
        "http://127.0.0.1:8000/api/sanchitha/predict",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!apiResponse.ok) throw new Error(`API error: ${apiResponse.status}`);

      const result = await apiResponse.json();
      setCrackResult(result);
    } catch (error) {
      console.error("Error analyzing crack:", error);
      alert(
        "Failed to analyze crack. Please ensure the backend server is running."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearUpload = () => {
    setUploadedImage(null);
    setCapturedImage(null);
    setCrackResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (showHistory) {
    return <ViewHistory onBack={() => setShowHistory(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="bg-red-600 text-white p-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Camera className="w-8 h-8" />
                Capture Crack Image
              </h2>
            </div>
            <div className="p-6">
              <div className="bg-black rounded-xl overflow-hidden mb-6">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full aspect-video object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={captureImage}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                >
                  <Camera className="w-6 h-6" />
                  Capture Photo
                </button>
                <button
                  onClick={closeCamera}
                  className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Compressive Strength & Crack Detection
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            Real-time monitoring of concrete cube testing with AI-powered crack
            analysis
          </p>

          <div className="flex flex-wrap gap-4">
            <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition shadow-md">
              Start New Test
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition shadow-md">
              Generate Report
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="bg-gray-700 hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition shadow-md"
            >
              View History
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Sensor Data */}
          <div className="space-y-8">
            {/* All Sensor Sets */}

            <div className="bg-white rounded-2xl shadow-lg p-5 border-t-4 border-red-600">
              <h3 className="text-base font-bold text-gray-900 mb-3">
                Detailed Sensor Readings
              </h3>
              <div className="space-y-3">
                {["Set 1", "Set 2", "Set 3", "Set 4"].map((set, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl p-3"
                  >
                    <h4 className="text-sm font-bold text-gray-800 mb-2">
                      {set} Sensor Data
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-600">Length 1</p>
                        <p className="text-sm text-gray-900">150.12 mm</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-600">Length 2</p>
                        <p className="text-sm text-gray-900">150.08 mm</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-600">Length 3</p>
                        <p className="text-sm text-gray-900">150.15 mm</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-600">Length 4</p>
                        <p className="text-sm text-gray-900">150.11 mm</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Input Controls */}
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Test Parameters
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-red-600" />
                    Select Test Date
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={selectedDate}
                      min={getTodayDate()}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                    />
                    <button className="bg-red-600 hover:bg-red-700 text-white w-24 py-2 rounded-lg text-sm font-semibold transition">
                      Save
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">
                    Applied Load (kN)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 450.75"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                    />
                    <button className="bg-red-600 hover:bg-red-700 text-white w-24 py-2 rounded-lg text-sm font-semibold transition">
                      Apply
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">
                    Curing Days
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 7 or 28"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                    />
                    <button className="bg-red-600 hover:bg-red-700 text-white w-24 py-2 rounded-lg text-sm font-semibold transition">
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Average Data Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-red-600">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Average Test Data
              </h3>

              {/* Main Focus: Compressive Strength */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-red-500 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                    Compressive Strength Test
                  </span>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                    ✓ Passed
                  </span>
                </div>

                <div className="flex items-end gap-3 mb-4">
                  <div className="text-6xl font-black text-red-600">20.02</div>
                  <div className="text-2xl font-bold text-gray-600 mb-2">
                    MPa
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <p className="text-xs text-gray-600 mb-1">Cube Grade</p>
                    <p className="text-xl font-bold text-red-700">M20</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Test Date</p>
                    <p className="text-xl font-bold text-gray-800">Today</p>
                  </div>
                </div>
              </div>

              {/* Other Parameters */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                  <p className="text-xs text-gray-600">Avg. Length</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    150.12 mm
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                  <p className="text-xs text-gray-600">Avg. Width</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    149.98 mm
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                  <p className="text-xs text-gray-600">Avg. Area</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    229.98 mm²
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                  <p className="text-xs text-gray-600">Curing Days</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">7</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200 col-span-2 md:col-span-2">
                  <p className="text-xs text-gray-600">Applied Load</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    450.75 kN
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Crack Detection */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-red-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              AI Crack Detection
            </h2>

            {uploadedImage || capturedImage ? (
              <div className="space-y-6">
                <div className="relative">
                  <img
                    src={uploadedImage || capturedImage}
                    alt="Concrete sample"
                    className="w-full h-96 object-cover rounded-2xl shadow-xl"
                  />
                  <button
                    onClick={retakePicture}
                    className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-lg transition"
                  >
                    <RotateCw className="w-6 h-6" />
                  </button>
                </div>

                {crackResult ? (
                  <div className="space-y-6">
                    <div
                      className={`p-6 rounded-2xl border-2 ${
                        crackResult.metrics.has_crack
                          ? "bg-red-50 border-red-300"
                          : "bg-green-50 border-green-300"
                      }`}
                    >
                      <h4 className="text-xl font-bold mb-4 flex items-center gap-3">
                        {crackResult.metrics.has_crack
                          ? "⚠️ Crack Detected"
                          : "✓ No Crack Detected"}
                      </h4>
                      <p className="text-2xl font-bold">
                        {crackResult.message}
                      </p>
                      <div className="grid grid-cols-2 gap-6 mt-6">
                        <div>
                          <p className="text-gray-600">Crack Coverage</p>
                          <p className="text-3xl font-bold text-gray-900">
                            {crackResult.metrics.crack_percentage}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Crack Pixels</p>
                          <p className="text-3xl font-bold text-gray-900">
                            {crackResult.metrics.crack_pixels.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xl font-bold mb-4">
                        Segmentation Mask
                      </h4>
                      <img
                        src={`data:image/png;base64,${crackResult.mask_base64}`}
                        alt="Crack mask"
                        className="w-full rounded-2xl shadow-lg border-4 border-gray-200"
                      />
                    </div>

                    <button
                      onClick={clearUpload}
                      className="w-full bg-gray-700 hover:bg-gray-800 text-white py-4 rounded-xl font-bold transition flex items-center justify-center gap-3"
                    >
                      <Upload className="w-6 h-6" />
                      Upload New Image
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button
                      onClick={clearUpload}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-4 rounded-xl font-bold transition"
                    >
                      Clear Image
                    </button>
                    <button
                      onClick={analyzeCrack}
                      disabled={isAnalyzing}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold transition shadow-lg"
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze Crack"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl h-96 flex flex-col items-center justify-center text-center px-8">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-40 h-40 mb-6" />
                  <p className="text-2xl font-semibold text-gray-600">
                    No Image Selected
                  </p>
                  <p className="text-gray-500 mt-2">
                    Capture or upload a clear image of the concrete surface
                  </p>
                </div>

                <button
                  onClick={startCamera}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-bold text-xl transition shadow-xl flex items-center justify-center gap-4"
                >
                  <Camera className="w-8 h-8" />
                  Identify Crack with Camera
                </button>

                <div className="text-center text-gray-500 my-6">— OR —</div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="upload-crack"
                />
                <label
                  htmlFor="upload-crack"
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-bold text-xl transition shadow-xl cursor-pointer flex items-center justify-center gap-4"
                >
                  <Upload className="w-8 h-8" />
                  Upload Image for Analysis
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-800 text-white px-10 py-4 rounded-xl font-bold text-lg transition shadow-lg"
          >
            ← Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
