"""Application tracking endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Application, JobPosting, User
from app.schemas import ApplicationCreate, ApplicationOut

router = APIRouter(prefix="/api/applications", tags=["applications"])

VALID_STATUSES = {"saved", "applied", "interviewing", "offered", "rejected"}


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db)):
    """Create or update a job application record."""
    if payload.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}",
        )

    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    job = db.query(JobPosting).filter(JobPosting.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.")

    # Upsert: one application per (user, job)
    existing = (
        db.query(Application)
        .filter(Application.user_id == payload.user_id, Application.job_id == payload.job_id)
        .first()
    )

    if existing:
        existing.status = payload.status
        if payload.notes is not None:
            existing.notes = payload.notes
        db.commit()
        db.refresh(existing)
        app = existing
    else:
        app = Application(
            user_id=payload.user_id,
            job_id=payload.job_id,
            status=payload.status,
            notes=payload.notes,
        )
        db.add(app)
        db.commit()
        db.refresh(app)

    # Reload with job relationship
    app = (
        db.query(Application)
        .options(joinedload(Application.job))
        .filter(Application.id == app.id)
        .first()
    )
    return app


@router.get("/{user_id}", response_model=list[ApplicationOut])
def get_user_applications(user_id: int, db: Session = Depends(get_db)):
    """Get all applications for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    apps = (
        db.query(Application)
        .options(joinedload(Application.job))
        .filter(Application.user_id == user_id)
        .order_by(Application.applied_at.desc())
        .all()
    )
    return apps


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(application_id: int, db: Session = Depends(get_db)):
    """Delete an application record."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
    db.delete(app)
    db.commit()
