interface Props {
  error: string;
  onRetry: () => void;
}

export default function ErrorScreen({ error, onRetry }: Props) {
  const clean = error.startsWith("{") ? "Repository not found or is private. Please check the URL and try again." : error;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #dc2626, transparent)" }} />
      <nav style={{ display: "flex", alignItems: "center", padding: "16px 48px", borderBottom: "1px solid #1e0a0a" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, letterSpacing: -0.5 }}>GitFlix</span>
      </nav>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 520, width: "100%", margin: "0 auto", padding: "0 32px" }}>
        <div style={{ fontSize: 12, color: "#dc2626", letterSpacing: 3, textTransform: "uppercase", marginBottom: 16, fontFamily: "var(--font-display)", fontWeight: 600 }}>
          Production Failed
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 900, letterSpacing: -3, lineHeight: 0.93, marginBottom: 16 }}>
          The film couldn't<br />be made.
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 32, lineHeight: 1.6 }}>{clean}</p>
        <button
          onClick={onRetry}
          style={{ alignSelf: "flex-start", fontSize: 13, color: "var(--text-muted)", border: "1px solid var(--border-dim)", padding: "10px 24px", borderRadius: 6, background: "transparent", cursor: "pointer" }}
        >
          Try again →
        </button>
      </div>
    </div>
  );
}
