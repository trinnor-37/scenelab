// app/Components/CineGearAIPanel.tsx
//
// Sits alongside the existing Signature Looks / Mood grid in the
// Cinematography step (app/page.tsx, case "cine"). The mood grid stays
// the fast default; this panel is the "describe your own scene" path for
// briefs the 7 presets don't cover (freelancers, agencies, specific
// constraints like "must work handheld").
//
// Self-contained on purpose — it owns its own loading/error/input state
// via its own hooks, then reports the parsed result UP via onApply, the
// same lift-state-up pattern the existing applyMood/applyLook functions
// use. This avoids calling useState inside a switch-statement case block
// in page.tsx, which would break across stage changes.

import { useState } from "react";

export interface ParsedCineGear {
  camera: string;
  lens: string;
  focalLength: string;
  aperture: string;
}

function parseCineGearResult(text: string): { gear: ParsedCineGear; paragraph: string } {
  const get = (label: string) => {
    const re = new RegExp(`${label}:\\s*(.+)`, "i");
    const m = text.match(re);
    return m ? m[1].trim() : "";
  };

  const paragraphMatch = text.match(/CINEMATOGRAPHY PARAGRAPH:\s*([\s\S]+)/i);

  return {
    gear: {
      camera: get("CAMERA"),
      lens: get("LENS"),
      focalLength: get("FOCAL LENGTH"),
      aperture: get("APERTURE"),
    },
    paragraph: paragraphMatch ? paragraphMatch[1].trim() : "",
  };
}

interface CineGearAIPanelProps {
  // Called once parsing succeeds. Parent should apply this the same way
  // applyMood/applyLook do (setShared with cineCamera/cineLens/etc).
  onApply: (gear: ParsedCineGear, paragraph: string) => void;
}

export default function CineGearAIPanel({ onApply }: CineGearAIPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState("");
  const [constraints, setConstraints] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!description.trim()) {
      setError("Describe the scene or mood you're after first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-cinema-gear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moodOrGenre: description,
          constraints: constraints || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to generate gear pairing");
      }

      const { gear, paragraph } = parseCineGearResult(data.result);

      if (!gear.camera || !gear.lens) {
        throw new Error("Couldn't parse a full gear pairing from the response — try rephrasing.");
      }

      onApply(gear, paragraph);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          marginTop: 16,
          background: "transparent",
          border: "1px dashed var(--muted)",
          borderRadius: "var(--radius-sm)",
          padding: "10px 14px",
          fontSize: 12,
          color: "var(--muted2)",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
        }}
      >
        + Or describe your own scene / constraints for a tailored gear pairing
      </button>
    );
  }

  return (
    <div
      style={{
        marginTop: 16,
        padding: "14px 16px",
        background: "var(--surface2)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 10,
        }}
      >
        Custom Gear — Describe Your Own Scene
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder='e.g. "tense interrogation scene, single overhead light" or "bright energetic sneaker ad"'
        rows={2}
        style={{
          width: "100%",
          fontSize: 13,
          padding: "8px 10px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--muted)",
          background: "transparent",
          color: "inherit",
          marginBottom: 8,
          resize: "vertical",
        }}
      />

      <input
        type="text"
        value={constraints}
        onChange={(e) => setConstraints(e.target.value)}
        placeholder='Constraints (optional) — e.g. "must work handheld", "budget consumer camera only"'
        style={{
          width: "100%",
          fontSize: 13,
          padding: "8px 10px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--muted)",
          background: "transparent",
          color: "inherit",
          marginBottom: 10,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: "var(--accent, #6366f1)",
            color: "#fff",
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Generating..." : "Generate custom pairing"}
        </button>
        <button
          onClick={() => setExpanded(false)}
          style={{
            fontSize: 12,
            background: "transparent",
            border: "none",
            color: "var(--muted2)",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>

      {error && (
        <p style={{ marginTop: 8, fontSize: 12, color: "#ef4444" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
