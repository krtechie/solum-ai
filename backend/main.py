import json
import logging
import os
import uuid
import time
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from pipeline.runner import run_pipeline
from eval.db import log_run, get_metrics, init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info("Solum AI backend started")
    yield


app = FastAPI(
    title="Solum AI",
    description="Natural language → validated, executable app schemas",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "https://solum-ai.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request Models ───────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    prompt: str
    run_id: str | None = None


# ─── SSE Generator ────────────────────────────────────────────────────────────

async def sse_pipeline(prompt: str, run_id: str):
    """Wraps run_pipeline() into Server-Sent Events format."""

    def encode(data: dict) -> str:
        return f"data: {json.dumps(data)}\n\n"

    success = False
    latency_ms = 0
    retries = 0
    repairs = 0
    app_type = None
    entities = []
    stages_completed = 0
    failure_type = None
    t0 = time.monotonic()

    try:
        async for event in run_pipeline(prompt):
            yield encode(event)

            evt = event.get("event")

            if evt == "stage_complete":
                stages_completed = event.get("stage", stages_completed)
                preview = event.get("preview", {})
                if event.get("stage") == 1:
                    app_type = preview.get("app_type")
                    entities = preview.get("entities", [])

            elif evt == "complete":
                success = True
                output = event.get("output", {})
                meta = output.get("metadata", {})
                retries = meta.get("total_retries", 0)
                validation = output.get("validation", {})
                repairs = validation.get("repairs_performed", 0)
                latency_ms = int((time.monotonic() - t0) * 1000)

            elif evt == "error":
                failure_type = event.get("message", "unknown")[:200]

            elif evt == "clarification_needed":
                failure_type = "clarification_needed"

    except Exception as e:
        logger.exception(f"[SSE] Unexpected error for run {run_id}: {e}")
        yield encode({"event": "error", "message": str(e)})
        failure_type = f"exception:{type(e).__name__}"

    finally:
        latency_ms = latency_ms or int((time.monotonic() - t0) * 1000)
        await log_run(
            run_id=run_id,
            prompt=prompt[:500],
            success=success,
            latency_ms=latency_ms,
            retries=retries,
            repairs=repairs,
            failure_type=failure_type,
            app_type=app_type,
            entities=entities,
            stages_completed=stages_completed,
        )
        yield encode({"event": "done"})


# ─── Routes ───────────────────────────────────────────────────────────────────

_START_TIME = time.time()

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "solum-ai",
        "uptime_seconds": round(time.time() - _START_TIME),
    }


@app.post("/generate")
async def generate(req: GenerateRequest):
    """
    Stream the pipeline execution as Server-Sent Events.
    Each SSE message is a JSON object with an 'event' field.
    """
    prompt = req.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    if len(prompt) > 4000:
        raise HTTPException(status_code=400, detail="Prompt too long (max 4000 chars)")

    run_id = req.run_id or str(uuid.uuid4())

    return StreamingResponse(
        sse_pipeline(prompt, run_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "X-Run-Id": run_id,
        },
    )


@app.get("/metrics")
async def metrics():
    """Return evaluation metrics for the dashboard."""
    return await get_metrics()


@app.get("/eval/dataset")
async def eval_dataset():
    """Return the evaluation dataset."""
    from pathlib import Path
    dataset_path = Path(__file__).parent / "eval" / "dataset.json"
    with open(dataset_path) as f:
        return json.load(f)