const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ClinkerPrediction = require("../models/ClinkerPrediction");

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/clinker");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "clinker-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|tiff|bmp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

/**
 * Save clinker prediction result
 * POST /api/clinker-predictions
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const {
      sampleName,
      predictedClass,
      confidence,
      rejected,
      top3Predictions,
      allProbabilities,
      phaseDescription,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file uploaded",
      });
    }

    // Parse JSON strings if they were sent as strings
    const parsedTop3 =
      typeof top3Predictions === "string"
        ? JSON.parse(top3Predictions)
        : top3Predictions;
    const parsedProbs =
      typeof allProbabilities === "string"
        ? JSON.parse(allProbabilities)
        : allProbabilities;

    const imagePath = `/uploads/clinker/${req.file.filename}`;

    const newPrediction = new ClinkerPrediction({
      sampleName: sampleName || `Clinker-${Date.now()}`,
      imagePath: imagePath,
      originalFilename: req.file.originalname,
      predictedClass,
      confidence: parseFloat(confidence),
      rejected: rejected === "true" || rejected === true,
      top3Predictions: parsedTop3,
      allProbabilities: parsedProbs,
      phaseDescription: phaseDescription || "",
    });

    await newPrediction.save();

    res.status(201).json({
      success: true,
      message: "Clinker prediction saved successfully",
      data: newPrediction,
    });
  } catch (error) {
    console.error("Error saving clinker prediction:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get all clinker predictions
 * GET /api/clinker-predictions
 */
router.get("/", async (req, res) => {
  try {
    const {
      limit = 50,
      skip = 0,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const predictions = await ClinkerPrediction.find()
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ClinkerPrediction.countDocuments();

    res.status(200).json({
      success: true,
      data: predictions,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: total > parseInt(skip) + parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching clinker predictions:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get single clinker prediction by ID
 * GET /api/clinker-predictions/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const prediction = await ClinkerPrediction.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: "Prediction not found",
      });
    }

    res.status(200).json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error("Error fetching clinker prediction:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Delete clinker prediction by ID
 * DELETE /api/clinker-predictions/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const prediction = await ClinkerPrediction.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: "Prediction not found",
      });
    }

    // Delete the image file
    const imagePath = path.join(__dirname, "../..", prediction.imagePath);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await ClinkerPrediction.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Prediction deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting clinker prediction:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get statistics
 * GET /api/clinker-predictions/stats
 */
router.get("/statistics/summary", async (req, res) => {
  try {
    const total = await ClinkerPrediction.countDocuments();

    const classDistribution = await ClinkerPrediction.aggregate([
      {
        $group: {
          _id: "$predictedClass",
          count: { $sum: 1 },
          avgConfidence: { $avg: "$confidence" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const rejectedCount = await ClinkerPrediction.countDocuments({
      rejected: true,
    });

    const avgConfidence = await ClinkerPrediction.aggregate([
      {
        $group: {
          _id: null,
          avgConfidence: { $avg: "$confidence" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        classDistribution,
        rejectedCount,
        rejectedPercentage: total > 0 ? (rejectedCount / total) * 100 : 0,
        overallAvgConfidence:
          avgConfidence.length > 0 ? avgConfidence[0].avgConfidence : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
