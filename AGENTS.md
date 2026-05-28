# GitFlix — Agent Guide

## Project Overview

GitFlix transforms any public GitHub repository into a cinematic documentary-style video. It analyzes commit history, identifies key contributors and events, generates narration using an LLM, and produces a seven-scene animated film with subtitles and background music.

**Live:** [gitflix.netlify.app](https://gitflix.netlify.app)

**Architecture:** Monorepo with two independent services:
- **Backend** (`backend/`): FastAPI REST API + SSE streaming, Python 3.11+, managed with `uv`
- **Frontend** (`frontend/`): React 19 + TypeScript + Vite + Remotion 4, managed with `npm`

---

## Quick Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- GitHub personal access token
- Groq API key

### Backend Setup
```bash
cd backend
uv venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
uv pip install -r requirements.txt
```

Create `backend/.env`:
```env
GITHUB_TOKEN=your_github_personal_access_token
GROQ_API_KEY=your_groq_api_key
```

Start server:
```bash
uv run uvicorn main:app --reload
```

API runs at `http://localhost:8000`.

### Frontend Setup
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

Start dev server:
```bash
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## Development Workflow

### Package Management
- **Backend:** Always use `uv` for Python operations:
  - `uv run python script.py` — run Python scripts
  - `uv run uvicorn main:app --reload` — start dev server
  - `uv add package` — add dependency
  - `uv pip install -r requirements.txt` — install from requirements

- **Frontend:** Use `npm`:
  - `npm run dev` — start dev server
  - `npm run build` — production build (includes TypeScript check)
  - `npm run lint` — run ESLint
  - `npm run preview` — preview production build

### Code Style
- **Backend:** Python with standard formatting. No linter currently configured.
- **Frontend:** ESLint with React hooks and refresh plugins. TypeScript strict mode.

### Git Workflow
- Main branch: `main`
- Feature branches: descriptive names
- Conventional commit messages: `type(scope): description`

---

## Architecture

### Backend Pipeline
```
GitHub URL → Ingestion → Analytics → Agent → SSE Stream → Frontend
```

1. **Ingestion** (`ingestion/github_client.py`):
   - Fetches commits, contributors, and file histories from GitHub API
   - Uses PyGitHub with rate limiting (5000 requests/hour with token)
   - Returns `RepoData` Pydantic model

2. **Analytics** (`analytics/`):
   - Processes raw commit data into story elements
   - Identifies eras, ghost files, hero commits, plot twists
   - Calculates contributor statistics and commit trends
   - Returns analytics dict for LLM input

3. **Agent** (`agent/director.py`):
   - LangChain orchestration with Groq (`llama-3.1-8b-instant`)
   - Generates narration for 7 scenes
   - Uses LangChain tools to access analytics data
   - Returns `ScriptJSON` Pydantic model

4. **API** (`main.py`):
   - `GET /generate/stream` — SSE endpoint for real-time progress
   - `GET /health` — health check
   - In-memory cache with 10-minute TTL

### Frontend Architecture
```
App.tsx → Loading Screen → Remotion Player → 7 Scenes
```

1. **App.tsx**: Main component with three states (landing, loading, player)
2. **Loading**: Progress bar with SSE updates and cancel support
3. **Remotion**: Video player rendering 7 scenes with:
   - Animated subtitles
   - Donut chart animations (Scene S03)
   - Background music with fade transitions
   - Chapter navigation

### Key Data Models
- `RepoData`: Raw repository data from GitHub
- `CommitData`: Individual commit with metadata
- `ContributorStats`: Contributor profile with activity metrics
- `ScriptJSON`: Final output with all 7 scenes
- `Scene`: Individual scene with narration and visual data

---

## Testing

### Backend
- Schema tests: `backend/test_schemas.py`
- Run with: `uv run pytest` (if pytest installed) or `uv run python test_schemas.py`
- No comprehensive test suite currently exists

### Frontend
- No automated tests currently configured
- Manual testing via dev server

### Recommended Test Coverage
- Backend: Unit tests for analytics calculations, schema validation
- Frontend: Component tests for scene rendering, SSE handling

---

## Building

### Backend
No build step required. Python runs directly.

For production:
```bash
cd backend
uv pip install -r requirements.txt
uv run uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend
```bash
cd frontend
npm run build
```

Output in `frontend/dist/`. Deploy this directory to any static host.

---

## Deployment

### Backend (Render)
Configuration in `backend/render.yaml`:
- Service type: web
- Build: `pip install uv && uv sync`
- Start: `uv run uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `GITHUB_TOKEN`, `GROQ_API_KEY`, `ALLOWED_ORIGINS`

**SSE Headers:** Backend sends `X-Acel-Buffering: no` and `Cache-Control: no-cache` for compatibility.

### Frontend (Netlify)
- Build command: `npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_URL` (set to backend URL)

### Nginx Configuration (if applicable)
```nginx
proxy_buffering off;
proxy_cache off;
```

---

## Key Implementation Details

### SSE Streaming
- Server-sent events for real-time progress updates
- Event format: `data: {"stage": "...", "pct": N, "msg": "..."}\n\n`
- Stages: ingestion → analytics → agent → done
- Client uses native `EventSource` API

### Cancellation
- Client can cancel generation via close/refresh or cancel button
- Browser `beforeunload` shows confirmation dialog
- `navigator.sendBeacon()` sends cancel signal to backend
- Backend checks `cancel_event` between LLM calls and API requests
- Stops processing immediately instead of completing all calls

### Rate Limiting
- 5 requests per minute per IP (sliding window)
- In-memory storage (resets on restart)
- Returns HTTP 429 when exceeded

### Caching
- In-memory cache with 10-minute TTL
- Key: `(repo_url, tone)` tuple
- Prevents duplicate API calls for same request

### Error Handling
- Frontend: Try/catch on SSE JSON parsing, graceful error messages
- Backend: Error sanitization (no stack traces to client), logged server-side
- Pydantic validation catches malformed data early

---

## Environment Variables

| Variable | Service | Required | Purpose |
|----------|---------|----------|---------|
| `GITHUB_TOKEN` | Backend | Yes | GitHub API authentication |
| `GROQ_API_KEY` | Backend | Yes | LLM narration via Groq |
| `ALLOWED_ORIGINS` | Backend | No | CORS origins (default: localhost) |
| `VITE_API_URL` | Frontend | No | Backend URL (default: http://localhost:8000) |
| `RATE_LIMIT_MAX` | Backend | No | Max requests per window (default: 5) |
| `RATE_LIMIT_WINDOW` | Backend | No | Rate limit window in seconds (default: 60) |
| `GENERATION_TIMEOUT` | Backend | No | Max generation time in seconds (default: 180) |

---

## Project Structure

```
GitFlix/
├── backend/
│   ├── ingestion/
│   │   ├── __init__.py
│   │   └── github_client.py      # GitHub API client
│   ├── analytics/
│   │   ├── __init__.py
│   │   └── analyzer.py           # Commit analytics engine
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── director.py           # LLM orchestration
│   │   ├── tools.py              # LangChain tools
│   │   └── llm_balancer.py       # Model fallback system
│   ├── main.py                   # FastAPI application
│   ├── schemas.py                # Pydantic models
│   ├── pyproject.toml            # Python dependencies (uv)
│   ├── requirements.txt          # Python dependencies
│   └── render.yaml               # Render deployment config
└── frontend/
    ├── src/
    │   ├── App.tsx               # Main application component
    │   ├── main.tsx              # Entry point
    │   └── remotion/
    │       ├── Root.tsx          # Remotion composition root
    │       ├── GitflixVideo.tsx  # Video sequence orchestrator
    │       ├── Subtitle.tsx      # Animated subtitle component
    │       └── scenes/           # S01-S07 scene components
    ├── package.json              # Node.js dependencies
    ├── vite.config.ts            # Vite configuration
    └── tsconfig.json             # TypeScript configuration
```

---

## Common Tasks

### Add a New Backend Dependency
```bash
cd backend
uv add package-name
```

### Add a New Frontend Dependency
```bash
cd frontend
npm install package-name
```

### Run Both Services
Terminal 1:
```bash
cd backend && uv run uvicorn main:app --reload
```

Terminal 2:
```bash
cd frontend && npm run dev
```

### Test a Repository
1. Open `http://localhost:5173`
2. Enter a GitHub URL (e.g., `https://github.com/facebook/react`)
3. Select a tone
4. Click Generate Film
5. Monitor progress and watch the video

---

## Known Limitations

- GitHub API rate limits: ~700 calls per generation for large repos
- Groq API rate limits: 7 LLM calls per generation
- In-memory cache and rate limiter reset on server restart
- No persistent storage (no database)
- Frontend has no automated tests
- Backend test coverage is minimal

---

## Troubleshooting

### Backend won't start
- Check `.env` file exists with `GITHUB_TOKEN` and `GROQ_API_KEY`
- Verify Python 3.11+ is installed: `python --version`
- Ensure virtual environment is activated

### Frontend can't connect to backend
- Check `VITE_API_URL` in `.env` matches backend URL
- Verify backend is running on correct port
- Check browser console for CORS errors

### Generation fails
- Check backend logs for specific error
- Verify GitHub token has sufficient permissions
- Check Groq API key is valid and has quota
- Try a smaller repository first

### SSE stream disconnects
- Check for proxy buffering (nginx needs `proxy_buffering off`)
- Verify `X-Accel-Buffering: no` header is present
- Check network timeout settings
