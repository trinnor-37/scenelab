import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { prompt, duration, product } = await req.json();
  if (!prompt?.trim()) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

  const durSec = parseInt(duration) || 7;
  const s1End  = Math.round(durSec * 0.25);
  const s2End  = Math.round(durSec * 0.50);
  const s3End  = Math.round(durSec * 0.85);

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 900,
    messages: [{
      role: "user",
      content: `You are a voiceover director specialising in luxury cinematic product commercials.

Write a timed voiceover script for this commercial. Use pacing annotations.

PRODUCT: ${product || "the product"}
SHOT DURATION: ${durSec} seconds

COMMERCIAL BRIEF:
${prompt.slice(0, 1500)}

Output the script in EXACTLY this format (plain text, no JSON, no markdown headers):

═══════════════════════════════
VOICEOVER SCRIPT — ${durSec}s
═══════════════════════════════

[0:00 – 0:${s1End}s] STAGE 1 — THE HOOK
[PACE: FAST]
"Voiceover line here."

[0:${s1End}s – 0:${s2End}s] STAGE 2 — THE BUILD
[PACE: SLOW]
"Voiceover line here." [PAUSE] "Continuation if needed."

[0:${s2End}s – 0:${s3End}s] STAGE 3 — THE PEAK
[PACE: SLOW] [EMPHASIS on key word]
"Voiceover line here."

[0:${s3End}s – 0:${durSec}s] STAGE 4 — THE CLOSE
[PACE: SLOW] [PAUSE]
"Brand/tagline line here."

─────────────────────────────
DIRECTOR'S NOTES
[2–3 short notes on delivery style, tone, and emphasis]

Rules:
- Language must be evocative and minimal — luxury/cinematic tone
- Each stage line: 5–12 words maximum
- Pacing annotations: [FAST], [SLOW], [PAUSE], [EMPHASIS]
- Director's notes: concrete guidance, not vague ("breathy and intimate" not "emotional")`,
    }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  return NextResponse.json({ script: text.trim() });
}
