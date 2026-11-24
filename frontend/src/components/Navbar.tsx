import React from 'react';
import { 
  Compass, 
  BarChart3, 
  Sparkles, 
  User, 
  Settings, 
  RefreshCw, 
  ExternalLink,
  Code2,
  ChevronRight
} from 'lucide-react';
import { Profile } from '../types';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  profile: Profile | null;
  onSync: () => void;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  setCurrentPage,
  profile,
  onSync,
  isSyncing
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'recommendations', label: 'Recommendations', icon: Sparkles, badge: 'AI' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getRankBadgeColor = (rank?: string) => {
    const r = (rank || '').toLowerCase();
    if (r.includes('grandmaster')) return 'text-red-400 border-red-500/30 bg-red-500/10';
    if (r.includes('master')) return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
    if (r.includes('candidate')) return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
    if (r.includes('expert')) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    if (r.includes('specialist')) return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
    if (r.includes('pupil')) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    return 'text-slate-400 border-slate-700 bg-slate-800/40';
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-[#0B0F17]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentPage('landing')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-bold tracking-tight text-white">Code<span className="text-indigo-400">Match</span></span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">AI</span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Competitive Programming Engine</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Sync & Handle Info */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onSync}
            disabled={isSyncing}
            title="Synchronize submissions with Codeforces"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Codeforces'}</span>
          </button>

          {profile ? (
            <div 
              onClick={() => setCurrentPage('profile')}
              className="flex items-center space-x-2.5 pl-2 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full border border-slate-700 overflow-hidden bg-slate-800 flex items-center justify-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.codeforces_handle} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                    {profile.codeforces_handle}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 border rounded capitalize ${getRankBadgeColor(profile.rank)}`}>
                    {profile.current_rating || 0}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 capitalize">{profile.rank || 'Newbie'}</div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCurrentPage('auth')}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-900/90 py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium ${
                isActive ? 'text-indigo-400' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
