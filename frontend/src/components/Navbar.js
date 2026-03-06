import React, { useState } from 'react';
import { Search, Globe, User } from 'lucide-react';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // Add your search logic here
    }
  };

  return (
    <nav className="bg-red-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-full px-6 py-1.5">
        <div className="flex items-center justify-between">
          {/* Left: Brand Text */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <span className="text-base font-bold tracking-wide">INSEE Cement</span>
              <span className="mx-2 text-white/60">|</span>
              <span className="text-xs font-medium">Sri Lanka's Leading & Only Fully Integrated Cement Manufacturer</span>
            </div>
            <div className="flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded">
              <Globe size={12} />
              <span className="text-[10px] font-semibold uppercase">Sri Lanka</span>
            </div>
          </div>

          {/* Right: Search Bar and User Icon */}
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9 pr-3 py-1.5 text-sm rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all duration-200 w-52"
              />
              <Search 
                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-white/60" 
                size={16} 
              />
            </form>
            
            {/* User Profile Icon */}
            <button className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 border border-white/30">
              <User size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
