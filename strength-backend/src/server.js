require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const strengthTestsRouter = require("./routes/strengthTests");
const cementPredictionsRouter = require("./routes/cementPredictions");
const errorHandler = require("./middleware/errorHandler");

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API Routes
app.use("/api/strength-tests", strengthTestsRouter);
app.use("/api/cement-predictions", cementPredictionsRouter);

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
const server = app.listen(PORT, () => {
  console.log("");
  console.log("=".repeat(50));
  console.log("🚀 Cement Strength Test API Server");
  console.log("=".repeat(50));
  console.log(`📡 Server running on port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("=".repeat(50));
  console.log("");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n👋 SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(0);
  });
});

module.exports = app;
