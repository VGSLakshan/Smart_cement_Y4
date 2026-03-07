/**
 * Test script for Cement Strength Predictions API
 * Run with: node test-cement-predictions.js
 */

const BASE_URL = "http://localhost:5000/api/cement-predictions";

// Sample prediction data
const samplePrediction = {
  inputParameters: {
    grinding: {
      initial_min: 160,
      final_min: 200,
      residue_45um: 3.2,
      fineness: 3790,
      loi: 4.37,
    },
    chemicalComposition: {
      sio2: 30.05,
      al2o3: 10.45,
      fe2o3: 4.84,
      cao: 45.88,
      mgo: 1.5,
      so3: 2.02,
      k2o: 0.53,
      na2o: 0.31,
      cl: 0.025,
    },
  },
  predictions: {
    strength_1d: 15.2,
    strength_2d: 22.4,
    strength_7d: 35.6,
    strength_28d: 48.3,
    strength_56d: 52.1,
  },
  modelInfo: {
    modelUsed: "Ensemble (XGBoost + LightGBM)",
    confidence: "High",
    engineeredFeaturesCount: 30,
  },
  notes: "Test prediction from API test script",
  tags: ["test", "sample"],
};

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test functions
async function test1_SavePrediction() {
  console.log("\n📝 Test 1: Save New Prediction");
  console.log("=".repeat(50));

  const result = await apiRequest("POST", "", samplePrediction);

  if (result.success) {
    console.log("✅ SUCCESS: Prediction saved");
    console.log("   ID:", result.data.data._id);
    console.log("   28D Strength:", result.data.data.predictions.strength_28d, "MPa");
    return result.data.data._id;
  } else {
    console.log("❌ FAILED:", result.data.message || result.error);
    return null;
  }
}

async function test2_GetAllPredictions() {
  console.log("\n📋 Test 2: Get All Predictions");
  console.log("=".repeat(50));

  const result = await apiRequest("GET", "?limit=10");

  if (result.success) {
    console.log("✅ SUCCESS: Retrieved predictions");
    console.log("   Total:", result.data.data.length);
    console.log(
      "   Pages:",
      result.data.pagination.pages,
      "| Current Page:",
      result.data.pagination.page
    );
  } else {
    console.log("❌ FAILED:", result.data.message || result.error);
  }
}

async function test3_GetPredictionById(id) {
  if (!id) return;

  console.log("\n🔍 Test 3: Get Prediction by ID");
  console.log("=".repeat(50));

  const result = await apiRequest("GET", `/${id}`);

  if (result.success) {
    console.log("✅ SUCCESS: Retrieved prediction");
    console.log("   Fineness:", result.data.data.inputParameters.grinding.fineness);
    console.log("   28D:", result.data.data.predictions.strength_28d, "MPa");
    console.log("   56D:", result.data.data.predictions.strength_56d, "MPa");
  } else {
    console.log("❌ FAILED:", result.data.message || result.error);
  }
}

async function test4_GetStatistics() {
  console.log("\n📊 Test 4: Get Statistics");
  console.log("=".repeat(50));

  const result = await apiRequest("GET", "/statistics/summary");

  if (result.success) {
    console.log("✅ SUCCESS: Retrieved statistics");
    const stats = result.data.statistics;
    console.log("   Total Predictions:", stats.totalPredictions);
    console.log("   Avg 28D Strength:", stats.average28dStrength, "MPa");
    console.log("   Avg 56D Strength:", stats.average56dStrength, "MPa");
    console.log("   Recent (7 days):", stats.recentPredictions7Days);
  } else {
    console.log("❌ FAILED:", result.data.message || result.error);
  }
}

async function test5_SearchPredictions() {
  console.log("\n🔎 Test 5: Search Predictions");
  console.log("=".repeat(50));

  const searchCriteria = {
    minStrength28d: 40,
    maxStrength28d: 60,
    limit: 10,
  };

  const result = await apiRequest("POST", "/search", searchCriteria);

  if (result.success) {
    console.log("✅ SUCCESS: Search completed");
    console.log("   Found:", result.data.count, "predictions");
    console.log("   Criteria: 28D strength between 40-60 MPa");
  } else {
    console.log("❌ FAILED:", result.data.message || result.error);
  }
}

async function test6_UpdatePrediction(id) {
  if (!id) return;

  console.log("\n✏️  Test 6: Update Prediction");
  console.log("=".repeat(50));

  const updates = {
    notes: "Updated: This is a test prediction with modified notes",
    tags: ["test", "updated", "verified"],
  };

  const result = await apiRequest("PUT", `/${id}`, updates);

  if (result.success) {
    console.log("✅ SUCCESS: Prediction updated");
    console.log("   New Notes:", result.data.data.notes);
    console.log("   New Tags:", result.data.data.tags.join(", "));
  } else {
    console.log("❌ FAILED:", result.data.message || result.error);
  }
}

async function test7_DeletePrediction(id) {
  if (!id) return;

  console.log("\n🗑️  Test 7: Delete Prediction");
  console.log("=".repeat(50));

  const result = await apiRequest("DELETE", `/${id}`);

  if (result.success) {
    console.log("✅ SUCCESS: Prediction deleted");
  } else {
    console.log("❌ FAILED:", result.data.message || result.error);
  }
}

// Run all tests
async function runTests() {
  console.log("\n");
  console.log("=".repeat(50));
  console.log("🧪 CEMENT STRENGTH PREDICTIONS API TEST SUITE");
  console.log("=".repeat(50));
  console.log("Server:", BASE_URL);
  console.log("");

  let predictionId = null;

  try {
    predictionId = await test1_SavePrediction();
    await test2_GetAllPredictions();
    await test3_GetPredictionById(predictionId);
    await test4_GetStatistics();
    await test5_SearchPredictions();
    await test6_UpdatePrediction(predictionId);
    await test7_DeletePrediction(predictionId);

    console.log("\n");
    console.log("=".repeat(50));
    console.log("✅ ALL TESTS COMPLETED");
    console.log("=".repeat(50));
    console.log("");
  } catch (error) {
    console.error("\n❌ Test suite failed:", error.message);
  }
}

// Check if server is running before tests
async function checkServer() {
  try {
    const response = await fetch("http://localhost:5000/health");
    if (response.ok) {
      console.log("✅ Server is running");
      return true;
    }
  } catch (error) {
    console.log("❌ Server is not running!");
    console.log("   Please start the server with: npm start");
    console.log("   in the strength-backend directory");
    return false;
  }
}

// Main execution
checkServer().then((isRunning) => {
  if (isRunning) {
    runTests();
  }
});
