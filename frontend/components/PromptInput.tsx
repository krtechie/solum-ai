"use client";

import { useState } from "react";

interface Props {
  onSubmit: (prompt: string) => void;
  loading: boolean;
}

const EXAMPLES = [
  "Build a CRM with login, contacts, deals pipeline, analytics dashboard, role-based access for admin and sales reps, and Stripe payments.",
  "Build an e-commerce platform with product listings, shopping cart, checkout, order tracking, and an admin panel.",
  "Build a project management app like Trello with boards, lists, cards, due dates, assignees, and team collaboration.",
  "Build a job board where companies post jobs and candidates apply. Both get dashboards to manage their activity.",
  "Build an LMS where instructors create courses with lessons and quizzes. Students enroll, track progress, and earn certificates.",
];

export default function PromptInput({ onSubmit, loading }: Props) {
  const [prompt, setPrompt] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const charCount = prompt.length;
  const charLimit = 4000;
  const isOverLimit = charCount > charLimit;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            margin: 0,
            background: "linear-gradient(135deg, #f0f0ff 0%, #a78bfa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1.2,
          }}
        >
          Describe your app.
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-secondary)",
            marginTop: 8,
            lineHeight: 1.6,
          }}
        >
          Solum AI compiles your description into a validated UI, API, database,
          and auth schema — ready to power a real application.
        </p>
      </div>

      {/* Textarea */}
      <div style={{ position: "relative" }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments..."
          rows={5}
          style={{
            width: "100%",
            background: "var(--surface)",
            border: `1px solid ${focused ? "var(--accent)" : "var(--border)"}`,
            borderRadius: 12,
            padding: "1rem",
            fontSize: 14,
            color: "var(--text-primary)",
            resize: "vertical",
            outline: "none",
            lineHeight: 1.6,
            transition: "border-color 0.15s",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />

        {/* Char counter */}
        <span
          style={{
            position: "absolute",
            bottom: 10,
            right: 12,
            fontSize: 11,
            color: isOverLimit ? "var(--error)" : "var(--text-secondary)",
            fontFamily: "monospace",
          }}
        >
          {charCount}/{charLimit}
        </span>
      </div>

      {/* Actions row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
          ⌘ + Enter to generate
        </p>

        <button
          onClick={handleSubmit}
          disabled={loading || !prompt.trim() || isOverLimit}
          style={{
            padding: "10px 24px",
            borderRadius: 10,
            border: "none",
            background:
              loading || !prompt.trim() || isOverLimit
                ? "var(--surface-2)"
                : "linear-gradient(135deg, #7c6dfa 0%, #a78bfa 100%)",
            color:
              loading || !prompt.trim() || isOverLimit
                ? "var(--text-secondary)"
                : "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor:
              loading || !prompt.trim() || isOverLimit
                ? "not-allowed"
                : "pointer",
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {loading ? (
            <>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "2px solid #ffffff55",
                  borderTopColor: "#fff",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Compiling…
            </>
          ) : (
            <>Generate Schema ↗</>
          )}
        </button>
      </div>

      {/* Example prompts */}
      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          Try an example
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {EXAMPLES.map((ex, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(ex)}
              disabled={loading}
              style={{
                textAlign: "left",
                fontSize: 12,
                color: "var(--text-secondary)",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "8px 12px",
                cursor: loading ? "not-allowed" : "pointer",
                lineHeight: 1.5,
                transition: "all 0.15s",
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "var(--accent)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "var(--border)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text-secondary)";
              }}
            >
              <span style={{ color: "var(--accent)", flexShrink: 0 }}>
                {idx + 1}.
              </span>
              {ex}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}