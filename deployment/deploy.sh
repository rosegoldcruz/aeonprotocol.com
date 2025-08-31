#!/usr/bin/env bash
set -euo pipefail

COMPOSE=deployment/docker-compose.production.yml

echo "[deploy] pulling images…"
docker compose -f "$COMPOSE" pull

echo "[deploy] applying migrations…"
# api entrypoint already runs alembic; we only need to restart to pick new image

echo "[deploy] restarting stack…"
docker compose -f "$COMPOSE" up -d --remove-orphans

echo "[deploy] pruning old images…"
docker image prune -f

echo "[deploy] health check…"
set +e
for i in {1..30}; do
  if curl -fsS http://localhost/api/health >/dev/null; then
    echo "[deploy] API healthy"
    break
  fi
  sleep 2
done
if ! curl -fsS http://localhost/api/health >/dev/null; then
  echo "[deploy] API failed health after rollout"
  docker compose -f "$COMPOSE" logs --no-color api | tail -n 200
  exit 1
fi

for i in {1..30}; do
  if curl -fsS http://localhost/ >/dev/null; then
    echo "[deploy] Web healthy"
    exit 0
  fi
  sleep 2
done

echo "[deploy] Web failed health after rollout"
docker compose -f "$COMPOSE" logs --no-color web | tail -n 200
exit 1 