# System Architecture & Design - IntervueAI

IntervueAI is architected around a modern full-stack web application structure that decouples the frontend client from the backend services. It prioritizes offline-first safety verification, reactive user flows, and structured data outputs from generative AI engines.

---

## 1. High-Level Architecture

```mermaid
graph LR
    User([User's Browser]) -->|HTTPS / Axios| API[FastAPI Gateway]
    User -->|Web Speech API| TTS[Text-to-Speech / Speech Recognition]
    User -->|Monaco Editor| Monaco[Monaco Code Sandbox]
    User -->|MediaPipe JS| Webcam[Webcam Gaze Tracking]
    
    API -->|JWT Authentication| Auth[Auth Guard / BCrypt]
    API -->|SQLAlchemy ORM| DB[(SQLite Database)]
    API -->|Google GenAI Client| Gemini[Gemini 2.5/Flash AI Engine]
    API -->|ReportLab Canvas| Report[PDF Report Engine]
    
    subgraph AI Processing
        Gemini -->|Structured Schema| ParseResume[Resume Parser]
        Gemini -->|Adaptive Prompts| GenQuestion[Question Generator]
        Gemini -->|Grading Prompt| EvalAnswer[Answer Scorer]
    end
```

---

## 2. Directory Structure and Component Mapping

```text
IntervueAI/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # API router gateways
│   │   │   └── v1/           # API endpoints (auth, resumes, interviews, coding)
│   │   ├── core/             # Base configurations (security, database engine)
│   │   ├── models/           # SQLAlchemy database schemas
│   │   ├── schemas/          # Pydantic validation models
│   │   ├── services/         # Third-party integrations (gemini, report lab, pdf parsers)
│   │   └── main.py           # Application entrypoint and middleware
│   ├── requirements.txt      # Python dependencies
│   └── run.py                # Server runner utility (Uvicorn configuration)
│
└── frontend/                 # Vite + React + TypeScript App
    ├── public/               # Public assets
    └── src/
        ├── assets/           # Global stylesheets and fonts
        ├── components/       # Shared reusable UI elements
        ├── context/          # React Auth and Interview Context hooks
        ├── hooks/            # Hardware stream validation hooks
        ├── pages/            # View components (Landing, Setup, Dashboard, Live, Coding, Report)
        ├── services/         # Axios API connection instance
        ├── types/            # TypeScript interfaces
        └── App.tsx           # React Router mapping
```

---

## 3. Database Schema Design (SQLAlchemy)

The application uses an relational database layout to map users to their profiles, uploaded resumes, multiple mock sessions, individual question results, and malpractice warnings:

```mermaid
erDiagram
    USER ||--o| RESUME : "uploads"
    USER ||--o{ INTERVIEW : "takes"
    INTERVIEW ||--o{ QUESTION : "contains"
    INTERVIEW ||--o{ MALPRACTICE_LOG : "records"

    USER {
        int id PK
        string email UK
        string password_hash
        string full_name
        datetime created_at
    }

    RESUME {
        int id PK
        int user_id FK
        json skills
        json experience
        json education
        json projects
        string file_path
        datetime uploaded_at
    }

    INTERVIEW {
        int id PK
        int user_id FK
        string type
        string difficulty
        int duration_minutes
        float score
        json roadmap
        string status
        datetime created_at
    }

    QUESTION {
        int id PK
        int interview_id FK
        string text
        string type
        string expected_answer
        string user_answer
        string transcript
        float score
        string feedback
        string category
        datetime created_at
    }

    MALPRACTICE_LOG {
        int id PK
        int interview_id FK
        string type
        datetime timestamp
        float confidence
        string severity
    }
```

---

## 4. Key Architectural Design Decisions

### 4.1. Client-Side Speech & Media Processing
- **Web Speech API**: Transcription and text-to-speech are processed natively inside the user's browser via the Web Speech API (`SpeechRecognition` and `SpeechSynthesis`). This removes the need for transferring large, multi-megabyte audio tracks to the server.
- **MediaPipe JS Client-Side Tracking**: Face detection, looking-away monitoring, and tab focus loss (`visibilitychange` API) are captured client-side in the browser. When an infraction is detected, a lightweight log payload is dispatched to the backend database `/api/v1/interviews/{id}/malpractice`. This saves server CPU and bandwidth.

### 4.2. Pure Python Parsing with zero binary builds
- **pypdf**: By using `pypdf` rather than `PyMuPDF` or `pdfminer`, we avoid the requirement for Visual Studio C++ compilers on Windows or system binary compiling on Linux during installation.
- **Direct bcrypt**: Direct imports of `bcrypt` password hashing instead of using legacy `passlib` layers ensures seamless execution under Python 3.12/3.13/3.14.

### 4.3. Schema-Forced Gemini Outputs
We use Gemini's structured response schema feature to guarantee that the AI returns exact JSON layouts:
- Resumes are forced to match the `ResumeSchema` structure.
- Coding questions are structured into `title`, `starter_code`, `test_cases`, and `language` parameters.
- Evaluations are structured into actionable `suggestions`, `roadmap`, and `skill_scores`.
This guarantees that the application never breaks due to unstructured raw text return blocks from the AI.
