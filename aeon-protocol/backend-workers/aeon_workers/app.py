from __future__ import annotations

import sentry_sdk
import structlog
from celery import Celery

from .config import get_settings


logger = structlog.get_logger()
settings = get_settings()

if settings.SENTRY_DSN:
    sentry_sdk.init(dsn=settings.SENTRY_DSN)

celery_app = Celery(
    "aeon_workers",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_track_started=True,
    broker_transport_options={"visibility_timeout": 3600},
    result_expires=3600,
)

# Dead-letter via a dedicated set/list. In Redis, we would push failed task IDs.
DEAD_LETTER_KEY = "aeon:dead_letter"


def get_idempotency_key(headers: dict | None) -> str | None:
    if not headers:
        return None
    return headers.get("Idempotency-Key")


@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 5})
def generate_image(self, payload: dict) -> dict:
    # TODO: call provider abstraction
    return {"status": "ok", "type": "image"}


@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 5})
def generate_video(self, payload: dict) -> dict:
    return {"status": "ok", "type": "video"}


@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 5})
def generate_music(self, payload: dict) -> dict:
    return {"status": "ok", "type": "music"}


@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 5})
def sync_crm(self) -> dict:
    return {"status": "ok", "op": "sync_crm"}


@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 5})
def send_email(self, data: dict) -> dict:
    return {"status": "ok", "op": "send_email"}


@celery_app.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 5})
def cleanup(self) -> dict:
    return {"status": "ok", "op": "cleanup"}

