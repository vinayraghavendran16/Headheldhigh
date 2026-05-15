"""Job search service using JSearch API via RapidAPI."""
import logging
from datetime import datetime
from typing import List, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

JSEARCH_BASE_URL = "https://jsearch.p.rapidapi.com/search"
JSEARCH_HEADERS = {
    "X-RapidAPI-Key": settings.RAPIDAPI_KEY,
    "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
}


async def search_jobs(
    query: str,
    location: Optional[str] = None,
    remote_only: bool = False,
    num_pages: int = 5,
) -> List[dict]:
    """
    Search JSearch API and return a list of normalized job dicts.

    Each dict contains:
        external_id, title, company, location, description, url,
        salary_min, salary_max, job_type, posted_at, source
    """
    if not settings.RAPIDAPI_KEY:
        logger.warning("RAPIDAPI_KEY not set – returning mock jobs")
        return _mock_jobs(query)

    jobs = []
    async with httpx.AsyncClient(timeout=30) as client:
        for page in range(1, num_pages + 1):
            params = {
                "query": query + (" remote" if remote_only else ""),
                "page": str(page),
                "num_pages": "1",
                "date_posted": "month",
            }
            if location and not remote_only:
                params["query"] = f"{query} in {location}"

            try:
                resp = await client.get(
                    JSEARCH_BASE_URL, headers=JSEARCH_HEADERS, params=params
                )
                resp.raise_for_status()
                data = resp.json()
                raw_jobs = data.get("data", [])
                for j in raw_jobs:
                    normalized = _normalize_job(j)
                    if normalized:
                        jobs.append(normalized)
            except httpx.HTTPStatusError as e:
                logger.error(f"JSearch HTTP error page {page}: {e}")
                break
            except Exception as e:
                logger.error(f"JSearch error page {page}: {e}")
                break

            if len(jobs) >= 50:
                break

    return jobs[:50]


def _normalize_job(raw: dict) -> Optional[dict]:
    """Map JSearch response fields to our internal schema."""
    job_id = raw.get("job_id")
    if not job_id:
        return None

    title = raw.get("job_title", "")
    company = raw.get("employer_name", "")
    location_parts = [
        raw.get("job_city", ""),
        raw.get("job_state", ""),
        raw.get("job_country", ""),
    ]
    location = ", ".join(p for p in location_parts if p)

    description = raw.get("job_description", "")
    url = raw.get("job_apply_link") or raw.get("job_google_link", "")

    salary_min = raw.get("job_min_salary")
    salary_max = raw.get("job_max_salary")

    job_type = raw.get("job_employment_type", "")

    posted_at = None
    posted_ts = raw.get("job_posted_at_timestamp")
    if posted_ts:
        try:
            posted_at = datetime.utcfromtimestamp(int(posted_ts))
        except Exception:
            pass

    source = raw.get("job_publisher", "JSearch")

    return {
        "external_id": str(job_id),
        "title": title,
        "company": company,
        "location": location,
        "description": description[:5000] if description else "",
        "url": url,
        "salary_min": float(salary_min) if salary_min is not None else None,
        "salary_max": float(salary_max) if salary_max is not None else None,
        "job_type": job_type,
        "posted_at": posted_at,
        "source": source,
    }


def _mock_jobs(query: str) -> List[dict]:
    """Return fake jobs when the API key is not configured."""
    titles = [
        f"Senior {query}",
        f"Lead {query}",
        f"{query} – Remote",
        f"Principal {query}",
        f"Staff {query}",
    ]
    companies = ["Acme Corp", "Globex", "Initech", "Umbrella Inc", "Soylent"]
    locations = ["San Francisco, CA", "New York, NY", "Austin, TX", "Remote", "Seattle, WA"]

    return [
        {
            "external_id": f"mock-{i}",
            "title": titles[i % len(titles)],
            "company": companies[i % len(companies)],
            "location": locations[i % len(locations)],
            "description": (
                f"We are looking for a {titles[i % len(titles)]} to join our team. "
                "You will work on exciting projects and collaborate with smart people. "
                "Requirements: 3+ years of experience, strong communication skills, "
                "ability to work in a fast-paced environment. "
                "Nice to have: Python, React, SQL, cloud experience."
            ),
            "url": "https://example.com/jobs",
            "salary_min": 100000 + i * 10000,
            "salary_max": 150000 + i * 10000,
            "job_type": "FULLTIME",
            "posted_at": datetime.utcnow(),
            "source": "Mock",
        }
        for i in range(10)
    ]
