"""
Main pipeline runner — orchestrates all 5 stages.
Yields SSE-compatible events so the frontend can show live progress.
"""

import time
import logging
from typing import AsyncGenerator
from pydantic import ValidationError

from pipeline import stage1_intent, stage2_design, stage3_schemas, stage4_refine, stage5_validate
from runtime.codegen import build_runtime_artifacts
from schemas.models import SolumOutput, PipelineMetadata

logger = logging.getLogger(__name__)


async def run_pipeline(prompt: str) -> AsyncGenerator[dict, None]:
    """
    Full pipeline: NL prompt → SolumOutput.
    Yields progress events as dicts (serialized to SSE by the API layer).

    Event shapes:
      { "event": "stage_start",        "stage": int, "name": str }
      { "event": "stage_complete",     "stage": int, "name": str, "latency_ms": int }
      { "event": "stage_error",        "stage": int, "name": str, "error": str }
      { "event": "clarification_needed", "questions": [...] }
      { "event": "complete",           "output": { ...SolumOutput } }
      { "event": "error",              "message": str }
      { "event": "done" }
    """
    t_total = time.monotonic()
    stage_latencies: dict[str, int] = {}
    models_used: dict[str, str] = {}
    total_retries = 0

    # ── Stage 1: Intent Extraction ─────────────────────────────────────────────
    yield {"event": "stage_start", "stage": 1, "name": "Intent Extraction"}
    try:
        intent, lat1, m1 = await stage1_intent.run(prompt)
        stage_latencies["stage1_intent"] = lat1
        models_used["stage1"] = m1
        yield {
            "event": "stage_complete",
            "stage": 1,
            "name": "Intent Extraction",
            "latency_ms": lat1,
            "preview": {
                "app_name": intent.app_name,
                "app_type": intent.app_type,
                "entities": intent.entities,
                "roles": intent.roles,
                "needs_clarification": intent.needs_clarification,
                "clarification_questions": intent.clarification_questions,
            },
        }

        if intent.needs_clarification:
            yield {
                "event": "clarification_needed",
                "questions": intent.clarification_questions,
                "assumptions": intent.assumptions,
            }
            return

    except (ValidationError, ValueError, RuntimeError) as e:
        yield {"event": "stage_error", "stage": 1, "name": "Intent Extraction", "error": str(e)}
        yield {"event": "error", "message": f"Stage 1 failed: {e}"}
        return

    # ── Stage 2: System Design ─────────────────────────────────────────────────
    yield {"event": "stage_start", "stage": 2, "name": "System Design"}
    try:
        design, lat2, m2 = await stage2_design.run(intent)
        stage_latencies["stage2_design"] = lat2
        models_used["stage2"] = m2
        yield {
            "event": "stage_complete",
            "stage": 2,
            "name": "System Design",
            "latency_ms": lat2,
            "preview": {
                "entities": [e.name for e in design.entities],
                "pages":    [p.name for p in design.pages],
                "api_groups": design.api_groups,
            },
        }
    except (ValidationError, ValueError, RuntimeError) as e:
        yield {"event": "stage_error", "stage": 2, "name": "System Design", "error": str(e)}
        yield {"event": "error", "message": f"Stage 2 failed: {e}"}
        return

    # ── Stage 3: Parallel Schema Generation ───────────────────────────────────
    yield {"event": "stage_start", "stage": 3, "name": "Schema Generation (parallel)"}
    try:
        ui, api, db, auth, lat3 = await stage3_schemas.run(intent, design)
        stage_latencies["stage3_schemas"] = lat3
        models_used["stage3"] = "fast+reasoning"
        yield {
            "event": "stage_complete",
            "stage": 3,
            "name": "Schema Generation",
            "latency_ms": lat3,
            "preview": {
                "ui_pages":      len(ui.pages),
                "api_endpoints": len(api.endpoints),
                "db_tables":     len(db.tables),
                "auth_roles":    len(auth.roles),
            },
        }
    except (ValidationError, ValueError, RuntimeError) as e:
        yield {"event": "stage_error", "stage": 3, "name": "Schema Generation", "error": str(e)}
        yield {"event": "error", "message": f"Stage 3 failed: {e}"}
        return

    # ── Stage 4: Cross-layer Refinement ───────────────────────────────────────
    yield {"event": "stage_start", "stage": 4, "name": "Cross-layer Refinement"}
    try:
        ui, api, db, auth, fixes, lat4 = await stage4_refine.run(ui, api, db, auth)
        stage_latencies["stage4_refine"] = lat4
        models_used["stage4"] = "fast"
        yield {
            "event": "stage_complete",
            "stage": 4,
            "name": "Cross-layer Refinement",
            "latency_ms": lat4,
            "preview": {"fixes_applied": fixes},
        }
    except (ValidationError, ValueError, RuntimeError) as e:
        logger.warning(f"[Runner] Stage 4 non-fatal error: {e}")
        stage_latencies["stage4_refine"] = 0
        yield {
            "event": "stage_complete",
            "stage": 4,
            "name": "Cross-layer Refinement",
            "latency_ms": 0,
            "preview": {"fixes_applied": [], "warning": str(e)},
        }

    # ── Stage 5: Validation + Repair ──────────────────────────────────────────
    yield {"event": "stage_start", "stage": 5, "name": "Validation + Repair"}
    try:
        ui, api, db, auth, validation_report, lat5 = await stage5_validate.run(
            ui, api, db, auth
        )
        stage_latencies["stage5_validate"] = lat5
        models_used["stage5"] = "repair"
        total_retries += validation_report.retries_used
        yield {
            "event": "stage_complete",
            "stage": 5,
            "name": "Validation + Repair",
            "latency_ms": lat5,
            "preview": {
                "passed":  validation_report.passed,
                "issues":  len(validation_report.issues),
                "repairs": validation_report.repairs_performed,
            },
        }
    except (ValidationError, ValueError, RuntimeError) as e:
        yield {"event": "stage_error", "stage": 5, "name": "Validation + Repair", "error": str(e)}
        yield {"event": "error", "message": f"Stage 5 failed: {e}"}
        return

    # ── Runtime Artifact Generation ────────────────────────────────────────────
    runtime = build_runtime_artifacts(db, api, auth, intent)

    # ── Assemble final output ──────────────────────────────────────────────────
    total_latency = int((time.monotonic() - t_total) * 1000)

    metadata = PipelineMetadata(
        total_latency_ms=total_latency,
        stage_latencies=stage_latencies,
        models_used=models_used,
        total_retries=total_retries,
        prompt_tokens=0,
        completion_tokens=0,
    )

    output = SolumOutput(
        intent=intent,
        design=design,
        ui=ui,
        api=api,
        db=db,
        auth=auth,
        runtime=runtime,
        validation=validation_report,
        metadata=metadata,
    )

    yield {"event": "complete", "output": output.model_dump()}