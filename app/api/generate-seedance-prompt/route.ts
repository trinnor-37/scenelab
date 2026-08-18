// app/api/generate-seedance-prompt/route.ts
//
// Generates a production-grade Seedance 2.0 / Higgsfield prompt by:
//   1. Loading the SKILL.md rules (output format, hook principle)
//   2. Loading ONLY the selected style's reference file (per SKILL.md's own
//      instruction: "Read ONLY the relevant reference file")
//   3. Calling Claude with the brief + reference framework as context
//
// Requires ANTHROPIC_API_KEY to already be set in your Netlify env vars
// (it should be, per your existing Anthropic API integration).

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { getStyleById } from "@/lib/prompt-skills/seedance2/styles";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const REFERENCES_DIR = path.join(
  process.cwd(),
  "lib/prompt-skills/seedance2/references"
);

// Kept in sync with SKILL.md's "Prompt Output Format" section.
const OUTPUT_FORMAT_INSTRUCTIONS = `
Every generated prompt must be delivered as a single, clean text block the user
can copy-paste directly into Seedance 2.0 on Higgsfield. Structure:

[HOOK: 0-2s description]

[BEAT 1: timing — action, camera, lighting]
[BEAT 2: timing — action, camera, lighting]
[BEAT 3: timing — action, camera, lighting]
...

[SOUND DESIGN: ambient, foley, music, silence notes]

[MATERIAL REFERENCES: @image1 = ..., @video1 = ..., @audio1 = ...]

[TECHNICAL: aspect ratio, duration, style keywords]

Adapt this structure based on the specific style reference provided below —
each style has its own master template and conventions. Follow the reference
file's framework, camera techniques, hook patterns, and example prompts
closely. The output must be paste-ready: no preamble, no explanation, no
markdown headers — just the prompt block itself.

CRITICAL: Every prompt MUST open with a 2-second hook (see hook principle in
the reference material). This is non-negotiable.
`.trim();

interface RequestBody {
  styleId: string;
  brief: string;              // what the video is for (product/service/concept)
  duration?: string;          // e.g. "8s", "15s" — optional, model will infer a sensible default
  materialRefs?: string[];    // e.g. ["@image1 = product hero shot", "@audio1 = brand jingle"]
  additionalNotes?: string;   // tone, brand voice, anything else
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { styleId, brief, duration, materialRefs, additionalNotes } = body;

    if (!styleId || !brief?.trim()) {
      return NextResponse.json(
        { error: "styleId and brief are required" },
        { status: 400 }
      );
    }

    const style = getStyleById(styleId);
    if (!style) {
      return NextResponse.json(
        { error: `Unknown styleId: ${styleId}` },
        { status: 400 }
      );
    }

    // Load ONLY the selected style's reference file — per SKILL.md's own rule,
    // never load all 15 into context at once.
    const referencePath = path.join(REFERENCES_DIR, style.referenceFile);
    const referenceContent = await readFile(referencePath, "utf-8");

    const systemPrompt = `
You are a Seedance 2.0 prompt engineer generating large, detailed, paste-ready
video prompts optimized for Seedance 2.0 on Higgsfield.

${OUTPUT_FORMAT_INSTRUCTIONS}

---

STYLE REFERENCE FRAMEWORK (${style.name}):

${referenceContent}
`.trim();

    const userMessage = `
Generate a Seedance 2.0 prompt for the following brief.

BRIEF: ${brief}
${duration ? `TARGET DURATION: ${duration}` : ""}
${materialRefs?.length ? `MATERIAL REFERENCES AVAILABLE: ${materialRefs.join(", ")}` : ""}
${additionalNotes ? `ADDITIONAL NOTES: ${additionalNotes}` : ""}

Follow the ${style.name} reference framework above exactly. Output only the
final paste-ready prompt block — no preamble, no explanation.
`.trim();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((c) => c.type === "text");
    const generatedPrompt = textBlock?.type === "text" ? textBlock.text : "";

    if (!generatedPrompt) {
      return NextResponse.json(
        { error: "Model returned no text content" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      styleId: style.id,
      styleName: style.name,
      prompt: generatedPrompt,
    });
  } catch (err) {
    console.error("generate-seedance-prompt error:", err);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    );
  }
}
