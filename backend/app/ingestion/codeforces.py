import time
import logging
import asyncio
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
import httpx
from ..core.config import settings

logger = logging.getLogger("codematch.ingestion")
logging.basicConfig(level=logging.INFO)

class CodeforcesAPIClient:
    """
    Robust asynchronous Codeforces API client with exponential backoff,
    rate-limiting, error handling, and incremental synchronization.
    """
    def __init__(
        self,
        base_url: str = settings.CODEFORCES_API_BASE,
        timeout: int = settings.CODEFORCES_REQUEST_TIMEOUT,
        max_retries: int = settings.CODEFORCES_MAX_RETRIES,
        rate_limit_delay: float = settings.CODEFORCES_RATE_LIMIT_DELAY
    ):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.rate_limit_delay = rate_limit_delay
        self._last_request_time = 0.0

    async def _throttle(self):
        """Enforce rate limits between consecutive API requests."""
        elapsed = time.time() - self._last_request_time
        if elapsed < self.rate_limit_delay:
            await asyncio.sleep(self.rate_limit_delay - elapsed)
        self._last_request_time = time.time()

    async def _get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make an async GET request with exponential backoff and retries."""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        params = params or {}
        
        last_error = None
        for attempt in range(1, self.max_retries + 1):
            await self._throttle()
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(url, params=params)
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("status") == "OK":
                            return data.get("result", {})
                        else:
                            comment = data.get("comment", "Unknown Codeforces error")
                            logger.warning(f"Codeforces API error on {endpoint}: {comment}")
                            raise ValueError(f"Codeforces API returned status FAILED: {comment}")
                    elif response.status_code in [429, 500, 502, 503, 504]:
                        delay = (2 ** attempt) * 0.75
                        logger.warning(f"HTTP {response.status_code} on {url}. Retrying in {delay:.2f}s (attempt {attempt}/{self.max_retries})")
                        await asyncio.sleep(delay)
                    else:
                        response.raise_for_status()
            except (httpx.RequestError, httpx.HTTPStatusError) as e:
                last_error = e
                delay = (2 ** attempt) * 0.75
                logger.warning(f"Network error requesting {url}: {e}. Retrying in {delay:.2f}s (attempt {attempt}/{self.max_retries})")
                await asyncio.sleep(delay)
            except ValueError:
                raise
                
        raise RuntimeError(f"Codeforces API request failed after {self.max_retries} attempts: {last_error}")

    async def get_user_info(self, handle: str) -> Dict[str, Any]:
        """Fetch user profile metadata for a Codeforces handle."""
        result = await self._get("user.info", {"handles": handle})
        if not result or len(result) == 0:
            raise ValueError(f"User '{handle}' not found on Codeforces")
        user = result[0]
        return {
            "codeforces_handle": user.get("handle", handle),
            "current_rating": user.get("rating", 0),
            "max_rating": user.get("maxRating", 0),
            "rank": user.get("rank", "unrated"),
            "max_rank": user.get("maxRank", "unrated"),
            "avatar_url": user.get("avatar"),
            "title_photo_url": user.get("titlePhoto"),
            "contribution": user.get("contribution", 0),
            "organization": user.get("organization"),
            "country": user.get("country"),
            "city": user.get("city"),
            "registration_time_seconds": user.get("registrationTimeSeconds"),
        }

    async def get_user_submissions(
        self,
        handle: str,
        from_index: int = 1,
        count: int = 10000
    ) -> List[Dict[str, Any]]:
        """
        Fetch submission history for a Codeforces handle.
        Paginates or retrieves all recent submissions.
        """
        raw_submissions = await self._get(
            "user.status",
            {"handle": handle, "from": from_index, "count": count}
        )
        
        parsed_submissions = []
        for s in raw_submissions:
            problem = s.get("problem", {})
            contest_id = problem.get("contestId")
            index = problem.get("index", "")
            
            if contest_id and index:
                problem_key = f"{contest_id}:{index}"
            elif index:
                problem_key = f"contestless:{index}"
            else:
                continue

            sub_time = s.get("creationTimeSeconds", 0)
            submitted_dt = datetime.fromtimestamp(sub_time, tz=timezone.utc)

            parsed_submissions.append({
                "submission_id": s.get("id"),
                "handle": handle,
                "problem_key": problem_key,
                "contest_id": contest_id,
                "problem_index": index,
                "problem_name": problem.get("name", "Unknown Problem"),
                "verdict": s.get("verdict", "UNKNOWN"),
                "programming_language": s.get("programmingLanguage"),
                "execution_time": s.get("timeConsumedMillis"),
                "memory_used": s.get("memoryConsumedBytes"),
                "problem_rating": problem.get("rating"),
                "problem_tags": problem.get("tags", []),
                "submitted_at": submitted_dt
            })
            
        return parsed_submissions

    async def get_problem_catalogue(self, tags: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Fetch the Codeforces problemset catalogue and solved statistics.
        Returns list of normalized problem dictionaries.
        """
        params = {}
        if tags:
            params["tags"] = ";".join(tags)
            
        result = await self._get("problemset.problems", params)
        problems_raw = result.get("problems", [])
        stats_raw = result.get("problemStatistics", [])
        
        # Build mapping of solved counts by contestId:index
        solved_map: Dict[str, int] = {}
        for stat in stats_raw:
            c_id = stat.get("contestId")
            idx = stat.get("index")
            if c_id and idx:
                solved_map[f"{c_id}:{idx}"] = stat.get("solvedCount", 0)

        catalogue = []
        for p in problems_raw:
            c_id = p.get("contestId")
            idx = p.get("index")
            if not c_id or not idx:
                continue

            problem_key = f"{c_id}:{idx}"
            problem_url = f"https://codeforces.com/contest/{c_id}/problem/{idx}"
            
            catalogue.append({
                "problem_key": problem_key,
                "contest_id": c_id,
                "problem_index": idx,
                "name": p.get("name", ""),
                "type": p.get("type", "PROGRAMMING"),
                "rating": p.get("rating"),
                "tags": p.get("tags", []),
                "points": p.get("points"),
                "solved_count": solved_map.get(problem_key, 0),
                "problem_url": problem_url
            })
            
        logger.info(f"Ingested {len(catalogue)} problems from Codeforces problemset.")
        return catalogue

cf_client = CodeforcesAPIClient()
