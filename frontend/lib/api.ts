const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── SSE streaming pipeline call ─────────────────────────────────────────────

export async function streamGenerate(
  prompt: string,
  runId: string,
  onEvent: (event: Record<string, unknown>) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, run_id: runId }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      onError(err.detail || `Server error: ${response.status}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError("No response stream available");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.event === "done") {
              onDone();
            } else {
              onEvent(parsed);
            }
          } catch {
            // malformed SSE line — skip
          }
        }
      }
    }
  } catch (err) {
    onError(err instanceof Error ? err.message : "Network error");
  }
}

// ─── Metrics fetch ────────────────────────────────────────────────────────────

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE}/metrics`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
}

// ─── Eval dataset fetch ───────────────────────────────────────────────────────

export async function fetchDataset() {
  const res = await fetch(`${API_BASE}/eval/dataset`);
  if (!res.ok) throw new Error("Failed to fetch dataset");
  return res.json();
}