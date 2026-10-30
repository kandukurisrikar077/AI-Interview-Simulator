import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core import security
from app.models.models import User
from app.core.database import SessionLocal

client = TestClient(app)


@pytest.fixture(scope="module")
def auth_tokens():
    """Create test candidate and recruiter auth tokens."""
    db = SessionLocal()
    try:
        # Find or create candidate
        cand = db.query(User).filter(User.email == "test_cand_phase4@intervue.ai").first()
        if not cand:
            cand = User(
                email="test_cand_phase4@intervue.ai",
                hashed_password=security.get_password_hash("password123"),
                full_name="Test Candidate Phase 4",
                role="user",
                is_active=True
            )
            db.add(cand)
            db.commit()
            db.refresh(cand)

        # Find or create recruiter
        recruiter = db.query(User).filter(User.email == "test_recruiter_phase4@intervue.ai").first()
        if not recruiter:
            recruiter = User(
                email="test_recruiter_phase4@intervue.ai",
                hashed_password=security.get_password_hash("password123"),
                full_name="Test Recruiter Phase 4",
                role="recruiter",
                company_name="Acme Corp",
                is_active=True
            )
            db.add(recruiter)
            db.commit()
            db.refresh(recruiter)

        cand_token = security.create_access_token(subject=str(cand.id))
        recruiter_token = security.create_access_token(subject=str(recruiter.id))

        yield {
            "cand_headers": {"Authorization": f"Bearer {cand_token}"},
            "recruiter_headers": {"Authorization": f"Bearer {recruiter_token}"},
            "cand_id": cand.id,
            "recruiter_id": recruiter.id
        }
    finally:
        db.close()


def test_subscription_plans_and_upgrade(auth_tokens):
    """Test retrieving plans, viewing my subscription, and upgrading tier."""
    # 1. Get plans
    res = client.get("/api/v1/subscription/plans")
    assert res.status_code == 200
    plans = res.data = res.json()
    assert len(plans) >= 3
    names = [p["name"] for p in plans]
    assert "Free" in names
    assert "Pro" in names

    # 2. Get my subscription
    me_res = client.get("/api/v1/subscription/me", headers=auth_tokens["cand_headers"])
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert "plan_name" in me_data
    assert me_data["status"] == "active"

    # 3. Upgrade tier
    up_res = client.post(
        "/api/v1/subscription/upgrade",
        json={"plan_name": "Pro"},
        headers=auth_tokens["cand_headers"]
    )
    assert up_res.status_code == 200
    up_data = up_res.json()
    assert up_data["plan_name"] == "Pro"
    assert up_data["status"] == "active"


def test_hr_behavioral_simulator(auth_tokens):
    """Test HR behavioral questions retrieval and AI evaluation."""
    # 1. Get HR questions
    q_res = client.get("/api/v1/interviews/hr/questions")
    assert q_res.status_code == 200
    questions = q_res.json()
    assert len(questions) >= 4
    assert any("conflict" in q["text"].lower() for q in questions)

    # 2. Evaluate candidate response
    eval_payload = {
        "question_text": "Tell me about a time you had to deal with a conflict in your project team.",
        "user_transcript": "In our previous sprint, we had a disagreement regarding database indexing. The situation was creating delays. My task was to mediate and find common ground. I scheduled an architectural spike meeting, evaluated trade-offs, and we decided to implement composite indexing. The result was a 40% reduction in query latency and sprint delivery on time.",
        "category": "Conflict Resolution",
        "eye_contact_percent": 96.0,
        "posture": "Focused",
        "duration_seconds": 120
    }
    eval_res = client.post(
        "/api/v1/interviews/hr/evaluate",
        json=eval_payload,
        headers=auth_tokens["cand_headers"]
    )
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert eval_data["score"] > 0
    assert eval_data["star_adherence"] >= 50
    assert "strengths" in eval_data
    assert "improvements" in eval_data


def test_team_invitations_lifecycle(auth_tokens):
    """Test inviting a teammate, viewing directory, and revoking invite."""
    # 1. Invite team member as recruiter
    invite_res = client.post(
        "/api/v1/recruiter/team/invite",
        json={"email": "colleague_eng@acme.org", "role": "viewer"},
        headers=auth_tokens["recruiter_headers"]
    )
    assert invite_res.status_code == 201
    invite_data = invite_res.json()
    assert invite_data["email"] == "colleague_eng@acme.org"
    assert invite_data["role"] == "viewer"
    assert invite_data["status"] == "Pending"
    invite_id = invite_data["id"]

    # 2. List team members
    list_res = client.get("/api/v1/recruiter/team", headers=auth_tokens["recruiter_headers"])
    assert list_res.status_code == 200
    members = list_res.json()
    emails = [m["email"] for m in members]
    assert "colleague_eng@acme.org" in emails

    # 3. Revoke invitation
    del_res = client.delete(f"/api/v1/recruiter/team/{invite_id}", headers=auth_tokens["recruiter_headers"])
    assert del_res.status_code == 200


def test_social_analyzer_with_profile_text(auth_tokens):
    """Test LinkedIn and GitHub profile analysis with candidate context."""
    # 1. LinkedIn analysis with headline & summary
    li_res = client.post(
        "/api/v1/placement/linkedin",
        json={
            "url": "https://linkedin.com/in/testengineer",
            "profile_text": "Senior Full-Stack Engineer specializing in FastAPI, React, and PostgreSQL. Built scalable distributed microservices.",
            "target_role": "Senior Full-Stack Engineer"
        },
        headers=auth_tokens["cand_headers"]
    )
    assert li_res.status_code == 200
    li_data = li_res.json()
    assert "score" in li_data
    assert li_data["score"] > 0

    # 2. GitHub analysis with repository summary
    gh_res = client.post(
        "/api/v1/placement/github",
        json={
            "url": "https://github.com/testengineer",
            "profile_text": "Repositories: intervue-simulator (FastAPI, React), distributed-cache (Go), algorithms-practice."
        },
        headers=auth_tokens["cand_headers"]
    )
    assert gh_res.status_code == 200
    gh_data = gh_res.json()
    assert "score" in gh_data
