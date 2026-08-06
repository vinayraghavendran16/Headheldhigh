"""LinkedIn search and messaging service for outreach.

Uses the unofficial linkedin-api library (pip install linkedin-api).
This requires a LinkedIn account (email + password). LinkedIn's ToS
restricts automated access; use responsibly and at low volume.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class LinkedInLead:
    profile_id: str          # LinkedIn public identifier (e.g. "john-doe-123")
    name: str
    headline: Optional[str]
    location: Optional[str]
    profile_url: str
    connection_degree: Optional[str]  # "1st", "2nd", "3rd+"


def _get_client(email: str, password: str):
    try:
        from linkedin_api import Linkedin  # noqa: PLC0415
    except ImportError:
        raise RuntimeError("linkedin-api not installed. Run: pip install linkedin-api")
    return Linkedin(email, password)


def search_leads(
    keywords: str,
    max_results: int = 20,
    email: str = "",
    password: str = "",
) -> list[LinkedInLead]:
    """Search LinkedIn for people matching the given keywords."""
    if not email or not password:
        logger.warning("LINKEDIN_EMAIL / LINKEDIN_PASSWORD not set — skipping LinkedIn search")
        return []

    try:
        client = _get_client(email, password)
        results = client.search_people(keywords=keywords, limit=max_results)
    except Exception as exc:
        logger.error("LinkedIn search failed: %s", exc)
        return []

    leads: list[LinkedInLead] = []
    for r in results:
        urn = r.get("urn_id", "")
        public_id = r.get("public_id", urn)
        name = f"{r.get('firstName', '')} {r.get('lastName', '')}".strip()
        if not name or not public_id:
            continue
        leads.append(
            LinkedInLead(
                profile_id=public_id,
                name=name,
                headline=r.get("headline"),
                location=r.get("location"),
                profile_url=f"https://www.linkedin.com/in/{public_id}/",
                connection_degree=r.get("distance"),
            )
        )

    return leads


def get_profile(
    public_id: str,
    email: str = "",
    password: str = "",
) -> Optional[dict]:
    """Fetch a full LinkedIn profile by public identifier."""
    if not email or not password:
        return None
    try:
        client = _get_client(email, password)
        return client.get_profile(public_id=public_id)
    except Exception as exc:
        logger.error("LinkedIn get_profile failed for %s: %s", public_id, exc)
        return None


def send_dm(
    profile_id: str,
    message: str,
    email: str = "",
    password: str = "",
) -> bool:
    """Send a LinkedIn direct message. Returns True on success."""
    if not email or not password:
        logger.warning("LinkedIn credentials not set — cannot send DM")
        return False
    try:
        client = _get_client(email, password)
        client.send_message(recipients=[profile_id], message_body=message)
        logger.info("LinkedIn DM sent to %s", profile_id)
        return True
    except Exception as exc:
        logger.error("Failed to send LinkedIn DM to %s: %s", profile_id, exc)
        return False
