// app/Components/ImagePromptAIPanel.tsx
//
// Sits next to the instant "Generate Image Prompt →" button on the Image
// Prompt Builder's form step (app/page.tsx, inImgBuilder / imgStep==="form").
// The instant button stays the fast, free default — it's a pure local
// template (buildImagePrompt()) with no understanding of what was typed,
// so raw input (including typos) passes straight through untouched. This
// panel is the "actually write it" option: it sends the same fields the
// template uses to /api/generate-image-prompt, which runs them through the
// cinematic-image-prompting skill for a genuinely AI-crafted prompt in the
// same output shape, so the results screen needs no changes either way.
//
// Self-contained like CineGearAIPanel — owns its own loading/error state,
// reports the result UP via onResult. Unlike CineGearAIPanel it doesn't
// collect its own freeform input: the fields already exist on the form, so
// this is a second action on the same data, not a separate input box.

import { useState } from "react";

interface ImagePromptAIPanelProps {
  mode: string;
  subject: string;
  environment: string;
  mood: string;
  lighting: string;
  platform: string;
  aspect: string;
  onResult: (prompt: string) => void;
}

export default function ImagePromptAIPanel({
  mode,
  subject,
  environment,
  mood,
  lighting,
  platform,
  aspect,
  onResult,
}: ImagePromptAIPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!subject.trim()) {
      setError("Enter a subject first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-image-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, subject, environment, mood, lighting, platform, aspect }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to generate image prompt");
      }
      if (!data.prompt) {
        throw new Error("Model returned no prompt — try again.");
      }

      onResult(data.prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={handleGenerate}
        disabled={!subject.trim() || loading}
        style={{
          width: "100%",
          fontSize: 13,
          fontWeight: 600,
          padding: "12px 16px",
          borderRadius: "var(--radius-sm)",
          border: "1.5px solid var(--accent, #6366f1)",
          background: "transparent",
          color: "var(--accent, #6366f1)",
          cursor: !subject.trim() || loading ? "default" : "pointer",
          opacity: !subject.trim() || loading ? 0.6 : 1,
        }}
      >
        {loading ? "Writing with AI…" : "✦ Generate with AI — writes a real prompt from your inputs above"}
      </button>

      {error && (
        <p style={{ marginTop: 8, fontSize: 12, color: "#ef4444" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
