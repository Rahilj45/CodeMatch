import React from 'react';
import { 
  User, 
  Award, 
  Building, 
  MapPin, 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Profile } from '../types';

interface ProfilePageProps {
  profile: Profile | null;
  onSync: () => void;
  isSyncing: boolean;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ profile, onSync, isSyncing }) => {
  if (!profile) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-slate-400 text-sm">No profile data connected yet.</p>
        <button onClick={onSync} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
          Synchronize Profile
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Profile Header Card */}
      <div className="p-8 rounded-3xl border border-slate-800 bg-surface/80 shadow-2xl relative overflow-hidden space-y-6">
        {/* Banner Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 rounded-2xl border-2 border-indigo-500/40 overflow-hidden bg-slate-900 shadow-xl flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.codeforces_handle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-white font-mono">{profile.codeforces_handle}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {profile.rank}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center space-x-2">
                {profile.organization && (
                  <span className="flex items-center space-x-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile.organization}</span>
                  </span>
                )}
                {profile.country && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile.city ? `${profile.city}, ` : ''}{profile.country}</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <a
              href={`https://codeforces.com/profile/${profile.codeforces_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
            >
              <span>View on Codeforces</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* Rating & Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800 relative z-10 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Current Rating</span>
            <span className="text-xl font-bold font-mono text-white">{profile.current_rating || 0}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Maximum Rating</span>
            <span className="text-xl font-bold font-mono text-indigo-400">{profile.max_rating || 0}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Contribution</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{profile.contribution >= 0 ? `+${profile.contribution}` : profile.contribution}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Max Rank</span>
            <span className="text-xl font-bold capitalize text-slate-200">{profile.max_rank || 'pupil'}</span>
          </div>
        </div>
      </div>

      {/* Synchronization & Data Freshness Card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-surface/50 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>Ingestion & Synchronization Telemetry</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 text-[11px] block">Last Synchronized</span>
            <div className="font-mono text-sm text-white font-semibold">
              {profile.last_synced_at ? new Date(profile.last_synced_at).toLocaleString() : 'Just now'}
            </div>
            <p className="text-[11px] text-slate-400">Automated incremental sync prevents unnecessary API polling</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 text-[11px] block">Integration Security</span>
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Official API</span>
            </div>
            <p className="text-[11px] text-slate-400">Strict server-side validation with zero token exposure</p>
          </div>
        </div>
      </div>
    </div>
  );
};
