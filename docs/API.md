# API Documentation - IntervueAI Backend

The backend endpoints are structured under `/api/v1` and handle User Registration, JWT authentication, Resume uploading & parsing, Interview sessions, Monaco Coding Challenge sandboxing, Malpractice logging, and Report generation.

---

## Authentication Header
Secure endpoints require the JSON Web Token (JWT) sent via the `Authorization` header:
```http
Authorization: Bearer <jwt_access_token>
```

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### Register User
- **URL**: `/register`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword123",
    "full_name": "Jane Doe"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "created_at": "2026-06-30T10:00:00.000000",
    "updated_at": "2026-06-30T10:00:00.000000"
  }
  ```

### Login User
- **URL**: `/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "Jane Doe",
      "created_at": "2026-06-30T10:00:00.000000"
    }
  }
  ```

### Get Current User Profile
- **URL**: `/me`
- **Method**: `GET`
- **Headers**: JWT Required
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "created_at": "2026-06-30T10:00:00.000000",
    "updated_at": "2026-06-30T10:00:00.000000"
  }
  ```

---

## 2. Resume Endpoints (`/api/v1/resumes`)

### Upload and Parse Resume PDF
- **URL**: `/upload`
- **Method**: `POST`
- **Headers**: JWT Required
- **Request Body**: `multipart/form-data` with key `file` (PDF file)
- **Response (201 Created)**:
  ```json
  {
    "id": 1,
    "user_id": 1,
    "skills": ["Python", "React", "TypeScript"],
    "experience": [
      {
        "company": "Tech Corp",
        "role": "Software Engineer",
        "duration": "2022 - Present",
        "description": "Built web applications..."
      }
    ],
    "education": [],
    "projects": [],
    "file_path": "uploaded_resumes/12345.pdf",
    "uploaded_at": "2026-06-30T10:15:00.000000"
  }
  ```

### Retrieve Uploaded Resume Data
- **URL**: `/me`
- **Method**: `GET`
- **Headers**: JWT Required
- **Response (200 OK)**: (Same structured JSON as output of `/upload`)

---

## 3. Interview Session Endpoints (`/api/v1/interviews`)

### Initialize Interview Session
- **URL**: `/`
- **Method**: `POST`
- **Headers**: JWT Required
- **Request Body**:
  ```json
  {
    "type": "technical", // "technical" | "hr" | "mixed" | "coding"
    "difficulty": "medium", // "easy" | "medium" | "hard"
    "duration_minutes": 20
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 2,
    "user_id": 1,
    "type": "technical",
    "difficulty": "medium",
    "duration_minutes": 20,
    "score": 0.0,
    "status": "created",
    "created_at": "2026-06-30T10:20:00.000000"
  }
  ```

### Start Session and Generate Q1
- **URL**: `/{interview_id}/start`
- **Method**: `POST`
- **Headers**: JWT Required
- **Response (200 OK)**:
  ```json
  {
    "id": 3,
    "interview_id": 2,
    "text": "What is the virtual DOM in React?",
    "type": "theory",
    "expected_answer": null,
    "user_answer": null,
    "transcript": null,
    "score": null,
    "feedback": null,
    "category": "React Frontend",
    "created_at": "2026-06-30T10:21:00.000000"
  }
  ```

### Submit Answer for a Question
- **URL**: `/{interview_id}/questions/{question_id}/submit`
- **Method**: `POST`
- **Headers**: JWT Required
- **Request Body**:
  ```json
  {
    "user_answer": "React uses virtual DOM to minimize direct updates..."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": 3,
    "interview_id": 2,
    "text": "What is the virtual DOM in React?",
    "type": "theory",
    "score": 85.0,
    "feedback": "Clear explanation of React diff reconciliation. Add practical details in the future.",
    "category": "React Frontend"
  }
  ```

### Request Adaptive Next Question
- **URL**: `/{interview_id}/next_question`
- **Method**: `POST`
- **Headers**: JWT Required
- **Response (200 OK)**: Returns the newly generated adaptive `QuestionResponse` model (JSON).

### Complete Interview & Run Aggregate Evaluation
- **URL**: `/{interview_id}/finish`
- **Method**: `POST`
- **Headers**: JWT Required
- **Response (200 OK)**:
  ```json
  {
    "id": 2,
    "score": 80.0,
    "status": "completed",
    "roadmap": {
      "suggestions": ["Study concurrency", "Practice clean interfaces"],
      "roadmap": ["Days 1-10: Read books", "Days 11-20: Practice coding"],
      "skill_scores": [{"skill": "Communication", "score": 75.0}]
    }
  }
  ```

### Log Malpractice Warning
- **URL**: `/{interview_id}/malpractice`
- **Method**: `POST`
- **Headers**: JWT Required
- **Request Body**:
  ```json
  {
    "type": "tab_switch", // "tab_switch" | "look_away" | "multiple_faces" | "phone_detected"
    "confidence": 0.95,
    "severity": "medium"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": 1,
    "interview_id": 2,
    "type": "tab_switch",
    "timestamp": "2026-06-30T10:25:00.000000",
    "confidence": 0.95,
    "severity": "medium"
  }
  ```

---

## 4. Coding Sandbox Endpoints (`/api/v1/coding`)

### Generate Challenge
- **URL**: `/{interview_id}/challenge`
- **Method**: `POST`
- **Headers**: JWT Required
- **Response (200 OK)**: Returns the coding Question object containing challenge meta in `expected_answer`.

### Run Python Sandbox
- **URL**: `/{interview_id}/run`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "code": "def two_sum(nums, target):\n    return [0, 1]",
    "language": "python",
    "test_cases": "[{\"input\": \"[2,7,11,15], 9\", \"output\": \"[0,1]\"}]"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "output": "Running test suite...\nTest Case 1: Input: [2,7,11,15], 9 | Expected: [0,1] | Result: PASSED\n\nExecution summary: All tests completed successfully!",
    "results": [
      {
        "input": "[2,7,11,15], 9",
        "expected": "[0,1]",
        "actual": "[0,1]",
        "passed": true
      }
    ]
  }
  ```

---

## 5. Report PDF Download Endpoint

- **URL**: `/api/v1/interviews/{interview_id}/report/download`
- **Method**: `GET`
- **Headers**: JWT Required (sent via query parameter `token` as well to support browser direct download: `/report/download?token=<token>`)
- **Response**: `application/pdf` binary stream. Generates printable analytical sheets including score charts, timeline breakdown, malpractice statistics, and improvement roadmap.
