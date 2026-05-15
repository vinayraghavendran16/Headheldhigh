"""Skills gap analysis service using Claude AI."""
import json
import logging
import re
from collections import Counter
from typing import List

import anthropic

from app.config import settings

logger = logging.getLogger(__name__)


async def analyze_skills_gap(user_id: int, matches: List[dict]) -> dict:
    """
    Analyze the top job matches and produce a prioritized skills gap report.

    Args:
        user_id: The user's ID
        matches: List of match dicts with 'missing_skills' and 'relevance_score'

    Returns:
        Skills gap report dict
    """
    # Use top 20 matches only
    top_matches = sorted(matches, key=lambda m: m.get("relevance_score", 0), reverse=True)[:20]

    # Aggregate missing skills with frequency count
    all_missing: list = []
    for match in top_matches:
        missing = match.get("missing_skills") or []
        all_missing.extend([s.strip() for s in missing if s and s.strip()])

    if not all_missing:
        return {
            "user_id": user_id,
            "top_missing_skills": [],
            "summary": "No significant skills gaps detected based on your matched jobs.",
            "recommended_resources": [],
        }

    skill_counts = Counter(all_missing)
    # Take top 15 skills by frequency for Claude analysis
    top_skills = skill_counts.most_common(15)

    skills_list_text = "\n".join(
        f"- {skill} (missing in {count} of top matching jobs)"
        for skill, count in top_skills
    )

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    prompt = f"""You are a career coach. Based on the skills gaps identified from job matching analysis, produce a structured skills gap report.

Missing skills frequency from top job matches:
{skills_list_text}

Return ONLY a valid JSON object (no markdown) with this structure:
{{
  "top_missing_skills": [
    {{
      "skill": "skill name",
      "frequency": <number>,
      "priority": "high" | "medium" | "low",
      "reason": "<one sentence why this skill matters>"
    }}
  ],
  "summary": "<2-3 sentence overall assessment>",
  "recommended_resources": ["resource1", "resource2", "resource3", "resource4", "resource5"]
}}

Rules:
- Include up to 10 skills in top_missing_skills, ordered by priority (high first)
- Priority: high = missing in 3+ jobs or foundational skill; medium = 2 jobs; low = 1 job
- recommended_resources: suggest specific courses, certifications, or platforms (e.g., "AWS Certified Solutions Architect – Coursera", "Kubernetes for Developers – Linux Foundation")"""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        response_text = message.content[0].text.strip()
        response_text = re.sub(r"^```(?:json)?\s*", "", response_text)
        response_text = re.sub(r"\s*```$", "", response_text)
        result = json.loads(response_text)

        # Ensure frequency is filled from our actual data
        skill_freq_map = dict(top_skills)
        for item in result.get("top_missing_skills", []):
            item["frequency"] = skill_freq_map.get(item.get("skill", ""), 1)

        return {
            "user_id": user_id,
            "top_missing_skills": result.get("top_missing_skills", []),
            "summary": result.get("summary", ""),
            "recommended_resources": result.get("recommended_resources", []),
        }

    except json.JSONDecodeError as e:
        logger.error(f"Claude returned invalid JSON for skills gap: {e}")
    except anthropic.APIError as e:
        logger.error(f"Claude API error in skills gap analysis: {e}")

    # Fallback: build basic report from frequency data
    top_missing = [
        {
            "skill": skill,
            "frequency": count,
            "priority": "high" if count >= 3 else ("medium" if count == 2 else "low"),
            "reason": f"Required in {count} of your top matched job postings.",
        }
        for skill, count in top_skills[:10]
    ]
    return {
        "user_id": user_id,
        "top_missing_skills": top_missing,
        "summary": "Focus on the high-priority skills above to maximize your job match scores.",
        "recommended_resources": [
            "Coursera – Professional Certificates",
            "LinkedIn Learning",
            "Udemy – Top-rated courses",
            "YouTube – Free tutorials",
            "Official documentation & hands-on projects",
        ],
    }
