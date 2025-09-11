from __future__ import annotations

from fastapi import APIRouter, Depends

from aeon.middleware.auth import require_user

router = APIRouter()


@router.post("/leads")
async def create_or_update_lead(user=Depends(require_user)) -> dict:
    return {"status": "accepted"}
