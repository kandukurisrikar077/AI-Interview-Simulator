from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_admin_user
from app.models.models import User, QuestionBank
from app.schemas.schemas import QuestionBankCreate, QuestionBankResponse

router = APIRouter()


@router.get("/", response_model=List[QuestionBankResponse])
def list_questions(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    interview_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
    """
    List questions from the question bank.
    Supports filtering by category, difficulty, and interview_type.
    Available to all authenticated users.
    """
    query = db.query(QuestionBank)
    if category:
        query = query.filter(QuestionBank.category.ilike(f"%{category}%"))
    if difficulty:
        query = query.filter(QuestionBank.difficulty == difficulty)
    if interview_type:
        query = query.filter(QuestionBank.interview_type == interview_type)
    return query.order_by(QuestionBank.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=QuestionBankResponse, status_code=status.HTTP_201_CREATED)
def create_question(
    question_in: QuestionBankCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a new question to the question bank. Available to Admins and Recruiters.
    """
    if current_user.role not in ["admin", "SUPER_ADMIN", "recruiter"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges. Admin or Recruiter access required."
        )
    new_q = QuestionBank(
        category=question_in.category,
        difficulty=question_in.difficulty,
        text=question_in.text,
        expected_answer=question_in.expected_answer,
        interview_type=question_in.interview_type,
        created_by=current_user.id
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)
    return new_q


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user)
):
    """
    Admin: Permanently delete a question from the question bank.
    """
    q = db.query(QuestionBank).filter(QuestionBank.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")
    db.delete(q)
    db.commit()
    return None


@router.get("/{question_id}", response_model=QuestionBankResponse)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user)
):
    """
    Retrieve a single question by ID.
    """
    q = db.query(QuestionBank).filter(QuestionBank.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found.")
    return q
