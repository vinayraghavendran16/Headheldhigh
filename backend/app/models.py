import json
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base


class JSONColumn(Text):
    """Store Python lists/dicts as JSON strings in SQLite."""

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return value


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    linkedin_url = Column(String(512), nullable=True)
    location = Column(String(255), nullable=True)
    desired_role = Column(String(255), nullable=True)
    open_to_remote = Column(Boolean, default=False)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    matches = relationship("JobMatch", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(512), nullable=False)
    raw_text = Column(Text, nullable=True)
    skills = Column(JSONColumn, nullable=True)
    experience_years = Column(Float, nullable=True)
    education = Column(String(512), nullable=True)
    job_titles = Column(JSONColumn, nullable=True)
    industries = Column(JSONColumn, nullable=True)
    summary = Column(Text, nullable=True)
    parsed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="resumes")


class JobPosting(Base):
    __tablename__ = "job_postings"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(512), unique=True, index=True, nullable=False)
    title = Column(String(512), nullable=False)
    company = Column(String(512), nullable=True)
    location = Column(String(512), nullable=True)
    description = Column(Text, nullable=True)
    url = Column(String(1024), nullable=True)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    job_type = Column(String(100), nullable=True)
    posted_at = Column(DateTime, nullable=True)
    source = Column(String(100), nullable=True)
    fetched_at = Column(DateTime, default=datetime.utcnow)

    matches = relationship("JobMatch", back_populates="job", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")


class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("job_postings.id"), nullable=False)
    relevance_score = Column(Float, nullable=False, default=0)
    match_reasons = Column(JSONColumn, nullable=True)
    missing_skills = Column(JSONColumn, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="matches")
    job = relationship("JobPosting", back_populates="matches")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("job_postings.id"), nullable=False)
    status = Column(String(50), default="saved")  # saved/applied/interviewing/offered/rejected
    notes = Column(Text, nullable=True)
    applied_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="applications")
    job = relationship("JobPosting", back_populates="applications")
