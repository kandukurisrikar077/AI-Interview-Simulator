from pydantic import BaseModel, EmailStr, Field, field_validator
import json
from datetime import datetime
from typing import *
# --- AUTH SCHEMAS ---

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = "user"
    
    # Recruiter options
    company_name: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    company_website: Optional[str] = None
    company_logo: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    timezone: Optional[str] = None
    hiring_for: Optional[Any] = None
    primary_roles: Optional[Any] = None
    recruiter_onboarding_completed: Optional[bool] = False

    # SaaS User profile details
    profile_photo: Optional[str] = None
    phone_number: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    
    college: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = None
    
    current_status: Optional[str] = None
    experience: Optional[str] = None
    preferred_role: Optional[str] = None
    preferred_company_type: Optional[str] = None
    preferred_location: Optional[str] = None
    preferred_language: Optional[str] = None
    skills_tags: Optional[Any] = None
    profile_completed: Optional[bool] = False
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    profile_photo: Optional[str] = None
    phone_number: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    college: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = None
    current_status: Optional[str] = None
    experience: Optional[str] = None
    preferred_role: Optional[str] = None
    preferred_company_type: Optional[str] = None
    preferred_location: Optional[str] = None
    preferred_language: Optional[str] = None
    skills_tags: Optional[Any] = None
    profile_completed: Optional[bool] = None
    openai_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None

class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @field_validator('skills_tags', mode='before')
    @classmethod
    def deserialize_skills(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return v
        return v

    @field_validator('hiring_for', mode='before')
    @classmethod
    def deserialize_hiring_for(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return v
        return v

    @field_validator('primary_roles', mode='before')
    @classmethod
    def deserialize_primary_roles(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return v
        return v

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None


# --- RESUME SCHEMAS ---

class ResumeResponse(BaseModel):
    id: int
    user_id: int
    raw_text: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    college: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    
    skills: Optional[Any] = None
    experience: Optional[Any] = None
    education: Optional[Any] = None
    projects: Optional[Any] = None
    internships: Optional[Any] = None
    certificates: Optional[Any] = None
    achievements: Optional[Any] = None
    languages: Optional[Any] = None
    
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    
    resume_score: Optional[int] = None
    atsScore: Optional[int] = None
    ats_score: Optional[int] = None
    strengths: Optional[Any] = None
    weaknesses: Optional[Any] = None
    missing_skills: Optional[Any] = None
    ai_improvements: Optional[Any] = None
    role_recommendations: Optional[Any] = None
    learning_roadmap: Optional[Any] = None
    
    file_path: Optional[str] = None
    uploaded_at: datetime

    @field_validator(
        'skills', 'experience', 'education', 'projects', 'internships', 
        'certificates', 'achievements', 'languages', 'strengths', 'weaknesses', 
        'missing_skills', 'ai_improvements', 'role_recommendations', 'learning_roadmap',
        mode='before'
    )
    @classmethod
    def deserialize_json_fields(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return v
        return v

    class Config:
        from_attributes = True
        populate_by_name = True


# --- MALPRACTICE LOG SCHEMAS ---

class MalpracticeLogCreate(BaseModel):
    type: str  # tab_switch, look_away, no_face, multiple_faces, phone_detected
    confidence: Optional[float] = 1.0
    severity: str  # low, medium, high

class MalpracticeLogResponse(BaseModel):
    id: int
    interview_id: int
    type: str
    timestamp: datetime
    confidence: Optional[float]
    severity: str

    class Config:
        from_attributes = True


# --- QUESTION SCHEMAS ---

class QuestionResponse(BaseModel):
    id: int
    interview_id: int
    text: str
    type: str  # theory, coding
    expected_answer: Optional[str] = None
    user_answer: Optional[str] = None
    transcript: Optional[str] = None
    score: Optional[float] = None
    feedback: Optional[str] = None
    category: Optional[str] = None
    grammar_score: Optional[float] = None
    confidence_score: Optional[float] = None
    filler_words_count: Optional[int] = None
    speaking_speed: Optional[float] = None
    response_length: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class QuestionAnswer(BaseModel):
    user_answer: str
    transcript: Optional[str] = None
    speaking_duration_seconds: Optional[float] = None



# --- INTERVIEW SCHEMAS ---

class InterviewCreate(BaseModel):
    type: str = Field(..., description="Interview type: technical, hr, mixed, coding, custom")
    difficulty: str = Field(..., description="Interview difficulty: easy, medium, hard")
    duration_minutes: int = Field(20, description="Interview duration in minutes: 10, 20, 30, custom")
    job_role: Optional[str] = Field(None, description="Job role being targeted")
    mode: Optional[str] = Field("voice", description="Interview mode: voice, video, coding")

class InterviewResponse(BaseModel):
    id: int
    user_id: int
    type: str
    difficulty: str
    duration_minutes: int
    job_role: Optional[str] = None
    mode: Optional[str] = "voice"
    score: Optional[float] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class InterviewDetailResponse(InterviewResponse):
    questions: List[QuestionResponse] = []
    malpractice_logs: List[MalpracticeLogResponse] = []
    roadmap: Optional[Any] = None

    class Config:
        from_attributes = True


# --- QUESTION BANK SCHEMAS ---

class QuestionBankCreate(BaseModel):
    category: str
    difficulty: str = "medium"
    text: str
    expected_answer: Optional[str] = None
    interview_type: Optional[str] = None

class QuestionBankResponse(BaseModel):
    id: int
    category: str
    difficulty: str
    text: str
    expected_answer: Optional[str] = None
    interview_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- ADMIN SCHEMAS ---

class AdminStats(BaseModel):
    total_users: int
    active_users: int
    total_interviews: int
    completed_interviews: int
    average_score: Optional[float] = None
    total_resumes: int


# --- ANALYTICS SCHEMAS ---

class SkillScore(BaseModel):
    skill: str
    score: float

class AnalyticsResponse(BaseModel):
    total_interviews: int
    average_score: Optional[float] = None
    best_score: Optional[float] = None
    skill_scores: List[SkillScore] = []
    score_trend: List[Optional[float]] = []
    weak_areas: List[str] = []


# --- ADDITIONAL AUTH SCHEMAS ---

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=8)

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)


class SendOTPRequest(BaseModel):
    email: str


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str = Field(..., min_length=6, max_length=6)


