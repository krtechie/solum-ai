import time
import logging
from llm.client import call_llm_json
from llm.prompts import STAGE1_SYSTEM, stage1_user
from schemas.models import IntentSchema

logger = logging.getLogger(__name__)


async def run(prompt: str) -> tuple[IntentSchema, int, str]:
    """
    Stage 1: Parse natural language → structured IntentSchema.

    Returns:
        (IntentSchema, latency_ms, model_used)
    """
    logger.info("[Stage 1] Starting intent extraction")
    t0 = time.monotonic()

    raw = await call_llm_json(
        system=STAGE1_SYSTEM,
        user=stage1_user(prompt),
        model_key="fast",
    )

    intent = IntentSchema.model_validate(raw)

    latency = int((time.monotonic() - t0) * 1000)
    logger.info(
        f"[Stage 1] Done in {latency}ms — "
        f"app_type={intent.app_type}, entities={intent.entities}"
    )

    return intent, latency, "fast"