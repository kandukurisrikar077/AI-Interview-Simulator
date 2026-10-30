# IntervueAI — Production Deployment Guide

## 1. System Architecture Overview

IntervueAI is architected as a decoupled modern full-stack web application:

- **Frontend:** Single Page Application (SPA) built with React 19, TypeScript, and Vite, deployed on **Vercel** with global edge CDN distribution and client-side route rewrites.
- **Backend:** High-performance asynchronous API built with FastAPI and Python 3.11+, deployed on **Render** (Web Service).
- **Database:** Managed relational **PostgreSQL 16** hosted on Render, provisioned via Infrastructure-as-Code (`render.yaml`) and versioned with **Alembic**.
- **Containerization:** Multi-container orchestration via `docker-compose.yml` for unified local reproduction and containerized hosting environments.

---

## 2. Health Monitoring & Probes

The backend exposes two specialized monitoring endpoints for cloud orchestrators:

### Liveness Probe — `GET /health`
Verifies that the web process is running and accepting HTTP connections:
```json
{
  "status": "healthy",
  "service": "IntervueAI Backend",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2026-10-30T17:30:58.528602+00:00"
}
```

### Readiness Probe — `GET /health/db`
Performs an active database ping (`SELECT 1`), measures round-trip latency in milliseconds, and validates connection pool health without leaking internal credentials:
```json
{
  "status": "connected",
  "database": "postgresql",
  "latency_ms": 1.51,
  "timestamp": "2026-10-30T17:30:58.536068+00:00"
}
```
*Note: Returns HTTP 503 `Service Unavailable` if the database connection drops.*

---

## 3. Environment Variables Reference

### Backend (`backend/.env` or Render Environment)

| Variable | Description | Required | Default / Example |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | Environment mode (`development` or `production`) | Yes | `production` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@host:5432/intervue_db` |
| `SECRET_KEY` | Cryptographic secret for JWT signing (>= 32 chars) | Yes | Auto-generated in production |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifespan | No | `60` |
| `AI_PROVIDER` | Primary AI provider (`gemini` or `openai`) | Yes | `gemini` |
| `GEMINI_API_KEY` | Google Gemini API key | Optional | `AIzaSy...` |
| `OPENAI_API_KEY` | OpenAI API key for fallback | Optional | `sk-proj-...` |
| `OPENAI_MODEL` | OpenAI model identifier | No | `gpt-4o-mini` |
| `CODE_SANDBOX_TIMEOUT_SECONDS` | Sandboxed Python runner execution timeout | No | `3.0` |
| `CODE_SANDBOX_MAX_CODE_CHARS` | Maximum submitted code size | No | `10000` |

### Frontend (`frontend/.env.production` or Vercel Environment)

| Variable | Description | Required | Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Full backend API v1 endpoint | Yes | `https://intervue-ai-backend.onrender.com/api/v1` |

---

## 4. Backend Deployment to Render

### Option A: Infrastructure as Code (`render.yaml`)
1. In your Render Dashboard, click **New +** -> **Blueprint**.
2. Connect your GitHub repository: `https://github.com/kandukurisrikar077/AI-Interview-Simulator`.
3. Render reads `render.yaml`, provisions `intervue-ai-db` (PostgreSQL) and `intervue-ai-backend` (Web Service) in the same private network.
4. Set secret environment variables (`GEMINI_API_KEY`, `OPENAI_API_KEY`) in the Render Dashboard.
5. Automatic deployment runs `alembic upgrade head` before serving traffic.

### Option B: Manual Service Creation
1. **Create PostgreSQL Database:**
   - Name: `intervue-ai-db`
   - Database: `intervue_db`
   - Copy the **Internal Database URL**.
2. **Create Web Service:**
   - Name: `intervue-ai-backend`
   - Root Directory: `backend`
   - Runtime: `Python 3`
   - Build Command: `pip install -r requirements.txt && alembic upgrade head`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Health Check Path: `/health`
   - Add environment variables (`DATABASE_URL`, `SECRET_KEY`, `ENVIRONMENT=production`, `AI_PROVIDER=gemini`).

---

## 5. Frontend Deployment to Vercel

1. In your Vercel Dashboard, click **Add New...** -> **Project**.
2. Import the GitHub repository: `kandukurisrikar077/AI-Interview-Simulator`.
3. Configure Project:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables:**
   - Add `VITE_API_URL` = `https://<your-render-backend-name>.onrender.com/api/v1`
5. Click **Deploy**.
6. Single-page navigation rewrites are handled by `frontend/vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

---

## 6. Local Docker Compose Deployment

To run the complete production-identical stack locally using Docker:

```bash
# Set your AI API keys (optional)
export GEMINI_API_KEY="your-gemini-key"
export SECRET_KEY="your-32-char-minimum-secret-key-12345"

# Build and start all services (Postgres + Backend + Frontend)
docker compose up --build -d
```

- Frontend: `http://localhost`
- Backend API: `http://localhost:8000`
- API Documentation (Swagger): `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`
- Database Health: `http://localhost:8000/health/db`

---

## 7. Troubleshooting & Verification

1. **CORS Errors:**
   If the browser blocks cross-origin requests, verify that the frontend domain matches CORS configuration in `backend/app/main.py`. The backend automatically allows `localhost` ports and regex `https://ai-interview-simulator-.*\.vercel\.app`.
2. **Database Migration Sync:**
   To manually re-apply or inspect migrations on Render:
   `alembic current` and `alembic upgrade head`.
3. **Cold Starts:**
   Render Free Web Services spin down after 15 minutes of inactivity. Pinging `/health` or upgrading to Starter eliminates cold start delays.
