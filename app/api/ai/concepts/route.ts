import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { product, audience } = await req.json();
  if (!product?.trim()) return NextResponse.json({ error: "Product required" }, { status: 400 });

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    messages: [{
      role: "user",
      content: `You are a Creative Director and Behavioral Scientist specialising in luxury product video commercials.

Generate 3 distinct storyboard concepts for a short-form product video commercial.

PRODUCT: ${product}
TARGET AUDIENCE: ${audience || "general consumers"}

Return ONLY valid JSON — no markdown, no explanation, no extra text:
{
  "concepts": [
    {
      "id": "A",
      "title": "4-6 word concept title",
      "hook": "0–25% of video: what grabs attention in the first 2 seconds (1–2 sentences)",
      "build": "25–50%: how tension and desire builds (1–2 sentences)",
      "peak": "50–85%: the climactic reveal or transformation moment (1–2 sentences)",
      "closure": "85–100%: brand resolution and emotional payoff (1–2 sentences)"
    },
    { "id": "B", ... },
    { "id": "C", ... }
  ]
}

Rules:
- Each concept must use a DIFFERENT psychological approach (e.g. contrast, aspiration, social proof)
- Be specific to the product and audience — no generic descriptions
- Keep each field to 1–2 punchy sentences maximum`,
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
