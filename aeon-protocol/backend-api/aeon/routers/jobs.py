from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from aeon.middleware.auth import require_user
from aeon.core.config import Settings
from aeon.services.supabase import SupabaseClient
from aeon.services.jobs import JobsService

router = APIRouter()


@router.get("")
async def list_jobs(limit: int = 20, offset: int = 0, status: str | None = None, user=Depends(require_user)) -> dict:
    settings = Settings(); settings.validate_required()
    supabase = SupabaseClient(settings)
    svc = JobsService(supabase)
    items = await svc.list(user["sub"], limit=limit, offset=offset, status=status)
    return {"items": items}


@router.get("/{job_id}")
async def get_job(job_id: str, user=Depends(require_user)) -> dict:
    settings = Settings(); settings.validate_required()
    supabase = SupabaseClient(settings)
    svc = JobsService(supabase)
    job = await svc.get(job_id)
    if not job or job.get("user_id") != user["sub"]:
        raise HTTPException(status_code=404, detail="Not found")
    return job
