from __future__ import annotations

import time
from dataclasses import dataclass

import redis


@dataclass
class LeakyBucketConfig:
    capacity: int
    leak_rate_per_sec: float


class LeakyBucketLimiter:
    def __init__(self, redis_client: redis.Redis, prefix: str = "rl") -> None:
        self.redis = redis_client
        self.prefix = prefix

    def _key(self, user_id: str) -> str:
        return f"{self.prefix}:{user_id}"

    def allow(self, user_id: str, config: LeakyBucketConfig) -> bool:
        now = time.time()
        key = self._key(user_id)
        pipe = self.redis.pipeline()
        pipe.hgetall(key)
        data = pipe.execute()[0]
        if data:
            tokens = float(data.get(b"tokens", b"0").decode())
            last = float(data.get(b"ts", b"0").decode())
            elapsed = max(0.0, now - last)
            tokens = max(0.0, tokens - elapsed * config.leak_rate_per_sec)
        else:
            tokens = 0.0
        if tokens + 1 > config.capacity:
            # Not allowed
            self.redis.hset(key, mapping={"tokens": tokens, "ts": now})
            self.redis.expire(key, 3600)
            return False
        tokens += 1
        self.redis.hset(key, mapping={"tokens": tokens, "ts": now})
        self.redis.expire(key, 3600)
        return True
