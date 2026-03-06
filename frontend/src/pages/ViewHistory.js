import { useState, useEffect } from "react";

export default function ViewHistory({ onBack }) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({});

  // Fetch data from backend API
  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "http://localhost:5000/api/strength-tests",
        );
        if (!response.ok) {
          throw new Error("Failed to fetch test data");
        }
        const data = await response.json();
        console.log("Fetched data:", data); // Debug log
        // Log image URLs for debugging
        if (Array.isArray(data) && data.length > 0) {
          console.log("Sample image URLs:", {
            crackImageUrl: data[0]?.crackImageUrl,
            crackImageLocalPath: data[0]?.crackImageLocalPath,
            note: "crackImageUrl should be a full URL like http://localhost:5000/uploads/strength/file.png",
          });
        }
        // Ensure data is an array
        if (Array.isArray(data)) {
          setHistoryData(data);
        } else if (data && Array.isArray(data.data)) {
          // Handle case where data is wrapped in an object
          setHistoryData(data.data);
        } else {
          console.error("API returned non-array data:", data);
          setHistoryData([]);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching test data:", err);
        setError(err.message);
        setHistoryData([]); // Ensure it's an array even on error
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, []);

  // Handle edit button click
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      cubeId: item.cubeId || "",
      testDate: item.testDate
        ? new Date(item.testDate).toISOString().split("T")[0]
        : "",
      cubeMadeDate: item.cubeMadeDate
        ? new Date(item.cubeMadeDate).toISOString().split("T")[0]
        : "",
      testingTime: item.testingTime || "",
      appliedLoadKn: item.appliedLoadKn || "",
      compressiveStrengthMpa: item.compressiveStrengthMpa || "",
      avgAreaMm2: item.avgAreaMm2 || "",
      curingDays: item.curingDays || "",
      cubeGrade: item.cubeGrade || "",
      predictGrade: item.predictGrade || "",
      status: item.status || "",
    });
  };

  // Handle save edited data
  const handleSaveEdit = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/strength-tests/${editingItem._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update test data");
      }

      const result = await response.json();
      const updatedItem = result.data || result;

      // Update local state
      setHistoryData((prevData) =>
        prevData.map((item) =>
          item._id === editingItem._id ? updatedItem : item,
        ),
      );

      setEditingItem(null);
      setFormData({});
      alert("Test data updated successfully!");
    } catch (err) {
      console.error("Error updating test data:", err);
      alert("Failed to update test data: " + err.message);
    }
  };

  // Handle delete button click
  const handleDelete = (item) => {
    setDeleteConfirm(item);
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/strength-tests/${deleteConfirm._id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete test data");
      }

      // Remove from local state
      setHistoryData((prevData) =>
        prevData.filter((item) => item._id !== deleteConfirm._id),
      );

      setDeleteConfirm(null);
      alert("Test data deleted successfully!");
    } catch (err) {
      console.error("Error deleting test data:", err);
      alert("Failed to delete test data: " + err.message);
    }
  };

  // Handle download report
  const handleDownloadReport = (item) => {
    // Calculate cube made date
    const cubeMadeDate = item.cubeMadeDate
      ? new Date(item.cubeMadeDate)
      : (() => {
          const testDate = new Date(item.testDate);
          const madeDate = new Date(testDate);
          if (item.curingDays) {
            madeDate.setDate(madeDate.getDate() - item.curingDays);
          }
          return madeDate;
        })();

    const testDate = new Date(item.testDate);

    // Generate report content
    const reportContent = `
╔════════════════════════════════════════════════════════════════════════╗
║           CONCRETE CUBE COMPRESSIVE STRENGTH TEST REPORT              ║
╚════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════
                            TEST IDENTIFICATION
═══════════════════════════════════════════════════════════════════════════
Cube ID:                    ${item.cubeId || "N/A"}
Test Date:                  ${testDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
Testing Time:               ${item.testingTime || "N/A"}
Cube Made Date:             ${cubeMadeDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
Curing Period:              ${item.curingDays || "N/A"} days

═══════════════════════════════════════════════════════════════════════════
                         SPECIMEN DIMENSIONS
═══════════════════════════════════════════════════════════════════════════
Average Length:             ${item.avgLengthMm ? item.avgLengthMm.toFixed(1) + " mm" : "N/A"}
Average Width:              ${item.avgWidthMm ? item.avgWidthMm.toFixed(1) + " mm" : "N/A"}
Average Cross-Sectional Area: ${item.avgAreaMm2 ? item.avgAreaMm2.toFixed(1) + " mm²" : "N/A"}

═══════════════════════════════════════════════════════════════════════════
                           TEST RESULTS
═══════════════════════════════════════════════════════════════════════════
Applied Load:               ${item.appliedLoadKn ? item.appliedLoadKn.toFixed(2) + " kN" : "N/A"}
Compressive Strength:       ${item.compressiveStrengthMpa ? item.compressiveStrengthMpa.toFixed(2) + " MPa" : "N/A"}

═══════════════════════════════════════════════════════════════════════════
                          GRADE EVALUATION
═══════════════════════════════════════════════════════════════════════════
Target Grade (Cube):        ${item.cubeGrade || "N/A"}
Predicted Grade:            ${item.predictGrade || "N/A"}
Test Status:                ${item.status || "N/A"}

═══════════════════════════════════════════════════════════════════════════
                         PASS/FAIL CRITERIA
═══════════════════════════════════════════════════════════════════════════
Status:                     ${item.status === "Passed" ? "✓ PASSED" : "✗ FAILED"}
${
  item.status === "Passed"
    ? "The concrete cube has met the required compressive strength criteria."
    : "The concrete cube has NOT met the required compressive strength criteria."
}

═══════════════════════════════════════════════════════════════════════════
                            REMARKS
═══════════════════════════════════════════════════════════════════════════
${item.crackImageUrl || item.crackImageLocalPath ? "Crack image analysis available in database." : "No crack image available."}
Test ID: ${item._id}

═══════════════════════════════════════════════════════════════════════════
Report Generated: ${new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })}
═══════════════════════════════════════════════════════════════════════════

Generated by: Smart Cement Quality Testing System
Copyright © ${new Date().getFullYear()}
`;

    // Create blob and download
    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Strength_Test_Report_${item.cubeId || item._id}_${testDate.toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredData = Array.isArray(historyData)
    ? historyData.filter((item) => {
        // Get cube ID from database
        const cubeId = item.cubeId || "";

        // Parse Testing Date
        const testDate = new Date(item.testDate);
        const testMonthName = testDate.toLocaleString("en-US", {
          month: "long",
        });
        const testMonthShort = testDate.toLocaleString("en-US", {
          month: "short",
        });
        const testYear = testDate.getFullYear().toString();
        const testDay = testDate.getDate().toString();
        const testFormattedDate = testDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        // Calculate cube made date
        const cubeMadeDate = item.cubeMadeDate
          ? new Date(item.cubeMadeDate)
          : new Date(testDate);
        if (!item.cubeMadeDate && item.curingDays) {
          cubeMadeDate.setDate(cubeMadeDate.getDate() - item.curingDays);
        }
        const madeMonthName = cubeMadeDate.toLocaleString("en-US", {
          month: "long",
        });
        const madeMonthShort = cubeMadeDate.toLocaleString("en-US", {
          month: "short",
        });
        const madeYear = cubeMadeDate.getFullYear().toString();
        const madeDay = cubeMadeDate.getDate().toString();
        const madeFormattedDate = cubeMadeDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        // Testing time
        const testingTime = item.testingTime || "09:00 AM";

        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          // Cube ID
          cubeId.toLowerCase().includes(searchLower) ||
          // Test Date
          (item.testDate && item.testDate.includes(searchTerm)) ||
          testMonthName.toLowerCase().includes(searchLower) ||
          testMonthShort.toLowerCase().includes(searchLower) ||
          testYear.includes(searchTerm) ||
          testDay.includes(searchTerm) ||
          testFormattedDate.toLowerCase().includes(searchLower) ||
          // Cube Made Date
          madeMonthName.toLowerCase().includes(searchLower) ||
          madeMonthShort.toLowerCase().includes(searchLower) ||
          madeYear.includes(searchTerm) ||
          madeDay.includes(searchTerm) ||
          madeFormattedDate.toLowerCase().includes(searchLower) ||
          // Testing Time
          testingTime.toLowerCase().includes(searchLower) ||
          // Applied Load
          (item.appliedLoadKn &&
            item.appliedLoadKn.toString().includes(searchTerm)) ||
          // Compressive Strength
          (item.compressiveStrengthMpa &&
            item.compressiveStrengthMpa.toString().includes(searchTerm)) ||
          // Average Area
          (item.avgAreaMm2 &&
            item.avgAreaMm2.toString().includes(searchTerm)) ||
          (item.avgAreaMm2 &&
            item.avgAreaMm2.toFixed(1).includes(searchTerm)) ||
          // Curing Days
          (item.curingDays &&
            item.curingDays.toString().includes(searchTerm)) ||
          // Grade
          (item.cubeGrade &&
            item.cubeGrade.toLowerCase().includes(searchLower)) ||
          (item.predictGrade &&
            item.predictGrade.toLowerCase().includes(searchLower)) ||
          // Status
          (item.status && item.status.toLowerCase().includes(searchLower));

        const matchesGrade =
          filterGrade === "all" ||
          item.cubeGrade === filterGrade ||
          item.predictGrade === filterGrade;

        return matchesSearch && matchesGrade;
      })
    : [];

  return (
    <main className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Test History</h1>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold shadow-sm"
          >
            Back to Dashboard
          </button>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading test history...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-6 flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by cube ID, date, applied load, strength, area, curing days, grade, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 rounded px-4 py-2 text-sm"
                />
              </div>
              <div>
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="border border-gray-300 rounded px-4 py-2 text-sm"
                >
                  <option value="all">All Grades</option>
                  <option value="M10">M10</option>
                  <option value="M15">M15</option>
                  <option value="M20">M20</option>
                  <option value="M25">M25</option>
                  <option value="M30">M30</option>
                  <option value="M35">M35</option>
                  <option value="M40">M40</option>
                  <option value="M45">M45</option>
                  <option value="M50">M50</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cube ID
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Test Date
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cube Made Date
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Testing Time
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied Load (kN)
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Compressive Strength (MPa)
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average Area (mm²)
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Curing Days
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cube Grade
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Predict Grade
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pass or Fail Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Crack Image
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => {
                        const cubeMadeDate = item.cubeMadeDate
                          ? new Date(item.cubeMadeDate)
                          : (() => {
                              const testDate = new Date(item.testDate);
                              const madeDate = new Date(testDate);
                              if (item.curingDays) {
                                madeDate.setDate(
                                  madeDate.getDate() - item.curingDays,
                                );
                              }
                              return madeDate;
                            })();

                        return (
                          <tr
                            key={item._id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                              {item.cubeId || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                              {new Date(item.testDate).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                              {cubeMadeDate.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                              {item.testingTime || "09:00 AM"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                              <span className="font-semibold text-blue-600">
                                {item.appliedLoadKn
                                  ? item.appliedLoadKn.toFixed(2)
                                  : "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              <span className="font-semibold text-red-600">
                                {item.compressiveStrengthMpa
                                  ? item.compressiveStrengthMpa.toFixed(2)
                                  : "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                              {item.avgAreaMm2
                                ? item.avgAreaMm2.toFixed(1)
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                              {item.curingDays || "N/A"} days
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {item.cubeGrade || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {item.predictGrade || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  item.status === "Passed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {item.status || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                              {item.crackImageUrl ||
                              item.crackImageLocalPath ? (
                                <img
                                  src={
                                    item.crackImageUrl ||
                                    `http://localhost:5000${item.crackImageLocalPath}`
                                  }
                                  alt="Crack detection"
                                  className="w-16 h-16 object-cover rounded border-2 border-gray-200 mx-auto"
                                  onError={(e) => {
                                    console.error("Image failed to load:", {
                                      crackImageUrl: item.crackImageUrl,
                                      crackImageLocalPath:
                                        item.crackImageLocalPath,
                                      attemptedSrc: e.target.src,
                                    });
                                    e.target.style.display = "none";
                                    e.target.parentElement.innerHTML =
                                      '<span class="text-red-400 text-xs">Image not found</span>';
                                  }}
                                />
                              ) : (
                                <span className="text-gray-400">No image</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                              <div className="flex items-center justify-center gap-2 flex-wrap">
                                <button
                                  onClick={() => handleDownloadReport(item)}
                                  className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 font-semibold flex items-center gap-1"
                                  title="Download Report"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                  Report
                                </button>
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 font-semibold flex items-center gap-1"
                                  title="Edit"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(item)}
                                  className="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 font-semibold flex items-center gap-1"
                                  title="Delete"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="13"
                          className="px-6 py-8 text-center text-sm text-gray-500"
                        >
                          No test results found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Edit Test Data
                  </h2>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setFormData({});
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cube ID
                    </label>
                    <input
                      type="text"
                      value={formData.cubeId || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, cubeId: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Date
                    </label>
                    <input
                      type="date"
                      value={formData.testDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, testDate: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cube Made Date
                    </label>
                    <input
                      type="date"
                      value={formData.cubeMadeDate || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cubeMadeDate: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Testing Time
                    </label>
                    <input
                      type="time"
                      value={formData.testingTime || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          testingTime: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Applied Load (kN)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.appliedLoadKn || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          appliedLoadKn: parseFloat(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Compressive Strength (MPa)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.compressiveStrengthMpa || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          compressiveStrengthMpa: parseFloat(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Average Area (mm²)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.avgAreaMm2 || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          avgAreaMm2: parseFloat(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Curing Days
                    </label>
                    <input
                      type="number"
                      value={formData.curingDays || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          curingDays: parseInt(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cube Grade
                    </label>
                    <select
                      value={formData.cubeGrade || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, cubeGrade: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">Select Grade</option>
                      <option value="M10">M10</option>
                      <option value="M15">M15</option>
                      <option value="M20">M20</option>
                      <option value="M25">M25</option>
                      <option value="M30">M30</option>
                      <option value="M35">M35</option>
                      <option value="M40">M40</option>
                      <option value="M45">M45</option>
                      <option value="M50">M50</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Predict Grade
                    </label>
                    <select
                      value={formData.predictGrade || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          predictGrade: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">Select Grade</option>
                      <option value="M10">M10</option>
                      <option value="M15">M15</option>
                      <option value="M20">M20</option>
                      <option value="M25">M25</option>
                      <option value="M30">M30</option>
                      <option value="M35">M35</option>
                      <option value="M40">M40</option>
                      <option value="M45">M45</option>
                      <option value="M50">M50</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">Select Status</option>
                      <option value="Passed">Passed</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setFormData({});
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    Delete Test Data
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Are you sure you want to delete the test data for Cube ID:{" "}
                    <strong>{deleteConfirm.cubeId}</strong>? This action cannot
                    be undone.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
