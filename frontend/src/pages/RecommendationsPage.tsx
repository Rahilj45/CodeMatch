import React, { useState } from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  Bookmark, 
  Check, 
  X, 
  Filter, 
  RefreshCw, 
  SlidersHorizontal, 
  Search,
  CheckCircle2,
  TrendingUp,
  Brain,
  Zap,
  Info
} from 'lucide-react';
import { Recommendation } from '../types';
import { api } from '../services/api';

interface RecommendationsPageProps {
  recommendations: Recommendation[];
  handle: string;
  onRefresh: () => void;
  isLoading: boolean;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  recommendations,
  handle,
  onRefresh,
  isLoading,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Extract unique tags from current recommendations
  const allTags = ['all', ...Array.from(new Set(recommendations.flatMap((r) => r.tags)))];

  const handleAction = async (problemKey: string, action: 'saved' | 'skipped' | 'solved') => {
    try {
      setFeedbackState((prev) => ({ ...prev, [problemKey]: action }));
      await api.sendRecommendationFeedback(handle, problemKey, action);
      
      const actionLabels = {
        saved: 'Saved to your practice list',
        skipped: 'Skipped — algorithm will adjust',
        solved: 'Marked as solved! Great job!'
      };
      setActionMessage(`${problemKey}: ${actionLabels[action]}`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      console.error('Feedback failed:', err);
    }
  };

  // Filter recommendations based on controls
  const filtered = recommendations.filter((r) => {
    // Tag filter
    if (selectedTag !== 'all' && !r.tags.includes(selectedTag)) return false;
    
    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      if (selectedDifficulty === 'easy' && (r.rating || 1200) > 1100) return false;
      if (selectedDifficulty === 'medium' && ((r.rating || 1200) < 1100 || (r.rating || 1200) > 1400)) return false;
      if (selectedDifficulty === 'hard' && (r.rating || 1200) < 1400) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchKey = r.problem_key.toLowerCase().includes(q);
      const matchTag = r.tags.some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchKey && !matchTag) return false;
    }

    return true;
  });

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Brain className="w-4 h-4" />
            <span>Hybrid Recommendation Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Curated Recommendations</h1>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic matching combining weakness remediation, Gaussian difficulty curves, and vector embeddings.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center space-x-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Recalibrating...' : 'Regenerate Recommendations'}</span>
        </button>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
          <Zap className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-surface/70 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by problem name, key, or tag..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-700 bg-slate-900/80 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Difficulty Tier */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900/80 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Foundational (Rating ≤ 1100)</option>
              <option value="medium">Optimal Challenge (1100 – 1400)</option>
              <option value="hard">Stretch / Mastery (Rating ≥ 1400)</option>
            </select>
          </div>

          {/* Status info */}
          <div className="flex items-center justify-end text-xs text-slate-400">
            <span>Showing <strong>{filtered.length}</strong> of {recommendations.length} problems</span>
          </div>
        </div>

        {/* Topic Tag Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-2 border-t border-slate-800/80 pb-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1 flex-shrink-0 mr-1">
            <Filter className="w-3 h-3" />
            <span>Topic:</span>
          </span>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                selectedTag === t
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendation Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((rec) => {
          const action = feedbackState[rec.problem_key] || rec.status;
          const isSolved = action === 'solved';
          const isSaved = action === 'saved';
          const isSkipped = action === 'skipped';

          return (
            <div
              key={rec.problem_key}
              className={`p-6 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
                isSolved
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : isSaved
                  ? 'border-indigo-500/40 bg-indigo-950/10'
                  : isSkipped
                  ? 'border-slate-800 bg-surface/30 opacity-60'
                  : 'border-slate-800 bg-surface/60 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                        {rec.problem_key}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {rec.difficulty_label}
                      </span>
                      {isSolved && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                          SOLVED
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white hover:text-indigo-300 transition-colors">
                      {rec.name}
                    </h3>
                  </div>

                  {/* Rating & Match Score */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-mono font-bold text-slate-200">
                      {rec.rating ? `★ ${rec.rating}` : 'Unrated'}
                    </div>
                    <div className="text-[10px] font-semibold text-indigo-400 mt-0.5">
                      {Math.round(rec.recommendation_score * 100)}% Match
                    </div>
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="grid grid-cols-4 gap-2 text-center py-2 px-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[10px]">
                  <div>
                    <span className="text-slate-400 block">Difficulty</span>
                    <span className="font-mono font-bold text-slate-200">{Math.round(rec.difficulty_score * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Weakness</span>
                    <span className="font-mono font-bold text-rose-300">{Math.round(rec.weakness_score * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Semantic</span>
                    <span className="font-mono font-bold text-purple-300">{Math.round(rec.similarity_score * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Quality</span>
                    <span className="font-mono font-bold text-emerald-300">{Math.round(rec.quality_score * 100)}%</span>
                  </div>
                </div>

                {/* Transparent Explanation */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-300">
                    <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>Why this problem was selected:</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {rec.explanation}
                  </p>
                </div>
              </div>

              {/* Card Footer: Tags & Action Buttons */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <div className="flex flex-wrap gap-1.5">
                  {rec.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 font-medium">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {/* Solve link */}
                  <a
                    href={rec.problem_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                  >
                    <span>Solve Problem</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* Feedback Controls: Solved, Save, Skip */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleAction(rec.problem_key, 'solved')}
                      title="Mark as Solved"
                      className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                        isSolved
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : 'border-slate-700 bg-slate-800/80 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 text-slate-400'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleAction(rec.problem_key, 'saved')}
                      title="Save for later"
                      className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                        isSaved
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                          : 'border-slate-700 bg-slate-800/80 hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/30 text-slate-400'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleAction(rec.problem_key, 'skipped')}
                      title="Skip problem"
                      className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                        isSkipped
                          ? 'border-slate-600 bg-slate-700 text-slate-300'
                          : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:text-slate-200 text-slate-400'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-2xl border border-slate-800 bg-surface/30 space-y-3">
            <p className="text-slate-400 text-sm">No recommendations match your current filter criteria.</p>
            <button
              onClick={() => {
                setSelectedTag('all');
                setSelectedDifficulty('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
