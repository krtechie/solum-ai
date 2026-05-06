import time
import logging
from llm.client import call_llm_json
from llm.prompts import STAGE2_SYSTEM, stage2_user
from schemas.models import IntentSchema, DesignSchema

logger = logging.getLogger(__name__)


async def run(intent: IntentSchema) -> tuple[DesignSchema, int, str]:
    """
    Stage 2: IntentSchema → DesignSchema (entities, pages, flows).

    Returns:
        (DesignSchema, latency_ms, model_used)
    """
    logger.info("[Stage 2] Starting system design")
    t0 = time.monotonic()

    raw = await call_llm_json(
        system=STAGE2_SYSTEM,
        user=stage2_user(intent.model_dump()),
        model_key="reasoning",
    )

    design = DesignSchema.model_validate(raw)

    latency = int((time.monotonic() - t0) * 1000)
    logger.info(
        f"[Stage 2] Done in {latency}ms — "
        f"entities={len(design.entities)}, pages={len(design.pages)}"
    )

    return design, latency, "reasoning"