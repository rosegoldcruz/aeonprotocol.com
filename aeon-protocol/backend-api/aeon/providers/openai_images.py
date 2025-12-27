from __future__ import annotations

from typing import Any, Dict

import httpx

from aeon.core.config import Settings
from aeon.providers.base import BaseProvider, ProviderError


class OpenAIImagesProvider(BaseProvider):
    def __init__(self, settings: Settings, timeout_seconds: float = 60.0) -> None:
        super().__init__(timeout_seconds)
        self.base_url = "https://api.openai.com/v1/images/generations"
        self.headers = {"Authorization": f"Bearer {settings.openai_api_key}"}

    async def generate_image(self, prompt: str, **kwargs: Any) -> Dict[str, Any]:
        data = {"prompt": prompt, "n": 1, "size": kwargs.get("size", "1024x1024")}
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            resp = await client.post(self.base_url, headers=self.headers, json=data)
            if resp.status_code >= 400:
                raise ProviderError(resp.text)
            return resp.json()

    async def generate_music(self, prompt: str, **kwargs: Any) -> Dict[str, Any]:
        raise ProviderError("OpenAIImagesProvider does not support music")

    async def generate_video(self, plan: Dict[str, Any], **kwargs: Any) -> Dict[str, Any]:
        raise ProviderError("OpenAIImagesProvider does not support video")
