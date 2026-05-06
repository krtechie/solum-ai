"""
Stage 5: Validation + Surgical Repair Engine.

This is the most critical part of Solum AI.
Instead of blind retries, we:
1. Run Pydantic validation on each schema
2. Run cross-layer consistency check
3. For each broken layer, re-generate ONLY that layer with errors as context
4. Re-validate after repair
5. Emit a detailed ValidationReport
"""

import time
import json
import logging
from pydantic import ValidationError

from llm.client import call_llm_json
from llm.prompts import REPAIR_SYSTEM, repair_user
from schemas.models import (
    UISchema, APISchema, DBSchema, AuthSchema,
    ValidationIssue, ValidationReport,
)
from validator import cross_layer

logger = logging.getLogger(__name__)

MAX_REPAIR_ATTEMPTS = 3


async def _repair_layer(
    layer_name: str,
    broken_schema: dict,
    errors: list[str],
    context_schemas: dict,
) -> dict:
    """Call LLM to repair a single broken layer. Returns repaired dict."""
    context_str = json.dumps(context_schemas, indent=2)[:3000]
    return await call_llm_json(
        system=REPAIR_SYSTEM,
        user=repair_user(layer_name, broken_schema, errors, context_str),
        model_key="repair",
    )


async def run(
    ui: UISchema,
    api: APISchema,
    db: DBSchema,
    auth: AuthSchema,
) -> tuple[UISchema, APISchema, DBSchema, AuthSchema, ValidationReport, int]:
    """
    Stage 5: Full validation pass with surgical repair.

    Returns:
        (ui, api, db, auth, ValidationReport, latency_ms)
    """
    logger.info("[Stage 5] Starting validation + repair")
    t0 = time.monotonic()

    all_issues: list[ValidationIssue] = []
    repairs_performed = 0
    retries_used = 0

    # ── Run cross-layer check ──────────────────────────────────────────────────
    cl_issues = cross_layer.check(ui, api, db, auth)
    for issue in cl_issues:
        all_issues.append(ValidationIssue(
            layer="cross-layer",
            field="",
            issue=issue,
            severity="error",
            repaired=False,
        ))

    # ── Group issues by layer ──────────────────────────────────────────────────
    layer_issues: dict[str, list[str]] = {
        "ui": [], "api": [], "db": [], "auth": []
    }

    for issue in cl_issues:
        issue_lower = issue.lower()
        if issue_lower.startswith("ui:"):
            layer_issues["ui"].append(issue)
        elif issue_lower.startswith("api:"):
            layer_issues["api"].append(issue)
        elif issue_lower.startswith("db:"):
            layer_issues["db"].append(issue)
        elif issue_lower.startswith("auth:"):
            layer_issues["auth"].append(issue)

    context_schemas = {
        "db": db.model_dump(),
        "auth": auth.model_dump(),
    }

    # ── Repair in dependency order: DB → Auth → API → UI ──────────────────────
    schema_map = {"ui": ui, "api": api, "db": db, "auth": auth}
    schema_classes = {
        "ui": UISchema, "api": APISchema,
        "db": DBSchema,  "auth": AuthSchema,
    }

    for layer in ["db", "auth", "api", "ui"]:
        errors = layer_issues.get(layer, [])
        if not errors:
            continue

        logger.info(f"[Stage 5] Repairing layer '{layer}' ({len(errors)} issues)")

        repaired = False
        for attempt in range(MAX_REPAIR_ATTEMPTS):
            retries_used += 1
            try:
                repaired_dict = await _repair_layer(
                    layer_name=layer,
                    broken_schema=schema_map[layer].model_dump(),
                    errors=errors,
                    context_schemas=context_schemas,
                )
                repaired_schema = schema_classes[layer].model_validate(repaired_dict)
                schema_map[layer] = repaired_schema
                context_schemas[layer] = repaired_dict
                repairs_performed += 1
                repaired = True

                for iss in all_issues:
                    if iss.layer == "cross-layer" and iss.issue in errors:
                        iss.repaired = True

                logger.info(f"[Stage 5] Layer '{layer}' repaired on attempt {attempt + 1}")
                break

            except (ValidationError, ValueError) as e:
                logger.warning(
                    f"[Stage 5] Repair attempt {attempt + 1}/{MAX_REPAIR_ATTEMPTS} "
                    f"failed for '{layer}': {e}"
                )
                errors = errors + [f"Previous repair attempt also failed: {str(e)[:200]}"]

        if not repaired:
            logger.error(
                f"[Stage 5] Could not repair layer '{layer}' "
                f"after {MAX_REPAIR_ATTEMPTS} attempts"
            )

    # ── Re-run check after all repairs ────────────────────────────────────────
    ui   = schema_map["ui"]
    api  = schema_map["api"]
    db   = schema_map["db"]
    auth = schema_map["auth"]

    remaining = cross_layer.check(ui, api, db, auth)
    passed = len(remaining) == 0

    if remaining:
        logger.warning(f"[Stage 5] {len(remaining)} issues remain after repair")
        for ri in remaining:
            all_issues.append(ValidationIssue(
                layer="cross-layer",
                field="",
                issue=ri,
                severity="warning",
                repaired=False,
            ))

    latency = int((time.monotonic() - t0) * 1000)
    logger.info(
        f"[Stage 5] Done in {latency}ms — passed={passed}, "
        f"repairs={repairs_performed}, retries={retries_used}"
    )

    report = ValidationReport(
        passed=passed,
        issues=all_issues,
        repairs_performed=repairs_performed,
        retries_used=retries_used,
    )

    return ui, api, db, auth, report, latency