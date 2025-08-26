from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid, json
from sqlalchemy import text

from ..database.neon_db import get_db
from ..auth import verify_bearer
from ..llm.client import complete_json
from fastapi_limiter.depends import RateLimiter

router = APIRouter(prefix="/v1/enhance", tags=["webspec"])

SYSTEM = """
You are AEON’s Prompt Enhancer for zero-code web apps.
Rewrite user input into a strict WebSpec v1 JSON (no comments, no extra keys).
Defaults: Next.js 14 App Router, Tailwind + shadcn/ui, Clerk auth, Stripe checkout, Supabase.
Fill sensible defaults if unspecified. Always include at least '/', '/pricing' for SaaS or '/' and '/products' for store.
Return ONLY JSON.
"""

class EnhanceReq(BaseModel):
    raw: str
    session_context: Optional[Dict[str, Any]] = None

@router.post("/webspec", dependencies=[Depends(RateLimiter(times=60, seconds=60))])
async def enhance_webspec(req: EnhanceReq, db=Depends(get_db), user=Depends(verify_bearer)):
    out = await complete_json(system=SYSTEM, input={"prompt": req.raw, "session": req.session_context or {}})
    enh_id = str(uuid.uuid4())
    uid = (user or {}).get("sub") or (user or {}).get("user_id") or (user or {}).get("id")
    if not uid:
        raise HTTPException(status_code=401, detail="user not authenticated")
    await db.execute(
        text("""
        INSERT INTO web_enhancements (id, user_id, raw, webspec_json, created_at)
        VALUES (:id, :uid, :raw, :spec::jsonb, :ts)
        """),
        {"id": enh_id, "uid": uid, "raw": req.raw, "spec": json.dumps(out), "ts": datetime.now(timezone.utc)},
    )
    await db.commit()
    return {"enhancement_id": enh_id, "webspec": out}

