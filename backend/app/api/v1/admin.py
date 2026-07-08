from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db, Base, engine
from app.api.deps import get_current_admin_user
from app.models.models import User, Interview, Resume
from app.schemas.schemas import AdminStats, InterviewResponse
from app.core import security
from typing import List

router = APIRouter()


@router.get("/stats", response_model=AdminStats)
def get_platform_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user)
):
    """
    Admin: Retrieve platform-wide statistics summary.
    """
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    total_interviews = db.query(func.count(Interview.id)).scalar() or 0
    completed_interviews = db.query(func.count(Interview.id)).filter(
        Interview.status == "completed"
    ).scalar() or 0
    avg_score = db.query(func.avg(Interview.score)).filter(
        Interview.score.isnot(None)
    ).scalar()
    total_resumes = db.query(func.count(Resume.id)).scalar() or 0

    return AdminStats(
        total_users=total_users,
        active_users=active_users,
        total_interviews=total_interviews,
        completed_interviews=completed_interviews,
        average_score=round(avg_score, 1) if avg_score else None,
        total_resumes=total_resumes
    )


@router.get("/interviews", response_model=List[InterviewResponse])
def get_all_interviews(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user)
):
    """
    Admin: List all interviews across all users (paginated).
    """
    return db.query(Interview).order_by(
        Interview.created_at.desc()
    ).offset(skip).limit(limit).all()


@router.post("/reset-database")
def reset_database(
    confirmation: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user)
):
    """
    Admin: Drop all tables, recreate them, and re-seed the admin user.
    Requires confirmation text: 'RESET_DATABASE_CONFIRM'
    """
    if confirmation != "RESET_DATABASE_CONFIRM":
        raise HTTPException(
            status_code=400,
            detail="Invalid confirmation text. Must be 'RESET_DATABASE_CONFIRM'."
        )
    
    print("Database reset requested by admin.")
    try:
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        # Recreate tables
        Base.metadata.create_all(bind=engine)
        
        # Seed the default admin
        hashed_password = security.get_password_hash("admin123")
        new_admin = User(
            email="admin@gmail.com",
            hashed_password=hashed_password,
            full_name="admin",
            role="SUPER_ADMIN",
            is_active=True
        )
        db.add(new_admin)
        db.commit()
        
        return {"status": "success", "message": "Database reset completed successfully. Admin seeded."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database reset failed: {str(e)}"
        )
