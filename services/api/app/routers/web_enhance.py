from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid, json
from sqlalchemy import text

from ..database.neon_db import get_db
from ..auth import verify_bearer

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

async def llm_complete_json(_: dict) -> dict:
    # Stubbed minimal valid spec
    return {
        "site_type": "saas",
        "brand": {"name": "AEON", "tagline": "", "logo_url": "", "palette": ["#111","#7c3aed","#06b6d4"]},
        "theme": {"font_primary": "Inter", "rounded": "xl", "dark_mode": True},
        "domain": None,
        "features": {"auth": True, "blog": False, "pricing": True, "cms": "local", "analytics": "posthog"},
        "ecommerce": {"enabled": False, "provider": "stripe", "currency": "USD", "products": []},
        "pages": [
            {"path": "/", "sections": [{"type": "hero", "h1": "Welcome", "sub": "", "cta": {"label": "Get started", "href": "/signup"}}]},
            {"path": "/pricing", "sections": [{"type": "pricing", "plans": [{"id": "pro", "price": 2900, "interval": "mo"}]}]}
        ],
        "integrations": {"clerk": True, "supabase": True, "stripe": True},
        "routing": {"basePath": "/"},
        "seo": {"title": "", "description": "", "og_image_url": ""},
        "scaffold": {"package_manager": "pnpm", "app_dir": True, "shadcn": True}
    }

@router.post("/webspec")
async def enhance_webspec(req: EnhanceReq, db=Depends(get_db), user=Depends(verify_bearer)):
    out = await llm_complete_json({"system": SYSTEM, "input": {"prompt": req.raw, "session": req.session_context or {}}})
    enh_id = str(uuid.uuid4())
    uid = (user or {}).get("sub") or (user or {}).get("user_id") or (user or {}).get("id")
    if not uid:
        raise HTTPException(status_code=401, detail="user not authenticated")
    await db.execute(
        text("""
        INSERT INTO web_enhancements (id, user_id, raw, webspec_json, created_at)
        VALUES (:id, :uid, :raw, cast(:spec as jsonb), :ts)
        """),
        {"id": enh_id, "uid": uid, "raw": req.raw, "spec": json.dumps(out), "ts": datetime.now(timezone.utc)},
    )
    await db.commit()
    return {"enhancement_id": enh_id, "webspec": out}

