from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from ..models.schemas import SkillAnalysisResponse, TagStat
from ..db.database import db
from ..services.analytics import SkillAnalysisEngine
from ..ingestion.codeforces import cf_client

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=SkillAnalysisResponse)
async def get_analytics_overview(handle: str = Query("Rahilj45")):
    """Get full skills breakdown, topic accuracy, and distributions."""
    profile = db.get_profile(handle)
    if not profile:
        try:
            cf_info = await cf_client.get_user_info(handle)
            profile = db.save_profile(cf_info)
        except Exception:
            profile = {"codeforces_handle": handle, "current_rating": 1200, "max_rating": 1200}

    submissions = db.get_user_submissions(handle=handle, limit=10000)
    if not submissions:
        # Try fetching if empty
        try:
            cf_subs = await cf_client.get_user_submissions(handle)
            db.save_submissions(cf_subs, user_id=handle.lower())
            submissions = cf_subs
        except Exception:
            pass

    analytics = SkillAnalysisEngine.analyze_user_skills(handle, profile, submissions)
    return analytics

@router.get("/tags", response_model=List[TagStat])
async def get_tag_analytics(handle: str = Query("Rahilj45")):
    """Get topic-wise accuracy and skill ratings."""
    stats = db.get_user_tag_statistics(handle)
    if not stats:
        overview = await get_analytics_overview(handle)
        return overview.tag_stats
    return stats

@router.get("/activity")
async def get_activity(handle: str = Query("Rahilj45"), limit: int = Query(25)):
    """Get user audit logs and recent platform activity."""
    return db.get_user_activity(handle, limit=limit)
