from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
import asyncio, json, time, os
from ..auth import verify_bearer
from ..s3_client import generate_presigned_url
from ..celery_client import celery_app
from redis.asyncio import from_url as redis_from_url
from sqlalchemy import select, update
from ..database import get_db
from ..models import Job as JobModel, JobStatus as JobStatusEnum, JobType as JobTypeEnum, Tenant

router = APIRouter(tags=["jobs"])

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
redis = redis_from_url(REDIS_URL, encoding="utf-8", decode_responses=True)

class CreateJob(BaseModel):
    type: str
    input_data: dict

status_map = {
    "PENDING": "queued",
    "RECEIVED": "queued",
    "STARTED": "processing",
    "RETRY": "processing",
    "SUCCESS": "completed",
    "FAILURE": "failed",
}

def _to_jobtype(v: str) -> JobTypeEnum:
    v = v.upper()
    if v.startswith("IMAGE"): return JobTypeEnum.IMAGE_GENERATION
    if v.startswith("VIDEO"): return JobTypeEnum.VIDEO_GENERATION
    if v.startswith("AUDIO"): return JobTypeEnum.AUDIO_GENERATION
    return JobTypeEnum.IMAGE_GENERATION

async def _ensure_tenant(db, slug: str) -> int:
    res = await db.execute(select(Tenant).where(Tenant.slug==slug))
    t = res.scalar_one_or_none()
    if t:
        return t.id
    # create minimal tenant record
    new_t = Tenant(name=slug, slug=slug)
    db.add(new_t)
    await db.commit()
    await db.refresh(new_t)
    return new_t.id

@router.post("/v1/jobs")
async def create_job(body: CreateJob, claims=Depends(verify_bearer), idempotency_key: str | None = Header(None, alias="Idempotency-Key"), db=Depends(get_db)):
    tenant_slug = (claims.get("org_id") or claims.get("sub") or "anon").replace(" ", "-")
    idem_key = None
    if idempotency_key:
        idem_key = f"idem:{tenant_slug}:{idempotency_key}"
        existing = await redis.get(idem_key)
        if existing:
            return {"id": int(existing), "status": "queued", "result_url": None}

    tenant_id = await _ensure_tenant(db, tenant_slug)

    job = JobModel(
        tenant_id=tenant_id,
        type=_to_jobtype(body.type),
        status=JobStatusEnum.PENDING,
        input_data=body.input_data,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Dispatch Celery and save provider task id
    if body.type.lower().startswith("image"):
        res = celery_app.send_task("worker.generate_image", kwargs={"prompt": body.input_data.get("prompt", ""), "job_id": job.id})
    elif body.type.lower().startswith("video"):
        res = celery_app.send_task("worker.generate_video", kwargs={"prompt": body.input_data.get("prompt", ""), "job_id": job.id})
    else:
        res = celery_app.send_task("worker.generate_image", kwargs={"prompt": body.input_data.get("prompt", ""), "job_id": job.id})

    await db.execute(update(JobModel).where(JobModel.id==job.id).values(provider_job_id=str(res.id)))
    await db.commit()

    if idem_key:
        await redis.setex(idem_key, 24*3600, str(job.id))

    await redis.hset(f"job:{job.id}", mapping={"status": "queued", "tenant": tenant_slug, "task_id": str(res.id)})
    return {"id": job.id, "status": "queued", "result_url": None, "created_at": job.created_at.isoformat() if job.created_at else None}

@router.get("/v1/jobs/{job_id}")
async def get_job(job_id: int, claims=Depends(verify_bearer), db=Depends(get_db)):
    result = await db.execute(select(JobModel).where(JobModel.id==job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "not found")

    task_id = job.provider_job_id
    result_url = None
    normalized = job.status.name.lower()
    if task_id:
        async_result = celery_app.AsyncResult(task_id)
        normalized = status_map.get(async_result.state.upper(), normalized)
        if normalized == "completed" and (not job.output_data):
            data = async_result.result or {}
            key = None
            if isinstance(data, dict):
                if "result_key" in data:
                    key = data["result_key"]
                elif "images" in data and data["images"]:
                    key = data["images"][0].get("s3_key")
                elif "videos" in data and data["videos"]:
                    key = data["videos"][0].get("s3_key")
            await db.execute(update(JobModel).where(JobModel.id==job.id).values(status=JobStatusEnum.COMPLETED, output_data=data))
            await db.commit()
            if key:
                result_url = generate_presigned_url(key)
    return {"id": job.id, "status": normalized, "result_url": result_url}

@router.get("/v1/jobs/stream")
async def stream_jobs(id: int | None = None, db=Depends(get_db)):
    async def gen():
        if not id:
            while True:
                yield {"event":"ping","data": json.dumps({"t": int(time.time())})}
                await asyncio.sleep(15)
        else:
            result = await db.execute(select(JobModel.provider_job_id).where(JobModel.id==id))
            task_id = result.scalar_one_or_none()
            if not task_id:
                yield {"event":"status","data": json.dumps({"id": id, "status": "queued"})}
                return
            last = None
            while True:
                async_result = celery_app.AsyncResult(task_id)
                status = status_map.get(async_result.state.upper(), "queued")
                if status != last:
                    yield {"event": "status", "data": json.dumps({"id": id, "status": status})}
                    last = status
                if status in ("completed","failed"):
                    break
                await asyncio.sleep(1)
    return EventSourceResponse(gen())

