
import os
import replicate
import boto3
import requests
import asyncio
from celery import Celery
from datetime import datetime
import uuid
import json


import logging, sys
from pythonjsonlogger import jsonlogger
import sentry_sdk
from redis import Redis

# Logging
logger = logging.getLogger()
logger.setLevel(getattr(logging, os.environ.get("LOG_LEVEL", "INFO").upper(), logging.INFO))
handler = logging.StreamHandler(sys.stdout)
formatter = jsonlogger.JsonFormatter("%(asctime)s %(levelname)s %(name)s %(message)s")
handler.setFormatter(formatter)
logger.handlers = [handler]

# Sentry
if os.environ.get("SENTRY_DSN"):
	sentry_sdk.init(dsn=os.environ.get("SENTRY_DSN"), environment=os.environ.get("ENV", "production"))

# Database setup (read from env)
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
	DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Synchronous SQLAlchemy engine for worker DB operations
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker as SyncSessionMaker

SYNC_DATABASE_URL = (DATABASE_URL or "").replace("+asyncpg", "").replace("postgresql+asyncpg://", "postgresql://")
sync_engine = create_engine(
    SYNC_DATABASE_URL,
    pool_pre_ping=True,
    pool_size=int(os.environ.get("DB_POOL_SIZE", 5)),
    max_overflow=int(os.environ.get("DB_MAX_OVERFLOW", 10)),
)
SyncSessionLocal = SyncSessionMaker(bind=sync_engine)

from services.api.app.database.models import Job, JobStatus, Asset, MediaType

broker_url = os.environ.get("REDIS_URL", "redis://redis:6379/0")
app = Celery("aeon_worker", broker=broker_url, backend=broker_url)
# Redis client for pub/sub and caching recent jobs
redis_client = Redis.from_url(broker_url)

# S3 configuration
S3_BUCKET = os.environ.get("S3_BUCKET")
S3_ENDPOINT = os.environ.get("S3_ENDPOINT") or os.environ.get("S3_ENDPOINT_URL")
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.environ.get("AWS_REGION")
S3_SSE = os.environ.get("S3_SSE")
S3_FORCE_PATH_STYLE = os.environ.get("S3_FORCE_PATH_STYLE", "false").lower() == "true"

s3_config = {
	"aws_access_key_id": AWS_ACCESS_KEY_ID,
	"aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
	"region_name": AWS_REGION,
}
if S3_ENDPOINT:
	s3_config["endpoint_url"] = S3_ENDPOINT
if S3_FORCE_PATH_STYLE:
	from boto3.session import Session
	from botocore.config import Config
	s3_config["config"] = Config(s3={"addressing_style": "path"})

s3_client = boto3.client("s3", **s3_config)


def build_s3_key(tenant_id: int, kind: str, job_id: int, ext: str) -> str:
	return f"tenants/{tenant_id}/{kind}/jobs/{job_id}/{uuid.uuid4()}.{ext}"


def _publish_job_event(job: Job):
	try:
		event = {
			"id": job.id,
			"tenant_id": job.tenant_id,
			"status": job.status.value if hasattr(job.status, "value") else str(job.status),
			"progress": 0,
		}
		if event["status"] == "processing":
			event["progress"] = 50
		elif event["status"] in ("completed", "failed", "cancelled"):
			event["progress"] = 100
		redis_client.publish("jobs_events", json.dumps(event))
	except Exception as e:
		logger.error(f"Failed to publish job event: {e}")


def _cache_recent_job(job: Job):
	try:
		key = f"tenant:{job.tenant_id}:recent_jobs"
		entry = {
			"id": job.id,
			"type": job.type.value if hasattr(job.type, "value") else str(job.type),
			"status": job.status.value if hasattr(job.status, "value") else str(job.status),
			"created_at": job.created_at.isoformat() if getattr(job, "created_at", None) else None,
			"completed_at": job.completed_at.isoformat() if getattr(job, "completed_at", None) else None,
		}
		redis_client.lpush(key, json.dumps(entry))
		redis_client.ltrim(key, 0, 49)
	except Exception as e:
		logger.error(f"Failed to cache recent job: {e}")


def set_job_status_sync(job_id: int, status: JobStatus, error: str | None = None):
	with SyncSessionLocal() as db:
		job = db.get(Job, job_id)
		if job:
			job.status = status
			if error:
				job.error_message = error
			if status == JobStatus.COMPLETED:
				job.completed_at = datetime.now()
			db.commit()
			# Publish and cache after commit
			_publish_job_event(job)
			_cache_recent_job(job)


@app.task(bind=True, name="worker.generate_image", autoretry_for=(Exception,), retry_kwargs={"max_retries": 3, "countdown": 5}, retry_backoff=True, retry_jitter=True)
def generate_image(self, prompt: str, job_id: int = None, tenant_id: int = 0, **kwargs) -> dict:
	"""Generate image using Replicate and store in S3 and DB"""
	try:
		client = replicate.Client(api_token=os.environ.get("REPLICATE_API_TOKEN"))
		ext = "png"
		input_params = {
			"prompt": prompt,
			"width": kwargs.get("width", 1024),
			"height": kwargs.get("height", 1024),
			"num_outputs": kwargs.get("num_outputs", 1),
			"guidance_scale": kwargs.get("guidance_scale", 7.5),
			"num_inference_steps": kwargs.get("num_inference_steps", 4),
		}

		output = client.run(
			"black-forest-labs/flux-schnell:9d1d53d5cc05a5f8691c74764ce4bbbb7814449f7365a3b16dceaef22a8d1f64",
			input=input_params,
		)

		# Persist using synchronous DB session (no async/sync mixing)
		with SyncSessionLocal() as db:
			set_job_status_sync(job_id, JobStatus.PROCESSING)
			for i, image_url in enumerate(output):
				resp = requests.get(image_url)
				resp.raise_for_status()
				s3_key = build_s3_key(tenant_id, "image", job_id, ext)
				put_params = {"Bucket": S3_BUCKET, "Key": s3_key, "Body": resp.content, "ContentType": "image/png"}
				if S3_SSE:
					put_params["ServerSideEncryption"] = S3_SSE
				s3_client.put_object(**put_params)
				asset = Asset(
					tenant_id=tenant_id,
					job_id=job_id,
					media_type=MediaType.IMAGE,
					s3_bucket=S3_BUCKET,
					s3_key=s3_key,
					file_size=len(resp.content),
					file_type="png",
					metadata_json={"index": i},
				)
				db.add(asset)
				db.commit()
		set_job_status_sync(job_id, JobStatus.COMPLETED)

		return {"job_id": job_id, "images": output}
	except Exception as e:
		# Retry up to configured max; mark FAILED only on final attempt
		if getattr(self.request, "retries", 0) < getattr(self, "max_retries", 0):
			raise self.retry(exc=e, countdown=5)
		set_job_status_sync(job_id, JobStatus.FAILED, str(e))
		self.update_state(state="FAILURE", meta={"error": str(e), "job_id": job_id})
		raise


@app.task(bind=True, name="worker.generate_video", autoretry_for=(Exception,), retry_kwargs={"max_retries": 3, "countdown": 5}, retry_backoff=True, retry_jitter=True)
def generate_video(self, prompt: str, job_id: int = None, tenant_id: int = 0, provider: str = "runway", video_type: str = "text_to_video", **kwargs) -> dict:
	"""Generate video using provider, upload to S3, and persist to DB"""
	try:
		from services.api.app.video_providers import generate_video as generate_video_provider, VideoProvider
		provider_enum = VideoProvider(provider)
		result = asyncio.get_event_loop().run_until_complete(generate_video_provider(provider=provider_enum, prompt=prompt, video_type=video_type, **kwargs))
		video_url = None
		if isinstance(result, dict):
			video_url = result.get("video_url") or result.get("url")
		if not video_url:
			raise RuntimeError("Provider did not return video URL")

		resp = requests.get(video_url)
		resp.raise_for_status()
		ext = "mp4"
		s3_key = build_s3_key(tenant_id, "video", job_id, ext)
		put_params = {"Bucket": S3_BUCKET, "Key": s3_key, "Body": resp.content, "ContentType": "video/mp4"}
		if S3_SSE:
			put_params["ServerSideEncryption"] = S3_SSE
		s3_client.put_object(**put_params)

		# Persist using synchronous DB session
		with SyncSessionLocal() as db:
			set_job_status_sync(job_id, JobStatus.PROCESSING)
			asset = Asset(
				tenant_id=tenant_id,
				job_id=job_id,
				media_type=MediaType.VIDEO,
				s3_bucket=S3_BUCKET,
				s3_key=s3_key,
				file_size=len(resp.content),
				file_type="mp4",
				metadata_json={"provider": provider},
			)
			db.add(asset)
			db.commit()
		set_job_status_sync(job_id, JobStatus.COMPLETED)
		return {"job_id": job_id, "video": {"s3_key": s3_key, "bucket": S3_BUCKET}}
	except Exception as e:
		if getattr(self.request, "retries", 0) < getattr(self, "max_retries", 0):
			raise self.retry(exc=e, countdown=5)
		set_job_status_sync(job_id, JobStatus.FAILED, str(e))
		self.update_state(state="FAILURE", meta={"error": str(e), "job_id": job_id})
		raise


@app.task(bind=True, name="worker.generate_audio", autoretry_for=(Exception,), retry_kwargs={"max_retries": 3, "countdown": 5}, retry_backoff=True, retry_jitter=True)
def generate_audio(self, text: str, job_id: int = None, tenant_id: int = 0, voice_id: str = None, **kwargs) -> dict:
	"""Generate audio using ElevenLabs and persist to DB"""
	try:
		headers = {
			"Accept": "audio/mpeg",
			"Content-Type": "application/json",
			"xi-api-key": os.environ.get("ELEVENLABS_API_KEY"),
		}
		voice = voice_id or "21m00Tcm4TlvDq8ikWAM"
		payload = {
			"text": text,
			"model_id": kwargs.get("model_id", "eleven_monolingual_v1"),
			"voice_settings": {
				"stability": kwargs.get("stability", 0.5),
				"similarity_boost": kwargs.get("similarity_boost", 0.5),
			},
		}
		resp = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{voice}", json=payload, headers=headers)
		resp.raise_for_status()
		ext = "mp3"
		s3_key = build_s3_key(tenant_id, "audio", job_id, ext)
		put_params = {"Bucket": S3_BUCKET, "Key": s3_key, "Body": resp.content, "ContentType": "audio/mpeg"}
		if S3_SSE:
			put_params["ServerSideEncryption"] = S3_SSE
		s3_client.put_object(**put_params)

		# Persist using synchronous DB session
		with SyncSessionLocal() as db:
			set_job_status_sync(job_id, JobStatus.PROCESSING)
			asset = Asset(
				tenant_id=tenant_id,
				job_id=job_id,
				media_type=MediaType.AUDIO,
				s3_bucket=S3_BUCKET,
				s3_key=s3_key,
				file_size=len(resp.content),
				file_type="mp3",
				metadata_json={"voice_id": voice},
			)
			db.add(asset)
			db.commit()
		set_job_status_sync(job_id, JobStatus.COMPLETED)
		return {"job_id": job_id, "audio": {"s3_key": s3_key, "bucket": S3_BUCKET}}
	except Exception as e:
		if getattr(self.request, "retries", 0) < getattr(self, "max_retries", 0):
			raise self.retry(exc=e, countdown=5)
		set_job_status_sync(job_id, JobStatus.FAILED, str(e))
		self.update_state(state="FAILURE", meta={"error": str(e), "job_id": job_id})
		raise



