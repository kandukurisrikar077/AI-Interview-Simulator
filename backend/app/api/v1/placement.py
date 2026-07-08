import io
import json
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Resume, SocialAnalysis, AptitudeTest, GroupDiscussion, Certificate
from app.services import placement_ai

router = APIRouter()

# --- SCHEMAS ---

class SocialAnalyzeRequest(BaseModel):
    url: str

class CoverLetterRequest(BaseModel):
    company: str
    role: str
    job_description: Optional[str] = None

class ResumeBuilderSaveRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    college: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    skills: List[str] = []
    experience: List[Dict[str, str]] = []
    projects: List[Dict[str, str]] = []
    achievements: List[str] = []

class AptitudeSubmitRequest(BaseModel):
    score: float
    category: str
    duration_seconds: int
    total_questions: int
    correct_answers: int

class ChatHistoryItem(BaseModel):
    speaker: str
    text: str

class DiscussionChatRequest(BaseModel):
    topic: str
    history: List[ChatHistoryItem]

class DiscussionEvaluateRequest(BaseModel):
    topic: str
    history: List[ChatHistoryItem]

class CertificateIssueRequest(BaseModel):
    type: str  # mock_interview, roadmap_completion, milestone
    title: str
    subtitle: Optional[str] = None

class ResumeImproveRequest(BaseModel):
    field_name: str
    field_value: str
    target_role: Optional[str] = None

# --- ANALYZERS ---

@router.post("/resume-builder/improve")
def improve_resume_field_content(
    req: ResumeImproveRequest,
    current_user: User = Depends(get_current_user)
):
    """Use AI to rewrite a resume field or summary."""
    return placement_ai.improve_resume_section(
        field_name=req.field_name,
        field_value=req.field_value,
        target_role=req.target_role,
        db_user=current_user
    )

@router.post("/linkedin")
def analyze_linkedin_profile_url(
    req: SocialAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze LinkedIn URL profiles."""
    analysis = placement_ai.analyze_linkedin_profile(req.url, current_user)
    
    # Save log
    db_log = SocialAnalysis(
        user_id=current_user.id,
        type="linkedin",
        url=req.url,
        score=analysis.score,
        suggestions=json.dumps(analysis.suggestions),
        details_json=json.dumps({
            "headline_suggestion": analysis.headline_suggestion,
            "summary_suggestion": analysis.summary_suggestion,
            "missing_sections": analysis.missing_sections
        })
    )
    db.add(db_log)
    db.commit()
    return analysis


@router.post("/github")
def analyze_github_profile_url(
    req: SocialAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze GitHub developer profiles handles."""
    analysis = placement_ai.analyze_github_portfolio(req.url, current_user)
    
    # Save log
    db_log = SocialAnalysis(
        user_id=current_user.id,
        type="github",
        url=req.url,
        score=analysis.score,
        suggestions=json.dumps(analysis.portfolio_suggestions),
        details_json=json.dumps({
            "repos_analyzed": analysis.repos_analyzed,
            "readme_quality": analysis.readme_quality,
            "commit_activity_feedback": analysis.commit_activity_feedback
        })
    )
    db.add(db_log)
    db.commit()
    return analysis


# --- COVER LETTER ---

@router.post("/cover-letter")
def generate_cover_letter(
    req: CoverLetterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate professional personalized cover letter."""
    # Read resume content
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    resume_context = ""
    if resume:
        resume_context = f"Skills: {resume.skills}\nExperience: {resume.experience}\nProjects: {resume.projects}"
    else:
        resume_context = f"Preferred Role: {current_user.preferred_role}\nCollege: {current_user.college}\nDegree: {current_user.degree}"
        
    analysis = placement_ai.generate_cover_letter_ai(
        resume_text=resume_context,
        company=req.company,
        role=req.role,
        job_desc=req.job_description,
        db_user=current_user
    )
    return analysis


@router.post("/cover-letter/pdf")
def download_cover_letter_pdf(
    req: CoverLetterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate cover letter and stream report PDF."""
    resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
    resume_context = ""
    if resume:
        resume_context = f"Skills: {resume.skills}\nExperience: {resume.experience}\nProjects: {resume.projects}"
    else:
        resume_context = f"Preferred Role: {current_user.preferred_role}\nCollege: {current_user.college}"

    letter_data = placement_ai.generate_cover_letter_ai(
        resume_text=resume_context,
        company=req.company,
        role=req.role,
        job_desc=req.job_description,
        db_user=current_user
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=45, leftMargin=45, topMargin=45, bottomMargin=45)
    styles = getSampleStyleSheet()
    
    body_style = ParagraphStyle(
        "CoverBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14.5,
        textColor=colors.HexColor("#1f2937")
    )
    
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        textColor=colors.HexColor("#7c3aed")
    )

    story = []
    story.append(Paragraph(f"<b>{current_user.full_name or 'Hiring Candidate'}</b>", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"{current_user.email} | {current_user.phone_number or ''}", styles["Normal"]))
    story.append(Spacer(1, 20))
    
    date_str = datetime.now().strftime("%B %d, %Y")
    story.append(Paragraph(date_str, styles["Normal"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"<b>To: The Recruiting Team</b>", styles["Normal"]))
    story.append(Paragraph(f"<b>{req.company}</b>", styles["Normal"]))
    story.append(Spacer(1, 15))
    
    # Format newlines in generated letter
    paragraphs = letter_data.content.split("\n\n")
    for p in paragraphs:
        if p.strip():
            story.append(Paragraph(p.replace("\n", "<br/>"), body_style))
            story.append(Spacer(1, 12))

    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=cover_letter_{req.company.lower().replace(' ', '_')}.pdf"}
    )


# --- RESUME BUILDER PDF ---

@router.post("/resume-builder/pdf")
def generate_resume_builder_pdf(
    req: ResumeBuilderSaveRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate ATS friendly Resume PDF on the fly."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=35, leftMargin=35, topMargin=35, bottomMargin=35)
    styles = getSampleStyleSheet()

    header_style = ParagraphStyle(
        "ResumeHeader",
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#111827"),
        alignment=1 # Center
    )

    sec_title = ParagraphStyle(
        "ResumeSec",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#7c3aed"),
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        "ResumeBody",
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#374151")
    )

    story = []
    story.append(Paragraph(req.name, header_style))
    story.append(Spacer(1, 4))
    
    sub = f"{req.email}"
    if req.phone:
        sub += f" | {req.phone}"
    if req.college:
        sub += f" | {req.college}"
    story.append(Paragraph(f"<font size='9' color='#4b5563'>{sub}</font>", ParagraphStyle("Sub", alignment=1)))
    story.append(Spacer(1, 10))

    # Skills
    if req.skills:
        story.append(Paragraph("TECHNICAL SKILLS", sec_title))
        story.append(Paragraph(", ".join(req.skills), body_style))
        story.append(Spacer(1, 8))

    # Experience
    if req.experience:
        story.append(Paragraph("WORK EXPERIENCE", sec_title))
        for exp in req.experience:
            t = f"<b>{exp.get('role')}</b> at {exp.get('company')} ({exp.get('duration')})"
            story.append(Paragraph(t, body_style))
            story.append(Paragraph(exp.get('description', ''), body_style))
            story.append(Spacer(1, 6))

    # Projects
    if req.projects:
        story.append(Paragraph("PERSONAL PROJECTS", sec_title))
        for prj in req.projects:
            t = f"<b>{prj.get('title')}</b> — {prj.get('tech')}"
            story.append(Paragraph(t, body_style))
            story.append(Paragraph(prj.get('description', ''), body_style))
            story.append(Spacer(1, 6))

    # Achievements
    if req.achievements:
        story.append(Paragraph("ACHIEVEMENTS", sec_title))
        for ach in req.achievements:
            story.append(Paragraph(f"• {ach}", body_style))
            story.append(Spacer(1, 3))

    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=custom_resume.pdf"}
    )


# --- APTITUDE ---

@router.post("/aptitude")
def submit_aptitude_test_score(
    req: AptitudeSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log finished timed aptitude test and return dashboard leaderboard placement."""
    test_run = AptitudeTest(
        user_id=current_user.id,
        score=req.score,
        category=req.category,
        duration_seconds=req.duration_seconds,
        total_questions=req.total_questions,
        correct_answers=req.correct_answers
    )
    db.add(test_run)
    db.commit()
    
    # Generate Leaderboard stats
    all_tests = db.query(AptitudeTest).filter(AptitudeTest.category == req.category).order_by(AptitudeTest.score.desc()).limit(10).all()
    leaderboard = []
    for idx, t in enumerate(all_tests):
        user_obj = db.query(User).filter(User.id == t.user_id).first()
        leaderboard.append({
            "rank": idx + 1,
            "name": user_obj.full_name if user_obj else "Candidate Partner",
            "score": t.score,
            "correct": f"{t.correct_answers}/{t.total_questions}"
        })
        
    return {
        "message": "Aptitude test score logged successfully.",
        "score_logged": req.score,
        "leaderboard": leaderboard
    }


# --- GROUP DISCUSSION BOT ---

@router.post("/discussion/chat")
def discussion_bot_chat_turn(
    req: DiscussionChatRequest,
    current_user: User = Depends(get_current_user)
):
    """Interact with Group Discussion bot personalities."""
    # Convert request history items to dictionary lists
    history_logs = [{"speaker": item.speaker, "text": item.text} for item in req.history]
    bot_turn = placement_ai.generate_next_discussion_turn(req.topic, history_logs, current_user)
    return bot_turn


@router.post("/discussion/evaluate")
def discussion_evaluate_session(
    req: DiscussionEvaluateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Collect aggregate evaluations for a finished group discussion."""
    history_logs = [{"speaker": item.speaker, "text": item.text} for item in req.history]
    evaluation = placement_ai.evaluate_discussion_session(req.topic, history_logs, current_user)
    
    # Persist Discussion
    db_disc = GroupDiscussion(
        user_id=current_user.id,
        topic=req.topic,
        evaluation_json=json.dumps({
            "confidence": evaluation.confidence,
            "leadership": evaluation.leadership,
            "communication": evaluation.communication,
            "relevance": evaluation.relevance,
            "vocabulary": evaluation.vocabulary,
            "feedback": evaluation.feedback
        })
    )
    db.add(db_disc)
    db.commit()
    return evaluation


# --- CERTIFICATES ---

@router.post("/certificates")
def issue_user_certificate(
    req: CertificateIssueRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Issue completion credentials."""
    code = f"CERT-{uuid.uuid4().hex[:8].upper()}"
    new_cert = Certificate(
        user_id=current_user.id,
        type=req.type,
        title=req.title,
        subtitle=req.subtitle or "Placement Milestones Accomplished",
        verification_code=code
    )
    db.add(new_cert)
    db.commit()
    db.refresh(new_cert)
    return new_cert


@router.get("/certificates")
def list_my_certificates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List issued placement certificates."""
    return db.query(Certificate).filter(Certificate.user_id == current_user.id).all()


@router.get("/certificates/{cert_id}/pdf")
def download_certificate_pdf(
    cert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Stream beautifully styled placement credential certificate PDF."""
    cert = db.query(Certificate).filter(
        Certificate.id == cert_id,
        Certificate.user_id == current_user.id
    ).first()
    
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate credential not found.")
        
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()

    # Border & Elegant Theme styles
    story = []
    
    title_style = ParagraphStyle(
        "CertTitle",
        fontName="Helvetica-Bold",
        fontSize=28,
        textColor=colors.HexColor("#7c3aed"),
        alignment=1,
        spaceAfter=15
    )
    
    name_style = ParagraphStyle(
        "CertName",
        fontName="Helvetica-Bold",
        fontSize=22,
        textColor=colors.HexColor("#111827"),
        alignment=1,
        spaceAfter=10
    )

    body_style = ParagraphStyle(
        "CertBody",
        fontName="Helvetica",
        fontSize=12,
        leading=18,
        textColor=colors.HexColor("#4b5563"),
        alignment=1,
        spaceAfter=25
    )

    story.append(Spacer(1, 40))
    story.append(Paragraph("CERTIFICATE OF COMPLETION", title_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph("This credential is proudly presented to", ParagraphStyle("Label", fontName="Helvetica-Oblique", fontSize=12, alignment=1, textColor=colors.HexColor("#6b7280"), spaceAfter=15)))
    story.append(Paragraph(current_user.full_name or "Candidate Partner", name_style))
    story.append(Spacer(1, 10))
    
    sub = f"For successfully demonstrating placement ready capabilities in <b>{cert.title}</b>. This mock simulation was evaluated dynamically using AI engines."
    story.append(Paragraph(sub, body_style))
    story.append(Spacer(1, 30))
    
    meta = f"Verification Code: <b>{cert.verification_code}</b><br/>Date of Issue: {cert.issued_at.strftime('%B %d, %Y') if cert.issued_at else 'N/A'}"
    story.append(Paragraph(meta, ParagraphStyle("Code", fontName="Helvetica", fontSize=9, alignment=1, textColor=colors.HexColor("#9ca3af"))))

    # Add a beautiful table layout mimicking credential signature stamps
    sig_data = [
        [Paragraph("<b>IntervueAI Director</b>", ParagraphStyle("Sig", alignment=1, fontName="Helvetica")),
         Paragraph("<b>Assessment Auditor</b>", ParagraphStyle("Sig", alignment=1, fontName="Helvetica"))]
    ]
    sig_table = Table(sig_data, colWidths=[3*inch, 3*inch])
    sig_table.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor("#d1d5db")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    
    story.append(Spacer(1, 50))
    story.append(sig_table)

    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={cert.verification_code.lower()}.pdf"}
    )
