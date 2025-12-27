"""Replicate provider implementation."""

import asyncio
import time
from typing import Dict, List, Optional

import httpx
import structlog

from ..base.interfaces import (
    VideoProvider,
    ImageProvider,
    MusicProvider,
    GenerationRequest,
    GenerationResult,
    GenerationStatus,
    MediaType,
    ProviderCapabilities,
)
from ...exceptions import ProviderError

logger = structlog.get_logger()


class ReplicateProvider(VideoProvider, ImageProvider, MusicProvider):
    """Replicate provider for multi-modal AI generation."""
    
    def __init__(self, api_key: str, timeout: int = 300):
        """Initialize Replicate provider.
        
        Args:
            api_key: Replicate API token
            timeout: Request timeout in seconds
        """
        super().__init__("replicate", api_key, timeout)
        self.base_url = "https://api.replicate.com/v1"
        self.client = httpx.AsyncClient(
            headers={
                "Authorization": f"Token {api_key}",
                "Content-Type": "application/json",
            },
            timeout=timeout
        )
        
        # Model mappings
        self.models = {
            "video": {
                "stable-video-diffusion": "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb1a4c8daffcc2a0d68e9a0f0b8e4b7df5b8b7e1e5",
                "zeroscope": "anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
            },
            "image": {
                "stable-diffusion": "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478",
                "sdxl": "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            },
            "music": {
                "musicgen-large": "meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2dbe",
                "musicgen-medium": "meta/musicgen:7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573787906",
            }
        }
    
    @property
    def capabilities(self) -> ProviderCapabilities:
        """Get Replicate provider capabilities."""
        return ProviderCapabilities(
            media_types=[MediaType.VIDEO, MediaType.IMAGE, MediaType.MUSIC],
            max_duration_seconds=300,  # 5 minutes for video/music
            max_resolution="1024x1024",
            supported_formats=["mp4", "png", "jpg", "wav", "mp3"],
            supports_batch=False,
            max_batch_size=1,
            rate_limit_per_minute=30,
            estimated_cost_per_unit=0.10,  # Varies by model
        )
    
    async def health_check(self) -> bool:
        """Check if Replicate API is available."""
        try:
            response = await self.client.get(f"{self.base_url}/models")
            return response.status_code == 200
        except Exception as e:
            self.logger.error("Health check failed", error=str(e))
            return False
    
    async def estimate_cost(self, request: GenerationRequest) -> int:
        """Estimate cost in credits for generation."""
        # Base cost varies by media type
        base_costs = {
            "video": 200,
            "image": 75,
            "music": 150,
        }
        
        media_type = request.parameters.get("media_type", "image")
        base_cost = base_costs.get(media_type, 75)
        
        # Duration multiplier for video/music
        if media_type in ["video", "music"]:
            duration = request.parameters.get("duration", 30)
            duration_multiplier = max(1.0, duration / 30)
            base_cost = int(base_cost * duration_multiplier)
        
        # Quality/resolution multiplier
        if "quality" in request.parameters:
            quality = request.parameters["quality"]
            if quality == "hd":
                base_cost = int(base_cost * 1.5)
            elif quality == "ultra":
                base_cost = int(base_cost * 2.0)
        
        return base_cost
    
    async def generate(self, request: GenerationRequest) -> GenerationResult:
        """Generate content using appropriate Replicate model."""
        self._validate_request(request)
        
        media_type = request.parameters.get("media_type", "image")
        
        if media_type == "video":
            return await self.generate_video(
                request,
                duration=request.parameters.get("duration", 30),
                resolution=request.parameters.get("resolution", "1080p"),
                style=request.parameters.get("style", "cinematic")
            )
        elif media_type == "image":
            return await self.generate_image(
                request,
                dimensions=request.parameters.get("dimensions", "1024x1024"),
                style=request.parameters.get("style", "photorealistic")
            )
        elif media_type == "music":
            return await self.generate_music(
                request,
                duration=request.parameters.get("duration", 30),
                genre=request.parameters.get("genre", "electronic")
            )
        else:
            raise ProviderError("replicate", f"Unsupported media type: {media_type}")
    
    async def generate_video(
        self,
        request: GenerationRequest,
        duration: int,
        resolution: str = "1080p",
        fps: int = 30,
        style: str = "cinematic"
    ) -> GenerationResult:
        """Generate video using Replicate."""
        start_time = time.time()
        
        self.logger.info(
            "Starting video generation",
            job_id=str(request.job_id),
            prompt=request.prompt[:100],
            duration=duration,
            resolution=resolution,
            style=style
        )
        
        try:
            model_name = request.parameters.get("model", "stable-video-diffusion")
            model_version = self.models["video"].get(model_name)
            
            if not model_version:
                raise ProviderError("replicate", f"Unknown video model: {model_name}")
            
            # Prepare input parameters
            input_params = {
                "prompt": request.prompt,
                "num_frames": min(duration * fps, 300),  # Limit frames
                "width": 1024 if "1024" in resolution else 512,
                "height": 576 if "1024" in resolution else 512,
                "num_inference_steps": 25,
                "guidance_scale": 7.5,
            }
            
            # Add style-specific parameters
            if style == "cinematic":
                input_params["guidance_scale"] = 9.0
            elif style == "animated":
                input_params["num_inference_steps"] = 30
            
            # Create prediction
            prediction = await self._create_prediction(model_version, input_params)
            
            # Wait for completion
            result = await self._wait_for_completion(prediction["id"], request.job_id)
            
            processing_time = time.time() - start_time
            cost_credits = await self.estimate_cost(request)
            
            if result["status"] == "succeeded":
                output_urls = result.get("output", [])
                if isinstance(output_urls, str):
                    output_urls = [output_urls]
                
                return GenerationResult(
                    job_id=request.job_id,
                    status=GenerationStatus.COMPLETED,
                    output_urls=output_urls,
                    metadata={
                        "model": model_name,
                        "duration": duration,
                        "resolution": resolution,
                        "fps": fps,
                        "style": style,
                        "provider": "replicate"
                    },
                    cost_credits=cost_credits,
                    processing_time_seconds=processing_time,
                    provider_response=result
                )
            else:
                error_msg = result.get("error", "Video generation failed")
                return GenerationResult(
                    job_id=request.job_id,
                    status=GenerationStatus.FAILED,
                    output_urls=[],
                    metadata={"provider": "replicate"},
                    error_message=error_msg,
                    processing_time_seconds=processing_time
                )
                
        except Exception as e:
            processing_time = time.time() - start_time
            self.logger.error(
                "Video generation failed",
                job_id=str(request.job_id),
                error=str(e),
                processing_time=processing_time
            )
            
            return GenerationResult(
                job_id=request.job_id,
                status=GenerationStatus.FAILED,
                output_urls=[],
                metadata={"provider": "replicate"},
                error_message=str(e),
                processing_time_seconds=processing_time
            )
    
    async def generate_image(
        self,
        request: GenerationRequest,
        dimensions: str = "1024x1024",
        count: int = 1,
        style: str = "photorealistic",
        quality: str = "standard"
    ) -> GenerationResult:
        """Generate image using Replicate."""
        start_time = time.time()
        
        self.logger.info(
            "Starting image generation",
            job_id=str(request.job_id),
            prompt=request.prompt[:100],
            dimensions=dimensions,
            style=style
        )
        
        try:
            model_name = request.parameters.get("model", "sdxl")
            model_version = self.models["image"].get(model_name)
            
            if not model_version:
                raise ProviderError("replicate", f"Unknown image model: {model_name}")
            
            width, height = map(int, dimensions.split("x"))
            
            # Prepare input parameters
            input_params = {
                "prompt": request.prompt,
                "width": width,
                "height": height,
                "num_inference_steps": 30,
                "guidance_scale": 7.5,
                "num_outputs": min(count, 4),  # Limit outputs
                "scheduler": "K_EULER_ANCESTRAL",
            }
            
            # Add negative prompt if provided
            if "negative_prompt" in request.parameters:
                input_params["negative_prompt"] = request.parameters["negative_prompt"]
            
            # Style-specific adjustments
            if style == "photorealistic":
                input_params["guidance_scale"] = 8.0
            elif style == "artistic":
                input_params["guidance_scale"] = 6.0
                input_params["num_inference_steps"] = 40
            
            # Create prediction
            prediction = await self._create_prediction(model_version, input_params)
            
            # Wait for completion
            result = await self._wait_for_completion(prediction["id"], request.job_id)
            
            processing_time = time.time() - start_time
            cost_credits = await self.estimate_cost(request)
            
            if result["status"] == "succeeded":
                output_urls = result.get("output", [])
                if isinstance(output_urls, str):
                    output_urls = [output_urls]
                
                return GenerationResult(
                    job_id=request.job_id,
                    status=GenerationStatus.COMPLETED,
                    output_urls=output_urls,
                    metadata={
                        "model": model_name,
                        "dimensions": dimensions,
                        "style": style,
                        "count": len(output_urls),
                        "provider": "replicate"
                    },
                    cost_credits=cost_credits,
                    processing_time_seconds=processing_time,
                    provider_response=result
                )
            else:
                error_msg = result.get("error", "Image generation failed")
                return GenerationResult(
                    job_id=request.job_id,
                    status=GenerationStatus.FAILED,
                    output_urls=[],
                    metadata={"provider": "replicate"},
                    error_message=error_msg,
                    processing_time_seconds=processing_time
                )
                
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
                metadata={"provider": "replicate"},
                error_message=str(e),
                processing_time_seconds=processing_time
            )
    
    async def generate_music(
        self,
        request: GenerationRequest,
        duration: int,
        genre: str = "electronic",
        mood: str = "upbeat",
        tempo: Optional[int] = None,
        key: Optional[str] = None
    ) -> GenerationResult:
        """Generate music using Replicate MusicGen."""
        start_time = time.time()
        
        self.logger.info(
            "Starting music generation",
            job_id=str(request.job_id),
            prompt=request.prompt[:100],
            duration=duration,
            genre=genre,
            mood=mood
        )
        
        try:
            model_name = request.parameters.get("model", "musicgen-large")
            model_version = self.models["music"].get(model_name)
            
            if not model_version:
                raise ProviderError("replicate", f"Unknown music model: {model_name}")
            
            # Prepare input parameters
            input_params = {
                "prompt": request.prompt,
                "duration": min(duration, 300),  # Max 5 minutes
                "temperature": 1.0,
                "top_k": 250,
                "top_p": 0.0,
                "classifier_free_guidance": 3.0,
            }
            
            # Add genre and mood to prompt
            enhanced_prompt = f"{request.prompt}, {genre} style, {mood} mood"
            if tempo:
                enhanced_prompt += f", {tempo} BPM"
            if key:
                enhanced_prompt += f", in {key}"
            
            input_params["prompt"] = enhanced_prompt
            
            # Create prediction
            prediction = await self._create_prediction(model_version, input_params)
            
            # Wait for completion
            result = await self._wait_for_completion(prediction["id"], request.job_id)
            
            processing_time = time.time() - start_time
            cost_credits = await self.estimate_cost(request)
            
            if result["status"] == "succeeded":
                output_urls = result.get("output", [])
                if isinstance(output_urls, str):
                    output_urls = [output_urls]
                
                return GenerationResult(
                    job_id=request.job_id,
                    status=GenerationStatus.COMPLETED,
                    output_urls=output_urls,
                    metadata={
                        "model": model_name,
                        "duration": duration,
                        "genre": genre,
                        "mood": mood,
                        "tempo": tempo,
                        "key": key,
                        "provider": "replicate"
                    },
                    cost_credits=cost_credits,
                    processing_time_seconds=processing_time,
                    provider_response=result
                )
            else:
                error_msg = result.get("error", "Music generation failed")
                return GenerationResult(
                    job_id=request.job_id,
                    status=GenerationStatus.FAILED,
                    output_urls=[],
                    metadata={"provider": "replicate"},
                    error_message=error_msg,
                    processing_time_seconds=processing_time
                )
                
        except Exception as e:
            processing_time = time.time() - start_time
            self.logger.error(
                "Music generation failed",
                job_id=str(request.job_id),
                error=str(e),
                processing_time=processing_time
            )
            
            return GenerationResult(
                job_id=request.job_id,
                status=GenerationStatus.FAILED,
                output_urls=[],
                metadata={"provider": "replicate"},
                error_message=str(e),
                processing_time_seconds=processing_time
            )
    
    async def _create_prediction(self, model_version: str, input_params: Dict) -> Dict:
        """Create a prediction on Replicate."""
        payload = {
            "version": model_version,
            "input": input_params
        }
        
        response = await self.client.post(f"{self.base_url}/predictions", json=payload)
        
        if response.status_code != 201:
            error_msg = f"Failed to create prediction: {response.status_code} - {response.text}"
            raise ProviderError("replicate", error_msg, response.status_code)
        
        return response.json()
    
    async def _wait_for_completion(self, prediction_id: str, job_id) -> Dict:
        """Wait for prediction to complete."""
        max_wait_time = self.timeout
        poll_interval = 5  # seconds
        total_wait_time = 0
        
        while total_wait_time < max_wait_time:
            response = await self.client.get(f"{self.base_url}/predictions/{prediction_id}")
            
            if response.status_code != 200:
                error_msg = f"Failed to get prediction status: {response.status_code}"
                raise ProviderError("replicate", error_msg, response.status_code)
            
            result = response.json()
            status = result.get("status")
            
            if status in ["succeeded", "failed", "canceled"]:
                return result
            
            # Log progress if available
            if "logs" in result:
                self.logger.debug("Prediction progress", job_id=str(job_id), logs=result["logs"][-200:])
            
            await asyncio.sleep(poll_interval)
            total_wait_time += poll_interval
        
        # Timeout reached
        raise ProviderError("replicate", f"Prediction timed out after {max_wait_time} seconds")
    
    async def get_generation_status(self, job_id) -> Optional[GenerationStatus]:
        """Get status of ongoing generation (if prediction ID is stored)."""
        # In a real implementation, you'd store the prediction ID with the job
        # and check its status here
        return None
    
    async def cancel_generation(self, job_id) -> bool:
        """Cancel ongoing generation (if prediction ID is stored)."""
        # In a real implementation, you'd cancel the prediction
        return False
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.client.aclose()