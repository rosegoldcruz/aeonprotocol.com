"""Provider registry for managing AI providers."""

from typing import Dict, List, Optional, Type, Union

import structlog

from .base.interfaces import BaseProvider, MediaType
from .openai.client import OpenAIProvider
from .replicate.client import ReplicateProvider
from .elevenlabs.client import ElevenLabsProvider
from ..config import settings
from ..exceptions import ProviderError

logger = structlog.get_logger()


class ProviderRegistry:
    """Registry for managing AI providers."""
    
    def __init__(self):
        """Initialize provider registry."""
        self._providers: Dict[str, BaseProvider] = {}
        self._media_type_providers: Dict[MediaType, List[str]] = {
            MediaType.VIDEO: [],
            MediaType.IMAGE: [],
            MediaType.MUSIC: [],
            MediaType.AUDIO: [],
        }
        self._initialize_providers()
    
    def _initialize_providers(self) -> None:
        """Initialize all available providers."""
        try:
            # Initialize OpenAI provider
            if settings.openai_api_key:
                openai_provider = OpenAIProvider(
                    api_key=settings.openai_api_key,
                    timeout=120
                )
                self.register_provider("openai", openai_provider)
                logger.info("OpenAI provider initialized")
            else:
                logger.warning("OpenAI API key not configured")
            
            # Initialize Replicate provider
            if settings.replicate_api_token:
                replicate_provider = ReplicateProvider(
                    api_key=settings.replicate_api_token,
                    timeout=300
                )
                self.register_provider("replicate", replicate_provider)
                logger.info("Replicate provider initialized")
            else:
                logger.warning("Replicate API token not configured")
            
            # Initialize ElevenLabs provider
            if settings.elevenlabs_api_key:
                elevenlabs_provider = ElevenLabsProvider(
                    api_key=settings.elevenlabs_api_key,
                    timeout=120
                )
                self.register_provider("elevenlabs", elevenlabs_provider)
                logger.info("ElevenLabs provider initialized")
            else:
                logger.warning("ElevenLabs API key not configured")
                
        except Exception as e:
            logger.error("Failed to initialize providers", error=str(e))
            raise ProviderError("Failed to initialize AI providers", str(e))
    
    def register_provider(self, name: str, provider: BaseProvider) -> None:
        """Register a provider.
        
        Args:
            name: Provider name
            provider: Provider instance
        """
        self._providers[name] = provider
        
        # Register provider for supported media types
        for media_type in provider.capabilities.media_types:
            if name not in self._media_type_providers[media_type]:
                self._media_type_providers[media_type].append(name)
        
        logger.info("Provider registered", name=name, media_types=provider.capabilities.media_types)
    
    def get_provider(self, name: str) -> Optional[BaseProvider]:
        """Get provider by name.
        
        Args:
            name: Provider name
            
        Returns:
            Provider instance or None if not found
        """
        return self._providers.get(name)
    
    def get_providers_for_media_type(self, media_type: MediaType) -> List[BaseProvider]:
        """Get all providers that support a media type.
        
        Args:
            media_type: Media type
            
        Returns:
            List of provider instances
        """
        provider_names = self._media_type_providers.get(media_type, [])
        return [self._providers[name] for name in provider_names if name in self._providers]
    
    def get_best_provider(
        self,
        media_type: MediaType,
        preferences: Optional[Dict[str, any]] = None
    ) -> Optional[BaseProvider]:
        """Get the best provider for a media type based on preferences.
        
        Args:
            media_type: Media type
            preferences: Provider preferences (cost, speed, quality, etc.)
            
        Returns:
            Best provider instance or None if no providers available
        """
        providers = self.get_providers_for_media_type(media_type)
        if not providers:
            return None
        
        if not preferences:
            # Return first available provider
            return providers[0]
        
        # Score providers based on preferences
        scored_providers = []
        for provider in providers:
            score = self._score_provider(provider, preferences)
            scored_providers.append((score, provider))
        
        # Sort by score (higher is better)
        scored_providers.sort(key=lambda x: x[0], reverse=True)
        
        return scored_providers[0][1] if scored_providers else None
    
    def _score_provider(self, provider: BaseProvider, preferences: Dict[str, any]) -> float:
        """Score a provider based on preferences.
        
        Args:
            provider: Provider to score
            preferences: Scoring preferences
            
        Returns:
            Provider score (higher is better)
        """
        score = 0.0
        
        # Cost preference (lower cost = higher score)
        if "cost_weight" in preferences:
            cost_weight = preferences["cost_weight"]
            estimated_cost = provider.capabilities.estimated_cost_per_unit
            # Normalize cost score (assuming max cost of 1.0)
            cost_score = max(0, 1.0 - estimated_cost)
            score += cost_weight * cost_score
        
        # Speed preference (higher rate limit = higher score)
        if "speed_weight" in preferences:
            speed_weight = preferences["speed_weight"]
            rate_limit = provider.capabilities.rate_limit_per_minute or 10
            # Normalize speed score (assuming max rate limit of 100)
            speed_score = min(1.0, rate_limit / 100.0)
            score += speed_weight * speed_score
        
        # Quality preference (provider-specific scoring)
        if "quality_weight" in preferences:
            quality_weight = preferences["quality_weight"]
            quality_score = self._get_quality_score(provider)
            score += quality_weight * quality_score
        
        return score
    
    def _get_quality_score(self, provider: BaseProvider) -> float:
        """Get quality score for provider (0.0 to 1.0).
        
        Args:
            provider: Provider to score
            
        Returns:
            Quality score
        """
        # Provider-specific quality scores (subjective)
        quality_scores = {
            "openai": 0.9,
            "replicate": 0.8,
            "elevenlabs": 0.85,
        }
        return quality_scores.get(provider.name, 0.5)
    
    def list_providers(self) -> List[str]:
        """List all registered provider names.
        
        Returns:
            List of provider names
        """
        return list(self._providers.keys())
    
    def get_provider_status(self) -> Dict[str, Dict[str, any]]:
        """Get status of all providers.
        
        Returns:
            Dict mapping provider names to their status
        """
        status = {}
        for name, provider in self._providers.items():
            try:
                status[name] = {
                    "name": name,
                    "capabilities": {
                        "media_types": [mt.value for mt in provider.capabilities.media_types],
                        "max_duration_seconds": provider.capabilities.max_duration_seconds,
                        "max_resolution": provider.capabilities.max_resolution,
                        "supported_formats": provider.capabilities.supported_formats,
                        "supports_batch": provider.capabilities.supports_batch,
                        "max_batch_size": provider.capabilities.max_batch_size,
                        "rate_limit_per_minute": provider.capabilities.rate_limit_per_minute,
                        "estimated_cost_per_unit": provider.capabilities.estimated_cost_per_unit,
                    },
                    "healthy": True,  # Would check with provider.health_check() in real implementation
                }
            except Exception as e:
                status[name] = {
                    "name": name,
                    "healthy": False,
                    "error": str(e)
                }
        
        return status
    
    async def health_check_all(self) -> Dict[str, bool]:
        """Health check all providers.
        
        Returns:
            Dict mapping provider names to health status
        """
        health_status = {}
        for name, provider in self._providers.items():
            try:
                healthy = await provider.health_check()
                health_status[name] = healthy
                logger.debug("Provider health check", provider=name, healthy=healthy)
            except Exception as e:
                health_status[name] = False
                logger.error("Provider health check failed", provider=name, error=str(e))
        
        return health_status


# Global provider registry instance
_registry = None


def get_registry() -> ProviderRegistry:
    """Get the global provider registry instance."""
    global _registry
    if _registry is None:
        _registry = ProviderRegistry()
    return _registry


def get_provider(name: str) -> Optional[BaseProvider]:
    """Get provider by name from global registry.
    
    Args:
        name: Provider name
        
    Returns:
        Provider instance or None if not found
    """
    return get_registry().get_provider(name)


def get_providers_for_media_type(media_type: Union[MediaType, str]) -> List[BaseProvider]:
    """Get providers for media type from global registry.
    
    Args:
        media_type: Media type (enum or string)
        
    Returns:
        List of provider instances
    """
    if isinstance(media_type, str):
        media_type = MediaType(media_type)
    
    return get_registry().get_providers_for_media_type(media_type)


def get_best_provider(
    media_type: Union[MediaType, str],
    preferences: Optional[Dict[str, any]] = None
) -> Optional[BaseProvider]:
    """Get best provider for media type from global registry.
    
    Args:
        media_type: Media type (enum or string)
        preferences: Provider preferences
        
    Returns:
        Best provider instance or None
    """
    if isinstance(media_type, str):
        media_type = MediaType(media_type)
    
    return get_registry().get_best_provider(media_type, preferences)