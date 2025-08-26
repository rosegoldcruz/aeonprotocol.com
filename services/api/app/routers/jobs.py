from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
import asyncio, json, time, os
from ..auth import verify_bearer
from ..s3_client import generate_presigned_url
from ..celery_client import celery_app
from redis.asyncio import from_url as redis_from_url

router = APIRouter(tags=["jobs"])

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
redis = redis_from_url(REDIS_URL, encoding="utf-8", decode_responses=True)

class CreateJob(BaseModel):
    type: str
    input_data: dict

async def _dispatch_task(job_type: str, payload: dict) -> str:
    if job_type.startswith("image"):
        res = celery_app.send_task("worker.generate_image", kwargs={"prompt": payload.get("prompt", ""), **payload})
    elif job_type.startswith("video"):
        res = celery_app.send_task("worker.generate_video", kwargs={"prompt": payload.get("prompt", ""), **payload})
    else:
        res = celery_app.send_task("worker.generate_image", kwargs={"prompt": payload.get("prompt", ""), **payload})
    return res.id

@router.post("/v1/jobs")
async def create_job(body: CreateJob, claims=Depends(verify_bearer), idempotency_key: str | None = Header(None, alias="Idempotency-Key")):
    tenant = claims.get("org_id") or claims.get("sub")
    idem_key = None
    if idempotency_key:
        idem_key = f"idem:{tenant}:{idempotency_key}"
        existing = await redis.get(idem_key)
        if existing:
            # Return existing job
            return {"id": existing, "status": "queued", "result_url": None, "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    # create new task
    task_id = await _dispatch_task(body.type.lower(), {**body.input_data, "tenant": tenant})
    if idem_key:
        await redis.setex(idem_key, 24*3600, task_id)
    await redis.hset(f"job:{task_id}", mapping={"status": "queued", "tenant": tenant})
    return {"id": task_id, "status": "queued", "result_url": None, "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}

@router.get("/v1/jobs/{job_id}")
async def get_job(job_id: str, claims=Depends(verify_bearer)):
    # Poll celery for status
    async_result = celery_app.AsyncResult(job_id)
    state = async_result.state.upper()
    status_map = {
        "PENDING": "queued",
        "RECEIVED": "queued",
        "STARTED": "processing",
        "RETRY": "processing",
        "SUCCESS": "completed",
        "FAILURE": "failed",
    }
    status = status_map.get(state, "queued")
    result_url = None
    if status == "completed":
        data = async_result.result or {}
        # find s3 key in worker result structure
        key = None
        if isinstance(data, dict):
            if "result_key" in data:
                key = data["result_key"]
            elif "images" in data and data["images"]:
                key = data["images"][0].get("s3_key")
            elif "videos" in data and data["videos"]:
                key = data["videos"][0].get("s3_key")
        if key:
            result_url = generate_presigned_url(key)
    return {"id": job_id, "status": status, "result_url": result_url}

@router.get("/v1/jobs/stream")
async def stream_jobs(id: str | None = None):
    async def gen():
        if not id:
            while True:
                yield {"event":"ping","data": json.dumps({"t": int(time.time())})}
                await asyncio.sleep(15)
        else:
            # Stream a single job's status by polling
            last = None
            while True:
                async_result = celery_app.AsyncResult(id)
                state = async_result.state.upper()
                status_map = {"PENDING":"queued","RECEIVED":"queued","STARTED":"processing","RETRY":"processing","SUCCESS":"completed","FAILURE":"failed"}
                status = status_map.get(state, "queued")
                if status != last:
                    yield {"event": "status", "data": json.dumps({"id": id, "status": status})}
                    last = status
                if status in ("completed","failed"):
                    break
                await asyncio.sleep(1)
    return EventSourceResponse(gen())

