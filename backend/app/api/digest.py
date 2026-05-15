"""Weekly digest and admin export endpoints."""
import csv
import io
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import DigestEntry

router = APIRouter(prefix="/api/digest", tags=["digest"])


@router.get("/weekly", response_model=list[DigestEntry])
def get_weekly_digest(db: Session = Depends(get_db)):
    """Return users who joined in the last 7 days."""
    cutoff = datetime.utcnow() - timedelta(days=7)
    users = (
        db.query(User)
        .filter(User.created_at >= cutoff)
        .order_by(User.created_at.desc())
        .all()
    )
    return users


@router.get("/weekly/export")
def export_weekly_digest_csv(db: Session = Depends(get_db)):
    """Export weekly new users as a CSV file."""
    cutoff = datetime.utcnow() - timedelta(days=7)
    users = (
        db.query(User)
        .filter(User.created_at >= cutoff)
        .order_by(User.created_at.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=["id", "name", "email", "location", "desired_role", "linkedin_url", "created_at"],
    )
    writer.writeheader()
    for u in users:
        writer.writerow(
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "location": u.location or "",
                "desired_role": u.desired_role or "",
                "linkedin_url": u.linkedin_url or "",
                "created_at": u.created_at.isoformat() if u.created_at else "",
            }
        )

    output.seek(0)
    filename = f"talent-digest-{datetime.utcnow().strftime('%Y-%m-%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
