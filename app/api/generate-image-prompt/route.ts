// app/api/generate-image-prompt/route.ts
//
// AI-crafted counterpart to the Image Prompt Builder's instant local
// template (buildImagePrompt() in app/page.tsx). The template concatenates
// the user's raw input strings into a fixed shape — it doesn't understand
// or elaborate on what was typed, so a typo or a vague word goes straight
// through untouched. This route actually reads the request through the
// cinematic-image-prompting skill and writes a real prompt.
//
// Output is pinned to the same section shape the template produces (Main
// Prompt / Negative Prompt / Generation Parameters / 3 Variations / I2V
// Integration Notes) so the results screen renders it with zero structural
// changes — this is a drop-in alternative to the template's output, not a
// different UI.

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SKILL_DIR = path.join(process.cwd(), "lib/prompt-skills/cinematic-image-prompting");

const MODE_LABELS: Record<string, string> = {
  filming: "AI Filmmaking (Module 1)",
  commercial: "AI Ad Commercials (Module 2)",
  ugc: "AI UGC Ads (Module 3)",
  editorial: "Product Shots & Editorial (Module 4)",
};

const OUTPUT_FORMAT_INSTRUCTIONS = `
Deliver the result as a single plain-text block using EXACTLY this shape
(the frontend renders this verbatim, so do not add markdown headers,
preamble, or explanation outside it):

═══════════════════════════════
IMAGE PROMPT
Mode: <use case label>
═══════════════════════════════

[MAIN PROMPT]
<the full 200-300 word primary prompt>

[NEGATIVE PROMPT]
<50-100 words of exclusions and artifact removal>

[GENERATION PARAMETERS]
Steps: <30-50> | CFG Scale: <7-10> | Sampler: DPM++ 2M Karras | Aspect: <aspect ratio>

─────────────────────────────
VARIATION 1 — Establishing
<a genuinely different wide/establishing take on the same concept>

VARIATION 2 — Intimate Close-up
<a genuinely different close/macro take — different framing, not a reworded copy of the main prompt>

VARIATION 3 — Dynamic Motion
<a genuinely different in-motion take — different energy and camera behavior>

─────────────────────────────
I2V INTEGRATION NOTES

Kling AI: <specific consistency-strength and motion-prompt guidance for THIS image>
Seedance: <specific first-frame/motion-intensity/duration guidance for THIS image>
Veo 3: <specific conditioning-frame and audio guidance for THIS image>

CRITICAL: The three variations must differ meaningfully in composition,
camera distance, and energy — not just relabeled restatements of the main
prompt. Correct and elevate the user's raw input into proper cinematic
language (fix typos, replace vague words with specific, professional
vocabulary from the skill) — never echo their raw wording back unedited.
`.trim();

interface RequestBody {
  mode: string;             // filming | commercial | ugc | editorial
  subject: string;          // required — product/subject description
  environment?: string;
  mood?: string;
  lighting?: string;
  platform?: string;        // e.g. Instagram, TikTok — informs framing/aspect conventions
  aspect?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { mode, subject, environment, mood, lighting, platform, aspect } = body;

    if (!mode || !subject?.trim()) {
      return NextResponse.json(
        { error: "mode and subject are required" },
        { status: 400 }
      );
    }

    const [skillMd, cheatSheet] = await Promise.all([
      readFile(path.join(SKILL_DIR, "SKILL.md"), "utf-8"),
      readFile(path.join(SKILL_DIR, "CHEAT-SHEET.md"), "utf-8"),
    ]);

    const modeLabel = MODE_LABELS[mode] || mode;

    const systemPrompt = `
You are a cinematic image prompt engineer using the skill below. Draw
primarily from the ${modeLabel} module for vocabulary, templates, and
examples — the other modules are there for reference only.

${OUTPUT_FORMAT_INSTRUCTIONS}

---

SKILL:

${skillMd}

---

QUICK REFERENCE:

${cheatSheet}
`.trim();

    const userMessage = `
Generate an image prompt for the following brief.

USE CASE: ${modeLabel}
SUBJECT: ${subject}
${environment ? `ENVIRONMENT / BACKGROUND: ${environment}` : ""}
${mood ? `MOOD: ${mood}` : ""}
${lighting ? `LIGHTING: ${lighting}` : ""}
${platform && platform !== "None / Universal" ? `TARGET PLATFORM: ${platform}` : ""}
${aspect ? `ASPECT RATIO: ${aspect}` : ""}

Output only the final block in the exact format specified — no preamble,
no explanation.
`.trim();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((c) => c.type === "text");
    const prompt = textBlock?.type === "text" ? textBlock.text : "";

    if (!prompt) {
      return NextResponse.json(
        { error: "Model returned no text content" },
        { status: 502 }
      );
    }

    return NextResponse.json({ prompt });
  } catch (err) {
    console.error("generate-image-prompt error:", err);
    return NextResponse.json(
      { error: "Failed to generate image prompt" },
      { status: 500 }
    );
  }
}
