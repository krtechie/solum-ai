import time
import logging
from llm.client import call_llm_json
from llm.prompts import STAGE4_SYSTEM, stage4_user
from schemas.models import UISchema, APISchema, DBSchema, AuthSchema
from validator import cross_layer

logger = logging.getLogger(__name__)

MAX_REFINEMENT_ROUNDS = 2


async def run(
    ui: UISchema,
    api: APISchema,
    db: DBSchema,
    auth: AuthSchema,
) -> tuple[UISchema, APISchema, DBSchema, AuthSchema, list[str], int]:
    """
    Stage 4: Detect cross-layer inconsistencies and fix them via LLM.
    Runs up to MAX_REFINEMENT_ROUNDS rounds. Each round only re-generates
    what's needed based on the specific issues detected.

    Returns:
        (ui, api, db, auth, fixes_applied, latency_ms)
    """
    logger.info("[Stage 4] Starting cross-layer refinement")
    t0 = time.monotonic()
    all_fixes: list[str] = []

    for round_num in range(1, MAX_REFINEMENT_ROUNDS + 1):
        issues = cross_layer.check(ui, api, db, auth)

        if not issues:
            logger.info(f"[Stage 4] No issues found in round {round_num} — stopping")
            break

        logger.info(f"[Stage 4] Round {round_num}: {len(issues)} issues detected")
        for i in issues:
            logger.debug(f"  Issue: {i}")

        raw = await call_llm_json(
            system=STAGE4_SYSTEM,
            user=stage4_user(
                ui.model_dump(),
                api.model_dump(),
                db.model_dump(),
                auth.model_dump(),
                issues,
            ),
            model_key="fast",
        )

        if "ui" in raw:
            try:
                ui = UISchema.model_validate(raw["ui"])
            except Exception as e:
                logger.warning(f"[Stage 4] UI refinement failed validation: {e}")

        if "api" in raw:
            try:
                api = APISchema.model_validate(raw["api"])
            except Exception as e:
                logger.warning(f"[Stage 4] API refinement failed validation: {e}")

        if "db" in raw:
            try:
                db = DBSchema.model_validate(raw["db"])
            except Exception as e:
                logger.warning(f"[Stage 4] DB refinement failed validation: {e}")

        if "auth" in raw:
            try:
                auth = AuthSchema.model_validate(raw["auth"])
            except Exception as e:
                logger.warning(f"[Stage 4] Auth refinement failed validation: {e}")

        fixes = raw.get("fixes_applied", [])
        all_fixes.extend(fixes)
        logger.info(f"[Stage 4] Round {round_num} applied {len(fixes)} fixes")

    latency = int((time.monotonic() - t0) * 1000)
    logger.info(f"[Stage 4] Done in {latency}ms — total fixes={len(all_fixes)}")

    return ui, api, db, auth, all_fixes, latency