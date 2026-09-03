// app/api/generate-cinema-gear/route.ts
//
// Cinema Gear 2.0 — decision engine. Takes a mood/genre/scene description
// and returns a camera+lens+focal+aperture pairing plus a paste-ready
// cinematography paragraph, per the SKILL.md decision table.
//
// This is a lookup/decision skill, not a choreography or dialogue
// generator — output is short and structured, meant to feed INTO other
// skills (cinematic-image-prompting, video-prompt-generator,
// one-take-ugc's Camera Geometry section) rather than stand alone as a
// final deliverable.

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SKILL_DIR = path.join(process.cwd(), "lib/prompt-skills/cinema-gear-20");

interface RequestBody {
  moodOrGenre: string;       // required — e.g. "moody film noir", "bright product ad"
  sceneDescription?: string; // optional extra context
  constraints?: string;      // e.g. "must work handheld", "budget consumer camera only"
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();

    if (!body.moodOrGenre?.trim()) {
      return NextResponse.json(
        { error: "moodOrGenre is required" },
        { status: 400 }
      );
    }

    const skillMd = await readFile(path.join(SKILL_DIR, "SKILL.md"), "utf-8");
    const quickRef = await readFile(
      path.join(SKILL_DIR, "QUICK-REFERENCE.md"),
      "utf-8"
    );

    const systemPrompt = `
You are a cinematography decision engine using the skill below. Given a
mood/genre, return the camera body, lens, focal length, and aperture
pairing that best matches — plus a short paste-ready cinematography
paragraph describing the resulting look. Keep output compact and
structured; this feeds into other prompt-generation skills downstream,
it is not a standalone creative brief.

Output format:
CAMERA: ...
LENS: ...
FOCAL LENGTH: ...
APERTURE: ...
CINEMATOGRAPHY PARAGRAPH: (2-4 sentences, paste-ready for downstream use)

---

SKILL:

${skillMd}

---

QUICK REFERENCE:

${quickRef}
`.trim();

    const userMessage = `
MOOD/GENRE: ${body.moodOrGenre}
${body.sceneDescription ? `SCENE: ${body.sceneDescription}` : ""}
${body.constraints ? `CONSTRAINTS: ${body.constraints}` : ""}

Return the gear pairing and cinematography paragraph per the format above.
`.trim();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((c) => c.type === "text");
    const result = textBlock?.type === "text" ? textBlock.text : "";

    if (!result) {
      return NextResponse.json(
        { error: "Model returned no text content" },
        { status: 502 }
      );
    }

    return NextResponse.json({ result });
  } catch (err) {
    console.error("generate-cinema-gear error:", err);
    return NextResponse.json(
      { error: "Failed to generate gear pairing" },
      { status: 500 }
    );
  }
}
