# IntervueAI Simulator

IntervueAI is a premium, production-quality SaaS web application designed for comprehensive AI-driven interview preparation. It features multi-modal interview rooms, custom voice recognition, Monaco-based coding rounds, automatic scoring evaluation powered by the Google Gemini API, downloadable analytical reports, and built-in browser visibility & face-tracking malpractice safeguards.

---

## 🎨 Design & Aesthetics
- **Futuristic Premium UI**: Built with a sleek dark theme featuring modern glassmorphism panels, rich custom Tailwind CSS v4 colors, smooth gradients, and interactive animations using Framer Motion.
- **Micro-Animations**: Elevates UX with subtle transitions, button hover scaling, status trackers, and responsive layout elements.

---

## 🚀 Key Features

1. **User Authentication & Profile**
   - Direct, secure password hashing using bcrypt.
   - JWT stateless token validation middleware.
   - Protected API route wrappers and frontend router guards.

2. **Resume Upload & AI Parsing**
   - Drag-and-drop workspace supporting PDF uploads.
   - Pure Python text extraction layer (using `pypdf` with zero compile prerequisites).
   - Structured JSON entity extraction using the Google Gemini API (skills, work history, projects, and education mapping).

3. **Multi-Modal Interview Rooms**
   - Configurable mock settings (Technical, HR, Mixed, or Coding categories; Easy, Medium, or Hard difficulty; 10, 20, or 30 minute durations).
   - Camera checklist prep room validating audio and video hardware streams.
   - Live verbal interviewing featuring custom Web Speech API adapters for speech-to-text input and text-to-speech voice questioning.
   - Dynamic, multi-turn adaptive follow-up questioning driven by Gemini.

4. **Monaco Coding Round Workspace**
   - Resizable coding split-panels with Monaco Editor integrations.
   - Dynamic challenge generation (from user resume credentials) and syntax validation.
   - Real sandboxed execution workspace to compile and run Python code against dynamic test cases.

5. **Interchangeable AI Service Layer (Phase 8)**
   - Dual-provider support for Google Gemini and OpenAI APIs, switchable dynamically via `AI_PROVIDER` environment configuration.
   - Pydantic structured output mapping constraints on both models.
   - Real-time speech metrics analysis (grammar index, speaking pace WPM, filler word counts, character length).
   - Customized daily 7-day and 30-day learning roadmaps.

6. **Analytical Evaluations & PDF Summarizer**
   - Multi-dimensional scoring aggregates (technical, logic, communication, pace).
   - Custom, printable PDF generator powered by `ReportLab` incorporating speech metrics, strengths lists, and week-by-week checkpoints.
   - Complete question timeline logs, AI feedback items, and days-based improvement roadmap.

7. **Integrity & Malpractice Guard**
   - Client-side gaze and face tracking checking if user looks away.
   - Browser visibility monitors flagging tab switches, defocusing, and exit states.
   - Real-time malpractice alerts synced to the backend log schema.

---

## 🛠️ Technical Stack

### Frontend
- **React 19** & **TypeScript**
- **Vite** (Build system)
- **Tailwind CSS v4** & **Framer Motion**
- **Lucide Icons**
- **Monaco Editor** (`@monaco-editor/react`)
- **Axios** (API connection layer)

### Backend
- **FastAPI** (Python async framework)
- **SQLAlchemy ORM** & **SQLite** (development-ready)
- **Google GenAI SDK** (Gemini 2.5)
- **ReportLab** (PDF document processing)
- **pypdf** (Python PDF text parsing)
- **bcrypt** (Secure user password hashes)

---

## 📚 Project Documentation

Explore the following guides for detailed information:

1. 🚀 **[Installation & Setup Guide](docs/INSTALL.md)**: Steps to configure backend venv, install packages, populate DB, and launch the Vite dev server.
2. 🔌 **[API Documentation](docs/API.md)**: JSON validation endpoints, request/response models, and headers.
3. 📐 **[System Architecture](docs/ARCHITECTURE.md)**: Visual database ERDs, folder diagrams, design decisions, and data flow layers.
4. 🐳 **[Production Deployment](docs/DEPLOYMENT.md)**: Production Docker configs, PostgreSQL conversions, and nginx settings.

---

## 🐳 Quick Docker Production Deployment

To launch the entire platform in production containerized environment:

```bash
# Build and run containers
docker-compose up --build -d

# Verify services status
docker-compose ps
```

Services will be mapped to:
- **Frontend App**: `http://localhost` (port 80)
- **Backend API**: `http://localhost:8000`
- **Swagger Docs**: `http://localhost:8000/docs`
