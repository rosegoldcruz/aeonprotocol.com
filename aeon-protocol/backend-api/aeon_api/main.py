from __future__ import annotations

import os
from typing import List

import sentry_sdk
import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

from .config import get_settings
from .logging_setup import configure_logging
from .middleware import RequestIdMiddleware
from .routers import auth, health


configure_logging()
logger = structlog.get_logger()
settings = get_settings()

if settings.SENTRY_DSN:
    sentry_sdk.init(dsn=settings.SENTRY_DSN)

REQUEST_COUNTER = Counter("api_requests_total", "Total API requests", ["path", "method", "status"]) 

app = FastAPI(title="AEON Protocol API", version="0.1.0", docs_url="/docs")

origins: List[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://*.aeonprotocol.com",
]

app.add_middleware(RequestIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.aeonprotocol\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def metrics_middleware(request, call_next):
    response = await call_next(request)
    REQUEST_COUNTER.labels(path=request.url.path, method=request.method, status=response.status_code).inc()
    return response


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


# Routers scaffold
app.include_router(health.router, prefix="/health", tags=["health"])  # /health
app.include_router(auth.router, prefix="/auth", tags=["auth"])  # /auth


