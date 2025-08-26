import os
import json
from typing import Any, Dict

try:
    from openai import AsyncOpenAI  # type: ignore
    _ASYNC = True
except Exception:  # fallback for older client
    from openai import OpenAI  # type: ignore
    import asyncio
    _ASYNC = False

MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

async def complete_json(payload: Dict[str, Any]) -> Dict[str, Any]:
    system = payload.get("system") or ""
    user_input = payload.get("input") or {}
    content = json.dumps(user_input)

    if _ASYNC:
        client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        resp = await client.chat.completions.create(
            model=MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": content},
            ],
            temperature=0.2,
        )
        text = resp.choices[0].message.content or "{}"
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to salvage JSON object content between braces
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1 and end > start:
                return json.loads(text[start:end+1])
            raise
    else:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        loop = asyncio.get_event_loop()
        def _call():
            r = client.chat.completions.create(
                model=MODEL,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": content},
                ],
                temperature=0.2,
            )
            return r.choices[0].message.content or "{}"
        text = await loop.run_in_executor(None, _call)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            start = text.find("{"); end = text.rfind("}")
            if start != -1 and end != -1 and end > start:
                return json.loads(text[start:end+1])
            raise

