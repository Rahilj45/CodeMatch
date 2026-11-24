from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional
from ..models.schemas import RecommendationItem, RecommendationRequest, RecommendationFeedback
from ..db.database import db
from ..services.recommendation import recommendation_engine
from ..ml.embeddings import embedding_pipeline
from ..ingestion.codeforces import cf_client

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.get("", response_model=List[RecommendationItem])
async def get_recommendations(
    handle: str = Query("Rahilj45"),
    limit: int = Query(10, ge=1, le=50)
):
    """Retrieve current stored recommendations for user, or generate if none exist."""
    existing = db.get_recommendations(handle, status="active", limit=limit)
    if existing:
        # Populate problem metadata
        enriched = []
        for r in existing:
            p = db.get_problem(r["problem_key"]) or {}
            diff = (p.get("rating") or 1200) - 1200
            diff_label = f"Optimal Challenge ({diff:+d})" if diff >= 0 else f"Reinforcement ({diff:+d})"
            enriched.append(RecommendationItem(
                problem_key=r["problem_key"],
                name=p.get("name", r["problem_key"]),
                rating=p.get("rating"),
                tags=p.get("tags", []),
                solved_count=p.get("solved_count", 0),
                problem_url=p.get("problem_url", f"https://codeforces.com/problemset/problem/{r['problem_key'].replace(':', '/')}"),
                recommendation_score=r["recommendation_score"],
                difficulty_score=r.get("difficulty_score", 0.0),
                weakness_score=r.get("weakness_score", 0.0),
                similarity_score=r.get("similarity_score", 0.0),
                quality_score=r.get("quality_score", 0.0),
                target_topic=r.get("target_topic", "general"),
                difficulty_label=diff_label,
                explanation=r["recommendation_reason"],
                status=r.get("status", "active")
            ))
        return enriched

    # Otherwise auto-generate fresh recommendations
    req = RecommendationRequest(handle=handle, count=limit)
    return await generate_recommendations(req)

@router.post("/generate", response_model=List[RecommendationItem])
async def generate_recommendations(request: RecommendationRequest):
    """
    Generate transparent, deterministic recommendations combining difficulty,
    topic weakness, semantic vectors, and solved problem exclusion.
    """
    handle = request.handle
    profile = db.get_profile(handle)
    if not profile:
        try:
            cf_info = await cf_client.get_user_info(handle)
            profile = db.save_profile(cf_info)
        except Exception:
            profile = {"codeforces_handle": handle, "current_rating": 1200, "max_rating": 1200}

    submissions = db.get_user_submissions(handle=handle, limit=10000)
    if not submissions:
        try:
            cf_subs = await cf_client.get_user_submissions(handle)
            db.save_submissions(cf_subs, user_id=handle.lower())
            submissions = cf_subs
        except Exception:
            pass

    catalogue = db.get_all_problems(limit=1500)
    if not catalogue or len(catalogue) < 5:
        try:
            cf_cat = await cf_client.get_problem_catalogue()
            db.save_problems(cf_cat)
            catalogue = db.get_all_problems(limit=1500)
        except Exception as e:
            logger.warning(f"Could not fetch online catalogue: {e}")
            catalogue = db.get_all_problems(limit=1500)

    embeddings = db.get_all_embeddings()
    if not embeddings and catalogue:
        # Compute embeddings for top subset
        sample_probs = catalogue[:150]
        texts = [embedding_pipeline.create_problem_text(p) for p in sample_probs]
        embs = embedding_pipeline.generate_batch_embeddings(texts)
        emb_dict = {sample_probs[i]["problem_key"]: embs[i] for i in range(len(sample_probs))}
        db.save_problem_embeddings(emb_dict)
        embeddings = emb_dict

    recommendations = recommendation_engine.generate_recommendations(
        handle=handle,
        profile=profile,
        submissions=submissions,
        catalogue=catalogue,
        embeddings=embeddings,
        request=request
    )

    # Persist in recommendation history
    rec_dicts = [r.model_dump() for r in recommendations]
    db.save_recommendations(handle, handle.lower(), rec_dicts)
    db.log_activity(handle, handle.lower(), "recommendation_view", {"count": len(recommendations)})

    return recommendations

@router.post("/{problem_key}/feedback")
async def update_recommendation_feedback(
    problem_key: str,
    feedback: RecommendationFeedback,
    handle: str = Query("Rahilj45")
):
    """Save user action on recommendation: 'saved', 'skipped', 'solved'."""
    success = db.update_recommendation_status(handle, problem_key, feedback.action)
    db.log_activity(handle, handle.lower(), feedback.action, {"problem_key": problem_key})
    return {"status": "success", "problem_key": problem_key, "action": feedback.action, "updated": success}

@router.get("/history")
async def get_recommendation_history(handle: str = Query("Rahilj45"), limit: int = Query(50)):
    """Get all past recommendations and statuses."""
    return db.get_recommendations(handle, limit=limit)
