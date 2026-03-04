const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const StrengthTest = require("../models/StrengthTest");

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../uploads/strength");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `crack-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpg, .jpeg, and .png image files are allowed!"));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: (process.env.MAX_FILE_SIZE_MB || 5) * 1024 * 1024, // Default 5MB
  },
  fileFilter,
});

/**
 * @route   POST /api/strength-tests
 * @desc    Create a new strength test record
 * @access  Public
 *
 * Example Request Body:
 * {
 *   "cubeId": "CUBE-001",
 *   "cubeMadeDate": "2026-02-10",
 *   "testDate": "2026-02-25",
 *   "testingTime": "10:30 AM",
 *   "predictGrade": "M20",
 *   "curingDays": 15,
 *   "appliedLoadKn": 450,
 *   "avgLengthMm": 150,
 *   "avgWidthMm": 150,
 *   "cubeGrade": "M20"
 * }
 */
router.post("/", async (req, res, next) => {
  try {
    const {
      cubeId,
      cubeMadeDate,
      testDate,
      testingTime,
      predictGrade,
      curingDays,
      appliedLoadKn,
      avgLengthMm,
      avgWidthMm,
      cubeGrade,
    } = req.body;

    // Validate required fields
    if (
      !cubeId ||
      !cubeMadeDate ||
      !testDate ||
      !testingTime ||
      !predictGrade ||
      curingDays === undefined ||
      !appliedLoadKn ||
      !avgLengthMm ||
      !avgWidthMm
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        requiredFields: [
          "cubeId",
          "cubeMadeDate",
          "testDate",
          "testingTime",
          "predictGrade",
          "curingDays",
          "appliedLoadKn",
          "avgLengthMm",
          "avgWidthMm",
        ],
      });
    }

    // Create new strength test record
    // The pre-save middleware will automatically compute:
    // - avgAreaMm2
    // - compressiveStrengthMpa
    // - status
    const strengthTest = new StrengthTest({
      cubeId,
      cubeMadeDate,
      testDate,
      testingTime,
      predictGrade: predictGrade.toUpperCase(),
      curingDays,
      appliedLoadKn,
      avgLengthMm,
      avgWidthMm,
      cubeGrade: cubeGrade ? cubeGrade.toUpperCase() : undefined,
    });

    await strengthTest.save();

    res.status(201).json({
      success: true,
      data: strengthTest,
      message: "Strength test record created successfully",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/strength-tests/:id/image
 * @desc    Upload crack image for a strength test record
 * @access  Public
 *
 * Form-data fields:
 * - image: File (jpg/jpeg/png, max 5MB)
 */
router.post("/:id/image", upload.single("image"), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid test ID format",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      });
    }

    // Find the strength test record
    const strengthTest = await StrengthTest.findById(id);
    if (!strengthTest) {
      // Delete uploaded file if record not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: "Strength test record not found",
      });
    }

    // Delete old image if exists
    if (
      strengthTest.crackImageLocalPath &&
      fs.existsSync(strengthTest.crackImageLocalPath)
    ) {
      fs.unlinkSync(strengthTest.crackImageLocalPath);
    }

    // Update record with image information
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    strengthTest.crackImageUrl = `${baseUrl}/uploads/strength/${req.file.filename}`;
    strengthTest.crackImageLocalPath = req.file.path;
    strengthTest.imageUploadedAt = new Date();

    await strengthTest.save();

    res.status(200).json({
      success: true,
      data: strengthTest,
      message: "Image uploaded successfully",
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

/**
 * @route   GET /api/strength-tests
 * @desc    Get all strength test records with pagination and filtering
 * @access  Public
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Records per page (default: 20)
 * - cubeId: Filter by cube ID (partial match)
 * - status: Filter by status (Passed/Failed)
 * - sortBy: Sort field (default: createdAt)
 * - sortOrder: Sort order - asc/desc (default: desc)
 */
router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // Build filter object
    const filter = {};

    // Filter by cubeId (partial match, case-insensitive)
    if (req.query.cubeId) {
      filter.cubeId = { $regex: req.query.cubeId, $options: "i" };
    }

    // Filter by status
    if (req.query.status && ["Passed", "Failed"].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    // Execute query with pagination
    const [tests, total] = await Promise.all([
      StrengthTest.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      StrengthTest.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: tests,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: total,
        recordsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/strength-tests/:id
 * @desc    Get a single strength test record by ID
 * @access  Public
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid test ID format",
      });
    }

    const strengthTest = await StrengthTest.findById(id);

    if (!strengthTest) {
      return res.status(404).json({
        success: false,
        error: "Strength test record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: strengthTest,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/strength-tests/:id
 * @desc    Delete a strength test record (bonus feature)
 * @access  Public
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid test ID format",
      });
    }

    const strengthTest = await StrengthTest.findById(id);

    if (!strengthTest) {
      return res.status(404).json({
        success: false,
        error: "Strength test record not found",
      });
    }

    // Delete associated image file if exists
    if (
      strengthTest.crackImageLocalPath &&
      fs.existsSync(strengthTest.crackImageLocalPath)
    ) {
      fs.unlinkSync(strengthTest.crackImageLocalPath);
    }

    await strengthTest.deleteOne();

    res.status(200).json({
      success: true,
      message: "Strength test record deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/strength-tests/:id
 * @desc    Update a strength test record
 * @access  Public
 */
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid test ID format",
      });
    }

    const strengthTest = await StrengthTest.findById(id);

    if (!strengthTest) {
      return res.status(404).json({
        success: false,
        error: "Strength test record not found",
      });
    }

    // Extract updatable fields from request body
    const {
      cubeId,
      cubeMadeDate,
      testDate,
      testingTime,
      predictGrade,
      curingDays,
      appliedLoadKn,
      avgLengthMm,
      avgWidthMm,
      cubeGrade,
      compressiveStrengthMpa,
      avgAreaMm2,
      status,
    } = req.body;

    // Update fields if provided
    if (cubeId !== undefined) strengthTest.cubeId = cubeId;
    if (cubeMadeDate !== undefined) strengthTest.cubeMadeDate = cubeMadeDate;
    if (testDate !== undefined) strengthTest.testDate = testDate;
    if (testingTime !== undefined) strengthTest.testingTime = testingTime;
    if (predictGrade !== undefined)
      strengthTest.predictGrade = predictGrade.toUpperCase();
    if (curingDays !== undefined) strengthTest.curingDays = curingDays;
    if (appliedLoadKn !== undefined) strengthTest.appliedLoadKn = appliedLoadKn;
    if (avgLengthMm !== undefined) strengthTest.avgLengthMm = avgLengthMm;
    if (avgWidthMm !== undefined) strengthTest.avgWidthMm = avgWidthMm;
    if (cubeGrade !== undefined)
      strengthTest.cubeGrade = cubeGrade.toUpperCase();

    // Allow manual override of calculated fields
    if (compressiveStrengthMpa !== undefined)
      strengthTest.compressiveStrengthMpa = compressiveStrengthMpa;
    if (avgAreaMm2 !== undefined) strengthTest.avgAreaMm2 = avgAreaMm2;
    if (status !== undefined) strengthTest.status = status;

    // Save will trigger pre-save middleware to recalculate if needed
    await strengthTest.save();

    res.status(200).json({
      success: true,
      data: strengthTest,
      message: "Strength test record updated successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
