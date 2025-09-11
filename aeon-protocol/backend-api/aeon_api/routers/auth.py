from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel

router = APIRouter()


class JWTPayload(BaseModel):
    sub: str
    email: str | None = None


def verify_clerk_jwt(authorization: str | None = Header(default=None)) -> JWTPayload:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    # NOTE: Full Clerk JWT verification will be implemented later with audience/issuer checks
    # For scaffold, we accept any Bearer value and parse minimal bits if needed.
    return JWTPayload(sub="placeholder")


@router.get("/me")
def me(user: JWTPayload = Depends(verify_clerk_jwt)):
    return {"user_id": user.sub}

