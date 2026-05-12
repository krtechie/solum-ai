# Solum AI 🧠

> **Natural language → validated, executable app schemas**
> A compiler-inspired AI pipeline that converts plain English product descriptions into structured, cross-validated UI, API, database, and auth configurations — ready to power real applications.

<p>
  <a href="https://solum-ai-opal.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-Solum%20AI-7c6dfa?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
  &nbsp;
  <a href="https://youtu.be/aKd68VpnzK8">
    <img src="https://img.shields.io/badge/Walkthrough%20Video-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="Walkthrough Video" />
  </a>
</p>

⭐ If you find this useful, give it a star — it helps others discover it.

---

## What is Solum AI?

Solum AI treats app generation like a **compiler treats source code**:

```
Natural Language → Intent → System Design → Schemas → Validated → Executable
```

Instead of a single massive prompt, every input goes through a **5-stage pipeline** where each stage has a strict typed contract. Outputs are validated, inconsistencies are detected, and broken layers are surgically repaired — not blindly retried.

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SOLUM AI PIPELINE                       │
├──────────┬──────────┬──────────────┬────────────┬──────────┤
│ Stage 1  │ Stage 2  │   Stage 3    │  Stage 4   │ Stage 5  │
│  Intent  │  System  │   Schema     │ Refinement │ Validate │
│Extraction│  Design  │ Generation   │            │ + Repair │
│          │          │  (parallel)  │            │          │
│ NL →     │ Intent → │ → UI Schema  │ Cross-layer│ Pydantic │
│ Intent   │ Entities │ → API Schema │ consistency│ + Repair │
│ Schema   │ Pages    │ → DB Schema  │ check +    │ engine   │
│          │ Flows    │ → Auth Schema│ LLM fix    │          │
└──────────┴──────────┴──────────────┴────────────┴──────────┘
                              ↓
                    Runtime Artifact Generation
                    (Prisma schema + Express routes)
```

### Stage Details

| Stage | Name | Model | Description |
|-------|------|-------|-------------|
| 1 | Intent Extraction | Gemini 2.0 Flash | Parses NL → structured intent with entities, roles, features |
| 2 | System Design | DeepSeek R1 | Converts intent → app architecture, data model, user flows |
| 3 | Schema Generation | Gemini + DeepSeek | Generates UI, API, DB, Auth schemas **in parallel** |
| 4 | Cross-layer Refinement | Gemini 2.0 Flash | Detects and fixes inconsistencies across all 4 schemas |
| 5 | Validation + Repair | Gemma 3 27B | Pydantic validation + surgical per-layer repair |

---

## Key Design Decisions

### 1. Compiler Mindset
Each stage has a **strict Pydantic v2 contract**. LLM output that doesn't conform is rejected immediately — not silently passed along. This makes the system behave like a typed compiler, not a chatbot.

### 2. Parallel Schema Generation
Stage 3 runs all 4 schema generators (`asyncio.gather`) simultaneously. This cuts latency by ~60% compared to sequential generation while maintaining independent validation per schema.

### 3. Surgical Repair (not brute retry)
When Stage 5 detects issues, it:
- Groups errors by layer (UI / API / DB / Auth)
- Repairs in dependency order: DB → Auth → API → UI
- Re-generates **only the broken layer** with errors as explicit context
- Re-validates after each repair

This avoids cascading failures and wasted LLM calls.

### 4. Cross-layer Consistency Checks
Before repair, a deterministic checker verifies:
- Every UI component's `api_endpoint` exists in the API schema
- Every API endpoint's `db_table` exists in the DB schema
- Every API field exists as a column in its table
- Every role referenced in UI/API is defined in Auth
- Every protected route in Auth has a matching UI page
- All DB foreign keys reference real tables

### 5. Execution Awareness
Output is not just JSON — it directly generates:
- A **Prisma schema** (`.prisma` file) from the DB schema
- **Express.js route stubs** with Zod validators from the API schema
- A `.env` template with all required variables
- Step-by-step setup instructions

---

## Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | FastAPI + uvicorn |
| LLM Access | OpenRouter (free tier) |
| Validation | Pydantic v2 |
| Streaming | Server-Sent Events (SSE) |
| Eval logging | SQLite + aiosqlite |
| Concurrency | Python asyncio |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | CSS variables + Tailwind |
| Streaming | Fetch + ReadableStream |

### LLM Models (all free via OpenRouter)
| Role | Model |
|------|-------|
| Primary (fast stages) | `google/gemini-2.0-flash-exp:free` |
| Complex reasoning | `deepseek/deepseek-r1:free` |
| Surgical repair | `google/gemma-3-27b-it:free` |
| Fallback | `meta-llama/llama-3.3-70b-instruct:free` |

### Infrastructure (all free)
| Service | Platform |
|---------|----------|
| Backend | Render free tier |
| Frontend | Vercel hobby |
| Database | SQLite on disk |

---

## Project Structure

```
solum-ai/
├── backend/
│   ├── main.py                  # FastAPI app, SSE endpoint, metrics API
│   ├── requirements.txt
│   ├── llm/
│   │   ├── client.py            # OpenRouter client, retry + fallback logic
│   │   └── prompts.py           # All stage prompts (strict JSON-only)
│   ├── schemas/
│   │   └── models.py            # Pydantic v2 contracts for all layers
│   ├── pipeline/
│   │   ├── stage1_intent.py     # NL → IntentSchema
│   │   ├── stage2_design.py     # Intent → DesignSchema
│   │   ├── stage3_schemas.py    # Parallel UI + API + DB + Auth generation
│   │   ├── stage4_refine.py     # Cross-layer refinement
│   │   ├── stage5_validate.py   # Validation + surgical repair engine
│   │   └── runner.py            # Pipeline orchestrator + SSE emitter
│   ├── validator/
│   │   └── cross_layer.py       # Deterministic consistency checker
│   ├── runtime/
│   │   └── codegen.py           # Prisma schema + Express route generator
│   └── eval/
│       ├── db.py                # SQLite metrics logger
│       └── dataset.json         # 20 evaluation prompts (10 real + 10 edge)
└── frontend/
    ├── app/
    │   ├── page.tsx             # Main generate page
    │   ├── metrics/page.tsx     # Metrics dashboard page
    │   ├── layout.tsx           # Root layout + nav
    │   └── globals.css          # Design tokens + base styles
    ├── components/
    │   ├── PromptInput.tsx      # Prompt textarea + examples
    │   ├── PipelineProgress.tsx # Live stage-by-stage progress
    │   ├── SchemaViewer.tsx     # Tabbed output viewer
    │   └── MetricsDashboard.tsx # Eval metrics UI
    └── lib/
        ├── types.ts             # All TypeScript types
        └── api.ts               # SSE streaming + fetch helpers
```

---

## Running Locally

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Add your OPENROUTER_API_KEY to .env

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Evaluation Framework

Solum AI includes a built-in evaluation dataset of **20 prompts** tracked across:

| Metric | Description |
|--------|-------------|
| Success rate | % of runs that complete all 5 stages |
| Avg latency | End-to-end pipeline time in seconds |
| Avg retries | LLM retries per run (rate limit handling) |
| Repairs performed | Surgical layer repairs per run |
| Failure types | Breakdown of what causes failures |

### Dataset Breakdown
- **10 real prompts** — CRM, e-commerce, LMS, job board, booking system, etc.
- **10 edge cases** — single word, vague, conflicting requirements, feature creep, jargon-only, etc.

Live metrics are available at `/metrics`.

---

## Cost vs Quality Tradeoffs

| Decision | Tradeoff |
|----------|----------|
| Parallel Stage 3 | +speed, +cost (4 calls at once) vs sequential |
| DeepSeek R1 for design/DB | +quality on complex schemas, +latency |
| Gemma for repair only | Lower cost for targeted fixes vs using primary model |
| Max 2 refinement rounds | Caps cost, accepts minor residual inconsistencies |
| Max 3 repair attempts per layer | Prevents infinite loops, accepts rare failures |
| SQLite over managed DB | Zero cost, acceptable for demo scale |

---

## API Reference

### `POST /generate`
Stream pipeline execution as SSE.

**Request:**
```json
{ "prompt": "string", "run_id": "optional uuid" }
```

**SSE Events:**
```
stage_start          → { stage, name }
stage_complete       → { stage, name, latency_ms, preview }
stage_error          → { stage, name, error }
clarification_needed → { questions, assumptions }
complete             → { output: SolumOutput }
error                → { message }
done                 → (stream end)
```

### `GET /metrics`
Returns aggregated eval metrics from SQLite.

### `GET /eval/dataset`
Returns the 20-prompt evaluation dataset.

### `GET /health`
Health check endpoint.

---

## License

MIT © 2026 Solum AI