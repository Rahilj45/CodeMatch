import React, { useState } from 'react';
import { User, Target, TrendingUp, CheckCircle, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface OnboardingPageProps {
  onComplete: (handle: string, goal: string, targetRating: number) => void;
  initialHandle?: string;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete, initialHandle = 'Rahilj45' }) => {
  const [handle, setHandle] = useState(initialHandle);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedInfo, setVerifiedInfo] = useState<{ rating: number; rank: string; name?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedGoal, setSelectedGoal] = useState('rating_improvement');
  const [targetRating, setTargetRating] = useState(1300);

  const handleVerify = async () => {
    if (!handle.trim()) return;
    setIsVerifying(true);
    setError(null);
    try {
      const prof = await api.getProfile(handle.trim());
      setVerifiedInfo({
        rating: prof.current_rating || 1084,
        rank: prof.rank || 'newbie',
      });
      setTargetRating((prof.current_rating || 1084) + 150);
    } catch (err: any) {
      setError(`Verification failed: ${err.message || 'Handle not found on Codeforces'}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFinish = () => {
    onComplete(handle.trim(), selectedGoal, targetRating);
  };

  return (
    <div className="max-w-2xl mx-auto my-12 px-4">
      <div className="p-8 sm:p-10 rounded-3xl border border-slate-800 bg-surface/90 shadow-2xl backdrop-blur-md space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Step 1 of 2</span>
          <h1 className="text-3xl font-extrabold text-white mt-1">Configure Your Profile</h1>
          <p className="text-sm text-slate-400 mt-2">
            Link your Codeforces identity so CodeMatch can map your exact topic strengths and weaknesses.
          </p>
        </div>

        {/* Handle input & verification */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">Codeforces Handle</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={handle}
                onChange={(e) => {
                  setHandle(e.target.value);
                  setVerifiedInfo(null);
                }}
                placeholder="Rahilj45"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isVerifying ? 'Checking...' : 'Verify Handle'}</span>
            </button>
          </div>

          {verifiedInfo && (
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                Verified! Current rating: <strong>{verifiedInfo.rating}</strong> ({verifiedInfo.rank}).
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Goals Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">Primary Objective</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'rating_improvement', label: 'Rating Push', desc: 'Focus on rating growth +50 to +150' },
              { id: 'weakness_remediation', label: 'Fix Weaknesses', desc: 'Prioritize lowest accuracy topics' },
              { id: 'contest_prep', label: 'Contest Ready', desc: 'Diverse time-tested problem sets' },
            ].map((g) => (
              <div
                key={g.id}
                onClick={() => setSelectedGoal(g.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedGoal === g.id
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-white mb-1">{g.label}</div>
                <div className="text-[11px] text-slate-400">{g.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Target Rating Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">Target Rating Goal</label>
            <span className="text-sm font-bold text-indigo-400 font-mono">{targetRating}</span>
          </div>
          <input
            type="range"
            min={800}
            max={2600}
            step={50}
            value={targetRating}
            onChange={(e) => setTargetRating(Number(e.target.value))}
            className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Newbie (800)</span>
            <span>Pupil (1200)</span>
            <span>Specialist (1400)</span>
            <span>Expert (1600)</span>
            <span>Master (2100)</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleFinish}
          className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
        >
          <span>Launch Personalized Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
