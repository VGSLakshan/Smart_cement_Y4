import { useState, useRef, useEffect } from "react";
import ViewHistory from "./ViewHistory";
import {
  Camera,
  Upload,
  Calendar,
  RotateCw,
  X,
  Zap,
  Loader,
} from "lucide-react";
import io from "socket.io-client";

const BACKEND_URL = "http://localhost:5000";

export default function CompressiveStrengthDetail({ onBack }) {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [crackResult, setCrackResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  
  // Auto-capture states
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState(4);
  const [autoCapturedImages, setAutoCapturedImages] = useState([]);
  const autoCaptureIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Real-time sensor data from MQTT
  const [sensorData, setSensorData] = useState([
    { name: "Set 1", values: [0, 0, 0, 0], received: false },
    { name: "Set 2", values: [0, 0, 0, 0], received: false },
    { name: "Set 3", values: [0, 0, 0, 0], received: false },
    { name: "Set 4", values: [0, 0, 0, 0], received: false },
  ]);

  const [testStatus, setTestStatus] = useState("IDLE"); // IDLE, READY, TEST_STARTED, TEST_COMPLETED
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [socket, setSocket] = useState(null);

  // Socket.IO connection
  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ Connected to backend Socket.IO");
    });

    newSocket.on("initialData", (data) => {
      console.log("📦 Initial sensor data:", data);
      updateSensorDataFromMQTT(data);
    });

    newSocket.on("sensorData", ({ side, data }) => {
      console.log(`📡 Received sensor data for side ${side}:`, data);

      setSensorData((prev) => {
        const updated = [...prev];
        updated[side - 1] = {
          name: `Set ${side}`,
          values: [data.sensor1, data.sensor2, data.sensor3, data.sensor4],
          received: true,
        };
        return updated;
      });
    });

    newSocket.on("testStatus", ({ status }) => {
      console.log(`📊 Test status update: ${status}`);
      setTestStatus(status);

      if (status === "TEST_COMPLETED") {
        setIsTestRunning(false);
      }
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Disconnected from backend");
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const updateSensorDataFromMQTT = (mqttData) => {
    const sides = ["side1", "side2", "side3", "side4"];
    setSensorData((prev) => {
      const updated = [...prev];
      sides.forEach((sideKey, index) => {
        if (mqttData[sideKey]) {
          const side = mqttData[sideKey];
          updated[index] = {
            name: `Set ${index + 1}`,
            values: [side.sensor1, side.sensor2, side.sensor3, side.sensor4],
            received: true,
          };
        }
      });
      return updated;
    });

    if (mqttData.status) {
      setTestStatus(mqttData.status);
    }
  };

  const handleTestNow = async () => {
    try {
      setIsTestRunning(true);
      setTestStatus("TEST_STARTED");

      // Reset sensor data
      setSensorData([
        { name: "Set 1", values: [0, 0, 0, 0], received: false },
        { name: "Set 2", values: [0, 0, 0, 0], received: false },
        { name: "Set 3", values: [0, 0, 0, 0], received: false },
        { name: "Set 4", values: [0, 0, 0, 0], received: false },
      ]);

      const response = await fetch(`${BACKEND_URL}/api/sensor/start-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to start test");
      }

      showNotification(
        "success",
        "✓ Test started! ESP32 will begin measurements...",
      );
    } catch (error) {
      console.error("Error starting test:", error);
      showNotification("error", `Failed to start test: ${error.message}`);
      setIsTestRunning(false);
      setTestStatus("IDLE");
    }
  };

  // Auto-calculate dimensions when test completes
  useEffect(() => {
    if (testStatus === "TEST_COMPLETED") {
      const allReceived = sensorData.every((set) => set.received);
      if (allReceived) {
        calculateDimensions();
      }
    }
  }, [testStatus, sensorData]);

  const calculateDimensions = () => {
    const set1Avg =
      sensorData[0].values.reduce((acc, val) => acc + val, 0) /
      sensorData[0].values.length;
    const set2Avg =
      sensorData[1].values.reduce((acc, val) => acc + val, 0) /
      sensorData[1].values.length;
    const set3Avg =
      sensorData[2].values.reduce((acc, val) => acc + val, 0) /
      sensorData[2].values.length;
    const set4Avg =
      sensorData[3].values.reduce((acc, val) => acc + val, 0) /
      sensorData[3].values.length;

    const avgLength = 270 - (set1Avg + set3Avg);
    const avgWidth = 270 - (set2Avg + set4Avg);

    handleInputChange("avgLengthMm", avgLength.toFixed(2));
    handleInputChange("avgWidthMm", avgWidth.toFixed(2));
    showNotification("success", "✓ Dimensions calculated from sensor data!");
  };

  // Calculate average length from all sensor sets
  const calculateOverallAverage = () => {
    const setAverages = sensorData.map((set) => {
      const sum = set.values.reduce((acc, val) => acc + val, 0);
      return sum / set.values.length;
    });
    const overallAvg =
      setAverages.reduce((acc, val) => acc + val, 0) / setAverages.length;
    return overallAvg.toFixed(2);
  };

  // Form data state
  const [formData, setFormData] = useState({
    cubeId: "",
    cubeMadeDate: "",
    testDate: "",
    testingTime: "",
    predictGrade: "",
    curingDays: "",
    appliedLoadKn: "",
    avgLengthMm: "149.70",
    avgWidthMm: "149.96",
  });

  const [savedTestId, setSavedTestId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: "",
  });
  const [testResult, setTestResult] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: "", message: "" });
    }, 5000);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const saveTestToDatabase = async () => {
    // Validate required fields
    const requiredFields = [
      "cubeId",
      "cubeMadeDate",
      "testDate",
      "testingTime",
      "predictGrade",
      "curingDays",
      "appliedLoadKn",
      "avgLengthMm",
      "avgWidthMm",
    ];

    const missingFields = requiredFields.filter(
      (field) => !formData[field] || formData[field] === "",
    );

    if (missingFields.length > 0) {
      showNotification(
        "error",
        `Please fill in all required fields: ${missingFields.join(", ")}`,
      );
      return;
    }

    // Validate numeric fields
    const curingDays = parseInt(formData.curingDays);
    const appliedLoadKn = parseFloat(formData.appliedLoadKn);
    const avgLengthMm = parseFloat(formData.avgLengthMm);
    const avgWidthMm = parseFloat(formData.avgWidthMm);

    if (isNaN(curingDays) || curingDays < 0) {
      showNotification("error", "Curing Days must be a valid positive number");
      return;
    }
    if (isNaN(appliedLoadKn) || appliedLoadKn <= 0) {
      showNotification("error", "Applied Load must be a valid positive number");
      return;
    }
    if (isNaN(avgLengthMm) || avgLengthMm <= 0) {
      showNotification(
        "error",
        "Average Length must be a valid positive number",
      );
      return;
    }
    if (isNaN(avgWidthMm) || avgWidthMm <= 0) {
      showNotification(
        "error",
        "Average Width must be a valid positive number",
      );
      return;
    }

    setIsSaving(true);

    try {
      const requestBody = {
        cubeId: formData.cubeId.trim(),
        cubeMadeDate: formData.cubeMadeDate,
        testDate: formData.testDate,
        testingTime: formData.testingTime,
        predictGrade: formData.predictGrade.toUpperCase(),
        curingDays: curingDays,
        appliedLoadKn: appliedLoadKn,
        avgLengthMm: avgLengthMm,
        avgWidthMm: avgWidthMm,
        cubeGrade: formData.predictGrade.toUpperCase(),
      };

      console.log("Sending request:", requestBody);

      const response = await fetch("http://localhost:5000/api/strength-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log("Response:", result);

      // Log detailed validation errors if present
      if (result.errors && Array.isArray(result.errors)) {
        console.log("Validation Errors:", result.errors);
      }

      if (!response.ok) {
        // Handle validation errors with detailed messages
        if (result.errors && Array.isArray(result.errors)) {
          const errorMessages = result.errors
            .map((err) => `${err.field}: ${err.message}`)
            .join(", ");
          throw new Error(`Validation Error: ${errorMessages}`);
        }
        const errorMsg =
          result.error || result.message || `Server error: ${response.status}`;
        throw new Error(errorMsg);
      }

      if (result.success) {
        setSavedTestId(result.data._id);
        setTestResult(result.data);
        showNotification(
          "success",
          `✓ Test saved successfully! ID: ${result.data._id}`,
        );

        // If there's a crack analysis result, upload the MASK image
        if (crackResult && crackResult.mask_base64 && result.data._id) {
          await uploadCrackImage(result.data._id);
        } else if ((capturedImage || uploadedImage) && !crackResult) {
          showNotification(
            "warning",
            "⚠️ Please analyze the crack first to save the mask image",
          );
        }
      } else {
        throw new Error(result.error || "Failed to save test");
      }
    } catch (error) {
      console.error("Error saving test:", error);
      showNotification("error", `Failed to save test: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const uploadCrackImage = async (testId) => {
    // Only upload the MASK image from crack detection results
    if (!crackResult || !crackResult.mask_base64) {
      console.log("No crack detection mask available to upload");
      return;
    }

    try {
      // Convert base64 mask to blob
      const base64Data = crackResult.mask_base64;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });

      const formDataImg = new FormData();
      formDataImg.append("image", blob, "crack_mask.png");

      const uploadResponse = await fetch(
        `http://localhost:5000/api/strength-tests/${testId}/image`,
        {
          method: "POST",
          body: formDataImg,
        },
      );

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        console.log("Mask image uploaded:", result.data.crackImageUrl);

        // Update test result with image information
        setTestResult(result.data);

        showNotification(
          "success",
          `✓ Mask image saved to database! Path: /uploads/strength/`,
        );
      } else {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Failed to upload mask image");
      }
    } catch (error) {
      console.error("Error uploading mask image:", error);
      showNotification("error", `Failed to upload mask: ${error.message}`);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    setIsAutoCapturing(true);
    setCaptureCountdown(4);
    setAutoCapturedImages([]);
    setCrackResult(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready, then start auto-capture
        videoRef.current.onloadedmetadata = () => {
          console.log("✅ Video loaded, starting auto-capture...");
          // Small delay to ensure video is fully ready
          setTimeout(() => {
            startAutoCapture();
          }, 500);
        };
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Unable to access camera. Please check permissions.");
      setIsAutoCapturing(false);
    }
  };
  
  const startAutoCapture = () => {
    console.log("🚀 Starting auto-capture system...");
    
    // Capture first image immediately
    setTimeout(() => {
      console.log("📸 Taking first capture...");
      autoCaptureImage();
    }, 1000);
    
    // Start countdown timer (updates every 100ms for smooth countdown)
    countdownIntervalRef.current = setInterval(() => {
      setCaptureCountdown((prev) => {
        if (prev <= 0.1) return 4;
        return prev - 0.1;
      });
    }, 100);
    
    // Auto-capture every 4 seconds (starting from 4 seconds after first capture)
    autoCaptureIntervalRef.current = setInterval(() => {
      console.log("⏰ Interval triggered - capturing image...");
      autoCaptureImage();
    }, 4000);
  };
  
  const autoCaptureImage = async () => {
    console.log("📷 autoCaptureImage called, checking conditions...");
    console.log("Video ref:", videoRef.current ? "exists" : "null");
    console.log("Canvas ref:", canvasRef.current ? "exists" : "null");
    console.log("Is auto capturing:", isAutoCapturing);
    
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;
      
      console.log("Video dimensions:", width, "x", height);
      
      if (width > 0 && height > 0) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL("image/jpeg", 0.9);
        
        // Store the captured image
        setAutoCapturedImages((prev) => {
          const newArray = [...prev, imageData];
          console.log(`✅ Image captured! Total count: ${newArray.length}`);
          return newArray;
        });
        
        // Analyze the captured image for cracks
        await analyzeAutoCapturedImage(imageData);
      } else {
        console.log("⚠️ Video not ready yet, dimensions are 0");
      }
    } else {
      console.log("❌ Missing refs - cannot capture");
    }
  };
  
  const analyzeAutoCapturedImage = async (imageData) => {
    try {
      const response = await fetch(imageData);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("file", blob, "crack_image.jpg");
      formData.append("threshold", "0.5");

      const apiResponse = await fetch(
        "http://127.0.0.1:8000/api/sanchitha/predict",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!apiResponse.ok) throw new Error(`API error: ${apiResponse.status}`);

      const result = await apiResponse.json();
      
      console.log("🔍 Crack analysis result:", result);
      
      // Check if crack is detected using the correct property path
      if (result && result.metrics && result.metrics.has_crack) {
        // Stop auto-capture
        stopAutoCapture();
        
        // Set the crack result and captured image
        setCrackResult(result);
        setCapturedImage(imageData);
        setShowCamera(false);
        setIsAutoCapturing(false);
        
        // Show notification
        showNotification(
          "error", 
          `🚨 CRACK DETECTED! Coverage: ${result.metrics.crack_percentage}%`
        );
        
        console.log("✅ Crack detected, auto-capture stopped");
      } else {
        console.log("✓ No crack detected, continuing auto-capture...");
      }
    } catch (error) {
      console.error("❌ Error analyzing crack:", error);
      // Continue capturing even if analysis fails
    }
  };
  
  const stopAutoCapture = () => {
    if (autoCaptureIntervalRef.current) {
      clearInterval(autoCaptureIntervalRef.current);
      autoCaptureIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    // Stop camera stream
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
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
    stopAutoCapture();
    setShowCamera(false);
    setIsAutoCapturing(false);
  };
  
  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopAutoCapture();
    };
  }, []);

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
        },
      );

      if (!apiResponse.ok) throw new Error(`API error: ${apiResponse.status}`);

      const result = await apiResponse.json();
      setCrackResult(result);
    } catch (error) {
      console.error("Error analyzing crack:", error);
      alert(
        "Failed to analyze crack. Please ensure the backend server is running.",
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
    <div className="min-h-screen w-full bg-gray-50">
      {/* Notification Banner */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`px-6 py-4 rounded-lg shadow-xl border-2 ${
              notification.type === "success"
                ? "bg-green-50 border-green-500 text-green-800"
                : "bg-red-50 border-red-500 text-red-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {notification.type === "success" ? "✓" : "✗"}
              </span>
              <p className="font-semibold">{notification.message}</p>
              <button
                onClick={() =>
                  setNotification({ show: false, type: "", message: "" })
                }
                className="ml-4 hover:opacity-70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="bg-black rounded-xl overflow-hidden mb-6 relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full aspect-video object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Auto-capture status overlay */}
                {isAutoCapturing && (
                  <div className="absolute top-4 left-4 right-4">
                    <div className="bg-red-600/95 backdrop-blur-sm text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-white/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                          <span className="font-bold text-lg">🔴 AUTO-CAPTURE ACTIVE</span>
                        </div>
                        <div className="text-2xl font-bold bg-white/20 px-4 py-1 rounded-lg">
                          {captureCountdown.toFixed(1)}s
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="bg-yellow-400/90 text-gray-900 font-bold px-4 py-2 rounded-md flex items-center gap-2">
                            <span className="text-lg">📸</span>
                            <span>Images Captured:</span>
                            <span className="text-xl">{autoCapturedImages.length}</span>
                          </div>
                          <span className="bg-white/20 px-3 py-1 rounded-md">
                            🔍 Analyzing...
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs opacity-90 border-t border-white/20 pt-2">
                        <span>✨ Capturing every 4s • Will stop when crack detected</span>
                        <span className="bg-green-400/20 px-2 py-1 rounded">Check Console for Debug Info</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={closeCamera}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                >
                  <X className="w-6 h-6" />
                  Stop Auto-Capture
                </button>
              </div>
              <div className="mt-4 text-center space-y-2">
                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400 rounded-lg p-4 mb-3">
                  <p className="text-lg font-bold text-gray-800 mb-1">
                    📊 Total Images Captured
                  </p>
                  <p className="text-4xl font-bold text-orange-600">
                    {autoCapturedImages.length}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  ✨ Auto-Capture Mode Active
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-gray-700 space-y-1">
                  <p>• 📸 Camera captures image every 4 seconds automatically</p>
                  <p>• 🔍 Each image is analyzed for cracks in real-time</p>
                  <p>• 🛑 Stops automatically when crack is detected</p>
                  <p>• ✅ Shows crack result with coverage percentage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8 lg:py-10">
        {/* Header */}

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col items-center justify-center text-center gap-4">
            {/* Title */}
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="bg-red-600 p-2 rounded-lg">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Compressive Strength & Crack Detection
                </h1>
              </div>
              <p className="text-sm text-gray-600">
                Real-time monitoring of concrete cube testing with AI-powered
                crack analysis
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              {/* Test Now Button */}
              <button
                onClick={handleTestNow}
                disabled={isTestRunning}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-sm shadow-lg transition ${
                  isTestRunning
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
                }`}
              >
                {isTestRunning ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Test Running...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Test Now
                  </>
                )}
              </button>

              {/* Status Indicator */}
              <div
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm ${
                  testStatus === "READY"
                    ? "bg-green-100 text-green-700 border-2 border-green-300"
                    : testStatus === "TEST_STARTED"
                      ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                      : testStatus === "TEST_COMPLETED"
                        ? "bg-purple-100 text-purple-700 border-2 border-purple-300"
                        : "bg-gray-100 text-gray-600 border-2 border-gray-300"
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    testStatus === "READY" || testStatus === "TEST_STARTED"
                      ? "animate-pulse bg-current"
                      : "bg-current"
                  }`}
                />
                {testStatus === "READY" && "Device Ready"}
                {testStatus === "TEST_STARTED" && "Measuring..."}
                {testStatus === "TEST_COMPLETED" && "Completed"}
                {testStatus === "IDLE" && "Idle"}
                {!["IDLE", "READY", "TEST_STARTED", "TEST_COMPLETED"].includes(
                  testStatus,
                ) && testStatus}
              </div>

              <button className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 px-6 py-2.5 rounded-lg font-semibold text-sm">
                Generate Report
              </button>

              <button
                onClick={() => setShowHistory(true)}
                className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 px-6 py-2.5 rounded-lg font-semibold text-sm"
              >
                View History
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column: Sensor Data */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* All Sensor Sets */}

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border-t-4 border-red-600">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">
                  Detailed Sensor Readings
                </h3>
                <button
                  onClick={calculateDimensions}
                  disabled={!sensorData.every((set) => set.received)}
                  className={`px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-md transition flex items-center gap-2 ${
                    sensorData.every((set) => set.received)
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <RotateCw className="w-4 h-4" />
                  Calculate Dimensions
                </button>
              </div>
              <div className="space-y-3">
                {sensorData.map((set, index) => {
                  const setAverage = (
                    set.values.reduce((acc, val) => acc + val, 0) /
                    set.values.length
                  ).toFixed(2);
                  return (
                    <div
                      key={index}
                      className={`border-2 rounded-xl p-3 transition ${
                        set.received
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-800">
                            {set.name} Sensor Data
                          </h4>
                          {set.received && (
                            <span className="text-green-600 text-xs">✓</span>
                          )}
                        </div>
                        <div
                          className={`px-2 py-1 rounded-md ${
                            set.received ? "bg-green-200" : "bg-gray-200"
                          }`}
                        >
                          <p
                            className={`text-[10px] font-semibold ${
                              set.received ? "text-green-700" : "text-gray-500"
                            }`}
                          >
                            Avg: {setAverage} mm
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                        {set.values.map((value, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 rounded-lg p-2 text-center"
                          >
                            <p className="text-xs text-gray-600">
                              Length {idx + 1}
                            </p>
                            <p className="text-sm text-gray-900">{value} mm</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Overall Average Display */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <h4 className="text-sm font-bold text-gray-800">
                      Calculated Dimensions (270mm - Sum)
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border-2 border-green-300">
                      <p className="text-xs text-gray-600 mb-1">
                        Avg Length (Set 1+3)
                      </p>
                      <p className="text-lg font-bold text-green-900">
                        {(() => {
                          const set1Avg =
                            sensorData[0].values.reduce(
                              (acc, val) => acc + val,
                              0,
                            ) / sensorData[0].values.length;
                          const set3Avg =
                            sensorData[2].values.reduce(
                              (acc, val) => acc + val,
                              0,
                            ) / sensorData[2].values.length;
                          const avgLength = 270 - (set1Avg + set3Avg);
                          return avgLength.toFixed(2);
                        })()}{" "}
                        mm
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border-2 border-blue-300">
                      <p className="text-xs text-gray-600 mb-1">
                        Avg Width (Set 2+4)
                      </p>
                      <p className="text-lg font-bold text-blue-900">
                        {(() => {
                          const set2Avg =
                            sensorData[1].values.reduce(
                              (acc, val) => acc + val,
                              0,
                            ) / sensorData[1].values.length;
                          const set4Avg =
                            sensorData[3].values.reduce(
                              (acc, val) => acc + val,
                              0,
                            ) / sensorData[3].values.length;
                          const avgWidth = 270 - (set2Avg + set4Avg);
                          return avgWidth.toFixed(2);
                        })()}{" "}
                        mm
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    Length = 270 - (Set1 + Set3) • Width = 270 - (Set2 + Set4)
                  </p>
                </div>
              </div>
            </div>

            {/* Input Controls */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 border-t-4 border-red-600">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 sm:mb-4">
                Test Parameters
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">
                    Cube ID *
                  </label>
                  <input
                    type="text"
                    value={formData.cubeId}
                    onChange={(e) =>
                      handleInputChange("cubeId", e.target.value)
                    }
                    placeholder="e.g. C-2026-001"
                    className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-red-600" />
                    Cube Made Date *
                  </label>
                  <input
                    type="date"
                    value={formData.cubeMadeDate}
                    onChange={(e) =>
                      handleInputChange("cubeMadeDate", e.target.value)
                    }
                    max={getTodayDate()}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">
                    Testing Time *
                  </label>
                  <input
                    type="time"
                    value={formData.testingTime}
                    onChange={(e) =>
                      handleInputChange("testingTime", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">
                    Predict Grade *
                  </label>
                  <select
                    value={formData.predictGrade}
                    onChange={(e) =>
                      handleInputChange("predictGrade", e.target.value)
                    }
                    className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  >
                    <option value="">Select Grade</option>
                    <option value="M10">M10</option>
                    <option value="M15">M15</option>
                    <option value="M20">M20</option>
                    <option value="M25">M25</option>
                    <option value="M30">M30</option>
                    <option value="M35">M35</option>
                    <option value="M40">M40</option>
                    <option value="M45">M45</option>
                    <option value="M50">M50</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-red-600" />
                    Test Date *
                  </label>
                  <input
                    type="date"
                    value={formData.testDate}
                    onChange={(e) =>
                      handleInputChange("testDate", e.target.value)
                    }
                    min={formData.cubeMadeDate || getTodayDate()}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">
                    Applied Load (kN) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.appliedLoadKn}
                    onChange={(e) =>
                      handleInputChange("appliedLoadKn", e.target.value)
                    }
                    placeholder="e.g. 450.75"
                    className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-2 block">
                    Curing Days *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.curingDays}
                    onChange={(e) =>
                      handleInputChange("curingDays", e.target.value)
                    }
                    placeholder="e.g. 7 or 28"
                    className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                  />
                </div>

                {/* Sensor-Calculated Dimensions (Read-Only) */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 sm:p-4">
                  <h4 className="text-xs font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    Sensor Measurements (Auto-Calculated)
                  </h4>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="bg-white rounded-lg p-2 sm:p-3 text-center border border-blue-200">
                      <p className="text-[10px] sm:text-xs text-gray-600 mb-1">
                        Avg Length
                      </p>
                      <p className="text-sm sm:text-base font-bold text-gray-900">
                        {formData.avgLengthMm || "0"}
                      </p>
                      <p className="text-[10px] text-gray-500">mm</p>
                    </div>

                    <div className="bg-white rounded-lg p-2 sm:p-3 text-center border border-blue-200">
                      <p className="text-[10px] sm:text-xs text-gray-600 mb-1">
                        Avg Width
                      </p>
                      <p className="text-sm sm:text-base font-bold text-gray-900">
                        {formData.avgWidthMm || "0"}
                      </p>
                      <p className="text-[10px] text-gray-500">mm</p>
                    </div>

                    <div className="bg-blue-100 rounded-lg p-2 sm:p-3 text-center border-2 border-blue-300">
                      <p className="text-[10px] sm:text-xs text-blue-700 mb-1 font-semibold">
                        Avg Area
                      </p>
                      <p className="text-sm sm:text-base font-bold text-blue-900">
                        {(
                          parseFloat(formData.avgLengthMm || 0) *
                          parseFloat(formData.avgWidthMm || 0)
                        ).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-blue-600">mm²</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-blue-700 mt-2 text-center">
                    ℹ️ These values are automatically calculated from sensor
                    readings
                  </p>
                </div>

                <button
                  onClick={saveTestToDatabase}
                  disabled={isSaving}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl transition shadow-lg text-sm sm:text-base"
                >
                  {isSaving
                    ? "Saving..."
                    : savedTestId
                      ? "✓ Update Test Record"
                      : "💾 Save Test to Database"}
                </button>

                {crackResult && (
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <p className="text-[10px] text-blue-700 text-center">
                      ✓ Crack mask ready - will be saved to database on save
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Average Data Summary */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6 border-t-4 border-red-600">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 sm:mb-4">
                Average Test Data
              </h3>

              {testResult ? (
                <>
                  {/* Main Focus: Compressive Strength */}
                  <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg border-2 border-red-500 mb-3 sm:mb-4">
                    <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                      <span className="text-[10px] sm:text-xs font-semibold text-red-600 uppercase tracking-wide">
                        Compressive Strength Test
                      </span>
                      <span
                        className={`${
                          testResult.status === "Passed"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        } text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full flex-shrink-0`}
                      >
                        {testResult.status === "Passed"
                          ? "✓ Passed"
                          : "✗ Failed"}
                      </span>
                    </div>

                    <div className="flex items-end gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-red-600">
                        {testResult.compressiveStrengthMpa}
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-gray-600 mb-0.5 sm:mb-1 lg:mb-2">
                        MPa
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="bg-red-50 rounded-lg p-2 sm:p-3 border border-red-200">
                        <p className="text-[10px] sm:text-xs text-gray-600 mb-1">
                          Cube Grade
                        </p>
                        <p className="text-base sm:text-lg lg:text-xl font-bold text-red-700">
                          {testResult.cubeGrade}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-200">
                        <p className="text-[10px] sm:text-xs text-gray-600 mb-1">
                          Test Date
                        </p>
                        <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-800">
                          {new Date(testResult.testDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Other Parameters */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center border border-gray-200">
                      <p className="text-[10px] sm:text-xs text-gray-600">
                        Avg. Length
                      </p>
                      <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mt-1">
                        {testResult.avgLengthMm} mm
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center border border-gray-200">
                      <p className="text-[10px] sm:text-xs text-gray-600">
                        Avg. Width
                      </p>
                      <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mt-1">
                        {testResult.avgWidthMm} mm
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center border border-gray-200">
                      <p className="text-[10px] sm:text-xs text-gray-600">
                        Avg. Area
                      </p>
                      <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mt-1">
                        {testResult.avgAreaMm2} mm²
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center border border-gray-200">
                      <p className="text-[10px] sm:text-xs text-gray-600">
                        Curing Days
                      </p>
                      <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mt-1">
                        {testResult.curingDays}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center border border-gray-200 col-span-2 sm:col-span-2">
                      <p className="text-[10px] sm:text-xs text-gray-600">
                        Applied Load
                      </p>
                      <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mt-1">
                        {testResult.appliedLoadKn} kN
                      </p>
                    </div>
                  </div>

                  {/* Saved Image Information */}
                  {testResult.crackImageUrl && (
                    <div className="mt-4 bg-green-50 border-2 border-green-200 rounded-xl p-3 sm:p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <svg
                          className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-green-800 mb-1">
                            🎭 Crack Segmentation Mask Saved to Database
                          </h4>
                          <p className="text-[10px] text-gray-600 mb-2">
                            Mask image stored in:{" "}
                            <code className="bg-green-100 px-1 py-0.5 rounded text-green-700">
                              /uploads/strength/
                            </code>
                          </p>
                          <div className="bg-white rounded-lg p-2 border border-green-300">
                            <p className="text-[10px] text-gray-500 mb-1">
                              Mask Image URL:
                            </p>
                            <a
                              href={testResult.crackImageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              {testResult.crackImageUrl}
                            </a>
                          </div>
                          {testResult.imageUploadedAt && (
                            <p className="text-[10px] text-gray-500 mt-2">
                              Uploaded:{" "}
                              {new Date(
                                testResult.imageUploadedAt,
                              ).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No test data available</p>
                  <p className="text-sm text-gray-400">
                    Fill in the test parameters and click "Save Test to
                    Database"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Crack Detection */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-5 lg:p-6 border-t-4 border-red-600">
            <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
              <h2 className="text-sm sm:text-base font-bold text-gray-900">
                AI Crack Detection
              </h2>
            </div>

            {uploadedImage || capturedImage ? (
              <div className="space-y-4">
                <div className="relative group">
                  <img
                    src={uploadedImage || capturedImage}
                    alt="Concrete sample"
                    className="w-full h-60 sm:h-72 lg:h-80 object-cover rounded-xl shadow-md border-2 border-gray-200"
                  />
                  <button
                    onClick={retakePicture}
                    className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 p-2 rounded-lg shadow-lg transition"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>
                </div>

                {crackResult ? (
                  <div className="space-y-4">
                    <div
                      className={`p-5 rounded-xl border-2 ${
                        crackResult.metrics.has_crack
                          ? "bg-red-50 border-red-300"
                          : "bg-green-50 border-green-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">
                          {crackResult.metrics.has_crack ? "⚠️" : "✓"}
                        </span>
                        <h4 className="text-base font-bold">
                          {crackResult.metrics.has_crack
                            ? "Crack Detected"
                            : "No Crack Detected"}
                        </h4>
                      </div>
                      <p className="text-lg font-semibold mb-4 text-gray-800">
                        {crackResult.message}
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Coverage</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {crackResult.metrics.crack_percentage}%
                          </p>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Pixels</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {crackResult.metrics.crack_pixels.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Show capture count if auto-captured */}
                      {autoCapturedImages.length > 0 && (
                        <div className="mt-4 bg-blue-100 border border-blue-300 rounded-lg p-3">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-2xl">📸</span>
                            <div className="text-center">
                              <p className="text-xs text-blue-700 font-semibold">Total Images Captured</p>
                              <p className="text-2xl font-bold text-blue-900">{autoCapturedImages.length}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-gray-800 mb-3">
                        Segmentation Mask
                      </h4>
                      <img
                        src={`data:image/png;base64,${crackResult.mask_base64}`}
                        alt="Crack mask"
                        className="w-full rounded-xl shadow-md border-2 border-gray-200"
                      />
                    </div>

                    <button
                      onClick={clearUpload}
                      className="w-full bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      Upload New Image
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={clearUpload}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg text-sm font-semibold transition"
                    >
                      Clear
                    </button>
                    <button
                      onClick={analyzeCrack}
                      disabled={isAnalyzing}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 rounded-lg text-sm font-semibold transition shadow-md"
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze Crack"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-xl h-60 sm:h-72 lg:h-80 flex flex-col items-center justify-center text-center p-4 sm:p-6">
                  <div className="bg-gray-200 rounded-full p-4 sm:p-6 mb-3 sm:mb-4">
                    <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">
                    No Image Selected
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Capture or upload an image of the concrete surface
                  </p>
                </div>

                <button
                  onClick={startCamera}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition shadow-md flex items-center justify-center gap-2 sm:gap-3"
                >
                  <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                  Capture with Camera
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-500">OR</span>
                  </div>
                </div>

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
                  className="w-full bg-gray-700 hover:bg-gray-800 text-white py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition shadow-md cursor-pointer flex items-center justify-center gap-2 sm:gap-3"
                >
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                  Upload from Device
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 sm:mt-10 lg:mt-12 text-center">
          <button
            onClick={onBack}
            className="w-full sm:w-auto bg-gray-700 hover:bg-gray-800 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl  text-base sm:text-lg transition shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
