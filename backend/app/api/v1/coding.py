import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Interview, Resume, Question
from app.schemas.schemas import QuestionResponse
from app.services import gemini
from app.services.code_sandbox import CodeSandboxService, TestCaseResult

router = APIRouter()

class CodeRunRequest(BaseModel):
    code: str
    language: str
    test_cases: str  # JSON string of test cases

class CodeRunResponse(BaseModel):
    success: bool
    output: str
    results: List[TestCaseResult]


@router.post("/{interview_id}/challenge", response_model=QuestionResponse)
def get_coding_challenge(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a tailored programming challenge using Gemini and store it in the database.
    """
    # 1. Fetch interview
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    # Check if a coding question already exists to prevent duplicate generation
    existing_coding_q = db.query(Question).filter(
        Question.interview_id == interview_id,
        Question.type == "coding"
    ).first()
    if existing_coding_q:
        return existing_coding_q

    # 2. Fetch resume context
    resume_context = None
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    if resume:
        resume_context = f"Skills: {resume.skills}\nExperience: {resume.experience}\nProjects: {resume.projects}"

    # 3. Generate challenge using Gemini
    challenge = gemini.generate_coding_challenge(
        difficulty=interview.difficulty,
        resume_context=resume_context
    )
    
    # Store title and details inside expected_answer as JSON
    coding_meta = {
        "title": challenge.title,
        "starter_code": challenge.starter_code,
        "test_cases": challenge.test_cases,
        "language": challenge.language
    }

    # 4. Save question to database
    new_q = Question(
        interview_id=interview_id,
        text=challenge.description,
        type="coding",
        expected_answer=json.dumps(coding_meta),
        category="Coding Practice"
    )
    
    db.add(new_q)
    db.commit()
    db.refresh(new_q)
    return new_q


@router.post("/{interview_id}/run", response_model=CodeRunResponse)
def run_code_sandbox(
    interview_id: int,
    run_req: CodeRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Secure sandboxed code execution endpoint.
    Guarded by JWT authentication and ownership validation.
    Executes code in an isolated ephemeral subprocess with zero environment access,
    strict timeout, and static AST security analysis.
    The primary backend process NEVER executes candidate code directly.
    """
    # 1. Ensure the target interview exists and belongs to the requesting user (or admin)
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found")

    if interview.user_id != current_user.id and current_user.role not in ["admin", "SUPER_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot execute code for another candidate's interview session."
        )

    # 2. Execute via isolated sandbox service
    result = CodeSandboxService.execute(
        code=run_req.code,
        language=run_req.language,
        test_cases_json=run_req.test_cases
    )

    return CodeRunResponse(
        success=result.success,
        output=result.output,
        results=result.results
    )
