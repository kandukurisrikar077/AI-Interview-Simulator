# IntervueAI — AI Interview Simulator

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016%20%7C%20Alembic-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Security](https://img.shields.io/badge/Security-AST%20Sandbox%20%7C%20JWT%20Hardened-green)](docs/SECURITY_IMPROVEMENTS.md)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**IntervueAI** is an enterprise-grade AI-powered interview simulation platform designed for candidates and recruiters. It features multi-modal interview rooms, conversational voice recognition, sandboxed Monaco coding environments, HR behavioral evaluation via the STAR methodology, dynamic candidate assessment roadmaps, automated ReportLab PDF reports, and AI-assisted recruitment pipelines.

---

## 🚀 Key Architectural Highlights

1. **Enterprise Security Hardening**
   - **Sandboxed Code Execution:** Multi-layer Python execution environment utilizing AST static syntax tree analysis to block malicious modules (`os`, `sys`, `subprocess`, file I/O, dunder traversal), combined with isolated subprocess execution (clean environment with zero server secrets, non-root runner, 3.0s strict timeouts, and memory/output limits).
   - **Hardened JWT Authentication:** Pydantic validators enforcing cryptographically strong keys (>= 32 chars) in production with fast-fail safety, 60-minute token rotation, and explicit HS256 algorithm enforcement.
   - **Role-Based Access Control (RBAC):** Backend dependency guards (`get_current_recruiter_user`) enforcing authorization across all recruiter campaigns, jobs, candidates, and team endpoints.

2. **Relational Database & Versioning**
   - **PostgreSQL 16 Engine:** Migrated from file-based SQLite to PostgreSQL with connection pooling (`pool_size=10`, `max_overflow=20`, `pool_pre_ping=True`, `pool_recycle=3600`).
   - **Alembic Migrations:** Automated schema versioning (`alembic upgrade head`) and rollback tracking.
   - **Zero Data Loss Migration:** Automated data transfer script preserving all user accounts, resumes, jobs, and questions with PostgreSQL sequence resynchronization.

3. **Complete Feature Integrations**
   - **Tiered Subscription System:** Real-time plan management (Free, Pro, Enterprise) backed by database models and `/api/v1/subscription` endpoints.
   - **HR Behavioral Simulator:** STAR-method behavioral question engine with browser Web Speech API voice capture, filler-word counters, posture/eye-contact tracking, and real-time AI scoring.
   - **Collaborative Team Invitations:** Recruiter organization management with secure 32-character invitation tokens, role selection (Recruiter vs. Viewer), and one-click revocation.
   - **Grounded Social Profile Optimizer:** LinkedIn and GitHub profile audit grounded with user-provided headlines and repository summaries to eliminate LLM URL hallucination.
   - **Global Error Boundary Protection:** Top-level React error boundary preventing white-screen crashes and providing seamless recovery navigation.

4. **Production Deployment Ready**
   - **Vercel Frontend:** Optimized React 19 SPA with single-page client rewrites via `vercel.json`.
   - **Render Backend & PostgreSQL:** Infrastructure as Code via `render.yaml` with automated database migrations and health check probes (`/health`, `/health/db`).
   - **Docker Compose:** Multi-container production stack orchestrating PostgreSQL 16, FastAPI backend, and Vite/Nginx frontend with container health checks.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Monaco Editor, Lucide Icons, Axios |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic v2, python-jose, bcrypt |
| **Database** | PostgreSQL 16, Alembic 1.15+, psycopg (v3) / psycopg2 |
| **AI Layer** | Google GenAI SDK (Gemini 2.5 Flash), OpenAI API (Fallback) |
| **Document Processing** | ReportLab (PDF generation), pypdf (Resume parsing) |
| **DevSecOps** | Docker, Docker Compose, AST Security Sandbox, Vercel, Render |

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18+ & npm
- **Python**: 3.11+
- **PostgreSQL**: 15+ running locally (or SQLite fallback)

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows PowerShell
# source venv/bin/activate    # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env
# Set DATABASE_URL="postgresql://postgres:password@localhost:5432/intervue_db"
# Set SECRET_KEY="your-cryptographically-secure-secret-key-32-chars-min"
# Set GEMINI_API_KEY="your-gemini-api-key"

# Apply database migrations
alembic upgrade head

# Start backend development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend

# Install node dependencies
npm install

# Start Vite dev server
npm run dev
```

Visit `http://localhost:5173` to access the application.

---

## 🐳 Docker Production Stack

Run the complete multi-container stack (PostgreSQL + FastAPI + Frontend):

```bash
# Start all containers
docker compose up --build -d

# Verify health status
docker compose ps
```

- **Frontend App**: `http://localhost` (port 80)
- **Backend API**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`
- **Liveness Probe**: `http://localhost:8000/health`
- **Database Probe**: `http://localhost:8000/health/db`

---

## 🧪 Automated Testing

Run the full backend test suite covering security, migrations, database queries, and integrated features:

```bash
cd backend
$env:PYTHONPATH="."
.\venv\Scripts\pytest.exe tests/ -v
```

Expected output:
```
tests/test_database.py .....             [ 23%]
tests/test_features_integration.py ....  [ 42%]
tests/test_security.py ............      [100%]
===================== 21 passed in 14.85s =====================
```

Verify frontend build and type-checking:
```bash
cd frontend
npm run build
```

---

## 📚 Technical Documentation

Comprehensive architectural and audit reports are maintained in [`docs/`](docs/):

- 📋 [**Implementation Baseline Report**](docs/IMPLEMENTATION_BASELINE.md): Comprehensive baseline audit and inspection.
- 🛡️ [**Security Improvements Report**](docs/SECURITY_IMPROVEMENTS.md): Sandboxed code runner, AST security analysis, JWT hardening, and RBAC implementation.
- 🐘 [**PostgreSQL Migration Report**](docs/POSTGRESQL_MIGRATION.md): Alembic schema versioning, connection pooling, and zero-data-loss transfer.
- 🚀 [**Production Deployment Guide**](docs/DEPLOYMENT_GUIDE.md): Vercel, Render, Docker Compose configurations, and health monitoring probes.
- 🧩 [**Feature Integration Report**](docs/FEATURE_INTEGRATION_REPORT.md): Subscriptions, HR Behavioral Simulator, Team Invites, Social Analyzers, and ErrorBoundary.
- 🏆 [**Final Master Implementation Report**](docs/FINAL_IMPLEMENTATION_REPORT.md): Complete multi-phase delivery certification.

---

## 📄 License
This project is licensed under the MIT License.
