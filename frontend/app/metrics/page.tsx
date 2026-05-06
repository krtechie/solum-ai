import { fetchMetrics } from "@/lib/api";
import MetricsDashboard from "@/components/MetricsDashboard";
import { MetricsData } from "@/lib/types";
import Link from "next/link";

export const revalidate = 30; // revalidate every 30 seconds

async function getMetrics(): Promise<MetricsData | null> {
  try {
    return await fetchMetrics();
  } catch {
    return null;
  }
}

export default async function MetricsPage() {
  const data = await getMetrics();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              margin: 0,
              color: "var(--text-primary)",
            }}
          >
            Evaluation Metrics
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              marginTop: 6,
            }}
          >
            Live stats across all pipeline runs — success rate, latency,
            retries, and failure breakdown.
          </p>
        </div>

        <Link
          href="/"
          style={{
            fontSize: 13,
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            textDecoration: "none",
            background: "var(--surface)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ← Back to Generator
        </Link>
      </div>

      {/* Dataset info banner */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--accent-dim)",
              border: "1px solid #7c6dfa44",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            📊
          </div>
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Evaluation Dataset
            </p>
            <p
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginTop: 2,
              }}
            >
              20 prompts — 10 real-world + 10 edge cases (vague, conflicting,
              underspecified)
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Real prompts",   value: "10", color: "var(--success)" },
            { label: "Edge cases",     value: "10", color: "var(--warning)" },
            { label: "Total prompts",  value: "20", color: "var(--accent)"  },
          ].map((badge) => (
            <div
              key={badge.label}
              style={{
                textAlign: "center",
                padding: "6px 14px",
                borderRadius: 8,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: badge.color,
                  margin: 0,
                }}
              >
                {badge.value}
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: "var(--text-secondary)",
                  marginTop: 2,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {badge.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Error state */}
      {!data && (
        <div
          style={{
            background: "#f0505011",
            border: "1px solid #f0505033",
            borderRadius: 12,
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, color: "var(--error)", fontWeight: 600 }}>
            Could not connect to backend
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              marginTop: 6,
            }}
          >
            Make sure the FastAPI backend is running at{" "}
            <code
              style={{
                fontFamily: "monospace",
                background: "var(--surface-2)",
                padding: "1px 6px",
                borderRadius: 4,
              }}
            >
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
            </code>
          </p>
        </div>
      )}

      {/* Empty state */}
      {data && data.total_runs === 0 && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "3rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 40 }}>◎</div>
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            No runs yet
          </p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Generate your first schema to start seeing metrics here.
          </p>
          <Link
            href="/"
            style={{
              fontSize: 13,
              padding: "8px 20px",
              borderRadius: 8,
              background: "var(--accent)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 500,
              marginTop: 4,
            }}
          >
            Go to Generator →
          </Link>
        </div>
      )}

      {/* Dashboard */}
      {data && data.total_runs > 0 && <MetricsDashboard data={data} />}

      {/* Auto-refresh note */}
      {data && (
        <p
          style={{
            fontSize: 11,
            color: "var(--text-secondary)",
            textAlign: "center",
          }}
        >
          Page refreshes every 30 seconds · Powered by SQLite eval logger
        </p>
      )}
    </div>
  );
}