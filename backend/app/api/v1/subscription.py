import json
from datetime import datetime, timezone
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Plan, Subscription

router = APIRouter()


# --- SCHEMAS ---

class PlanOut(BaseModel):
    id: int
    name: str
    price: str
    description: Optional[str] = None
    features: List[str] = []
    interview_limit: int

    class Config:
        from_attributes = True


class SubscriptionOut(BaseModel):
    id: int
    user_id: int
    plan_name: str
    price: str
    status: str
    features: List[str] = []
    interview_limit: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UpgradeRequest(BaseModel):
    plan_name: str


# --- ENDPOINTS ---

@router.get("/plans", response_model=List[PlanOut])
def get_available_plans(db: Session = Depends(get_db)):
    """Retrieve all available subscription plans."""
    plans = db.query(Plan).order_by(Plan.id.asc()).all()
    results = []
    for p in plans:
        features_list = []
        if p.features:
            try:
                features_list = json.loads(p.features)
            except Exception:
                features_list = [p.features]
        results.append(PlanOut(
            id=p.id,
            name=p.name,
            price=p.price,
            description=p.description,
            features=features_list,
            interview_limit=p.interview_limit
        ))
    return results


@router.get("/me", response_model=SubscriptionOut)
def get_my_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve current user's active subscription tier."""
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if not sub:
        # Default to Free plan if none recorded
        free_plan = db.query(Plan).filter(Plan.name == "Free").first()
        now = datetime.now(timezone.utc)
        sub = Subscription(
            user_id=current_user.id,
            plan_id=free_plan.id if free_plan else None,
            plan_name="Free",
            status="active",
            created_at=now,
            updated_at=now
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)

    plan = db.query(Plan).filter(Plan.id == sub.plan_id).first() if sub.plan_id else None
    if not plan:
        plan = db.query(Plan).filter(Plan.name == sub.plan_name).first()

    features_list = []
    if plan and plan.features:
        try:
            features_list = json.loads(plan.features)
        except Exception:
            features_list = [plan.features]

    return SubscriptionOut(
        id=sub.id,
        user_id=sub.user_id,
        plan_name=sub.plan_name,
        price=plan.price if plan else "$0",
        status=sub.status,
        features=features_list,
        interview_limit=plan.interview_limit if plan else 1,
        created_at=sub.created_at,
        updated_at=sub.updated_at
    )


@router.post("/upgrade", response_model=SubscriptionOut)
def upgrade_subscription(
    req: UpgradeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calibrate / upgrade user subscription to a selected plan."""
    target_plan = db.query(Plan).filter(Plan.name.ilike(req.plan_name.strip())).first()
    if not target_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan '{req.plan_name}' is not recognized."
        )

    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    now = datetime.now(timezone.utc)

    if not sub:
        sub = Subscription(
            user_id=current_user.id,
            plan_id=target_plan.id,
            plan_name=target_plan.name,
            status="active",
            created_at=now,
            updated_at=now
        )
        db.add(sub)
    else:
        sub.plan_id = target_plan.id
        sub.plan_name = target_plan.name
        sub.status = "active"
        sub.updated_at = now

    db.commit()
    db.refresh(sub)

    features_list = []
    if target_plan.features:
        try:
            features_list = json.loads(target_plan.features)
        except Exception:
            features_list = [target_plan.features]

    return SubscriptionOut(
        id=sub.id,
        user_id=sub.user_id,
        plan_name=sub.plan_name,
        price=target_plan.price,
        status=sub.status,
        features=features_list,
        interview_limit=target_plan.interview_limit,
        created_at=sub.created_at,
        updated_at=sub.updated_at
    )
