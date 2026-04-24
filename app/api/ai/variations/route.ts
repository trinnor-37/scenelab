import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { prompt, product, hookType, commercialStyle } = await req.json();
  if (!product?.trim()) return NextResponse.json({ error: "Product required" }, { status: 400 });

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: `You are a Creative Director and Behavioral Scientist specialising in conversion-focused luxury product commercials.

Generate A/B test variation copy for this commercial.

PRODUCT: ${product}
HOOK TYPE: ${hookType || "Bold Visual Contrast"}
COMMERCIAL STYLE: ${commercialStyle || "Cinematic / Epic"}
BRIEF SUMMARY: ${prompt?.slice(0, 600) || "Luxury product commercial"}

Return ONLY valid JSON — no markdown, no extra text:
{
  "hookVariations": [
    "Hook A: Opening 3-second direction for variation A (1–2 sentences, specific and visual)",
    "Hook B: ...",
    "Hook C: ..."
  ],
  "emotionalAngles": [
    "Angle A: The emotional trigger this version targets and how the visuals express it (1–2 sentences)",
    "Angle B: ...",
    "Angle C: ..."
  ],
  "ctaVariations": [
    "CTA A: Closing call-to-action approach and wording direction (1–2 sentences)",
    "CTA B: ...",
    "CTA C: ..."
  ]
}

Rules:
- Each variation within a group must use a DIFFERENT psychological mechanism
- Be concrete and actionable for a video director — no vague adjectives
- Variations should feel like genuinely different creative choices, not just rewording`,
    }],
  });

  try {
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}
