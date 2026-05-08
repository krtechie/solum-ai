import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Solum AI — App Compiler",
  description:
    "Natural language → validated, executable app schemas via a multi-stage AI pipeline.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Nav */}
        <nav
          style={{
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "0 1.5rem",
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Logo */}
            <Link href="/" style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background:
                      "linear-gradient(135deg, #7c6dfa 0%, #a78bfa 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  S
                </div>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 16,
                    color: "var(--text-primary)",
                  }}
                >
                  Solum AI
                </span>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 20,
                    background: "var(--accent-dim)",
                    color: "var(--accent)",
                    fontWeight: 500,
                    border: "1px solid #7c6dfa44",
                  }}
                >
                  beta
                </span>
              </div>
            </Link>

            {/* Links */}
            <div style={{ display: "flex", gap: 8 }}>
              <Link
                href="/"
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  padding: "6px 12px",
                  borderRadius: 8,
                  transition: "all 0.15s",
                }}
              >
                Generate
              </Link>
              <Link
                href="/metrics"
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  padding: "6px 12px",
                  borderRadius: 8,
                  transition: "all 0.15s",
                }}
              >
                Metrics
              </Link>
              <a
                href="https://github.com/krtechie/solum-ai"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  padding: "6px 12px",
                  borderRadius: 8,
                  transition: "all 0.15s",
                }}
              >
                GitHub ↗
              </a>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>
          {children}
        </main>
      </body>
    </html>
  );
}