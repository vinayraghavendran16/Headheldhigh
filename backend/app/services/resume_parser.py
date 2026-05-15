"""Resume parser service using Claude AI."""
import json
import logging
import re
from pathlib import Path
from typing import Optional

import anthropic

from app.config import settings

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> str:
    """Extract plain text from a PDF file."""
    try:
        import PyPDF2

        text_parts = []
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n".join(text_parts)
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        return ""


def extract_text_from_docx(file_path: str) -> str:
    """Extract plain text from a DOCX file."""
    try:
        import docx

        doc = docx.Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)
    except Exception as e:
        logger.error(f"DOCX extraction failed: {e}")
        return ""


def extract_raw_text(file_path: str, filename: str) -> str:
    """Route extraction based on file extension."""
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in (".docx", ".doc"):
        return extract_text_from_docx(file_path)
    else:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception:
            return ""


async def parse_resume_with_claude(raw_text: str) -> dict:
    """
    Send resume text to Claude and parse structured fields.

    Returns a dict with keys:
        name, skills, experience_years, job_titles, industries, education, summary
    """
    if not raw_text.strip():
        return _empty_parse_result()

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    prompt = f"""You are an expert resume parser. Analyze the resume text below and extract key information.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{{
  "name": "<full name or empty string>",
  "skills": ["skill1", "skill2"],
  "experience_years": <number or null>,
  "job_titles": ["Most Recent Title", "Previous Title"],
  "industries": ["Industry1", "Industry2"],
  "education": "<highest degree, school>",
  "summary": "<2-3 sentence professional summary>"
}}

Rules:
- skills: list up to 30 specific technical and soft skills
- experience_years: total years of work experience as a number (estimate if not explicit)
- job_titles: list up to 5 most relevant titles held
- industries: list up to 5 industries
- Return null for experience_years if completely unknown

Resume text:
---
{raw_text[:8000]}
---"""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        response_text = message.content[0].text.strip()
        # Strip potential markdown code fences
        response_text = re.sub(r"^```(?:json)?\s*", "", response_text)
        response_text = re.sub(r"\s*```$", "", response_text)
        parsed = json.loads(response_text)
        return _sanitize_parse_result(parsed)
    except json.JSONDecodeError as e:
        logger.error(f"Claude returned invalid JSON: {e}")
        return _empty_parse_result()
    except anthropic.APIError as e:
        logger.error(f"Claude API error: {e}")
        return _empty_parse_result()


def _empty_parse_result() -> dict:
    return {
        "name": "",
        "skills": [],
        "experience_years": None,
        "job_titles": [],
        "industries": [],
        "education": "",
        "summary": "",
    }


def _sanitize_parse_result(data: dict) -> dict:
    """Ensure all fields have the right types."""
    result = _empty_parse_result()
    result["name"] = str(data.get("name") or "")
    result["skills"] = _ensure_str_list(data.get("skills"))
    result["experience_years"] = _parse_float(data.get("experience_years"))
    result["job_titles"] = _ensure_str_list(data.get("job_titles"))
    result["industries"] = _ensure_str_list(data.get("industries"))
    result["education"] = str(data.get("education") or "")
    result["summary"] = str(data.get("summary") or "")
    return result


def _ensure_str_list(val) -> list:
    if isinstance(val, list):
        return [str(x) for x in val if x]
    return []


def _parse_float(val) -> Optional[float]:
    try:
        if val is None:
            return None
        return float(val)
    except (TypeError, ValueError):
        return None
