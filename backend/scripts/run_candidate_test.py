"""
Candidate End-to-End Test Case
Simulates a candidate login, HR behavioral interview session,
and sandboxed Python coding execution.
"""
import json
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

def run_candidate_test():
    client = TestClient(app)

    print("=" * 60)
    print("INTERVUEAI: CANDIDATE END-TO-END TEST CASE")
    print("=" * 60)

    # Step 1: Candidate Authentication
    print("\n[Step 1] Authenticating candidate...")
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test_cand_phase4@intervue.ai",
            "password": "password123"
        }
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("  -> Authentication successful. JWT token received.")

    # Step 2: Fetch Current Subscription Plan
    print("\n[Step 2] Checking subscription tier...")
    sub_res = client.get("/api/v1/subscription/me", headers=headers)
    assert sub_res.status_code == 200, f"Subscription query failed: {sub_res.text}"
    sub_data = sub_res.json()
    print(f"  -> Active Tier: {sub_data['plan_name']} (Status: {sub_data['status']})")

    # Step 3: Create Mock Interview Room
    print("\n[Step 3] Initializing Coding Interview Session...")
    interview_res = client.post(
        "/api/v1/interviews/",
        json={
            "type": "coding",
            "difficulty": "medium",
            "duration_minutes": 30,
            "job_role": "Full-Stack Python Engineer",
            "mode": "code"
        },
        headers=headers
    )
    assert interview_res.status_code == 201, f"Interview creation failed: {interview_res.text}"
    interview_id = interview_res.json()["id"]
    print(f"  -> Interview room created with ID: {interview_id}")

    # Step 4: Run Code in Sandboxed Execution Engine
    print("\n[Step 4] Submitting candidate Python algorithm to Sandbox Runner...")
    candidate_code = (
        "def two_sum(nums, target):\n"
        "    seen = {}\n"
        "    for i, num in enumerate(nums):\n"
        "        diff = target - num\n"
        "        if diff in seen:\n"
        "            return [seen[diff], i]\n"
        "        seen[num] = i\n"
        "    return []\n"
    )
    test_cases = json.dumps([
        {"input": "[2, 7, 11, 15], 9", "output": "[0, 1]"},
        {"input": "[3, 2, 4], 6", "output": "[1, 2]"},
        {"input": "[3, 3], 6", "output": "[0, 1]"}
    ])

    run_res = client.post(
        f"/api/v1/coding/{interview_id}/run",
        json={
            "code": candidate_code,
            "language": "python",
            "test_cases": test_cases
        },
        headers=headers
    )
    assert run_res.status_code == 200, f"Sandbox execution failed: {run_res.text}"
    run_data = run_res.json()
    print(f"  -> Execution Success: {run_data['success']}")
    for i, tr in enumerate(run_data["results"], 1):
        status_label = "PASSED" if tr["passed"] else "FAILED"
        print(f"     Test Case {i}: {status_label} (Expected: {tr['expected']}, Actual: {tr['actual']})")

    # Step 5: Test HR Behavioral Simulator
    print("\n[Step 5] Evaluating HR Behavioral STAR Response...")
    hr_payload = {
        "question_text": "Tell me about a time you had to deal with a conflict in your project team.",
        "user_transcript": (
            "During our last product sprint, the design and engineering teams had a major disagreement on database caching. "
            "The situation was causing a release delay. My task was to mediate the technical discussion. "
            "I organized an architecture review meeting where we benchmarked the queries and agreed on Redis caching. "
            "As a result, we met the sprint deadline with a 45% reduction in API response time."
        ),
        "category": "Conflict Resolution",
        "eye_contact_percent": 96.0,
        "posture": "Focused",
        "duration_seconds": 95
    }
    hr_res = client.post("/api/v1/interviews/hr/evaluate", json=hr_payload, headers=headers)
    assert hr_res.status_code == 200, f"HR evaluation failed: {hr_res.text}"
    hr_data = hr_res.json()
    print(f"  -> Overall Score: {hr_data['score']}%")
    print(f"  -> STAR Adherence: {hr_data['star_adherence']}%")
    print(f"  -> Grammar Score: {hr_data['grammar_score']}%")
    print(f"  -> Verbal Fillers Detected: {hr_data['filler_words_count']}")
    print(f"  -> Feedback: {hr_data['feedback']}")

    print("\n" + "=" * 60)
    print(">>> ALL CANDIDATE TEST CASE STEPS PASSED SUCCESSFULLY! <<<")
    print("=" * 60)

if __name__ == "__main__":
    run_candidate_test()
