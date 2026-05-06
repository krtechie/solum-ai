import asyncio
import time
import logging
from llm.client import call_llm_json
from llm.prompts import (
    UI_SCHEMA_SYSTEM,  API_SCHEMA_SYSTEM,
    DB_SCHEMA_SYSTEM,  AUTH_SCHEMA_SYSTEM,
    ui_schema_user, api_schema_user,
    db_schema_user, auth_schema_user,
)
from schemas.models import (
    IntentSchema, DesignSchema,
    UISchema, APISchema, DBSchema, AuthSchema,
)

logger = logging.getLogger(__name__)


async def _gen_ui(intent: dict, design: dict) -> UISchema:
    raw = await call_llm_json(
        system=UI_SCHEMA_SYSTEM,
        user=ui_schema_user(intent, design),
        model_key="fast",
    )
    return UISchema.model_validate(raw)


async def _gen_api(intent: dict, design: dict) -> APISchema:
    raw = await call_llm_json(
        system=API_SCHEMA_SYSTEM,
        user=api_schema_user(intent, design),
        model_key="fast",
    )
    return APISchema.model_validate(raw)


async def _gen_db(intent: dict, design: dict) -> DBSchema:
    raw = await call_llm_json(
        system=DB_SCHEMA_SYSTEM,
        user=db_schema_user(intent, design),
        model_key="reasoning",
    )
    return DBSchema.model_validate(raw)


async def _gen_auth(intent: dict, design: dict) -> AuthSchema:
    raw = await call_llm_json(
        system=AUTH_SCHEMA_SYSTEM,
        user=auth_schema_user(intent, design),
        model_key="fast",
    )
    return AuthSchema.model_validate(raw)


async def run(
    intent: IntentSchema,
    design: DesignSchema,
) -> tuple[UISchema, APISchema, DBSchema, AuthSchema, int]:
    """
    Stage 3: Generate all 4 schemas in parallel via asyncio.gather.
    This is the core speed advantage over sequential generation.

    Returns:
        (UISchema, APISchema, DBSchema, AuthSchema, latency_ms)
    """
    logger.info("[Stage 3] Starting parallel schema generation (UI + API + DB + Auth)")
    t0 = time.monotonic()

    intent_dict = intent.model_dump()
    design_dict = design.model_dump()

    ui, api, db, auth = await asyncio.gather(
        _gen_ui(intent_dict, design_dict),
        _gen_api(intent_dict, design_dict),
        _gen_db(intent_dict, design_dict),
        _gen_auth(intent_dict, design_dict),
    )

    latency = int((time.monotonic() - t0) * 1000)
    logger.info(
        f"[Stage 3] Done in {latency}ms — "
        f"pages={len(ui.pages)}, endpoints={len(api.endpoints)}, "
        f"tables={len(db.tables)}, roles={len(auth.roles)}"
    )

    return ui, api, db, auth, latency