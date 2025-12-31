from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from typing import List, Dict, Any


PROFANITY = {"fuck", "shit", "bitch", "asshole"}


def filter_profanity(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        word = match.group(0)
        return word[0] + "*" * (len(word) - 1)

    pattern = re.compile(r"\\b(" + "|".join(map(re.escape, PROFANITY)) + r")\\b", re.IGNORECASE)
    return pattern.sub(repl, text)


@dataclass
class Scene:
    index: int
    start_ms: int
    end_ms: int
    beat: str
    text: str


def split_script_to_scenes(script: str, total_duration_sec: int, beats: List[str] | None = None, language: str = "en") -> List[Scene]:
    if not script:
        script = "A visual story unfolds."
    beats = beats or ["intro", "build", "climax", "outro"]
    chunks = [s.strip() for s in re.split(r"[\n\.]+", script) if s.strip()]
    if not chunks:
        chunks = [script.strip()]

    num_scenes = max(len(beats), min(len(chunks), 12))
    # distribute chunks into num_scenes buckets
    buckets: List[List[str]] = [[] for _ in range(num_scenes)]
    for i, chunk in enumerate(chunks):
        buckets[i % num_scenes].append(chunk)

    duration_per_scene = int((total_duration_sec * 1000) / num_scenes)
    scenes: List[Scene] = []
    for idx, bucket in enumerate(buckets):
        text = filter_profanity(" ".join(bucket))
        beat = beats[idx] if idx < len(beats) else "beat"
        start_ms = idx * duration_per_scene
        end_ms = (idx + 1) * duration_per_scene - 1
        scenes.append(Scene(index=idx, start_ms=start_ms, end_ms=end_ms, beat=beat, text=text))
    return scenes


def scene_plan_contract(script: str, total_duration_sec: int, beats: List[str] | None = None, language: str = "en") -> Dict[str, Any]:
    scenes = split_script_to_scenes(script, total_duration_sec, beats, language)
    payload = {
        "version": 1,
        "language": language,
        "total_duration_ms": total_duration_sec * 1000,
        "scenes": [
            {
                "index": s.index,
                "start_ms": s.start_ms,
                "end_ms": s.end_ms,
                "beat": s.beat,
                "text": s.text,
            }
            for s in scenes
        ],
    }
    payload_bytes = str(payload).encode()
    payload["deterministic_id"] = hashlib.sha256(payload_bytes).hexdigest()
    return payload
