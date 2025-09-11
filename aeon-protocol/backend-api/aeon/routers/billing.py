from __future__ import annotations

from fastapi import APIRouter, Depends

from aeon.middleware.auth import require_user

router = APIRouter()


@router.post("/subscribe")
async def subscribe(user=Depends(require_user)) -> dict:
    return {"checkout_url": "todo"}


@router.get("/portal")
async def portal(user=Depends(require_user)) -> dict:
    return {"portal_url": "todo"}
