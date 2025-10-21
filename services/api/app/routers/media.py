from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import uuid4
from datetime import datetime

from ..auth import get_current_user, AuthenticatedUser
from ..database.neon_db import get_db, Job, JobStatus, JobType, Asset, MediaType
from ..s3_client import generate_presigned_url
from ..config import settings, runtime
from ..rate_limit import rate_limit

router = APIRouter()


# Basic input sanitization without external dependencies

def _sanitize_text(val: Any) -> str:
	if not isinstance(val, str):
		return ""
	val = val.strip()
	return val[:1000]


class CreateJobRequest(BaseModel):
	kind: str = Field(pattern="^(image|video|audio)$")
	provider: str
	payload: Dict[str, Any]


class CreateJobResponse(BaseModel):
	job_id: int


@router.post("/jobs", response_model=CreateJobResponse)
async def create_job(
	request: Request,
	body: CreateJobRequest,
	user: AuthenticatedUser = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	# Body size cap
	cl = request.headers.get("content-length")
	if cl and int(cl) > runtime.max_body_bytes:
		raise HTTPException(status_code=413, detail="Payload too large")
	await rate_limit(request, settings.RATE_LIMIT_DEFAULT, 60, prefix="media:jobs")

	if not user.sub:
		raise HTTPException(status_code=401, detail="Unauthorized")

	kind_map = {
		"image": JobType.IMAGE_GENERATION,
		"video": JobType.VIDEO_GENERATION,
		"audio": JobType.AUDIO_GENERATION,
	}
	job_type = kind_map[body.kind]

	job = Job(
		tenant_id=0,
		type=job_type,
		status=JobStatus.PENDING,
		input_data={"provider": body.provider, "payload": body.payload},
		provider=body.provider,
	)
	db.add(job)
	await db.commit()
	await db.refresh(job)

	from ..celery_client import (
		generate_image_task,
		generate_video_task,
		generate_audio_task,
	)

	payload = body.payload or {}
	if body.kind == "image":
		generate_image_task(prompt=_sanitize_text(payload.get("prompt", "")), job_id=job.id, **payload)
	elif body.kind == "video":
		generate_video_task(prompt=_sanitize_text(payload.get("prompt", "")), job_id=job.id, provider=body.provider, **payload)
	else:
		generate_audio_task(text=_sanitize_text(payload.get("text", "")), job_id=job.id, **payload)

	return CreateJobResponse(job_id=job.id)


class AssetView(BaseModel):
	id: int
	url: Optional[str]
	mime_type: Optional[str]
	width: Optional[int]
	height: Optional[int]
	duration: Optional[int]


class JobStatusResponse(BaseModel):
	id: int
	status: str
	progress: int
	error_message: Optional[str] = None
	assets: List[AssetView] = []


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job(
	job_id: int,
	user: AuthenticatedUser = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	result = await db.execute(select(Job).where(Job.id == job_id))
	job = result.scalar_one_or_none()
	if not job:
		raise HTTPException(status_code=404, detail="Job not found")

	assets_result = await db.execute(select(Asset).where(Asset.job_id == job_id))
	assets = assets_result.scalars().all()

	asset_views: List[AssetView] = []
	for a in assets:
		url = generate_presigned_url(a.s3_key, a.s3_bucket)
		mime_type = None
		if a.media_type == MediaType.IMAGE:
			mime_type = "image/png"
		elif a.media_type == MediaType.VIDEO:
			mime_type = "video/mp4"
		elif a.media_type == MediaType.AUDIO:
			mime_type = "audio/mpeg"
		asset_views.append(AssetView(
			id=a.id,
			url=url,
			mime_type=mime_type,
			width=a.width,
			height=a.height,
			duration=a.duration,
		))

	status_str = job.status.value if hasattr(job.status, 'value') else str(job.status)
	progress = 0
	if status_str == "processing":
		progress = 50
	elif status_str in ("completed", "failed", "cancelled"):
		progress = 100

	return JobStatusResponse(
		id=job.id,
		status=status_str,
		progress=progress,
		error_message=job.error_message,
		assets=asset_views,
	)


class PresignRequest(BaseModel):
	key_hint: Optional[str] = None
	content_type: Optional[str] = None
	kind: str = Field(pattern="^(image|video|audio)$")
	job_id: Optional[int] = None


class PresignResponse(BaseModel):
	url: str
	fields: Optional[Dict[str, Any]] = None


@router.post("/assets/presign", response_model=PresignResponse)
async def presign_asset(
	request: Request,
	body: PresignRequest,
	user: AuthenticatedUser = Depends(get_current_user),
):
	cl = request.headers.get("content-length")
	if cl and int(cl) > runtime.max_body_bytes:
		raise HTTPException(status_code=413, detail="Payload too large")
	await rate_limit(request, settings.RATE_LIMIT_DEFAULT, 60, prefix="media:presign")

	tenant_id = 0
	ext = "bin"
	if body.content_type:
		if "/" in body.content_type:
			ext = body.content_type.split("/")[1]
	key = f"tenants/{tenant_id}/{body.kind}/jobs/{body.job_id or 'adhoc'}/{uuid4()}.{ext}"
	url = generate_presigned_url(key)
	if not url:
		raise HTTPException(status_code=500, detail="Failed to presign URL")
	return PresignResponse(url=url)


