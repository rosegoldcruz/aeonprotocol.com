from __future__ import annotations

from fastapi import APIRouter, Depends

from aeon.middleware.auth import require_user

router = APIRouter()


@router.get("/me")
async def me(user=Depends(require_user)) -> dict:
    return {"user_id": user["sub"], "claims": user["claims"]}
