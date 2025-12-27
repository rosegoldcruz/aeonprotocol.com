from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

import redis

from aeon.middleware.auth import require_user
from aeon.core.config import Settings
from aeon.services.supabase import SupabaseClient
from aeon.services.credits import CreditsService
from aeon.services.jobs import JobsService
from aeon.services.tasks import enqueue_generate
from aeon.services.ratelimit import LeakyBucketLimiter, LeakyBucketConfig

router = APIRouter()


@router.post("")
async def create_music_job(user=Depends(require_user)) -> dict:
    settings = Settings(); settings.validate_required()
    supabase = SupabaseClient(settings)
    credits = CreditsService(supabase)
    jobs = JobsService(supabase)
    r = redis.Redis.from_url(settings.redis_url, decode_responses=True)
    limiter = LeakyBucketLimiter(r)
    if not limiter.allow(user["sub"], LeakyBucketConfig(capacity=10, leak_rate_per_sec=0.5)):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limited")
    cost = 20
    new_balance = await credits.debit(user["sub"], cost, "generate_music")
    job = await jobs.create_job(user["sub"], "music", {"prompt": ""}, cost, provider="elevenlabs")
    enqueue_generate("music", job["id"])  # fire-and-forget
    return {"job_id": job["id"], "balance": new_balance}
