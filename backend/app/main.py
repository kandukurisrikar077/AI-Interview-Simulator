from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.core.database import Base, engine
from app.models import models
from app.api.v1.api import api_router
from app.core.config import settings

# Create database tables
Base.metadata.create_all(bind=engine)

def migrate_db():
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    
    # Migrate interviews
    columns_iv = [col["name"] for col in inspector.get_columns("interviews")]
    with engine.begin() as conn:
        if "job_role" not in columns_iv:
            try:
                conn.execute(text("ALTER TABLE interviews ADD COLUMN job_role VARCHAR"))
                print("Migrated: Added job_role column to interviews")
            except Exception as e:
                print("Migration error adding job_role:", e)
        if "mode" not in columns_iv:
            try:
                conn.execute(text("ALTER TABLE interviews ADD COLUMN mode VARCHAR DEFAULT 'voice'"))
                print("Migrated: Added mode column to interviews")
            except Exception as e:
                print("Migration error adding mode:", e)

    # Migrate users
    columns_usr = [col["name"] for col in inspector.get_columns("users")]
    with engine.begin() as conn:
        if "openai_api_key" not in columns_usr:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN openai_api_key VARCHAR"))
                print("Migrated: Added openai_api_key column to users")
            except Exception as e:
                print("Migration error adding openai_api_key:", e)
        if "gemini_api_key" not in columns_usr:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN gemini_api_key VARCHAR"))
                print("Migrated: Added gemini_api_key column to users")
            except Exception as e:
                print("Migration error adding gemini_api_key:", e)
        
        # New recruiter fields
        new_user_cols = {
            "company_website": "VARCHAR",
            "company_logo": "VARCHAR",
            "job_title": "VARCHAR",
            "department": "VARCHAR",
            "timezone": "VARCHAR",
            "hiring_for": "TEXT",
            "primary_roles": "TEXT",
            "recruiter_onboarding_completed": "BOOLEAN DEFAULT 0"
        }
        for col_name, col_type in new_user_cols.items():
            if col_name not in columns_usr:
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                    print(f"Migrated: Added {col_name} column to users")
                except Exception as e:
                    print(f"Migration error adding {col_name} to users:", e)

    # Migrate jobs
    columns_jobs = [col["name"] for col in inspector.get_columns("jobs")]
    with engine.begin() as conn:
        new_job_cols = {
            "department": "VARCHAR",
            "workplace_type": "VARCHAR",
            "experience": "VARCHAR",
            "salary": "VARCHAR",
            "required_skills": "TEXT",
            "preferred_skills": "TEXT",
            "openings": "INTEGER DEFAULT 1",
            "application_deadline": "VARCHAR",
            "status": "VARCHAR DEFAULT 'Draft'"
        }
        for col_name, col_type in new_job_cols.items():
            if col_name not in columns_jobs:
                try:
                    conn.execute(text(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_type}"))
                    print(f"Migrated: Added {col_name} column to jobs")
                except Exception as e:
                    print(f"Migration error adding {col_name} to jobs:", e)

    # Migrate campaigns
    columns_camps = [col["name"] for col in inspector.get_columns("campaigns")]
    with engine.begin() as conn:
        new_camp_cols = {
            "coding_round_required": "BOOLEAN DEFAULT 0",
            "resume_screening_required": "BOOLEAN DEFAULT 1",
            "ai_evaluation_required": "BOOLEAN DEFAULT 1",
            "status": "VARCHAR DEFAULT 'active'"
        }
        for col_name, col_type in new_camp_cols.items():
            if col_name not in columns_camps:
                try:
                    conn.execute(text(f"ALTER TABLE campaigns ADD COLUMN {col_name} {col_type}"))
                    print(f"Migrated: Added {col_name} column to campaigns")
                except Exception as e:
                    print(f"Migration error adding {col_name} to campaigns:", e)

migrate_db()

def seed_admin():
    from app.core import security
    from app.models.models import User
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@gmail.com").first()
        if not admin:
            hashed_password = security.get_password_hash("admin123")
            admin_user = User(
                email="admin@gmail.com",
                hashed_password=hashed_password,
                full_name="admin",
                role="SUPER_ADMIN"
            )
            db.add(admin_user)
            db.commit()
            print("Admin user seeded successfully!")
    except Exception as e:
        print("Error seeding admin user:", e)
    finally:
        db.close()

seed_admin()

def seed_questions():
    from app.models.models import QuestionBank
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        count = db.query(QuestionBank).count()
        if count == 0:
            sample_questions = [
                {
                    "category": "React",
                    "difficulty": "easy",
                    "text": "What is the difference between state and props in React?",
                    "expected_answer": "Props are variables passed to a component by its parent, whereas state is local state variables managed within the component itself. Props are immutable, while state is mutable via setState.",
                    "interview_type": "technical"
                },
                {
                    "category": "System Design",
                    "difficulty": "medium",
                    "text": "How would you design a rate limiting system for a public API?",
                    "expected_answer": "You can use algorithms like Token Bucket, Leaking Bucket, or Fixed/Sliding Window Log. The state (token counts or timestamps) is typically stored in a fast key-value store like Redis to ensure low latency and distributed scaling.",
                    "interview_type": "technical"
                },
                {
                    "category": "FastAPI",
                    "difficulty": "hard",
                    "text": "Explain how dependency injection works in FastAPI and how sub-dependencies are resolved.",
                    "expected_answer": "FastAPI uses Depends() to declare dependencies on route handlers. Dependencies can themselves declare other dependencies. FastAPI recursively resolves the dependency graph on each request, caching the returned values of shared sub-dependencies for that request.",
                    "interview_type": "technical"
                },
                {
                    "category": "Python",
                    "difficulty": "medium",
                    "text": "What are decorators in Python and how do you write a custom decorator?",
                    "expected_answer": "Decorators are functions that take another function as an argument, extend its behavior without modifying it, and return a new function. They are written using the @wrapper syntax.",
                    "interview_type": "technical"
                },
                {
                    "category": "JavaScript",
                    "difficulty": "easy",
                    "text": "Write a function `isPalindrome(str)` that checks if a string is a palindrome.",
                    "expected_answer": "Compare the string with its reversed version or use two pointers moving inward from both ends of the string to check if the characters match.",
                    "interview_type": "coding"
                },
                {
                    "category": "Python",
                    "difficulty": "medium",
                    "text": "Write a Python function to find the length of the longest substring without repeating characters.",
                    "expected_answer": "Use a sliding window approach with a hash map or set to track the last seen index/existence of characters, adjusting the start pointer when a duplicate is found.",
                    "interview_type": "coding"
                },
                {
                    "category": "Databases",
                    "difficulty": "hard",
                    "text": "Write a SQL query to find the second highest salary from an Employee table.",
                    "expected_answer": "SELECT MAX(Salary) FROM Employee WHERE Salary < (SELECT MAX(Salary) FROM Employee) OR using LIMIT 1 OFFSET 1 with ORDER BY Salary DESC.",
                    "interview_type": "coding"
                },
                {
                    "category": "Behavioral",
                    "difficulty": "easy",
                    "text": "Tell me about a time you had a conflict with a team member and how you resolved it.",
                    "expected_answer": "Use the STAR method: explain the situation, target task, actions taken (communicating openly, seeking common ground), and positive result/learning outcome.",
                    "interview_type": "hr"
                },
                {
                    "category": "Communication",
                    "difficulty": "medium",
                    "text": "How do you explain technical concepts to non-technical stakeholders?",
                    "expected_answer": "Use analogies from everyday life, avoid jargon, focus on the business impact and 'why' rather than the deep technical 'how', and check for understanding frequently.",
                    "interview_type": "hr"
                },
                {
                    "category": "Leadership",
                    "difficulty": "hard",
                    "text": "How do you handle a situation where your project is behind schedule and you realize you cannot meet the deadline?",
                    "expected_answer": "Proactively inform stakeholders with a clear explanation, present updated options (scope reduction, resource addition, or extension), and establish a concrete recovery plan.",
                    "interview_type": "hr"
                },
                {
                    "category": "React Frontend",
                    "difficulty": "medium",
                    "text": "Explain the Virtual DOM reconciliation process.",
                    "expected_answer": "The candidate should explain how React compares the Virtual DOM with the previous render, identifies changes using the diffing algorithm, and updates only the affected DOM elements to improve performance.",
                    "interview_type": "technical"
                },
                {
                    "category": "Database",
                    "difficulty": "medium",
                    "text": "What is the difference between INNER JOIN and LEFT JOIN?",
                    "expected_answer": "INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from the left table and matching rows from the right table, filling unmatched values with NULL.",
                    "interview_type": "technical"
                },
                {
                    "category": "System Design",
                    "difficulty": "medium",
                    "text": "How would you design a scalable URL shortening service?",
                    "expected_answer": "Discuss unique ID generation, database schema, caching, load balancing, replication, analytics, and high availability.",
                    "interview_type": "technical"
                },
                {
                    "category": "System Design",
                    "difficulty": "hard",
                    "text": "Explain database sharding and index write overhead.",
                    "expected_answer": "Checks indexing and write lock limitations.",
                    "interview_type": "technical"
                }
            ]
            for q_data in sample_questions:
                q = QuestionBank(
                    category=q_data["category"],
                    difficulty=q_data["difficulty"],
                    text=q_data["text"],
                    expected_answer=q_data["expected_answer"],
                    interview_type=q_data["interview_type"]
                )
                db.add(q)
            db.commit()
            print("Question bank seeded successfully with default questions!")
    except Exception as e:
        print("Error seeding question bank:", e)
    finally:
        db.close()

seed_questions()

app = FastAPI(
    title="IntervueAI API",
    description="Backend services for IntervueAI - AI Interview Simulator",
    version="1.0.0"
)

# Register API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",

    # Vercel
    "https://ai-interview-simulator-lovat.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://ai-interview-simulator-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to IntervueAI API",
        "status": "healthy"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
