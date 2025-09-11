# AEON Protocol Monorepo

This repository contains the production monorepo for AEON Protocol.

## Structure

- `frontend` — Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui, Clerk
- `backend-api` — FastAPI 0.115+, Pydantic v2, Gunicorn/Uvicorn workers
- `backend-workers` — Celery 5 workers with Redis broker/result backend
- `infra` — Docker Compose stack and Nginx reverse proxy
- `shared` — Shared schemas and types (Python/TypeScript)
- `docs` — Runbooks, architecture docs, Grafana dashboards

## Tooling

- Node.js is pinned via `.nvmrc` (20.17.x). Package manager: pnpm
- Python is pinned via `.python-version` (3.11.x). Package manager: uv

## Make targets (root)

- `make dev` — Start local development (per-project commands)
- `make fmt` — Format code (frontend: prettier/eslint; backend: ruff)
- `make lint` — Lint all projects
- `make build` — Build containers/bundles
- `make up` — `docker compose up -d --build` under `infra`
- `make down` — `docker compose down` under `infra`

For full setup, configuration, and deployment steps, see `docs/runbook.md`.

