from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..models.schemas import SubmissionResponse, SyncResponse
from ..db.database import db
from ..ingestion.codeforces import cf_client
from datetime import datetime, timezone

router = APIRouter(prefix="/submissions", tags=["Submissions"])

@router.get("", response_model=List[SubmissionResponse])
async def list_submissions(
    handle: str = Query("Rahilj45"),
    verdict: Optional[str] = Query(None, description="Filter by verdict e.g. 'OK', 'WRONG_ANSWER'"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Retrieve submissions for a user with optional verdict filter."""
    submissions = db.get_user_submissions(handle=handle, limit=limit, offset=offset)
    if verdict:
        submissions = [s for s in submissions if s.get("verdict") == verdict]
    return submissions

@router.post("/sync", response_model=SyncResponse)
async def sync_submissions(handle: str = Query("Rahilj45")):
    """Incrementally synchronize submissions from Codeforces."""
    try:
        submissions = await cf_client.get_user_submissions(handle)
        synced_count, new_count = db.save_submissions(submissions, user_id=handle.lower())
        return SyncResponse(
            status="success",
            handle=handle,
            synced_submissions_count=synced_count,
            new_submissions_count=new_count,
            catalogue_problems_count=0,
            timestamp=datetime.now(timezone.utc),
            message=f"Synced {new_count} new submissions for {handle}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Submission sync failed: {str(e)}")
