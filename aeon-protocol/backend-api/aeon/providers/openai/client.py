"""OpenAI provider implementation."""

import asyncio
import time
from typing import Dict, List, Optional

import httpx
import structlog

from ..base.interfaces import (
    ImageProvider,
    GenerationRequest,
    GenerationResult,
    GenerationStatus,
    MediaType,
    ProviderCapabilities,
)
from ...exceptions import ProviderError

logger = structlog.get_logger()


class OpenAIProvider(ImageProvider):
    """OpenAI provider for image generation using DALL-E."""
    
    def __init__(self, api_key: str, timeout: int = 120):
        """Initialize OpenAI provider.
        
        Args:
            api_key: OpenAI API key
            timeout: Request timeout in seconds
        """
        super().__init__("openai", api_key, timeout)
        self.base_url = "https://api.openai.com/v1"
        self.client = httpx.AsyncClient(
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=timeout
        )
    
    @property
    def capabilities(self) -> ProviderCapabilities:
        """Get OpenAI provider capabilities."""
        return ProviderCapabilities(
            media_types=[MediaType.IMAGE],
            supported_formats=["png", "jpg", "jpeg"],
            supports_batch=False,
            max_batch_size=1,
            rate_limit_per_minute=50,  # Varies by tier
            estimated_cost_per_unit=0.04,  # Approximate cost per image
        )
    
    async def health_check(self) -> bool:
        """Check if OpenAI API is available."""
        try:
            response = await self.client.get(f"{self.base_url}/models")
            return response.status_code == 200
        except Exception as e:
            self.logger.error("Health check failed", error=str(e))
            return False
    
    async def estimate_cost(self, request: GenerationRequest) -> int:
        """Estimate cost in credits for image generation."""
        # Base cost calculation
        base_cost = 50  # Base cost in credits
        
        # Parameters from request
        dimensions = request.parameters.get("dimensions", "1024x1024")
        count = request.parameters.get("count", 1)
        quality = request.parameters.get("quality", "standard")
        model = request.parameters.get("model", "dall-e-3")
        
        # Dimension multiplier
        dimension_multipliers = {
            "256x256": 0.5,
            "512x512": 0.8,
            "1024x1024": 1.0,
            "1024x1792": 1.3,
            "1792x1024": 1.3,
        }
        dimension_multiplier = dimension_multipliers.get(dimensions, 1.0)
        
        # Quality multiplier
        quality_multiplier = 1.5 if quality == "hd" else 1.0
        
        # Model multiplier
        model_multiplier = 1.0 if model == "dall-e-2" else 1.3  # DALL-E 3 is more expensive
        
        total_cost = int(
            base_cost * dimension_multiplier * quality_multiplier * model_multiplier * count
        )
        
        return total_cost
    
    async def generate(self, request: GenerationRequest) -> GenerationResult:
        """Generate image using OpenAI DALL-E."""
        self._validate_request(request)
        
        start_time = time.time()
        
        try:
            result = await self.generate_image(
                request,
                dimensions=request.parameters.get("dimensions", "1024x1024"),
                count=request.parameters.get("count", 1),
                quality=request.parameters.get("quality", "standard"),
                style=request.parameters.get("style", "vivid")
            )
            
            return result
            
        except Exception as e:
            self.logger.error("Image generation failed", job_id=str(request.job_id), error=str(e))
            return GenerationResult(
                job_id=request.job_id,
                status=GenerationStatus.FAILED,
                output_urls=[],
                metadata={},
                error_message=str(e),
                processing_time_seconds=time.time() - start_time
            )
    
    async def generate_image(
        self,
        request: GenerationRequest,
        dimensions: str = "1024x1024",
        count: int = 1,
        style: str = "vivid",
        quality: str = "standard"
    ) -> GenerationResult:
        """Generate image using DALL-E."""
        start_time = time.time()
        
        self.logger.info(
            "Starting image generation",
            job_id=str(request.job_id),
            prompt=request.prompt[:100],
            dimensions=dimensions,
            count=count,
            quality=quality
        )
        
        try:
            # Prepare request payload
            payload = {
                "model": request.parameters.get("model", "dall-e-3"),
                "prompt": request.prompt,
                "n": min(count, 10),  # OpenAI limits
                "size": dimensions,
                "quality": quality,
                "style": style,
                "response_format": "url"
            }
            
            # Add negative prompt if provided (for DALL-E 3)
            if "negative_prompt" in request.parameters:
                # DALL-E doesn't support negative prompts directly,
                # but we can modify the prompt
                negative_prompt = request.parameters["negative_prompt"]
                payload["prompt"] = f"{request.prompt}. Avoid: {negative_prompt}"
            
            # Make API request
            response = await self._with_timeout(
                self.client.post(f"{self.base_url}/images/generations", json=payload),
                timeout=self.timeout
            )
            
            if response.status_code != 200:
                error_msg = f"OpenAI API error: {response.status_code} - {response.text}"
                raise ProviderError("openai", error_msg, response.status_code)
            
            response_data = response.json()
            
            # Extract image URLs
            image_urls = []
            for image_data in response_data.get("data", []):
                if "url" in image_data:
                    image_urls.append(image_data["url"])
            
            if not image_urls:
                raise ProviderError("openai", "No images generated")
            
            processing_time = time.time() - start_time
            
            # Estimate cost
            cost_credits = await self.estimate_cost(request)
            
            result = GenerationResult(
                job_id=request.job_id,
                status=GenerationStatus.COMPLETED,
                output_urls=image_urls,
                metadata={
                    "model": payload["model"],
                    "dimensions": dimensions,
                    "quality": quality,
                    "style": style,
                    "count": len(image_urls),
                    "provider": "openai"
                },
                cost_credits=cost_credits,
                processing_time_seconds=processing_time,
                provider_response=response_data
            )
            
            self.logger.info(
                "Image generation completed",
                job_id=str(request.job_id),
                image_count=len(image_urls),
                processing_time=processing_time,
                cost_credits=cost_credits
            )
            
            return result
            
        except Exception as e:
            processing_time = time.time() - start_time
            self.logger.error(
                "Image generation failed",
                job_id=str(request.job_id),
                error=str(e),
                processing_time=processing_time
            )
            
            return GenerationResult(
                job_id=request.job_id,
                status=GenerationStatus.FAILED,
                output_urls=[],
                metadata={"provider": "openai"},
                error_message=str(e),
                processing_time_seconds=processing_time
            )
    
    async def generate_variations(
        self,
        request: GenerationRequest,
        source_image_url: str,
        count: int = 2
    ) -> GenerationResult:
        """Generate variations of an existing image."""
        start_time = time.time()
        
        self.logger.info(
            "Starting image variation generation",
            job_id=str(request.job_id),
            source_image_url=source_image_url,
            count=count
        )
        
        try:
            # Download source image
            image_response = await self.client.get(source_image_url)
            if image_response.status_code != 200:
                raise ProviderError("openai", "Failed to download source image")
            
            # Prepare request payload
            files = {
                "image": ("image.png", image_response.content, "image/png")
            }
            data = {
                "n": min(count, 10),
                "size": request.parameters.get("dimensions", "1024x1024"),
                "response_format": "url"
            }
            
            # Make API request (using form data for image upload)
            response = await self._with_timeout(
                self.client.post(
                    f"{self.base_url}/images/variations",
                    files=files,
                    data=data,
                    headers={"Authorization": f"Bearer {self.api_key}"}  # Override content-type header
                ),
                timeout=self.timeout
            )
            
            if response.status_code != 200:
                error_msg = f"OpenAI API error: {response.status_code} - {response.text}"
                raise ProviderError("openai", error_msg, response.status_code)
            
            response_data = response.json()
            
            # Extract image URLs
            image_urls = []
            for image_data in response_data.get("data", []):
                if "url" in image_data:
                    image_urls.append(image_data["url"])
            
            if not image_urls:
                raise ProviderError("openai", "No variations generated")
            
            processing_time = time.time() - start_time
            cost_credits = await self.estimate_cost(request)
            
            result = GenerationResult(
                job_id=request.job_id,
                status=GenerationStatus.COMPLETED,
                output_urls=image_urls,
                metadata={
                    "source_image_url": source_image_url,
                    "variation_count": len(image_urls),
                    "provider": "openai"
                },
                cost_credits=cost_credits,
                processing_time_seconds=processing_time,
                provider_response=response_data
            )
            
            self.logger.info(
                "Image variation generation completed",
                job_id=str(request.job_id),
                variation_count=len(image_urls),
                processing_time=processing_time
            )
            
            return result
            
        except Exception as e:
            processing_time = time.time() - start_time
            self.logger.error(
                "Image variation generation failed",
                job_id=str(request.job_id),
                error=str(e),
                processing_time=processing_time
            )
            
            return GenerationResult(
                job_id=request.job_id,
                status=GenerationStatus.FAILED,
                output_urls=[],
                metadata={"provider": "openai"},
                error_message=str(e),
                processing_time_seconds=processing_time
            )
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.client.aclose()