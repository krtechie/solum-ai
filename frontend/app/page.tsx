"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import PromptInput from "@/components/PromptInput";
import PipelineProgress from "@/components/PipelineProgress";
import SchemaViewer from "@/components/SchemaViewer";
import { streamGenerate } from "@/lib/api";
import { StageState, SolumOutput, PipelineEvent } from "@/lib/types";

const INITIAL_STAGES: StageState[] = [
  { id: 1, name: "Intent Extraction",          status: "idle" },
  { id: 2, name: "System Design",              status: "idle" },
  { id: 3, name: "Schema Generation",          status: "idle" },
  { id: 4, name: "Cross-layer Refinement",     status: "idle" },
  { id: 5, name: "Validation + Repair",        status: "idle" },
];

export default function HomePage() {
  const [loading, setLoading]                       = useState(false);
  const [stages, setStages]                         = useState<StageState[]>(INITIAL_STAGES);
  const [output, setOutput]                         = useState<SolumOutput | null>(null);
  const [error, setError]                           = useState<string | null>(null);
  const [clarifications, setClarifications]         = useState<string[] | null>(null);
  const [hasRun, setHasRun]                         = useState(false);

  const updateStage = useCallback(
    (id: number, patch: Partial<StageState>) => {
      setStages((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
      );
    },
    []
  );

  const handleSubmit = useCallback(
    async (prompt: string) => {
      // Reset state
      setLoading(true);
      setOutput(null);
      setError(null);
      setClarifications(null);
      setHasRun(true);
      setStages(INITIAL_STAGES);

      const runId = uuidv4();

      await streamGenerate(
        prompt,
        runId,
        // onEvent
        (raw) => {
          const event = raw as unknown as PipelineEvent;

          switch (event.event) {
            case "stage_start":
              if (event.stage) {
                updateStage(event.stage, { status: "running" });
              }
              break;

            case "stage_complete":
              if (event.stage) {
                updateStage(event.stage, {
                  status: "complete",
                  latency_ms: event.latency_ms,
                  preview: event.preview,
                });
              }
              break;

            case "stage_error":
              if (event.stage) {
                updateStage(event.stage, {
                  status: "error",
                  error: event.error,
                });
              }
              break;

            case "clarification_needed":
              setClarifications(event.questions ?? []);
              break;

            case "complete":
              if (event.output) {
                setOutput(event.output as SolumOutput);
              }
              break;

            case "error":
              setError(event.message ?? "Unknown error");
              break;
          }
        },
        // onDone
        () => setLoading(false),
        // onError
        (err) => {
          setError(err);
          setLoading(false);
        }
      );
    },
    [updateStage]
  );

  const allComplete = stages.every((s) => s.status === "complete");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Hero / input */}
      <PromptInput onSubmit={handleSubmit} loading={loading} />

      {/* Main content — only shown after first run */}
      {hasRun && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          {/* Left: Pipeline progress */}
          <div style={{ position: "sticky", top: 24 }}>
            <PipelineProgress stages={stages} />

            {/* Metadata footer */}
            {output && (
              <div
                style={{
                  marginTop: 12,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Run Stats
                </p>
                {[
                  {
                    label: "Total time",
                    value: `${(output.metadata.total_latency_ms / 1000).toFixed(1)}s`,
                  },
                  {
                    label: "Retries",
                    value: String(output.metadata.total_retries),
                  },
                  {
                    label: "Repairs",
                    value: String(output.validation.repairs_performed),
                  },
                  {
                    label: "Validation",
                    value: output.validation.passed ? "Passed ✓" : "Warnings ⚠",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>
                      {row.label}
                    </span>
                    <span
                      style={{
                        color:
                          row.label === "Validation"
                            ? output.validation.passed
                              ? "var(--success)"
                              : "var(--warning)"
                            : "var(--text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Output */}
          <div>
            {/* Clarification needed */}
            {clarifications && (
              <div
                style={{
                  background: "#f0a50011",
                  border: "1px solid #f0a50033",
                  borderRadius: 12,
                  padding: "1.25rem",
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--warning)",
                    marginBottom: 10,
                  }}
                >
                  ⚠ Prompt needs clarification
                </p>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {clarifications.map((q, i) => (
                    <li
                      key={i}
                      style={{ fontSize: 13, color: "var(--text-secondary)" }}
                    >
                      {q}
                    </li>
                  ))}
                </ul>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    marginTop: 10,
                  }}
                >
                  Please refine your prompt and try again.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                style={{
                  background: "#f0505011",
                  border: "1px solid #f0505033",
                  borderRadius: 12,
                  padding: "1.25rem",
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--error)",
                    marginBottom: 6,
                  }}
                >
                  Pipeline Error
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    fontFamily: "monospace",
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && !output && (
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  minHeight: 300,
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "3px solid var(--border)",
                    borderTopColor: "var(--accent)",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--text-secondary)",
                    textAlign: "center",
                  }}
                >
                  Running pipeline…
                  <br />
                  <span style={{ fontSize: 12 }}>
                    Watch each stage complete on the left
                  </span>
                </p>
              </div>
            )}

            {/* Schema output */}
            {output && (
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "1.25rem",
                }}
              >
                {/* Success banner */}
                {allComplete && (
                  <div
                    style={{
                      background: "#22c97a11",
                      border: "1px solid #22c97a33",
                      borderRadius: 8,
                      padding: "10px 14px",
                      marginBottom: 20,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: "var(--success)",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>✓</span>
                    Pipeline complete — schemas validated and ready for execution
                  </div>
                )}

                <SchemaViewer output={output} />
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}