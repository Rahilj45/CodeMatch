import React from 'react';
import { 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ArrowUpRight, 
  RefreshCw, 
  Flame, 
  Target,
  Zap,
  Clock,
  Layers,
  ExternalLink
} from 'lucide-react';
import { Profile, SkillAnalysis, Recommendation, Submission } from '../types';

interface DashboardPageProps {
  profile: Profile | null;
  analytics: SkillAnalysis | null;
  recommendations: Recommendation[];
  submissions: Submission[];
  onSync: () => void;
  isSyncing: boolean;
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  profile,
  analytics,
  recommendations,
  submissions,
  onSync,
  isSyncing,
  onNavigate
}) => {
  const currentRating = profile?.current_rating || analytics?.rating || 1084;
  const maxRating = profile?.max_rating || analytics?.max_rating || 1293;
  const rank = profile?.rank || 'newbie';
  const totalSolved = analytics?.total_solved || 0;
  const totalAttempted = analytics?.total_attempted || 0;
  const accuracy = analytics?.overall_accuracy || 0;

  const getRankColor = (r: string) => {
    const l = r.toLowerCase();
    if (l.includes('pupil')) return 'text-emerald-400';
    if (l.includes('specialist')) return 'text-cyan-400';
    if (l.includes('expert')) return 'text-blue-400';
    if (l.includes('candidate')) return 'text-purple-400';
    if (l.includes('master')) return 'text-orange-400';
    return 'text-slate-300';
  };

  return (
    <div className="space-y-8 py-6">
      {/* Top Banner / Welcome */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-surface via-slate-900 to-indigo-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>Live Analysis Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Competitive Overview: <span className="font-mono text-indigo-300">{profile?.codeforces_handle || 'Rahilj45'}</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
            {profile?.organization ? `${profile.organization} • ` : ''}
            Targeting rating <span className="font-bold text-white">{profile?.target_rating || currentRating + 150}</span>. Here is your current performance vector.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span>{isSyncing ? 'Synchronizing...' : 'Sync Submissions'}</span>
          </button>

          <button
            onClick={() => onNavigate('recommendations')}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-1.5 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Next Problems</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rating */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-surface/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Codeforces Rating</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{currentRating}</div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <span>Max Rating:</span>
            <span className="font-semibold text-slate-300 font-mono">{maxRating}</span>
          </div>
        </div>

        {/* Current Rank */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-surface/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Current Rank</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-2xl sm:text-3xl font-black capitalize ${getRankColor(rank)}`}>
            {rank}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <span>Peak Rank:</span>
            <span className="font-semibold text-slate-300 capitalize">{profile?.max_rank || 'pupil'}</span>
          </div>
        </div>

        {/* Total Solved */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-surface/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Problems Solved</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{totalSolved}</div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <span>Out of {totalAttempted} attempted</span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-surface/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Success Rate</span>
            <Target className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{accuracy}%</div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <span>Active Days:</span>
            <span className="font-semibold text-slate-300">{analytics?.active_days_count || 1}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recommended Problems Teaser & Topic Strengths */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Next Recommended Problems (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Recommended Problems for You</h2>
            </div>
            <button
              onClick={() => onNavigate('recommendations')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
            >
              <span>View All 10</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.problem_key}
                className="p-5 rounded-2xl border border-slate-800 bg-surface/60 hover:border-indigo-500/30 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono text-xs text-indigo-400 font-semibold">{rec.problem_key}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {rec.difficulty_label}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{rec.name}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-indigo-400 px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                      {rec.rating ? `★ ${rec.rating}` : 'Unrated'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  {rec.explanation}
                </p>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {rec.tags.slice(0, 3).map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-slate-800/90 text-[11px] text-slate-400">
                        {t}
                      </span>
                    ))}
                  </div>

                  <a
                    href={rec.problem_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <span>Solve on Codeforces</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}

            {recommendations.length === 0 && (
              <div className="p-8 rounded-2xl border border-slate-800 bg-surface/30 text-center space-y-2">
                <p className="text-slate-400 text-xs">No active recommendations loaded yet.</p>
                <button
                  onClick={() => onNavigate('recommendations')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  Generate First Recommendations
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Topic Strengths & Weaknesses (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h2 className="text-base font-bold text-white">Topic Analysis</h2>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Details
            </button>
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-surface/60 space-y-4">
            {/* Weak Topics (Focus Areas) */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block">
                Weak Topics (Target Practice)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(analytics?.weak_topics && analytics.weak_topics.length > 0) ? (
                  analytics.weak_topics.map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-300">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No critical weak topics detected.</span>
                )}
              </div>
            </div>

            {/* Developing Topics */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                Developing Proficiency
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(analytics?.developing_topics && analytics.developing_topics.length > 0) ? (
                  analytics.developing_topics.map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Analyzing developing topics...</span>
                )}
              </div>
            </div>

            {/* Strong Topics */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                Mastered Topics
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(analytics?.strong_topics && analytics.strong_topics.length > 0) ? (
                  analytics.strong_topics.map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">Keep solving to demonstrate mastery.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="text-base font-bold text-white">Recent Submissions (Codeforces)</h2>
          </div>
          <span className="text-xs text-slate-400">Showing last {Math.min(submissions.length, 6)}</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-surface/50">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold">Problem</th>
                <th className="py-3 px-4 font-semibold">Rating</th>
                <th className="py-3 px-4 font-semibold">Verdict</th>
                <th className="py-3 px-4 font-semibold">Language</th>
                <th className="py-3 px-4 font-semibold">Execution</th>
                <th className="py-3 px-4 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {submissions.slice(0, 6).map((sub) => (
                <tr key={sub.submission_id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-white flex items-center space-x-2">
                    <span className="font-mono text-indigo-400 text-xs">{sub.problem_key}</span>
                    <span className="truncate max-w-[200px]">{sub.problem_name || sub.problem_key}</span>
                  </td>
                  <td className="py-3 px-4">
                    {sub.problem_rating ? (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {sub.problem_rating}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    {sub.verdict === 'OK' ? (
                      <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accepted</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-rose-400 font-semibold text-[11px]">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{sub.verdict.replace(/_/g, ' ')}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] font-sans">
                    {sub.programming_language || 'C++'}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {sub.execution_time != null ? `${sub.execution_time} ms` : '—'}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 text-[11px] font-sans">
                    {new Date(sub.submitted_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 font-sans">
                    No submissions synchronized yet. Click "Sync Submissions" to ingest Codeforces history.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
