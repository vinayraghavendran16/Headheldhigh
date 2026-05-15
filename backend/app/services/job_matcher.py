"""Job matching service using Claude AI."""
import json
import logging
import re
from typing import List, Dict, Any

import anthropic

from app.config import settings

logger = logging.getLogger(__name__)

BATCH_SIZE = 10  # Jobs per Claude call


async def match_jobs_for_user(
    resume_data: dict,
    jobs: List[dict],
) -> List[dict]:
    """
    Score a list of jobs against a user's resume.

    Args:
        resume_data: Parsed resume dict (skills, summary, job_titles, etc.)
        jobs: List of job dicts from JobPosting model (id, title, company, description)

    Returns:
        List of match result dicts: {job_id, score, reasons, missing_skills}
    """
    if not jobs:
        return []

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    resume_summary = _build_resume_summary(resume_data)
    results = []

    for i in range(0, len(jobs), BATCH_SIZE):
        batch = jobs[i : i + BATCH_SIZE]
        batch_results = await _score_batch(client, resume_summary, batch)
        results.extend(batch_results)

    return results


def _build_resume_summary(resume_data: dict) -> str:
    skills = ", ".join(resume_data.get("skills") or [])
    titles = ", ".join(resume_data.get("job_titles") or [])
    industries = ", ".join(resume_data.get("industries") or [])
    exp = resume_data.get("experience_years")
    edu = resume_data.get("education") or ""
    summary = resume_data.get("summary") or ""

    return (
        f"Summary: {summary}\n"
        f"Experience: {exp} years\n"
        f"Job Titles: {titles}\n"
        f"Skills: {skills}\n"
        f"Industries: {industries}\n"
        f"Education: {edu}"
    )


async def _score_batch(
    client: anthropic.Anthropic, resume_summary: str, jobs: List[dict]
) -> List[dict]:
    """Score a batch of jobs in a single Claude call."""

    jobs_text_parts = []
    for idx, job in enumerate(jobs):
        desc = (job.get("description") or "")[:1000]
        jobs_text_parts.append(
            f"JOB_{idx}:\n"
            f"  Title: {job.get('title', '')}\n"
            f"  Company: {job.get('company', '')}\n"
            f"  Location: {job.get('location', '')}\n"
            f"  Description: {desc}"
        )
    jobs_text = "\n\n".join(jobs_text_parts)

    prompt = f"""You are an expert recruiter. Score how well the candidate's resume matches each job below.

CANDIDATE RESUME:
{resume_summary}

JOBS TO SCORE:
{jobs_text}

Return ONLY a valid JSON array (no markdown) with exactly {len(jobs)} objects, one per job in order:
[
  {{
    "score": <integer 0-100>,
    "reasons": ["reason1", "reason2", "reason3"],
    "missing_skills": ["skill1", "skill2"]
  }},
  ...
]

Scoring guide:
- 80-100: Excellent match, candidate meets nearly all requirements
- 60-79: Good match, candidate meets most requirements
- 40-59: Partial match, some relevant experience
- 0-39: Poor match, significant gaps

Keep reasons concise (max 8 words each). List up to 5 missing skills."""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )
        response_text = message.content[0].text.strip()
        response_text = re.sub(r"^```(?:json)?\s*", "", response_text)
        response_text = re.sub(r"\s*```$", "", response_text)
        scores = json.loads(response_text)

        results = []
        for idx, job in enumerate(jobs):
            if idx < len(scores):
                s = scores[idx]
            else:
                s = {"score": 50, "reasons": [], "missing_skills": []}

            results.append(
                {
                    "job_id": job["id"],
                    "score": max(0, min(100, int(s.get("score", 50)))),
                    "reasons": _ensure_list(s.get("reasons")),
                    "missing_skills": _ensure_list(s.get("missing_skills")),
                }
            )
        return results

    except json.JSONDecodeError as e:
        logger.error(f"Claude batch scoring returned invalid JSON: {e}")
        return [
            {"job_id": j["id"], "score": 50, "reasons": [], "missing_skills": []}
            for j in jobs
        ]
    except anthropic.APIError as e:
        logger.error(f"Claude API error in batch scoring: {e}")
        return [
            {"job_id": j["id"], "score": 50, "reasons": [], "missing_skills": []}
            for j in jobs
        ]


def _ensure_list(val) -> list:
    if isinstance(val, list):
        return [str(x) for x in val if x]
    return []
