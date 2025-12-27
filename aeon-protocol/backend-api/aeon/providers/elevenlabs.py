from __future__ import annotations

from typing import Any, Dict

import httpx

from aeon.core.config import Settings
from aeon.providers.base import BaseProvider, ProviderError


class ElevenLabsTTSProvider(BaseProvider):
    def __init__(self, settings: Settings, timeout_seconds: float = 60.0) -> None:
        super().__init__(timeout_seconds)
        self.base_url = "https://api.elevenlabs.io/v1/text-to-speech"
        self.headers = {"xi-api-key": settings.elevenlabs_api_key}

    async def generate_music(self, prompt: str, **kwargs: Any) -> Dict[str, Any]:
        # Use TTS as an "audio" generation
        voice_id = kwargs.get("voice_id", "Rachel")
        data = {"text": prompt}
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            resp = await client.post(f"{self.base_url}/{voice_id}", headers=self.headers, json=data)
            if resp.status_code >= 400:
                raise ProviderError(resp.text)
            return {"audio_url": "", "raw": resp.json()}

    async def generate_image(self, prompt: str, **kwargs: Any) -> Dict[str, Any]:
        raise ProviderError("ElevenLabsTTSProvider does not support images")

    async def generate_video(self, plan: Dict[str, Any], **kwargs: Any) -> Dict[str, Any]:
        raise ProviderError("ElevenLabsTTSProvider does not support video")
