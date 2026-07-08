# Production Deployment Guide - IntervueAI

This guide details the strategy to containerize, configure, and deploy IntervueAI to production-grade environments.

---

## 1. Production Technology Stack
- **Database**: PostgreSQL (instead of SQLite)
- **WSGI/ASGI Server**: Gunicorn with Uvicorn workers
- **Static Assets Serving**: Nginx or CDN (Cloudflare/Vercel)
- **Containerization**: Docker & Docker Compose
- **SSL Certificate**: Let's Encrypt / Certbot

---

## 2. Docker Setup

You can containerize both frontend and backend services for clean horizontal scaling.

### Step 2.1: Backend Dockerfile
Create a `backend/Dockerfile` in production:
```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000"]
```

### Step 2.2: Frontend Dockerfile
Create a `frontend/Dockerfile` in production:
```dockerfile
# Step 1: Build the app
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Serve using Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom nginx configuration to handle React Router client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 3. Database Migration (SQLite to PostgreSQL)

To switch the FastAPI backend from SQLite to PostgreSQL, update the `DATABASE_URL` environment variable:

```ini
DATABASE_URL="postgresql://db_user:db_password@postgres-host:5432/intervue_prod"
```

SQLAlchemy ORM automatically maps tables. On startup, database schema tables will be initialized automatically in PostgreSQL using:
```python
# app/core/database.py
Base.metadata.create_all(bind=engine)
```

---

## 4. Production Security Hardening Checklist

1. **Disable Swagger UI (Optional)**:
   Hide backend docs in production by adjusting FastAPI instance parameters in `app/main.py` based on `ENV` settings.
2. **Rotate Secrets**:
   Ensure `SECRET_KEY` is a long, cryptographically strong random string.
3. **Configure Strict CORS**:
   Set `ALLOWED_ORIGINS` to point strictly to your production domain name instead of wildcards:
   ```ini
   ALLOWED_ORIGINS=["https://intervue.ai", "https://app.intervue.ai"]
   ```
4. **HTTPS Encryption**:
   Ensure all network communications are served over SSL/TLS (HTTPS).
5. **Secure Cookies / localStorage**:
   When storing JWT, ensure transmission headers are signed, and clean frontend caches on logout.
