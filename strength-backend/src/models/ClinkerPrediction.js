const mongoose = require("mongoose");

const clinkerPredictionSchema = new mongoose.Schema({
  sampleName: {
    type: String,
    required: true,
  },

  imagePath: {
    type: String,
    required: true,
  },

  originalFilename: {
    type: String,
    required: true,
  },

  predictedClass: {
    type: String,
    required: true,
  },

  confidence: {
    type: Number,
    required: true,
  },

  rejected: {
    type: Boolean,
    default: false,
  },

  top3Predictions: [
    {
      class: String,
      confidence: Number,
    },
  ],

  allProbabilities: {
    type: Map,
    of: Number,
  },

  phaseDescription: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ClinkerPrediction", clinkerPredictionSchema);
