"""
Unit and Integration Tests for Free Email Validation Service in IntervueAI
Tests:
  1. Valid Gmail address
  2. Valid Outlook address
  3. Invalid email syntax (local & schema)
  4. Nonexistent domain (NXDOMAIN)
  5. Domain without mail records (Null MX / no mail delivery)
  6. Disposable email domains (blocklist & subdomain detection)
  7. DNS timeout/failure fail-open behavior
  8. Registration endpoint integration & rejection before DB/OTP
  9. Registration regression cases
"""

import time
import pytest
from unittest.mock import patch
import dns.exception
import dns.resolver
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.models.models import User, EmailOTP
from app.services.email_validation_service import (
    validate_email_address,
    is_disposable_domain,
    DISPOSABLE_EMAIL_DOMAINS
)

client = TestClient(app)


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()


# 1. Valid Gmail address
def test_valid_gmail_address():
    result = validate_email_address("alex.engineer@gmail.com", check_dns=True)
    assert result.is_valid is True
    assert result.error_message is None
    assert result.normalized_email == "alex.engineer@gmail.com"
    assert result.domain == "gmail.com"


# 2. Valid Outlook address
def test_valid_outlook_address():
    result = validate_email_address("sarah_candidate@outlook.com", check_dns=True)
    assert result.is_valid is True
    assert result.error_message is None
    assert result.normalized_email == "sarah_candidate@outlook.com"
    assert result.domain == "outlook.com"


# 3. Invalid email syntax
def test_invalid_email_syntax():
    invalid_cases = [
        "notanemail",
        "@missingusername.com",
        "username@",
        "username@.com",
        "user name@example.com",
        "user@domain..com",
        "",
        None,
    ]
    for invalid in invalid_cases:
        result = validate_email_address(invalid, check_dns=False)
        assert result.is_valid is False
        assert result.error_message is not None
        assert "valid email address" in result.error_message.lower()


# 4. Nonexistent domain
def test_nonexistent_domain():
    fake_email = "candidate@thisdomaindefinitelydoesnotexist999888.xyz"
    result = validate_email_address(fake_email, check_dns=True)
    assert result.is_valid is False
    assert result.error_message is not None
    assert "does not exist" in result.error_message.lower()


# 5. Domain without mail records (Null MX or no MX/A/AAAA for mail)
def test_domain_without_mail_records():
    # example.com is RFC 7505 Null MX (does not accept email)
    null_mx_email = "candidate@example.com"
    result = validate_email_address(null_mx_email, check_dns=True)
    assert result.is_valid is False
    assert result.error_message is not None
    assert "does not accept email" in result.error_message.lower() or "cannot receive email" in result.error_message.lower()


# 6. Disposable email domain detection
def test_disposable_email_domain():
    disposable_samples = [
        "temp_user@mailinator.com",
        "throwaway@tempmail.com",
        "quick@10minutemail.com",
        "anon@guerrillamail.com",
        "tester@sharklasers.com",
        "subdomain_test@sub.mailinator.com",
        "user@yopmail.com",
    ]
    for disp in disposable_samples:
        result = validate_email_address(disp, check_dns=False)
        assert result.is_valid is False
        assert result.error_message is not None
        assert "disposable or temporary" in result.error_message.lower()


# 7. DNS timeout and network failure fail-open behavior
def test_dns_timeout_fails_open():
    """
    If DNS times out or nameservers fail, the system must fail open
    to avoid blocking legitimate candidates with unusual or temporarily slow DNS.
    """
    with patch("dns.resolver.Resolver.resolve", side_effect=dns.exception.Timeout("DNS lookup timed out")):
        result = validate_email_address("valid.user@legitimatecompany.org", check_dns=True)
        assert result.is_valid is True
        assert result.error_message is None
        assert result.normalized_email == "valid.user@legitimatecompany.org"

    with patch("dns.resolver.Resolver.resolve", side_effect=dns.resolver.NoNameservers("All nameservers failed")):
        result = validate_email_address("valid.user@legitimatecompany.org", check_dns=True)
        assert result.is_valid is True
        assert result.error_message is None


# 8. Registration endpoint integration: Rejection BEFORE database insertion / OTP
def test_register_rejects_disposable_email_before_db(db_session):
    disp_email = f"spam_candidate_{int(time.time())}@mailinator.com"
    resp = client.post("/api/v1/auth/register", json={
        "email": disp_email,
        "password": "Password@123",
        "full_name": "Spam Candidate",
        "role": "user"
    })
    assert resp.status_code == 400
    assert "disposable or temporary" in resp.json()["detail"].lower()

    # Verify no record was created in User or EmailOTP
    user = db_session.query(User).filter(User.email == disp_email).first()
    assert user is None
    otp = db_session.query(EmailOTP).filter(EmailOTP.email == disp_email).first()
    assert otp is None


def test_register_rejects_nonexistent_domain_before_db(db_session):
    nonexistent_email = f"ghost_candidate_{int(time.time())}@domainthatneverexisted4567.org"
    resp = client.post("/api/v1/auth/register", json={
        "email": nonexistent_email,
        "password": "Password@123",
        "full_name": "Ghost Candidate",
        "role": "user"
    })
    assert resp.status_code == 400
    assert "does not exist" in resp.json()["detail"].lower()

    # Verify no record was created in User or EmailOTP
    user = db_session.query(User).filter(User.email == nonexistent_email).first()
    assert user is None
    otp = db_session.query(EmailOTP).filter(EmailOTP.email == nonexistent_email).first()
    assert otp is None


def test_register_rejects_null_mx_domain_before_db(db_session):
    null_mx_email = f"fake_{int(time.time())}@example.com"
    resp = client.post("/api/v1/auth/register", json={
        "email": null_mx_email,
        "password": "Password@123",
        "full_name": "Null MX User",
        "role": "user"
    })
    assert resp.status_code == 400
    detail = resp.json()["detail"].lower()
    assert "does not accept email" in detail or "cannot receive email" in detail

    user = db_session.query(User).filter(User.email == null_mx_email).first()
    assert user is None


# 9. Existing registration regression case: Valid candidate succeeds
def test_register_valid_candidate_regression(db_session):
    valid_email = f"valid_cand_{int(time.time())}@intervue.ai"
    resp = client.post("/api/v1/auth/register", json={
        "email": valid_email,
        "password": "Password@123",
        "full_name": "Valid Candidate",
        "role": "user"
    })
    assert resp.status_code in [200, 201]

    # Candidate should be created as inactive pending verification
    user = db_session.query(User).filter(User.email == valid_email).first()
    assert user is not None
    assert user.is_active is False

    # OTP record should exist
    otp = db_session.query(EmailOTP).filter(
        EmailOTP.email == valid_email,
        EmailOTP.purpose == "signup"
    ).first()
    assert otp is not None
