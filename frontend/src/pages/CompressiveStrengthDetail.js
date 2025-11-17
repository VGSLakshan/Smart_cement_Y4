export default function CompressiveStrengthDetail({ onBack }) {
  return (
    <main className="flex-1 p-10 bg-gray-50 min-h-screen overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Compressive Strength & Crack Detection</h1>
            </div>
            <div className="flex gap-3">
              <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Start New Test
              </button>
              <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Generate Report
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                View History
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real-Time Data Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Real-Time Data</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded p-4 border border-gray-200">
                <p className="text-sm text-gray-600">Length 1 (mm)</p>
                <p className="text-2xl font-bold text-gray-900">150.12</p>
              </div>
              <div className="bg-gray-50 rounded p-4 border border-gray-200">
                <p className="text-sm text-gray-600">Length 2 (mm)</p>
                <p className="text-2xl font-bold text-gray-900">150.08</p>
              </div>
              <div className="bg-gray-50 rounded p-4 border border-gray-200">
                <p className="text-sm text-gray-600">Length 3 (mm)</p>
                <p className="text-2xl font-bold text-gray-900">150.15</p>
              </div>
              <div className="bg-gray-50 rounded p-4 border border-gray-200">
                <p className="text-sm text-gray-600">Length 4 (mm)</p>
                <p className="text-2xl font-bold text-gray-900">150.11</p>
              </div>
              <div className="bg-gray-50 rounded p-4 border border-gray-200">
                <p className="text-sm text-gray-600">Width 1 (mm)</p>
                <p className="text-2xl font-bold text-gray-900">149.98</p>
              </div>
              <div className="bg-gray-50 rounded p-4 border border-gray-200">
                <p className="text-sm text-gray-600">Width 2 (mm)</p>
                <p className="text-2xl font-bold text-gray-900">149.95</p>
              </div>
              <div className="bg-gray-50 rounded p-4 border border-gray-200">
                <p className="text-sm text-gray-600">Width 3 (mm)</p>
                <p className="text-2xl font-bold text-gray-900">150.01</p>
              </div>
              <div className="bg-gray-50 rounded p-4 border border-gray-200">
                <p className="text-sm text-gray-600">Width 4 (mm)</p>
                <p className="text-2xl font-bold text-gray-900">149.99</p>
              </div>
              <div className="bg-gray-50 rounded p-4 border border-gray-200">
                <p className="text-sm text-gray-600">Avg. Length (mm)</p>
                <p className="text-2xl font-bold text-gray-900">150.12</p>
              </div>
              <div className="bg-gray-50 rounded p-4 border border-gray-200">
                <p className="text-sm text-gray-600">Avg. Width (mm)</p>
                <p className="text-2xl font-bold text-gray-900">149.98</p>
              </div>
              <div className="bg-gray-50 rounded p-4 border border-gray-200">
                <p className="text-sm text-gray-600">Cube Grade</p>
                <p className="text-2xl font-bold text-gray-900">M20</p>
              </div>
              <div className="bg-gray-50 rounded p-4 border border-gray-200">
                <p className="text-sm text-gray-600">Curing Days</p>
                <p className="text-2xl font-bold text-gray-900">7</p>
              </div>
              <div className="bg-gray-50 rounded p-4 border border-gray-200">
                <p className="text-sm text-gray-600">Applied Load (kN)</p>
                <p className="text-2xl font-bold text-gray-900">450.75</p>
              </div>
              <div className="bg-gray-50 rounded p-4 border border-gray-200">
                <p className="text-sm text-gray-600">Compressive Strength (MPa)</p>
                <p className="text-2xl font-bold text-red-600">20.02</p>
              </div>
            </div>

            {/* Input Fields */}
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-gray-600">Enter Applied Load (kN)</label>
                <div className="flex gap-2 mt-2">
                  <input type="text" placeholder="e.g. 450.75" className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600" />
                  <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm">Apply Load</button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Enter Curing Days</label>
                <div className="flex gap-2 mt-2">
                  <input type="text" placeholder="e.g. 7 or 28" className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600" />
                  <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm">Save Days</button>
                </div>
              </div>
            </div>
          </div>

          {/* Crack Detection Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Crack Detection</h2>
            <div className="bg-gray-100 rounded-lg h-80 flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <p className="text-gray-500">Crack Detection Image</p>
              </div>
            </div>
            <button className="w-full bg-red-600 text-white px-4 py-3 rounded-md hover:bg-red-700 flex items-center justify-center gap-2 font-semibold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              Identify Crack
            </button>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 flex justify-start">
          <button onClick={onBack} className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700">
            ← Back to Components
          </button>
        </div>
      </div>
    </main>
  );
}
