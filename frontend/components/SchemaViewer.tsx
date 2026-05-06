"use client";

import { useState } from "react";
import { SolumOutput } from "@/lib/types";

interface Props {
  output: SolumOutput;
}

type Tab = "intent" | "design" | "ui" | "api" | "db" | "auth" | "runtime" | "validation";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "intent",     label: "Intent",     emoji: "◎" },
  { id: "design",     label: "Design",     emoji: "⬡" },
  { id: "ui",         label: "UI",         emoji: "▣" },
  { id: "api",        label: "API",        emoji: "⇌" },
  { id: "db",         label: "Database",   emoji: "⬢" },
  { id: "auth",       label: "Auth",       emoji: "⚿" },
  { id: "runtime",    label: "Runtime",    emoji: "▶" },
  { id: "validation", label: "Validation", emoji: "✦" },
];

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 20,
        background: `${color}22`,
        color: color,
        border: `1px solid ${color}44`,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}

function CodeBlock({ code, language = "json" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={handleCopy}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          fontSize: 11,
          padding: "4px 10px",
          borderRadius: 6,
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          color: copied ? "var(--success)" : "var(--text-secondary)",
          cursor: "pointer",
          zIndex: 1,
        }}
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
      <pre
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "1rem",
          overflowX: "auto",
          fontSize: 12,
          lineHeight: 1.6,
          color: "var(--text-primary)",
          fontFamily: "monospace",
          margin: 0,
          maxHeight: 520,
          overflowY: "auto",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function IntentTab({ output }: { output: SolumOutput }) {
  const i = output.intent;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div
        style={{
          background: "var(--surface-2)",
          borderRadius: 10,
          padding: "1rem 1.25rem",
          border: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{i.app_name}</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            {i.description}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Badge color="var(--accent)">{i.app_type}</Badge>
          {i.has_auth && <Badge color="var(--success)">auth</Badge>}
          {i.has_payments && <Badge color="var(--warning)">payments</Badge>}
          {i.has_analytics && <Badge color="#06b6d4">analytics</Badge>}
          {i.has_file_upload && <Badge color="#a78bfa">file upload</Badge>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Entities */}
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "1rem" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Entities</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {i.entities.map((e) => (
              <Badge key={e} color="var(--accent)">{e}</Badge>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "1rem" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Roles</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {i.roles.map((r) => (
              <Badge key={r} color="var(--success)">{r}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "1rem" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Features Extracted</p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {i.features.map((f, idx) => (
            <li key={idx} style={{ fontSize: 13, color: "var(--text-primary)", display: "flex", gap: 8 }}>
              <span style={{ color: "var(--accent)" }}>→</span> {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Assumptions */}
      {i.assumptions.length > 0 && (
        <div style={{ background: "#f0a50011", border: "1px solid #f0a50033", borderRadius: 10, padding: "1rem" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--warning)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Assumptions Made</p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {i.assumptions.map((a, idx) => (
              <li key={idx} style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 8 }}>
                <span style={{ color: "var(--warning)" }}>⚠</span> {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ValidationTab({ output }: { output: SolumOutput }) {
  const v = output.validation;
  const m = output.metadata;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Status",   value: v.passed ? "PASSED" : "WARNINGS", color: v.passed ? "var(--success)" : "var(--warning)" },
          { label: "Repairs",  value: String(v.repairs_performed),        color: "var(--accent)" },
          { label: "Retries",  value: String(v.retries_used),             color: "var(--text-primary)" },
          { label: "Latency",  value: `${(m.total_latency_ms / 1000).toFixed(1)}s`, color: "var(--text-primary)" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Stage latencies */}
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "1rem" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Stage Latencies</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(m.stage_latencies).map(([stage, ms]) => {
            const pct = Math.min((ms / m.total_latency_ms) * 100, 100);
            return (
              <div key={stage}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{stage}</span>
                  <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-primary)" }}>{(ms / 1000).toFixed(1)}s</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "var(--border)" }}>
                  <div style={{ height: "100%", borderRadius: 2, background: "var(--accent)", width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Issues */}
      {v.issues.length > 0 && (
        <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "1rem" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Validation Issues</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {v.issues.map((issue, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: 12,
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: issue.repaired ? "#22c97a11" : issue.severity === "error" ? "#f0505011" : "#f0a50011",
                  border: `1px solid ${issue.repaired ? "#22c97a33" : issue.severity === "error" ? "#f0505033" : "#f0a50033"}`,
                  color: "var(--text-secondary)",
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <span>{issue.repaired ? "✓" : issue.severity === "error" ? "✕" : "⚠"}</span>
                <span>{issue.issue}</span>
                {issue.repaired && <Badge color="var(--success)">repaired</Badge>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RuntimeTab({ output }: { output: SolumOutput }) {
  const [activeFile, setActiveFile] = useState<"prisma" | "express" | "env">("prisma");
  const files = {
    prisma:  { label: "schema.prisma",  code: output.runtime.prisma_schema,  lang: "prisma" },
    express: { label: "routes.js",      code: output.runtime.express_routes, lang: "javascript" },
    env:     { label: ".env.example",   code: output.runtime.env_template,   lang: "bash" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Setup instructions */}
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "1rem" }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Setup Instructions</p>
        <ol style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: 6 }}>
          {output.runtime.setup_instructions.map((step, idx) => (
            <li key={idx} style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{step}</li>
          ))}
        </ol>
      </div>

      {/* File tabs */}
      <div>
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {(Object.keys(files) as (keyof typeof files)[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveFile(key)}
              style={{
                fontSize: 12,
                padding: "5px 12px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: activeFile === key ? "var(--accent)" : "var(--surface-2)",
                color: activeFile === key ? "#fff" : "var(--text-secondary)",
                cursor: "pointer",
                fontFamily: "monospace",
              }}
            >
              {files[key].label}
            </button>
          ))}
        </div>
        <CodeBlock code={files[activeFile].code} language={files[activeFile].lang} />
      </div>
    </div>
  );
}

export default function SchemaViewer({ output }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("intent");

  const renderContent = () => {
    switch (activeTab) {
      case "intent":     return <IntentTab output={output} />;
      case "validation": return <ValidationTab output={output} />;
      case "runtime":    return <RuntimeTab output={output} />;
      default:
        return (
          <CodeBlock
            code={JSON.stringify(
              output[activeTab as keyof SolumOutput],
              null,
              2
            )}
          />
        );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          paddingBottom: 12,
          borderBottom: "1px solid var(--border)",
          marginBottom: 16,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontSize: 12,
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid",
              borderColor: activeTab === tab.id ? "var(--accent)" : "transparent",
              background: activeTab === tab.id ? "var(--accent-dim)" : "transparent",
              color: activeTab === tab.id ? "var(--accent)" : "var(--text-secondary)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s",
            }}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}