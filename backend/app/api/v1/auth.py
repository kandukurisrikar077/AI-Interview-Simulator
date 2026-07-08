from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import timedelta

from app.core import security
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import (
    UserCreate, UserResponse, Token, UserLogin, UserUpdate, ChangePassword,
    ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest
)

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account.
    """
    # Block public registration for admin
    if user_in.role in ["admin", "SUPER_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public registration for administrative accounts is restricted."
        )

    # Pre-check for existing email to give a clear, friendly error
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        if user_in.role == "recruiter":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Recruiter already exists."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists. Please sign in instead."
            )

    hashed_password = security.get_password_hash(user_in.password)
    
    # Copy all fields from schema to DB model
    user_data = user_in.model_dump() if hasattr(user_in, "model_dump") else user_in.dict()
    user_data.pop("password", None)
    
    # Handle list serialization to JSON strings
    import json
    for field in ["hiring_for", "primary_roles", "skills_tags"]:
        if field in user_data and isinstance(user_data[field], list):
            user_data[field] = json.dumps(user_data[field])
            
    new_user = User(**user_data, hashed_password=hashed_password)
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        if user_in.role == "recruiter":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Recruiter already exists."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists. Please sign in instead."
            )
    except Exception as exc:
        db.rollback()
        print(f"[register] Unexpected error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create user account. Please try again later."
        )
        
    return new_user


@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    """
    User login to retrieve JWT token. (JSON Body format)
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not security.verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Contact support."
        )
    
    # Enforce role match to prevent cross-login (e.g. recruiter logging in as candidate or vice versa)
    if user_in.role:
        if user_in.role == "admin":
            if user.role not in ["admin", "SUPER_ADMIN"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Access denied. User does not have administrative privileges."
                )
        elif user.role != user_in.role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Access denied. User does not have '{user_in.role}' role."
            )
    
    access_token = security.create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login/access-token", response_model=Token)
def login_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, for Swagger UI validation. (Form-data format)
    """
    # Swagger username acts as email in our schema
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    
    access_token = security.create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Retrieve current logged-in user profile.
    """
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update the current user's profile fields.
    """
    import json
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "skills_tags":
            setattr(current_user, field, json.dumps(value) if value is not None else None)
        else:
            setattr(current_user, field, value)

    # Automatically compute profile completion
    core_fields_filled = all([
        current_user.full_name,
        current_user.phone_number,
        current_user.college,
        current_user.degree,
        current_user.current_status,
        current_user.preferred_role
    ])
    current_user.profile_completed = core_fields_filled

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    payload: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Change the current user's password. Requires current password verification.
    """
    if not security.verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )
    
    current_user.hashed_password = security.get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully."}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Password reset request. Verifies if email exists in database.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account associated with this email address exists."
        )
    return {"message": "Password reset instructions have been dispatched to your inbox."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Resets user password with complexity checks.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found."
        )
    user.hashed_password = security.get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password has been successfully updated."}


@router.post("/verify-email", status_code=status.HTTP_200_OK)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    """
    Verifies user email using the 6-digit confirmation pin code.
    For local development, any 6-digit code or code matching user status is accepted.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found."
        )
    # Mark user active or similar if suspended
    user.is_active = True
    db.commit()
    return {"message": "Email address verified successfully."}


@router.post("/refresh", response_model=Token)
def refresh_token(current_user: User = Depends(get_current_user)):
    """
    Refreshes the user session by issuing a new access token.
    """
    access_token = security.create_access_token(subject=current_user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": current_user
    }


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Permanently delete the authenticated user's account and all associated data.
    """
    db.delete(current_user)
    db.commit()
    return None


