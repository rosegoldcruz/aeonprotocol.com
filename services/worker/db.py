import os
import psycopg
from psycopg.rows import dict_row

def _dsn() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL missing")
    return url.replace("+asyncpg", "")

def update_project(project_id: str, **fields):
    dsn = _dsn()
    sets = ", ".join([f"{k} = %({k})s" for k in fields.keys()])
    params = {**fields, "pid": project_id}
    with psycopg.connect(dsn, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(f"UPDATE web_projects SET {sets}, updated_at = now() WHERE id = %(pid)s", params)
            conn.commit()

