"""
Comprehensive Authentication & Registration Test for ALL Roles:
1. Candidate (Register -> Verify Email -> Password Login -> OTP Login)
2. Recruiter (Register -> Direct Login -> Dashboard Access)
3. Admin (Public Register Blocked -> Seeded Admin Login -> Admin Dashboard Access)
"""

import sys
import os
import uuid

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    client = TestClient(app)
    unique_suffix = uuid.uuid4().hex[:6]

    print("=" * 65)
    print("INTERVUEAI: ALL-ROLES AUTHENTICATION & REGISTRATION VERIFICATION")
    print("=" * 65)

    # ==============================================================
    # 1. CANDIDATE ROLE
    # ==============================================================
    print("\n[SECTION 1: CANDIDATE]")
    cand_email = f"cand_{unique_suffix}@intervue.ai"
    cand_pw = "Password@123"

    # 1.1 Candidate Registration
    print(f"1.1 Registering fresh candidate: {cand_email}...")
    cand_reg = client.post("/api/v1/auth/register", json={
        "email": cand_email,
        "password": cand_pw,
        "full_name": "Test Candidate User",
        "role": "user"
    })
    assert cand_reg.status_code == 201, f"Candidate registration failed: {cand_reg.status_code} {cand_reg.text}"
    print("    -> Candidate registered successfully (HTTP 201).")

    # 1.2 Duplicate Registration Check
    print("1.2 Testing duplicate candidate registration rejection...")
    dup_reg = client.post("/api/v1/auth/register", json={
        "email": cand_email,
        "password": cand_pw,
        "full_name": "Duplicate Candidate",
        "role": "user"
    })
    assert dup_reg.status_code == 400, f"Expected 400 for duplicate email, got: {dup_reg.status_code}"
    print(f"    -> Correctly rejected duplicate: {dup_reg.json()['detail']}")

    # 1.3 Verify Email with OTP
    print("1.3 Verifying candidate email address with code...")
    # Test fallback / dev verification code '123456'
    ver_res = client.post("/api/v1/auth/verify-email", json={
        "email": cand_email,
        "code": "123456"
    })
    assert ver_res.status_code == 200, f"Email verification failed: {ver_res.status_code} {ver_res.text}"
    print("    -> Candidate email verified successfully (HTTP 200).")

    # 1.4 Candidate Password Login
    print("1.4 Testing Candidate Password Login...")
    cand_login = client.post("/api/v1/auth/login", json={
        "email": cand_email,
        "password": cand_pw,
        "role": "user"
    })
    assert cand_login.status_code == 200, f"Candidate password login failed: {cand_login.status_code} {cand_login.text}"
    cand_token = cand_login.json()["access_token"]
    print("    -> Candidate password login successful. JWT token received.")

    # 1.5 Candidate OTP Login Flow
    print("1.5 Testing Candidate Passwordless OTP Login (send-otp -> verify-otp)...")
    send_otp_res = client.post("/api/v1/auth/send-otp", json={"email": cand_email})
    assert send_otp_res.status_code == 200, f"send-otp failed: {send_otp_res.text}"

    verify_otp_res = client.post("/api/v1/auth/verify-otp", json={
        "email": cand_email,
        "otp": "123456"
    })
    assert verify_otp_res.status_code == 200, f"verify-otp failed: {verify_otp_res.text}"
    print("    -> Candidate OTP login successful. JWT token received.")

    # ==============================================================
    # 2. RECRUITER ROLE
    # ==============================================================
    print("\n[SECTION 2: RECRUITER]")
    rec_email = f"rec_{unique_suffix}@company.com"
    rec_pw = "Password@123"

    # 2.1 Recruiter Registration
    print(f"2.1 Registering fresh recruiter: {rec_email}...")
    rec_reg = client.post("/api/v1/auth/register", json={
        "email": rec_email,
        "password": rec_pw,
        "full_name": "Test Hiring Manager",
        "role": "recruiter",
        "company_name": "Acme Innovations"
    })
    assert rec_reg.status_code == 201, f"Recruiter registration failed: {rec_reg.status_code} {rec_reg.text}"
    assert rec_reg.json()["is_active"] is True
    print("    -> Recruiter registered successfully with active status (HTTP 201).")

    # 2.2 Duplicate Recruiter Registration Check
    print("2.2 Testing duplicate recruiter registration rejection...")
    dup_rec = client.post("/api/v1/auth/register", json={
        "email": rec_email,
        "password": rec_pw,
        "full_name": "Duplicate Recruiter",
        "role": "recruiter"
    })
    assert dup_rec.status_code == 409, f"Expected 409 for duplicate recruiter, got: {dup_rec.status_code}"
    print(f"    -> Correctly rejected duplicate recruiter: {dup_rec.json()['detail']}")

    # 2.3 Recruiter Login
    print("2.3 Testing Recruiter Login...")
    rec_login = client.post("/api/v1/auth/login", json={
        "email": rec_email,
        "password": rec_pw,
        "role": "recruiter"
    })
    assert rec_login.status_code == 200, f"Recruiter login failed: {rec_login.status_code} {rec_login.text}"
    rec_token = rec_login.json()["access_token"]
    print("    -> Recruiter login successful. JWT token received.")

    # 2.4 Recruiter Authenticated Access
    print("2.4 Testing Recruiter Protected Endpoint Access (Recruiter Campaigns/Stats)...")
    rec_stats = client.get("/api/v1/recruiter/stats", headers={"Authorization": f"Bearer {rec_token}"})
    assert rec_stats.status_code == 200, f"Recruiter stats failed: {rec_stats.status_code}"
    print(f"    -> Recruiter authenticated endpoint verified: {rec_stats.json()}")

    # ==============================================================
    # 3. ADMIN ROLE
    # ==============================================================
    print("\n[SECTION 3: ADMIN]")

    # 3.1 Public Admin Registration Block Check
    print("3.1 Testing Public Admin Registration Restriction...")
    adm_reg = client.post("/api/v1/auth/register", json={
        "email": f"hacker_admin_{unique_suffix}@intervue.ai",
        "password": "Password@123",
        "full_name": "Fake Admin",
        "role": "admin"
    })
    assert adm_reg.status_code == 400, f"Expected 400 for public admin registration, got: {adm_reg.status_code}"
    print(f"    -> Correctly blocked public admin registration: {adm_reg.json()['detail']}")

    # 3.2 Seeded Admin Login
    print("3.2 Testing Seeded Super Admin Login (admin@gmail.com / admin123)...")
    adm_login = client.post("/api/v1/auth/login", json={
        "email": "admin@gmail.com",
        "password": "admin123",
        "role": "admin"
    })
    assert adm_login.status_code == 200, f"Admin login failed: {adm_login.status_code} {adm_login.text}"
    adm_token = adm_login.json()["access_token"]
    print("    -> Admin login successful. Admin JWT token received.")

    # 3.3 Admin Protected Access
    print("3.3 Testing Admin Protected Endpoint Access (/api/v1/admin/stats)...")
    adm_stats = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {adm_token}"})
    assert adm_stats.status_code == 200, f"Admin stats failed: {adm_stats.status_code}"
    print(f"    -> Admin authenticated endpoint verified: {adm_stats.json()}")

    print("\n" + "=" * 65)
    print(">>> ALL ROLES (CANDIDATE, RECRUITER, ADMIN) AUTH CHECKS PASSED! <<<")
    print("=" * 65)

if __name__ == "__main__":
    run_tests()
