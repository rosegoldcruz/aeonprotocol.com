import os
from urllib.parse import urlparse
import psycopg
from psycopg.rows import dict_row


def _to_sync_pg_dsn(db_url: str) -> str:
    # Convert asyncpg DSN to psycopg if needed
    if db_url.startswith("postgresql+asyncpg://"):
        return db_url.replace("postgresql+asyncpg://", "postgresql://", 1)
    if db_url.startswith("postgres://"):
        return db_url.replace("postgres://", "postgresql://", 1)
    return db_url


def update_project(project_id: str, **fields):
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not set; cannot update project")
        return
    dsn = _to_sync_pg_dsn(db_url)
    sets = ", ".join([f"{k} = %({k})s" for k in fields.keys()])
    params = {**fields, "pid": project_id}
    with psycopg.connect(dsn, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(f"UPDATE web_projects SET {sets}, updated_at = now() WHERE id = %(pid)s", params)
            conn.commit()

