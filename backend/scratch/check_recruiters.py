import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "intervue.db")
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()
try:
    cursor.execute("SELECT id, email, role, recruiter_onboarding_completed, full_name, company_name FROM users WHERE role='recruiter'")
    rows = cursor.fetchall()
    print(f"Recruiter users found: {len(rows)}")
    for row in rows:
        print(dict(row))
except Exception as e:
    print("ERROR:", e)
conn.close()
