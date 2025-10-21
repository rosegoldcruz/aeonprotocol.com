set -e

echo "Waiting for Postgres and Redis..."
/wait-for-it.sh ${DATABASE_HOST:-postgres}:5432 -t 60
/wait-for-it.sh ${REDIS_HOST:-redis}:6379 -t 60

echo "Running migrations..."
export DATABASE_URL="${DATABASE_URL}"
cd /app/services/api && alembic upgrade head || exit 1
cd /app

echo "Starting API..."
exec uvicorn services.api.app.main:app --host 0.0.0.0 --port 8000
