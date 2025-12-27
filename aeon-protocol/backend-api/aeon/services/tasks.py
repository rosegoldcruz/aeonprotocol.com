from __future__ import annotations

import os
from typing import Any

from celery import Celery


def get_celery() -> Celery:
    redis_url = os.environ.get("REDIS_URL")
    if not redis_url:
        raise RuntimeError("Missing REDIS_URL")
    return Celery(broker=redis_url, backend=redis_url)


def enqueue_generate(kind: str, job_id: str) -> Any:
    app = get_celery()
    task_name = f"aeon_workers.app.generate_{kind}"
    return app.send_task(task_name, args=[job_id])
