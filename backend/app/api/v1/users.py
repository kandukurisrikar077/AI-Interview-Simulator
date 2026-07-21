from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Any

from app.core import security
from app.core.database import get_db
from app.api.deps import get_current_admin_user
from app.models.models import User
from app.schemas.schemas import UserResponse

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user)
):
    """
    Admin: List all registered users with optional search and pagination.
    """
    query = db.query(User)
    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) | (User.full_name.ilike(f"%{search}%"))
        )
    return query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()


@router.patch("/{user_id}/role", response_model=UserResponse)
def toggle_user_role(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """
    Admin: Toggle a user's role between 'user' and 'admin'.
    Admins cannot demote themselves.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot change your own role.")

    user.role = "admin" if user.role == "user" else "user"
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/suspend", response_model=UserResponse)
def toggle_suspend_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """
    Admin: Toggle user suspension (is_active flag).
    Admins cannot suspend themselves.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot suspend your own account.")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """
    Admin: Permanently delete a user and all related data (cascade).
    Admins cannot delete themselves.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")

    db.delete(user)
    db.commit()
    return None


@router.post("/{user_id}/reset-password", status_code=status.HTTP_200_OK)
def admin_reset_password(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user)
):
    """
    Admin: Reset a user's password to a temporary default.
    Returns the temporary password to communicate to the user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    temp_password = f"Temp@{user_id}2026!"
    user.hashed_password = security.get_password_hash(temp_password)
    db.commit()
    return {
        "message": "Password reset successfully.",
        "temporary_password": temp_password
    }
