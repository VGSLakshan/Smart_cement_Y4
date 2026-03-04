const mongoose = require("mongoose");

/**
 * Grade threshold mapping for Pass/Fail determination
 * Maps concrete grade to minimum required compressive strength in MPa
 */
const GRADE_THRESHOLDS = {
  M10: 10,
  M15: 15,
  M20: 20,
  M25: 25,
  M30: 30,
  M35: 35,
  M40: 40,
  M45: 45,
  M50: 50,
};

/**
 * Determine cube grade based on compressive strength ranges
 * @param {Number} strength - Compressive strength in MPa
 * @returns {String} Grade (M10, M15, M20, etc.)
 */
const determineCubeGrade = (strength) => {
  if (strength >= 7.5 && strength < 12.5) return "M10";
  if (strength >= 12.5 && strength < 17.5) return "M15";
  if (strength >= 17.5 && strength < 22.5) return "M20";
  if (strength >= 22.5 && strength < 27.5) return "M25";
  if (strength >= 27.5 && strength < 32.5) return "M30";
  if (strength >= 32.5 && strength < 37.5) return "M35";
  if (strength >= 37.5 && strength < 42.5) return "M40";
  if (strength >= 42.5 && strength < 47.5) return "M45";
  if (strength >= 47.5 && strength <= 52.5) return "M50";

  // For strengths outside the range, return closest grade
  if (strength < 7.5) return "M10";
  return "M50";
};

const strengthTestSchema = new mongoose.Schema(
  {
    // Basic Test Identification
    cubeId: {
      type: String,
      required: [true, "Cube ID is required"],
      trim: true,
      index: true,
    },

    // Date and Time Information
    cubeMadeDate: {
      type: Date,
      required: [true, "Cube Made Date is required"],
    },
    testDate: {
      type: Date,
      required: [true, "Test Date is required"],
    },
    testingTime: {
      type: String,
      required: [true, "Testing Time is required"],
      trim: true,
    },

    // Curing Information
    curingDays: {
      type: Number,
      required: [true, "Curing Days is required"],
      min: [0, "Curing Days cannot be negative"],
    },

    // Grade Information
    predictGrade: {
      type: String,
      required: [true, "Predict Grade is required"],
      trim: true,
      uppercase: true,
    },
    cubeGrade: {
      type: String,
      trim: true,
      uppercase: true,
    },

    // Dimensional Measurements
    avgLengthMm: {
      type: Number,
      required: [true, "Average Length is required"],
      min: [0, "Average Length must be positive"],
    },
    avgWidthMm: {
      type: Number,
      required: [true, "Average Width is required"],
      min: [0, "Average Width must be positive"],
    },
    avgAreaMm2: {
      type: Number,
      min: [0, "Average Area must be positive"],
    },

    // Load and Strength Measurements
    appliedLoadKn: {
      type: Number,
      required: [true, "Applied Load is required"],
      min: [0, "Applied Load must be positive"],
    },
    compressiveStrengthMpa: {
      type: Number,
      min: [0, "Compressive Strength must be positive"],
    },

    // Test Result
    status: {
      type: String,
      enum: ["Passed", "Failed"],
      index: true,
    },

    // Image Information (Optional)
    crackImageUrl: {
      type: String,
      trim: true,
    },
    crackImageLocalPath: {
      type: String,
      trim: true,
    },
    imageUploadedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index for efficient queries
strengthTestSchema.index({ cubeId: 1, testDate: -1 });
strengthTestSchema.index({ status: 1, createdAt: -1 });

/**
 * Static method to compute test results
 * @param {Object} testData - Input test data
 * @returns {Object} Computed fields
 */
strengthTestSchema.statics.computeTestResults = function (testData) {
  const { avgLengthMm, avgWidthMm, appliedLoadKn, predictGrade } = testData;

  // Calculate average area (mm²)
  const avgAreaMm2 = avgLengthMm * avgWidthMm;

  // Calculate compressive strength (MPa)
  // Formula: Strength = Force(N) / Area(mm²)
  // Since 1 kN = 1000 N, and result is in N/mm² which equals MPa
  const compressiveStrengthMpa = (appliedLoadKn * 1000) / avgAreaMm2;

  // Determine cube grade based on compressive strength ranges
  const determinedCubeGrade = determineCubeGrade(compressiveStrengthMpa);

  // Compare determined grade with predicted grade to set Pass/Fail status
  const status =
    determinedCubeGrade === predictGrade?.toUpperCase() ? "Passed" : "Failed";

  return {
    avgAreaMm2: Math.round(avgAreaMm2 * 100) / 100, // Round to 2 decimals
    compressiveStrengthMpa: Math.round(compressiveStrengthMpa * 100) / 100,
    status,
    cubeGrade: determinedCubeGrade,
  };
};

/**
 * Pre-save middleware to compute derived fields
 */
strengthTestSchema.pre("save", function (next) {
  // Only compute if this is a new document or relevant fields changed
  if (
    this.isNew ||
    this.isModified("avgLengthMm") ||
    this.isModified("avgWidthMm") ||
    this.isModified("appliedLoadKn") ||
    this.isModified("predictGrade")
  ) {
    const computed = this.constructor.computeTestResults({
      avgLengthMm: this.avgLengthMm,
      avgWidthMm: this.avgWidthMm,
      appliedLoadKn: this.appliedLoadKn,
      predictGrade: this.predictGrade,
    });

    this.avgAreaMm2 = computed.avgAreaMm2;
    this.compressiveStrengthMpa = computed.compressiveStrengthMpa;
    this.status = computed.status;
    this.cubeGrade = computed.cubeGrade; // Always set from computed result
  }
  next();
});

const StrengthTest = mongoose.model("StrengthTest", strengthTestSchema);

module.exports = StrengthTest;
module.exports.GRADE_THRESHOLDS = GRADE_THRESHOLDS;
