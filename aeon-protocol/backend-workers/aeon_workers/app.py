from __future__ import annotations

import hashlib
import os
from datetime import timedelta

import redis
import structlog
from celery import Celery, Task
from celery.schedules import crontab

logger = structlog.get_logger()

redis_url = os.environ.get("REDIS_URL")
if not redis_url:
    raise RuntimeError("Missing REDIS_URL")

redis_client = redis.Redis.from_url(redis_url, decode_responses=True)

app = Celery(
    "aeon-workers",
    broker=redis_url,
    backend=redis_url,
    include=["aeon_workers.tasks"],
)

app.conf.update(
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
    broker_transport_options={"visibility_timeout": 3600},
    task_default_retry_delay=5,
    task_reject_on_worker_lost=True,
    task_routes={
        "aeon_workers.tasks.generate_*": {"queue": "media"},
        "aeon_workers.tasks.sync_crm": {"queue": "crm"},
        "aeon_workers.tasks.send_email": {"queue": "email"},
        "aeon_workers.tasks.cleanup": {"queue": "maintenance"},
    },
)


class IdempotentTask(Task):
    def __call__(self, *args, **kwargs):  # type: ignore[no-untyped-def]
        key_basis = f"{self.name}:{args}:{kwargs}".encode()
        idem_key = f"idem:{hashlib.sha256(key_basis).hexdigest()}"
        if redis_client.set(idem_key, "1", nx=True, ex=3600) is False:
            logger.info("duplicate_task_suppressed", task=self.name)
            return None
        return self.run(*args, **kwargs)  # type: ignore[misc]


@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):  # type: ignore[no-untyped-def]
    sender.add_periodic_task(crontab(minute="*/10"), cleanup.s())


@app.task(base=IdempotentTask, bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_backoff_max=60, retry_jitter=True)
def generate_video(self, job_id: str) -> str:
    logger.info("generate_video", job_id=job_id)
    return job_id


@app.task(base=IdempotentTask, bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_backoff_max=60, retry_jitter=True)
def generate_image(self, job_id: str) -> str:
    logger.info("generate_image", job_id=job_id)
    return job_id


@app.task(base=IdempotentTask, bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_backoff_max=60, retry_jitter=True)
def generate_music(self, job_id: str) -> str:
    logger.info("generate_music", job_id=job_id)
    return job_id


@app.task(base=IdempotentTask)
def sync_crm() -> str:
    logger.info("sync_crm")
    return "ok"


@app.task(base=IdempotentTask)
def send_email(to: str, template: str, context: dict) -> str:
    logger.info("send_email", to=to, template=template)
    return "queued"


@app.task(base=IdempotentTask)
def cleanup() -> str:
    logger.info("cleanup")
    return "done"
