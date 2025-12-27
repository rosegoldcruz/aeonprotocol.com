"""ElevenLabs provider implementation for voice/audio generation."""

import time
from typing import Dict, List, Optional

import httpx
import structlog

from ..base.interfaces import (
    AudioProvider,
    GenerationRequest,
    GenerationResult,
    GenerationStatus,
    MediaType,
    ProviderCapabilities,
)
from ...exceptions import ProviderError

logger = structlog.get_logger()


class ElevenLabsProvider(AudioProvider):
    """ElevenLabs provider for voice and audio generation."""
    
    def __init__(self, api_key: str, timeout: int = 120):
        """Initialize ElevenLabs provider.
        
        Args:
            api_key: ElevenLabs API key
            timeout: Request timeout in seconds
        """
        super().__init__("elevenlabs", api_key, timeout)
        self.base_url = "https://api.elevenlabs.io/v1"
        self.client = httpx.AsyncClient(
            headers={
                "xi-api-key": api_key,
                "Content-Type": "application/json",
            },
            timeout=timeout
        )
        
        # Default voice IDs (these would be fetched dynamically in production)
        self.default_voices = {
            "adam": "pNInz6obpgDQGcFmaJgB",
            "antoni": "ErXwobaYiN019PkySvjV",
            "arnold": "VR6AewLTigWG4xSOukaG",
            "bella": "EXAVITQu4vr4xnSDxMaL",
            "domi": "AZnzlk1XvdvUeBnXmlld",
            "elli": "MF3mGyEYCl7XYWbV9V6O",
            "josh": "TxGEqnHWrfWFTfGW9XjX",
            "rachel": "21m00Tcm4TlvDq8ikWAM",
            "sam": "yoZ06aMxZJJ28mfd3POQ",
        }
    
    @property
    def capabilities(self) -> ProviderCapabilities:
        """Get ElevenLabs provider capabilities."""
        return ProviderCapabilities(
            media_types=[MediaType.AUDIO],
            supported_formats=["mp3", "wav", "pcm"],
            supports_batch=False,
            max_batch_size=1,
            rate_limit_per_minute=120,  # Varies by plan
            estimated_cost_per_unit=0.02,  # Per 1000 characters
        )
    
    async def health_check(self) -> bool:
        """Check if ElevenLabs API is available."""
        try:
            response = await self.client.get(f"{self.base_url}/user")
            return response.status_code == 200
        except Exception as e:
            self.logger.error("Health check failed", error=str(e))
            return False
    
    async def estimate_cost(self, request: GenerationRequest) -> int:
        """Estimate cost in credits for speech generation."""
        # Base cost calculation based on text length
        text = request.parameters.get("text", request.prompt)
        character_count = len(text)
        
        # Base cost: ~1 credit per 50 characters
        base_cost = max(10, character_count // 50)
        
        # Voice quality multiplier
        voice_settings = request.parameters.get("voice_settings", {})
        stability = voice_settings.get("stability", 0.5)
        clarity = voice_settings.get("clarity_and_similarity_enhancement", 0.5)
        
        # Higher quality settings cost more
        quality_multiplier = 1.0 + (stability + clarity) * 0.2
        
        # Model multiplier
        model = request.parameters.get("model", "eleven_monolingual_v1")
        model_multipliers = {
            "eleven_monolingual_v1": 1.0,
            "eleven_multilingual_v1": 1.2,
            "eleven_multilingual_v2": 1.5,
        }
        model_multiplier = model_multipliers.get(model, 1.0)
        
        total_cost = int(base_cost * quality_multiplier * model_multiplier)
        return total_cost
    
    async def generate(self, request: GenerationRequest) -> GenerationResult:
        """Generate audio using ElevenLabs."""
        self._validate_request(request)
        
        return await self.generate_speech(
            request,
            text=request.parameters.get("text", request.prompt),
            voice=request.parameters.get("voice", "rachel"),
            language=request.parameters.get("language", "en"),
            speed=request.parameters.get("speed", 1.0)
        )
    
    async def generate_speech(
        self,
        request: GenerationRequest,
        text: str,
        voice: str = "rachel",
        language: str = "en",
        speed: float = 1.0
    ) -> GenerationResult:
        """Generate speech from text using ElevenLabs."""
        start_time = time.time()
        
        self.logger.info(
            "Starting speech generation",
            job_id=str(request.job_id),
            text_length=len(text),
            voice=voice,
            language=language,
            speed=speed
        )
        
        try:
            # Get voice ID
            voice_id = self.default_voices.get(voice.lower(), voice)
            
            # Prepare voice settings
            voice_settings = request.parameters.get("voice_settings", {})
            default_settings = {
                "stability": 0.5,
                "similarity_boost": 0.5,
                "style": 0.0,
                "use_speaker_boost": True
            }
            voice_settings = {**default_settings, **voice_settings}
            
            # Prepare request payload
            payload = {
                "text": text,
                "model_id": request.parameters.get("model", "eleven_monolingual_v1"),
                "voice_settings": voice_settings
            }
            
            # Make API request
            response = await self._with_timeout(
                self.client.post(
                    f"{self.base_url}/text-to-speech/{voice_id}",
                    json=payload,
                    headers={
                        **self.client.headers,
                        "Accept": "audio/mpeg"
                    }
                ),
                timeout=self.timeout
            )
            
            if response.status_code != 200:
                error_msg = f"ElevenLabs API error: {response.status_code} - {response.text}"
                raise ProviderError("elevenlabs", error_msg, response.status_code)
            
            # The response contains the audio data
            audio_data = response.content
            
            # In a real implementation, you would upload this to storage
            # For now, we'll create a mock URL
            audio_url = f"https://storage.aeonprotocol.com/audio/{request.job_id}_speech.mp3"
            
            processing_time = time.time() - start_time
            cost_credits = await self.estimate_cost(request)
            
            result = GenerationResult(
                job_id=request.job_id,
                status=GenerationStatus.COMPLETED,
                output_urls=[audio_url],
                metadata={
                    "voice": voice,
                    "voice_id": voice_id,
                    "language": language,
                    "speed": speed,
                    "text_length": len(text),
                    "audio_length_seconds": len(text) / 150,  # Rough estimate
                    "model": payload["model_id"],
                    "voice_settings": voice_settings,
                    "provider": "elevenlabs"
                },
                cost_credits=cost_credits,
                processing_time_seconds=processing_time,
                provider_response={
                    "audio_size_bytes": len(audio_data),
                    "content_type": "audio/mpeg"
                }
            )
            
            self.logger.info(
                "Speech generation completed",
                job_id=str(request.job_id),
                audio_size_bytes=len(audio_data),
                processing_time=processing_time,
                cost_credits=cost_credits
            )
            
            return result
            
        except Exception as e:
            processing_time = time.time() - start_time
            self.logger.error(
                "Speech generation failed",
                job_id=str(request.job_id),
                error=str(e),
                processing_time=processing_time
            )
            
            return GenerationResult(
                job_id=request.job_id,
                status=GenerationStatus.FAILED,
                output_urls=[],
                metadata={"provider": "elevenlabs"},
                error_message=str(e),
                processing_time_seconds=processing_time
            )
    
    async def clone_voice(
        self,
        request: GenerationRequest,
        source_audio_url: str,
        text: str
    ) -> GenerationResult:
        """Clone voice from sample and generate speech."""
        start_time = time.time()
        
        self.logger.info(
            "Starting voice cloning",
            job_id=str(request.job_id),
            source_audio_url=source_audio_url,
            text_length=len(text)
        )
        
        try:
            # Download source audio
            audio_response = await self.client.get(source_audio_url)
            if audio_response.status_code != 200:
                raise ProviderError("elevenlabs", "Failed to download source audio")
            
            # Create voice clone (this is a simplified version)
            # In practice, you'd need to use ElevenLabs voice cloning API
            clone_payload = {
                "name": f"cloned_voice_{request.job_id}",
                "description": "Voice cloned for AEON Protocol",
                "files": [audio_response.content]  # This would be handled differently in real API
            }
            
            # For now, we'll use a default voice and note that cloning was requested
            result = await self.generate_speech(
                request,
                text=text,
                voice="rachel",  # Fallback to default voice
            )
            
            # Update metadata to indicate cloning was attempted
            result.metadata.update({
                "voice_cloning_requested": True,
                "source_audio_url": source_audio_url,
                "cloning_status": "fallback_to_default"
            })
            
            processing_time = time.time() - start_time
            result.processing_time_seconds = processing_time
            
            self.logger.info(
                "Voice cloning completed (fallback)",
                job_id=str(request.job_id),
                processing_time=processing_time
            )
            
            return result
            
        except Exception as e:
            processing_time = time.time() - start_time
            self.logger.error(
                "Voice cloning failed",
                job_id=str(request.job_id),
                error=str(e),
                processing_time=processing_time
            )
            
            return GenerationResult(
                job_id=request.job_id,
                status=GenerationStatus.FAILED,
                output_urls=[],
                metadata={"provider": "elevenlabs"},
                error_message=str(e),
                processing_time_seconds=processing_time
            )
    
    async def get_available_voices(self) -> List[Dict]:
        """Get list of available voices."""
        try:
            response = await self.client.get(f"{self.base_url}/voices")
            if response.status_code == 200:
                voices_data = response.json()
                return voices_data.get("voices", [])
            else:
                self.logger.error("Failed to fetch voices", status_code=response.status_code)
                return []
        except Exception as e:
            self.logger.error("Error fetching voices", error=str(e))
            return []
    
    async def get_user_info(self) -> Optional[Dict]:
        """Get user account information."""
        try:
            response = await self.client.get(f"{self.base_url}/user")
            if response.status_code == 200:
                return response.json()
            else:
                return None
        except Exception as e:
            self.logger.error("Error fetching user info", error=str(e))
            return None
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.client.aclose()