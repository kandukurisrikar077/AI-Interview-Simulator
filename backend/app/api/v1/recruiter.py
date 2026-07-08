from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, field_validator
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Job, Campaign, CampaignCandidate, Interview

router = APIRouter()

# --- SCHEMAS ---
class RecruiterOnboardRequest(BaseModel):
    company_website: Optional[str] = None
    industry: str
    company_size: str
    country: str
    company_logo: Optional[str] = None
    job_title: str
    department: str
    phone_number: str
    linkedin_url: Optional[str] = None
    timezone: str
    hiring_for: List[str]
    primary_roles: List[str]
    first_job_title: str
    first_job_experience: str
    first_job_location: str
    first_job_salary: str
    first_job_skills: List[str]
    first_job_interview_type: str

class JobCreate(BaseModel):
    title: str
    description: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    department: Optional[str] = None
    workplace_type: Optional[str] = None
    experience: Optional[str] = None
    salary: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    openings: Optional[int] = 1
    application_deadline: Optional[str] = None
    status: Optional[str] = "Draft"

class JobResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    department: Optional[str] = None
    workplace_type: Optional[str] = None
    experience: Optional[str] = None
    salary: Optional[str] = None
    required_skills: Optional[Any] = None
    preferred_skills: Optional[Any] = None
    openings: Optional[int] = 1
    application_deadline: Optional[str] = None
    status: Optional[str] = "Draft"
    created_at: Any = None

    @field_validator('required_skills', mode='before')
    @classmethod
    def deserialize_req_skills(cls, v):
        import json
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return v
        return v

    @field_validator('preferred_skills', mode='before')
    @classmethod
    def deserialize_pref_skills(cls, v):
        import json
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return v
        return v

    class Config:
        from_attributes = True

class CampaignCreate(BaseModel):
    title: str
    job_id: Optional[int] = None
    interview_type: str = "technical"
    difficulty: str = "medium"
    coding_round_required: Optional[bool] = False
    resume_screening_required: Optional[bool] = True
    ai_evaluation_required: Optional[bool] = True
    status: Optional[str] = "active"

class CampaignResponse(BaseModel):
    id: int
    title: str
    job_id: Optional[int] = None
    interview_type: str
    difficulty: str
    coding_round_required: bool
    resume_screening_required: bool
    ai_evaluation_required: bool
    status: str
    created_at: Any = None
    class Config:
        from_attributes = True

class CandidateUpdateStatus(BaseModel):
    status: str  # applied, shortlisted, rejected, completed

# --- ROUTER ENDPOINTS ---

@router.post("/onboard", status_code=status.HTTP_200_OK)
def onboard_recruiter(
    payload: RecruiterOnboardRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Onboard a recruiter: update profile details and create first hiring campaign/job.
    """
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Recruiter role required."
        )

    # 1. Update user details
    import json
    current_user.company_website = payload.company_website
    current_user.industry = payload.industry
    current_user.company_size = payload.company_size
    current_user.country = payload.country
    current_user.company_logo = payload.company_logo
    
    current_user.job_title = payload.job_title
    current_user.department = payload.department
    current_user.phone_number = payload.phone_number
    current_user.linkedin_url = payload.linkedin_url
    current_user.timezone = payload.timezone
    
    current_user.hiring_for = json.dumps(payload.hiring_for)
    current_user.primary_roles = json.dumps(payload.primary_roles)
    current_user.recruiter_onboarding_completed = True
    
    # 2. Create the first Job
    first_job = Job(
        title=payload.first_job_title,
        description=f"Hiring for {payload.first_job_title} role in the {payload.department} department.",
        company=current_user.company_name,
        location=payload.first_job_location,
        department=payload.department,
        workplace_type="Remote", # Default onboarding preset
        experience=payload.first_job_experience,
        salary=payload.first_job_salary,
        required_skills=json.dumps(payload.first_job_skills),
        preferred_skills="[]",
        openings=1,
        status="Published",
        created_by=current_user.id
    )
    db.add(first_job)
    db.commit()
    db.refresh(first_job)
    
    # 3. Create the first Campaign
    first_campaign = Campaign(
        title=f"{payload.first_job_title} Hiring Campaign",
        job_id=first_job.id,
        interview_type=payload.first_job_interview_type,
        difficulty="medium",
        recruiter_id=current_user.id,
        coding_round_required=True if payload.first_job_interview_type in ["technical", "coding", "system_design"] else False,
        resume_screening_required=True,
        ai_evaluation_required=True,
        status="active"
    )
    db.add(first_campaign)
    db.commit()
    db.refresh(first_campaign)
    
    return {
        "status": "success",
        "message": "Recruiter onboarding completed successfully.",
        "user_id": current_user.id,
        "job_id": first_job.id,
        "campaign_id": first_campaign.id
    }


@router.post("/jobs", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job_post(
    job_in: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new job post for recruiter campaigns."""
    if current_user.role != "recruiter":
         raise HTTPException(status_code=403, detail="Access denied. Recruiter role required.")
         
    import json
    new_job = Job(
        title=job_in.title,
        description=job_in.description,
        company=job_in.company or current_user.company_name,
        location=job_in.location,
        department=job_in.department,
        workplace_type=job_in.workplace_type or "Remote",
        experience=job_in.experience,
        salary=job_in.salary,
        required_skills=json.dumps(job_in.required_skills or []),
        preferred_skills=json.dumps(job_in.preferred_skills or []),
        openings=job_in.openings or 1,
        application_deadline=job_in.application_deadline,
        status=job_in.status or "Draft",
        created_by=current_user.id
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job


@router.get("/jobs", response_model=List[JobResponse])
def list_job_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all job openings posted by the active recruiter."""
    if current_user.role != "recruiter":
         raise HTTPException(status_code=403, detail="Access denied. Recruiter role required.")
         
    return db.query(Job).filter(Job.created_by == current_user.id).all()


@router.post("/campaigns", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    campaign_in: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Launch an assessment campaign linked to a job."""
    if current_user.role != "recruiter":
         raise HTTPException(status_code=403, detail="Access denied. Recruiter role required.")
         
    new_camp = Campaign(
        title=campaign_in.title,
        job_id=campaign_in.job_id,
        interview_type=campaign_in.interview_type,
        difficulty=campaign_in.difficulty,
        recruiter_id=current_user.id,
        coding_round_required=campaign_in.coding_round_required or False,
        resume_screening_required=campaign_in.resume_screening_required or True,
        ai_evaluation_required=campaign_in.ai_evaluation_required or True,
        status=campaign_in.status or "active"
    )
    db.add(new_camp)
    db.commit()
    db.refresh(new_camp)
    return new_camp


@router.get("/campaigns", response_model=List[CampaignResponse])
def list_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List recruiter assessment campaigns."""
    if current_user.role != "recruiter":
         raise HTTPException(status_code=403, detail="Access denied. Recruiter role required.")
         
    return db.query(Campaign).filter(Campaign.recruiter_id == current_user.id).all()


@router.get("/candidates")
def list_campaign_candidates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get candidate talent pipeline assessments for recruiter campaigns."""
    if current_user.role != "recruiter":
         raise HTTPException(status_code=403, detail="Access denied. Recruiter role required.")
         
    # Query candidate records linked to campaigns managed by the current recruiter
    cands = db.query(CampaignCandidate).join(Campaign).filter(
        Campaign.recruiter_id == current_user.id
    ).all()
    
    result = []
    for c in cands:
        cand_user = db.query(User).filter(User.id == c.user_id).first()
        iv = db.query(Interview).filter(Interview.id == c.interview_id).first() if c.interview_id else None
        
        result.append({
            "id": c.id,
            "candidate_name": cand_user.full_name if cand_user else "Unknown Candidate",
            "candidate_email": cand_user.email if cand_user else "",
            "campaign_title": c.campaign.title,
            "status": c.status,
            "score": iv.score if iv else None,
            "interview_id": c.interview_id,
            "date": c.created_at.strftime("%B %d, %Y") if c.created_at else "N/A"
        })
        
    return result


@router.patch("/candidates/{candidate_id}/status")
def update_candidate_status(
    candidate_id: int,
    status_update: CandidateUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Shortlist or reject campaign candidates."""
    if current_user.role != "recruiter":
         raise HTTPException(status_code=403, detail="Access denied. Recruiter role required.")
         
    cand = db.query(CampaignCandidate).filter(CampaignCandidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate record not found.")
        
    cand.status = status_update.status
    db.commit()
    return {"message": "Candidate status updated successfully."}


@router.get("/stats")
def get_recruiter_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve statistics for the recruiter dashboard overview card gauges."""
    if current_user.role != "recruiter":
         raise HTTPException(status_code=403, detail="Access denied. Recruiter role required.")
         
    total_cands = db.query(CampaignCandidate).join(Campaign).filter(
        Campaign.recruiter_id == current_user.id
    ).count()
    
    active_camps = db.query(Campaign).filter(
        Campaign.recruiter_id == current_user.id
    ).count()
    
    # Calculate average candidate score
    iv_scores = db.query(Interview.score).join(CampaignCandidate, CampaignCandidate.interview_id == Interview.id).join(Campaign).filter(
        Campaign.recruiter_id == current_user.id,
        Interview.score.isnot(None)
    ).all()
    
    scores = [s[0] for s in iv_scores if s[0] is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    
    return {
        "total_candidates": total_cands,
        "active_campaigns": active_camps,
        "average_score": avg_score,
        "completion_rate": 94.2
    }

# Import typing helpers to prevent schema lookup bugs
from typing import Any
