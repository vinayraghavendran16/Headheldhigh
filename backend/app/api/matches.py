"""Job match retrieval endpoints."""
import math

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import JobMatch, Resume, User
from app.schemas import JobMatchOut, PaginatedResponse, SkillsGapReport
from app.services.skills_analyzer import analyze_skills_gap

router = APIRouter(prefix="/api/users", tags=["matches"])


@router.get("/{user_id}/matches", response_model=PaginatedResponse)
def get_user_matches(
    user_id: int,
    page: int = 1,
    page_size: int = 20,
    min_score: float = 0,
    db: Session = Depends(get_db),
):
    """Get paginated job matches for a user, sorted by relevance score descending."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    query = (
        db.query(JobMatch)
        .options(joinedload(JobMatch.job))
        .filter(JobMatch.user_id == user_id)
        .filter(JobMatch.relevance_score >= min_score)
        .order_by(JobMatch.relevance_score.desc())
    )

    total = query.count()
    matches = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": [JobMatchOut.model_validate(m) for m in matches],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 1,
    }


@router.get("/{user_id}/gap", response_model=SkillsGapReport)
async def get_skills_gap(user_id: int, db: Session = Depends(get_db)):
    """Get a skills gap analysis for a user based on their top job matches."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    resume = db.query(Resume).filter(Resume.user_id == user_id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User has not uploaded a resume yet.",
        )

    matches = (
        db.query(JobMatch)
        .filter(JobMatch.user_id == user_id)
        .order_by(JobMatch.relevance_score.desc())
        .limit(20)
        .all()
    )

    match_dicts = [
        {
            "relevance_score": m.relevance_score,
            "missing_skills": m.missing_skills or [],
        }
        for m in matches
    ]

    report = await analyze_skills_gap(user_id=user_id, matches=match_dicts)
    return report
