import { Profile, Problem, Submission, SkillAnalysis, Recommendation, SyncResult } from '../types';

const API_BASE = '/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!res.ok) {
        let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const errData = await res.json();
          if (errData.detail) errorDetail = errData.detail;
        } catch (_) {}
        throw new Error(errorDetail);
      }

      return await res.json();
    } catch (err: any) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  }

  // Profile
  async getProfile(handle: string): Promise<Profile> {
    return this.request<Profile>(`/profile/${encodeURIComponent(handle)}`);
  }

  async updateProfile(handle: string, updateData: { target_rating?: number; target_goal?: string }): Promise<Profile> {
    return this.request<Profile>(`/profile/${encodeURIComponent(handle)}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  async syncProfile(handle: string): Promise<SyncResult> {
    return this.request<SyncResult>(`/profile/sync?handle=${encodeURIComponent(handle)}`, {
      method: 'POST',
    });
  }

  // Problems
  async getProblems(params: { min_rating?: number; max_rating?: number; tag?: string; limit?: number; offset?: number } = {}): Promise<Problem[]> {
    const q = new URLSearchParams();
    if (params.min_rating) q.set('min_rating', String(params.min_rating));
    if (params.max_rating) q.set('max_rating', String(params.max_rating));
    if (params.tag) q.set('tag', params.tag);
    if (params.limit) q.set('limit', String(params.limit));
    if (params.offset) q.set('offset', String(params.offset));
    return this.request<Problem[]>(`/problems?${q.toString()}`);
  }

  async searchProblems(query: string, tag?: string): Promise<Problem[]> {
    const q = new URLSearchParams({ q: query });
    if (tag) q.set('tag', tag);
    return this.request<Problem[]>(`/problems/search?${q.toString()}`);
  }

  // Submissions
  async getSubmissions(handle: string, limit: number = 50, verdict?: string): Promise<Submission[]> {
    const q = new URLSearchParams({ handle, limit: String(limit) });
    if (verdict) q.set('verdict', verdict);
    return this.request<Submission[]>(`/submissions?${q.toString()}`);
  }

  // Analytics
  async getAnalytics(handle: string): Promise<SkillAnalysis> {
    return this.request<SkillAnalysis>(`/analytics/overview?handle=${encodeURIComponent(handle)}`);
  }

  // Recommendations
  async getRecommendations(handle: string, limit: number = 10): Promise<Recommendation[]> {
    return this.request<Recommendation[]>(`/recommendations?handle=${encodeURIComponent(handle)}&limit=${limit}`);
  }

  async generateRecommendations(data: {
    handle: string;
    count?: number;
    topic_filter?: string;
    min_rating?: number;
    max_rating?: number;
    include_previously_unsolved?: boolean;
  }): Promise<Recommendation[]> {
    return this.request<Recommendation[]>(`/recommendations/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendRecommendationFeedback(handle: string, problemKey: string, action: 'saved' | 'skipped' | 'solved'): Promise<any> {
    return this.request(`/recommendations/${encodeURIComponent(problemKey)}/feedback?handle=${encodeURIComponent(handle)}`, {
      method: 'POST',
      body: JSON.stringify({ problem_key: problemKey, action }),
    });
  }
}

export const api = new ApiService();
