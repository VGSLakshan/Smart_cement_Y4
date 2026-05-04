const express = require("express");
const fs = require("fs");
const path = require("path");
const ParticleIdentification = require("../models/ParticleIdentification");

const router = express.Router();

/**
 * Get all particle detection results
 */
router.get("/", async (req, res) => {
  try {
    const records = await ParticleIdentification.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/particle-identification/:id
 * @desc    Delete a particle identification record and its uploaded image (if any)
 * @access  Public
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Basic ObjectId check
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid id format" });
    }

    const record = await ParticleIdentification.findById(id);
    if (!record) {
      return res
        .status(404)
        .json({ success: false, error: "Record not found" });
    }

    // Try to remove any associated image file. Accept either `imagePath` or `sampleName`-based file.
    try {
      if (record.imagePath) {
        // If imagePath is a URL, skip deletion. If it's a local path, remove it.
        const possibleLocal = record.imagePath.replace(/^file:\/\//, "");
        const abs = path.isAbsolute(possibleLocal)
          ? possibleLocal
          : path.join(__dirname, "../../", possibleLocal);
        if (fs.existsSync(abs)) {
          fs.unlinkSync(abs);
        }
      } else if (record.sampleName) {
        const candidate = path.join(
          __dirname,
          "../../uploads",
          record.sampleName,
        );
        if (fs.existsSync(candidate)) fs.unlinkSync(candidate);
      }
    } catch (e) {
      // Log and continue; failure to delete image should not block record deletion
      console.warn(
        "Failed removing associated image for particle identification:",
        e.message,
      );
    }

    await record.deleteOne();

    res.json({ success: true, message: "Record deleted" });
  } catch (error) {
    console.error("Error deleting particle identification record:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Save particle detection result
 */
router.post("/", async (req, res) => {
  try {
    const { sampleName, imagePath, microscopic, particleCounts } = req.body;

    const newRecord = new ParticleIdentification({
      sampleName,
      imagePath,
      microscopic,
      particleCounts,
    });

    await newRecord.save();

    res.status(201).json({
      success: true,
      data: newRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
