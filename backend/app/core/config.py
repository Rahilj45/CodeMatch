import os
import platform
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

# Windows Python 3.14 platform compatibility
try:
    platform.machine = lambda: 'AMD64'
    platform.system = lambda: 'Windows'
    platform.win32_ver = lambda *a, **k: ('10', '10.0.22631', 'SP0', 'Multiprocessor Free')
    platform._wmi_query = lambda *a, **k: []
    platform._get_machine_win32 = lambda *a, **k: 'AMD64'
    platform._win32_ver = lambda *a, **k: ('10', '10.0.22631', 'SP0', 'Multiprocessor Free')
except Exception:
    pass

class Settings(BaseSettings):
    PROJECT_NAME: str = "CodeMatch API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]
    
    # Supabase / PostgreSQL
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    DATABASE_URL: Optional[str] = None
    
    # SQLite fallback database file
    SQLITE_DB_PATH: str = "codematch.db"
    
    # Codeforces API
    CODEFORCES_API_BASE: str = "https://codeforces.com/api"
    CODEFORCES_REQUEST_TIMEOUT: int = 15
    CODEFORCES_MAX_RETRIES: int = 3
    CODEFORCES_RATE_LIMIT_DELAY: float = 0.35  # max ~2.8 req/sec (CF limit is 5 req/sec)
    
    # Machine Learning & Recommendation
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIM: int = 384
    MAX_RECOMMENDATIONS: int = 10
    DEFAULT_TARGET_GOAL: str = "rating_improvement"
    COLD_START_DEFAULT_RATING: int = 1200
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
