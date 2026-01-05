import { useState } from 'react';

export default function ViewHistory({ onBack }) {
  const [historyData] = useState([
    {
      id: 1,
      date: '2026-01-04',
      compressiveStrength: 25.45,
      averageArea: 22500.0,
      curingDays: 28,
      grade: 'M25',
      hasCrack: false,
      crackImage: 'https://via.placeholder.com/100x100/22c55e/ffffff?text=No+Crack'
    },
    {
      id: 2,
      date: '2026-01-03',
      compressiveStrength: 20.12,
      averageArea: 22501.5,
      curingDays: 7,
      grade: 'M20',
      hasCrack: true,
      crackImage: 'https://via.placeholder.com/100x100/ef4444/ffffff?text=Crack'
    },
    {
      id: 3,
      date: '2026-01-02',
      compressiveStrength: 30.78,
      averageArea: 22498.3,
      curingDays: 28,
      grade: 'M30',
      hasCrack: false,
      crackImage: 'https://via.placeholder.com/100x100/22c55e/ffffff?text=No+Crack'
    },
    {
      id: 4,
      date: '2026-01-01',
      compressiveStrength: 22.34,
      averageArea: 22502.1,
      curingDays: 14,
      grade: 'M20',
      hasCrack: true,
      crackImage: 'https://via.placeholder.com/100x100/ef4444/ffffff?text=Crack'
    },
    {
      id: 5,
      date: '2025-12-31',
      compressiveStrength: 35.91,
      averageArea: 22499.8,
      curingDays: 28,
      grade: 'M35',
      hasCrack: false,
      crackImage: 'https://via.placeholder.com/100x100/22c55e/ffffff?text=No+Crack'
    },
    {
      id: 6,
      date: '2025-12-30',
      compressiveStrength: 18.65,
      averageArea: 22503.2,
      curingDays: 7,
      grade: 'M20',
      hasCrack: true,
      crackImage: 'https://via.placeholder.com/100x100/ef4444/ffffff?text=Crack'
    },
    {
      id: 7,
      date: '2025-12-29',
      compressiveStrength: 27.89,
      averageArea: 22500.7,
      curingDays: 28,
      grade: 'M25',
      hasCrack: false,
      crackImage: 'https://via.placeholder.com/100x100/22c55e/ffffff?text=No+Crack'
    },
    {
      id: 8,
      date: '2025-12-28',
      compressiveStrength: 21.43,
      averageArea: 22497.9,
      curingDays: 14,
      grade: 'M20',
      hasCrack: false,
      crackImage: 'https://via.placeholder.com/100x100/22c55e/ffffff?text=No+Crack'
    },
    {
      id: 9,
      date: '2025-12-27',
      compressiveStrength: 32.15,
      averageArea: 22501.3,
      curingDays: 28,
      grade: 'M30',
      hasCrack: true,
      crackImage: 'https://via.placeholder.com/100x100/ef4444/ffffff?text=Crack'
    },
    {
      id: 10,
      date: '2025-12-26',
      compressiveStrength: 19.87,
      averageArea: 22499.5,
      curingDays: 7,
      grade: 'M20',
      hasCrack: false,
      crackImage: 'https://via.placeholder.com/100x100/22c55e/ffffff?text=No+Crack'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');

  const filteredData = historyData.filter(item => {
    const matchesSearch = item.date.includes(searchTerm) || 
                         item.grade.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === 'all' || item.grade === filterGrade;
    return matchesSearch && matchesGrade;
  });

  return (
    <main className="flex-1 p-10 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Test History</h1>
            <button onClick={onBack} className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700">
              Back to Tests
            </button>
          </div>
          
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by date or grade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2 text-sm"
              />
            </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compressive Strength (MPa)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Area (mm²)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Curing Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crack Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(item.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="font-semibold text-red-600">{item.compressiveStrength}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.averageArea.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.curingDays} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <img 
                          src={item.crackImage} 
                          alt="Crack status" 
                          className="w-16 h-16 object-cover rounded border-2 border-gray-200"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => {
                            alert(`Downloading report for test on ${item.date}`);
                            // Add actual download logic here
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                      No test results found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Total Tests</p>
              <p className="text-2xl font-bold text-blue-900">{historyData.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Avg. Strength</p>
              <p className="text-2xl font-bold text-green-900">
                {(historyData.reduce((sum, item) => sum + item.compressiveStrength, 0) / historyData.length).toFixed(2)} MPa
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600 font-medium">Cracks Detected</p>
              <p className="text-2xl font-bold text-red-900">
                {historyData.filter(item => item.hasCrack).length}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium">Tests This Month</p>
              <p className="text-2xl font-bold text-purple-900">
                {historyData.filter(item => new Date(item.date).getMonth() === new Date().getMonth()).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
