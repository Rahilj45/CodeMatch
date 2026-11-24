# CodeMatch API Documentation 🚀

Interactive OpenAPI documentation is available live at `http://localhost:8000/api/docs`.

## Base URL
`/api`

---

## 1. Profile Endpoints

### `GET /api/profile/{handle}`
Retrieve competitive programming profile metadata for a Codeforces handle.
- **Path Parameter**: `handle` (string)
- **Response**: `ProfileResponse` (200 OK)

### `GET /api/profile/me/default`
Get default profile (defaults to `Rahilj45`).

### `PATCH /api/profile/{handle}`
Update target rating or growth objective.
- **Body**: `{ "target_rating": 1400, "target_goal": "rating_improvement" }`

### `POST /api/profile/sync`
Synchronize profile info and submissions from the official Codeforces API.
- **Query Parameter**: `handle` (string)
- **Response**: `SyncResponse`

---

## 2. Problems Catalogue Endpoints

### `GET /api/problems`
List catalogued problems with pagination and constraints.
- **Query Parameters**:
  - `min_rating` (integer, optional)
  - `max_rating` (integer, optional)
  - `tag` (string, optional)
  - `limit` (integer, default 50)
  - `offset` (integer, default 0)

### `GET /api/problems/search`
Search problems by keyword name.
- **Query Parameter**: `q` (string, required)

### `GET /api/problems/{problem_key}`
Get single problem details by key (e.g. `1900:C`).

---

## 3. Submissions Endpoints

### `GET /api/submissions`
Retrieve submissions for a user with optional verdict filter.
- **Query Parameters**:
  - `handle` (string, default `Rahilj45`)
  - `verdict` (string, optional: `OK`, `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`)
  - `limit` (integer, default 50)

### `POST /api/submissions/sync`
Incrementally synchronize latest submissions from Codeforces.

---

## 4. Analytics Endpoints

### `GET /api/analytics/overview`
Get comprehensive skill analysis, topic accuracies, difficulty histograms, and verdict breakdowns.
- **Query Parameter**: `handle` (string)
- **Response**: `SkillAnalysisResponse`

### `GET /api/analytics/tags`
Get per-topic accuracy and skill classifications (Strong, Developing, Weak, Insufficient Data).

### `GET /api/analytics/activity`
Retrieve user audit logs and recommendation history.

---

## 5. Recommendation Endpoints

### `GET /api/recommendations`
Retrieve current active recommendations for a user.
- **Query Parameter**: `handle` (string)
- **Response**: Array of `RecommendationItem`

### `POST /api/recommendations/generate`
Trigger fresh deterministic recommendation generation.
- **Body**:
  ```json
  {
    "handle": "Rahilj45",
    "count": 10,
    "topic_filter": "graphs",
    "min_rating": 1100,
    "max_rating": 1400,
    "include_previously_unsolved": true
  }
  ```

### `POST /api/recommendations/{problem_key}/feedback`
Record user action on recommendation (`saved`, `skipped`, `solved`).
- **Body**: `{ "problem_key": "1900:C", "action": "solved" }`

---

## 6. Health Endpoint

### `GET /health`
Returns system status, service name, version, and database connection state.
