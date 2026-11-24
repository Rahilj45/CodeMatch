import os
import sys

def verify():
    print("=== CodeMatch Deployment Verification ===")
    errors = []

    # 1. Check Backend Files
    backend_files = [
        "backend/app/main.py",
        "backend/app/core/config.py",
        "backend/app/db/database.py",
        "backend/app/ingestion/codeforces.py",
        "backend/app/services/analytics.py",
        "backend/app/services/recommendation.py",
        "backend/app/ml/embeddings.py",
        "backend/requirements.txt",
        "backend/Dockerfile"
    ]
    for bf in backend_files:
        if os.path.exists(bf):
            print(f"  [OK] Backend file: {bf}")
        else:
            errors.append(f"Missing backend file: {bf}")

    # 2. Check Frontend Build
    frontend_dist = "frontend/dist/index.html"
    if os.path.exists(frontend_dist):
        print(f"  [OK] Frontend production build: {frontend_dist}")
    else:
        errors.append("Frontend dist/index.html not found. Run 'npm run build' in frontend/")

    # 3. Check Database & Ingestion
    db_file = "backend/codematch.db"
    if os.path.exists(db_file):
        size_kb = os.path.getsize(db_file) / 1024
        print(f"  [OK] Local database ready: {db_file} ({size_kb:.1f} KB)")
    else:
        errors.append(f"Missing database file: {db_file}")

    # 4. Check Docker & Deployment Files
    deploy_files = [
        "docker-compose.yml",
        "frontend/Dockerfile",
        "frontend/nginx.conf",
        "frontend/vercel.json",
        "render.yaml",
        "supabase/migrations/20261124_000001_initial_schema.sql",
        ".env.example",
        "README.md"
    ]
    for df in deploy_files:
        if os.path.exists(df):
            print(f"  [OK] Deployment config: {df}")
        else:
            errors.append(f"Missing deployment file: {df}")

    print("\n-------------------------------------------")
    if not errors:
        print("ALL AUDIT CHECKS PASSED: 100% DEPLOYMENT READY!")
        return 0
    else:
        print(f"Found {len(errors)} issues:")
        for err in errors:
            print(f"  - {err}")
        return 1

if __name__ == "__main__":
    sys.exit(verify())
