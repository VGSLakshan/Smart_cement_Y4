import { useState, useEffect } from "react";

export default function ViewHistory({ onBack }) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");

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
                  placeholder="Search by cube ID, date, strength, area, curing days, grade, or status..."
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
                  <option value="M20">M20</option>
                  <option value="M25">M25</option>
                  <option value="M30">M30</option>
                  <option value="M35">M35</option>
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
                              <button
                                onClick={() => {
                                  alert(
                                    `Downloading report for test ${item._id}`,
                                  );
                                  // Add actual download logic here
                                }}
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-semibold flex items-center gap-2 mx-auto"
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
                                Download
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="12"
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
      </div>
    </main>
  );
}
