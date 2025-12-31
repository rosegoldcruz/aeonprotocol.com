from __future__ import annotations

from typing import Dict

from aeon.core.config import Settings
from aeon.providers.base import BaseProvider
from aeon.providers.elevenlabs import ElevenLabsTTSProvider
from aeon.providers.openai_images import OpenAIImagesProvider
from aeon.providers.replicate import ReplicateProvider


class ProviderRegistry:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._providers: Dict[str, BaseProvider] = {
            "replicate": ReplicateProvider(settings),
            "openai_images": OpenAIImagesProvider(settings),
            "elevenlabs": ElevenLabsTTSProvider(settings),
        }

    def get(self, name: str) -> BaseProvider:
        if name not in self._providers:
            raise KeyError(f"Unknown provider: {name}")
        return self._providers[name]
