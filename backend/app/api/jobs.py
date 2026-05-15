"""Job posting and job refresh endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import JobMatch, JobPosting, Resume, User
from app.schemas import JobPostingOut, PaginatedResponse
from app.services.job_matcher import match_jobs_for_user
from app.services.job_searcher import search_jobs

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("/refresh/{user_id}")
async def refresh_jobs(user_id: int, db: Session = Depends(get_db)):
    """
    Re-run job search for a user, upsert results, and score new jobs with Claude.
    Returns the number of new matches created.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    resume = db.query(Resume).filter(Resume.user_id == user_id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has not uploaded a resume yet.",
        )

    # Determine search query
    query = user.desired_role or ""
    if not query and resume.job_titles:
        query = resume.job_titles[0]
    if not query:
        query = "Software Engineer"

    # Search external API
    raw_jobs = await search_jobs(
        query=query,
        location=user.location,
        remote_only=user.open_to_remote,
    )

    # Upsert job postings
    upserted_job_ids = []
    for raw in raw_jobs:
        existing = (
            db.query(JobPosting)
            .filter(JobPosting.external_id == raw["external_id"])
            .first()
        )
        if existing:
            job = existing
        else:
            job = JobPosting(external_id=raw["external_id"])

        job.title = raw["title"]
        job.company = raw["company"]
        job.location = raw["location"]
        job.description = raw["description"]
        job.url = raw["url"]
        job.salary_min = raw["salary_min"]
        job.salary_max = raw["salary_max"]
        job.job_type = raw["job_type"]
        job.posted_at = raw["posted_at"]
        job.source = raw["source"]

        db.add(job)
        db.flush()  # get job.id
        upserted_job_ids.append(job.id)

    db.commit()

    # Find jobs without a match score for this user
    existing_match_job_ids = {
        m.job_id
        for m in db.query(JobMatch.job_id).filter(JobMatch.user_id == user_id).all()
    }
    new_job_ids = [jid for jid in upserted_job_ids if jid not in existing_match_job_ids]

    if not new_job_ids:
        return {"message": "No new jobs to score.", "new_matches": 0}

    # Fetch new jobs
    new_jobs = db.query(JobPosting).filter(JobPosting.id.in_(new_job_ids)).all()
    jobs_for_matching = [
        {
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "location": j.location,
            "description": j.description,
        }
        for j in new_jobs
    ]

    # Build resume data dict
    resume_data = {
        "skills": resume.skills or [],
        "experience_years": resume.experience_years,
        "job_titles": resume.job_titles or [],
        "industries": resume.industries or [],
        "education": resume.education or "",
        "summary": resume.summary or "",
    }

    # Score with Claude
    match_results = await match_jobs_for_user(resume_data, jobs_for_matching)

    # Persist matches
    for result in match_results:
        match = JobMatch(
            user_id=user_id,
            job_id=result["job_id"],
            relevance_score=result["score"],
            match_reasons=result["reasons"],
            missing_skills=result["missing_skills"],
        )
        db.add(match)

    db.commit()

    return {
        "message": f"Scored {len(match_results)} new job(s).",
        "new_matches": len(match_results),
    }


@router.get("", response_model=PaginatedResponse)
def list_jobs(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    """List all known job postings (paginated)."""
    total = db.query(JobPosting).count()
    jobs = (
        db.query(JobPosting)
        .order_by(JobPosting.fetched_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    import math

    return {
        "items": [JobPostingOut.model_validate(j) for j in jobs],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 1,
    }
