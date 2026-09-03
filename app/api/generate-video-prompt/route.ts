// app/api/generate-video-prompt/route.ts
//
// Generates a director-controllable video prompt using the video-prompt-generator
// skill's craft (not a style picker — this is a methodology skill).
//
// Two modes:
//   "full"    -> 13-element scaffold, for multi-shot narrative arcs
//   "compact" -> 8-element formula, for single-beat shots (50-150 words)
//
// Loads SKILL.md always (it's the core method) plus optionally one or more
// reference docs (CAMERA-TECHNIQUES, AUDIO-KEYWORDS, EXAMPLES) depending on
// what the brief needs — kept lean by default to avoid bloating every call
// with all three references when they're not needed.
//
// Gear context now follows the shared hand-off pattern via
// lib/prompt-skills/shared/pipeline-context.ts — if Cinema Gear 2.0 already
// ran for this generation, its output is passed through as gearContext and
// spliced in as a mandatory constraint (same treatment as
// generate-seedance-prompt and generate-one-take-prompt).

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { buildUpstreamContextBlock } from "@/lib/prompt-skills/shared/pipeline-context";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SKILL_DIR = path.join(
  process.cwd(),
  "lib/prompt-skills/video-prompt-generator"
);

type ScaffoldMode = "full" | "compact";

interface RequestBody {
  mode: ScaffoldMode;
  brief: string;                 // what the video is about
  duration?: string;             // e.g. "10s", "0-12s" — required for "full", optional for "compact"
  includeCameraReference?: boolean;  // load CAMERA-TECHNIQUES.md for richer shot language
  includeAudioReference?: boolean;   // load AUDIO-KEYWORDS.md for richer sound design
  category?: "people" | "vehicles" | "action" | "general"; // picks the right constraints-block variant
  additionalNotes?: string;
  gearContext?: string;          // NEW — raw `result` string from generate-cinema-gear,
                                   // if the user ran that step first
}

async function loadSkillContext(body: RequestBody): Promise<string> {
  const skillMd = await readFile(path.join(SKILL_DIR, "SKILL.md"), "utf-8");

  let context = skillMd;

  if (body.includeCameraReference) {
    const camera = await readFile(
      path.join(SKILL_DIR, "references/CAMERA-TECHNIQUES.md"),
      "utf-8"
    );
    context += `\n\n---\n\nCAMERA TECHNIQUES REFERENCE:\n\n${camera}`;
  }

  if (body.includeAudioReference) {
    const audio = await readFile(
      path.join(SKILL_DIR, "references/AUDIO-KEYWORDS.md"),
      "utf-8"
    );
    context += `\n\n---\n\nAUDIO KEYWORDS REFERENCE:\n\n${audio}`;
  }

  return context;
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { mode, brief, duration, category, additionalNotes, gearContext } = body;

    if (!mode || !brief?.trim()) {
      return NextResponse.json(
        { error: "mode ('full' | 'compact') and brief are required" },
        { status: 400 }
      );
    }
    if (mode === "full" && !duration?.trim()) {
      return NextResponse.json(
        { error: "duration is required for 'full' mode (multi-shot needs timing)" },
        { status: 400 }
      );
    }

    const skillContext = await loadSkillContext(body);

    // NEW — if Cinema Gear 2.0 already ran, fold its output in as a hard
    // constraint rather than letting this route re-decide camera/lens/etc.
    const upstreamBlock = buildUpstreamContextBlock(
      gearContext ? { source: "cinema-gear-20", content: gearContext } : undefined
    );

    const systemPrompt = `
You are a director-level video prompt engineer using the video-prompt-generator
craft below. Follow its Mandatory Prompt Structure exactly: Scene Header ->
numbered/timed Shot Blocks -> Constraints Block. Constraints must always be
phrased as POSITIVE instructions, never as negations ("no X") — this is a
hard rule, not a preference.

${
  mode === "full"
    ? "Use the 13-element scaffold to think through the brief first (Style, Environment, Character, Creature/Antagonist if relevant, Threat if relevant, Core Action, Energy, Camera, Lighting, Physics, Audio, Timeline, Style Boosters), then output ONLY the final packaged prompt in Mandatory Prompt Structure format — do not show your scaffold notes in the output."
    : "Use the 8-element compact formula: Subject + Action + Scene + Lighting + Camera + Style + Quality + Constraints. Target 50-150 words. Single beat, no shot blocks needed unless the brief genuinely has two connected moments."
}

${category ? `Use the "${category}" category-specific constraints-block variant from the skill.` : "Use the standard universal constraints block unless the brief clearly fits a specific category."}

${upstreamBlock ? `\n---\n\n${upstreamBlock}\n` : ""}
---

SKILL REFERENCE:

${skillContext}
`.trim();

    const userMessage = `
Generate a video prompt for the following brief.

BRIEF: ${brief}
${duration ? `DURATION: ${duration}` : ""}
${additionalNotes ? `ADDITIONAL NOTES: ${additionalNotes}` : ""}

Output only the final prompt, formatted per the skill's Mandatory Prompt
Structure.${
  gearContext ? " Honor the mandatory upstream gear context exactly — camera, lens, and framing are already decided, do not substitute different choices." : ""
} No preamble, no explanation, no scaffold notes shown.
`.trim();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
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

    return NextResponse.json({ mode, prompt: generatedPrompt });
  } catch (err) {
    console.error("generate-video-prompt error:", err);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    );
  }
}
