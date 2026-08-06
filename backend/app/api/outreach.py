"""Outreach agent API — scan social media, capture leads, send LinkedIn DMs."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models import OutreachLead
from app.schemas import (
    OutreachLeadOut,
    OutreachScanRequest,
    OutreachScanResult,
    SendDMRequest,
)
from app.services import linkedin_service
from app.services.outreach_agent import AIREADYREVOPS_PITCH

router = APIRouter(prefix="/api/outreach", tags=["outreach"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/scan", response_model=OutreachScanResult)
def scan_for_leads(req: OutreachScanRequest, db: Session = Depends(get_db)):
    """Run the Claude outreach agent.

    - `scan_only=true` (default): discovers and stores leads, no DMs sent
    - `scan_only=false`: discovers, stores, and sends LinkedIn DMs automatically
    """
    from app.services import outreach_agent  # local import to avoid circular deps

    result = outreach_agent.run(
        command=req.command,
        db=db,
        scan_only=req.scan_only,
    )
    return OutreachScanResult(**result)


@router.get("/leads", response_model=List[OutreachLeadOut])
def list_leads(
    platform: Optional[str] = None,
    contacted: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """List all captured outreach leads with optional filters."""
    q = db.query(OutreachLead)
    if platform:
        q = q.filter(OutreachLead.platform == platform)
    if contacted is not None:
        q = q.filter(OutreachLead.contacted == contacted)
    return q.order_by(OutreachLead.created_at.desc()).all()


@router.get("/leads/{lead_id}", response_model=OutreachLeadOut)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(OutreachLead).filter(OutreachLead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("/leads/{lead_id}/send", response_model=OutreachLeadOut)
def send_dm_to_lead(lead_id: int, req: SendDMRequest = SendDMRequest(), db: Session = Depends(get_db)):
    """Send a LinkedIn DM to a specific lead (must be a LinkedIn lead)."""
    lead = db.query(OutreachLead).filter(OutreachLead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if lead.platform != "linkedin":
        raise HTTPException(status_code=400, detail="Can only send LinkedIn DMs to LinkedIn leads")
    if lead.contacted:
        raise HTTPException(status_code=409, detail="Already contacted this lead")

    message = req.message or AIREADYREVOPS_PITCH.format(
        name=lead.name.split()[0],
        topic=lead.topic or "AI readiness",
    )

    success = linkedin_service.send_dm(
        profile_id=lead.profile_id,
        message=message,
        email=settings.LINKEDIN_EMAIL,
        password=settings.LINKEDIN_PASSWORD,
    )
    if not success:
        raise HTTPException(status_code=502, detail="Failed to send LinkedIn DM — check credentials and logs")

    lead.contacted = True
    lead.contacted_at = datetime.utcnow()
    lead.message_sent = message
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/leads/send-all", response_model=dict)
def send_dm_to_all_pending(db: Session = Depends(get_db)):
    """Send LinkedIn DMs to all LinkedIn leads that haven't been contacted yet."""
    pending = (
        db.query(OutreachLead)
        .filter(OutreachLead.platform == "linkedin", OutreachLead.contacted == False)  # noqa: E712
        .all()
    )

    sent = 0
    failed = 0
    for lead in pending:
        message = AIREADYREVOPS_PITCH.format(
            name=lead.name.split()[0],
            topic=lead.topic or "AI readiness",
        )
        success = linkedin_service.send_dm(
            profile_id=lead.profile_id,
            message=message,
            email=settings.LINKEDIN_EMAIL,
            password=settings.LINKEDIN_PASSWORD,
        )
        if success:
            lead.contacted = True
            lead.contacted_at = datetime.utcnow()
            lead.message_sent = message
            sent += 1
        else:
            failed += 1

    db.commit()
    return {"sent": sent, "failed": failed, "total_pending": len(pending)}


@router.get("/stats", response_model=dict)
def outreach_stats(db: Session = Depends(get_db)):
    """Summary statistics for the outreach pipeline."""
    total = db.query(OutreachLead).count()
    contacted = db.query(OutreachLead).filter(OutreachLead.contacted == True).count()  # noqa: E712
    twitter_count = db.query(OutreachLead).filter(OutreachLead.platform == "twitter").count()
    linkedin_count = db.query(OutreachLead).filter(OutreachLead.platform == "linkedin").count()
    return {
        "total_leads": total,
        "contacted": contacted,
        "pending": total - contacted,
        "twitter_leads": twitter_count,
        "linkedin_leads": linkedin_count,
    }


@router.delete("/leads/{lead_id}", status_code=204)
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(OutreachLead).filter(OutreachLead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
