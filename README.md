# HeadHeldHigh

A resume-to-job-matcher platform for laid-off professionals. Upload your resume, get AI-powered job matches, identify skills gaps, and be discovered by recruiters.

## Features

- **AI Resume Parsing** – Claude extracts skills, experience, job titles, and industries from uploaded PDFs/DOCX files
- **Live Job Search** – JSearch API aggregates postings from LinkedIn, Indeed, and Glassdoor
- **Smart Matching** – Claude scores each job 0–100 with reasons and missing skills, batched 10 per API call
- **Skills Gap Analysis** – Aggregates missing skills from top matches and produces a prioritized learning plan
- **Application Tracker** – Track status: saved → applied → interviewing → offered / rejected
- **Public Talent Pool** – Filterable directory of professionals, shared weekly with recruiters
- **Weekly Digest Export** – CSV export of new users from the last 7 days (admin feature)
- **Mock Mode** – Frontend works fully with mock data when backend isn't running

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | FastAPI (Python 3.11) + SQLAlchemy + SQLite |
| AI | Claude API (`claude-sonnet-4-6`) via Anthropic SDK |
| Jobs | JSearch API via RapidAPI |
| Containerization | Docker + Docker Compose |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- Anthropic API key
- (Optional) RapidAPI key for JSearch (mock data used if missing)

### 1. Clone and configure

```bash
cd /path/to/Headheldhigh

# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env and set your keys:
#   ANTHROPIC_API_KEY=sk-ant-...
#   RAPIDAPI_KEY=your_key_here

# Frontend environment (optional)
cp frontend/.env.example frontend/.env
```

### 2. Run the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Interactive docs: `http://localhost:8000/docs`.

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### 4. Run with Docker Compose

```bash
# Set environment variables
export ANTHROPIC_API_KEY=sk-ant-...
export RAPIDAPI_KEY=your_key_here

docker-compose up --build
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Mock Mode (frontend only)

If you want to run the frontend without a backend:

```bash
cd frontend
echo "VITE_MOCK_MODE=true" > .env
npm run dev
```

All API calls return realistic mock data. Useful for UI development.

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register a new user |
| POST | `/api/resumes/upload?user_id={id}` | Upload and parse a resume |
| GET | `/api/users/{id}/matches` | Get paginated job matches |
| GET | `/api/users/{id}/gap` | Get skills gap analysis |
| GET | `/api/jobs/refresh/{user_id}` | Fetch new jobs and score them |
| POST | `/api/applications` | Save/update an application |
| GET | `/api/applications/{user_id}` | Get user's applications |
| GET | `/api/talent-pool` | Browse public talent pool |
| GET | `/api/digest/weekly` | Weekly new users (JSON) |
| GET | `/api/digest/weekly/export` | Weekly new users (CSV download) |
| GET | `/api/stats` | Platform-wide statistics |
| GET | `/health` | Health check |

## Directory Structure

```
Headheldhigh/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, routes registration
│   │   ├── config.py          # Settings via pydantic-settings
│   │   ├── database.py        # SQLAlchemy engine + session
│   │   ├── models.py          # ORM models (User, Resume, JobPosting, JobMatch, Application)
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   ├── api/
│   │   │   ├── users.py       # User registration/profile
│   │   │   ├── resumes.py     # File upload + parsing
│   │   │   ├── jobs.py        # Job search + refresh
│   │   │   ├── matches.py     # Match retrieval + skills gap
│   │   │   ├── applications.py# Application tracking
│   │   │   ├── talent_pool.py # Public talent pool
│   │   │   └── digest.py      # Weekly digest + CSV export
│   │   └── services/
│   │       ├── resume_parser.py   # Claude: extract structured data
│   │       ├── job_searcher.py    # JSearch API integration
│   │       ├── job_matcher.py     # Claude: score jobs in batches
│   │       └── skills_analyzer.py # Claude: skills gap report
│   ├── uploads/               # Uploaded resume files
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx        # Hero + how it works + stats
│   │   │   ├── Onboarding.tsx     # 4-step wizard
│   │   │   ├── Dashboard.tsx      # Job matches + sidebar
│   │   │   ├── TalentPool.tsx     # Filterable talent grid
│   │   │   └── AdminDigest.tsx    # Admin weekly digest
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── ResumeUpload.tsx   # Drag-and-drop file upload
│   │   │   ├── JobCard.tsx        # Match card with score badge
│   │   │   ├── SkillsGapCard.tsx  # Gap analysis sidebar widget
│   │   │   ├── ApplicationTracker.tsx
│   │   │   ├── LinkedInInput.tsx
│   │   │   └── WeeklyDigestExport.tsx
│   │   ├── services/api.ts        # Axios API client + mock mode
│   │   └── types/index.ts         # TypeScript interfaces
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts             # Dev proxy to backend
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── README.md
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `RAPIDAPI_KEY` | No | RapidAPI key for JSearch (mock data if missing) |
| `DATABASE_URL` | No | SQLAlchemy URL (default: `sqlite:///./headheldhigh.db`) |
| `FRONTEND_URL` | No | Frontend origin for CORS (default: `http://localhost:5173`) |
| `UPLOAD_DIR` | No | Directory for uploaded resumes (default: `uploads`) |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `` (empty, uses proxy) | Backend URL for production builds |
| `VITE_MOCK_MODE` | `false` | Set to `true` for frontend-only development |

## How Claude is Used

1. **Resume Parsing** (`resume_parser.py`): Sends extracted text to Claude and asks for structured JSON (name, skills, experience_years, job_titles, industries, education, summary).

2. **Job Matching** (`job_matcher.py`): Batches 10 jobs per Claude call. Sends resume summary + job descriptions and asks Claude to return an array of `{score, reasons, missing_skills}` objects. Avoids re-scoring already-matched jobs.

3. **Skills Gap Analysis** (`skills_analyzer.py`): Aggregates `missing_skills` from the top 20 matches, ranks them by frequency, then asks Claude to produce a prioritized report with recommended learning resources.

All Claude calls use the `claude-sonnet-4-6` model and return plain JSON (no markdown).
