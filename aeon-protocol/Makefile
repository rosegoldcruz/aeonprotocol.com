SHELL := /usr/bin/bash

.PHONY: dev fmt lint build up down

uv := uv
pnpm := pnpm

## Run dev environments
dev:
	cd infra && docker compose up -d redis || true
	cd backend-api && $(uv) run uvicorn aeon_api.main:app --reload --port 8000 &
	cd backend-workers && $(uv) run -m celery -A aeon_workers.app worker --loglevel=INFO &
	cd frontend && $(pnpm) dev

## Format all
fmt:
	cd frontend && $(pnpm) fmt || true
	cd backend-api && $(uv) run ruff format . || true
	cd backend-api && $(uv) run ruff check --fix . || true
	cd backend-workers && $(uv) run ruff format . || true
	cd backend-workers && $(uv) run ruff check --fix . || true

## Lint all
lint:
	cd frontend && $(pnpm) lint || true
	cd backend-api && $(uv) run ruff check . || true
	cd backend-workers && $(uv) run ruff check . || true

## Build containers/bundles
build:
	cd frontend && $(pnpm) build
	cd backend-api && docker build -t aeon-api:latest .
	cd backend-workers && docker build -t aeon-workers:latest .

## Docker compose
up:
	cd infra && docker compose up -d --build

## Docker compose down
down:
	cd infra && docker compose down

