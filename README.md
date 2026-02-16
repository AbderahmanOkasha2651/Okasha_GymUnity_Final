# GymUnity

GymUnity is a full-stack, AI-powered fitness platform built as a graduation project. It combines a modern API backend with an intelligent training assistant to help athletes and coaches plan workouts, track progress, and receive corrective feedback.

## Key Features
- JWT authentication (register, login, protected routes)
- User roles: Athletes and Coaches
- Clean, modular project structure
- API documentation with Swagger UI
- SQLite database for development

## Planned Features
- Workout and exercise management
- Progress tracking and analytics
- AI-powered fitness system:
  - Computer vision for exercise posture detection (MediaPipe / OpenPose)
  - RAG pipeline for Arabic corrective feedback
  - Curated knowledge base from trusted fitness sources
- React frontend for the user experience

## Tech Stack
- Backend: FastAPI (Python)
- Auth: JWT (access tokens)
- Database: SQLite (gymunity.db)
- API Docs: Swagger UI (auto-generated)
- Frontend: React (planned)

## Project Structure (High-Level)
```
backend/
  main.py
  app/
    api/
      routes/
    core/
    db/
    models/
    schemas/
frontend/ (planned)
```

## Installation & Running

### Backend
1. Create and activate a virtual environment.
2. Install dependencies.
3. Start the API server.

#### Windows (PowerShell)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Linux/macOS (bash)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (Planned)
The frontend will be built with React and will consume the FastAPI endpoints.

## API Usage (Swagger)
When the server is running, open the Swagger UI at:
```
http://127.0.0.1:8000/docs
```
Use it to explore endpoints and test authentication flows.

## Roadmap
- Complete frontend implementation
- Workout programs and exercise library
- User progress dashboards
- AI posture detection and feedback generation
- Arabic coaching assistant powered by RAG
- Expanded knowledge base and recommendations

## Notes
- This repository contains both backend code and frontend plans for the GymUnity graduation project.
- No production credentials are included.
