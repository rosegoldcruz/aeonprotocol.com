from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from ..database.neon_db import get_db
from ..auth import verify_bearer
import uuid, json, os
from datetime import datetime, timezone
from urllib.parse import urlparse
import redis as redis_lib

# Prefer REDIS_URL; fallback to host/port
REDIS_URL = os.getenv("REDIS_URL")
if REDIS_URL:
    parsed = urlparse(REDIS_URL)
    r = redis_lib.Redis(host=parsed.hostname or "redis", port=parsed.port or 6379, db=int((parsed.path or "/0")[1:]) or 0)
else:
    r = redis_lib.Redis(host=os.getenv("REDIS_HOST", "redis"), port=int(os.getenv("REDIS_PORT", "6379")), db=0)

router = APIRouter(prefix="/v1/webgen", tags=["webgen"])

@router.post("/commit")
async def commit(enhancement_id: str, auto_deploy: bool = True, db=Depends(get_db), user=Depends(verify_bearer)):
    res = await db.execute(text("select id, user_id, webspec_json from web_enhancements where id=:id"), {"id": enhancement_id})
    row = res.mappings().first()
    if not row:
        raise HTTPException(404, "enhancement not found")

    project_id = str(uuid.uuid4())
    await db.execute(
        text(
            """
            insert into web_projects (id, user_id, webspec_json, status, created_at)
            values (:id, :uid, :spec::jsonb, 'queued', :ts)
            """
        ),
        {"id": project_id, "uid": row["user_id"], "spec": json.dumps(row["webspec_json"]) if isinstance(row["webspec_json"], dict) else row["webspec_json"], "ts": datetime.now(timezone.utc)},
    )

    await db.execute(
        text("update web_enhancements set committed_at=:ts, project_id=:pid where id=:id"),
        {"pid": project_id, "id": enhancement_id, "ts": datetime.now(timezone.utc)},
    )
    await db.commit()

    r.lpush(
        "aeon:webgen_queue",
        json.dumps({
            "type": "generate_web_project",
            "project_id": project_id,
            "webspec": row["webspec_json"] if isinstance(row["webspec_json"], dict) else json.loads(row["webspec_json"]),
            "auto_deploy": auto_deploy,
        }),
    )

    return {"project_id": project_id, "status": "queued"}

