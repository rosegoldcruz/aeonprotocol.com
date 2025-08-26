from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response
from .config import settings
from .routers import media, webhooks
from .routers import web_enhance as web_enhance_router
from .routers import webgen as webgen_router
from .routers import jobs as jobs_router
import os, hashlib, logging
from redis.asyncio import from_url as redis_from_url
from fastapi_limiter import FastAPILimiter

app = FastAPI(title="AEON API")
log = logging.getLogger(__name__)

# CORS: set from env
ALLOWED_ORIGINS = [o.strip() for o in settings.CORS_ALLOW_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def init_limiter():
    redis_url = os.getenv("REDIS_URL") or f"redis://{os.getenv('REDIS_HOST','redis')}:{os.getenv('REDIS_PORT','6379')}"
    redis = redis_from_url(redis_url, encoding="utf-8", decode_responses=True)
    async def identifier(req: Request) -> str:
        tok = req.headers.get("authorization") or ""
        if tok:
            return hashlib.sha256(tok.encode()).hexdigest()
        return (req.client.host if req.client else "anon")
    await FastAPILimiter.init(redis, identifier=identifier)

@app.on_event("startup")
async def validate_env():
    required = ["DATABASE_URL"]
    missing = [k for k in required if not os.getenv(k)]
    if missing:
        log.error(f"Missing required environment variables: {missing}")

@app.get("/health")
def health():
    return {"ok": True}

REQS = Counter("requests_total","Total HTTP requests")
@app.middleware("http")
async def count_requests(request, call_next):
    REQS.inc()
    return await call_next(request)

@app.get("/metrics")
def metrics():
    if not settings.PROMETHEUS_ENABLED:
        return Response(status_code=404)
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# Routers
app.include_router(media.router, prefix="/v1/media")
app.include_router(webhooks.router, prefix="/v1/webhooks")
app.include_router(web_enhance_router.router)
app.include_router(webgen_router.router)
app.include_router(jobs_router.router)

