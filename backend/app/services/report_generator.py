import io
import json
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_interview_report_pdf(interview_details: dict, user_full_name: str) -> io.BytesIO:
    """
    Generate a professional multi-page PDF evaluation report using ReportLab platypus.
    Returns the PDF as a BytesIO stream.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#7c3aed"),  # purple-600
        spaceAfter=15
    )
    
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#1e1b4b"),  # dark indigo
        spaceBefore=14,
        spaceAfter=8
    )

    body_bold = ParagraphStyle(
        "BodyBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor("#1f2937")
    )
    
    body_text = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor("#374151")
    )
    
    code_text = ParagraphStyle(
        "CodeTextCustom",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#111827"),
        spaceBefore=4,
        spaceAfter=4
    )

    feedback_text = ParagraphStyle(
        "FeedbackTextCustom",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor("#4b5563")
    )

    story = []

    # --- PAGE 1: TITLE & CORE SUMMARY ---
    story.append(Paragraph("IntervueAI Evaluation Report", title_style))
    
    # Metadata Block
    date_str = datetime.now().strftime("%B %d, %Y")
    metadata_data = [
        [Paragraph("Candidate:", body_bold), Paragraph(user_full_name, body_text),
         Paragraph("Date:", body_bold), Paragraph(date_str, body_text)],
        [Paragraph("Interview Type:", body_bold), Paragraph(interview_details.get("type", "Technical").capitalize(), body_text),
         Paragraph("Difficulty:", body_bold), Paragraph(interview_details.get("difficulty", "medium").capitalize(), body_text)],
        [Paragraph("Duration Caliber:", body_bold), Paragraph(f"{interview_details.get('duration_minutes', 20)} minutes", body_text),
         Paragraph("Status:", body_bold), Paragraph(interview_details.get("status", "completed").capitalize(), body_text)]
    ]
    
    meta_table = Table(metadata_data, colWidths=[1.2*inch, 2.2*inch, 1.0*inch, 2.2*inch])
    meta_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,-1), (-1,-1), 1, colors.HexColor("#e5e7eb")),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # Core Grade & KPI summary
    score = interview_details.get("score", 0)
    score_color = "#10b981" if score >= 80 else "#f59e0b" if score >= 60 else "#ef4444"
    
    grade_data = [
        [Paragraph(f"<font size='40' color='{score_color}'><b>{score}%</b></font>", styles["Normal"]),
         Paragraph("<b>Aggregate Simulation Score</b><br/>This score represents a weighted average computed from conversational turns, coding accuracy, and system design concept mastery.", body_text)]
    ]
    grade_table = Table(grade_data, colWidths=[1.8*inch, 4.8*inch])
    grade_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f9fafb")),
        ('PADDING', (0,0), (-1,-1), 10),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#e5e7eb")),
    ]))
    story.append(grade_table)
    story.append(Spacer(1, 12))

    # Parse roadmap metadata
    roadmap_data = interview_details.get("roadmap") or {}
    if isinstance(roadmap_data, str):
        try:
            roadmap_data = json.loads(roadmap_data)
        except Exception:
            roadmap_data = {}
    if not isinstance(roadmap_data, dict):
        roadmap_data = {}

    def get_score_pct(val, default_val):
        try:
            return f"{int(float(val))}%" if val is not None else f"{int(float(default_val))}%"
        except Exception:
            return f"{default_val}%"

    # Competency Matrix Section
    story.append(Paragraph("Competency Evaluation Metrics", section_heading))
    comp_data = [
        [
            Paragraph("Technical Score:", body_bold), Paragraph(get_score_pct(roadmap_data.get("technical_score"), score), body_text),
            Paragraph("Communication Score:", body_bold), Paragraph(get_score_pct(roadmap_data.get("communication_score"), score), body_text)
        ],
        [
            Paragraph("Problem Solving:", body_bold), Paragraph(get_score_pct(roadmap_data.get("problem_solving_score"), score), body_text),
            Paragraph("Speech Confidence:", body_bold), Paragraph(get_score_pct(roadmap_data.get("confidence_score"), score), body_text)
        ],
        [
            Paragraph("Grammar Accuracy:", body_bold), Paragraph(get_score_pct(roadmap_data.get("grammar_score"), score), body_text),
            Paragraph("Code Quality:", body_bold), Paragraph(get_score_pct(roadmap_data.get("code_quality_score"), score), body_text)
        ]
    ]
    comp_table = Table(comp_data, colWidths=[1.5*inch, 1.8*inch, 1.5*inch, 1.8*inch])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fcfcfc")),
        ('PADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#f3f4f6")),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 12))

    # Strengths & Weaknesses
    strengths = roadmap_data.get("strengths", [])
    if strengths:
        story.append(Paragraph("Candidate Core Strengths", section_heading))
        for s in strengths:
            story.append(Paragraph(f"✓ &nbsp; {s}", body_text))
            story.append(Spacer(1, 3))
        story.append(Spacer(1, 8))

    weaknesses = roadmap_data.get("weaknesses", [])
    if weaknesses:
        story.append(Paragraph("Improvement Targets & Focus Areas", section_heading))
        for w in weaknesses:
            story.append(Paragraph(f"⚠ &nbsp; {w}", body_text))
            story.append(Spacer(1, 3))
        story.append(Spacer(1, 8))

    suggestions = roadmap_data.get("suggestions", [])
    if suggestions:
        story.append(Paragraph("AI Critical Suggestions", section_heading))
        for sugg in suggestions:
            story.append(Paragraph(f"• {sugg}", body_text))
            story.append(Spacer(1, 3))
        story.append(Spacer(1, 8))

    story.append(PageBreak())

    # --- PAGE 2: ROADMAPS & LEARNING PATHS ---
    story.append(Paragraph("Structured Improvement Roadmaps", title_style))
    story.append(Spacer(1, 10))

    roadmap_7 = roadmap_data.get("roadmap_7_day", [])
    if roadmap_7:
        story.append(Paragraph("7-Day Actionable Sprint Checklist", section_heading))
        for idx, step_txt in enumerate(roadmap_7):
            story.append(Paragraph(f"<b>Day {idx+1}:</b> {step_txt}", body_text))
            story.append(Spacer(1, 4))
        story.append(Spacer(1, 10))

    roadmap_30 = roadmap_data.get("roadmap_30_day", roadmap_data.get("roadmap", []))
    if roadmap_30:
        story.append(Paragraph("30-Day Checklist & Checkpoints", section_heading))
        for idx, step_txt in enumerate(roadmap_30):
            story.append(Paragraph(f"<b>Checkpoint {idx+1}:</b> {step_txt}", body_text))
            story.append(Spacer(1, 4))
        story.append(Spacer(1, 10))

    resources = roadmap_data.get("learning_resources", [])
    if resources:
        story.append(Paragraph("Recommended Learning Resources", section_heading))
        for r in resources:
            story.append(Paragraph(f"• {r}", body_text))
            story.append(Spacer(1, 3))
        story.append(Spacer(1, 8))

    next_mock = roadmap_data.get("next_interview_recommendation")
    if next_mock:
        story.append(Paragraph("Next Mock Simulation Advice", section_heading))
        story.append(Paragraph(next_mock, body_text))
        story.append(Spacer(1, 10))

    # Malpractice Warnings
    warnings = interview_details.get("malpractice_logs", [])
    if warnings:
        story.append(Paragraph("Integrity Warning Records", section_heading))
        warn_data = [[Paragraph("Timestamp", body_bold), Paragraph("Anomaly Type", body_bold), Paragraph("Severity", body_bold), Paragraph("Confidence", body_bold)]]
        for w in warnings:
            ts = w.get("timestamp", "")
            if ts and len(ts) > 19:
                ts = ts[11:19]
            warn_data.append([
                Paragraph(ts, body_text),
                Paragraph(w.get("type", "Tab Shifted").replace('_', ' ').title(), body_text),
                Paragraph(w.get("severity", "Low").upper(), body_text),
                Paragraph(f"{w.get('confidence', 1.0)*100:.0f}%", body_text)
            ])
        warn_table = Table(warn_data, colWidths=[1.5*inch, 2.2*inch, 1.3*inch, 1.6*inch])
        warn_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#fef2f2")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#991b1b")),
            ('PADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#fee2e2")),
        ]))
        story.append(warn_table)

    story.append(PageBreak())

    # --- PAGE 3+: QUESTION BY QUESTION BREAKDOWNS ---
    story.append(Paragraph("Question & Answer Details", title_style))
    story.append(Spacer(1, 10))
    
    questions = interview_details.get("questions", [])
    for idx, q in enumerate(questions):
        q_num = idx + 1
        q_type = q.get("type", "theory").capitalize()
        story.append(Paragraph(f"<b>Question {q_num} ({q_type} Round)</b>", body_bold))
        story.append(Spacer(1, 2))
        story.append(Paragraph(q.get("text", ""), body_text))
        story.append(Spacer(1, 4))
        
        # User answer (could be code or text)
        user_ans = q.get("user_answer") or q.get("transcript") or "No response recorded."
        story.append(Paragraph("Candidate Response:", body_bold))
        if q.get("type") == "coding":
            story.append(Paragraph(f"<pre>{user_ans}</pre>", code_text))
        else:
            story.append(Paragraph(user_ans, body_text))
        story.append(Spacer(1, 4))

        # Show speech metrics for theory questions if available
        if q.get("type") != "coding" and (q.get("grammar_score") is not None or q.get("confidence_score") is not None):
            metrics_data = [
                [
                    Paragraph("Speech Confidence:", body_bold), Paragraph(get_score_pct(q.get("confidence_score"), 0), body_text),
                    Paragraph("Grammar Accuracy:", body_bold), Paragraph(get_score_pct(q.get("grammar_score"), 0), body_text)
                ],
                [
                    Paragraph("Speaking Speed:", body_bold), Paragraph(f"{int(q.get('speaking_speed'))} WPM" if q.get("speaking_speed") else "N/A", body_text),
                    Paragraph("Filler Words Count:", body_bold), Paragraph(f"{q.get('filler_words_count', 0)} instances", body_text)
                ]
            ]
            metrics_table = Table(metrics_data, colWidths=[1.5*inch, 1.8*inch, 1.5*inch, 1.8*inch])
            metrics_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f9f9f9")),
                ('PADDING', (0,0), (-1,-1), 4),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e5e7eb")),
            ]))
            story.append(metrics_table)
            story.append(Spacer(1, 4))
        
        # Grade & Feedback
        q_score = q.get("score", 0)
        q_color = "#10b981" if q_score >= 80 else "#f59e0b" if q_score >= 60 else "#ef4444"
        story.append(Paragraph(f"Score: <font color='{q_color}'><b>{q_score}/100</b></font>", body_bold))
        story.append(Paragraph(f"Feedback: {q.get('feedback', 'No critique available.')}", feedback_text))
        
        story.append(Spacer(1, 10))
        story.append(Table([[Paragraph("", body_text)]], colWidths=[6.6*inch], rowHeights=[1], style=TableStyle([
            ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#e5e7eb")),
        ])))
        story.append(Spacer(1, 8))

    # Build the document
    doc.build(story)
    buffer.seek(0)
    return buffer
