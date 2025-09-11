"""Clerk JWT authentication middleware."""

import json
from typing import Optional

import jwt
import structlog
from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from ..config import settings
from ..exceptions import AuthenticationError, AuthorizationError

logger = structlog.get_logger()


class ClerkAuthMiddleware(BaseHTTPMiddleware):
    """Middleware to handle Clerk JWT authentication."""
    
    # Routes that don't require authentication
    PUBLIC_ROUTES = {
        "/",
        "/health",
        "/metrics",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/webhooks/stripe",
        "/webhooks/coinbase",
    }
    
    def __init__(self, app):
        super().__init__(app)
        self.clerk_public_key = self._get_clerk_public_key()
    
    def _get_clerk_public_key(self) -> str:
        """Get Clerk public key for JWT verification."""
        # In production, this would fetch the public key from Clerk's JWKS endpoint
        # For now, we'll use the publishable key as a placeholder
        return settings.clerk_publishable_key
    
    async def dispatch(self, request: Request, call_next):
        """Process request and verify JWT if required."""
        # Skip authentication for public routes
        if self._is_public_route(request.url.path):
            return await call_next(request)
        
        # Skip authentication for preflight requests
        if request.method == "OPTIONS":
            return await call_next(request)
        
        try:
            # Extract and verify JWT
            user_data = await self._verify_jwt(request)
            if user_data:
                request.state.user = user_data
                request.state.user_id = user_data.get("sub")
                logger.info(
                    "Authenticated request",
                    user_id=user_data.get("sub"),
                    path=request.url.path,
                    method=request.method,
                )
            else:
                # No valid token found
                raise AuthenticationError("Authentication required")
                
        except AuthenticationError as e:
            logger.warning(
                "Authentication failed",
                error=str(e),
                path=request.url.path,
                method=request.method,
            )
            return Response(
                content=json.dumps({
                    "error": "Authentication required",
                    "message": str(e),
                }),
                status_code=401,
                media_type="application/json",
            )
        except Exception as e:
            logger.error(
                "Authentication error",
                error=str(e),
                path=request.url.path,
                method=request.method,
            )
            return Response(
                content=json.dumps({
                    "error": "Authentication error",
                    "message": "Failed to verify authentication",
                }),
                status_code=401,
                media_type="application/json",
            )
        
        response = await call_next(request)
        return response
    
    def _is_public_route(self, path: str) -> bool:
        """Check if route is public and doesn't require authentication."""
        # Exact match
        if path in self.PUBLIC_ROUTES:
            return True
        
        # Pattern matching for webhooks and other public endpoints
        public_prefixes = ["/webhooks/", "/health"]
        return any(path.startswith(prefix) for prefix in public_prefixes)
    
    async def _verify_jwt(self, request: Request) -> Optional[dict]:
        """Verify JWT token from request headers."""
        # Get token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None
        
        if not auth_header.startswith("Bearer "):
            raise AuthenticationError("Invalid authorization header format")
        
        token = auth_header[7:]  # Remove "Bearer " prefix
        
        try:
            # In production, this would verify against Clerk's public key
            # For now, we'll do basic validation
            decoded = jwt.decode(
                token,
                options={"verify_signature": False},  # Skip signature verification for now
                algorithms=["RS256"]
            )
            
            # Validate required claims
            if not decoded.get("sub"):
                raise AuthenticationError("Invalid token: missing subject")
            
            if not decoded.get("iss"):
                raise AuthenticationError("Invalid token: missing issuer")
            
            # In production, validate issuer matches Clerk instance
            # if not decoded["iss"].startswith("https://clerk."):
            #     raise AuthenticationError("Invalid token: invalid issuer")
            
            return decoded
            
        except jwt.ExpiredSignatureError:
            raise AuthenticationError("Token has expired")
        except jwt.InvalidTokenError as e:
            raise AuthenticationError(f"Invalid token: {str(e)}")


def require_role(required_role: str):
    """Decorator to require specific user role."""
    def decorator(func):
        async def wrapper(request: Request, *args, **kwargs):
            user = getattr(request.state, "user", None)
            if not user:
                raise AuthenticationError("Authentication required")
            
            # Get user role from database or JWT claims
            user_role = user.get("role", "user")  # Default to 'user' role
            
            if user_role != required_role and user_role != "admin":
                raise AuthorizationError(f"Role '{required_role}' required")
            
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator


def get_current_user(request: Request) -> dict:
    """Get current authenticated user from request state."""
    user = getattr(request.state, "user", None)
    if not user:
        raise AuthenticationError("Authentication required")
    return user


def get_current_user_id(request: Request) -> str:
    """Get current authenticated user ID from request state."""
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise AuthenticationError("Authentication required")
    return user_id