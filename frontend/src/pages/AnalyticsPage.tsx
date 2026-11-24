import React from 'react';
import { 
  BarChart as BarChartIcon, 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  Layers, 
  PieChart as PieChartIcon,
  Award
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { SkillAnalysis, Submission } from '../types';

interface AnalyticsPageProps {
  analytics: SkillAnalysis | null;
  submissions: Submission[];
  handle: string;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ analytics, submissions, handle }) => {
  if (!analytics) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-400 text-sm">Loading analytics data...</p>
      </div>
    );
  }

  // Difficulty data for BarChart
  const difficultyData = Object.entries(analytics.difficulty_distribution || {}).map(([bucket, count]) => ({
    bucket,
    solved: count,
  }));

  // Verdict data
  const verdictData = Object.entries(analytics.verdict_distribution || {}).map(([verdict, count]) => ({
    verdict: verdict.replace(/_/g, ' '),
    count,
  }));

  const getSkillBadge = (level: string) => {
    switch (level) {
      case 'Strong':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">Strong</span>;
      case 'Weak':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">Weak</span>;
      case 'Developing':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">Developing</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-400">Insufficient Data</span>;
    }
  };

  const DIFFICULTY_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#10B981', '#06B6D4', '#F59E0B'];

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
          <BarChartIcon className="w-4 h-4" />
          <span>Skill Intelligence & Telemetry</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Performance Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">
          Mathematical topic accuracy, difficulty histograms, and verdict breakdown computed from real Codeforces records.
        </p>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-surface/70 space-y-1">
          <span className="text-slate-400 text-xs">Total Solved Problems</span>
          <div className="text-2xl font-black text-white font-mono">{analytics.total_solved}</div>
          <p className="text-[11px] text-slate-400">Across {analytics.total_attempted} total attempted</p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-800 bg-surface/70 space-y-1">
          <span className="text-slate-400 text-xs">Overall Accuracy</span>
          <div className="text-2xl font-black text-indigo-400 font-mono">{analytics.overall_accuracy}%</div>
          <p className="text-[11px] text-slate-400">Unique accepted problems ratio</p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-800 bg-surface/70 space-y-1">
          <span className="text-slate-400 text-xs">Active Practice Days</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">{analytics.active_days_count}</div>
          <p className="text-[11px] text-slate-400">Recorded on Codeforces</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Difficulty Distribution Histogram */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-surface/60 space-y-4">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Solved Problems by Rating</h3>
          </div>
          <p className="text-xs text-slate-400">
            Histogram of distinct problems solved across difficulty buckets.
          </p>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="bucket" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#E5E7EB' }}
                />
                <Bar dataKey="solved" radius={[6, 6, 0, 0]}>
                  {difficultyData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DIFFICULTY_COLORS[index % DIFFICULTY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verdict Distribution */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-surface/60 space-y-4">
          <div className="flex items-center space-x-2">
            <PieChartIcon className="w-4 h-4 text-purple-400" />
            <h3 className="text-base font-bold text-white">Verdict Breakdown</h3>
          </div>
          <p className="text-xs text-slate-400">
            Distribution of submission outcomes (Accepted, Wrong Answer, Time Limit, etc.).
          </p>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={verdictData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
                <XAxis type="number" stroke="#6B7280" fontSize={11} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="verdict" type="category" stroke="#6B7280" fontSize={10} width={90} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#E5E7EB' }}
                />
                <Bar dataKey="count" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Topic Accuracy & Skill Scores Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Topic Skill Matrix (Calculated from Real Submissions)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {analytics.tag_stats.length} Topics Analyzed
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-surface/50">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Topic / Tag</th>
                <th className="py-3.5 px-4 font-semibold text-center">Solved</th>
                <th className="py-3.5 px-4 font-semibold text-center">Attempted</th>
                <th className="py-3.5 px-4 font-semibold">Accuracy</th>
                <th className="py-3.5 px-4 font-semibold">Skill Score</th>
                <th className="py-3.5 px-4 font-semibold">Evaluation Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Avg Difficulty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {analytics.tag_stats.map((t) => (
                <tr key={t.tag} className="hover:bg-slate-800/30 transition-colors font-sans">
                  <td className="py-3 px-4 font-bold text-white capitalize">
                    {t.tag}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-200">
                    {t.solved_count}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-400">
                    {t.attempted_count}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            t.accuracy >= 70 ? 'bg-emerald-400' : t.accuracy >= 40 ? 'bg-amber-400' : 'bg-rose-400'
                          }`}
                          style={{ width: `${Math.min(100, t.accuracy)}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs">{t.accuracy}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-indigo-300">
                    {t.skill_score} / 100
                  </td>
                  <td className="py-3 px-4">
                    {getSkillBadge(t.skill_level)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-400">
                    {t.avg_difficulty > 0 ? t.avg_difficulty : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
