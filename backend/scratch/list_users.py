import os
import sys

# Ensure backend root is on the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.models import User

def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Total users in DB: {len(users)}")
        for u in users:
            print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}, Full Name: {u.full_name}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
