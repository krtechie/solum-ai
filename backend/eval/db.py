"""
SQLite-backed evaluation logger.
Tracks every pipeline run for the metrics dashboard.
"""

import aiosqlite
import json
import time
from pathlib import Path

DB_PATH = Path(__file__).parent / "eval_runs.db"


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS runs (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id           TEXT NOT NULL,
                prompt           TEXT NOT NULL,
                success          INTEGER NOT NULL,
                latency_ms       INTEGER NOT NULL,
                retries          INTEGER NOT NULL DEFAULT 0,
                repairs          INTEGER NOT NULL DEFAULT 0,
                failure_type     TEXT,
                app_type         TEXT,
                entities         TEXT,
                stages_completed INTEGER DEFAULT 0,
                created_at       INTEGER NOT NULL
            )
        """)
        await db.commit()


async def log_run(
    run_id: str,
    prompt: str,
    success: bool,
    latency_ms: int,
    retries: int = 0,
    repairs: int = 0,
    failure_type: str | None = None,
    app_type: str | None = None,
    entities: list[str] | None = None,
    stages_completed: int = 0,
):
    await init_db()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO runs
               (run_id, prompt, success, latency_ms, retries, repairs,
                failure_type, app_type, entities, stages_completed, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                run_id,
                prompt[:500],
                int(success),
                latency_ms,
                retries,
                repairs,
                failure_type,
                app_type,
                json.dumps(entities or []),
                stages_completed,
                int(time.time()),
            ),
        )
        await db.commit()


async def get_metrics() -> dict:
    await init_db()
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        total = (await (await db.execute(
            "SELECT COUNT(*) as c FROM runs"
        )).fetchone())["c"]

        success = (await (await db.execute(
            "SELECT COUNT(*) as c FROM runs WHERE success=1"
        )).fetchone())["c"]

        avg_latency = (await (await db.execute(
            "SELECT AVG(latency_ms) as a FROM runs"
        )).fetchone())["a"] or 0

        avg_retries = (await (await db.execute(
            "SELECT AVG(retries) as a FROM runs"
        )).fetchone())["a"] or 0

        failures = await (await db.execute(
            "SELECT failure_type, COUNT(*) as c FROM runs "
            "WHERE success=0 GROUP BY failure_type ORDER BY c DESC"
        )).fetchall()

        recent = await (await db.execute(
            "SELECT run_id, prompt, success, latency_ms, retries, repairs, "
            "app_type, stages_completed, created_at "
            "FROM runs ORDER BY created_at DESC LIMIT 20"
        )).fetchall()

        return {
            "total_runs":     total,
            "success_count":  success,
            "failure_count":  total - success,
            "success_rate":   round(success / total * 100, 1) if total > 0 else 0,
            "avg_latency_ms": round(avg_latency),
            "avg_retries":    round(avg_retries, 2),
            "failure_types":  [dict(r) for r in failures],
            "recent_runs":    [dict(r) for r in recent],
        }