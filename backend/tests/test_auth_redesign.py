import pytest
import time
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from jose import jwt

from app.main import app
from app.core import security
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.models import User, EmailOTP
import hashlib

client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()

@pytest.fixture(scope="module")
def setup_test_users(db_session):
    """Seed test users for authentication test scenarios."""
    users_data = [
        {
            "email": "auth_test_candidate@intervue.ai",
            "password": "Password@123",
            "full_name": "Auth Test Candidate",
            "role": "user",
            "is_active": True
        },
        {
            "email": "auth_test_recruiter@intervue.ai",
            "password": "Password@123",
            "full_name": "Auth Test Recruiter",
            "role": "recruiter",
            "is_active": True
        },
        {
            "email": "auth_test_admin@intervue.ai",
            "password": "Password@123",
            "full_name": "Auth Test Admin",
            "role": "SUPER_ADMIN",
            "is_active": True
        },
        {
            "email": "auth_test_unverified@intervue.ai",
            "password": "Password@123",
            "full_name": "Auth Test Unverified",
            "role": "user",
            "is_active": False
        }
    ]

    created = {}
    for ud in users_data:
        u = db_session.query(User).filter(User.email == ud["email"]).first()
        if not u:
            u = User(
                email=ud["email"],
                hashed_password=security.get_password_hash(ud["password"]),
                full_name=ud["full_name"],
                role=ud["role"],
                is_active=ud["is_active"]
            )
            db_session.add(u)
            db_session.commit()
            db_session.refresh(u)
        else:
            # ensure password and active state match
            u.hashed_password = security.get_password_hash(ud["password"])
            u.is_active = ud["is_active"]
            u.role = ud["role"]
            db_session.commit()
        created[ud["email"]] = u

    yield created

    # Cleanup test users after tests
    # We can keep them or leave them clean


# Scenario 1: Existing user logs in with correct password
def test_scenario_01_login_correct_password(setup_test_users):
    resp = client.post("/api/v1/auth/login", json={
        "email": "auth_test_candidate@intervue.ai",
        "password": "Password@123"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "auth_test_candidate@intervue.ai"
    assert data["user"]["role"] == "user"


# Scenario 2: Existing user enters incorrect password
def test_scenario_02_login_incorrect_password(setup_test_users):
    resp = client.post("/api/v1/auth/login", json={
        "email": "auth_test_candidate@intervue.ai",
        "password": "WrongPassword999!"
    })
    assert resp.status_code == 400
    assert "Incorrect email or password" in resp.json()["detail"]


# Scenario 3: Existing user requests OTP login
def test_scenario_03_request_otp_login(setup_test_users, db_session):
    # Clear any previous OTP
    db_session.query(EmailOTP).filter(
        EmailOTP.email == "auth_test_candidate@intervue.ai",
        EmailOTP.purpose == "login"
    ).delete()
    db_session.commit()

    resp = client.post("/api/v1/auth/send-otp", json={
        "email": "auth_test_candidate@intervue.ai"
    })
    assert resp.status_code == 200
    assert "Verification code has been sent" in resp.json()["message"]

    # Verify EmailOTP record was created
    otp_record = db_session.query(EmailOTP).filter(
        EmailOTP.email == "auth_test_candidate@intervue.ai",
        EmailOTP.purpose == "login"
    ).first()
    assert otp_record is not None
    assert otp_record.attempts == 0
    assert otp_record.purpose == "login"


# Scenario 4: Valid OTP login
def test_scenario_04_valid_otp_login(setup_test_users, db_session):
    # Set a known test OTP
    known_otp = "849201"
    otp_hash = hashlib.sha256(known_otp.encode("utf-8")).hexdigest()
    utc_now = datetime.now(timezone.utc).replace(tzinfo=None)

    db_otp = db_session.query(EmailOTP).filter(
        EmailOTP.email == "auth_test_candidate@intervue.ai",
        EmailOTP.purpose == "login"
    ).first()
    if db_otp:
        db_otp.otp_hash = otp_hash
        db_otp.expires_at = utc_now + timedelta(minutes=5)
        db_otp.attempts = 0
    else:
        db_otp = EmailOTP(
            email="auth_test_candidate@intervue.ai",
            otp_hash=otp_hash,
            expires_at=utc_now + timedelta(minutes=5),
            created_at=utc_now,
            attempts=0,
            purpose="login"
        )
        db_session.add(db_otp)
    db_session.commit()

    resp = client.post("/api/v1/auth/verify-otp", json={
        "email": "auth_test_candidate@intervue.ai",
        "otp": known_otp
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "auth_test_candidate@intervue.ai"


# Scenario 5: Expired OTP
def test_scenario_05_expired_otp(setup_test_users, db_session):
    known_otp = "736192"
    otp_hash = hashlib.sha256(known_otp.encode("utf-8")).hexdigest()
    # Expired 5 minutes ago
    expired_time = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=5)

    db_otp = EmailOTP(
        email="auth_test_candidate@intervue.ai",
        otp_hash=otp_hash,
        expires_at=expired_time,
        created_at=expired_time - timedelta(minutes=5),
        attempts=0,
        purpose="login"
    )
    db_session.add(db_otp)
    db_session.commit()

    resp = client.post("/api/v1/auth/verify-otp", json={
        "email": "auth_test_candidate@intervue.ai",
        "otp": known_otp
    })
    assert resp.status_code == 400
    assert "expired" in resp.json()["detail"].lower()


# Scenario 6: Invalid OTP
def test_scenario_06_invalid_otp(setup_test_users, db_session):
    known_otp = "999888"
    otp_hash = hashlib.sha256(known_otp.encode("utf-8")).hexdigest()
    utc_now = datetime.now(timezone.utc).replace(tzinfo=None)

    db_otp = EmailOTP(
        email="auth_test_candidate@intervue.ai",
        otp_hash=otp_hash,
        expires_at=utc_now + timedelta(minutes=5),
        created_at=utc_now,
        attempts=0,
        purpose="login"
    )
    db_session.add(db_otp)
    db_session.commit()

    # Wrong OTP
    resp = client.post("/api/v1/auth/verify-otp", json={
        "email": "auth_test_candidate@intervue.ai",
        "otp": "000000"
    })
    assert resp.status_code == 400
    assert "Invalid verification code" in resp.json()["detail"]


# Scenario 7: OTP resend cooldown
def test_scenario_07_resend_cooldown(setup_test_users, db_session):
    utc_now = datetime.now(timezone.utc).replace(tzinfo=None)
    # Recently sent 10 seconds ago
    recent_sent = utc_now - timedelta(seconds=10)

    db_session.query(EmailOTP).filter(
        EmailOTP.email == "auth_test_candidate@intervue.ai",
        EmailOTP.purpose == "login"
    ).delete()
    
    db_otp = EmailOTP(
        email="auth_test_candidate@intervue.ai",
        otp_hash="somehash",
        expires_at=utc_now + timedelta(minutes=5),
        created_at=recent_sent,
        last_sent_at=recent_sent,
        attempts=0,
        purpose="login"
    )
    db_session.add(db_otp)
    db_session.commit()

    resp = client.post("/api/v1/auth/send-otp", json={
        "email": "auth_test_candidate@intervue.ai"
    })
    assert resp.status_code == 400
    assert "Please wait before requesting another code" in resp.json()["detail"]


# Scenario 8: New user signup and email verification
def test_scenario_08_new_user_signup_and_email_verification(db_session):
    new_email = f"new_signup_{int(time.time())}@intervue.ai"
    
    # 1. Register candidate
    resp_signup = client.post("/api/v1/auth/register", json={
        "email": new_email,
        "password": "Password@123",
        "full_name": "New Signup Test Candidate",
        "role": "user"
    })
    assert resp_signup.status_code in [200, 201]
    
    # User should initially be inactive
    user = db_session.query(User).filter(User.email == new_email).first()
    assert user is not None
    assert user.is_active is False

    # Check that signup OTP exists
    otp_record = db_session.query(EmailOTP).filter(
        EmailOTP.email == new_email,
        EmailOTP.purpose == "signup"
    ).first()
    assert otp_record is not None

    # Simulate entering OTP (using fallback code in dev or known code)
    known_code = "654321"
    otp_record.otp_hash = hashlib.sha256(known_code.encode("utf-8")).hexdigest()
    db_session.commit()

    resp_verify = client.post("/api/v1/auth/verify-email", json={
        "email": new_email,
        "code": known_code
    })
    assert resp_verify.status_code == 200
    assert "verified successfully" in resp_verify.json()["message"].lower()

    # User must now be active
    db_session.refresh(user)
    assert user.is_active is True

    # User can now log in
    resp_login = client.post("/api/v1/auth/login", json={
        "email": new_email,
        "password": "Password@123"
    })
    assert resp_login.status_code == 200
    assert "access_token" in resp_login.json()


# Scenario 9: Existing email signup rejection
def test_scenario_09_existing_email_signup_rejection(setup_test_users):
    resp = client.post("/api/v1/auth/register", json={
        "email": "auth_test_candidate@intervue.ai",
        "password": "Password@123",
        "full_name": "Duplicate User",
        "role": "user"
    })
    assert resp.status_code == 400
    assert "already exists" in resp.json()["detail"].lower()


# Scenario 10: Forgot password and successful reset
def test_scenario_10_forgot_password_and_reset(setup_test_users, db_session):
    target_email = "auth_test_candidate@intervue.ai"

    # 1. Request forgot password
    resp_fp = client.post("/api/v1/auth/forgot-password", json={
        "email": target_email
    })
    assert resp_fp.status_code == 200
    assert "verification code" in resp_fp.json()["message"].lower()

    # 2. Get and verify the reset OTP
    otp_record = db_session.query(EmailOTP).filter(
        EmailOTP.email == target_email,
        EmailOTP.purpose == "reset_password"
    ).first()
    assert otp_record is not None

    test_otp = "314159"
    otp_record.otp_hash = hashlib.sha256(test_otp.encode("utf-8")).hexdigest()
    db_session.commit()

    # 3. Verify the reset OTP to get reset_token
    resp_vo = client.post("/api/v1/auth/verify-reset-otp", json={
        "email": target_email,
        "otp": test_otp
    })
    assert resp_vo.status_code == 200
    reset_token = resp_vo.json().get("reset_token")
    assert reset_token is not None

    # 4. Set new password
    new_pwd = "BrandNewPassword@2026"
    resp_rp = client.post("/api/v1/auth/reset-password", json={
        "email": target_email,
        "reset_token": reset_token,
        "new_password": new_pwd
    })
    assert resp_rp.status_code == 200
    assert "successfully updated" in resp_rp.json()["message"].lower()

    # 5. Check reset OTP is invalidated
    invalidated_otp = db_session.query(EmailOTP).filter(
        EmailOTP.email == target_email,
        EmailOTP.purpose == "reset_password"
    ).first()
    assert invalidated_otp is None


# Scenario 11: Login using the new password
def test_scenario_11_login_with_new_password(setup_test_users):
    target_email = "auth_test_candidate@intervue.ai"
    new_pwd = "BrandNewPassword@2026"

    # Old password should now fail
    resp_old = client.post("/api/v1/auth/login", json={
        "email": target_email,
        "password": "Password@123"
    })
    assert resp_old.status_code == 400

    # New password should succeed
    resp_new = client.post("/api/v1/auth/login", json={
        "email": target_email,
        "password": new_pwd
    })
    assert resp_new.status_code == 200
    assert "access_token" in resp_new.json()


# Scenario 12: Role-based dashboard redirection
def test_scenario_12_role_based_responses(setup_test_users):
    # Candidate login
    resp_c = client.post("/api/v1/auth/login", json={
        "email": "auth_test_candidate@intervue.ai",
        "password": "BrandNewPassword@2026"
    })
    assert resp_c.status_code == 200
    assert resp_c.json()["user"]["role"] == "user"

    # Recruiter login
    resp_r = client.post("/api/v1/auth/login", json={
        "email": "auth_test_recruiter@intervue.ai",
        "password": "Password@123"
    })
    assert resp_r.status_code == 200
    assert resp_r.json()["user"]["role"] == "recruiter"

    # Admin login
    resp_a = client.post("/api/v1/auth/login", json={
        "email": "auth_test_admin@intervue.ai",
        "password": "Password@123"
    })
    assert resp_a.status_code == 200
    assert resp_a.json()["user"]["role"] in ["admin", "SUPER_ADMIN"]


# Scenario 13: JWT expiration and unauthorized requests
def test_scenario_13_jwt_expiration_and_unauthorized():
    # 1. Request with no token -> 401
    resp_no_token = client.get("/api/v1/auth/me")
    assert resp_no_token.status_code == 401

    # 2. Request with forged/invalid token -> 401
    resp_fake_token = client.get("/api/v1/auth/me", headers={
        "Authorization": "Bearer totally_fake_and_invalid_token"
    })
    assert resp_fake_token.status_code == 401

    # 3. Request with expired token -> 401
    expired_token = security.create_access_token(
        subject="1",
        expires_delta=timedelta(seconds=-10)
    )
    resp_expired = client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {expired_token}"
    })
    assert resp_expired.status_code == 401
