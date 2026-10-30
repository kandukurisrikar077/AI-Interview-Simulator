# INTERVUEAI — IMPLEMENTATION BASELINE REPORT
**Phase 0 Pre-Implementation Audit, Architecture Blueprint & Baseline Assessment**

---

> **Inspection Date:** October 30, 2026  
> **Repository:** `kandukurisrikar077/AI-Interview-Simulator`  
> **Absolute Workspace Root:** `D:\projects\AI Interview Simulator`  
> **Git Branch:** `main` | **Commit:** `3bcce23`  
> **Status:** Pristine Baseline Verified — No application source code modified yet.  

---

## 1. PROJECT METADATA & REPOSITORY STATUS

| Property | Value / Verification |
| :--- | :--- |
| **Exact Project Directory** | `D:\projects\AI Interview Simulator` |
| **Active Git Branch** | `main` |
| **Remote Origin URL** | `https://github.com/kandukurisrikar077/AI-Interview-Simulator.git` |
| **Latest Commit Hash** | `3bcce234497e282fea64d17a935427d30ecc2bf1` (Short: `3bcce23`) |
| **Latest Commit Message**| `Add signup email verification OTP` (September 2, 2026) |
| **Working Tree Status** | Clean (0 modified tracked files; only technical audit markdown files untracked) |

---

## 2. TECHNOLOGY STACK & RUNTIME BASELINE

### 2.1 System Runtimes Available on Host
- **Node.js:** `v24.22.1`
- **NPM:** `11.19.1` (`npm.cmd`)
- **Python System Runtime:** `3.14.8`
- **PostgreSQL Server:** `PostgreSQL 16.15` (Windows service `postgresql-x64-16` active and running on `localhost:5432`)

### 2.2 Frontend Package Manifest (`frontend/package.json`)
- **Core Framework:** React `^19.2.7`, React DOM `^19.2.7`
- **Language / Typing:** TypeScript `~6.0.2`, `@types/react` `^19.2.17`, `@types/react-dom` `^19.2.3`
- **Build Tooling:** Vite `^8.1.0`, `@vitejs/plugin-react` `^6.0.2`
- **Styling:** Tailwind CSS `^4.3.2`, `@tailwindcss/vite` `^4.3.2`
- **Routing:** React Router DOM `^7.18.1`
- **Networking:** Axios `^1.18.1`
- **Specialized UI:** `@monaco-editor/react` `^4.7.0` (Code Arena), `framer-motion` `^12.42.0` (Animations), `lucide-react` `^1.22.0` (Icons)
- **Linter:** `oxlint` `^1.69.0`

### 2.3 Backend Dependencies Manifest (`backend/requirements.txt`)
- `fastapi`
- `uvicorn[standard]`
- `sqlalchemy`
- `pydantic`
- `pydantic-settings`
- `python-jose[cryptography]`
- `passlib[bcrypt]`
- `python-multipart`
- `pypdf`
- `reportlab`
- `google-genai`
- `python-dotenv`
- `pillow` *(Identified in audit as unused)*
- `opencv-python-headless` *(Identified in audit as unused)*
- `email-validator`
- `openai`

---

## 3. CONFIGURATION & ENVIRONMENT VARIABLES (NAMES ONLY)

### 3.1 Backend Environment Variables (`backend/app/core/config.py` & `.env.example`)
1. `PROJECT_NAME` (Default: `"IntervueAI"`)
2. `API_V1_STR` (Default: `"/api/v1"`)
3. `SECRET_KEY` (Default: Hardcoded insecure fallback string)
4. `ALGORITHM` (Default: `"HS256"`)
5. `ACCESS_TOKEN_EXPIRE_MINUTES` (Default: `10080` / 7 days)
6. `DATABASE_URL` (Default: `sqlite:///{BACKEND_DIR}/intervue.db`)
7. `AI_PROVIDER` (Default: `"gemini"`)
8. `GEMINI_API_KEY` (Optional string)
9. `OPENAI_API_KEY` (Optional string)
10. `OPENAI_MODEL` (Default: `"gpt-4o-mini"`)
11. `SMTP_HOST` (Optional string)
12. `SMTP_PORT` (Default: `587`)
13. `SMTP_USERNAME` (Optional string)
14. `SMTP_PASSWORD` (Optional string)
15. `SMTP_FROM_EMAIL` (Optional string)

### 3.2 Frontend Environment Variables (`frontend/.env.production`)
1. `VITE_API_URL` (Configured: `https://ai-interview-backend-ihm5.onrender.com/api/v1`)

---

## 4. DATABASE BASELINE (CURRENT SQLITE STATE)

- **Engine:** SQLite 3 (`backend/intervue.db`, file size: 143,360 bytes)
- **ORM:** SQLAlchemy Declarative Base (`app.core.database`)
- **Connection Arguments:** `connect_args = {"check_same_thread": False}` when sqlite is detected.
- **Migration Architecture:** Imperative custom script `backend/migrate_now.py` and `migrate_db()` inside `app/main.py`. **Alembic is completely absent.**

### Table Inventory in Existing `intervue.db`:

| Table Name | Entity Model | Record Count | Baseline Content / Notes |
| :--- | :--- | :--- | :--- |
| `users` | `User` | **10** | Seed administrator (`admin@gmail.com`), test recruiters and candidates |
| `resumes` | `Resume` | **2** | Uploaded candidate resumes with extracted ATS scores |
| `interviews` | `Interview` | **0** | Session tracking table |
| `questions` | `Question` | **0** | Interview questions & answers |
| `malpractice_logs` | `MalpracticeLog` | **0** | Proctoring violation logs |
| `question_bank` | `QuestionBank` | **14** | Curated questions seeded at startup |
| `jobs` | `Job` | **3** | Requisitions posted by recruiter accounts |
| `campaigns` | `Campaign` | **3** | Hiring assessment campaigns |
| `campaign_candidates`| `CampaignCandidate` | **0** | Candidate application mapping |
| `social_analyses` | `SocialAnalysis` | **0** | LinkedIn & GitHub evaluation records |
| `aptitude_tests` | `AptitudeTest` | **0** | Completed aptitude test scores |
| `group_discussions` | `GroupDiscussion` | **0** | Group discussion session records |
| `certificates` | `Certificate` | **0** | Milestone certificates |
| `email_otps` | `EmailOTP` | **0** | 6-digit verification records |

---

## 5. EXISTING API ENDPOINTS BASELINE (60 ENDPOINTS)

- **Authentication (`/api/v1/auth`):**
  `register`, `login`, `login/access-token`, `me` (GET, PATCH, DELETE), `change-password`, `forgot-password`, `reset-password`, `verify-email`, `resend-verification`, `send-otp`, `verify-otp`, `refresh`.
- **Resumes (`/api/v1/resumes`):**
  `me` (GET), `upload` (POST).
- **Interviews (`/api/v1/interviews`):**
  `list` (GET), `create` (POST), `{id}` (GET), `{id}/start` (POST), `{id}/questions/{qid}/submit` (POST), `{id}/next_question` (POST), `{id}/malpractice` (POST), `{id}/finish` (POST), `{id}/pdf` (GET).
- **Coding (`/api/v1/coding`):**
  `{id}/challenge` (POST), `{id}/run` (POST - **CRITICAL RCE VULNERABILITY**).
- **Questions (`/api/v1/questions`):**
  `list` (GET), `create` (POST), `{id}` (GET), `{id}` (DELETE).
- **Recruiter (`/api/v1/recruiter`):**
  `onboard` (POST), `jobs` (GET, POST), `campaigns` (GET, POST), `candidates` (GET), `candidates/{id}/status` (PATCH), `stats` (GET).
- **Placement (`/api/v1/placement`):**
  `resume-builder/improve` (POST), `resume-builder/pdf` (POST), `cover-letter` (POST), `cover-letter/pdf` (POST), `linkedin` (POST), `github` (POST), `discussion/chat` (POST), `discussion/evaluate` (POST), `aptitude` (POST), `certificates` (GET, POST), `certificates/{id}/pdf` (GET).
- **Users Admin (`/api/v1/users`):**
  `list` (GET), `{id}/suspend` (PATCH), `{id}/role` (PATCH), `{id}/reset-password` (POST), `{id}` (DELETE).
- **Admin Stats (`/api/v1/admin`):**
  `stats` (GET), `interviews` (GET), `reset-database` (POST).
- **Analytics (`/api/v1/analytics`):**
  `me` (GET).

---

## 6. SECURITY DEFICIENCIES BASELINE

1. **CRITICAL — Arbitrary Code Execution (RCE) in Coding Sandbox:**
   In `backend/app/api/v1/coding.py`, user-submitted Python code is executed via `exec(code, namespace)` inside the primary backend process without sandboxing, container isolation, or filesystem/network restrictions.
2. **HIGH — Insecure Default JWT Secret:**
   In `backend/app/core/config.py`, `SECRET_KEY` falls back to `"supersecret_intervueai_key_change_me_in_prod_1234567890"` if not provided in the environment.
3. **MEDIUM — Excessive Token Lifetime:**
   JWT access tokens expire after 7 days (`10,080 minutes`) with no refresh token rotation or revocation blacklist.
4. **MEDIUM — Missing Health Check Endpoints:**
   FastAPI exposes only `@app.get("/")`, lacking dedicated `/health` and `/health/db` endpoints for cloud orchestrators (Render/Kubernetes).

---

## 7. MOCKED & INCOMPLETE MODULES BASELINE

1. **`Subscription.tsx`:** Pricing plans and upgrade confirmation dialog are purely frontend mocks using `mockDb` in `localStorage`. No backend model, no subscription tracking API, no webhook architecture.
2. **`HrSimulator.tsx`:** Behavioral HR interview simulator operates entirely client-side with hardcoded questions; does not call the backend AI service or persist session data.
3. **`TeamInvite.tsx`:** Recruiter team invitation modal simulates sending with `setTimeout` and local component state. No database model, no invite token, no acceptance workflow, no email dispatch.
4. **`SocialAnalyzer.tsx`:** LinkedIn and GitHub profile analysis passes the unverified URL string into the LLM prompt without real profile retrieval or data validation.
5. **Dead Components & Services:** `ErrorBoundary.tsx`, `LoadingSpinner.tsx`, `useApi.ts`, `useBrowserIntegrity.ts`, and `resumeService.ts` are unused.

---

## 8. DEPLOYMENT BASELINE

1. **Frontend (Vercel):** Configured URL `https://ai-interview-simulator-lovat.vercel.app` returns `HTTP 404 (DEPLOYMENT_NOT_FOUND)`.
2. **Backend (Render):** Configured URL `https://ai-interview-backend-ihm5.onrender.com` returns `HTTP 404 Not Found`.
3. **Docker Compose:** Configured with `sqlite:///./app.db`; no PostgreSQL service container declared.

---

## 9. IMPLEMENTATION PLAN OF ATTACK

- **Phase 1 (Security):**
  - Implement isolated execution architecture in `coding.py`.
  - Secure JWT configuration in `config.py` (fail-fast on missing secret, enforce HS256, reduce expiry).
  - Add comprehensive security tests (`test_security.py`).
  - Generate `docs/SECURITY_IMPROVEMENTS.md`.
- **Phase 2 (PostgreSQL & Alembic):**
  - Create backup `backend/intervue.db.backup`.
  - Add `psycopg2-binary` and configure connection pooling in `database.py`.
  - Initialize and configure Alembic with migrations.
  - Implement and run `migrate_sqlite_to_pg.py` transferring existing SQLite data to local PostgreSQL 16 `intervue_db`.
  - Generate `docs/POSTGRESQL_MIGRATION.md`.
- **Phase 3 (Deployment Restoration):**
  - Implement `/health` and `/health/db` endpoints in `main.py`.
  - Update `docker-compose.yml`, `render.yaml`, `Dockerfile` and Vercel settings.
  - Generate `docs/DEPLOYMENT_GUIDE.md`.
- **Phase 4 (Integrate Mocked Features):**
  - Create backend models & API for Subscriptions and Plans.
  - Connect `HrSimulator.tsx` to backend AI service.
  - Implement Team Invitations with secure tokens, DB persistence, and email dispatch.
  - Enhance Social Profile Analysis with structured input data validation.
  - Clean up / wire dead components.
  - Generate `docs/FEATURE_INTEGRATION_REPORT.md`.
- **Phase 5 & 6 (Testing & Final Docs):**
  - Execute end-to-end regression tests.
  - Update `README.md`.
  - Generate `docs/FINAL_IMPLEMENTATION_REPORT.md`.
  - Clean, logical Git commits.
