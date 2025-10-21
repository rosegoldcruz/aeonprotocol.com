import os
import time
from typing import Optional
import hashlib
from fastapi import HTTPException, Request, status
import redis.asyncio as redis

_redis = None

async def get_redis():
	global _redis
	if _redis is None:
		url = os.environ.get("REDIS_URL", "redis://redis:6379/0")
		_redis = redis.from_url(url, encoding="utf-8", decode_responses=True)
	return _redis


def _key(prefix: str, ip: str, sub: Optional[str], window: int) -> str:
	user_hash = hashlib.sha256((sub or "").encode()).hexdigest() if sub else "anon"
	bucket = int(time.time() // window)
	return f"rl:{prefix}:{ip}:{user_hash}:{bucket}"


async def rate_limit(request: Request, limit: int, window: int = 60, prefix: str = "default"):
	ip = request.client.host if request.client else "unknown"
	sub = getattr(getattr(request.state, "user", None), "sub", None)
	r = await get_redis()
	k = _key(prefix, ip, sub, window)
	# INCR and set expiry atomically
	pipe = r.pipeline()
	pipe.incr(k)
	pipe.expire(k, window)
	count, _ = await pipe.execute()
	if int(count) > limit:
		raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded") 