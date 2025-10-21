from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
import asyncio, json, time, os
from ..auth import verify_bearer
from ..s3_client import generate_presigned_url
from ..celery_client import celery_app
from redis.asyncio import from_url as redis_from_url
from sqlalchemy import select, update
from ..database.neon_db import get_db, Job as JobModel, JobStatus as JobStatusEnum, JobType as JobTypeEnum, Tenant, Asset

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

    await db.execute(update(JobModel).where(JobModel.id==job.id).values(external_job_id=str(res.id)))
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

    task_id = job.external_job_id
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



# --- Shim endpoints for current dashboard expectations ---
from pydantic import BaseModel, Field
from sqlalchemy import select as sa_select

class ImageGenerateBody(BaseModel):
    prompt: str
    model: str | None = None
    width: int | None = None
    height: int | None = None
    num_outputs: int | None = None
    guidance_scale: float | None = None
    num_inference_steps: int | None = None

@router.post("/v1/jobs/image-generate")
async def image_generate(body: ImageGenerateBody, claims=Depends(verify_bearer), db=Depends(get_db)):
    tenant_slug = (claims.get("org_id") or claims.get("sub") or "anon").replace(" ", "-")
    tenant_id = await _ensure_tenant(db, tenant_slug)
    job = JobModel(
        tenant_id=tenant_id,
        type=JobTypeEnum.IMAGE_GENERATION,
        status=JobStatusEnum.PENDING,
        input_data=body.model_dump(),
        provider="replicate",
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Build kwargs for worker
    kwargs = {"job_id": job.id}
    if body.width is not None: kwargs["width"] = body.width
    if body.height is not None: kwargs["height"] = body.height
    if body.num_outputs is not None: kwargs["num_outputs"] = body.num_outputs
    if body.guidance_scale is not None: kwargs["guidance_scale"] = body.guidance_scale
    if body.num_inference_steps is not None: kwargs["num_inference_steps"] = body.num_inference_steps

    res = celery_app.send_task("worker.generate_image", kwargs={"prompt": body.prompt, **kwargs})
    await db.execute(update(JobModel).where(JobModel.id==job.id).values(external_job_id=str(res.id)))
    await db.commit()
    return {"id": job.id, "status": "queued"}

class VideoGenerateBody(BaseModel):
    prompt: str
    provider: str | None = Field(default="runway")
    duration: int | None = 5
    resolution: str | None = "1280x768"
    video_type: str | None = "text_to_video"

@router.post("/v1/jobs/video-generate")
async def video_generate(body: VideoGenerateBody, claims=Depends(verify_bearer), db=Depends(get_db)):
    tenant_slug = (claims.get("org_id") or claims.get("sub") or "anon").replace(" ", "-")
    tenant_id = await _ensure_tenant(db, tenant_slug)
    job = JobModel(
        tenant_id=tenant_id,
        type=JobTypeEnum.VIDEO_GENERATION,
        status=JobStatusEnum.PENDING,
        input_data=body.model_dump(),
        provider=(body.provider or "runway"),
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    kwargs = {"job_id": job.id, "provider": body.provider or "runway", "video_type": body.video_type or "text_to_video"}
    if body.duration is not None: kwargs["duration"] = body.duration
    if body.resolution is not None: kwargs["resolution"] = body.resolution

    res = celery_app.send_task("worker.generate_video", kwargs={"prompt": body.prompt, **kwargs})
    await db.execute(update(JobModel).where(JobModel.id==job.id).values(external_job_id=str(res.id)))
    await db.commit()
    return {"id": job.id, "status": "queued"}

class AudioGenerateBody(BaseModel):
    text: str
    voice_id: str | None = None

@router.post("/v1/jobs/audio-generate")
async def audio_generate(body: AudioGenerateBody, claims=Depends(verify_bearer), db=Depends(get_db)):
    tenant_slug = (claims.get("org_id") or claims.get("sub") or "anon").replace(" ", "-")
    tenant_id = await _ensure_tenant(db, tenant_slug)
    job = JobModel(
        tenant_id=tenant_id,
        type=JobTypeEnum.AUDIO_GENERATION,
        status=JobStatusEnum.PENDING,
        input_data=body.model_dump(),
        provider="elevenlabs",
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    kwargs = {"job_id": job.id}
    if body.voice_id: kwargs["voice_id"] = body.voice_id

    res = celery_app.send_task("worker.generate_audio", kwargs={"text": body.text, **kwargs})
    await db.execute(update(JobModel).where(JobModel.id==job.id).values(external_job_id=str(res.id)))
    await db.commit()
    return {"id": job.id, "status": "queued"}

@router.get("/v1/jobs")
async def list_jobs(db=Depends(get_db)):
    result = await db.execute(sa_select(JobModel).order_by(JobModel.created_at.desc()).limit(20))
    rows = result.scalars().all()
    jobs = []
    for j in rows:
        jobs.append({
            "id": j.id,
            "type": (j.type.value if hasattr(j.type, "value") else str(j.type)),
            "status": (j.status.value if hasattr(j.status, "value") else str(j.status)),
            "input_data": j.input_data,
            "output_data": j.output_data,
            "created_at": j.created_at.isoformat() if getattr(j, "created_at", None) else None,
            "completed_at": j.completed_at.isoformat() if getattr(j, "completed_at", None) else None,
            "error_message": j.error_message,
        })
    return {"jobs": jobs}

@router.get("/v1/jobs/{job_id}/assets")
async def list_job_assets(job_id: int, db=Depends(get_db)):
    result = await db.execute(sa_select(JobModel).where(JobModel.id==job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(404, "not found")
    assets_res = await db.execute(sa_select(Asset).where(Asset.job_id==job_id))
    asset_rows = assets_res.scalars().all()
    out = []
    for a in asset_rows:
        out.append({
            "id": a.id,
            "s3_key": a.s3_key,
            "s3_bucket": a.s3_bucket,
            "media_type": (a.media_type.value if hasattr(a.media_type, "value") else str(a.media_type)),
            "presigned_url": generate_presigned_url(a.s3_key, a.s3_bucket),
        })
    return out
