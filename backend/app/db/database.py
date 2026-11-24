import json
import logging
from typing import Dict, List, Any, Optional, Set
from datetime import datetime, timezone
from sqlalchemy import (
    create_engine, MetaData, Table, Column, String, Integer,
    Float, Boolean, DateTime, Text, BigInteger, JSON, UniqueConstraint,
    select, insert, update, delete, func, and_, or_, desc
)
from sqlalchemy.orm import declarative_base, sessionmaker
from ..core.config import settings

logger = logging.getLogger("codematch.db")

# Initialize database engine
# If DATABASE_URL is configured (e.g., Supabase Postgres), connect to it.
# Otherwise, use local SQLite database file for zero-friction standalone operation.
is_postgres = False
if settings.DATABASE_URL and settings.DATABASE_URL.startswith("postgres"):
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    engine = create_engine(db_url, pool_pre_ping=True)
    is_postgres = True
    logger.info("Using PostgreSQL/Supabase database engine")
else:
    engine = create_engine(f"sqlite:///{settings.SQLITE_DB_PATH}", connect_args={"check_same_thread": False})
    logger.info(f"Using SQLite database engine at {settings.SQLITE_DB_PATH}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DBManager:
    """Database Access Object providing seamless persistence and querying."""
    def __init__(self, engine_instance=engine):
        self.engine = engine_instance
        self._init_tables()

    def _init_tables(self):
        """Create required tables if they don't exist yet."""
        metadata = MetaData()
        
        # 1. Profiles
        Table(
            "profiles", metadata,
            Column("id", String, primary_key=True),
            Column("user_id", String, nullable=False, unique=True),
            Column("codeforces_handle", String, nullable=False, unique=True, index=True),
            Column("current_rating", Integer, default=0),
            Column("max_rating", Integer, default=0),
            Column("rank", String, default="unrated"),
            Column("max_rank", String, default="unrated"),
            Column("avatar_url", String, nullable=True),
            Column("title_photo_url", String, nullable=True),
            Column("contribution", Integer, default=0),
            Column("organization", String, nullable=True),
            Column("country", String, nullable=True),
            Column("city", String, nullable=True),
            Column("target_rating", Integer, nullable=True),
            Column("target_goal", String, default="rating_improvement"),
            Column("last_synced_at", DateTime(timezone=True), nullable=True),
            Column("created_at", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)),
            Column("updated_at", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
        )
        
        # 2. Problems
        Table(
            "problems", metadata,
            Column("id", String, primary_key=True),
            Column("problem_key", String, nullable=False, unique=True, index=True),
            Column("contest_id", Integer, nullable=True, index=True),
            Column("problem_index", String, nullable=False),
            Column("name", String, nullable=False),
            Column("type", String, default="PROGRAMMING"),
            Column("rating", Integer, nullable=True, index=True),
            Column("tags", JSON, default=list), # JSON stores list of strings
            Column("points", Float, nullable=True),
            Column("solved_count", Integer, default=0),
            Column("problem_url", String, nullable=False),
            Column("created_at", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)),
            Column("updated_at", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
        )

        # 3. Submissions
        Table(
            "submissions", metadata,
            Column("id", String, primary_key=True),
            Column("submission_id", BigInteger, nullable=False, unique=True, index=True),
            Column("user_id", String, nullable=False, index=True),
            Column("handle", String, nullable=False, index=True),
            Column("problem_key", String, nullable=False, index=True),
            Column("contest_id", Integer, nullable=True),
            Column("problem_index", String, nullable=True),
            Column("problem_name", String, nullable=True),
            Column("verdict", String, nullable=False, index=True),
            Column("programming_language", String, nullable=True),
            Column("execution_time", Integer, nullable=True),
            Column("memory_used", Integer, nullable=True),
            Column("problem_rating", Integer, nullable=True),
            Column("problem_tags", JSON, default=list),
            Column("submitted_at", DateTime(timezone=True), nullable=False, index=True),
            Column("created_at", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
        )

        # 4. User Tag Statistics
        Table(
            "user_tag_statistics", metadata,
            Column("id", String, primary_key=True),
            Column("user_id", String, nullable=False, index=True),
            Column("handle", String, nullable=False, index=True),
            Column("tag", String, nullable=False),
            Column("attempted_count", Integer, default=0),
            Column("solved_count", Integer, default=0),
            Column("accuracy", Float, default=0.0),
            Column("skill_score", Float, default=0.0),
            Column("skill_level", String, default="Insufficient Data", index=True),
            Column("avg_difficulty", Integer, default=0),
            Column("updated_at", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)),
            UniqueConstraint("user_id", "tag", name="uq_user_tag")
        )

        # 5. Problem Embeddings
        Table(
            "problem_embeddings", metadata,
            Column("id", String, primary_key=True),
            Column("problem_key", String, nullable=False, unique=True, index=True),
            Column("embedding", JSON, nullable=False), # Stores list of floats (384 dim)
            Column("model_name", String, default="all-MiniLM-L6-v2"),
            Column("created_at", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
        )

        # 6. Recommendation History
        Table(
            "recommendation_history", metadata,
            Column("id", String, primary_key=True),
            Column("user_id", String, nullable=False, index=True),
            Column("handle", String, nullable=False, index=True),
            Column("problem_key", String, nullable=False, index=True),
            Column("recommendation_score", Float, nullable=False),
            Column("difficulty_score", Float, default=0.0),
            Column("weakness_score", Float, default=0.0),
            Column("similarity_score", Float, default=0.0),
            Column("quality_score", Float, default=0.0),
            Column("recommendation_reason", Text, nullable=False),
            Column("target_topic", String, nullable=True),
            Column("status", String, default="active", index=True), # active, solved, saved, skipped
            Column("recommended_at", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
        )

        # 7. User Activity
        Table(
            "user_activity", metadata,
            Column("id", String, primary_key=True),
            Column("user_id", String, nullable=False, index=True),
            Column("handle", String, nullable=False, index=True),
            Column("activity_type", String, nullable=False, index=True),
            Column("metadata", JSON, default=dict),
            Column("created_at", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
        )

        metadata.create_all(self.engine)
        self.metadata = metadata
        self.tables = metadata.tables
        logger.info("Database tables initialized successfully")

    def get_session(self):
        return SessionLocal()

    # --- Profile DAO ---
    def save_profile(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        table = self.tables["profiles"]
        handle = profile["codeforces_handle"]
        user_id = profile.get("user_id", handle)
        
        now = datetime.now(timezone.utc)
        record = {
            "id": f"prof_{handle.lower()}",
            "user_id": user_id,
            "codeforces_handle": handle,
            "current_rating": profile.get("current_rating", 0),
            "max_rating": profile.get("max_rating", 0),
            "rank": profile.get("rank", "unrated"),
            "max_rank": profile.get("max_rank", "unrated"),
            "avatar_url": profile.get("avatar_url"),
            "title_photo_url": profile.get("title_photo_url"),
            "contribution": profile.get("contribution", 0),
            "organization": profile.get("organization"),
            "country": profile.get("country"),
            "city": profile.get("city"),
            "target_rating": profile.get("target_rating"),
            "target_goal": profile.get("target_goal", "rating_improvement"),
            "last_synced_at": profile.get("last_synced_at", now),
            "updated_at": now
        }

        with self.engine.begin() as conn:
            stmt = select(table).where(func.lower(table.c.codeforces_handle) == handle.lower())
            existing = conn.execute(stmt).fetchone()
            if existing:
                update_stmt = update(table).where(table.c.id == existing.id).values(**record)
                conn.execute(update_stmt)
            else:
                record["created_at"] = now
                conn.execute(insert(table).values(**record))
        return record

    def get_profile(self, handle: str) -> Optional[Dict[str, Any]]:
        table = self.tables["profiles"]
        with self.engine.connect() as conn:
            stmt = select(table).where(func.lower(table.c.codeforces_handle) == handle.lower())
            row = conn.execute(stmt).fetchone()
            if row:
                return dict(row._mapping)
        return None

    # --- Problems DAO ---
    def save_problems(self, problems: List[Dict[str, Any]]) -> int:
        table = self.tables["problems"]
        if not problems:
            return 0
            
        saved_count = 0
        now = datetime.now(timezone.utc)
        
        with self.engine.begin() as conn:
            for p in problems:
                key = p["problem_key"]
                stmt = select(table.c.id).where(table.c.problem_key == key)
                existing = conn.execute(stmt).fetchone()
                
                record = {
                    "problem_key": key,
                    "contest_id": p.get("contest_id"),
                    "problem_index": p.get("problem_index", ""),
                    "name": p.get("name", ""),
                    "type": p.get("type", "PROGRAMMING"),
                    "rating": p.get("rating"),
                    "tags": p.get("tags", []),
                    "points": p.get("points"),
                    "solved_count": p.get("solved_count", 0),
                    "problem_url": p.get("problem_url", f"https://codeforces.com/problemset/problem/{key.replace(':', '/')}"),
                    "updated_at": now
                }
                
                if existing:
                    conn.execute(update(table).where(table.c.id == existing.id).values(**record))
                else:
                    record["id"] = f"prob_{key.replace(':', '_')}"
                    record["created_at"] = now
                    conn.execute(insert(table).values(**record))
                saved_count += 1
        return saved_count

    def get_problems(
        self,
        min_rating: Optional[int] = None,
        max_rating: Optional[int] = None,
        tag: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        table = self.tables["problems"]
        with self.engine.connect() as conn:
            query = select(table)
            filters = []
            if min_rating is not None:
                filters.append(table.c.rating >= min_rating)
            if max_rating is not None:
                filters.append(table.c.rating <= max_rating)
            if search:
                filters.append(table.c.name.ilike(f"%{search}%"))
                
            if filters:
                query = query.where(and_(*filters))
                
            query = query.order_by(table.c.rating.asc().nullslast()).limit(limit).offset(offset)
            rows = conn.execute(query).fetchall()
            
            results = [dict(r._mapping) for r in rows]
            if tag:
                # Filter by tag in memory (handles JSON array across SQLite and Postgres)
                results = [r for r in results if r.get("tags") and tag.lower() in [t.lower() for t in r["tags"]]]
            return results

    def get_problem(self, problem_key: str) -> Optional[Dict[str, Any]]:
        table = self.tables["problems"]
        with self.engine.connect() as conn:
            stmt = select(table).where(table.c.problem_key == problem_key)
            row = conn.execute(stmt).fetchone()
            if row:
                return dict(row._mapping)
        return None

    def get_all_problems(self, limit: int = 10000) -> List[Dict[str, Any]]:
        table = self.tables["problems"]
        with self.engine.connect() as conn:
            stmt = select(table).order_by(table.c.rating.asc().nullslast()).limit(limit)
            rows = conn.execute(stmt).fetchall()
            return [dict(r._mapping) for r in rows]

    # --- Submissions DAO ---
    def save_submissions(self, submissions: List[Dict[str, Any]], user_id: str) -> Tuple[int, int]:
        table = self.tables["submissions"]
        if not submissions:
            return 0, 0

        synced_count = 0
        new_count = 0
        now = datetime.now(timezone.utc)

        with self.engine.begin() as conn:
            for s in submissions:
                sub_id = s["submission_id"]
                stmt = select(table.c.id).where(table.c.submission_id == sub_id)
                existing = conn.execute(stmt).fetchone()

                sub_at = s.get("submitted_at")
                if isinstance(sub_at, str):
                    try:
                        sub_at = datetime.fromisoformat(sub_at.replace("Z", "+00:00"))
                    except Exception:
                        sub_at = datetime.now(timezone.utc)
                elif not isinstance(sub_at, datetime):
                    sub_at = datetime.now(timezone.utc)

                record = {
                    "submission_id": sub_id,
                    "user_id": user_id,
                    "handle": s["handle"],
                    "problem_key": s["problem_key"],
                    "contest_id": s.get("contest_id"),
                    "problem_index": s.get("problem_index"),
                    "problem_name": s.get("problem_name"),
                    "verdict": s.get("verdict", "UNKNOWN"),
                    "programming_language": s.get("programming_language"),
                    "execution_time": s.get("execution_time"),
                    "memory_used": s.get("memory_used"),
                    "problem_rating": s.get("problem_rating"),
                    "problem_tags": s.get("problem_tags", []),
                    "submitted_at": sub_at
                }

                if existing:
                    conn.execute(update(table).where(table.c.id == existing.id).values(**record))
                else:
                    record["id"] = f"sub_{sub_id}"
                    record["created_at"] = now
                    conn.execute(insert(table).values(**record))
                    new_count += 1
                synced_count += 1

        return synced_count, new_count

    def get_user_submissions(self, handle: str, limit: int = 1000, offset: int = 0) -> List[Dict[str, Any]]:
        table = self.tables["submissions"]
        with self.engine.connect() as conn:
            stmt = select(table).where(
                func.lower(table.c.handle) == handle.lower()
            ).order_by(desc(table.c.submitted_at)).limit(limit).offset(offset)
            rows = conn.execute(stmt).fetchall()
            return [dict(r._mapping) for r in rows]

    def get_solved_problem_keys(self, handle: str) -> Set[str]:
        table = self.tables["submissions"]
        with self.engine.connect() as conn:
            stmt = select(table.c.problem_key).where(
                and_(
                    func.lower(table.c.handle) == handle.lower(),
                    table.c.verdict == "OK"
                )
            ).distinct()
            rows = conn.execute(stmt).fetchall()
            return {r[0] for r in rows}

    def get_attempted_problem_keys(self, handle: str) -> Set[str]:
        table = self.tables["submissions"]
        with self.engine.connect() as conn:
            stmt = select(table.c.problem_key).where(
                func.lower(table.c.handle) == handle.lower()
            ).distinct()
            rows = conn.execute(stmt).fetchall()
            return {r[0] for r in rows}

    # --- Tag Statistics DAO ---
    def save_user_tag_statistics(self, handle: str, user_id: str, tag_stats: List[Dict[str, Any]]):
        table = self.tables["user_tag_statistics"]
        now = datetime.now(timezone.utc)
        
        with self.engine.begin() as conn:
            for stat in tag_stats:
                tag = stat["tag"]
                stmt = select(table.c.id).where(
                    and_(table.c.user_id == user_id, table.c.tag == tag)
                )
                existing = conn.execute(stmt).fetchone()

                record = {
                    "user_id": user_id,
                    "handle": handle,
                    "tag": tag,
                    "attempted_count": stat.get("attempted_count", 0),
                    "solved_count": stat.get("solved_count", 0),
                    "accuracy": stat.get("accuracy", 0.0),
                    "skill_score": stat.get("skill_score", 0.0),
                    "skill_level": stat.get("skill_level", "Insufficient Data"),
                    "avg_difficulty": stat.get("avg_difficulty", 0),
                    "updated_at": now
                }

                if existing:
                    conn.execute(update(table).where(table.c.id == existing.id).values(**record))
                else:
                    record["id"] = f"stat_{handle.lower()}_{tag.replace(' ', '_')}"
                    conn.execute(insert(table).values(**record))

    def get_user_tag_statistics(self, handle: str) -> List[Dict[str, Any]]:
        table = self.tables["user_tag_statistics"]
        with self.engine.connect() as conn:
            stmt = select(table).where(
                func.lower(table.c.handle) == handle.lower()
            ).order_by(desc(table.c.attempted_count))
            rows = conn.execute(stmt).fetchall()
            return [dict(r._mapping) for r in rows]

    # --- Problem Embeddings DAO ---
    def save_problem_embeddings(self, embeddings_dict: Dict[str, List[float]], model_name: str = "all-MiniLM-L6-v2"):
        table = self.tables["problem_embeddings"]
        now = datetime.now(timezone.utc)
        
        with self.engine.begin() as conn:
            for key, emb in embeddings_dict.items():
                stmt = select(table.c.id).where(table.c.problem_key == key)
                existing = conn.execute(stmt).fetchone()
                
                record = {
                    "problem_key": key,
                    "embedding": emb,
                    "model_name": model_name
                }
                if existing:
                    conn.execute(update(table).where(table.c.id == existing.id).values(**record))
                else:
                    record["id"] = f"emb_{key.replace(':', '_')}"
                    record["created_at"] = now
                    conn.execute(insert(table).values(**record))

    def get_all_embeddings(self) -> Dict[str, List[float]]:
        table = self.tables["problem_embeddings"]
        with self.engine.connect() as conn:
            stmt = select(table.c.problem_key, table.c.embedding)
            rows = conn.execute(stmt).fetchall()
            return {r[0]: r[1] for r in rows}

    # --- Recommendations DAO ---
    def save_recommendations(self, handle: str, user_id: str, recommendations: List[Dict[str, Any]]):
        table = self.tables["recommendation_history"]
        now = datetime.now(timezone.utc)
        
        with self.engine.begin() as conn:
            for rec in recommendations:
                key = rec["problem_key"]
                # Deactivate previous active recommendations for the same problem
                conn.execute(
                    delete(table).where(
                        and_(func.lower(table.c.handle) == handle.lower(), table.c.problem_key == key)
                    )
                )
                
                record = {
                    "id": f"rec_{handle.lower()}_{key.replace(':', '_')}_{int(now.timestamp())}",
                    "user_id": user_id,
                    "handle": handle,
                    "problem_key": key,
                    "recommendation_score": rec.get("recommendation_score", 0.0),
                    "difficulty_score": rec.get("difficulty_score", 0.0),
                    "weakness_score": rec.get("weakness_score", 0.0),
                    "similarity_score": rec.get("similarity_score", 0.0),
                    "quality_score": rec.get("quality_score", 0.0),
                    "recommendation_reason": rec.get("explanation", ""),
                    "target_topic": rec.get("target_topic", ""),
                    "status": rec.get("status", "active"),
                    "recommended_at": now
                }
                conn.execute(insert(table).values(**record))

    def get_recommendations(self, handle: str, status: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        table = self.tables["recommendation_history"]
        with self.engine.connect() as conn:
            query = select(table).where(func.lower(table.c.handle) == handle.lower())
            if status:
                query = query.where(table.c.status == status)
            query = query.order_by(desc(table.c.recommendation_score)).limit(limit)
            rows = conn.execute(query).fetchall()
            return [dict(r._mapping) for r in rows]

    def update_recommendation_status(self, handle: str, problem_key: str, status: str) -> bool:
        table = self.tables["recommendation_history"]
        with self.engine.begin() as conn:
            stmt = update(table).where(
                and_(
                    func.lower(table.c.handle) == handle.lower(),
                    table.c.problem_key == problem_key
                )
            ).values(status=status)
            result = conn.execute(stmt)
            return result.rowcount > 0

    # --- User Activity DAO ---
    def log_activity(self, handle: str, user_id: str, activity_type: str, metadata: Dict[str, Any] = None):
        table = self.tables["user_activity"]
        now = datetime.now(timezone.utc)
        record = {
            "id": f"act_{int(now.timestamp() * 1000)}",
            "user_id": user_id,
            "handle": handle,
            "activity_type": activity_type,
            "metadata": metadata or {},
            "created_at": now
        }
        with self.engine.begin() as conn:
            conn.execute(insert(table).values(**record))

    def get_user_activity(self, handle: str, limit: int = 20) -> List[Dict[str, Any]]:
        table = self.tables["user_activity"]
        with self.engine.connect() as conn:
            stmt = select(table).where(
                func.lower(table.c.handle) == handle.lower()
            ).order_by(desc(table.c.created_at)).limit(limit)
            rows = conn.execute(stmt).fetchall()
            return [dict(r._mapping) for r in rows]

db = DBManager()
