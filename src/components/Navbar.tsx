import React from 'react';
import { Briefcase, FileText, User, BarChart3, Sparkles, Coins } from 'lucide-react';

interface NavbarProps {
  activeTab: 'discovery' | 'pipeline' | 'profile' | 'analytics' | 'stability';
  setActiveTab: (tab: 'discovery' | 'pipeline' | 'profile' | 'analytics' | 'stability') => void;
  onOpenProfile: () => void;
  tailoredCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenProfile,
  tailoredCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500 text-white shadow-sm font-semibold">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  Miami-Dade Stability
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  AI Career Coach
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block font-medium">
                Economic Mobility & Financial Stability for Single Mothers in Miami-Dade County
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('discovery')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'discovery'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Briefcase className="w-4 h-4 text-indigo-500" />
              <span>Job Discovery</span>
            </button>

            <button
              onClick={() => setActiveTab('pipeline')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>My Applications</span>
              {tailoredCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full bg-emerald-600 text-white">
                  {tailoredCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <span>Market Insights</span>
            </button>

            <button
              onClick={() => setActiveTab('stability')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'stability'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50/50'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Stability Hub</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              title="Edit My Career Profile & Resume"
            >
              <User className="w-4 h-4 text-rose-500" />
              <span className="hidden sm:inline">My Profile</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Tabs */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-100 py-2">
          <button
            onClick={() => setActiveTab('discovery')}
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${
              activeTab === 'discovery' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Discovery</span>
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${
              activeTab === 'pipeline' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Applications ({tailoredCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${
              activeTab === 'analytics' ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-slate-600'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Insights</span>
          </button>
          <button
            onClick={() => setActiveTab('stability')}
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${
              activeTab === 'stability' ? 'bg-rose-50 text-rose-700 font-semibold' : 'text-slate-600'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Stability</span>
          </button>
        </div>
      </div>
    </header>
  );
};
