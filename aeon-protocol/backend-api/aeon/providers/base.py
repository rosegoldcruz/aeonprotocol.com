from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class ProviderError(RuntimeError):
    pass


class BaseProvider(ABC):
    def __init__(self, timeout_seconds: float = 60.0) -> None:
        self.timeout_seconds = timeout_seconds

    @abstractmethod
    async def generate_image(self, prompt: str, **kwargs: Any) -> Dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def generate_video(self, plan: Dict[str, Any], **kwargs: Any) -> Dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def generate_music(self, prompt: str, **kwargs: Any) -> Dict[str, Any]:
        raise NotImplementedError
