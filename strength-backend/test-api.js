/**
 * Simple API Test Script
 * Run with: node test-api.js
 *
 * Make sure server is running first: npm start
 */

const http = require("http");

// Configuration
const BASE_URL = "http://localhost:5000";
let createdTestId = null;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(url, options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Test functions
async function test1_healthCheck() {
  console.log("\n📋 Test 1: Health Check");
  console.log("─".repeat(50));
  try {
    const response = await makeRequest("GET", "/health");
    console.log("✅ Status:", response.status);
    console.log("✅ Response:", JSON.stringify(response.data, null, 2));
    return response.status === 200;
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

async function test2_createTest() {
  console.log("\n📋 Test 2: Create Strength Test");
  console.log("─".repeat(50));

  const testData = {
    cubeId: `TEST-${Date.now()}`,
    cubeMadeDate: "2026-02-01",
    testDate: "2026-02-25",
    testingTime: "09:30 AM",
    predictGrade: "M20",
    curingDays: 24,
    appliedLoadKn: 450,
    avgLengthMm: 150,
    avgWidthMm: 150,
    cubeGrade: "M20",
  };

  try {
    const response = await makeRequest("POST", "/api/strength-tests", testData);
    console.log("✅ Status:", response.status);
    console.log("✅ Created Test ID:", response.data.data._id);
    console.log(
      "✅ Computed Strength:",
      response.data.data.compressiveStrengthMpa,
      "MPa",
    );
    console.log("✅ Status:", response.data.data.status);

    createdTestId = response.data.data._id;
    return response.status === 201;
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

async function test3_getAllTests() {
  console.log("\n📋 Test 3: Get All Tests");
  console.log("─".repeat(50));

  try {
    const response = await makeRequest(
      "GET",
      "/api/strength-tests?page=1&limit=5",
    );
    console.log("✅ Status:", response.status);
    console.log("✅ Total Records:", response.data.pagination.totalRecords);
    console.log("✅ Records Retrieved:", response.data.data.length);
    return response.status === 200;
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

async function test4_getTestById() {
  console.log("\n📋 Test 4: Get Test by ID");
  console.log("─".repeat(50));

  if (!createdTestId) {
    console.log("⚠️  Skipped: No test ID available");
    return true;
  }

  try {
    const response = await makeRequest(
      "GET",
      `/api/strength-tests/${createdTestId}`,
    );
    console.log("✅ Status:", response.status);
    console.log("✅ Test ID:", response.data.data._id);
    console.log("✅ Cube ID:", response.data.data.cubeId);
    return response.status === 200;
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

async function test5_filterTests() {
  console.log("\n📋 Test 5: Filter Tests by Status");
  console.log("─".repeat(50));

  try {
    const response = await makeRequest(
      "GET",
      "/api/strength-tests?status=Passed&limit=3",
    );
    console.log("✅ Status:", response.status);
    console.log("✅ Filtered Records:", response.data.data.length);
    console.log(
      "✅ All Passed:",
      response.data.data.every((t) => t.status === "Passed"),
    );
    return response.status === 200;
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

async function test6_validation() {
  console.log("\n📋 Test 6: Validation (Missing Fields)");
  console.log("─".repeat(50));

  const invalidData = {
    cubeId: "INCOMPLETE-TEST",
    testDate: "2026-02-25",
    // Missing required fields
  };

  try {
    const response = await makeRequest(
      "POST",
      "/api/strength-tests",
      invalidData,
    );
    console.log("✅ Status:", response.status);
    console.log("✅ Validation Error Caught:", response.status === 400);
    console.log("✅ Error Message:", response.data.error);
    return response.status === 400;
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log("\n" + "=".repeat(50));
  console.log("🧪 CEMENT STRENGTH TEST API - TEST SUITE");
  console.log("=".repeat(50));
  console.log(`📡 Testing: ${BASE_URL}`);
  console.log("⏰ Started:", new Date().toLocaleString());

  const results = [];

  results.push(await test1_healthCheck());
  results.push(await test2_createTest());
  results.push(await test3_getAllTests());
  results.push(await test4_getTestById());
  results.push(await test5_filterTests());
  results.push(await test6_validation());

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(50));

  const passed = results.filter((r) => r).length;
  const failed = results.filter((r) => !r).length;

  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(
    `📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`,
  );

  if (createdTestId) {
    console.log(`\n💡 Test Record Created: ${createdTestId}`);
    console.log(
      `   View it at: ${BASE_URL}/api/strength-tests/${createdTestId}`,
    );
  }

  console.log("=".repeat(50));
  console.log(
    passed === results.length
      ? "🎉 ALL TESTS PASSED!"
      : "⚠️  SOME TESTS FAILED",
  );
  console.log("=".repeat(50) + "\n");
}

// Execute tests
runTests().catch((error) => {
  console.error("\n❌ Fatal Error:", error.message);
  console.error("Make sure the server is running: npm start\n");
  process.exit(1);
});
