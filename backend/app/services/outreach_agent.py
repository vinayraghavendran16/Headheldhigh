"""Claude-powered outreach agent.

The agent scans Twitter and LinkedIn for people discussing "ROI on AI" or
"AI readiness", captures their info, and (optionally) sends LinkedIn DMs
promoting AIReadyRevOps.

Run modes:
  scan_only=True  — discover and store leads, no messages sent (default/safe)
  scan_only=False — discover, store, and send LinkedIn DMs automatically
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Optional

import anthropic
from sqlalchemy.orm import Session

from app.config import settings
from app.models import OutreachLead
from app.services import linkedin_service, twitter_service

logger = logging.getLogger(__name__)

AIREADYREVOPS_PITCH = (
    "Hey {name}! I noticed you're exploring {topic} — that's exactly the problem "
    "AIReadyRevOps was built to solve. We help revenue teams become genuinely AI-ready "
    "so the ROI is real and measurable, not theoretical. I'd love to share a quick "
    "framework we've used with similar teams. Would you be open to a 15-minute chat?"
)

SYSTEM_PROMPT = """You are an outreach intelligence agent for AIReadyRevOps.

Your job:
1. Search Twitter and LinkedIn for people actively discussing "ROI on AI" or "AI readiness"
2. Evaluate each result — only surface leads who are GENUINELY engaging with these topics
   (skip vague mentions, bots, news aggregators, and people who've already been contacted)
3. For qualified leads, capture their info and optionally send a personalized LinkedIn DM

Be selective. Quality over quantity. A good lead is someone who:
- Works in a revenue, operations, sales, or leadership role
- Is asking questions about OR sharing opinions on AI ROI/readiness
- Has not already been contacted

When you call tools, use the results to decide next steps. Stop when you have
processed all search results or when instructed to stop.
"""

TOOLS: list[dict] = [
    {
        "name": "search_twitter",
        "description": (
            "Search recent tweets (last 7 days) for people discussing ROI on AI or AI readiness. "
            "Returns tweet text, author name, username, bio, and profile URL."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": 'Search query, e.g. "ROI on AI" OR "AI readiness"',
                },
                "max_results": {
                    "type": "integer",
                    "description": "Max tweets to return (10-50)",
                    "default": 20,
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "search_linkedin",
        "description": (
            "Search LinkedIn for people whose profiles or activity match keywords "
            "about AI readiness or AI ROI."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "keywords": {
                    "type": "string",
                    "description": "Keywords to search for on LinkedIn",
                },
                "max_results": {
                    "type": "integer",
                    "description": "Max profiles to return (5-25)",
                    "default": 10,
                },
            },
            "required": ["keywords"],
        },
    },
    {
        "name": "check_already_contacted",
        "description": "Check if a person has already been contacted or stored as a lead.",
        "input_schema": {
            "type": "object",
            "properties": {
                "profile_id": {
                    "type": "string",
                    "description": "LinkedIn public ID, Twitter user ID, or Twitter username",
                },
                "platform": {
                    "type": "string",
                    "enum": ["twitter", "linkedin"],
                },
            },
            "required": ["profile_id", "platform"],
        },
    },
    {
        "name": "save_lead",
        "description": "Store a qualified lead in the database for outreach.",
        "input_schema": {
            "type": "object",
            "properties": {
                "platform": {"type": "string", "enum": ["twitter", "linkedin"]},
                "profile_id": {"type": "string"},
                "name": {"type": "string"},
                "profile_url": {"type": "string"},
                "bio": {"type": "string"},
                "trigger_text": {
                    "type": "string",
                    "description": "The tweet or post that qualified this person",
                },
                "topic": {
                    "type": "string",
                    "description": "Which topic triggered this: 'ROI on AI' or 'AI readiness'",
                },
            },
            "required": ["platform", "profile_id", "name", "profile_url", "trigger_text", "topic"],
        },
    },
    {
        "name": "send_linkedin_dm",
        "description": (
            "Send a LinkedIn direct message to promote AIReadyRevOps. "
            "Only call this if scan_only mode is disabled."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "profile_id": {
                    "type": "string",
                    "description": "LinkedIn public identifier",
                },
                "name": {"type": "string"},
                "topic": {
                    "type": "string",
                    "description": "The AI topic the person was discussing",
                },
            },
            "required": ["profile_id", "name", "topic"],
        },
    },
]


def _handle_tool(
    tool_name: str,
    tool_input: dict,
    db: Session,
    scan_only: bool,
) -> str:
    if tool_name == "search_twitter":
        leads = twitter_service.search_leads(
            query=tool_input["query"],
            max_results=tool_input.get("max_results", 20),
            bearer_token=settings.TWITTER_BEARER_TOKEN,
        )
        return json.dumps([vars(l) for l in leads])

    if tool_name == "search_linkedin":
        leads = linkedin_service.search_leads(
            keywords=tool_input["keywords"],
            max_results=tool_input.get("max_results", 10),
            email=settings.LINKEDIN_EMAIL,
            password=settings.LINKEDIN_PASSWORD,
        )
        return json.dumps([vars(l) for l in leads])

    if tool_name == "check_already_contacted":
        exists = (
            db.query(OutreachLead)
            .filter_by(
                profile_id=tool_input["profile_id"],
                platform=tool_input["platform"],
            )
            .first()
            is not None
        )
        return json.dumps({"already_contacted": exists})

    if tool_name == "save_lead":
        existing = (
            db.query(OutreachLead)
            .filter_by(
                profile_id=tool_input["profile_id"],
                platform=tool_input["platform"],
            )
            .first()
        )
        if existing:
            return json.dumps({"saved": False, "reason": "already exists"})

        lead = OutreachLead(
            platform=tool_input["platform"],
            profile_id=tool_input["profile_id"],
            name=tool_input["name"],
            profile_url=tool_input["profile_url"],
            bio=tool_input.get("bio", ""),
            trigger_text=tool_input["trigger_text"],
            topic=tool_input["topic"],
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return json.dumps({"saved": True, "lead_id": lead.id})

    if tool_name == "send_linkedin_dm":
        if scan_only:
            return json.dumps({"sent": False, "reason": "scan_only mode — DM not sent"})

        lead = (
            db.query(OutreachLead)
            .filter_by(profile_id=tool_input["profile_id"], platform="linkedin")
            .first()
        )
        message = AIREADYREVOPS_PITCH.format(
            name=tool_input["name"].split()[0],
            topic=tool_input.get("topic", "AI readiness"),
        )
        success = linkedin_service.send_dm(
            profile_id=tool_input["profile_id"],
            message=message,
            email=settings.LINKEDIN_EMAIL,
            password=settings.LINKEDIN_PASSWORD,
        )
        if success and lead:
            lead.contacted = True
            lead.contacted_at = datetime.utcnow()
            lead.message_sent = message
            db.commit()

        return json.dumps({"sent": success, "message": message})

    return json.dumps({"error": f"Unknown tool: {tool_name}"})


def run(
    command: str,
    db: Session,
    scan_only: bool = True,
    max_iterations: int = 20,
) -> dict:
    """Run the outreach agent with a natural language command.

    Args:
        command: What to do, e.g. "Scan for new AI readiness leads on Twitter and LinkedIn"
        db: SQLAlchemy session
        scan_only: If True, save leads but never send DMs
        max_iterations: Safety cap on agent loop iterations

    Returns:
        {"summary": str, "leads_found": int, "messages_sent": int}
    """
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    mode_note = "scan_only mode is ON — do NOT call send_linkedin_dm." if scan_only else (
        "scan_only mode is OFF — you may call send_linkedin_dm for LinkedIn leads."
    )

    messages: list[dict] = [
        {"role": "user", "content": f"{command}\n\n({mode_note})"},
    ]

    leads_found = 0
    messages_sent = 0

    for _ in range(max_iterations):
        response = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )

        # Add assistant response to history
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason == "end_turn":
            break

        if response.stop_reason != "tool_use":
            break

        # Process all tool calls in this response
        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue

            result_str = _handle_tool(block.name, block.input, db, scan_only)

            # Track metrics
            try:
                result_data = json.loads(result_str)
                if block.name == "save_lead" and result_data.get("saved"):
                    leads_found += 1
                if block.name == "send_linkedin_dm" and result_data.get("sent"):
                    messages_sent += 1
            except json.JSONDecodeError:
                pass

            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result_str,
                }
            )

        messages.append({"role": "user", "content": tool_results})

    # Extract final text summary from last assistant message
    summary = ""
    for block in response.content:
        if hasattr(block, "text"):
            summary = block.text
            break

    return {
        "summary": summary or "Agent completed.",
        "leads_found": leads_found,
        "messages_sent": messages_sent,
    }
