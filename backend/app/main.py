"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.config import settings
from app.database import Base, engine
from app.api import users, resumes, jobs, matches, talent_pool, applications, digest, outreach

# Create database tables
Base.metadata.create_all(bind=engine)

# Ensure upload directory exists
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="HeadHeldHigh",
    description="Resume-to-job-matcher platform for laid-off professionals",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(users.router)
app.include_router(resumes.router)
app.include_router(jobs.router)
app.include_router(matches.router)
app.include_router(talent_pool.router)
app.include_router(applications.router)
app.include_router(digest.router)
app.include_router(outreach.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/api/stats")
def get_stats(db=None):
    """Return platform-wide stats for the landing page."""
    from app.database import SessionLocal
    from app.models import User, JobMatch

    session = SessionLocal()
    try:
        user_count = session.query(User).count()
        match_count = session.query(JobMatch).count()
        return {
            "talent_pool_count": user_count,
            "jobs_matched_total": match_count,
        }
    finally:
        session.close()
