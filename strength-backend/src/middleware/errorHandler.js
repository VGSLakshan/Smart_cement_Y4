/**
 * Centralized Error Handler Middleware
 * Handles all errors thrown in the application
 */

const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error("❌ Error:", err);

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = null;

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
    errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));
  }

  // Mongoose Cast Error (Invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    message = `Duplicate value for field: ${field}`;
  }

  // Multer File Upload Errors
  if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 5}MB`;
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected file field";
    } else {
      message = err.message;
    }
  }

  // Custom file filter error
  if (err.message && err.message.includes("Only .jpg, .jpeg, and .png")) {
    statusCode = 400;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    errors,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
