"""Base interfaces for AI providers."""

import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

import structlog

logger = structlog.get_logger()


class MediaType(Enum):
    """Supported media types."""
    VIDEO = "video"
    IMAGE = "image"
    MUSIC = "music"
    AUDIO = "audio"


class GenerationStatus(Enum):
    """Generation status enumeration."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class ProviderCapabilities:
    """Provider capabilities definition."""
    media_types: List[MediaType]
    max_duration_seconds: Optional[int] = None
    max_resolution: Optional[str] = None
    supported_formats: List[str] = None
    supports_batch: bool = False
    max_batch_size: int = 1
    rate_limit_per_minute: Optional[int] = None
    estimated_cost_per_unit: float = 0.0
    
    def __post_init__(self):
        if self.supported_formats is None:
            self.supported_formats = []


@dataclass
class GenerationRequest:
    """Base generation request."""
    job_id: UUID
    user_id: str
    prompt: str
    parameters: Dict[str, Any]
    priority: int = 0  # Higher number = higher priority
    callback_url: Optional[str] = None
    idempotency_key: Optional[str] = None


@dataclass
class GenerationResult:
    """Base generation result."""
    job_id: UUID
    status: GenerationStatus
    output_urls: List[str]
    metadata: Dict[str, Any]
    error_message: Optional[str] = None
    cost_credits: int = 0
    processing_time_seconds: float = 0.0
    provider_response: Optional[Dict[str, Any]] = None


class BaseProvider(ABC):
    """Base class for all AI providers."""
    
    def __init__(self, name: str, api_key: str, timeout: int = 300):
        """Initialize base provider.
        
        Args:
            name: Provider name
            api_key: API key for the provider
            timeout: Request timeout in seconds
        """
        self.name = name
        self.api_key = api_key
        self.timeout = timeout
        self.logger = logger.bind(provider=name)
    
    @property
    @abstractmethod
    def capabilities(self) -> ProviderCapabilities:
        """Get provider capabilities."""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if provider is available and healthy."""
        pass
    
    @abstractmethod
    async def estimate_cost(self, request: GenerationRequest) -> int:
        """Estimate cost in credits for the generation request."""
        pass
    
    @abstractmethod
    async def generate(self, request: GenerationRequest) -> GenerationResult:
        """Generate content based on the request."""
        pass
    
    async def cancel_generation(self, job_id: UUID) -> bool:
        """Cancel an ongoing generation (if supported)."""
        self.logger.info("Cancel generation requested", job_id=str(job_id))
        # Default implementation - not all providers support cancellation
        return False
    
    async def get_generation_status(self, job_id: UUID) -> Optional[GenerationStatus]:
        """Get status of an ongoing generation (if supported)."""
        # Default implementation - return None if not supported
        return None
    
    def _validate_request(self, request: GenerationRequest) -> None:
        """Validate generation request against provider capabilities."""
        if not request.prompt:
            raise ValueError("Prompt is required")
        
        if not request.job_id:
            raise ValueError("Job ID is required")
        
        if not request.user_id:
            raise ValueError("User ID is required")
    
    async def _with_timeout(self, coro, timeout: Optional[int] = None):
        """Execute coroutine with timeout."""
        timeout = timeout or self.timeout
        try:
            return await asyncio.wait_for(coro, timeout=timeout)
        except asyncio.TimeoutError:
            self.logger.error("Provider request timed out", timeout=timeout)
            raise


class VideoProvider(BaseProvider):
    """Base class for video generation providers."""
    
    @abstractmethod
    async def generate_video(
        self,
        request: GenerationRequest,
        duration: int,
        resolution: str = "1080p",
        fps: int = 30,
        style: str = "cinematic"
    ) -> GenerationResult:
        """Generate video content."""
        pass


class ImageProvider(BaseProvider):
    """Base class for image generation providers."""
    
    @abstractmethod
    async def generate_image(
        self,
        request: GenerationRequest,
        dimensions: str = "1024x1024",
        count: int = 1,
        style: str = "photorealistic",
        quality: str = "standard"
    ) -> GenerationResult:
        """Generate image content."""
        pass
    
    async def generate_variations(
        self,
        request: GenerationRequest,
        source_image_url: str,
        count: int = 2
    ) -> GenerationResult:
        """Generate variations of an existing image."""
        # Default implementation - not all providers support this
        raise NotImplementedError("Image variations not supported by this provider")
    
    async def upscale_image(
        self,
        request: GenerationRequest,
        source_image_url: str,
        scale_factor: int = 2
    ) -> GenerationResult:
        """Upscale an existing image."""
        # Default implementation - not all providers support this
        raise NotImplementedError("Image upscaling not supported by this provider")


class MusicProvider(BaseProvider):
    """Base class for music generation providers."""
    
    @abstractmethod
    async def generate_music(
        self,
        request: GenerationRequest,
        duration: int,
        genre: str = "electronic",
        mood: str = "upbeat",
        tempo: Optional[int] = None,
        key: Optional[str] = None
    ) -> GenerationResult:
        """Generate music content."""
        pass
    
    async def extend_music(
        self,
        request: GenerationRequest,
        source_music_url: str,
        additional_duration: int
    ) -> GenerationResult:
        """Extend an existing music track."""
        # Default implementation - not all providers support this
        raise NotImplementedError("Music extension not supported by this provider")


class AudioProvider(BaseProvider):
    """Base class for audio/voice generation providers."""
    
    @abstractmethod
    async def generate_speech(
        self,
        request: GenerationRequest,
        text: str,
        voice: str = "default",
        language: str = "en",
        speed: float = 1.0
    ) -> GenerationResult:
        """Generate speech from text."""
        pass
    
    async def clone_voice(
        self,
        request: GenerationRequest,
        source_audio_url: str,
        text: str
    ) -> GenerationResult:
        """Clone voice from sample and generate speech."""
        # Default implementation - not all providers support this
        raise NotImplementedError("Voice cloning not supported by this provider")