from fastapi import APIRouter
from app.api.v1 import auth, resumes, interviews, coding, users, admin, analytics, questions, recruiter, placement

api_router = APIRouter()

# Register routes
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])
api_router.include_router(interviews.router, prefix="/interviews", tags=["Interviews"])
api_router.include_router(coding.router, prefix="/coding", tags=["Coding"])
api_router.include_router(users.router, prefix="/users", tags=["User Management (Admin)"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Statistics"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(questions.router, prefix="/questions", tags=["Question Bank"])
api_router.include_router(recruiter.router, prefix="/recruiter", tags=["Recruiter Campaigns"])
api_router.include_router(placement.router, prefix="/placement", tags=["Placement Assures"])
