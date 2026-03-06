const express = require("express");
const router = express.Router();
const CementStrengthPrediction = require("../models/CementStrengthPrediction");

/**
 * @route   POST /api/cement-predictions
 * @desc    Save a new cement strength prediction
 * @access  Public
 */
router.post("/", async (req, res) => {
  try {
    const {
      inputParameters,
      predictions,
      modelInfo,
      userInfo,
      notes,
      tags,
    } = req.body;

    // Validate required fields
    if (!inputParameters || !predictions) {
      return res.status(400).json({
        success: false,
        message: "Input parameters and predictions are required",
      });
    }

    // Create new prediction document
    const newPrediction = new CementStrengthPrediction({
      inputParameters,
      predictions,
      modelInfo,
      userInfo,
      notes,
      tags,
    });

    // Save to database
    const savedPrediction = await newPrediction.save();

    res.status(201).json({
      success: true,
      message: "Prediction saved successfully",
      data: savedPrediction,
    });
  } catch (error) {
    console.error("Error saving prediction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save prediction",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/cement-predictions
 * @desc    Get all predictions with pagination
 * @access  Public
 * @query   page, limit, sortBy, order
 */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const sortBy = req.query.sortBy || "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = order;

    // Get predictions
    const predictions = await CementStrengthPrediction.find()
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await CementStrengthPrediction.countDocuments();

    res.json({
      success: true,
      data: predictions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching predictions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch predictions",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/cement-predictions/:id
 * @desc    Get a single prediction by ID
 * @access  Public
 */
router.get("/:id", async (req, res) => {
  try {
    const prediction = await CementStrengthPrediction.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: "Prediction not found",
      });
    }

    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error("Error fetching prediction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch prediction",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/cement-predictions/recent/:days
 * @desc    Get predictions from the last N days
 * @access  Public
 */
router.get("/recent/:days", async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 7;
    const limit = parseInt(req.query.limit) || 50;

    const predictions = await CementStrengthPrediction.getRecent(days, limit);

    res.json({
      success: true,
      days,
      count: predictions.length,
      data: predictions,
    });
  } catch (error) {
    console.error("Error fetching recent predictions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent predictions",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/cement-predictions/statistics/summary
 * @desc    Get statistics about all predictions
 * @access  Public
 */
router.get("/statistics/summary", async (req, res) => {
  try {
    const stats = await CementStrengthPrediction.getStatistics();

    // Get recent count (last 7 days)
    const recentPredictions = await CementStrengthPrediction.getRecent(7);

    res.json({
      success: true,
      statistics: {
        ...stats,
        recentPredictions7Days: recentPredictions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/cement-predictions/:id
 * @desc    Update a prediction
 * @access  Public
 */
router.put("/:id", async (req, res) => {
  try {
    const { notes, tags } = req.body;

    const prediction = await CementStrengthPrediction.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: "Prediction not found",
      });
    }

    // Update allowed fields
    if (notes !== undefined) prediction.notes = notes;
    if (tags !== undefined) prediction.tags = tags;

    const updatedPrediction = await prediction.save();

    res.json({
      success: true,
      message: "Prediction updated successfully",
      data: updatedPrediction,
    });
  } catch (error) {
    console.error("Error updating prediction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update prediction",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/cement-predictions/:id
 * @desc    Delete a prediction
 * @access  Public
 */
router.delete("/:id", async (req, res) => {
  try {
    const prediction = await CementStrengthPrediction.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: "Prediction not found",
      });
    }

    await prediction.deleteOne();

    res.json({
      success: true,
      message: "Prediction deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting prediction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete prediction",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/cement-predictions/search
 * @desc    Search predictions by criteria
 * @access  Public
 */
router.post("/search", async (req, res) => {
  try {
    const {
      minStrength28d,
      maxStrength28d,
      minFineness,
      maxFineness,
      startDate,
      endDate,
      limit = 50,
    } = req.body;

    // Build query
    const query = {};

    if (minStrength28d || maxStrength28d) {
      query["predictions.strength_28d"] = {};
      if (minStrength28d)
        query["predictions.strength_28d"].$gte = minStrength28d;
      if (maxStrength28d)
        query["predictions.strength_28d"].$lte = maxStrength28d;
    }

    if (minFineness || maxFineness) {
      query["inputParameters.grinding.fineness"] = {};
      if (minFineness)
        query["inputParameters.grinding.fineness"].$gte = minFineness;
      if (maxFineness)
        query["inputParameters.grinding.fineness"].$lte = maxFineness;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const predictions = await CementStrengthPrediction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      count: predictions.length,
      data: predictions,
    });
  } catch (error) {
    console.error("Error searching predictions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search predictions",
      error: error.message,
    });
  }
});

module.exports = router;
