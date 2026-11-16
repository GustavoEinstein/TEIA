# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**T.E.I.A** (Tecendo a Educação com Inteligência Artificial) is a collaborative platform for teachers and educators to catalog, search, and validate pedagogical practices focused on integrating AI into K-12 education. Built as an extension project at Universidade de Brasília (UnB).

Key features:
- **Community Hub**: Dynamic feed for discovering practices and lesson plans, filterable by subject, grade level, and AI model used
- **AI Auto-Cataloging (Gemini/Local LLM)**: Teachers describe lessons informally; AI fills official forms generating BNCC-aligned structured proposals
- **Double-Blind Peer Review**: Gamified validation - practices need approvals from other teachers to publish
- **Gamification & Levels**: XP system unlocking titles (e.g., "Prof. Conectado(a)")
- **Lesson Plan Export**: Transforms practices into PDF documents following IFB/MEC institutional format

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Django 5.2, Python 3.x, DRF 3.14, JWT (SimpleJWT) |
| Frontend | React 19, Vite 7, React Router 7, Tailwind CSS 4 |
| Database | SQLite (local), PostgreSQL (production) |
| AI/LLM | Google Gemini, Ollama (local), UnB LiteLLM router |
| PDF Generation | WeasyPrint |
| Auth | JWT Bearer tokens, email/password with reset flow |

## Project Structure

```
TEIA/
├── backend/                    # Django project
│   ├── TCC_DjangoScrumKipo/    # Django settings, URLs, WSGI/ASGI
│   │   ├── settings.py         # Main config (env-driven)
│   │   └── urls.py             # Root URL conf
│   ├── kipo_playground/        # Main app
│   │   ├── models.py           # User profiles, productions, reviews, forum, diary, gamification
│   │   ├── views.py            # 66K lines - ALL API endpoints
│   │   ├── urls.py             # API routes (86 endpoints)
│   │   ├── services/
│   │   │   ├── llm.py          # LLM providers (Gemini, Ollama, UnB)
│   │   │   └── pdf.py          # PDF generation with WeasyPrint
│   │   └── migrations/
│   ├── bncc_fatiada/           # BNCC curriculum data (JSON by grade)
│   ├── requirements.txt        # Python dependencies
│   ├── manage.py
│   └── .env                    # Environment variables
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── components/         # Reusable UI (Header, Sidebar, etc.)
│   │   ├── pages/              # 30+ page components
│   │   ├── services/           # API client (axios)
│   │   ├── hooks/              # Custom React hooks
│   │   └── config/             # API base URL
│   ├── package.json
│   ├── vite.config.js
│   └── .env                    # VITE_API_URL
├── docker-compose.yml          # Container orchestration
└── readme.md                   # Project documentation
```

## Common Development Commands

### Backend (run from `/home/teia/TEIA/backend` with venv activated)

```bash
# Environment setup
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Database
python manage.py migrate                    # Apply migrations
python manage.py makemigrations             # Create migrations after model changes
python manage.py createsuperuser            # Create admin user

# Development server
python manage.py runserver                  # Runs on http://127.0.0.1:8000

# Testing
python manage.py test                       # Run all tests
python manage.py test kipo_playground       # Run app-specific tests

# LLM Configuration (.env file)
LLM_PROVIDER=local          # Options: local, unb, gemini
LOCAL_LLM_URL=http://127.0.0.1:11434/v1
LOCAL_LLM_MODEL=qwen3:8b
GEMINI_API_KEY=your_key     # Required if LLM_PROVIDER=gemini
```

### Frontend (run from `/home/teia/TEIA/frontend`)

```bash
# Install dependencies
npm install

# Development server
npm run dev                 # Runs on http://localhost:5173

# Production build
npm run build

# Linting
npm run lint

# Preview production build
npm run preview
```

### Docker (from repo root)

```bash
docker-compose up -d        # Start all services
docker-compose logs -f      # View logs
docker-compose down         # Stop services
```

## High-Level Architecture

### Backend (Django)

**Single App Design**: All logic lives in `kipo_playground` app - no app separation.

**Key Models** (`models.py`):
- `Profile` - User extension with disciplina, school, gamification (XP, levels, badges)
- `Producao` - Core entity: pedagogical practices with BNCC codes, AI metadata, review status
- `Avaliacao` - Double-blind peer review with 6 scoring criteria
- `Topico`/`Comentario` - Forum system
- `DiarioOperacao` - Internal CRM for team operations
- `Conquista`/`ConquistaUsuario` - Badge system
- `ConfiguracaoXP` - Singleton for XP rewards configuration

**API Endpoints** (`urls.py` - 86 routes):
- Auth: `/api/token/`, `/api/register/`, password reset
- Profile: `/api/user/me/`, notifications
- Productions: CRUD + AI cataloging (`/auto-catalog-ai/`), PDF export, Qwen planner
- Review: queue listing, submission, history
- Public: feed, ranking
- Forum: topics/comments
- Admin: user management, productions, forum, gamification, diary, settings

**LLM Provider Pattern** (`services/llm.py`):
- Abstract `BaseLLMProvider` with shared prompt template & JSON sanitization
- Concrete: `LocalOllamaProvider`, `UnbAIProvider`, `GeminiProvider`
- Selected via `LLM_PROVIDER` env var, instantiated by `get_llm_provider()`

### Frontend (React)

**Routing** (`App.jsx`):
- Public routes: `/`, `/login`, `/register`, legal pages
- Private routes (wrapped in `PrivateRoute`): dashboard with nested routes
- 30+ page components covering all features

**State Management**: React Context + localStorage for JWT tokens
**API Client**: Axios with interceptor (`api-usuario-login.js`) for auth header injection

## Important Patterns & Conventions

### Environment Configuration
All secrets via `.env` files (never committed). Backend uses `python-dotenv`, frontend uses Vite's `import.meta.env.VITE_*` prefix.

### BNCC Handling
BNCC codes stored as `"CÓDIGO - Descrição completa"` strings, separated by `\n\n`. LLM prompts strictly forbid inventing codes - only real BNCC codes allowed.

### Gamification
XP thresholds: 100 → 400 → 1000 → 2500. Levels defined in `Profile.get_nivel()`. XP sources configurable via `ConfiguracaoXP` singleton.

### Double-Blind Review
`Avaliacao` links `Producao` + `revisor` (User). Reviewers don't see author unless `exibir_autor=True` AND status is `Aprovado`/`Concluído`. Minimum 1 approval required (configurable).

### PDF Generation
`ExportProducaoPDFView` uses WeasyPrint with Django template. Requires GTK3 runtime on Windows, Pango/Cairo on Linux.

## Critical Workflows

### Adding a New AI Cataloging Feature
1. Add endpoint in `kipo_playground/urls.py`
2. Create view in `views.py` using `get_llm_provider().catalog_production(text)`
3. Add frontend page/component calling the API
4. Update prompt in `services/llm.py` if schema changes

### Running Locally (Two Terminals)

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Common Issues
- **WeasyPrint fails**: Install system deps (Linux: `libpango-1.0-0 libharfbuzz0b...`; Windows: GTK3 Runtime)
- **CORS errors**: Ensure `CORS_ALLOW_ALL_ORIGINS=True` in settings or configure specific origins
- **LLM timeout**: Increase timeout in provider classes (default 120s)
- **Migration conflicts**: Check `requirements.txt` for `Django>=4.2,<5.0` and `asgiref>=3.6.0` compatibility

## Key Files Reference

| File | Purpose |
|------|---------|
| `backend/kipo_playground/models.py` | All data models (319 lines) |
| `backend/kipo_playground/views.py` | All API logic (66K lines) |
| `backend/kipo_playground/services/llm.py` | LLM provider abstraction |
| `backend/TCC_DjangoScrumKipo/settings.py` | Django configuration |
| `frontend/src/App.jsx` | Route definitions |
| `frontend/src/components/PrivateRoute.jsx` | Auth protection |
| `frontend/vite.config.js` | Vite + Tailwind config |
| `docker-compose.yml` | Production deployment |

## Testing

No formal test suite exists yet (`tests.py` is minimal). When adding tests:
```bash
# Run Django tests
python manage.py test

# Frontend (if configured)
npm run test
```

## Deployment Notes

- Production uses `DEBUG=False`, proper `SECRET_KEY`, restricted `ALLOWED_HOSTS`
- Static files: `python manage.py collectstatic` → served by nginx
- Media files: Configure persistent volume for `MEDIA_ROOT`
- SSL: Terminate at reverse proxy (nginx/traefik)
- Email: Configure SMTP credentials in `.env` for password reset