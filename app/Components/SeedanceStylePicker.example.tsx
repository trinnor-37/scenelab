// app/components/SeedanceStylePicker.example.tsx
//
// EXAMPLE ONLY — shows the minimal shape of a client component calling the
// new API route. Drop into your existing "Platform & Style" step UI and wire
// up to your actual design system / state management.

"use client";

import { useState } from "react";
import {
  SEEDANCE_STYLES,
  CATEGORY_LABELS,
  type SeedanceStyleCategory,
} from "@/lib/prompt-skills/seedance2/styles";

export default function SeedanceStylePicker() {
  const [styleId, setStyleId] = useState<string>("");
  const [brief, setBrief] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories: SeedanceStyleCategory[] = ["creative", "commercial", "industry"];

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate-seedance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styleId, brief, duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResult(data.prompt);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3>Platform & Style — Seedance 2.0</h3>

      {categories.map((cat) => (
        <div key={cat}>
          <h4>{CATEGORY_LABELS[cat]}</h4>
          {SEEDANCE_STYLES.filter((s) => s.category === cat).map((s) => (
            <label key={s.id}>
              <input
                type="radio"
                name="style"
                value={s.id}
                checked={styleId === s.id}
                onChange={() => setStyleId(s.id)}
              />
              {s.name} — <small>{s.bestFor}</small>
            </label>
          ))}
        </div>
      ))}

      <textarea
        placeholder="Describe the brief: product, service, or concept..."
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
      />

      <input
        placeholder="Target duration (optional, e.g. 8s)"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
      />

      <button onClick={handleGenerate} disabled={!styleId || !brief || loading}>
        {loading ? "Generating..." : "Generate Prompt"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {result && <pre>{result}</pre>}
    </div>
  );
}
