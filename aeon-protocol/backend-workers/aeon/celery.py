"""Celery application configuration for AEON Protocol workers."""

import structlog
from celery import Celery
from celery.signals import setup_logging

from .config import settings

# Configure structured logging for Celery
logger = structlog.get_logger()


@setup_logging.connect
def config_loggers(*args, **kwargs):
    """Configure structured logging for Celery."""
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


# Create Celery application
celery_app = Celery(
    "aeon-workers",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "aeon.tasks.media",
        "aeon.tasks.crm",
        "aeon.tasks.email",
        "aeon.tasks.cleanup",
    ]
)

# Configure Celery
celery_app.conf.update(
    task_serializer=settings.celery_task_serializer,
    result_serializer=settings.celery_result_serializer,
    accept_content=settings.celery_accept_content,
    timezone=settings.celery_timezone,
    enable_utc=settings.celery_enable_utc,
    
    # Task routing
    task_routes={
        "aeon.tasks.media.generate_video": {"queue": "video"},
        "aeon.tasks.media.generate_image": {"queue": "image"},
        "aeon.tasks.media.generate_music": {"queue": "music"},
        "aeon.tasks.crm.sync_crm": {"queue": "crm"},
        "aeon.tasks.email.send_email": {"queue": "email"},
        "aeon.tasks.cleanup.cleanup_temp_files": {"queue": "cleanup"},
    },
    
    # Task execution settings
    task_time_limit=3600,  # 1 hour hard limit
    task_soft_time_limit=3300,  # 55 minutes soft limit
    worker_prefetch_multiplier=1,  # Disable prefetching for fair distribution
    
    # Retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Result backend settings
    result_expires=86400,  # 24 hours
    result_persistent=True,
    
    # Beat schedule for periodic tasks
    beat_schedule={
        "cleanup-temp-files": {
            "task": "aeon.tasks.cleanup.cleanup_temp_files",
            "schedule": 3600.0,  # Every hour
        },
        "sync-crm-data": {
            "task": "aeon.tasks.crm.sync_all_crm_integrations",
            "schedule": 1800.0,  # Every 30 minutes
        },
    },
    
    # Worker settings
    worker_send_task_events=True,
    task_send_sent_event=True,
    
    # Monitoring
    worker_hijack_root_logger=False,
)

# Configure task annotations for retry behavior
celery_app.conf.task_annotations = {
    "*": {
        "rate_limit": "10/m",  # Global rate limit
    },
    "aeon.tasks.media.generate_video": {
        "rate_limit": "5/m",
        "retry_kwargs": {"max_retries": 3, "countdown": 60},
    },
    "aeon.tasks.media.generate_image": {
        "rate_limit": "10/m",
        "retry_kwargs": {"max_retries": 3, "countdown": 30},
    },
    "aeon.tasks.media.generate_music": {
        "rate_limit": "5/m",
        "retry_kwargs": {"max_retries": 3, "countdown": 60},
    },
    "aeon.tasks.crm.sync_crm": {
        "rate_limit": "20/m",
        "retry_kwargs": {"max_retries": 5, "countdown": 120},
    },
    "aeon.tasks.email.send_email": {
        "rate_limit": "50/m",
        "retry_kwargs": {"max_retries": 3, "countdown": 60},
    },
}

# Initialize Sentry for workers if configured
if settings.sentry_dsn:
    import sentry_sdk
    from sentry_sdk.integrations.celery import CeleryIntegration
    
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        integrations=[CeleryIntegration()],
        traces_sample_rate=0.1 if settings.environment == "production" else 1.0,
    )
    logger.info("Sentry initialized for workers")

logger.info("Celery application configured", broker=settings.celery_broker_url)