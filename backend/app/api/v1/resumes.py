import json
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Resume
from app.schemas.schemas import ResumeResponse
from app.services import resume_parser

router = APIRouter()

@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a resume (PDF or DOCX), parse text, and generate full AI Resume Intelligence.
    Saves/overwrites active resume, and backfills missing profile details.
    """
    filename_lower = file.filename.lower()
    if not (filename_lower.endswith(".pdf") or filename_lower.endswith(".docx")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF and DOCX files are supported."
        )

    # 1. Enforce 10MB file size limit
    MAX_SIZE = 10 * 1024 * 1024  # 10MB
    try:
        file_bytes = await file.read()
        if len(file_bytes) > MAX_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds the 10MB limit."
            )
            
        # 2. Extract raw text based on extension
        if filename_lower.endswith(".pdf"):
            raw_text = resume_parser.extract_raw_text_from_pdf(file_bytes)
        else:
            raw_text = resume_parser.extract_raw_text_from_docx(file_bytes)

        # 3. Parse and analyze resume
        structured_data = resume_parser.parse_resume_with_ai(
            raw_text, 
            preferred_role=current_user.preferred_role
        )

        # Helper to convert pydantic items/lists to JSON strings
        def dump_json(val):
            if val is None:
                return None
            if isinstance(val, list):
                # Check if elements are pydantic models
                return json.dumps([
                    item.model_dump() if hasattr(item, "model_dump") else item 
                    for item in val
                ])
            return json.dumps(val)

        # Check if the user already has a resume
        existing_resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
        
        # Save resume details
        resume_attrs = {
            "raw_text": raw_text,
            "name": structured_data.name,
            "email": structured_data.email,
            "phone": structured_data.phone,
            "college": structured_data.college,
            "degree": structured_data.degree,
            "branch": structured_data.branch,
            "graduation_year": structured_data.graduation_year,
            "github": structured_data.github,
            "linkedin": structured_data.linkedin,
            "portfolio": structured_data.portfolio,
            "skills": dump_json(structured_data.skills),
            "experience": dump_json(structured_data.experience),
            "education": dump_json(structured_data.education),
            "projects": dump_json(structured_data.projects),
            "internships": dump_json(structured_data.internships),
            "certificates": dump_json(structured_data.certificates),
            "achievements": dump_json(structured_data.achievements),
            "languages": dump_json(structured_data.languages),
            "resume_score": structured_data.resume_score,
            "ats_score": structured_data.ats_score,
            "strengths": dump_json(structured_data.strengths),
            "weaknesses": dump_json(structured_data.weaknesses),
            "missing_skills": dump_json(structured_data.missing_skills),
            "ai_improvements": dump_json(structured_data.ai_improvements),
            "role_recommendations": dump_json(structured_data.role_recommendations),
            "learning_roadmap": dump_json(structured_data.learning_roadmap),
            "file_path": file.filename
        }

        if existing_resume:
            for attr, val in resume_attrs.items():
                setattr(existing_resume, attr, val)
            active_resume = existing_resume
        else:
            active_resume = Resume(user_id=current_user.id, **resume_attrs)
            db.add(active_resume)

        # 4. Backfill user profile if empty
        profile_updated = False
        if not current_user.full_name and structured_data.name:
            current_user.full_name = structured_data.name
            profile_updated = True
        if not current_user.phone_number and structured_data.phone:
            current_user.phone_number = structured_data.phone
            profile_updated = True
        if not current_user.college and structured_data.college:
            current_user.college = structured_data.college
            profile_updated = True
        if not current_user.degree and structured_data.degree:
            current_user.degree = structured_data.degree
            profile_updated = True
        if not current_user.branch and structured_data.branch:
            current_user.branch = structured_data.branch
            profile_updated = True
        if not current_user.graduation_year and structured_data.graduation_year:
            current_user.graduation_year = structured_data.graduation_year
            profile_updated = True
        if not current_user.github_url and structured_data.github:
            current_user.github_url = structured_data.github
            profile_updated = True
        if not current_user.linkedin_url and structured_data.linkedin:
            current_user.linkedin_url = structured_data.linkedin
            profile_updated = True
        if not current_user.portfolio_url and structured_data.portfolio:
            current_user.portfolio_url = structured_data.portfolio
            profile_updated = True
        if not current_user.skills_tags and structured_data.skills:
            current_user.skills_tags = json.dumps(structured_data.skills)
            profile_updated = True

        if profile_updated:
            # Recheck profile completion status
            core_fields_filled = all([
                current_user.full_name,
                current_user.phone_number,
                current_user.college,
                current_user.degree,
                current_user.current_status,
                current_user.preferred_role
            ])
            current_user.profile_completed = core_fields_filled

        db.commit()
        db.refresh(active_resume)
        if profile_updated:
            db.refresh(current_user)

        return active_resume
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and parse resume: {str(e)}"
        )


@router.get("/me", response_model=Optional[ResumeResponse])
def get_my_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve the current authenticated user's active resume profile.
    """
    active_resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    return active_resume
