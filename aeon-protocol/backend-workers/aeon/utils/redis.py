"""Redis utilities for workers."""

import json
import time
from typing import Any, Dict, Optional

import redis
import structlog

from ..config import settings

logger = structlog.get_logger()

# Redis connection pool
redis_pool = redis.ConnectionPool.from_url(
    settings.redis_url,
    max_connections=20,
    retry_on_timeout=True,
    socket_connect_timeout=5,
    socket_timeout=5,
)

# Redis client
redis_client = redis.Redis(connection_pool=redis_pool, decode_responses=True)


class RedisLock:
    """Distributed lock using Redis."""
    
    def __init__(self, key: str, timeout: int = 300, blocking_timeout: Optional[int] = None):
        """Initialize Redis lock.
        
        Args:
            key: Lock key
            timeout: Lock timeout in seconds
            blocking_timeout: How long to wait for lock acquisition
        """
        self.key = f"lock:{key}"
        self.timeout = timeout
        self.blocking_timeout = blocking_timeout
        self.lock = redis_client.lock(
            self.key,
            timeout=timeout,
            blocking_timeout=blocking_timeout
        )
    
    def __enter__(self):
        """Acquire lock."""
        acquired = self.lock.acquire()
        if not acquired:
            raise RuntimeError(f"Could not acquire lock: {self.key}")
        logger.debug("Lock acquired", key=self.key)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Release lock."""
        try:
            self.lock.release()
            logger.debug("Lock released", key=self.key)
        except redis.LockError:
            logger.warning("Lock was already released", key=self.key)


class RateLimiter:
    """Redis-based rate limiter using sliding window."""
    
    def __init__(self, key: str, limit: int, window: int = 60):
        """Initialize rate limiter.
        
        Args:
            key: Rate limit key
            limit: Number of requests allowed
            window: Time window in seconds
        """
        self.key = f"rate_limit:{key}"
        self.limit = limit
        self.window = window
    
    def is_allowed(self) -> bool:
        """Check if request is allowed."""
        now = time.time()
        pipeline = redis_client.pipeline()
        
        # Remove expired entries
        pipeline.zremrangebyscore(self.key, 0, now - self.window)
        
        # Count current requests
        pipeline.zcard(self.key)
        
        # Add current request
        pipeline.zadd(self.key, {str(now): now})
        
        # Set expiration
        pipeline.expire(self.key, self.window)
        
        results = pipeline.execute()
        current_requests = results[1]
        
        allowed = current_requests < self.limit
        
        if not allowed:
            # Remove the request we just added since it's not allowed
            redis_client.zrem(self.key, str(now))
        
        logger.debug(
            "Rate limit check",
            key=self.key,
            current_requests=current_requests,
            limit=self.limit,
            allowed=allowed
        )
        
        return allowed
    
    def get_remaining(self) -> int:
        """Get remaining requests in current window."""
        now = time.time()
        
        # Remove expired entries and count
        pipeline = redis_client.pipeline()
        pipeline.zremrangebyscore(self.key, 0, now - self.window)
        pipeline.zcard(self.key)
        results = pipeline.execute()
        
        current_requests = results[1]
        return max(0, self.limit - current_requests)


def cache_set(key: str, value: Any, ttl: int = 3600) -> bool:
    """Set value in Redis cache."""
    try:
        serialized_value = json.dumps(value) if not isinstance(value, str) else value
        return redis_client.setex(f"cache:{key}", ttl, serialized_value)
    except Exception as e:
        logger.error("Cache set failed", key=key, error=str(e))
        return False


def cache_get(key: str) -> Optional[Any]:
    """Get value from Redis cache."""
    try:
        value = redis_client.get(f"cache:{key}")
        if value is None:
            return None
        
        # Try to deserialize JSON, fallback to string
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    except Exception as e:
        logger.error("Cache get failed", key=key, error=str(e))
        return None


def cache_delete(key: str) -> bool:
    """Delete value from Redis cache."""
    try:
        return bool(redis_client.delete(f"cache:{key}"))
    except Exception as e:
        logger.error("Cache delete failed", key=key, error=str(e))
        return False


def publish_job_update(job_id: str, update_data: Dict[str, Any]) -> None:
    """Publish job update to Redis channel for real-time notifications."""
    try:
        channel = f"job_updates:{job_id}"
        message = json.dumps({
            "job_id": job_id,
            "timestamp": time.time(),
            **update_data
        })
        
        redis_client.publish(channel, message)
        logger.debug("Job update published", job_id=job_id, channel=channel)
    except Exception as e:
        logger.error("Failed to publish job update", job_id=job_id, error=str(e))


def get_job_progress(job_id: str) -> Optional[Dict[str, Any]]:
    """Get job progress from Redis."""
    try:
        progress_data = redis_client.hgetall(f"job_progress:{job_id}")
        if not progress_data:
            return None
        
        # Convert string values back to appropriate types
        return {
            "progress": int(progress_data.get("progress", 0)),
            "status": progress_data.get("status", "UNKNOWN"),
            "updated_at": float(progress_data.get("updated_at", 0)),
            "error": progress_data.get("error"),
        }
    except Exception as e:
        logger.error("Failed to get job progress", job_id=job_id, error=str(e))
        return None


def set_job_progress(job_id: str, progress: int, status: str, error: Optional[str] = None) -> None:
    """Set job progress in Redis."""
    try:
        progress_data = {
            "progress": progress,
            "status": status,
            "updated_at": time.time(),
        }
        
        if error:
            progress_data["error"] = error
        
        redis_client.hset(f"job_progress:{job_id}", mapping=progress_data)
        redis_client.expire(f"job_progress:{job_id}", 86400)  # 24 hours TTL
        
        # Also publish update for real-time notifications
        publish_job_update(job_id, progress_data)
        
    except Exception as e:
        logger.error("Failed to set job progress", job_id=job_id, error=str(e))


def health_check() -> Dict[str, Any]:
    """Check Redis connection health."""
    try:
        # Test basic operations
        test_key = "health_check"
        test_value = str(time.time())
        
        # Set and get test
        redis_client.set(test_key, test_value, ex=60)
        retrieved_value = redis_client.get(test_key)
        
        # Clean up
        redis_client.delete(test_key)
        
        # Check if values match
        if retrieved_value == test_value:
            return {
                "status": "healthy",
                "latency_ms": 0,  # Could measure actual latency
                "connection_pool_size": redis_pool.connection_kwargs.get("max_connections", 0)
            }
        else:
            return {"status": "unhealthy", "error": "Value mismatch"}
            
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}