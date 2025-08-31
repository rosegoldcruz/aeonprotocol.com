#!/usr/bin/env bash
set -euo pipefail

DATE=$(date +%F-%H%M%S)
FILE="/backup/pg-${DATE}.sql.gz"
export PGPASSWORD="${POSTGRES_PASSWORD}"

pg_dump -h postgres -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
  | gzip > "$FILE"

aws s3 cp "$FILE" "s3://${S3_BACKUP_BUCKET}/db/${DATE}.sql.gz" \
  --sse AES256
find /backup -type f -mtime +7 -delete 