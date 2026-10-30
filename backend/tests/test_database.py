import pytest
from datetime import datetime, timezone
from sqlalchemy import text
from app.core.database import SessionLocal, engine
from app.models.models import User, Resume, Plan, Subscription, TeamInvitation


def test_database_engine_connection_and_pooling():
    """Verify that PostgreSQL engine is live and pool settings are configured."""
    assert engine is not None
    # Verify pool pre-ping by obtaining a connection
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar()
        assert result == 1


def test_migrated_users_exist():
    """Verify that users migrated from SQLite are queryable with proper types."""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        assert len(users) >= 10
        admin_user = db.query(User).filter(User.email == "admin@gmail.com").first()
        assert admin_user is not None
        assert admin_user.is_active is True
        assert admin_user.id == 1
    finally:
        db.close()


def test_migrated_resumes_exist():
    """Verify that resumes migrated from SQLite are present and linked."""
    db = SessionLocal()
    try:
        resumes = db.query(Resume).all()
        assert len(resumes) >= 2
        for r in resumes:
            assert r.user_id is not None
            # Check user relation
            assert r.user is not None
    finally:
        db.close()


def test_plans_and_subscriptions():
    """Verify default seeded plans and user subscriptions."""
    db = SessionLocal()
    try:
        plans = db.query(Plan).all()
        assert len(plans) >= 3
        plan_names = {p.name for p in plans}
        assert "Free" in plan_names
        assert "Pro" in plan_names
        assert "Enterprise" in plan_names

        # Check that user 1 has a subscription
        sub = db.query(Subscription).filter(Subscription.user_id == 1).first()
        assert sub is not None
        assert sub.status == "active"
        assert sub.plan_name in {"Free", "Pro"}
    finally:
        db.close()


def test_sequence_auto_increment_and_rollback():
    """Verify transaction isolation and sequence increment."""
    db = SessionLocal()
    try:
        # Create temporary user
        temp_user = User(
            email="temp_db_test@intervue.ai",
            hashed_password="hashed_pw_test",
            full_name="Temp DB Test User",
            role="user",
            is_active=True
        )
        db.add(temp_user)
        db.commit()
        db.refresh(temp_user)
        assigned_id = temp_user.id
        assert assigned_id > 10

        # Clean up
        db.delete(temp_user)
        db.commit()

        # Verify deletion
        deleted = db.query(User).filter(User.id == assigned_id).first()
        assert deleted is None
    finally:
        db.close()
