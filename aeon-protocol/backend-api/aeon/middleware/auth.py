from __future__ import annotations

import functools
import time
from typing import Any, Dict, Optional

import httpx
import jwt
from fastapi import Depends, HTTPException, Request, status

from aeon.core.config import Settings


class JWKSCache:
    def __init__(self) -> None:
        self._jwks: Optional[Dict[str, Any]] = None
        self._fetched_at: float = 0.0

    async def get(self, issuer: str) -> Dict[str, Any]:
        now = time.time()
        if not self._jwks or (now - self._fetched_at) > 3600:
            url = f"{issuer}/.well-known/jwks.json"
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                self._jwks = resp.json()
                self._fetched_at = now
        return self._jwks  # type: ignore[return-value]


_jwks_cache = JWKSCache()


def get_settings() -> Settings:
    settings = Settings()
    settings.validate_required()
    return settings


async def verify_clerk_jwt(request: Request, settings: Settings = Depends(get_settings)) -> Dict[str, Any]:
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = auth.split(" ", 1)[1]

    # Clerk issuer and audience derived from API URL
    issuer = f"https://clerk.{request.url.hostname}" if request.url.hostname else "https://clerk"
    audience = settings.next_public_api_url

    jwks = await _jwks_cache.get(issuer)
    header = jwt.get_unverified_header(token)
    key = None
    for jwk in jwks.get("keys", []):
        if jwk.get("kid") == header.get("kid"):
            key = jwt.algorithms.RSAAlgorithm.from_jwk(jwk)
            break
    if key is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="JWK not found")

    try:
        payload = jwt.decode(
            token,
            key=key,
            algorithms=[header.get("alg", "RS256")],
            audience=audience,
            options={"require": ["sub", "iss", "exp"]},
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    return {"sub": payload.get("sub"), "claims": payload}


def require_user():
    return Depends(verify_clerk_jwt)
