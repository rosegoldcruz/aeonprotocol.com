"""Main worker entry point for AEON Protocol."""

import signal
import sys
from typing import Any

import structlog
from celery import Celery
from celery.signals import worker_ready, worker_shutdown

from ..celery import celery_app
from ..config import settings

logger = structlog.get_logger()


@worker_ready.connect
def worker_ready_handler(sender: Any = None, **kwargs: Any) -> None:
    """Handle worker ready signal."""
    logger.info("AEON Protocol worker is ready", worker_name=sender.hostname if sender else "unknown")


@worker_shutdown.connect
def worker_shutdown_handler(sender: Any = None, **kwargs: Any) -> None:
    """Handle worker shutdown signal."""
    logger.info("AEON Protocol worker is shutting down", worker_name=sender.hostname if sender else "unknown")


def handle_shutdown_signal(signum: int, frame: Any) -> None:
    """Handle shutdown signals gracefully."""
    logger.info("Received shutdown signal", signal=signum)
    sys.exit(0)


def main() -> None:
    """Main entry point for worker."""
    # Set up signal handlers
    signal.signal(signal.SIGTERM, handle_shutdown_signal)
    signal.signal(signal.SIGINT, handle_shutdown_signal)
    
    logger.info("Starting AEON Protocol worker", environment=settings.environment)
    
    # Start the worker
    celery_app.worker_main([
        "worker",
        "--loglevel=info",
        "--concurrency=4",
        "--queues=video,image,music,crm,email,cleanup",
        "--hostname=aeon-worker@%h",
        "--max-tasks-per-child=100",
        "--time-limit=3600",
        "--soft-time-limit=3300",
    ])


if __name__ == "__main__":
    main()