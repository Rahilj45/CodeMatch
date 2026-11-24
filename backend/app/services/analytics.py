import math
from typing import Dict, List, Any, Set, Tuple
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from ..models.schemas import TagStat, SkillAnalysisResponse

class SkillAnalysisEngine:
    """
    Measurable, deterministic skill analysis engine for competitive programming.
    Evaluates topic strengths, weaknesses, rating distributions, and progression.
    """
    MIN_ATTEMPTS_FOR_EVALUATION = 4

    @staticmethod
    def analyze_user_skills(
        handle: str,
        profile: Dict[str, Any],
        submissions: List[Dict[str, Any]]
    ) -> SkillAnalysisResponse:
        user_rating = profile.get("current_rating") or 1200
        if user_rating <= 0:
            user_rating = 1200

        # Submissions metrics
        total_submissions = len(submissions)
        verdict_counts = defaultdict(int)
        language_counts = defaultdict(int)
        difficulty_solved = defaultdict(int)
        difficulty_attempted = defaultdict(int)
        
        # Track unique problems
        solved_problem_keys: Set[str] = set()
        attempted_problem_keys: Set[str] = set()
        
        # Per-topic accumulators: key -> { attempted_problems: set, solved_problems: set, difficulties: list }
        tag_data = defaultdict(lambda: {
            "attempted_problems": set(),
            "solved_problems": set(),
            "difficulties": [],
            "total_attempts": 0,
            "failed_attempts": 0
        })

        active_dates = set()

        for s in submissions:
            verdict = s.get("verdict", "UNKNOWN")
            verdict_counts[verdict] += 1

            lang = s.get("programming_language") or "Other"
            language_counts[lang] += 1

            prob_key = s.get("problem_key")
            if not prob_key:
                continue

            attempted_problem_keys.add(prob_key)
            rating = s.get("problem_rating")
            
            # Difficulty bucket
            if rating:
                bucket = SkillAnalysisEngine._get_rating_bucket(rating)
                difficulty_attempted[bucket] += 1

            is_ok = (verdict == "OK")
            if is_ok:
                solved_problem_keys.add(prob_key)
                if rating:
                    bucket = SkillAnalysisEngine._get_rating_bucket(rating)
                    difficulty_solved[bucket] += 1

            # Activity date
            sub_at = s.get("submitted_at")
            if isinstance(sub_at, datetime):
                active_dates.add(sub_at.strftime("%Y-%m-%d"))

            # Process tags
            tags = s.get("problem_tags") or []
            for tag in tags:
                tag_entry = tag_data[tag]
                tag_entry["attempted_problems"].add(prob_key)
                tag_entry["total_attempts"] += 1
                if is_ok:
                    tag_entry["solved_problems"].add(prob_key)
                    if rating:
                        tag_entry["difficulties"].append(rating)
                else:
                    tag_entry["failed_attempts"] += 1

        total_solved = len(solved_problem_keys)
        total_attempted = len(attempted_problem_keys)
        overall_accuracy = round((total_solved / total_attempted * 100), 1) if total_attempted > 0 else 0.0

        # Compute tag statistics
        tag_stats: List[TagStat] = []
        strong_topics: List[str] = []
        developing_topics: List[str] = []
        weak_topics: List[str] = []

        for tag, data in tag_data.items():
            n_attempted = len(data["attempted_problems"])
            n_solved = len(data["solved_problems"])
            
            # Raw accuracy on distinct problems
            raw_acc = (n_solved / n_attempted) if n_attempted > 0 else 0.0
            
            # Bayesian smoothed accuracy: (solved + 2) / (attempted + 4)
            smoothed_acc = (n_solved + 2.0) / (n_attempted + 4.0)
            
            avg_diff = int(sum(data["difficulties"]) / len(data["difficulties"])) if data["difficulties"] else (user_rating if n_solved > 0 else 0)
            
            # Measurable skill score [0, 100]
            diff_factor = min(1.3, avg_diff / max(800, user_rating)) if avg_diff > 0 else 0.8
            skill_score = round(min(100.0, max(0.0, (smoothed_acc * 65.0) + (diff_factor * 35.0))), 1)

            # Categorize topic
            if n_attempted < SkillAnalysisEngine.MIN_ATTEMPTS_FOR_EVALUATION:
                skill_level = "Insufficient Data"
            elif raw_acc >= 0.70 and skill_score >= 60.0:
                skill_level = "Strong"
                strong_topics.append(tag)
            elif raw_acc < 0.40:
                skill_level = "Weak"
                weak_topics.append(tag)
            else:
                skill_level = "Developing"
                developing_topics.append(tag)

            tag_stats.append(TagStat(
                tag=tag,
                attempted_count=n_attempted,
                solved_count=n_solved,
                accuracy=round(raw_acc * 100, 1),
                skill_score=skill_score,
                skill_level=skill_level,
                avg_difficulty=avg_diff
            ))

        # Sort tags by attempted count descending
        tag_stats.sort(key=lambda x: (x.attempted_count, x.skill_score), reverse=True)

        # Standard rating buckets
        all_buckets = ["<1000", "1000-1199", "1200-1399", "1400-1599", "1600-1799", "1800-1999", "2000+"]
        difficulty_dist = {b: difficulty_solved.get(b, 0) for b in all_buckets}

        return SkillAnalysisResponse(
            handle=handle,
            total_solved=total_solved,
            total_attempted=total_attempted,
            overall_accuracy=overall_accuracy,
            active_days_count=len(active_dates),
            rating=user_rating,
            max_rating=profile.get("max_rating") or user_rating,
            strong_topics=strong_topics[:5],
            developing_topics=developing_topics[:5],
            weak_topics=weak_topics[:5],
            tag_stats=tag_stats,
            difficulty_distribution=difficulty_dist,
            verdict_distribution=dict(verdict_counts),
            language_distribution=dict(language_counts)
        )

    @staticmethod
    def _get_rating_bucket(rating: int) -> str:
        if rating < 1000:
            return "<1000"
        elif rating < 1200:
            return "1000-1199"
        elif rating < 1400:
            return "1200-1399"
        elif rating < 1600:
            return "1400-1599"
        elif rating < 1800:
            return "1600-1799"
        elif rating < 2000:
            return "1800-1999"
        else:
            return "2000+"
