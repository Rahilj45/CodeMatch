import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import db

client = TestClient(app)

@pytest.fixture(autouse=True)
def seed_test_database():
    # Seed sample problems into database for offline tests
    sample = [
        {
            "problem_key": f"9999:{chr(65+i)}",
            "contest_id": 9999,
            "problem_index": chr(65+i),
            "name": f"Integration Test Problem {chr(65+i)}",
            "rating": 1200 + i * 50,
            "tags": ["math", "greedy" if i % 2 == 0 else "dp"],
            "solved_count": 500 - i * 50,
            "problem_url": f"https://codeforces.com/problemset/problem/9999/{chr(65+i)}"
        } for i in range(6)
    ]
    db.save_problems(sample)

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    assert "version" in res.json()

def test_problem_listing():
    res = client.get("/api/problems?min_rating=1200&max_rating=1500")
    assert res.status_code == 200
    probs = res.json()
    assert len(probs) >= 1
    assert any(p["problem_key"] == "9999:A" for p in probs)

def test_get_single_problem():
    res = client.get("/api/problems/9999:A")
    assert res.status_code == 200
    assert res.json()["name"] == "Integration Test Problem A"

def test_analytics_and_recommendations_flow():
    profile = {"codeforces_handle": "test_bot", "current_rating": 1250, "max_rating": 1300}
    db.save_profile(profile)
    
    db.save_submissions([
        {"submission_id": 99901, "handle": "test_bot", "problem_key": "9999:A", "verdict": "OK", "problem_rating": 1200, "problem_tags": ["math"], "submitted_at": "2026-01-01T00:00:00Z"}
    ], user_id="test_bot")

    res = client.get("/api/analytics/overview?handle=test_bot")
    assert res.status_code == 200
    data = res.json()
    assert data["handle"] == "test_bot"
    assert data["total_solved"] >= 1

    rec_res = client.post("/api/recommendations/generate", json={"handle": "test_bot", "count": 3})
    assert rec_res.status_code == 200
    recs = rec_res.json()
    assert len(recs) > 0
    # Problem 9999:A was solved, so must NOT be in recommendations
    assert all(r["problem_key"] != "9999:A" for r in recs)

def test_recommendation_feedback():
    res = client.post(
        "/api/recommendations/9999:B/feedback?handle=test_bot",
        json={"problem_key": "9999:B", "action": "saved"}
    )
    assert res.status_code == 200
    assert res.json()["action"] == "saved"
