import os, json
from typing import Any, Dict, Optional
from openai import AsyncOpenAI

_client: Optional[AsyncOpenAI] = None

def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL") or None,
        )
    return _client

async def complete_json(*, system: str, input: Dict[str, Any], model: Optional[str] = None, temperature: float = 0):
    mdl = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": json.dumps(input)},
    ]
    resp = await get_client().chat.completions.create(
        model=mdl,
        messages=messages,
        temperature=temperature,
        response_format={"type": "json_object"},
    )
    content = resp.choices[0].message.content or "{}"
    try:
        return json.loads(content)
    except Exception as e:
        raise RuntimeError(f"LLM JSON parse error: {e}: {content[:400]}")

