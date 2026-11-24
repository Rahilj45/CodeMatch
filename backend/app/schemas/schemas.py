from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

# --- Profile Schemas ---
class ProfileBase(BaseModel):
    codeforces_handle: str
    current_rating: int = 0
    max_rating: int = 0
    rank: str = "unrated"
    max_rank: str = "unrated"
    avatar_url: Optional[str] = None
    title_photo_url: Optional[str] = None
    contribution: int = 0
    organization: Optional[str] = None
    country: Optional[str] = None
    target_rating: Optional[int] = None
    target_goal: Optional[str] = "rating_improvement"

class ProfileCreate(ProfileBase):
    user_id: str

class ProfileUpdate(BaseModel):
    target_rating: Optional[int] = None
    target_goal: Optional[str] = None

class ProfileResponse(ProfileBase):
    id: str
    user_id: str
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Problem Schemas ---
class ProblemBase(BaseModel):
    problem_key: str
    contest_id: Optional[int] = None
    problem_index: str
    name: str
    type: str = "PROGRAMMING"
    rating: Optional[int] = None
    tags: List[str] = []
    points: Optional[float] = None
    solved_count: int = 0
    problem_url: str

class ProblemResponse(ProblemBase):
    id: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Submission Schemas ---
class SubmissionBase(BaseModel):
    submission_id: int
    handle: str
    problem_key: str
    contest_id: Optional[int] = None
    problem_index: Optional[str] = None
    problem_name: Optional[str] = None
    verdict: str
    programming_language: Optional[str] = None
    execution_time: Optional[int] = None
    memory_used: Optional[int] = None
    problem_rating: Optional[int] = None
    problem_tags: List[str] = []
    submitted_at: datetime

class SubmissionResponse(SubmissionBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Tag / Skill Analysis Schemas ---
class TagStat(BaseModel):
    tag: str
    attempted_count: int
    solved_count: int
    accuracy: float
    skill_score: float
    skill_level: str  # Strong, Developing, Weak, Insufficient Data
    avg_difficulty: int

class SkillAnalysisResponse(BaseModel):
    handle: str
    total_solved: int
    total_attempted: int
    overall_accuracy: float
    active_days_count: int
    rating: int
    max_rating: int
    strong_topics: List[str]
    developing_topics: List[str]
    weak_topics: List[str]
    tag_stats: List[TagStat]
    difficulty_distribution: Dict[str, int]
    verdict_distribution: Dict[str, int]
    language_distribution: Dict[str, int]


# --- Recommendation Schemas ---
class RecommendationItem(BaseModel):
    problem_key: str
    name: str
    rating: Optional[int] = None
    tags: List[str]
    solved_count: int
    problem_url: str
    recommendation_score: float
    difficulty_score: float
    weakness_score: float
    similarity_score: float
    quality_score: float
    target_topic: str
    difficulty_label: str
    explanation: str
    status: str = "active"

class RecommendationRequest(BaseModel):
    handle: str
    count: int = Field(default=10, ge=1, le=50)
    topic_filter: Optional[str] = None
    min_rating: Optional[int] = None
    max_rating: Optional[int] = None
    include_previously_unsolved: bool = True

class RecommendationFeedback(BaseModel):
    problem_key: str
    action: str  # 'saved', 'skipped', 'solved'

class SyncResponse(BaseModel):
    status: str
    handle: str
    synced_submissions_count: int
    new_submissions_count: int
    catalogue_problems_count: int
    timestamp: datetime
    message: str
