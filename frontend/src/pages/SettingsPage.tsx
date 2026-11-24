import React, { useState } from 'react';
import { 
  Sliders, 
  Save, 
  Trash2, 
  Check, 
  Sparkles, 
  Zap, 
  Shield, 
  Database,
  RefreshCw
} from 'lucide-react';
import { Profile } from '../types';
import { api } from '../services/api';

interface SettingsPageProps {
  profile: Profile | null;
  onUpdateProfile: (updated: Profile) => void;
  onSync: () => void;
  isSyncing: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  profile,
  onUpdateProfile,
  onSync,
  isSyncing
}) => {
  const [targetRating, setTargetRating] = useState<number>(profile?.target_rating || 1300);
  const [targetGoal, setTargetGoal] = useState<string>(profile?.target_goal || 'rating_improvement');
  
  // Algorithm tuning
  const [offsetRating, setOffsetRating] = useState(75);
  const [diversityFactor, setDiversityFactor] = useState(0.25);
  const [retryUnsolved, setRetryUnsolved] = useState(true);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    if (!profile) return;
    try {
      const updated = await api.updateProfile(profile.codeforces_handle, {
        target_rating: targetRating,
        target_goal: targetGoal
      });
      onUpdateProfile(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to update settings:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Platform Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize algorithm parameters, target ratings, and synchronization preferences.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Preferences successfully saved to your profile!</span>
        </div>
      )}

      {/* Target & Objectives */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-surface/70 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span>Target Rating & Growth Objective</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Codeforces Rating
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={targetRating}
                onChange={(e) => setTargetRating(Number(e.target.value))}
                min={800}
                max={3500}
                className="w-32 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900/80 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
              <span className="text-xs text-slate-400">
                Problems will be centered around this difficulty level.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Practice Goal
            </label>
            <select
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900/80 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="rating_improvement">Rating Improvement (+50 to +150)</option>
              <option value="weakness_remediation">Topic Weakness Remediation</option>
              <option value="speed_solving">Speed Solving & Warm-up (-50 to 0)</option>
              <option value="contest_prep">Diverse Div. 2 / Div. 3 Contest Prep</option>
            </select>
          </div>
        </div>
      </div>

      {/* Algorithm Tuning */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-surface/70 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>Recommendation Engine Tuning</span>
        </h3>

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Optimal Difficulty Offset from Current Rating
              </label>
              <span className="font-mono text-xs font-bold text-indigo-400">+{offsetRating} rating</span>
            </div>
            <input
              type="range"
              min={25}
              max={250}
              step={25}
              value={offsetRating}
              onChange={(e) => setOffsetRating(Number(e.target.value))}
              className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div>
              <div className="text-xs font-bold text-white">Retry Previously Unsolved Problems</div>
              <div className="text-[11px] text-slate-400">
                Allow problems you previously attempted with WA or TLE to be surfaced for redemption
              </div>
            </div>
            <input
              type="checkbox"
              checked={retryUnsolved}
              onChange={(e) => setRetryUnsolved(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center space-x-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Preferences</span>
        </button>
      </div>
    </div>
  );
};
