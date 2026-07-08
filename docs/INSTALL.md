# Installation and Setup Guide - IntervueAI

Follow this step-by-step guide to set up and run IntervueAI on your local machine.

---

## System Requirements
- **Python**: version 3.10 to 3.14 (Ensure it is added to your system `PATH`)
- **Node.js**: version 18 or higher (LTS recommended)
- **Git**: (Optional) for cloning the repository

---

## 1. Backend Setup

The backend is built with FastAPI and uses SQLite as the default database.

### Step 1.1: Navigate to Backend directory
Open your terminal and navigate to the backend folder:
```bash
cd backend
```

### Step 1.2: Create and Activate Virtual Environment
Create a clean Python virtual environment to manage dependencies:

*On Windows (PowerShell/CMD):*
```powershell
python -m venv venv
.\venv\Scripts\activate
```

*On macOS/Linux:*
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 1.3: Install Dependencies
Install all required libraries using pip:
```bash
pip install -r requirements.txt
```

> [!NOTE]
> We use `pypdf` for parsing PDF files and `bcrypt` directly for hashing passwords to ensure cross-platform compatibility and zero build requirements.

### Step 1.4: Configure Environment Variables
Create a `.env` file in the `backend` folder based on `.env.example` in the project root:
```ini
PROJECT_NAME="IntervueAI"
SECRET_KEY="your-super-secret-jwt-key"
DATABASE_URL="sqlite:///./intervue.db"
GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
```
Get a free Gemini API Key from [Google AI Studio](https://aistudio.google.com/).

### Step 1.5: Run Backend Server
Run the FastAPI development server:
```bash
python run.py
```
The server will start on [http://127.0.0.1:8000](http://127.0.0.1:8000). You can access the interactive API docs (Swagger UI) at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

## 2. Frontend Setup

The frontend is a Vite + React 19 + TypeScript application.

### Step 2.1: Navigate to Frontend directory
Open another terminal window/tab and navigate to the frontend folder:
```bash
cd frontend
```

### Step 2.2: Install Node Dependencies
Install all NPM packages:
```bash
npm install
```

### Step 2.3: Run Frontend Development Server
Start the Vite dev server:
```bash
npm run dev
```
The application will run on [http://localhost:5173](http://localhost:5173) by default.

---

## 3. Running Integration Verification Tests
To run automated verification tests against the backend endpoints, activate the python virtual environment in the `backend` directory, install `requests` if needed, and execute the test scripts located in the scratch directory:

```bash
# Run Auth test
python C:\Users\DELL\.gemini\antigravity-ide\scratch\IntervueAI\backend\venv\Scripts\python.exe C:\Users\DELL\.gemini\antigravity-ide\brain\94c82ab8-5796-4783-8938-bbaf6a5ee2ac\scratch\test_auth.py

# Run Resume Parser test
python C:\Users\DELL\.gemini\antigravity-ide\scratch\IntervueAI\backend\venv\Scripts\python.exe C:\Users\DELL\.gemini\antigravity-ide\brain\94c82ab8-5796-4783-8938-bbaf6a5ee2ac\scratch\test_resume.py

# Run Interview Loop test
python C:\Users\DELL\.gemini\antigravity-ide\scratch\IntervueAI\backend\venv\Scripts\python.exe C:\Users\DELL\.gemini\antigravity-ide\brain\94c82ab8-5796-4783-8938-bbaf6a5ee2ac\scratch\test_interview_loop.py
```
All tests verify connectivity, auth flows, Gemini integration, database storage, and dynamic content synthesis.
