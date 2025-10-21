"""
Clerk JWT Authentication via JWKS with issuer/audience enforcement
"""
import time
import json
from typing import Any, Dict, Optional

import httpx
from jose import jwt
from jose.exceptions import ExpiredSignatureError, JWTClaimsError, JWKError, JWTError
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import settings

security = HTTPBearer(auto_error=False)


class JWKSCache:
	"""Simple in-memory JWKS cache with ETag/If-None-Match support."""

	def __init__(self, url: str, ttl_seconds: int = 300):
		self.url = url
		self.ttl_seconds = ttl_seconds
		self._cached_keys: Optional[Dict[str, Any]] = None
		self._cached_at: float = 0.0
		self._etag: Optional[str] = None

	async def get_keys(self) -> Dict[str, Any]:
		now = time.time()
		if self._cached_keys and (now - self._cached_at) < self.ttl_seconds:
			return self._cached_keys

		headers = {}
		if self._etag:
			headers["If-None-Match"] = self._etag
		async with httpx.AsyncClient(timeout=10.0) as client:
			resp = await client.get(self.url, headers=headers)
			if resp.status_code == 304 and self._cached_keys:
				self._cached_at = now
				return self._cached_keys
			resp.raise_for_status()
			self._etag = resp.headers.get("ETag")
			self._cached_keys = resp.json()
			self._cached_at = now
			return self._cached_keys or {}


jwks_cache = JWKSCache(settings.CLERK_JWKS_URL)


class AuthenticatedUser:
	"""Represents an authenticated user with tenant context."""

	def __init__(self, sub: str, email: Optional[str], tenant_id: Optional[int], role: Optional[str]):
		self.sub = sub
		self.email = email
		self.tenant_id = tenant_id
		self.role = role


async def verify_token_from_header(request: Request, credentials: Optional[HTTPAuthorizationCredentials]) -> Dict[str, Any]:
	if credentials is None or credentials.scheme.lower() != "bearer":
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
	token = credentials.credentials
	try:
		jwks = await jwks_cache.get_keys()
		audience = settings.CLERK_AUDIENCE
		issuer = settings.CLERK_ISSUER.rstrip("/")
		unverified_headers = jwt.get_unverified_header(token)
		kid = unverified_headers.get("kid")
		if not kid:
			raise HTTPException(status_code=401, detail="JWT missing kid header")

		# jose will select the correct key from provided JWKS
		claims = jwt.decode(
			token,
			jwks,
			options={"verify_aud": True, "verify_at_hash": False},
			audience=audience,
			issuer=issuer,
			algorithms=["RS256", "RS384", "RS512"]
		)
		return claims
	except ExpiredSignatureError:
		raise HTTPException(status_code=401, detail="Token expired")
	except (JWTClaimsError, JWKError, JWTError) as e:
		raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
	except httpx.HTTPError as e:
		raise HTTPException(status_code=503, detail=f"JWKS fetch error: {str(e)}")


async def get_current_user(
	request: Request,
	credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> AuthenticatedUser:
	"""Verify JWT and construct user context."""
	# Dev override to unblock local E2E when explicitly enabled
	if os.environ.get("DEV_DISABLE_AUTH", "false").lower() == "true" and credentials is None:
		return AuthenticatedUser(sub="dev-user", email=None, tenant_id=0, role="admin")
	claims = await verify_token_from_header(request, credentials)
	sub = claims.get("sub")
	email = claims.get("email") or claims.get("email_address")
	return AuthenticatedUser(sub=sub, email=email, tenant_id=None, role=None)


async def verify_bearer(
	request: Request,
	credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Dict[str, Any]:
	"""Verify JWT and return raw claims dictionary for endpoints that need flexible user context."""
	if os.environ.get("DEV_DISABLE_AUTH", "false").lower() == "true" and credentials is None:
		return {"sub": "dev-user"}
	claims = await verify_token_from_header(request, credentials)
	return claims


def require_role(required_role: str):
	def checker(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
		# Implement role hierarchy when membership is loaded; for now pass-through
		return user
	return checker

# Convenience exports for parity
require_admin = require_role("admin")
require_editor = require_role("editor")
require_viewer = require_role("viewer")
