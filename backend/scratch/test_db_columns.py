import sqlite3

conn = sqlite3.connect("intervue.db")
cursor = conn.cursor()
try:
    cursor.execute("PRAGMA table_info(users)")
    columns = cursor.fetchall()
    print("USERS COLUMNS:")
    for col in columns:
        print(f" - {col[1]} ({col[2]})")
except Exception as e:
    print("ERROR:", e)
conn.close()
