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
    ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest,
    ResendVerificationRequest, SendOTPRequest, VerifyOTPRequest
)
from app.models.models import EmailOTP
from app.services.email_service import send_otp_email
import re
import secrets
import hashlib
from datetime import datetime, timezone

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
            
    # Set is_active = False for candidate users until email verification succeeds
    if user_in.role == "user" or not user_in.role:
        new_user = User(**user_data, hashed_password=hashed_password, is_active=False)
    else:
        new_user = User(**user_data, hashed_password=hashed_password)
    
    try:
        db.add(new_user)
        db.flush()
        
        # If candidate, generate and send signup email verification OTP
        if user_in.role == "user" or not user_in.role:
            utc_now = get_naive_utc_now()
            otp_code = "".join(secrets.choice("0123456789") for _ in range(6))
            otp_hash = hashlib.sha256(otp_code.encode("utf-8")).hexdigest()
            expires_at = utc_now + timedelta(minutes=15)
            
            # Remove any stale signup OTP for this email if present
            existing_otp = db.query(EmailOTP).filter(
                EmailOTP.email == new_user.email,
                EmailOTP.purpose == "signup"
            ).first()
            if existing_otp:
                existing_otp.otp_hash = otp_hash
                existing_otp.expires_at = expires_at
                existing_otp.created_at = utc_now
                existing_otp.attempts = 0
                existing_otp.last_sent_at = utc_now
            else:
                new_otp_record = EmailOTP(
                    email=new_user.email,
                    otp_hash=otp_hash,
                    expires_at=expires_at,
                    created_at=utc_now,
                    attempts=0,
                    last_sent_at=utc_now,
                    purpose="signup"
                )
                db.add(new_otp_record)
            
            # Attempt to send the verification email
            send_otp_email(new_user.email, otp_code)
            
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
    except ValueError as val_err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email service is not configured"
        )
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        print(f"[register] Unexpected error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send verification email. Please try again later."
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
    Verifies candidate signup email using the 6-digit confirmation pin code.
    """
    email_clean = payload.email.strip().lower()
    
    if not validate_email_syntax(email_clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid email address."
        )
        
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found."
        )
        
    if user.is_active:
        return {"message": "Email address already verified."}
        
    db_otp = db.query(EmailOTP).filter(
        EmailOTP.email == email_clean,
        EmailOTP.purpose == "signup"
    ).first()
    
    if not db_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )
        
    if db_otp.attempts >= 5:
        db.delete(db_otp)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many failed attempts. Please request a new verification code."
        )
        
    utc_now = get_naive_utc_now()
    expires_at_naive = db_otp.expires_at.replace(tzinfo=None) if db_otp.expires_at.tzinfo else db_otp.expires_at
    if utc_now > expires_at_naive:
        db.delete(db_otp)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code expired."
        )
        
    input_hash = hashlib.sha256(payload.code.strip().encode("utf-8")).hexdigest()
    if db_otp.otp_hash != input_hash:
        db_otp.attempts += 1
        db.commit()
        
        if db_otp.attempts >= 5:
            db.delete(db_otp)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many failed attempts. Please request a new verification code."
            )
            
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )
        
    user.is_active = True
    db.delete(db_otp)
    db.commit()
    return {"message": "Email address verified successfully."}


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
def resend_verification(payload: ResendVerificationRequest, db: Session = Depends(get_db)):
    """
    Resend 6-digit signup verification code.
    """
    email_clean = payload.email.strip().lower()
    
    if not validate_email_syntax(email_clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid email address."
        )
        
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No candidate account exists for this email."
        )
        
    if user.is_active:
        return {"message": "Email address already verified."}
        
    utc_now = get_naive_utc_now()
    existing_otp = db.query(EmailOTP).filter(
        EmailOTP.email == email_clean,
        EmailOTP.purpose == "signup"
    ).order_by(EmailOTP.created_at.desc()).first()
    
    if existing_otp and existing_otp.last_sent_at:
        sent_at_naive = existing_otp.last_sent_at.replace(tzinfo=None) if existing_otp.last_sent_at.tzinfo else existing_otp.last_sent_at
        if utc_now - sent_at_naive < timedelta(seconds=60):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please wait before requesting another code."
            )
            
    otp_code = "".join(secrets.choice("0123456789") for _ in range(6))
    otp_hash = hashlib.sha256(otp_code.encode("utf-8")).hexdigest()
    expires_at = utc_now + timedelta(minutes=15)
    
    if existing_otp:
        existing_otp.otp_hash = otp_hash
        existing_otp.expires_at = expires_at
        existing_otp.created_at = utc_now
        existing_otp.attempts = 0
        existing_otp.last_sent_at = utc_now
    else:
        new_otp_record = EmailOTP(
            email=email_clean,
            otp_hash=otp_hash,
            expires_at=expires_at,
            created_at=utc_now,
            attempts=0,
            last_sent_at=utc_now,
            purpose="signup"
        )
        db.add(new_otp_record)
        
    db.commit()
    try:
        send_otp_email(email_clean, otp_code)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email service is not configured"
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send verification email"
        )
        
    return {"message": "Verification code sent. Please check your email."}


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


def validate_email_syntax(email: str) -> bool:
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(pattern, email):
        return False
    parts = email.split("@")
    if len(parts) != 2:
        return False
    domain = parts[1]
    if "." not in domain:
        return False
    domain_parts = domain.split(".")
    if any(len(p) == 0 for p in domain_parts) or len(domain_parts[-1]) < 2:
        return False
    return True


def get_naive_utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


@router.post("/send-otp", status_code=status.HTTP_200_OK)
def send_otp(payload: SendOTPRequest, db: Session = Depends(get_db)):
    """
    Generate and send a 6-digit verification code to the candidate's email.
    """
    email_clean = payload.email.strip().lower()
    
    if not validate_email_syntax(email_clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid email address."
        )
        
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or user.role != "user":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No candidate account exists for this email."
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not verified. Please verify your email before logging in."
        )
        
    utc_now = get_naive_utc_now()
    existing_otp = db.query(EmailOTP).filter(
        EmailOTP.email == email_clean,
        EmailOTP.purpose == "login"
    ).order_by(EmailOTP.created_at.desc()).first()
    
    if existing_otp and existing_otp.last_sent_at:
        sent_at_naive = existing_otp.last_sent_at.replace(tzinfo=None) if existing_otp.last_sent_at.tzinfo else existing_otp.last_sent_at
        if utc_now - sent_at_naive < timedelta(seconds=60):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please wait before requesting another code."
            )
            
    otp_code = "".join(secrets.choice("0123456789") for _ in range(6))
    otp_hash = hashlib.sha256(otp_code.encode("utf-8")).hexdigest()
    expires_at = utc_now + timedelta(minutes=5)
    
    if existing_otp:
        existing_otp.otp_hash = otp_hash
        existing_otp.expires_at = expires_at
        existing_otp.created_at = utc_now
        existing_otp.attempts = 0
        existing_otp.last_sent_at = utc_now
    else:
        new_otp_record = EmailOTP(
            email=email_clean,
            otp_hash=otp_hash,
            expires_at=expires_at,
            created_at=utc_now,
            attempts=0,
            last_sent_at=utc_now,
            purpose="login"
        )
        db.add(new_otp_record)
        
    db.commit()
    try:
        send_otp_email(email_clean, otp_code)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email service is not configured"
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send verification email"
        )
    
    return {"message": "Verification code has been sent to your email address."}


@router.post("/verify-otp", response_model=Token)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Verify 6-digit OTP and issue JWT access token for candidate login.
    """
    email_clean = payload.email.strip().lower()
    
    if not validate_email_syntax(email_clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid email address."
        )
        
    db_otp = db.query(EmailOTP).filter(
        EmailOTP.email == email_clean,
        EmailOTP.purpose == "login"
    ).first()
    
    if not db_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )
        
    if db_otp.attempts >= 5:
        db.delete(db_otp)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many failed attempts. Please request a new verification code."
        )
        
    utc_now = get_naive_utc_now()
    expires_at_naive = db_otp.expires_at.replace(tzinfo=None) if db_otp.expires_at.tzinfo else db_otp.expires_at
    if utc_now > expires_at_naive:
        db.delete(db_otp)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code expired."
        )
        
    input_hash = hashlib.sha256(payload.otp.encode("utf-8")).hexdigest()
    if db_otp.otp_hash != input_hash:
        db_otp.attempts += 1
        db.commit()
        
        if db_otp.attempts >= 5:
            db.delete(db_otp)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many failed attempts. Please request a new verification code."
            )
            
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )
        
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or user.role != "user":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No candidate account exists for this email."
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not verified. Please verify your email before logging in."
        )
        
    db.delete(db_otp)
    db.commit()
    
    access_token = security.create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


