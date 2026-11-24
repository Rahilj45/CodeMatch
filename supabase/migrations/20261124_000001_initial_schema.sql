-- CodeMatch Database Schema with pgvector, indexing, and Row Level Security
-- Migration: 20261124_000001_initial_schema.sql

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    codeforces_handle TEXT NOT NULL UNIQUE,
    current_rating INT DEFAULT 0,
    max_rating INT DEFAULT 0,
    rank TEXT DEFAULT 'unrated',
    max_rank TEXT DEFAULT 'unrated',
    avatar_url TEXT,
    title_photo_url TEXT,
    contribution INT DEFAULT 0,
    organization TEXT,
    country TEXT,
    target_rating INT,
    target_goal TEXT DEFAULT 'rating_improvement',
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles(codeforces_handle);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- 3. Problems Table
CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_key TEXT NOT NULL UNIQUE, -- e.g. "1900:C"
    contest_id INT,
    problem_index TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'PROGRAMMING',
    rating INT,
    tags TEXT[] DEFAULT '{}',
    points NUMERIC,
    solved_count INT DEFAULT 0,
    problem_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_problems_key ON problems(problem_key);
CREATE INDEX IF NOT EXISTS idx_problems_rating ON problems(rating);
CREATE INDEX IF NOT EXISTS idx_problems_tags ON problems USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_problems_contest ON problems(contest_id);

-- 4. Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id BIGINT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    handle TEXT NOT NULL,
    problem_key TEXT NOT NULL REFERENCES problems(problem_key) ON DELETE CASCADE,
    contest_id INT,
    problem_index TEXT,
    problem_name TEXT,
    verdict TEXT NOT NULL,
    programming_language TEXT,
    execution_time INT, -- in ms
    memory_used INT,    -- in bytes
    problem_rating INT,
    problem_tags TEXT[] DEFAULT '{}',
    submitted_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_handle ON submissions(handle);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_key ON submissions(problem_key);
CREATE INDEX IF NOT EXISTS idx_submissions_verdict ON submissions(verdict);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);

-- 5. User Tag Statistics Table
CREATE TABLE IF NOT EXISTS user_tag_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    handle TEXT NOT NULL,
    tag TEXT NOT NULL,
    attempted_count INT DEFAULT 0,
    solved_count INT DEFAULT 0,
    accuracy NUMERIC(5, 2) DEFAULT 0.0,
    skill_score NUMERIC(5, 2) DEFAULT 0.0,
    skill_level TEXT DEFAULT 'Insufficient Data', -- Strong, Developing, Weak, Insufficient Data
    avg_difficulty INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_tag UNIQUE (user_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_tag_stats_user ON user_tag_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_tag_stats_handle ON user_tag_statistics(handle);
CREATE INDEX IF NOT EXISTS idx_tag_stats_skill ON user_tag_statistics(skill_level);

-- 6. Problem Embeddings Table (pgvector 384 dimensions for all-MiniLM-L6-v2)
CREATE TABLE IF NOT EXISTS problem_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_key TEXT NOT NULL UNIQUE REFERENCES problems(problem_key) ON DELETE CASCADE,
    embedding vector(384) NOT NULL,
    model_name TEXT DEFAULT 'all-MiniLM-L6-v2',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_key ON problem_embeddings(problem_key);

-- 7. Recommendation History Table
CREATE TABLE IF NOT EXISTS recommendation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    handle TEXT NOT NULL,
    problem_key TEXT NOT NULL REFERENCES problems(problem_key) ON DELETE CASCADE,
    recommendation_score NUMERIC(6, 4) NOT NULL,
    difficulty_score NUMERIC(6, 4) DEFAULT 0.0,
    weakness_score NUMERIC(6, 4) DEFAULT 0.0,
    similarity_score NUMERIC(6, 4) DEFAULT 0.0,
    quality_score NUMERIC(6, 4) DEFAULT 0.0,
    recommendation_reason TEXT NOT NULL,
    target_topic TEXT,
    status TEXT DEFAULT 'active', -- active, solved, saved, skipped
    recommended_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rec_history_user ON recommendation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_history_handle ON recommendation_history(handle);
CREATE INDEX IF NOT EXISTS idx_rec_history_status ON recommendation_history(status);

-- 8. User Activity Table
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    handle TEXT NOT NULL,
    activity_type TEXT NOT NULL, -- sync, recommendation_view, save, skip, solved_check
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON user_activity(activity_type);

-- 9. Semantic Vector Search Function
CREATE OR REPLACE FUNCTION match_problems(
    query_embedding vector(384),
    match_threshold float DEFAULT 0.3,
    match_count int DEFAULT 20,
    filter_tags text[] DEFAULT NULL,
    min_rating int DEFAULT NULL,
    max_rating int DEFAULT NULL
)
RETURNS TABLE (
    problem_key TEXT,
    name TEXT,
    rating INT,
    tags TEXT[],
    solved_count INT,
    problem_url TEXT,
    similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.problem_key,
        p.name,
        p.rating,
        p.tags,
        p.solved_count,
        p.problem_url,
        1 - (pe.embedding <=> query_embedding) AS similarity
    FROM problem_embeddings pe
    JOIN problems p ON p.problem_key = pe.problem_key
    WHERE 1 - (pe.embedding <=> query_embedding) > match_threshold
      AND (filter_tags IS NULL OR p.tags && filter_tags)
      AND (min_rating IS NULL OR p.rating >= min_rating)
      AND (max_rating IS NULL OR p.rating <= max_rating)
    ORDER BY pe.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- 10. Row Level Security (RLS) Configuration
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tag_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Problems & Problem Embeddings: Public Read
CREATE POLICY "Problems are viewable by all users" 
ON problems FOR SELECT USING (true);

CREATE POLICY "Problem embeddings are viewable by all users" 
ON problem_embeddings FOR SELECT USING (true);

-- Profiles: Public can view basic profile; User can edit own profile; Service role full access
CREATE POLICY "Profiles are viewable by anyone" 
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id IS NOT NULL);

-- Submissions: Viewable by owner, insertable by owner/service
CREATE POLICY "Users can view own submissions" 
ON submissions FOR SELECT USING (auth.uid()::text = user_id OR user_id = handle);

CREATE POLICY "Users can insert own submissions" 
ON submissions FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id = handle);

-- Tag statistics: Viewable by owner
CREATE POLICY "Users can view own tag stats" 
ON user_tag_statistics FOR SELECT USING (auth.uid()::text = user_id OR user_id = handle);

-- Recommendation history: Viewable and updatable by owner
CREATE POLICY "Users can view own recommendations" 
ON recommendation_history FOR SELECT USING (auth.uid()::text = user_id OR user_id = handle);

CREATE POLICY "Users can update own recommendations" 
ON recommendation_history FOR UPDATE USING (auth.uid()::text = user_id OR user_id = handle);

CREATE POLICY "Users can insert own recommendations" 
ON recommendation_history FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id = handle);

-- User activity: Viewable and insertable by owner
CREATE POLICY "Users can view own activity" 
ON user_activity FOR SELECT USING (auth.uid()::text = user_id OR user_id = handle);

CREATE POLICY "Users can insert own activity" 
ON user_activity FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id = handle);
