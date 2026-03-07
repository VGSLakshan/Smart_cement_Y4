const mongoose = require("mongoose");

/**
 * MongoDB Schema for storing Cement Strength Predictions
 * Used by Hirumi's cement strength prediction model
 */

const cementStrengthPredictionSchema = new mongoose.Schema(
  {
    // Input Parameters - Grinding Properties
    inputParameters: {
      grinding: {
        initial_min: {
          type: Number,
          required: [true, "Initial grinding time is required"],
        },
        final_min: {
          type: Number,
          required: [true, "Final grinding time is required"],
        },
        residue_45um: {
          type: Number,
          required: [true, "Residue 45µm is required"],
        },
        fineness: {
          type: Number,
          required: [true, "Fineness is required"],
        },
        loi: {
          type: Number,
          required: [true, "L.O.I. is required"],
        },
      },

      // Input Parameters - Chemical Composition (Oxides in %)
      chemicalComposition: {
        sio2: {
          type: Number,
          required: [true, "SiO₂ is required"],
        },
        al2o3: {
          type: Number,
          required: [true, "Al₂O₃ is required"],
        },
        fe2o3: {
          type: Number,
          required: [true, "Fe₂O₃ is required"],
        },
        cao: {
          type: Number,
          required: [true, "CaO is required"],
        },
        mgo: {
          type: Number,
          required: [true, "MgO is required"],
        },
        so3: {
          type: Number,
          required: [true, "SO₃ is required"],
        },
        k2o: {
          type: Number,
          required: [true, "K₂O is required"],
        },
        na2o: {
          type: Number,
          required: [true, "Na₂O is required"],
        },
        cl: {
          type: Number,
          required: [true, "Cl is required"],
        },
      },
    },

    // Predicted Strength Values (in MPa)
    predictions: {
      strength_1d: {
        type: Number,
        required: [true, "1-day strength prediction is required"],
      },
      strength_2d: {
        type: Number,
        required: [true, "2-day strength prediction is required"],
      },
      strength_7d: {
        type: Number,
        required: [true, "7-day strength prediction is required"],
      },
      strength_28d: {
        type: Number,
        required: [true, "28-day strength prediction is required"],
      },
      strength_56d: {
        type: Number,
        required: [true, "56-day strength prediction is required"],
      },
    },

    // Model Metadata
    modelInfo: {
      modelUsed: {
        type: String,
        default: "Ensemble (XGBoost + LightGBM)",
      },
      confidence: {
        type: String,
        default: "High",
      },
      engineeredFeaturesCount: {
        type: Number,
        default: 0,
      },
    },

    // Optional User Information (for future use)
    userInfo: {
      userId: {
        type: String,
        default: null,
      },
      sessionId: {
        type: String,
        default: null,
      },
      userName: {
        type: String,
        default: null,
      },
    },

    // Additional Metadata
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for faster querying
cementStrengthPredictionSchema.index({ createdAt: -1 });
cementStrengthPredictionSchema.index({ "predictions.strength_28d": 1 });
cementStrengthPredictionSchema.index({ "userInfo.userId": 1 });

// Virtual: Calculate strength development rate (28d to 56d)
cementStrengthPredictionSchema.virtual("strengthGrowthRate").get(function () {
  if (this.predictions.strength_28d && this.predictions.strength_56d) {
    const growth =
      ((this.predictions.strength_56d - this.predictions.strength_28d) /
        this.predictions.strength_28d) *
      100;
    return parseFloat(growth.toFixed(2));
  }
  return 0;
});

// Virtual: Calculate average strength
cementStrengthPredictionSchema.virtual("averageStrength").get(function () {
  const strengths = [
    this.predictions.strength_1d,
    this.predictions.strength_2d,
    this.predictions.strength_7d,
    this.predictions.strength_28d,
    this.predictions.strength_56d,
  ];
  const sum = strengths.reduce((acc, val) => acc + val, 0);
  return parseFloat((sum / strengths.length).toFixed(2));
});

// Method: Get summary for display
cementStrengthPredictionSchema.methods.getSummary = function () {
  return {
    id: this._id,
    createdAt: this.createdAt,
    strength_28d: this.predictions.strength_28d,
    strength_56d: this.predictions.strength_56d,
    fineness: this.inputParameters.grinding.fineness,
    modelUsed: this.modelInfo.modelUsed,
  };
};

// Static method: Get recent predictions
cementStrengthPredictionSchema.statics.getRecent = function (days = 7, limit = 50) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({ createdAt: { $gte: startDate } })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method: Get statistics
cementStrengthPredictionSchema.statics.getStatistics = async function () {
  const totalCount = await this.countDocuments();

  const avgResult = await this.aggregate([
    {
      $group: {
        _id: null,
        avg_28d: { $avg: "$predictions.strength_28d" },
        avg_56d: { $avg: "$predictions.strength_56d" },
        max_28d: { $max: "$predictions.strength_28d" },
        min_28d: { $min: "$predictions.strength_28d" },
      },
    },
  ]);

  const stats = avgResult[0] || {};

  return {
    totalPredictions: totalCount,
    average28dStrength: stats.avg_28d ? parseFloat(stats.avg_28d.toFixed(2)) : 0,
    average56dStrength: stats.avg_56d ? parseFloat(stats.avg_56d.toFixed(2)) : 0,
    max28dStrength: stats.max_28d ? parseFloat(stats.max_28d.toFixed(2)) : 0,
    min28dStrength: stats.min_28d ? parseFloat(stats.min_28d.toFixed(2)) : 0,
  };
};

const CementStrengthPrediction = mongoose.model(
  "CementStrengthPrediction",
  cementStrengthPredictionSchema
);

module.exports = CementStrengthPrediction;
