export default function Sidebar() {
  return (
    <aside className="w-72 bg-red-600 text-white min-h-screen flex flex-col justify-between">
      <div>
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center font-semibold">SC</div>
          <div>
            <div className="font-bold text-lg">Smart Cement</div>
            <div className="text-xs text-white/80">Research Platform</div>
          </div>
        </div>

        <nav className="mt-6 px-4 space-y-1">
          <a className="flex items-center gap-3 px-4 py-3 rounded bg-white/10" href="#">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6"></path></svg>
            <span className="font-medium">Home</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded hover:bg-white/5" href="#">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18"></path></svg>
            <span>Components</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded hover:bg-white/5" href="#">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6M7 21h10"></path></svg>
            <span>Reports</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded hover:bg-white/5" href="#">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M3 11h18M3 21h18"></path></svg>
            <span>About</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded hover:bg-white/5" href="#">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3"></path></svg>
            <span>Settings</span>
          </a>
        </nav>
      </div>

      <div className="px-6 py-6">
        <div className="flex items-center gap-3 bg-white/10 rounded p-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-600 font-semibold">SL</div>
          <div>
            <div className="text-sm font-medium">Sanchitha Lakshan</div>
            <div className="text-xs text-white/80">Researcher</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
