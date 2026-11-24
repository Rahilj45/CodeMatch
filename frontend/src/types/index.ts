export interface Profile {
  id: string;
  user_id: string;
  codeforces_handle: string;
  current_rating: number;
  max_rating: number;
  rank: string;
  max_rank: string;
  avatar_url?: string;
  title_photo_url?: string;
  contribution: number;
  organization?: string;
  country?: string;
  city?: string;
  target_rating?: number;
  target_goal?: string;
  last_synced_at?: string;
  created_at: string;
}

export interface Problem {
  id: string;
  problem_key: string;
  contest_id?: number;
  problem_index: string;
  name: string;
  type: string;
  rating?: number;
  tags: string[];
  points?: number;
  solved_count: number;
  problem_url: string;
}

export interface Submission {
  id: string;
  submission_id: number;
  handle: string;
  problem_key: string;
  contest_id?: number;
  problem_index?: string;
  problem_name?: string;
  verdict: string;
  programming_language?: string;
  execution_time?: number;
  memory_used?: number;
  problem_rating?: number;
  problem_tags: string[];
  submitted_at: string;
}

export interface TagStat {
  tag: string;
  attempted_count: number;
  solved_count: number;
  accuracy: number;
  skill_score: number;
  skill_level: 'Strong' | 'Developing' | 'Weak' | 'Insufficient Data';
  avg_difficulty: number;
}

export interface SkillAnalysis {
  handle: string;
  total_solved: number;
  total_attempted: number;
  overall_accuracy: number;
  active_days_count: number;
  rating: number;
  max_rating: number;
  strong_topics: string[];
  developing_topics: string[];
  weak_topics: string[];
  tag_stats: TagStat[];
  difficulty_distribution: Record<string, number>;
  verdict_distribution: Record<string, number>;
  language_distribution: Record<string, number>;
}

export interface Recommendation {
  problem_key: string;
  name: string;
  rating?: number;
  tags: string[];
  solved_count: number;
  problem_url: string;
  recommendation_score: number;
  difficulty_score: number;
  weakness_score: number;
  similarity_score: number;
  quality_score: number;
  target_topic: string;
  difficulty_label: string;
  explanation: string;
  status: 'active' | 'solved' | 'saved' | 'skipped';
}

export interface SyncResult {
  status: string;
  handle: string;
  synced_submissions_count: number;
  new_submissions_count: number;
  catalogue_problems_count: number;
  timestamp: string;
  message: string;
}
