from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Request

router = APIRouter()


@router.post("/stripe")
async def stripe_webhook(request: Request, stripe_signature: str | None = Header(None)) -> dict:
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="missing signature")
    _ = await request.body()
    return {"received": True}


@router.post("/coinbase")
async def coinbase_webhook(request: Request, x_cc_webhook_signature: str | None = Header(None)) -> dict:
    if not x_cc_webhook_signature:
        raise HTTPException(status_code=400, detail="missing signature")
    _ = await request.body()
    return {"received": True}
