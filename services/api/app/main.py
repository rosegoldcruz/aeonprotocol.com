from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response
from .config import settings
from .routers import media, webhooks
from .routers import web_enhance as web_enhance_router
from .routers import webgen as webgen_router

app = FastAPI(title="AEON API")

# CORS: set from env
ALLOWED_ORIGINS = [o.strip() for o in settings.CORS_ALLOW_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

