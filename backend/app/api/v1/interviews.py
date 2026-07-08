from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import json
from app.services import report_generator

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Interview, Resume, Question
from app.schemas.schemas import (
    InterviewCreate, InterviewResponse, InterviewDetailResponse, 
    QuestionResponse, QuestionAnswer, MalpracticeLogCreate, MalpracticeLogResponse
)
from app.services import gemini

router = APIRouter()

# Core Interview CRUD

@router.post("/", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def create_interview(
    interview_in: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Initialize a new mock interview session. Checks if a resume is uploaded.
    """
    new_interview = Interview(
        user_id=current_user.id,
        type=interview_in.type,
        difficulty=interview_in.difficulty,
        duration_minutes=interview_in.duration_minutes,
        job_role=interview_in.job_role,
        mode=interview_in.mode or "voice",
        status="created"
    )
    
    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)
    return new_interview


@router.get("/", response_model=List[InterviewResponse])
def list_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all previous interview practice sessions for the logged-in user.
    """
    interviews = db.query(Interview).filter(
        Interview.user_id == current_user.id
    ).order_by(Interview.created_at.desc()).all()
    return interviews


@router.get("/{interview_id}", response_model=InterviewDetailResponse)
def get_interview_details(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve full details of a specific interview (questions, scores, roadmaps, warnings).
    """
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found."
        )

    # Deserialize roadmap if it is stored as JSON string
    roadmap_obj = None
    if interview.roadmap:
        try:
            roadmap_obj = json.loads(interview.roadmap)
        except Exception:
            roadmap_obj = interview.roadmap
            
    response_detail = InterviewDetailResponse(
        id=interview.id,
        user_id=interview.user_id,
        type=interview.type,
        difficulty=interview.difficulty,
        duration_minutes=interview.duration_minutes,
        score=interview.score,
        status=interview.status,
        created_at=interview.created_at,
        questions=interview.questions,
        malpractice_logs=interview.malpractice_logs,
        roadmap=roadmap_obj
    )
    return response_detail


# Adaptive Simulation Room Endpoints

@router.post("/{interview_id}/start", response_model=QuestionResponse)
def start_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark interview status as live and generate the initial question.
    """
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found.")
        
    if interview.status != "created":
        # If already started, return the first question
        first_q = db.query(Question).filter(Question.interview_id == interview.id).first()
        if first_q:
            return first_q
            
    # Mark as live
    interview.status = "live"
    
    # Extract resume details if any
    resume_context = None
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    if resume:
        resume_context = f"Skills: {resume.skills}\nExperience: {resume.experience}\nProjects: {resume.projects}"

    # Build job role context
    job_role = interview.job_role or getattr(current_user, 'preferred_role', None)
    if job_role:
        role_context = f"Target Job Role: {job_role}"
        resume_context = f"{role_context}\n{resume_context}" if resume_context else role_context

    # Generate question with Gemini
    gemini_question = gemini.generate_first_question(
        interview_type=interview.type,
        difficulty=interview.difficulty,
        resume_context=resume_context,
        db_user=current_user
    )
    
    # Save question to DB
    new_q = Question(
        interview_id=interview.id,
        text=gemini_question.text,
        type="theory",
        expected_answer=gemini_question.expected_answer,
        category=gemini_question.category
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)
    return new_q


def count_filler_words(text: str) -> int:
    if not text:
        return 0
    text_lower = text.lower()
    fillers = ["um", "uh", "like", "you know", "actually", "basically"]
    count = 0
    for f in fillers:
        count += text_lower.count(f)
    return count

@router.post("/{interview_id}/questions/{question_id}/submit", response_model=QuestionResponse)
def submit_question_answer(
    interview_id: int,
    question_id: int,
    answer_in: QuestionAnswer,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit answer for a question and let Gemini grade it.
    """
    # Verify interview
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    # Verify question
    question = db.query(Question).filter(
        Question.id == question_id,
        Question.interview_id == interview_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    # Use transcript fallback if answer_in.user_answer is empty
    user_answer = answer_in.user_answer or answer_in.transcript or ""
    
    # Evaluate with Gemini
    evaluation = gemini.evaluate_candidate_answer(
        question_text=question.text,
        user_answer=user_answer,
        expected_answer=question.expected_answer,
        db_user=current_user
    )
    
    # Calculate speech/text metrics
    response_len = len(user_answer)
    filler_cnt = count_filler_words(user_answer)
    wpm = None
    if answer_in.speaking_duration_seconds and answer_in.speaking_duration_seconds > 0:
        words = len(user_answer.split())
        wpm = words / (answer_in.speaking_duration_seconds / 60.0)

    # Update record
    question.user_answer = user_answer
    question.transcript = answer_in.transcript
    question.score = evaluation.score
    question.feedback = evaluation.feedback
    question.grammar_score = evaluation.grammar_score
    question.confidence_score = evaluation.confidence_score
    question.filler_words_count = filler_cnt
    question.speaking_speed = wpm
    question.response_length = response_len
    
    db.commit()
    db.refresh(question)
    return question


@router.post("/{interview_id}/next_question")
def get_next_question(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate next adaptive question based on response logs or complete the interview.
    """
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found.")
        
    # Fetch questions already asked
    past_questions = db.query(Question).filter(
        Question.interview_id == interview_id
    ).order_by(Question.created_at.asc()).all()
    
    # Limit to 4 conversational questions before switching rounds or completing
    MAX_CONVERSATIONAL_QUESTIONS = 4
    
    if len(past_questions) >= MAX_CONVERSATIONAL_QUESTIONS:
        # Check if they are all answered
        unanswered = [q for q in past_questions if q.user_answer is None]
        if unanswered:
            raise HTTPException(status_code=400, detail="Please submit answers to all current questions first.")
            
        # Complete conversational round, redirect to coding round if it is coding/technical type, or mark ready to evaluate
        next_step = "finish"
        if interview.type.lower() in ["technical", "coding", "mixed"]:
            next_step = "coding"
            
        return {
            "status": "round_complete",
            "next_step": next_step,
            "message": f"Conversational round completed. Moving to {next_step} round."
        }
        
    # Verify previous is answered
    if past_questions and past_questions[-1].user_answer is None:
        raise HTTPException(
            status_code=400, 
            detail="Please answer the current question before moving to the next."
        )
        
    # Extract resume context
    resume_context = None
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    if resume:
        resume_context = f"Skills: {resume.skills}\nExperience: {resume.experience}\nProjects: {resume.projects}"

    # Prepend job role context
    job_role = interview.job_role or getattr(current_user, 'preferred_role', None)
    if job_role:
        role_context = f"Target Job Role: {job_role}"
        resume_context = f"{role_context}\n{resume_context}" if resume_context else role_context

    # Format history logs
    history_logs = []
    for q in past_questions:
        history_logs.append({
            "question": q.text,
            "answer": q.user_answer,
            "score": q.score,
            "feedback": q.feedback
        })
        
    # Generate question with Gemini
    gemini_question = gemini.generate_adaptive_question(
        interview_type=interview.type,
        difficulty=interview.difficulty,
        history_logs=history_logs,
        resume_context=resume_context,
        db_user=current_user
    )
    
    new_q = Question(
        interview_id=interview.id,
        text=gemini_question.text,
        type="theory",
        expected_answer=gemini_question.expected_answer,
        category=gemini_question.category
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)
    return new_q


@router.post("/{interview_id}/finish", response_model=InterviewDetailResponse)
def finish_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Conclude interview session, calculate overall scores and generate improvement roadmaps.
    """
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    if interview.status == "completed" and interview.score is not None:
        return get_interview_details(interview_id, db, current_user)
        
    # Fetch questions logs
    questions = db.query(Question).filter(Question.interview_id == interview_id).all()
    history_logs = []
    for q in questions:
        history_logs.append({
            "question": q.text,
            "answer": q.user_answer or "",
            "score": q.score,
            "feedback": q.feedback or ""
        })
        
    # Extract resume context
    resume_context = None
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    if resume:
        resume_context = f"Skills: {resume.skills}\nExperience: {resume.experience}\nProjects: {resume.projects}"
        
    # Call Gemini aggregator
    evaluation = gemini.evaluate_full_interview(
        interview_type=interview.type,
        history_logs=history_logs,
        resume_context=resume_context,
        db_user=current_user
    )
    
    # Save back to interview model
    interview.status = "completed"
    interview.score = evaluation.overall_score
    interview.roadmap = json.dumps({
        "suggestions": evaluation.suggestions,
        "roadmap_7_day": evaluation.roadmap_7_day,
        "roadmap_30_day": evaluation.roadmap_30_day,
        "skill_gaps": evaluation.skill_gaps,
        "recommended_technologies": evaluation.recommended_technologies,
        "learning_resources": evaluation.learning_resources,
        "next_interview_recommendation": evaluation.next_interview_recommendation,
        "technical_score": evaluation.technical_score,
        "communication_score": evaluation.communication_score,
        "problem_solving_score": evaluation.problem_solving_score,
        "confidence_score": evaluation.confidence_score,
        "grammar_score": evaluation.grammar_score,
        "code_quality_score": evaluation.code_quality_score,
        "strengths": evaluation.strengths,
        "weaknesses": evaluation.weaknesses,
        "skill_scores": [item.model_dump() for item in evaluation.skill_scores]
    })
    
    db.commit()
    db.refresh(interview)
    
    return get_interview_details(interview_id, db, current_user)


@router.get("/{interview_id}/pdf")
def download_interview_pdf(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate and stream report PDF for the given interview session.
    """
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    is_authorized = (interview.user_id == current_user.id)
    
    if not is_authorized and current_user.role == "recruiter":
        from app.models.models import CampaignCandidate, Campaign
        assoc = db.query(CampaignCandidate).join(Campaign).filter(
            CampaignCandidate.interview_id == interview_id,
            Campaign.recruiter_id == current_user.id
        ).first()
        if assoc:
            is_authorized = True
            
    if not is_authorized:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to download this interview report."
        )
        
    if interview.status != "completed":
        raise HTTPException(status_code=400, detail="Cannot generate report for an incomplete interview.")

    # Get details dictionary (matching structure expected by report_generator)
    details = {
        "id": interview.id,
        "type": interview.type,
        "difficulty": interview.difficulty,
        "duration_minutes": interview.duration_minutes,
        "score": interview.score,
        "status": interview.status,
        "roadmap": interview.roadmap,
        "questions": [
            {
                "text": q.text,
                "type": q.type,
                "user_answer": q.user_answer,
                "transcript": q.transcript,
                "score": q.score,
                "feedback": q.feedback,
                "grammar_score": q.grammar_score,
                "confidence_score": q.confidence_score,
                "filler_words_count": q.filler_words_count,
                "speaking_speed": q.speaking_speed
            }
            for q in interview.questions
        ],
        "malpractice_logs": [{"timestamp": str(l.timestamp), "type": l.type, "severity": l.severity, "confidence": l.confidence} for l in interview.malpractice_logs]
    }
    
    pdf_buffer = report_generator.generate_interview_report_pdf(
        details, 
        current_user.full_name or current_user.email
    )
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=intervue_report_{interview_id}.pdf"}
    )


@router.post("/{interview_id}/malpractice", response_model=MalpracticeLogResponse)
def log_malpractice(
    interview_id: int,
    log_in: MalpracticeLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Log an integrity malpractice warning (tab switch, face looking away, no face, etc.) during an interview.
    """
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    new_log = MalpracticeLog(
        interview_id=interview_id,
        type=log_in.type,
        confidence=log_in.confidence,
        severity=log_in.severity
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log
