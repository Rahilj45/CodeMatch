import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Target, 
  BrainCircuit, 
  BarChart, 
  CheckCircle, 
  ShieldCheck, 
  Layers, 
  ExternalLink,
  Code,
  Zap
} from 'lucide-react';
import { Profile } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
  onExplore: () => void;
  profile: Profile | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onExplore, profile }) => {
  return (
    <div className="space-y-24 py-12">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto px-4 sm:px-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Real AI Recommendation Engine — Not Static Lists</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          The Right Coding Problem to the <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Right Programmer</span> at the Right Time.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          CodeMatch deeply analyzes your Codeforces submission history, topic accuracies, and rating trajectory to pinpoint your weaknesses and recommend the optimal next problems to boost your rating.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
          >
            <span>{profile ? 'Enter Dashboard' : 'Get Started with Codeforces'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onExplore}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-all flex items-center justify-center space-x-2"
          >
            <span>Explore Recommendations</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </button>
        </div>

        {/* Live Profile Pill if loaded */}
        {profile && (
          <div className="mt-8 inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Connected Profile: <strong className="text-white font-mono">{profile.codeforces_handle}</strong> (Rating: <strong className="text-indigo-400">{profile.current_rating}</strong>, Rank: <span className="capitalize">{profile.rank}</span>)</span>
          </div>
        )}
      </section>

      {/* Core Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Scientific Problem Curation</h2>
          <p className="mt-2 text-3xl font-extrabold text-white">How CodeMatch Recommends Problems</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl border border-slate-800 bg-surface/50 hover:border-indigo-500/30 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">1. Gaussian Difficulty Matching</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Calculates your true problem-solving equilibrium and recommends problems in the optimal challenge zone (+50 to +150 rating), preventing frustration from overly hard problems or wasted time on trivial ones.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-2xl border border-slate-800 bg-surface/50 hover:border-purple-500/30 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">2. Bayesian Weakness Remediation</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Analyzes your success rate per topic (DP, Graphs, Trees, Greedy). Uses Laplace smoothing to avoid false negatives and prioritizes topics where you have demonstrated real difficulty.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl border border-slate-800 bg-surface/50 hover:border-cyan-500/30 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">3. Sentence Transformers & pgvector</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Generates dense 384-dimensional semantic embeddings with <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">all-MiniLM-L6-v2</code> and pgvector cosine similarity to find conceptual problem matches without hallucination.
            </p>
          </div>
        </div>
      </section>

      {/* Transparent Explanation Teaser Card */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-10 rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 to-surface border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Code className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase text-indigo-400 tracking-wider">Sample Recommendation Card</span>
                <h3 className="text-xl font-bold text-white">1900C — Anji's Binary Tree</h3>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">Rating 1200</span>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">Match 94%</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-300 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-300 font-semibold text-xs">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Transparent Algorithmic Explanation:</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
              "Recommended because your graph and tree traversal accuracy is currently 35% across 8 attempts, and this problem introduces a structured DFS on binary trees at rating 1200, which aligns closely with your current rating of 1084 (+116 challenge)."
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">trees</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">dfs and similar</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">dp</span>
            </div>
            <span className="text-emerald-400 flex items-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Verified Unsolved by Rahilj45</span>
            </span>
          </div>
        </div>
      </section>

      {/* Feature Checklist */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8">
        <h2 className="text-2xl font-bold text-white">Full-Stack Production Capabilities</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          <div className="p-4 rounded-xl border border-slate-800 bg-surface/40 space-y-1">
            <div className="text-indigo-400 font-bold text-sm">Real-time CF Sync</div>
            <div className="text-slate-400 text-xs">Incremental submission fetching with rate limiting</div>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-surface/40 space-y-1">
            <div className="text-emerald-400 font-bold text-sm">pgvector Enabled</div>
            <div className="text-slate-400 text-xs">Cosine similarity nearest-neighbor problem search</div>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-surface/40 space-y-1">
            <div className="text-purple-400 font-bold text-sm">Deterministic ML</div>
            <div className="text-slate-400 text-xs">Reproducible transparent scoring model</div>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-surface/40 space-y-1">
            <div className="text-cyan-400 font-bold text-sm">Anti-Duplication</div>
            <div className="text-slate-400 text-xs">Strict exclusion of all previously solved problems</div>
          </div>
        </div>

        <div className="pt-6">
          <button
            onClick={onGetStarted}
            className="px-8 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/30"
          >
            Launch CodeMatch Platform
          </button>
        </div>
      </section>
    </div>
  );
};
