# CodeMatch System Architecture 🏛️

CodeMatch is an end-to-end intelligent competitive-programming recommendation platform designed to answer the core objective: **Recommend the right problem to the right programmer at the right time.**

```
                                  +-----------------------------+
                                  |    Codeforces Official API   |
                                  |  (user.info, status, probs)  |
                                  +--------------+--------------+
                                                 |
                                                 v
                                  +-----------------------------+
                                  | Async Ingestion Engine       |
                                  | - Rate limiter (0.35s delay) |
                                  | - Exponential backoff retry |
                                  | - Incremental sync          |
                                  +--------------+--------------+
                                                 |
                                                 v
+-------------------------------+ +-----------------------------+ +-----------------------------+
|     Supabase PostgreSQL       | |    Skill Analysis Engine    | |    ML Embedding Pipeline    |
| - Profiles, Submissions       | | - Bayesian topic accuracy   | | - all-MiniLM-L6-v2 (384-d)  |
| - Problems, Embeddings        | | - Gaussian difficulty curve | | - Cosine similarity search  |
| - pgvector + RLS policies     | | - Skill scoring (0-100)     | | - Topic concept vectors     |
+---------------+---------------+ +--------------+--------------+ +--------------+--------------+
                |                                |                               |
                +--------------------------------+-------------------------------+
                                                 |
                                                 v
                                  +-----------------------------+
                                  | Hybrid Recommendation Engine|
                                  | - Solved problem exclusion  |
                                  | - Weakness priority boost   |
                                  | - Redemption opportunities  |
                                  | - Topic diversity filter    |
                                  +--------------+--------------+
                                                 |
                                                 v
                                  +-----------------------------+
                                  | FastAPI REST Server         |
                                  | - Clean Pydantic schemas    |
                                  | - OpenAPI 3.1 documentation |
                                  | - Health checks & audit log |
                                  +--------------+--------------+
                                                 |
                                                 v
                                  +-----------------------------+
                                  | React + Vite + Tailwind UI  |
                                  | - Dark-first SaaS interface |
                                  | - Real-time Recharts charts |
                                  | - 8 Production pages        |
                                  +-----------------------------+
```

## Core Modules

### 1. Ingestion Pipeline (`backend/app/ingestion/codeforces.py`)
- Communicates asynchronously via `httpx` with Codeforces API.
- Implements exponential backoff on HTTP 429/5xx status codes.
- Maintains sub-second throttle rates avoiding API abuse.
- Ingests profile data, historical submission verdicts, problem metadata, and solve counts.

### 2. Storage & Database Layer (`backend/app/db/database.py`)
- Multi-engine: Native Supabase PostgreSQL with `pgvector` or local SQLite fallback for standalone and CI test environments.
- Unique constraints on `submission_id` and `problem_key` preventing data duplication.
- Row Level Security (RLS) policies safeguarding user records.

### 3. Skill Analysis Engine (`backend/app/services/analytics.py`)
- Evaluates topic-level success rate using Bayesian Laplace smoothing:
  $$\text{Smoothed Accuracy} = \frac{N_{\text{solved}} + 2}{N_{\text{attempted}} + 4}$$
- Categorizes skills into **Strong** ($\ge 70\%$), **Developing** ($40\% - 70\%$), **Weak** ($< 40\%$), or **Insufficient Data** ($< 4$ attempts).
- Computes solved rating histograms and verdict distributions.

### 4. Recommendation Engine (`backend/app/services/recommendation.py`)
- Deterministic, transparent scoring combining:
  1. Gaussian difficulty suitability ($35\%$)
  2. Weak topic priority ($30\%$)
  3. Vector semantic similarity ($20\%$)
  4. Community problem quality ($15\%$)
  5. Redemption bonus for unsolved attempts ($+8\%$)
- Strict exclusion of previously solved problems.
- Topic diversity guard preventing successive identical tag clusters.
