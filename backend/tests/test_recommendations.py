import pytest
from app.services.recommendation import recommendation_engine
from app.models.schemas import RecommendationRequest

@pytest.fixture
def sample_catalogue():
    return [
        {"problem_key": "1001:A", "name": "Watermelon", "rating": 800, "tags": ["math", "brute force"], "solved_count": 50000, "problem_url": "https://codeforces.com/problemset/problem/1001/A"},
        {"problem_key": "1002:B", "name": "Graph Traversal", "rating": 1200, "tags": ["graphs", "dfs and similar"], "solved_count": 8000, "problem_url": "https://codeforces.com/problemset/problem/1002/B"},
        {"problem_key": "1003:C", "name": "Tree Distance", "rating": 1250, "tags": ["trees", "dp"], "solved_count": 4500, "problem_url": "https://codeforces.com/problemset/problem/1003/C"},
        {"problem_key": "1004:D", "name": "Hard Flow", "rating": 2400, "tags": ["flows", "graphs"], "solved_count": 600, "problem_url": "https://codeforces.com/problemset/problem/1004/D"},
        {"problem_key": "1005:E", "name": "Unrated Puzzle", "rating": None, "tags": ["games"], "solved_count": 1200, "problem_url": "https://codeforces.com/problemset/problem/1005/E"},
    ]

def test_solved_problem_exclusion(sample_catalogue):
    profile = {"current_rating": 1200, "max_rating": 1200}
    # User already solved 1002:B
    submissions = [
        {"problem_key": "1002:B", "verdict": "OK", "problem_tags": ["graphs"]}
    ]
    req = RecommendationRequest(handle="test_user", count=5)
    recs = recommendation_engine.generate_recommendations(
        handle="test_user",
        profile=profile,
        submissions=submissions,
        catalogue=sample_catalogue,
        embeddings={},
        request=req
    )
    rec_keys = [r.problem_key for r in recs]
    assert "1002:B" not in rec_keys

def test_weak_topic_priority(sample_catalogue):
    profile = {"current_rating": 1200, "max_rating": 1200}
    # User failed trees repeatedly -> weak topic
    submissions = [
        {"problem_key": f"50:{i}", "verdict": "WRONG_ANSWER", "problem_tags": ["trees"], "problem_rating": 1200} for i in range(5)
    ]
    req = RecommendationRequest(handle="test_user", count=5)
    recs = recommendation_engine.generate_recommendations(
        handle="test_user",
        profile=profile,
        submissions=submissions,
        catalogue=sample_catalogue,
        embeddings={},
        request=req
    )
    # 1003:C has tags ["trees", "dp"] and rating 1250 -> should be top recommended
    assert len(recs) > 0
    top_rec = recs[0]
    assert top_rec.problem_key == "1003:C"
    assert "trees" in top_rec.explanation.lower()

def test_deterministic_scoring(sample_catalogue):
    profile = {"current_rating": 1200, "max_rating": 1200}
    req = RecommendationRequest(handle="test_user", count=3)
    recs1 = recommendation_engine.generate_recommendations("test_user", profile, [], sample_catalogue, {}, req)
    recs2 = recommendation_engine.generate_recommendations("test_user", profile, [], sample_catalogue, {}, req)
    
    assert [r.problem_key for r in recs1] == [r.problem_key for r in recs2]
    assert [r.recommendation_score for r in recs1] == [r.recommendation_score for r in recs2]

def test_unrated_problem_handling(sample_catalogue):
    profile = {"current_rating": 1200, "max_rating": 1200}
    req = RecommendationRequest(handle="test_user", count=5)
    recs = recommendation_engine.generate_recommendations("test_user", profile, [], sample_catalogue, {}, req)
    # Engine should not crash on problem 1005:E (None rating)
    assert any(r.problem_key == "1005:E" for r in recs)
