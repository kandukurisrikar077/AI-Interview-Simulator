# IntervueAI — SQLite to PostgreSQL Migration Report

## 1. Executive Summary

This report documents the migration of **IntervueAI — AI Interview Simulator** from a local file-based SQLite database (`intervue.db`) to a production-grade relational **PostgreSQL** database architecture with **Alembic** schema versioning.

- **Source Database:** SQLite 3 (`backend/intervue.db`, backed up to `backend/intervue.db.backup` — 143,360 bytes)
- **Target Database:** PostgreSQL 16 (`intervue_db` on `localhost:5432`)
- **Migration Framework:** Alembic 1.15+ & SQLAlchemy 2.0+
- **Driver:** `psycopg` (v3) / `psycopg2-binary` with dialect fallback support
- **Verification Status:** 100% data integrity verified; 0 records lost across all tables; all 17 unit tests passing.

---

## 2. Connection Pooling Architecture

To prevent connection starvation, handle burst traffic, and eliminate idle connection dropouts during deployment, `backend/app/core/database.py` was updated with enterprise connection pooling:

```python
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

engine_kwargs = {}
if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs.update({
        "pool_size": 10,          # Persistent connection pool baseline
        "max_overflow": 20,       # Burst headroom for high concurrency
        "pool_pre_ping": True,    # Heartbeat validation before checkout to prevent dead connection errors
        "pool_recycle": 3600,     # Recycle connections every 60 minutes
    })

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)
```

Furthermore, URL normalization in `backend/app/core/config.py` automatically translates legacy Render and Heroku `postgres://` prefixes to modern `postgresql+psycopg2://` driver strings.

---

## 3. Alembic Schema Versioning

Alembic was initialized inside the `backend/` directory:
- **Configuration (`backend/alembic/env.py`):** Configured to dynamically import `settings.DATABASE_URL` from application settings, import all SQLAlchemy models from `app.models.models`, and bind `target_metadata = Base.metadata`.
- **Initial Migration:** Revision `27c3bb61a430_initial_schema.py` generated via autogenerate.
- **Tables Registered:** 17 application tables plus Alembic version tracking:
  - `users`
  - `resumes`
  - `interviews`
  - `questions`
  - `malpractice_logs`
  - `question_bank`
  - `jobs`
  - `campaigns`
  - `campaign_candidates`
  - `social_analyses`
  - `aptitude_tests`
  - `group_discussions`
  - `certificates`
  - `email_otps`
  - `plans` (Tiered pricing plans)
  - `subscriptions` (User tier state)
  - `team_invitations` (Recruiter organization invitations)

---

## 4. Safe Data Migration (`backend/scripts/migrate_sqlite_to_pg.py`)

A non-destructive migration script was developed to transfer data safely:

1. **Topological Order:** Respects foreign key constraints by migrating parent tables (`users`, `jobs`, `campaigns`) prior to dependent children.
2. **Dynamic Type Conversion:** 
   - Converts SQLite `0`/`1` integer columns to native PostgreSQL `BOOLEAN` types (`is_active`, `profile_completed`, `recruiter_onboarding_completed`, `coding_round_required`, `resume_screening_required`, `ai_evaluation_required`).
   - Parses ISO timestamp strings into native PostgreSQL `TIMESTAMP WITH TIME ZONE`.
3. **Primary Key Sequence Resynchronization:** Executes `SELECT setval(pg_get_serial_sequence(table, 'id'), COALESCE(MAX(id), 1))` for all migrated tables to ensure subsequent `INSERT` operations generate collision-free auto-incrementing IDs.
4. **Subscription Seeding:** Seeds default tiered plans (Free, Pro, Enterprise) and links all migrated users to active subscription records.

### Migration Audit Verification Summary

| Table Name | Source (SQLite) | Target (PostgreSQL) | Status | Data Loss |
| :--- | :--- | :--- | :--- | :--- |
| `users` | 10 | 10 | **OK** | 0% |
| `resumes` | 2 | 2 | **OK** | 0% |
| `interviews` | 0 | 0 | **EMPTY** | 0% |
| `questions` | 0 | 0 | **EMPTY** | 0% |
| `malpractice_logs` | 0 | 0 | **EMPTY** | 0% |
| `question_bank` | 14 | 14 | **OK** | 0% |
| `jobs` | 3 | 3 | **OK** | 0% |
| `campaigns` | 3 | 3 | **OK** | 0% |
| `campaign_candidates`| 0 | 0 | **EMPTY** | 0% |
| `social_analyses` | 0 | 0 | **EMPTY** | 0% |
| `aptitude_tests` | 0 | 0 | **EMPTY** | 0% |
| `group_discussions` | 0 | 0 | **EMPTY** | 0% |
| `certificates` | 0 | 0 | **EMPTY** | 0% |
| `plans` | (New) | 3 | **SEEDED**| 0% |
| `subscriptions` | (New) | 10 | **SEEDED**| 0% |

---

## 5. Verification & Automated Test Results

Automated regression and database integrity tests in `backend/tests/test_database.py` verify:
1. `test_database_engine_connection_and_pooling`: Connects and checks pre-ping query execution.
2. `test_migrated_users_exist`: Verifies migrated user records with boolean flag type fidelity.
3. `test_migrated_resumes_exist`: Validates resume persistence and relationship binding.
4. `test_plans_and_subscriptions`: Verifies default plans and subscription foreign keys.
5. `test_sequence_auto_increment_and_rollback`: Tests inserting new records, sequence advance, and atomic transaction rollback.

```
tests\test_database.py .....                                             [ 29%]
tests\test_security.py ............                                      [100%]
============================= 17 passed in 3.37s ==============================
```

---

## 6. Rollback Plan

If a rollback is required during deployment:
1. The original SQLite database remains intact at `backend/intervue.db` and backup `backend/intervue.db.backup`.
2. Setting `DATABASE_URL=sqlite:///./intervue.db` in environment variables instantly routes queries back to SQLite.
3. Alembic migrations can be rolled back via `alembic downgrade base`.
