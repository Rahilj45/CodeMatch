from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..models.schemas import ProblemResponse
from ..db.database import db
from ..ingestion.codeforces import cf_client

router = APIRouter(prefix="/problems", tags=["Problems"])

@router.get("", response_model=List[ProblemResponse])
async def list_problems(
    min_rating: Optional[int] = Query(None, description="Minimum problem rating"),
    max_rating: Optional[int] = Query(None, description="Maximum problem rating"),
    tag: Optional[str] = Query(None, description="Filter by topic tag"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List problems from the catalogue with optional filtering."""
    problems = db.get_problems(
        min_rating=min_rating,
        max_rating=max_rating,
        tag=tag,
        limit=limit,
        offset=offset
    )
    return problems

@router.get("/search", response_model=List[ProblemResponse])
async def search_problems(
    q: str = Query(..., min_length=1, description="Search term for problem name"),
    min_rating: Optional[int] = Query(None),
    max_rating: Optional[int] = Query(None),
    tag: Optional[str] = Query(None),
    limit: int = Query(25, ge=1, le=50)
):
    """Search problems by keyword name and constraints."""
    problems = db.get_problems(
        search=q,
        min_rating=min_rating,
        max_rating=max_rating,
        tag=tag,
        limit=limit
    )
    return problems

@router.get("/{problem_key}", response_model=ProblemResponse)
async def get_problem(problem_key: str):
    """Get single problem details by key (e.g. '1900:C')."""
    problem = db.get_problem(problem_key)
    if not problem:
        raise HTTPException(status_code=404, detail=f"Problem '{problem_key}' not found in catalogue")
    return problem

@router.post("/catalogue/sync")
async def sync_catalogue():
    """Ingest/refresh full Codeforces problemset catalogue."""
    try:
        catalogue = await cf_client.get_problem_catalogue()
        saved_count = db.save_problems(catalogue)
        return {"status": "success", "saved_count": saved_count, "total_catalogue": len(catalogue)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync catalogue: {str(e)}")
