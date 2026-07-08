import os
import sys
from datetime import datetime, timezone

# Ensure backend root is on the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine, SessionLocal
from app.models.models import User
from app.core import security

def clean_database():
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    db_file = os.path.join(backend_dir, "intervue.db")
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
            print(f"Deleted existing database file: {db_file}")
        except Exception as e:
            print(f"Error deleting database file: {e}")
            sys.exit(1)

    print("Recreating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

    print("Seeding default administrator user...")
    db = SessionLocal()
    try:
        # Check if already exists (should not, as we deleted file)
        admin_email = "admin@gmail.com"
        admin_pass = "admin123"
        hashed = security.get_password_hash(admin_pass)

        admin = User(
            email=admin_email,
            hashed_password=hashed,
            full_name="admin",
            role="SUPER_ADMIN",
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"Successfully seeded production administrator!")
        print(f"Email: {admin_email}")
        print("Password: [SECURE]")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    confirm = input("CRITICAL WARNING: Are you sure you want to delete and reset the entire database? (y/N): ")
    if confirm.lower() == 'y':
        clean_database()
    else:
        print("Database reset cancelled.")
