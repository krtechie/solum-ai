import asyncio
import json
import os
import re
import logging
from json_repair import repair_json
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

# Primary models per role
MODELS = {
    "fast":      "google/gemini-2.0-flash-exp:free",
    "reasoning": "deepseek/deepseek-r1:free",
    "fallback":  "meta-llama/llama-3.3-70b-instruct:free",
    "repair":    "google/gemma-3-27b-it:free",
}

# OpenRouter native fallback chains per role
FALLBACK_CHAINS = {
    "fast": [
        "openrouter/auto",
        "google/gemini-2.0-flash-exp:free",
        "mistralai/mistral-7b-instruct:free",
    ],
    "reasoning": [
        "openrouter/auto",
        "deepseek/deepseek-r1:free",
        "google/gemini-2.0-flash-exp:free",
    ],
    "repair": [
        "openrouter/auto",
        "google/gemma-3-27b-it:free",
        "mistralai/mistral-7b-instruct:free",
    ],
    "fallback": [
        "openrouter/auto",
        "meta-llama/llama-3.3-70b-instruct:free",
        "mistralai/mistral-7b-instruct:free",
    ],
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
    max_retries: int = 5,
    temperature: float = 0.1,
    expect_json: bool = True,
) -> str:
    """
    Call OpenRouter using native fallback routing.
    Passes the full fallback chain in extra_body so OpenRouter
    handles retries automatically — no manual retry loop needed.
    """
    client = get_client()
    primary = "openrouter/auto"
    chain = FALLBACK_CHAINS.get(model_key, FALLBACK_CHAINS["fast"])

    last_error: Exception | None = None

    for attempt in range(max_retries):
        try:
            logger.info(f"[LLM] model_key={model_key} attempt={attempt + 1}")
            resp = await client.chat.completions.create(
                model=primary,
                temperature=temperature,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user",   "content": user},
                ],
                max_tokens=16000,
                extra_body={
                    "models": chain,
                    "route": "fallback",
                },
            )
            content = resp.choices[0].message.content or ""
            served_by = getattr(resp, "model", primary)
            logger.info(f"[LLM] success served_by={served_by}")
            if expect_json:
                content = _extract_json(content)
            return content

        except Exception as e:
            last_error = e
            err_str = str(e).lower()
            if "rate" in err_str or "429" in err_str or "limit" in err_str:
                wait = 2 ** attempt * 10  # 10, 20, 40, 80, 160s
                logger.warning(f"[LLM] rate limited, waiting {wait}s")
                await asyncio.sleep(wait)
            elif "timeout" in err_str or "connection" in err_str:
                await asyncio.sleep(2 ** attempt)
            else:
                logger.warning(f"[LLM] error: {e}")
                await asyncio.sleep(2)

    raise RuntimeError(f"All LLM attempts failed. Last error: {last_error}")


async def call_llm_json(
    system: str,
    user: str,
    model_key: str = "fast",
    max_retries: int = 3,
) -> dict:
    text = await call_llm(system, user, model_key, max_retries, expect_json=True)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.warning("[LLM] JSON parse failed, attempting repair...")
        try:
            repaired = repair_json(text, return_objects=True)
            if isinstance(repaired, dict):
                logger.info("[LLM] JSON repaired successfully")
                return repaired
            raise ValueError(f"Repaired JSON is not a dict: {type(repaired)}")
        except Exception as e:
            raise ValueError(f"LLM returned invalid JSON that could not be repaired: {e}\n\nRaw output:\n{text[:500]}")