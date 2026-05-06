"use client";

import { StageState } from "@/lib/types";

interface Props {
  stages: StageState[];
}

const STAGE_ICONS = ["◎", "⬡", "⬢", "⟳", "✦"];

function StatusIcon({ status }: { status: StageState["status"] }) {
  if (status === "running") {
    return (
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "2px solid var(--accent)",
          borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
        }}
      />
    );
  }
  if (status === "complete") {
    return (
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "var(--success)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          color: "#fff",
          fontWeight: 700,
        }}
      >
        ✓
      </div>
    );
  }
  if (status === "error") {
    return (
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "var(--error)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          color: "#fff",
          fontWeight: 700,
        }}
      >
        ✕
      </div>
    );
  }
  return (
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: "2px solid var(--border)",
      }}
    />
  );
}

function PreviewChips({ preview }: { preview?: Record<string, unknown> }) {
  if (!preview) return null;

  const items: { label: string; value: string }[] = [];

  if (preview.app_name) items.push({ label: "app", value: String(preview.app_name) });
  if (preview.app_type) items.push({ label: "type", value: String(preview.app_type) });
  if (Array.isArray(preview.entities) && preview.entities.length)
    items.push({ label: "entities", value: preview.entities.join(", ") });
  if (Array.isArray(preview.roles) && preview.roles.length)
    items.push({ label: "roles", value: preview.roles.join(", ") });
  if (Array.isArray(preview.pages) && preview.pages.length)
    items.push({ label: "pages", value: String(preview.pages.length) });
  if (preview.api_endpoints)
    items.push({ label: "endpoints", value: String(preview.api_endpoints) });
  if (preview.db_tables)
    items.push({ label: "tables", value: String(preview.db_tables) });
  if (preview.auth_roles)
    items.push({ label: "roles", value: String(preview.auth_roles) });
  if (Array.isArray(preview.fixes_applied))
    items.push({
      label: "fixes",
      value: preview.fixes_applied.length
        ? String(preview.fixes_applied.length)
        : "none needed",
    });
  if (typeof preview.passed === "boolean")
    items.push({ label: "passed", value: preview.passed ? "yes" : "no" });
  if (preview.repairs !== undefined)
    items.push({ label: "repairs", value: String(preview.repairs) });

  if (!items.length) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
      {items.map((item) => (
        <span
          key={item.label}
          style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 20,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <span style={{ color: "var(--accent)", marginRight: 4 }}>
            {item.label}
          </span>
          {item.value}
        </span>
      ))}
    </div>
  );
}

export default function PipelineProgress({ stages }: Props) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-secondary)",
          marginBottom: "1rem",
        }}
      >
        Pipeline
      </p>

      {stages.map((stage, idx) => {
        const isLast = idx === stages.length - 1;
        const isActive = stage.status === "running";

        return (
          <div key={stage.id} style={{ display: "flex", gap: 12 }}>
            {/* Left: icon + connector line */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <StatusIcon status={stage.status} />
              {!isLast && (
                <div
                  style={{
                    width: 1,
                    flexGrow: 1,
                    minHeight: 24,
                    background:
                      stage.status === "complete"
                        ? "var(--success)"
                        : "var(--border)",
                    margin: "4px 0",
                    opacity: stage.status === "complete" ? 0.5 : 0.3,
                  }}
                />
              )}
            </div>

            {/* Right: content */}
            <div style={{ paddingBottom: isLast ? 0 : 16, flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color:
                      stage.status === "idle"
                        ? "var(--text-secondary)"
                        : "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--text-secondary)",
                      fontWeight: 400,
                    }}
                  >
                    {STAGE_ICONS[idx]}
                  </span>
                  {stage.name}
                </span>

                {stage.latency_ms !== undefined && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-secondary)",
                      fontFamily: "monospace",
                      flexShrink: 0,
                    }}
                  >
                    {(stage.latency_ms / 1000).toFixed(1)}s
                  </span>
                )}
              </div>

              {isActive && (
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--accent)",
                    marginTop: 4,
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                >
                  Processing…
                </p>
              )}

              {stage.error && (
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--error)",
                    marginTop: 4,
                  }}
                >
                  {stage.error}
                </p>
              )}

              <PreviewChips preview={stage.preview} />
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}