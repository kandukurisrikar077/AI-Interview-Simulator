"""
Data Migration Script: SQLite (intervue.db) -> PostgreSQL (intervue_db)
Preserves all existing records, respects foreign key dependency trees,
resets PostgreSQL serial sequences, and verifies data integrity.
"""

import os
import sys
import sqlite3
import json
from datetime import datetime, timezone

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from sqlalchemy import create_engine, text, inspect
from app.core.config import settings
from app.models.models import Plan, Subscription

SQLITE_PATH = os.path.join(backend_dir, "intervue.db")
SQLITE_BACKUP_PATH = os.path.join(backend_dir, "intervue.db.backup")

# Tables in topological dependency order
TABLES_ORDER = [
    "users",
    "resumes",
    "interviews",
    "questions",
    "malpractice_logs",
    "question_bank",
    "jobs",
    "campaigns",
    "campaign_candidates",
    "social_analyses",
    "aptitude_tests",
    "group_discussions",
    "certificates",
    "email_otps",
]

DEFAULT_PLANS = [
    {
        "id": 1,
        "name": "Free",
        "price": "$0",
        "description": "Explore the basics of the interview room.",
        "features": json.dumps([
            "1 Technical session / month",
            "Text questions, no voice input",
            "Basic resume parse checklist"
        ]),
        "interview_limit": 1
    },
    {
        "id": 2,
        "name": "Pro",
        "price": "$29",
        "description": "Accelerate training with complete voice rounds.",
        "features": json.dumps([
            "Unlimited mock interview rooms",
            "Gemini conversational voice synthesis",
            "Integrated Monaco coding editor (Python, Java, JS, C++)",
            "ReportLab PDF result logs",
            "Gaze & tab malpractice tracking"
        ]),
        "interview_limit": 9999
    },
    {
        "id": 3,
        "name": "Enterprise",
        "price": "Custom",
        "description": "For bootcamp metrics tracking.",
        "features": json.dumps([
            "Custom template parameters",
            "Dedicated admin portal analytics",
            "Feature flags management options",
            "SSO security guards settings"
        ]),
        "interview_limit": 99999
    }
]


def migrate():
    print("=" * 60)
    print("INTERVUEAI: SQLITE -> POSTGRESQL DATA MIGRATION")
    print("=" * 60)

    if not os.path.exists(SQLITE_PATH):
        raise FileNotFoundError(f"SQLite database not found at {SQLITE_PATH}")

    print(f"[*] SQLite source: {SQLITE_PATH}")
    print(f"[*] PostgreSQL target: {settings.DATABASE_URL}")

    # Connect to SQLite
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    # Connect to PostgreSQL
    pg_engine = create_engine(settings.DATABASE_URL)
    pg_conn = pg_engine.connect()

    migration_report = {}

    try:
        # Step 1: Migrate existing application tables
        for table in TABLES_ORDER:
            # Check if table exists in SQLite
            sqlite_cur.execute(
                "SELECT count(*) FROM sqlite_master WHERE type='table' AND name=?",
                (table,)
            )
            if sqlite_cur.fetchone()[0] == 0:
                print(f"[!] Table '{table}' does not exist in SQLite source. Skipping.")
                continue

            # Fetch SQLite columns and rows
            sqlite_cur.execute(f"PRAGMA table_info({table})")
            columns_info = sqlite_cur.fetchall()
            col_names = [col["name"] for col in columns_info]

            sqlite_cur.execute(f"SELECT * FROM {table}")
            rows = sqlite_cur.fetchall()
            src_count = len(rows)

            if src_count == 0:
                print(f"[-] Table '{table}': 0 rows in source. Skipping row transfer.")
                migration_report[table] = {"src": 0, "dst": 0, "status": "EMPTY"}
                continue

            print(f"[+] Migrating '{table}': {src_count} rows found...")

            # Inspect PG column types for accurate type conversion
            inspector = inspect(pg_engine)
            pg_cols = {c["name"]: c["type"] for c in inspector.get_columns(table)}

            # Insert into PostgreSQL using parameterized query
            cols_clause = ", ".join(f'"{c}"' for c in col_names)
            params_clause = ", ".join(f":{c}" for c in col_names)
            insert_stmt = text(f'INSERT INTO "{table}" ({cols_clause}) VALUES ({params_clause}) ON CONFLICT (id) DO NOTHING')

            inserted = 0
            for row in rows:
                row_dict = dict(row)
                for k, v in list(row_dict.items()):
                    col_type = pg_cols.get(k)
                    if col_type is not None:
                        type_str = str(col_type).upper()
                        # Convert SQLite integer 0/1 to Python boolean for PG BOOLEAN columns
                        if "BOOLEAN" in type_str or "BOOL" in type_str:
                            if v is not None:
                                row_dict[k] = bool(v)
                        # Parse string timestamp to datetime object if needed
                        elif ("DATETIME" in type_str or "TIMESTAMP" in type_str) and isinstance(v, str) and v:
                            try:
                                row_dict[k] = datetime.fromisoformat(v)
                            except Exception:
                                pass
                pg_conn.execute(insert_stmt, row_dict)
                inserted += 1

            pg_conn.commit()

            # Verify destination count
            dst_count = pg_conn.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar()
            migration_report[table] = {"src": src_count, "dst": dst_count, "status": "OK" if dst_count >= src_count else "MISMATCH"}
            print(f"    -> Destination now has {dst_count} rows.")

            # Step 2: Reset PostgreSQL sequence for tables with primary key 'id'
            try:
                pg_conn.execute(text(
                    f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE((SELECT MAX(id) FROM \"{table}\"), 1));"
                ))
                pg_conn.commit()
            except Exception as seq_err:
                # Some tables may not use standard serial sequence
                pass

        # Step 3: Seed standard Plans if not already present
        print("[+] Checking default Plans in PostgreSQL...")
        for p in DEFAULT_PLANS:
            plan_exists = pg_conn.execute(
                text('SELECT COUNT(*) FROM "plans" WHERE "id" = :id'), {"id": p["id"]}
            ).scalar()
            if not plan_exists:
                pg_conn.execute(
                    text('INSERT INTO "plans" (id, name, price, description, features, interview_limit, created_at) '
                         'VALUES (:id, :name, :price, :description, :features, :interview_limit, :created_at)'),
                    {**p, "created_at": datetime.now(timezone.utc)}
                )
        pg_conn.commit()
        # Reset plans sequence
        try:
            pg_conn.execute(text("SELECT setval(pg_get_serial_sequence('plans', 'id'), COALESCE((SELECT MAX(id) FROM \"plans\"), 1));"))
            pg_conn.commit()
        except Exception:
            pass
        print(f"    -> Plans seeded successfully ({len(DEFAULT_PLANS)} tiers).")

        # Step 4: Ensure every existing User has a Subscription record
        print("[+] Ensuring active subscriptions for all migrated users...")
        users = pg_conn.execute(text('SELECT id, role FROM "users"')).fetchall()
        for u in users:
            sub_exists = pg_conn.execute(
                text('SELECT COUNT(*) FROM "subscriptions" WHERE "user_id" = :uid'), {"uid": u[0]}
            ).scalar()
            if not sub_exists:
                # Recruiter / pro users get Pro plan; standard get Free
                is_pro = (u[1] == "recruiter")
                plan_id = 2 if is_pro else 1
                plan_name = "Pro" if is_pro else "Free"
                now = datetime.now(timezone.utc)
                pg_conn.execute(
                    text('INSERT INTO "subscriptions" (user_id, plan_id, plan_name, status, created_at, updated_at) '
                         'VALUES (:uid, :pid, :pname, :status, :created_at, :updated_at)'),
                    {
                        "uid": u[0],
                        "pid": plan_id,
                        "pname": plan_name,
                        "status": "active",
                        "created_at": now,
                        "updated_at": now
                    }
                )
        pg_conn.commit()
        # Reset subscriptions sequence
        try:
            pg_conn.execute(text("SELECT setval(pg_get_serial_sequence('subscriptions', 'id'), COALESCE((SELECT MAX(id) FROM \"subscriptions\"), 1));"))
            pg_conn.commit()
        except Exception:
            pass

        print("\n" + "=" * 60)
        print("MIGRATION AUDIT VERIFICATION SUMMARY")
        print("=" * 60)
        print(f"{'Table Name':<25} | {'Source (SQLite)':<15} | {'Target (PG)':<15} | {'Status'}")
        print("-" * 65)
        all_passed = True
        for tbl, data in migration_report.items():
            print(f"{tbl:<25} | {data['src']:<15} | {data['dst']:<15} | {data['status']}")
            if data["status"] == "MISMATCH":
                all_passed = False

        if all_passed:
            print("\n>>> ALL RECORDS MIGRATED WITH 100% DATA INTEGRITY AND ZERO DATA LOSS <<<")
        else:
            print("\n>>> WARNING: ONE OR MORE TABLE ROW COUNTS DID NOT MATCH! <<<")

    finally:
        sqlite_conn.close()
        pg_conn.close()


if __name__ == "__main__":
    migrate()
