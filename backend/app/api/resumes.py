"""Resume upload and parsing endpoints."""
import os
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Resume, User
from app.schemas import ResumeOut
from app.services.resume_parser import extract_raw_text, parse_resume_with_claude

router = APIRouter(prefix="/api/resumes", tags=["resumes"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/upload", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a resume file, extract text, and parse it with Claude."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Validate extension
    original_filename = file.filename or "resume"
    ext = Path(original_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read content with size check
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 10 MB.",
        )

    # Save to disk
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex}{ext}"
    file_path = upload_dir / safe_name

    with open(file_path, "wb") as f:
        f.write(content)

    # Extract raw text
    raw_text = extract_raw_text(str(file_path), original_filename)

    # Parse with Claude
    parsed = await parse_resume_with_claude(raw_text)

    # Update user name if extracted from resume
    if parsed.get("name") and not user.name:
        user.name = parsed["name"]
        db.add(user)

    # Create or update resume record
    existing_resume = db.query(Resume).filter(Resume.user_id == user_id).first()
    if existing_resume:
        resume = existing_resume
        # Clean up old file
        try:
            old_path = upload_dir / Path(resume.filename).name
            if old_path.exists():
                os.remove(old_path)
        except Exception:
            pass
    else:
        resume = Resume(user_id=user_id)

    resume.filename = safe_name
    resume.raw_text = raw_text
    resume.skills = parsed.get("skills", [])
    resume.experience_years = parsed.get("experience_years")
    resume.education = parsed.get("education")
    resume.job_titles = parsed.get("job_titles", [])
    resume.industries = parsed.get("industries", [])
    resume.summary = parsed.get("summary")
    resume.parsed_at = datetime.utcnow()

    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.get("/{user_id}", response_model=ResumeOut)
def get_resume(user_id: int, db: Session = Depends(get_db)):
    """Get a user's most recent resume."""
    resume = db.query(Resume).filter(Resume.user_id == user_id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No resume found for this user.")
    return resume
