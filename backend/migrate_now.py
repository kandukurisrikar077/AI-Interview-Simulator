"""
Safe migration script — adds missing columns to the live database.
Runs against intervue.db in the current directory.
Does NOT delete or modify any existing rows.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "intervue.db")
print(f"[migrate] Target database: {DB_PATH}")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# ─── 1. USERS TABLE ──────────────────────────────────────────────────────────

# Columns that the SQLAlchemy model defines but may be missing from the DB
USERS_MISSING = [
    ("company_website",               "VARCHAR"),
    ("company_logo",                  "VARCHAR"),
    ("job_title",                     "VARCHAR"),
    ("department",                    "VARCHAR"),
    ("timezone",                      "VARCHAR"),
    ("hiring_for",                    "TEXT"),
    ("primary_roles",                 "TEXT"),
    ("recruiter_onboarding_completed","BOOLEAN DEFAULT 0"),
]

cursor.execute("PRAGMA table_info(users)")
existing_user_cols = {row[1] for row in cursor.fetchall()}

print("\n[migrate] Checking users table ...")
for col_name, col_type in USERS_MISSING:
    if col_name not in existing_user_cols:
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            print(f"  [ADDED]   users.{col_name}  ({col_type})")
        except Exception as exc:
            print(f"  [ERROR]   users.{col_name}: {exc}")
    else:
        print(f"  [OK]      users.{col_name} already exists")

# ─── 2. INTERVIEWS TABLE ─────────────────────────────────────────────────────

INTERVIEWS_MISSING = [
    ("job_role", "VARCHAR"),
    ("mode",     "VARCHAR DEFAULT 'voice'"),
]

cursor.execute("PRAGMA table_info(interviews)")
existing_iv_cols = {row[1] for row in cursor.fetchall()}

print("\n[migrate] Checking interviews table ...")
for col_name, col_type in INTERVIEWS_MISSING:
    if col_name not in existing_iv_cols:
        try:
            cursor.execute(f"ALTER TABLE interviews ADD COLUMN {col_name} {col_type}")
            print(f"  [ADDED]   interviews.{col_name}  ({col_type})")
        except Exception as exc:
            print(f"  [ERROR]   interviews.{col_name}: {exc}")
    else:
        print(f"  [OK]      interviews.{col_name} already exists")

# ─── 3. CREATE MISSING TABLES ────────────────────────────────────────────────

cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
existing_tables = {row[0] for row in cursor.fetchall()}
print(f"\n[migrate] Existing tables: {sorted(existing_tables)}")

if "jobs" not in existing_tables:
    cursor.execute("""
        CREATE TABLE jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR NOT NULL,
            description TEXT,
            company VARCHAR,
            location VARCHAR,
            department VARCHAR,
            workplace_type VARCHAR,
            experience VARCHAR,
            salary VARCHAR,
            required_skills TEXT,
            preferred_skills TEXT,
            openings INTEGER DEFAULT 1,
            application_deadline VARCHAR,
            status VARCHAR DEFAULT 'Draft',
            created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at DATETIME
        )
    """)
    print("  [CREATED] jobs table")
else:
    # jobs table exists — add any missing columns
    JOB_MISSING = [
        ("department",           "VARCHAR"),
        ("workplace_type",       "VARCHAR"),
        ("experience",           "VARCHAR"),
        ("salary",               "VARCHAR"),
        ("required_skills",      "TEXT"),
        ("preferred_skills",     "TEXT"),
        ("openings",             "INTEGER DEFAULT 1"),
        ("application_deadline", "VARCHAR"),
        ("status",               "VARCHAR DEFAULT 'Draft'"),
    ]
    cursor.execute("PRAGMA table_info(jobs)")
    existing_job_cols = {row[1] for row in cursor.fetchall()}
    print("\n[migrate] Checking jobs table ...")
    for col_name, col_type in JOB_MISSING:
        if col_name not in existing_job_cols:
            try:
                cursor.execute(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_type}")
                print(f"  [ADDED]   jobs.{col_name}  ({col_type})")
            except Exception as exc:
                print(f"  [ERROR]   jobs.{col_name}: {exc}")
        else:
            print(f"  [OK]      jobs.{col_name} already exists")

if "campaigns" not in existing_tables:
    cursor.execute("""
        CREATE TABLE campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR NOT NULL,
            job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
            interview_type VARCHAR DEFAULT 'technical',
            difficulty VARCHAR DEFAULT 'medium',
            recruiter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            coding_round_required BOOLEAN DEFAULT 0,
            resume_screening_required BOOLEAN DEFAULT 1,
            ai_evaluation_required BOOLEAN DEFAULT 1,
            status VARCHAR DEFAULT 'active',
            created_at DATETIME
        )
    """)
    print("  [CREATED] campaigns table")
else:
    CAMP_MISSING = [
        ("coding_round_required",     "BOOLEAN DEFAULT 0"),
        ("resume_screening_required", "BOOLEAN DEFAULT 1"),
        ("ai_evaluation_required",    "BOOLEAN DEFAULT 1"),
        ("status",                    "VARCHAR DEFAULT 'active'"),
    ]
    cursor.execute("PRAGMA table_info(campaigns)")
    existing_camp_cols = {row[1] for row in cursor.fetchall()}
    print("\n[migrate] Checking campaigns table ...")
    for col_name, col_type in CAMP_MISSING:
        if col_name not in existing_camp_cols:
            try:
                cursor.execute(f"ALTER TABLE campaigns ADD COLUMN {col_name} {col_type}")
                print(f"  [ADDED]   campaigns.{col_name}  ({col_type})")
            except Exception as exc:
                print(f"  [ERROR]   campaigns.{col_name}: {exc}")
        else:
            print(f"  [OK]      campaigns.{col_name} already exists")

if "campaign_candidates" not in existing_tables:
    cursor.execute("""
        CREATE TABLE campaign_candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR DEFAULT 'applied',
            interview_id INTEGER REFERENCES interviews(id) ON DELETE SET NULL,
            created_at DATETIME
        )
    """)
    print("  [CREATED] campaign_candidates table")

if "email_otps" not in existing_tables:
    cursor.execute("""
        CREATE TABLE email_otps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR NOT NULL,
            otp_hash VARCHAR NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME,
            attempts INTEGER DEFAULT 0 NOT NULL,
            last_sent_at DATETIME
        )
    """)
    print("  [CREATED] email_otps table")

# ─── 4. COMMIT ───────────────────────────────────────────────────────────────

conn.commit()
conn.close()

print("\n[migrate] [SUCCESS] Migration complete. No existing data was modified.")
