import pytest
from app.services.analytics import SkillAnalysisEngine

def test_skill_analysis_empty():
    profile = {"current_rating": 1100, "max_rating": 1200}
    res = SkillAnalysisEngine.analyze_user_skills("test_user", profile, [])
    assert res.handle == "test_user"
    assert res.total_solved == 0
    assert res.total_attempted == 0
    assert res.overall_accuracy == 0.0
    assert len(res.tag_stats) == 0

def test_skill_analysis_categorization():
    profile = {"current_rating": 1400, "max_rating": 1500}
    submissions = [
        # DP: 5 solved, 1 failed -> 5/6 = 83% (Strong)
        {"problem_key": f"100:{i}", "verdict": "OK", "problem_tags": ["dp"], "problem_rating": 1400} for i in range(5)
    ] + [
        {"problem_key": "100:5", "verdict": "WRONG_ANSWER", "problem_tags": ["dp"], "problem_rating": 1400}
    ] + [
        # Graphs: 1 solved, 5 failed -> 1/6 = 16.7% (Weak)
        {"problem_key": f"200:{i}", "verdict": "WRONG_ANSWER", "problem_tags": ["graphs"], "problem_rating": 1300} for i in range(5)
    ] + [
        {"problem_key": "200:5", "verdict": "OK", "problem_tags": ["graphs"], "problem_rating": 1300}
    ] + [
        # Trees: 1 solved, 1 failed -> 2 attempts (< 4) -> Insufficient Data
        {"problem_key": "300:1", "verdict": "OK", "problem_tags": ["trees"], "problem_rating": 1200},
        {"problem_key": "300:2", "verdict": "WRONG_ANSWER", "problem_tags": ["trees"], "problem_rating": 1200}
    ]

    res = SkillAnalysisEngine.analyze_user_skills("test_user", profile, submissions)
    stats = {t.tag: t for t in res.tag_stats}

    assert "dp" in stats
    assert stats["dp"].skill_level == "Strong"
    assert stats["dp"].solved_count == 5

    assert "graphs" in stats
    assert stats["graphs"].skill_level == "Weak"
    assert stats["graphs"].accuracy < 30.0

    assert "trees" in stats
    assert stats["trees"].skill_level == "Insufficient Data"

def test_rating_buckets():
    assert SkillAnalysisEngine._get_rating_bucket(800) == "<1000"
    assert SkillAnalysisEngine._get_rating_bucket(1100) == "1000-1199"
    assert SkillAnalysisEngine._get_rating_bucket(1350) == "1200-1399"
    assert SkillAnalysisEngine._get_rating_bucket(1500) == "1400-1599"
    assert SkillAnalysisEngine._get_rating_bucket(1700) == "1600-1799"
    assert SkillAnalysisEngine._get_rating_bucket(1900) == "1800-1999"
    assert SkillAnalysisEngine._get_rating_bucket(2200) == "2000+"
