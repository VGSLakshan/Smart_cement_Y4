const express = require("express");
const ParticleIdentification = require("../models/ParticleIdentification");

const router = express.Router();

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