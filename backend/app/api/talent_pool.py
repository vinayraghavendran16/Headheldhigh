"""Talent pool (public directory) endpoints."""
import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Resume, User
from app.schemas import PaginatedResponse, TalentPoolEntry

router = APIRouter(prefix="/api/talent-pool", tags=["talent-pool"])


@router.get("", response_model=PaginatedResponse)
def get_talent_pool(
    page: int = 1,
    page_size: int = 20,
    skill: str = Query(default="", description="Filter by skill (case-insensitive substring)"),
    location: str = Query(default="", description="Filter by location (case-insensitive substring)"),
    role: str = Query(default="", description="Filter by desired role (case-insensitive substring)"),
    db: Session = Depends(get_db),
):
    """Return paginated public talent pool entries."""
    query = (
        db.query(User)
        .options(joinedload(User.resumes))
        .filter(User.is_public == True)  # noqa: E712
    )

    if role:
        query = query.filter(User.desired_role.ilike(f"%{role}%"))

    if location:
        query = query.filter(User.location.ilike(f"%{location}%"))

    all_users = query.all()

    # Filter by skill (requires checking resume skills JSON)
    if skill:
        filtered = []
        for u in all_users:
            resume = u.resumes[0] if u.resumes else None
            skills = resume.skills or [] if resume else []
            if any(skill.lower() in s.lower() for s in skills):
                filtered.append(u)
        all_users = filtered

    total = len(all_users)
    start = (page - 1) * page_size
    end = start + page_size
    page_users = all_users[start:end]

    entries = []
    for u in page_users:
        resume = u.resumes[0] if u.resumes else None
        entries.append(
            TalentPoolEntry(
                id=u.id,
                name=u.name,
                email=u.email,
                linkedin_url=u.linkedin_url,
                location=u.location,
                desired_role=u.desired_role,
                open_to_remote=u.open_to_remote,
                skills=resume.skills if resume else [],
                experience_years=resume.experience_years if resume else None,
                job_titles=resume.job_titles if resume else [],
                created_at=u.created_at,
            )
        )

    return {
        "items": entries,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 1,
    }
