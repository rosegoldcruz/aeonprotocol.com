# AEON Protocol Monorepo

This monorepo contains the production-ready codebase for AEON Protocol.

## Structure

- `frontend` — Next.js 14 (TypeScript, Tailwind, shadcn/ui, Clerk)
- `backend-api` — FastAPI 0.115+ (Python 3.11) with uvicorn/gunicorn
- `backend-workers` — Celery 5 workers with Redis
- `infra` — Docker Compose, Nginx reverse proxy, systemd unit files
- `shared` — Shared schemas and types (TypeScript/Python)
- `docs` — Runbooks, architecture, and handoff documentation
- `supabase` — SQL migrations and seeds
- `scripts` — Ops and smoke tests

## Tooling

- Node `20.17.x` via `.nvmrc`, pnpm for frontend
- Python `3.11.x` via `.python-version`, `uv` for dependency management

## Makefile targets

- `dev` — Run local dev stack
- `fmt` — Format code (FE/BE)
- `lint` — Lint code (FE/BE)
- `build` — Build Docker images
- `up` — `docker compose up -d`
- `down` — `docker compose down`

See `/docs/runbook.md` for full setup and deployment instructions.
