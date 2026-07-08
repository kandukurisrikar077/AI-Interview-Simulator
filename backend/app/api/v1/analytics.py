from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import json

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Interview, Question
from app.schemas.schemas import AnalyticsResponse, SkillScore

router = APIRouter()


@router.get("/me", response_model=AnalyticsResponse)
def get_my_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve comprehensive analytics for the current authenticated user.
    Aggregates interview scores, skill breakdowns, and weak areas from DB.
    """
    interviews = db.query(Interview).filter(
        Interview.user_id == current_user.id,
        Interview.status == "completed"
    ).order_by(Interview.created_at.asc()).all()

    if not interviews:
        return AnalyticsResponse(
            total_interviews=0,
            average_score=None,
            best_score=None,
            skill_scores=[],
            score_trend=[],
            weak_areas=[]
        )

    scores = [iv.score for iv in interviews if iv.score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else None
    best_score = max(scores) if scores else None
    score_trend = scores[-10:]  # Last 10 scores for trend chart

    # Aggregate skill scores from roadmap JSON stored in interviews
    skill_totals: dict[str, list[float]] = {}
    for iv in interviews:
        if iv.roadmap:
            try:
                roadmap_obj = json.loads(iv.roadmap)
                for item in roadmap_obj.get("skill_scores", []):
                    skill = item.get("skill") or item.get("category", "General")
                    score = item.get("score", 0)
                    if skill not in skill_totals:
                        skill_totals[skill] = []
                    skill_totals[skill].append(score)
            except Exception:
                pass

    # Also aggregate from question categories
    questions = db.query(Question).join(Interview).filter(
        Interview.user_id == current_user.id,
        Question.score.isnot(None),
        Question.category.isnot(None)
    ).all()

    for q in questions:
        cat = q.category or "General"
        if cat not in skill_totals:
            skill_totals[cat] = []
        skill_totals[cat].append(q.score)

    skill_scores = [
        SkillScore(skill=s, score=round(sum(v) / len(v), 1))
        for s, v in skill_totals.items()
        if v
    ]

    # Identify weak areas (skill score < 65)
    weak_areas = [ss.skill for ss in skill_scores if ss.score < 65]

    return AnalyticsResponse(
        total_interviews=len(interviews),
        average_score=avg_score,
        best_score=best_score,
        skill_scores=skill_scores,
        score_trend=score_trend,
        weak_areas=weak_areas
    )
