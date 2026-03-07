const mongoose = require("mongoose");

const particleIdentificationSchema = new mongoose.Schema({
  sampleName: {
    type: String,
    required: true
  },

  imagePath: {
    type: String
  },

  microscopic: {
    type: Boolean
  },

  particleCounts: {
    dark_red: Number,
    light_red: Number,
    white: Number
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("ParticleIdentification", particleIdentificationSchema);