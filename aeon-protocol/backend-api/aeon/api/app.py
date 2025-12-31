from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, Counter, generate_latest
from starlette.responses import Response

from aeon.core.config import Settings
from aeon.core.logging import configure_logging
from aeon.middleware.request_id import RequestIdMiddleware
from aeon.routers import health, auth, crm, billing, media_image, media_music, media_video, webhooks

requests_total = Counter("aeon_requests_total", "Total HTTP requests", ["method", "path", "status"])


def create_app() -> FastAPI:
    settings = Settings()
    settings.validate_required()

    configure_logging()

    # Sentry
    try:
        import sentry_sdk
        from sentry_sdk.integrations.asgi import SentryAsgiMiddleware
        sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.1)
    except Exception:
        pass

    app = FastAPI(title="AEON Protocol API")

    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https?://([a-zA-Z0-9-]+\.)*aeonprotocol\.com$",
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )

    @app.middleware("http")
    async def metrics_middleware(request, call_next):  # type: ignore[no-redef]
        response = await call_next(request)
        try:
            requests_total.labels(request.method, request.url.path, str(response.status_code)).inc()
        except Exception:
            pass
        return response

    @app.get("/metrics")
    async def metrics() -> Response:
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    app.include_router(health.router)
    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(media_video.router, prefix="/media/video", tags=["media-video"])
    app.include_router(media_image.router, prefix="/media/image", tags=["media-image"])
    app.include_router(media_music.router, prefix="/media/music", tags=["media-music"])
    app.include_router(crm.router, prefix="/crm", tags=["crm"])
    app.include_router(billing.router, prefix="/billing", tags=["billing"])
    app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])

    return app
