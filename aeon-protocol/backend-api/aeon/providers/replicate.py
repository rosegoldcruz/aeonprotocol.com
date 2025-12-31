from __future__ import annotations

import asyncio
from typing import Any, Dict

import httpx

from aeon.core.config import Settings
from aeon.providers.base import BaseProvider, ProviderError


class ReplicateProvider(BaseProvider):
    def __init__(self, settings: Settings, timeout_seconds: float = 120.0) -> None:
        super().__init__(timeout_seconds)
        self.settings = settings
        self.base_url = "https://api.replicate.com/v1"
        self.headers = {"Authorization": f"Token {settings.replicate_api_token}"}

    async def _post(self, path: str, json: Dict[str, Any]) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            resp = await client.post(f"{self.base_url}{path}", headers=self.headers, json=json)
            if resp.status_code >= 400:
                raise ProviderError(resp.text)
            return resp.json()

    async def generate_image(self, prompt: str, **kwargs: Any) -> Dict[str, Any]:
        payload = {"model": "stability-ai/sdxl", "input": {"prompt": prompt, **kwargs}}
        return await self._post("/predictions", payload)

    async def generate_music(self, prompt: str, **kwargs: Any) -> Dict[str, Any]:
        payload = {"model": "facebook/musicgen", "input": {"prompt": prompt, **kwargs}}
        return await self._post("/predictions", payload)

    async def generate_video(self, plan: Dict[str, Any], **kwargs: Any) -> Dict[str, Any]:
        payload = {"model": "some/video-model", "input": {"plan": plan, **kwargs}}
        return await self._post("/predictions", payload)
