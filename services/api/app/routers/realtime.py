import json
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from redis.asyncio import from_url as redis_from_url
from ..config import settings

router = APIRouter()


@router.websocket("/ws/jobs")
async def jobs_websocket(ws: WebSocket):
    await ws.accept()
    r = await redis_from_url(settings.REDIS_URL)
    pubsub = r.pubsub()
    await pubsub.subscribe("jobs_events")
    try:
        async for message in pubsub.listen():  # type: ignore
            if message is None:
                continue
            if message.get("type") != "message":
                continue
            data = message.get("data")
            if isinstance(data, (bytes, bytearray)):
                try:
                    payload = json.loads(data.decode("utf-8"))
                except Exception:
                    payload = {"raw": data.decode("utf-8", errors="ignore")}
            else:
                payload = data
            await ws.send_json(payload)
    except WebSocketDisconnect:
        pass
    finally:
        try:
            await pubsub.unsubscribe("jobs_events")
        except Exception:
            pass
        await ws.close()

