import React from 'react';
import { Code2, Github, Terminal, Database, Cpu, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#080C14] mt-20 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Code2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">Code<span className="text-indigo-400">Match</span></span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Autonomous AI recommendation platform identifying weaknesses and matching optimal competitive programming problems at the right time.
            </p>
          </div>

          {/* Architecture */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-3 tracking-wider uppercase text-[11px]">System Architecture</h4>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-slate-400">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>FastAPI + Pydantic Backend</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-400">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supabase PostgreSQL + pgvector</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-400">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sentence Transformers (all-MiniLM-L6-v2)</span>
              </li>
            </ul>
          </div>

          {/* Core Objectives */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-3 tracking-wider uppercase text-[11px]">Core Signals</h4>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gaussian Difficulty Matching</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Bayesian Topic Weakness Prioritization</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Vector Semantic Similarity</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Strict Solved Problem Exclusion</span>
              </li>
            </ul>
          </div>

          {/* Integrations */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-3 tracking-wider uppercase text-[11px]">Source & Verification</h4>
            <p className="text-slate-400 mb-3 text-xs">
              Live synchronized against the official Codeforces API for handle <strong className="text-slate-200 font-mono">Rahilj45</strong>.
            </p>
            <a
              href="https://github.com/Rahilj45/CodeMatch"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
            >
              <Github className="w-3.5 h-3.5 text-slate-300" />
              <span>Rahilj45/CodeMatch</span>
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px]">
          <p>© 2026 CodeMatch Platform. All algorithmic problem data courtesy of Codeforces.</p>
          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <span>Deterministic Scoring Engine</span>
            <span>•</span>
            <span>Zero Hallucinated Problems</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
