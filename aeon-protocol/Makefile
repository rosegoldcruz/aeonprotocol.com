.PHONY: help dev fmt lint build up down clean install frontend-dev api-dev workers-dev

# Default target
help:
	@echo "AEON Protocol - Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  dev           - Start all services in development mode"
	@echo "  frontend-dev  - Start frontend development server"
	@echo "  api-dev       - Start API development server"
	@echo "  workers-dev   - Start Celery workers"
	@echo ""
	@echo "Code Quality:"
	@echo "  fmt           - Format all code (frontend + backend)"
	@echo "  lint          - Lint all code"
	@echo ""
	@echo "Build & Deploy:"
	@echo "  build         - Build all services"
	@echo "  up            - Start all services with Docker Compose"
	@echo "  down          - Stop all services"
	@echo ""
	@echo "Maintenance:"
	@echo "  clean         - Clean build artifacts and caches"
	@echo "  install       - Install all dependencies"

# Development targets
dev: install
	@echo "🚀 Starting AEON Protocol in development mode..."
	@trap 'kill 0' SIGINT; \
	(cd frontend && pnpm dev) & \
	(cd backend-api && uv run uvicorn aeon.main:app --reload --host 0.0.0.0 --port 8000) & \
	(cd backend-workers && uv run celery -A aeon.celery worker --loglevel=info) & \
	wait

frontend-dev:
	@echo "🎨 Starting frontend development server..."
	cd frontend && pnpm dev

api-dev:
	@echo "🔧 Starting API development server..."
	cd backend-api && uv run uvicorn aeon.main:app --reload --host 0.0.0.0 --port 8000

workers-dev:
	@echo "⚡ Starting Celery workers..."
	cd backend-workers && uv run celery -A aeon.celery worker --loglevel=info

# Installation
install:
	@echo "📦 Installing dependencies..."
	@if command -v nvm >/dev/null 2>&1; then \
		echo "Using Node.js version from .nvmrc"; \
		nvm use; \
	fi
	cd frontend && pnpm install
	cd backend-api && uv sync
	cd backend-workers && uv sync

# Code quality
fmt:
	@echo "🎨 Formatting code..."
	cd frontend && pnpm prettier --write .
	cd backend-api && uv run ruff format .
	cd backend-workers && uv run ruff format .

lint:
	@echo "🔍 Linting code..."
	cd frontend && pnpm eslint . && pnpm tsc --noEmit
	cd backend-api && uv run ruff check . && uv run mypy .
	cd backend-workers && uv run ruff check . && uv run mypy .

# Build
build:
	@echo "🏗️  Building all services..."
	cd frontend && pnpm build
	cd backend-api && uv build
	cd backend-workers && uv build

# Docker operations
up:
	@echo "🐳 Starting services with Docker Compose..."
	cd infra && docker-compose up -d

down:
	@echo "🛑 Stopping services..."
	cd infra && docker-compose down

# Maintenance
clean:
	@echo "🧹 Cleaning build artifacts..."
	cd frontend && rm -rf .next node_modules/.cache
	cd backend-api && rm -rf dist .mypy_cache __pycache__
	cd backend-workers && rm -rf dist .mypy_cache __pycache__
	docker system prune -f

# Database operations
migrate:
	@echo "🗄️  Running database migrations..."
	cd backend-api && uv run alembic upgrade head

migrate-create:
	@echo "📝 Creating new migration..."
	@read -p "Enter migration message: " msg; \
	cd backend-api && uv run alembic revision --autogenerate -m "$$msg"

# Testing
test:
	@echo "🧪 Running tests..."
	cd frontend && pnpm test
	cd backend-api && uv run pytest
	cd backend-workers && uv run pytest

test-e2e:
	@echo "🔄 Running end-to-end tests..."
	cd scripts && python smoke.py

# Production helpers
deploy-frontend:
	@echo "🚀 Deploying frontend to Vercel..."
	cd frontend && vercel deploy --prod

deploy-backend:
	@echo "🚀 Building and pushing backend images..."
	cd infra && docker-compose -f docker-compose.prod.yml build
	cd infra && docker-compose -f docker-compose.prod.yml push

# Health checks
health:
	@echo "🏥 Checking service health..."
	@curl -f http://localhost:3000/api/health || echo "Frontend: ❌"
	@curl -f http://localhost:8000/health || echo "API: ❌"
	@redis-cli ping >/dev/null && echo "Redis: ✅" || echo "Redis: ❌"