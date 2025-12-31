"""SceneWriter for splitting scripts into scenes based on duration and beat structure."""

import re
import json
from dataclasses import dataclass, asdict
from typing import List, Optional, Dict, Any
from enum import Enum

import structlog

logger = structlog.get_logger()


class SceneType(Enum):
    """Types of scenes in video content."""
    INTRO = "intro"
    MAIN = "main"
    TRANSITION = "transition"
    CONCLUSION = "conclusion"
    CALL_TO_ACTION = "call_to_action"


class BeatType(Enum):
    """Types of narrative beats."""
    SETUP = "setup"
    CONFLICT = "conflict"
    RESOLUTION = "resolution"
    HOOK = "hook"
    PAYOFF = "payoff"


@dataclass
class Scene:
    """Individual scene in a video script."""
    id: str
    text: str
    duration_seconds: float
    scene_type: SceneType
    beat_type: BeatType
    visual_description: str
    audio_cues: List[str]
    transition_in: Optional[str] = None
    transition_out: Optional[str] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert scene to dictionary."""
        data = asdict(self)
        data['scene_type'] = self.scene_type.value
        data['beat_type'] = self.beat_type.value
        return data


@dataclass
class ScenePlan:
    """Complete scene plan for a video script."""
    script_id: str
    total_duration: float
    target_duration: float
    scenes: List[Scene]
    language: str = "en"
    style: str = "standard"
    pacing: str = "medium"
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert scene plan to dictionary."""
        return {
            "script_id": self.script_id,
            "total_duration": self.total_duration,
            "target_duration": self.target_duration,
            "scenes": [scene.to_dict() for scene in self.scenes],
            "language": self.language,
            "style": self.style,
            "pacing": self.pacing,
            "metadata": self.metadata
        }
    
    def to_json(self) -> str:
        """Convert scene plan to JSON string."""
        return json.dumps(self.to_dict(), indent=2)


class SceneWriter:
    """Script splitter that creates scenes based on duration and beat structure."""
    
    # Profanity filter words (basic list - in production, use a comprehensive library)
    PROFANITY_WORDS = {
        "en": [
            "damn", "hell", "shit", "fuck", "bitch", "ass", "bastard",
            "crap", "piss", "cock", "dick", "pussy", "whore", "slut"
        ],
        "es": ["mierda", "joder", "coño", "puta", "cabrón"],
        "fr": ["merde", "putain", "con", "salope"],
        "de": ["scheiße", "verdammt", "arsch", "fotze"],
    }
    
    # Language-specific sentence patterns
    SENTENCE_PATTERNS = {
        "en": r'[.!?]+\s+',
        "es": r'[.!?¡¿]+\s+',
        "fr": r'[.!?]+\s+',
        "de": r'[.!?]+\s+',
        "it": r'[.!?]+\s+',
        "pt": r'[.!?]+\s+',
    }
    
    # Words per minute by language (for duration estimation)
    WPM_BY_LANGUAGE = {
        "en": 150,  # English
        "es": 180,  # Spanish (faster)
        "fr": 160,  # French
        "de": 140,  # German (slower due to compound words)
        "it": 170,  # Italian
        "pt": 165,  # Portuguese
        "zh": 200,  # Chinese (characters per minute)
        "ja": 180,  # Japanese
    }
    
    # Scene type keywords for automatic classification
    SCENE_TYPE_KEYWORDS = {
        SceneType.INTRO: [
            "welcome", "hello", "introduction", "today", "we're going to",
            "let's start", "beginning", "first", "opening"
        ],
        SceneType.MAIN: [
            "now", "next", "then", "here's how", "the main", "importantly",
            "key point", "focus on", "remember", "consider"
        ],
        SceneType.TRANSITION: [
            "moving on", "next up", "now that", "speaking of", "on the other hand",
            "meanwhile", "however", "but", "additionally", "furthermore"
        ],
        SceneType.CONCLUSION: [
            "in conclusion", "to summarize", "finally", "in the end",
            "wrapping up", "to recap", "overall", "ultimately"
        ],
        SceneType.CALL_TO_ACTION: [
            "subscribe", "like", "share", "comment", "visit", "check out",
            "don't forget", "make sure to", "click", "follow", "join"
        ]
    }
    
    # Beat type keywords
    BEAT_TYPE_KEYWORDS = {
        BeatType.SETUP: [
            "imagine", "picture this", "let's say", "suppose", "what if",
            "here's the situation", "context", "background"
        ],
        BeatType.CONFLICT: [
            "problem", "issue", "challenge", "difficulty", "struggle",
            "but", "however", "unfortunately", "the trouble is"
        ],
        BeatType.RESOLUTION: [
            "solution", "answer", "here's how", "the way to", "fix",
            "resolve", "solve", "overcome", "address"
        ],
        BeatType.HOOK: [
            "wait until you hear", "you won't believe", "shocking",
            "amazing", "incredible", "secret", "revealed", "exposed"
        ],
        BeatType.PAYOFF: [
            "and that's why", "this is the result", "here's what happened",
            "the outcome", "it turns out", "revelation", "twist"
        ]
    }
    
    def __init__(self, language: str = "en", profanity_filter: bool = True):
        """Initialize SceneWriter.
        
        Args:
            language: Target language code
            profanity_filter: Whether to filter profanity
        """
        self.language = language.lower()
        self.profanity_filter = profanity_filter
        self.logger = logger.bind(component="scene_writer", language=language)
    
    def split_script(
        self,
        script: str,
        target_duration: float,
        script_id: str,
        style: str = "standard",
        pacing: str = "medium"
    ) -> ScenePlan:
        """Split script into scenes based on duration and beat structure.
        
        Args:
            script: The script text to split
            target_duration: Target video duration in seconds
            script_id: Unique identifier for the script
            style: Video style (affects pacing)
            pacing: Pacing preference (slow, medium, fast)
            
        Returns:
            ScenePlan with scenes and metadata
        """
        self.logger.info(
            "Starting script analysis",
            script_id=script_id,
            script_length=len(script),
            target_duration=target_duration,
            style=style,
            pacing=pacing
        )
        
        try:
            # Clean and validate script
            cleaned_script = self._clean_script(script)
            
            # Estimate total speaking time
            total_speaking_time = self._estimate_speaking_time(cleaned_script)
            
            # Split into sentences
            sentences = self._split_into_sentences(cleaned_script)
            
            # Group sentences into logical segments
            segments = self._group_sentences(sentences, target_duration, pacing)
            
            # Create scenes from segments
            scenes = self._create_scenes(segments, target_duration, style)
            
            # Optimize scene timing
            optimized_scenes = self._optimize_timing(scenes, target_duration)
            
            # Calculate actual total duration
            actual_duration = sum(scene.duration_seconds for scene in optimized_scenes)
            
            scene_plan = ScenePlan(
                script_id=script_id,
                total_duration=actual_duration,
                target_duration=target_duration,
                scenes=optimized_scenes,
                language=self.language,
                style=style,
                pacing=pacing,
                metadata={
                    "original_script_length": len(script),
                    "cleaned_script_length": len(cleaned_script),
                    "estimated_speaking_time": total_speaking_time,
                    "sentence_count": len(sentences),
                    "scene_count": len(optimized_scenes),
                    "timing_efficiency": actual_duration / target_duration if target_duration > 0 else 1.0,
                    "average_scene_duration": actual_duration / len(optimized_scenes) if optimized_scenes else 0,
                    "profanity_filtered": self.profanity_filter
                }
            )
            
            self.logger.info(
                "Script analysis completed",
                script_id=script_id,
                scene_count=len(optimized_scenes),
                actual_duration=actual_duration,
                target_duration=target_duration,
                efficiency=scene_plan.metadata["timing_efficiency"]
            )
            
            return scene_plan
            
        except Exception as e:
            self.logger.error("Script analysis failed", script_id=script_id, error=str(e))
            raise
    
    def _clean_script(self, script: str) -> str:
        """Clean and validate script text."""
        # Remove excessive whitespace
        cleaned = re.sub(r'\s+', ' ', script.strip())
        
        # Remove stage directions in brackets
        cleaned = re.sub(r'\[.*?\]', '', cleaned)
        
        # Remove speaker names (NAME: text)
        cleaned = re.sub(r'^[A-Z\s]+:\s*', '', cleaned, flags=re.MULTILINE)
        
        # Apply profanity filter if enabled
        if self.profanity_filter:
            cleaned = self._filter_profanity(cleaned)
        
        # Ensure minimum length
        if len(cleaned.strip()) < 10:
            raise ValueError("Script is too short (minimum 10 characters)")
        
        return cleaned
    
    def _filter_profanity(self, text: str) -> str:
        """Filter profanity from text."""
        profanity_words = self.PROFANITY_WORDS.get(self.language, [])
        
        for word in profanity_words:
            # Replace with asterisks, keeping first and last character
            if len(word) > 2:
                replacement = word[0] + '*' * (len(word) - 2) + word[-1]
            else:
                replacement = '*' * len(word)
            
            # Case-insensitive replacement
            pattern = re.compile(re.escape(word), re.IGNORECASE)
            text = pattern.sub(replacement, text)
        
        return text
    
    def _estimate_speaking_time(self, text: str) -> float:
        """Estimate speaking time in seconds."""
        words = len(text.split())
        wpm = self.WPM_BY_LANGUAGE.get(self.language, 150)
        return (words / wpm) * 60  # Convert to seconds
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        pattern = self.SENTENCE_PATTERNS.get(self.language, r'[.!?]+\s+')
        sentences = re.split(pattern, text)
        
        # Clean up sentences
        sentences = [s.strip() for s in sentences if s.strip()]
        
        # Merge very short sentences with the next one
        merged_sentences = []
        i = 0
        while i < len(sentences):
            sentence = sentences[i]
            
            # If sentence is very short and there's a next sentence, merge them
            if len(sentence.split()) < 3 and i < len(sentences) - 1:
                sentence = f"{sentence}. {sentences[i + 1]}"
                i += 2
            else:
                i += 1
            
            merged_sentences.append(sentence)
        
        return merged_sentences
    
    def _group_sentences(
        self, 
        sentences: List[str], 
        target_duration: float, 
        pacing: str
    ) -> List[List[str]]:
        """Group sentences into logical segments."""
        # Calculate target sentences per segment based on pacing
        pacing_multipliers = {"slow": 0.7, "medium": 1.0, "fast": 1.3}
        multiplier = pacing_multipliers.get(pacing, 1.0)
        
        # Estimate average segment length
        total_sentences = len(sentences)
        estimated_segments = max(2, int(target_duration / 15 * multiplier))  # ~15 seconds per segment
        sentences_per_segment = max(1, total_sentences // estimated_segments)
        
        segments = []
        current_segment = []
        
        for i, sentence in enumerate(sentences):
            current_segment.append(sentence)
            
            # Check if we should end this segment
            should_end_segment = (
                len(current_segment) >= sentences_per_segment or
                i == len(sentences) - 1 or  # Last sentence
                self._is_natural_break(sentence, sentences[i + 1] if i < len(sentences) - 1 else "")
            )
            
            if should_end_segment:
                segments.append(current_segment)
                current_segment = []
        
        # If there's a remaining segment, add it
        if current_segment:
            segments.append(current_segment)
        
        return segments
    
    def _is_natural_break(self, current_sentence: str, next_sentence: str) -> bool:
        """Determine if there's a natural break between sentences."""
        # Check for transition words at the beginning of next sentence
        transition_words = [
            "however", "meanwhile", "furthermore", "additionally", "moreover",
            "on the other hand", "in contrast", "similarly", "consequently",
            "therefore", "thus", "hence", "accordingly", "nevertheless"
        ]
        
        next_lower = next_sentence.lower().strip()
        return any(next_lower.startswith(word) for word in transition_words)
    
    def _create_scenes(
        self, 
        segments: List[List[str]], 
        target_duration: float, 
        style: str
    ) -> List[Scene]:
        """Create scenes from sentence segments."""
        scenes = []
        segment_duration = target_duration / len(segments) if segments else 30
        
        for i, segment in enumerate(segments):
            text = " ".join(segment)
            
            # Determine scene type
            scene_type = self._classify_scene_type(text, i, len(segments))
            
            # Determine beat type
            beat_type = self._classify_beat_type(text)
            
            # Generate visual description
            visual_description = self._generate_visual_description(text, style)
            
            # Generate audio cues
            audio_cues = self._generate_audio_cues(text, scene_type)
            
            # Calculate duration
            speaking_time = self._estimate_speaking_time(text)
            # Add buffer for visuals and pacing
            duration = speaking_time * 1.2 + 2  # 20% buffer + 2 seconds for visuals
            
            # Generate transitions
            transition_in = self._generate_transition_in(i, scene_type, style)
            transition_out = self._generate_transition_out(i, len(segments), scene_type, style)
            
            scene = Scene(
                id=f"scene_{i + 1:02d}",
                text=text,
                duration_seconds=duration,
                scene_type=scene_type,
                beat_type=beat_type,
                visual_description=visual_description,
                audio_cues=audio_cues,
                transition_in=transition_in,
                transition_out=transition_out,
                metadata={
                    "segment_index": i,
                    "sentence_count": len(segment),
                    "word_count": len(text.split()),
                    "speaking_time": speaking_time,
                    "visual_buffer": duration - speaking_time
                }
            )
            
            scenes.append(scene)
        
        return scenes
    
    def _classify_scene_type(self, text: str, index: int, total_scenes: int) -> SceneType:
        """Classify scene type based on content and position."""
        text_lower = text.lower()
        
        # Check position-based classification first
        if index == 0:
            # First scene is likely intro
            return SceneType.INTRO
        elif index == total_scenes - 1:
            # Last scene could be conclusion or CTA
            for keyword in self.SCENE_TYPE_KEYWORDS[SceneType.CALL_TO_ACTION]:
                if keyword in text_lower:
                    return SceneType.CALL_TO_ACTION
            return SceneType.CONCLUSION
        
        # Check content-based classification
        for scene_type, keywords in self.SCENE_TYPE_KEYWORDS.items():
            keyword_count = sum(1 for keyword in keywords if keyword in text_lower)
            if keyword_count > 0:
                return scene_type
        
        # Default to main content
        return SceneType.MAIN
    
    def _classify_beat_type(self, text: str) -> BeatType:
        """Classify narrative beat type."""
        text_lower = text.lower()
        
        # Score each beat type
        beat_scores = {}
        for beat_type, keywords in self.BEAT_TYPE_KEYWORDS.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            beat_scores[beat_type] = score
        
        # Return the highest scoring beat type, or SETUP as default
        if beat_scores and max(beat_scores.values()) > 0:
            return max(beat_scores, key=beat_scores.get)
        
        return BeatType.SETUP
    
    def _generate_visual_description(self, text: str, style: str) -> str:
        """Generate visual description for the scene."""
        # Extract key nouns and concepts for visual cues
        words = text.lower().split()
        
        # Style-specific visual approaches
        if style == "cinematic":
            return f"Cinematic shot showcasing the key concepts from: '{text[:50]}...'"
        elif style == "corporate":
            return f"Professional presentation style visual for: '{text[:50]}...'"
        elif style == "animated":
            return f"Animated illustration of: '{text[:50]}...'"
        else:
            return f"Visual representation of: '{text[:50]}...'"
    
    def _generate_audio_cues(self, text: str, scene_type: SceneType) -> List[str]:
        """Generate audio cues for the scene."""
        cues = []
        
        # Scene type specific audio
        if scene_type == SceneType.INTRO:
            cues.extend(["upbeat_intro_music", "fade_in"])
        elif scene_type == SceneType.CONCLUSION:
            cues.extend(["conclusion_music", "fade_out"])
        elif scene_type == SceneType.CALL_TO_ACTION:
            cues.extend(["action_music", "notification_sound"])
        else:
            cues.append("background_music")
        
        # Content-based audio cues
        text_lower = text.lower()
        if any(word in text_lower for word in ["exciting", "amazing", "incredible"]):
            cues.append("excitement_sound")
        if any(word in text_lower for word in ["problem", "issue", "challenge"]):
            cues.append("tension_music")
        if any(word in text_lower for word in ["solution", "answer", "success"]):
            cues.append("success_sound")
        
        return cues
    
    def _generate_transition_in(self, index: int, scene_type: SceneType, style: str) -> Optional[str]:
        """Generate transition in effect."""
        if index == 0:
            return "fade_in"
        
        if style == "cinematic":
            return "cinematic_wipe"
        elif style == "corporate":
            return "slide_in"
        else:
            return "crossfade"
    
    def _generate_transition_out(
        self, 
        index: int, 
        total_scenes: int, 
        scene_type: SceneType, 
        style: str
    ) -> Optional[str]:
        """Generate transition out effect."""
        if index == total_scenes - 1:
            return "fade_out"
        
        if scene_type == SceneType.CALL_TO_ACTION:
            return "zoom_out"
        elif style == "cinematic":
            return "cinematic_wipe"
        elif style == "corporate":
            return "slide_out"
        else:
            return "crossfade"
    
    def _optimize_timing(self, scenes: List[Scene], target_duration: float) -> List[Scene]:
        """Optimize scene timing to match target duration."""
        current_total = sum(scene.duration_seconds for scene in scenes)
        
        if abs(current_total - target_duration) < 5:  # Within 5 seconds is acceptable
            return scenes
        
        # Calculate adjustment ratio
        ratio = target_duration / current_total if current_total > 0 else 1.0
        
        # Apply ratio to each scene, with minimum and maximum bounds
        optimized_scenes = []
        for scene in scenes:
            new_duration = scene.duration_seconds * ratio
            
            # Ensure minimum duration for readability
            min_duration = max(5, scene.metadata.get("speaking_time", 5))
            # Ensure maximum duration doesn't drag
            max_duration = min(60, scene.duration_seconds * 1.5)
            
            new_duration = max(min_duration, min(max_duration, new_duration))
            
            # Create new scene with updated duration
            optimized_scene = Scene(
                id=scene.id,
                text=scene.text,
                duration_seconds=new_duration,
                scene_type=scene.scene_type,
                beat_type=scene.beat_type,
                visual_description=scene.visual_description,
                audio_cues=scene.audio_cues,
                transition_in=scene.transition_in,
                transition_out=scene.transition_out,
                metadata={
                    **scene.metadata,
                    "original_duration": scene.duration_seconds,
                    "optimization_ratio": ratio
                }
            )
            
            optimized_scenes.append(optimized_scene)
        
        return optimized_scenes