from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import Optional
from datetime import datetime, timezone
from ..models.schemas import ProfileResponse, ProfileUpdate, SyncResponse
from ..ingestion.codeforces import cf_client
from ..db.database import db
from ..services.analytics import SkillAnalysisEngine

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("/{handle}", response_model=ProfileResponse)
async def get_profile(handle: str):
    """Retrieve profile metadata for a Codeforces handle."""
    profile = db.get_profile(handle)
    if not profile:
        # Attempt to auto-fetch from Codeforces if not in database
        try:
            cf_info = await cf_client.get_user_info(handle)
            profile = db.save_profile(cf_info)
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Profile for '{handle}' not found: {str(e)}")
    return profile

@router.get("/me/default", response_model=ProfileResponse)
async def get_default_profile(handle: str = Query("Rahilj45")):
    """Get the current profile, defaulting to Rahilj45."""
    return await get_profile(handle)

@router.patch("/{handle}", response_model=ProfileResponse)
async def update_profile(handle: str, update_data: ProfileUpdate):
    """Update profile goals or target rating."""
    profile = db.get_profile(handle)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if update_data.target_rating is not None:
        profile["target_rating"] = update_data.target_rating
    if update_data.target_goal is not None:
        profile["target_goal"] = update_data.target_goal
        
    updated = db.save_profile(profile)
    return updated

@router.post("/sync", response_model=SyncResponse)
async def sync_profile(handle: str = Query("Rahilj45")):
    """
    Perform a complete synchronization of the user profile, submissions,
    and update skill analytics.
    """
    try:
        # 1. Sync User Info
        user_info = await cf_client.get_user_info(handle)
        user_id = handle.lower()
        user_info["user_id"] = user_id
        user_info["last_synced_at"] = datetime.now(timezone.utc)
        profile = db.save_profile(user_info)

        # 2. Sync Submissions
        submissions = await cf_client.get_user_submissions(handle)
        synced_count, new_count = db.save_submissions(submissions, user_id=user_id)

        # 3. If problem catalogue is sparse, ingest core catalogue
        catalogue_count = len(db.get_all_problems(limit=10))
        if catalogue_count < 50:
            catalogue = await cf_client.get_problem_catalogue()
            db.save_problems(catalogue)
            catalogue_count = len(catalogue)

        # 4. Compute and update Tag Statistics
        all_subs = db.get_user_submissions(handle, limit=10000)
        analytics = SkillAnalysisEngine.analyze_user_skills(handle, profile, all_subs)
        stats_data = [t.model_dump() for t in analytics.tag_stats]
        db.save_user_tag_statistics(handle, user_id, stats_data)

        # Log Activity
        db.log_activity(handle, user_id, "sync", {"new_submissions": new_count, "total_synced": synced_count})

        return SyncResponse(
            status="success",
            handle=handle,
            synced_submissions_count=synced_count,
            new_submissions_count=new_count,
            catalogue_problems_count=catalogue_count,
            timestamp=datetime.now(timezone.utc),
            message=f"Synchronized {new_count} new submissions for {handle}."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")
