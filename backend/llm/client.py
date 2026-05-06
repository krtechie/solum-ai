import asyncio
import json
import os
import re
import time
import logging
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

MODELS = {
    "fast":      "google/gemini-2.0-flash-exp:free",
    "reasoning": "deepseek/deepseek-r1:free",
    "fallback":  "meta-llama/llama-3.3-70b-instruct:free",
    "repair":    "google/gemma-3-27b-it:free",
}

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY", ""),
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": os.getenv("FRONTEND_URL", "https://solum-ai.vercel.app"),
                "X-Title": "Solum AI",
            },
        )
    return _client


def _extract_json(text: str) -> str:
    """Strip markdown fences and extract raw JSON string."""
    text = text.strip()
    fenced = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    if fenced:
        return fenced.group(1).strip()
    start = min(
        (text.find("{") if text.find("{") != -1 else len(text)),
        (text.find("[") if text.find("[") != -1 else len(text)),
    )
    if start < len(text):
        return text[start:]
    return text


async def call_llm(
    system: str,
    user: str,
    model_key: str = "fast",
    max_retries: int = 4,
    temperature: float = 0.1,
    expect_json: bool = True,
) -> str:
    client = get_client()
    model_order = [MODELS[model_key], MODELS["fallback"]]
    if model_key == "fallback":
        model_order = [MODELS["fallback"]]

    last_error: Exception | None = None

    for model in model_order:
        for attempt in range(max_retries):
            try:
                logger.info(f"[LLM] model={model} attempt={attempt + 1}")
                resp = await client.chat.completions.create(
                    model=model,
                    temperature=temperature,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user",   "content": user},
                    ],
                    max_tokens=4096,
                )
                content = resp.choices[0].message.content or ""
                if expect_json:
                    content = _extract_json(content)
                logger.info(f"[LLM] success model={model}")
                return content

            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                if "rate" in err_str or "429" in err_str or "limit" in err_str:
                    wait = 2 ** attempt * 3
                    logger.warning(f"[LLM] rate limited, waiting {wait}s")
                    await asyncio.sleep(wait)
                elif "timeout" in err_str or "connection" in err_str:
                    await asyncio.sleep(2 ** attempt)
                else:
                    logger.warning(f"[LLM] error on {model}: {e}")
                    break

    raise RuntimeError(f"All LLM attempts failed. Last error: {last_error}")


async def call_llm_json(
    system: str,
    user: str,
    model_key: str = "fast",
    max_retries: int = 4,
) -> dict:
    text = await call_llm(system, user, model_key, max_retries, expect_json=True)
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\n\nRaw output:\n{text[:500]}")