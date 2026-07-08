from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Recruiter profile details
    company_name = Column(String, nullable=True)
    company_size = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    company_website = Column(String, nullable=True)
    company_logo = Column(String, nullable=True)
    job_title = Column(String, nullable=True)
    department = Column(String, nullable=True)
    timezone = Column(String, nullable=True)
    hiring_for = Column(Text, nullable=True)
    primary_roles = Column(Text, nullable=True)
    recruiter_onboarding_completed = Column(Boolean, default=False, nullable=False)

    # SaaS User profile details
    profile_photo = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    portfolio_url = Column(String, nullable=True)
    
    college = Column(String, nullable=True)
    degree = Column(String, nullable=True)
    branch = Column(String, nullable=True)
    graduation_year = Column(Integer, nullable=True)
    cgpa = Column(Float, nullable=True)
    
    current_status = Column(String, nullable=True)
    experience = Column(String, nullable=True)
    preferred_role = Column(String, nullable=True)
    preferred_company_type = Column(String, nullable=True)
    preferred_location = Column(String, nullable=True)
    preferred_language = Column(String, nullable=True)
    skills_tags = Column(Text, nullable=True)  # JSON array string
    profile_completed = Column(Boolean, default=False, nullable=False)
    openai_api_key = Column(String, nullable=True)
    gemini_api_key = Column(String, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    raw_text = Column(Text, nullable=True)
    
    # Parsed elements
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    college = Column(String, nullable=True)
    degree = Column(String, nullable=True)
    branch = Column(String, nullable=True)
    graduation_year = Column(Integer, nullable=True)
    
    skills = Column(Text, nullable=True)
    experience = Column(Text, nullable=True)
    education = Column(Text, nullable=True)
    projects = Column(Text, nullable=True)
    internships = Column(Text, nullable=True)
    certificates = Column(Text, nullable=True)
    achievements = Column(Text, nullable=True)
    languages = Column(Text, nullable=True)
    
    github = Column(String, nullable=True)
    linkedin = Column(String, nullable=True)
    portfolio = Column(String, nullable=True)
    
    # AI resume analyses
    resume_score = Column(Integer, nullable=True, default=70)
    ats_score = Column(Integer, nullable=True, default=70)
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    missing_skills = Column(Text, nullable=True)
    ai_improvements = Column(Text, nullable=True)
    role_recommendations = Column(Text, nullable=True)
    learning_roadmap = Column(Text, nullable=True)
    
    file_path = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="resumes")


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # technical, hr, mixed, coding, custom
    difficulty = Column(String, nullable=False)  # easy, medium, hard
    duration_minutes = Column(Integer, nullable=False)
    job_role = Column(String, nullable=True)
    mode = Column(String, default="voice", nullable=True)
    score = Column(Float, nullable=True)
    roadmap = Column(Text, nullable=True)  # JSON string roadmap recommendation
    status = Column(String, default="created")  # created, live, completed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="interviews")
    questions = relationship("Question", back_populates="interview", cascade="all, delete-orphan")
    malpractice_logs = relationship("MalpracticeLog", back_populates="interview", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    type = Column(String, nullable=False)  # theory, coding
    expected_answer = Column(Text, nullable=True)
    user_answer = Column(Text, nullable=True)
    transcript = Column(Text, nullable=True)
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    category = Column(String, nullable=True)  # React, System Design, Communication, Python, etc.
    grammar_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    filler_words_count = Column(Integer, nullable=True)
    speaking_speed = Column(Float, nullable=True)
    response_length = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    interview = relationship("Interview", back_populates="questions")


class MalpracticeLog(Base):
    __tablename__ = "malpractice_logs"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # tab_switch, look_away, no_face, multiple_faces, phone_detected
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    confidence = Column(Float, nullable=True)
    severity = Column(String, nullable=False)  # low, medium, high

    # Relationships
    interview = relationship("Interview", back_populates="malpractice_logs")


class QuestionBank(Base):
    __tablename__ = "question_bank"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)  # React, System Design, HR, Python, etc.
    difficulty = Column(String, nullable=False, default="medium")  # easy, medium, hard
    text = Column(Text, nullable=False)
    expected_answer = Column(Text, nullable=True)
    interview_type = Column(String, nullable=True)  # technical, hr, mixed, coding
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    company = Column(String, nullable=True)
    location = Column(String, nullable=True)
    department = Column(String, nullable=True)
    workplace_type = Column(String, nullable=True)
    experience = Column(String, nullable=True)
    salary = Column(String, nullable=True)
    required_skills = Column(Text, nullable=True)
    preferred_skills = Column(Text, nullable=True)
    openings = Column(Integer, nullable=True, default=1)
    application_deadline = Column(String, nullable=True)
    status = Column(String, default="Draft")
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Campaign(Base):
    __tablename__ = "campaigns"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True)
    interview_type = Column(String, default="technical")
    difficulty = Column(String, default="medium")
    recruiter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    coding_round_required = Column(Boolean, default=False, nullable=False)
    resume_screening_required = Column(Boolean, default=True, nullable=False)
    ai_evaluation_required = Column(Boolean, default=True, nullable=False)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class CampaignCandidate(Base):
    __tablename__ = "campaign_candidates"
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="applied")  # applied, shortlisted, rejected, completed
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SocialAnalysis(Base):
    __tablename__ = "social_analyses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # linkedin, github
    url = Column(String, nullable=False)
    score = Column(Integer, default=70)
    suggestions = Column(Text, nullable=True)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AptitudeTest(Base):
    __tablename__ = "aptitude_tests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=False)
    category = Column(String, nullable=False)  # quantitative, logical, verbal, data_interpretation
    duration_seconds = Column(Integer, default=600)
    total_questions = Column(Integer, default=10)
    correct_answers = Column(Integer, default=7)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class GroupDiscussion(Base):
    __tablename__ = "group_discussions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic = Column(String, nullable=False)
    evaluation_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Certificate(Base):
    __tablename__ = "certificates"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # interview_mock, roadmap_completion, milestone
    title = Column(String, nullable=False)
    subtitle = Column(String, nullable=True)
    verification_code = Column(String, unique=True, nullable=False)
    issued_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
