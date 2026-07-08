import os
import sys
from datetime import datetime

# Ensure backend root is on the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.models.models import User
from app.core import security

def test_persistence_flow():
    print("=== Testing Database Persistence Flow ===")
    
    # 1. Initialize tables (Simulating application startup)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if test persistent user exists
        test_email = "persistent_user@test.com"
        existing = db.query(User).filter(User.email == test_email).first()
        
        if existing:
            print(f"Verified: User '{test_email}' already exists from a previous run/startup!")
            # Verify we can authenticate this user
            is_valid = security.verify_password("securepassword123", existing.hashed_password)
            if is_valid:
                print("SUCCESS: Existing user credentials verified successfully!")
            else:
                print("FAILURE: Existing user found but password verification failed.")
        else:
            print(f"Creating a new persistent user '{test_email}'...")
            hashed = security.get_password_hash("securepassword123")
            new_user = User(
                email=test_email,
                hashed_password=hashed,
                full_name="Persistent Candidate",
                role="user",
                is_active=True
            )
            db.add(new_user)
            db.commit()
            print("Verified: User registered successfully in the database!")
            
    except Exception as e:
        print(f"Error during persistence test: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_persistence_flow()
