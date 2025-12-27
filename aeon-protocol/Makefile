SHELL := /usr/bin/bash

.PHONY: dev fmt lint build up down

DEV_COMPOSE := ./infra/docker-compose.yml

# Start local development stack
dev:
	docker compose -f $(DEV_COMPOSE) up -d

# Format code
fmt:
	# Frontend formatting
	cd frontend && pnpm -s prettier --write . || true
	# Python formatting
	uvx ruff format backend-api backend-workers || true

# Lint code
lint:
	cd frontend && pnpm -s eslint . || true
	uvx ruff check backend-api backend-workers || true

# Build docker images
build:
	docker compose -f $(DEV_COMPOSE) build

# Bring up/down stack
up:
	docker compose -f $(DEV_COMPOSE) up -d

down:
	docker compose -f $(DEV_COMPOSE) down
