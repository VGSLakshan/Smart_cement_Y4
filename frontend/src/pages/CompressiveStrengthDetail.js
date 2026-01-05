import { useState, useRef } from 'react';

export default function CompressiveStrengthDetail({ onBack }) {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [crackResult, setCrackResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageData = canvasRef.current.toDataURL('image/png');
      setCapturedImage(imageData);
      const stream = videoRef.current.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setShowCamera(false);
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
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
        setCrackResult(null); // Reset previous results
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeCrack = async () => {
    if (!uploadedImage) {
      alert('Please upload an image first');
      return;
    }

    setIsAnalyzing(true);
    setCrackResult(null);

    try {
      // Convert base64 to blob
      const response = await fetch(uploadedImage);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('file', blob, 'crack_image.jpg');
      formData.append('threshold', '0.5');

      // Call the API
      const apiResponse = await fetch('http://127.0.0.1:8000/api/sanchitha/predict', {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.status}`);
      }

      const result = await apiResponse.json();
      setCrackResult(result);
    } catch (error) {
      console.error('Error analyzing crack:', error);
      alert('Failed to analyze crack. Please make sure the backend server is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearUpload = () => {
    setUploadedImage(null);
    setCrackResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <main className="flex-1 p-10 bg-gray-50 min-h-screen overflow-y-auto">
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Capture Crack Image</h2>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-black mb-4" style={{ maxHeight: '400px', objectFit: 'cover' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} width="640" height="480" />
            <div className="flex gap-4 justify-center">
              <button onClick={captureImage} className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 font-semibold">Capture Photo</button>
              <button onClick={closeCamera} className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 font-semibold">Close Camera</button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Compressive Strength & Crack Detection</h1>
          <div className="flex gap-3 mt-4">
            <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Start New Test</button>
            <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Generate Report</button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">View History</button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Real-Time Data</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded p-4"><p className="text-sm text-gray-600">Length 1 (mm)</p><p className="text-2xl font-bold">150.12</p></div>
              <div className="bg-gray-50 rounded p-4"><p className="text-sm text-gray-600">Length 2 (mm)</p><p className="text-2xl font-bold">150.08</p></div>
              <div className="bg-gray-50 rounded p-4"><p className="text-sm text-gray-600">Length 3 (mm)</p><p className="text-2xl font-bold">150.15</p></div>
              <div className="bg-gray-50 rounded p-4"><p className="text-sm text-gray-600">Length 4 (mm)</p><p className="text-2xl font-bold">150.11</p></div>
              <div className="bg-gray-50 rounded p-4"><p className="text-sm text-gray-600">Width 1 (mm)</p><p className="text-2xl font-bold">149.98</p></div>
              <div className="bg-gray-50 rounded p-4"><p className="text-sm text-gray-600">Width 2 (mm)</p><p className="text-2xl font-bold">149.95</p></div>
              <div className="bg-gray-50 rounded p-4"><p className="text-sm text-gray-600">Width 3 (mm)</p><p className="text-2xl font-bold">150.01</p></div>
              <div className="bg-gray-50 rounded p-4"><p className="text-sm text-gray-600">Width 4 (mm)</p><p className="text-2xl font-bold">149.99</p></div>
              <div className="bg-gray-50 rounded p-4"><p className="text-sm text-gray-600">Avg. Length (mm)</p><p className="text-2xl font-bold">150.12</p></div>
              <div className="bg-gray-50 rounded p-4"><p className="text-sm text-gray-600">Avg. Width (mm)</p><p className="text-2xl font-bold">149.98</p></div>
              <div className="bg-gray-50 rounded p-4"><p className="text-sm text-gray-600">Cube Grade</p><p className="text-2xl font-bold">M20</p></div>
              <div className="bg-gray-50 rounded p-4"><p className="text-sm text-gray-600">Curing Days</p><p className="text-2xl font-bold">7</p></div>
              <div className="bg-gray-50 rounded p-4"><p className="text-sm text-gray-600">Applied Load (kN)</p><p className="text-2xl font-bold">450.75</p></div>
              <div className="bg-gray-50 rounded p-4"><p className="text-sm text-gray-600">Compressive Strength (MPa)</p><p className="text-2xl font-bold text-red-600">20.02</p></div>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-gray-600">Select Test Date</label>
                <div className="flex gap-2 mt-2">
                  <input 
                    type="date" 
                    value={selectedDate}
                    min={getTodayDate()}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" 
                  />
                  <button 
                    onClick={() => {
                      if (selectedDate) {
                        alert(`Date selected: ${selectedDate}`);
                      } else {
                        alert('Please select a date');
                      }
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                  >
                    Save Date
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Enter Applied Load (kN)</label>
                <div className="flex gap-2 mt-2">
                  <input type="text" placeholder="e.g. 450.75" className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" />
                  <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm">Apply Load</button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Enter Curing Days</label>
                <div className="flex gap-2 mt-2">
                  <input type="text" placeholder="e.g. 7 or 28" className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" />
                  <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm">Save Days</button>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Crack Detection</h2>
            {capturedImage ? (
              <div>
                <img src={capturedImage} alt="Captured" className="w-full rounded-lg h-80 object-cover mb-4" />
                <div className="flex gap-2">
                  <button onClick={retakePicture} className="flex-1 bg-yellow-600 text-white px-4 py-3 rounded-md">Retake Photo</button>
                  <button className="flex-1 bg-green-600 text-white px-4 py-3 rounded-md">Analyze</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-gray-100 rounded-lg h-80 flex items-center justify-center border-2 border-dashed mb-4">
                  <p className="text-gray-500">Crack Detection Image</p>
                </div>
                <button onClick={startCamera} className="w-full bg-red-600 text-white px-4 py-3 rounded-md hover:bg-red-700 font-semibold">Identify Crack</button>
              </div>
            )}

            {/* Upload Image Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Or Upload Image</h3>
              
              {uploadedImage ? (
                <div>
                  <img src={uploadedImage} alt="Uploaded" className="w-full rounded-lg h-64 object-cover mb-4" />
                  
                  {crackResult ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Analysis Results</h4>
                        <div className="space-y-2 text-sm">
                          <p className={`font-bold ${crackResult.metrics.has_crack ? 'text-red-600' : 'text-green-600'}`}>
                            {crackResult.message}
                          </p>
                          <p className="text-gray-700">Crack Coverage: <span className="font-semibold">{crackResult.metrics.crack_percentage}%</span></p>
                          <p className="text-gray-700">Crack Pixels: <span className="font-semibold">{crackResult.metrics.crack_pixels.toLocaleString()}</span></p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Segmentation Mask</h4>
                        <img 
                          src={`data:image/png;base64,${crackResult.mask_base64}`} 
                          alt="Crack Mask" 
                          className="w-full rounded-lg h-64 object-cover border-2 border-gray-300" 
                        />
                      </div>

                      <button 
                        onClick={clearUpload} 
                        className="w-full bg-gray-600 text-white px-4 py-3 rounded-md hover:bg-gray-700 font-semibold"
                      >
                        Upload New Image
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={clearUpload} 
                        className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-md hover:bg-gray-700"
                      >
                        Clear
                      </button>
                      <button 
                        onClick={analyzeCrack} 
                        disabled={isAnalyzing}
                        className="flex-1 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 font-semibold disabled:bg-gray-400"
                      >
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Crack'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="crack-upload"
                  />
                  <label
                    htmlFor="crack-upload"
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 font-semibold cursor-pointer flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Image for Analysis
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
        <button onClick={onBack} className="mt-6 bg-gray-600 text-white px-6 py-2 rounded-md">Back</button>
      </div>
    </main>
  );
}
