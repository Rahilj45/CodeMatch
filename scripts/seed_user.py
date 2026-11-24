import sys
import os
import asyncio
from datetime import datetime, timezone

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_dir)

from app.ingestion.codeforces import cf_client
from app.db.database import db
from app.services.analytics import SkillAnalysisEngine
from app.services.recommendation import recommendation_engine
from app.ml.embeddings import embedding_pipeline
from app.models.schemas import RecommendationRequest

async def seed_user(handle: str = "Rahilj45"):
    print(f"=== CodeMatch Ingestion Pipeline: {handle} ===")
    
    # 1. Fetch Profile
    print(f"1. Ingesting Codeforces profile for '{handle}'...")
    user_info = await cf_client.get_user_info(handle)
    user_id = handle.lower()
    user_info["user_id"] = user_id
    user_info["last_synced_at"] = datetime.now(timezone.utc)
    profile = db.save_profile(user_info)
    print(f"   ✓ Profile saved: Rating={profile.get('current_rating')}, Rank={profile.get('rank')}, Org={profile.get('organization')}")

    # 2. Ingest Submissions
    print(f"2. Ingesting submissions for '{handle}'...")
    submissions = await cf_client.get_user_submissions(handle)
    synced_count, new_count = db.save_submissions(submissions, user_id=user_id)
    print(f"   ✓ Submissions: {synced_count} total synced ({new_count} new)")

    # 3. Ingest Problemset Catalogue
    print("3. Ingesting Codeforces problemset catalogue...")
    catalogue = await cf_client.get_problem_catalogue()
    saved_probs = db.save_problems(catalogue)
    print(f"   ✓ Catalogue: {saved_probs} problems indexed")

    # 4. Generate Embeddings for subset of candidate problems
    print("4. Computing problem embeddings (384-dim vectors)...")
    sample_probs = catalogue[:150]
    texts = [embedding_pipeline.create_problem_text(p) for p in sample_probs]
    embs = embedding_pipeline.generate_batch_embeddings(texts)
    emb_dict = {sample_probs[i]["problem_key"]: embs[i] for i in range(len(sample_probs))}
    db.save_problem_embeddings(emb_dict)
    print(f"   ✓ Generated and cached {len(emb_dict)} vector embeddings")

    # 5. Compute Skill Analytics
    print("5. Computing skill analytics and topic breakdown...")
    analytics = SkillAnalysisEngine.analyze_user_skills(handle, profile, submissions)
    stats_data = [t.model_dump() for t in analytics.tag_stats]
    db.save_user_tag_statistics(handle, user_id, stats_data)
    print(f"   ✓ Analyzed {len(analytics.tag_stats)} topics:")
    print(f"     • Strong topics: {', '.join(analytics.strong_topics) or 'None yet'}")
    print(f"     • Developing: {', '.join(analytics.developing_topics) or 'None yet'}")
    print(f"     • Weak topics: {', '.join(analytics.weak_topics) or 'None yet'}")

    # 6. Generate Deterministic Recommendations
    print("6. Generating personalized recommendations...")
    req = RecommendationRequest(handle=handle, count=10)
    recs = recommendation_engine.generate_recommendations(
        handle=handle,
        profile=profile,
        submissions=submissions,
        catalogue=catalogue,
        embeddings=emb_dict,
        request=req
    )
    db.save_recommendations(handle, user_id, [r.model_dump() for r in recs])
    print(f"   ✓ Generated {len(recs)} top recommendations:")
    for idx, r in enumerate(recs[:5], 1):
        print(f"     {idx}. [{r.problem_key}] {r.name} (Rating: {r.rating}) - Match: {int(r.recommendation_score * 100)}%")
        print(f"        Reason: {r.explanation}")

    print("\n=== Ingestion Completed Successfully! ===")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "Rahilj45"
    asyncio.run(seed_user(target))
