require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const strengthTestsRouter = require("./routes/strengthTests");
const cementPredictionsRouter = require("./routes/cementPredictions");
const clinkerPredictionsRouter = require("./routes/clinkerPredictions");
const errorHandler = require("./middleware/errorHandler");
const particleRoutes = require("./routes/particleIdentification");
const mqttService = require("./services/mqttService");

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "*", // In production, specify your frontend URL
    methods: ["GET", "POST"],
  },
});

// Connect to MongoDB
connectDB();

// Initialize MQTT Service with Socket.IO
mqttService.initialize(io);

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Serve static files from Python backend uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../../backend/app/uploads")));

// API Routes
app.use("/api/strength-tests", strengthTestsRouter);
app.use("/api/particle-identification", particleRoutes);
app.use("/api/cement-predictions", cementPredictionsRouter);
app.use("/api/clinker-predictions", clinkerPredictionsRouter);

// MQTT Control Routes
app.post("/api/sensor/start-test", (req, res) => {
  try {
    const result = mqttService.startTest();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/sensor/data", (req, res) => {
  res.status(200).json({
    success: true,
    data: mqttService.getSensorData(),
  });
});

app.get("/api/sensor/status", (req, res) => {
  res.status(200).json({
    success: true,
    ...mqttService.getStatus(),
  });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Send current sensor data to newly connected client
  socket.emit("initialData", mqttService.getSensorData());

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    mongodb: {
      status: "connected",
      database: process.env.MONGODB_URI ? "configured" : "not configured",
    },
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Cement Compressive Strength Test API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      // Compressive Strength Tests
      createTest: "POST /api/strength-tests",
      uploadImage: "POST /api/strength-tests/:id/image",
      listTests: "GET /api/strength-tests",
      getTest: "GET /api/strength-tests/:id",
      deleteTest: "DELETE /api/strength-tests/:id",
      // Cement Strength Predictions
      savePrediction: "POST /api/cement-predictions",
      listPredictions: "GET /api/cement-predictions",
      getPrediction: "GET /api/cement-predictions/:id",
      recentPredictions: "GET /api/cement-predictions/recent/:days",
      statistics: "GET /api/cement-predictions/statistics/summary",
      searchPredictions: "POST /api/cement-predictions/search",
      deletePrediction: "DELETE /api/cement-predictions/:id",
    },
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("");
  console.log("=".repeat(50));
  console.log("🚀 Cement Strength Test API Server");
  console.log("=".repeat(50));
  console.log(`📡 Server running on port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.IO enabled`);
  console.log(`📱 MQTT enabled`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("=".repeat(50));
  console.log("");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM signal received: closing HTTP server");
  mqttService.close();
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n👋 SIGINT signal received: closing HTTP server");
  mqttService.close();
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

module.exports = app;
