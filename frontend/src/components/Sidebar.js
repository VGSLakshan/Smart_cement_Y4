export default function Sidebar({ onNavigate, currentPage }) {
  return (
    <aside className="w-72 bg-gray-50 shadow-xl min-h-screen flex flex-col justify-between border-r border-gray-200">
      <div>
        {/* INSEE Logo Header */}
        <div className="px-6 py-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col items-center mb-4">
            <img 
              src="/insee-logo.png" 
              alt="INSEE" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-700">Smart Cement Platform</div>
            <div className="text-xs text-gray-500 mt-1">AI-Powered Prediction System</div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-4 px-3 space-y-1">
          <button 
            onClick={() => onNavigate && onNavigate('home')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left transition-all duration-200 ${
              currentPage === 'home' 
                ? 'bg-red-50 text-red-600 font-semibold shadow-sm' 
                : 'text-gray-700 hover:bg-gray-50 hover:text-red-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <span>Dashboard</span>
          </button>

          <div className="pt-6 pb-2 px-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Resources</span>
          </div>

          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-all duration-200" href="#">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>Reports</span>
          </a>

          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-all duration-200" href="#">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
            <span>Documentation</span>
          </a>

          <a className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-all duration-200" href="#">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>Settings</span>
          </a>
        </nav>
      </div>

      {/* Footer - Company Info */}
      <div className="px-4 py-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
              IN
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800">INSEE Cement</div>
              <div className="text-xs text-gray-500">AI Research Lab</div>
            </div>
          </div>
          <div className="pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-400 text-center">
              © 2025 INSEE. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
