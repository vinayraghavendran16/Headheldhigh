from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, EmailStr


# ---- User ----

class UserBase(BaseModel):
    name: str
    email: str
    linkedin_url: Optional[str] = None
    location: Optional[str] = None
    desired_role: Optional[str] = None
    open_to_remote: bool = False
    is_public: bool = True


class UserCreate(UserBase):
    pass


class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Resume ----

class ResumeOut(BaseModel):
    id: int
    user_id: int
    filename: str
    skills: Optional[List[str]] = []
    experience_years: Optional[float] = None
    education: Optional[str] = None
    job_titles: Optional[List[str]] = []
    industries: Optional[List[str]] = []
    summary: Optional[str] = None
    parsed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---- JobPosting ----

class JobPostingOut(BaseModel):
    id: int
    external_id: str
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    job_type: Optional[str] = None
    posted_at: Optional[datetime] = None
    source: Optional[str] = None

    class Config:
        from_attributes = True


# ---- JobMatch ----

class JobMatchOut(BaseModel):
    id: int
    user_id: int
    job_id: int
    relevance_score: float
    match_reasons: Optional[List[str]] = []
    missing_skills: Optional[List[str]] = []
    created_at: datetime
    job: JobPostingOut

    class Config:
        from_attributes = True


# ---- Application ----

class ApplicationCreate(BaseModel):
    user_id: int
    job_id: int
    status: str = "saved"
    notes: Optional[str] = None


class ApplicationOut(BaseModel):
    id: int
    user_id: int
    job_id: int
    status: str
    notes: Optional[str] = None
    applied_at: datetime
    job: JobPostingOut

    class Config:
        from_attributes = True


# ---- Talent Pool ----

class TalentPoolEntry(BaseModel):
    id: int
    name: str
    email: str
    linkedin_url: Optional[str] = None
    location: Optional[str] = None
    desired_role: Optional[str] = None
    open_to_remote: bool
    skills: Optional[List[str]] = []
    experience_years: Optional[float] = None
    job_titles: Optional[List[str]] = []
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Skills Gap ----

class SkillGapItem(BaseModel):
    skill: str
    frequency: int
    priority: str  # high / medium / low
    reason: str


class SkillsGapReport(BaseModel):
    user_id: int
    top_missing_skills: List[SkillGapItem]
    summary: str
    recommended_resources: List[str]


# ---- Digest ----

class DigestEntry(BaseModel):
    id: int
    name: str
    email: str
    location: Optional[str]
    desired_role: Optional[str]
    linkedin_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Pagination ----

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    pages: int
