"use client";

import { MetricsData } from "@/lib/types";

interface Props {
  data: MetricsData;
}

function StatCard({
  label,
  value,
  sub,
  color = "var(--text-primary)",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "1.25rem",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 8,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 28,
          fontWeight: 700,
          color,
          margin: 0,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            marginTop: 6,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function SuccessBar({ rate }: { rate: number }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 10,
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
          Success Rate
        </p>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color:
              rate >= 80
                ? "var(--success)"
                : rate >= 50
                ? "var(--warning)"
                : "var(--error)",
          }}
        >
          {rate}%
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: "var(--surface-2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 4,
            width: `${rate}%`,
            background:
              rate >= 80
                ? "var(--success)"
                : rate >= 50
                ? "var(--warning)"
                : "var(--error)",
            transition: "width 1s ease",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          0%
        </span>
        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          100%
        </span>
      </div>
    </div>
  );
}

function FailureTypes({
  types,
}: {
  types: MetricsData["failure_types"];
}) {
  if (!types.length) {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "1.25rem",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 12,
          }}
        >
          Failure Types
        </p>
        <p style={{ fontSize: 13, color: "var(--success)" }}>
          No failures recorded ✓
        </p>
      </div>
    );
  }

  const max = Math.max(...types.map((t) => t.c));

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "1.25rem",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 12,
        }}
      >
        Failure Types
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {types.map((t) => (
          <div key={t.failure_type}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  fontFamily: "monospace",
                }}
              >
                {t.failure_type || "unknown"}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--error)",
                  fontWeight: 600,
                }}
              >
                {t.c}
              </span>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 2,
                background: "var(--surface-2)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 2,
                  background: "var(--error)",
                  width: `${(t.c / max) * 100}%`,
                  opacity: 0.7,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentRuns({ runs }: { runs: MetricsData["recent_runs"] }) {
  if (!runs.length) {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "1.25rem",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 12,
          }}
        >
          Recent Runs
        </p>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          No runs yet. Generate your first schema!
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "1.25rem",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 12,
        }}
      >
        Recent Runs
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* Header row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 80px 80px 60px 60px",
            gap: 8,
            padding: "6px 8px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {["Prompt", "App Type", "Latency", "Stage", "Status"].map((h) => (
            <span
              key={h}
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                fontWeight: 600,
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {runs.map((run) => (
          <div
            key={run.run_id}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 80px 80px 60px 60px",
              gap: 8,
              padding: "10px 8px",
              borderBottom: "1px solid var(--border)",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={run.prompt}
            >
              {run.prompt}
            </span>
            <span
              style={{
                fontSize: 11,
                color: "var(--accent)",
                padding: "2px 8px",
                borderRadius: 20,
                background: "var(--accent-dim)",
                border: "1px solid #7c6dfa44",
                textAlign: "center",
              }}
            >
              {run.app_type || "—"}
            </span>
            <span
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                fontFamily: "monospace",
              }}
            >
              {(run.latency_ms / 1000).toFixed(1)}s
            </span>
            <span
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                textAlign: "center",
              }}
            >
              {run.stages_completed}/5
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: run.success ? "var(--success)" : "var(--error)",
                textAlign: "center",
              }}
            >
              {run.success ? "✓" : "✕"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MetricsDashboard({ data }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
        }}
      >
        <StatCard
          label="Total Runs"
          value={String(data.total_runs)}
          sub="all time"
        />
        <StatCard
          label="Successful"
          value={String(data.success_count)}
          color="var(--success)"
          sub={`${data.failure_count} failed`}
        />
        <StatCard
          label="Avg Latency"
          value={`${(data.avg_latency_ms / 1000).toFixed(1)}s`}
          sub="per pipeline run"
        />
        <StatCard
          label="Avg Retries"
          value={String(data.avg_retries)}
          sub="per run"
          color={
            data.avg_retries > 3 ? "var(--warning)" : "var(--text-primary)"
          }
        />
      </div>

      {/* Success bar + failure types */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <SuccessBar rate={data.success_rate} />
        <FailureTypes types={data.failure_types} />
      </div>

      {/* Recent runs table */}
      <RecentRuns runs={data.recent_runs} />
    </div>
  );
}