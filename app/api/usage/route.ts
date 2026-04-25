import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEffectivePlan, LIMITS } from "@/lib/plan";
import type { FeatureKey } from "@/lib/plan";

// GET /api/usage — returns today's usage + limits for the authenticated user
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [plan, trialData] = await Promise.all([
    getEffectivePlan(user.id),
    supabase.from("profiles").select("trial_ends_at").eq("id", user.id).single(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const { data: usage } = await supabase
    .from("usage_counts")
    .select("concepts, voiceover, variations, pipeline")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();

  return NextResponse.json({
    plan,
    trialEndsAt: trialData.data?.trial_ends_at ?? null,
    limits:      LIMITS[plan as keyof typeof LIMITS],
    used: {
      concepts:   usage?.concepts   ?? 0,
      voiceover:  usage?.voiceover  ?? 0,
      variations: usage?.variations ?? 0,
      pipeline:   usage?.pipeline   ?? 0,
    },
  });
}

// POST /api/usage — check + increment a feature counter; returns 429 if at limit
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to use AI features" }, { status: 401 });

  const { feature } = await req.json() as { feature: FeatureKey };
  if (!feature) return NextResponse.json({ error: "feature required" }, { status: 400 });

  const plan  = await getEffectivePlan(user.id);
  const limit = LIMITS[plan as keyof typeof LIMITS]?.[feature] ?? LIMITS.free[feature];

  if (limit >= 999) return NextResponse.json({ allowed: true, plan });

  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("usage_counts")
    .select("concepts, voiceover, variations, pipeline")
    .eq("user_id", user.id)
    .eq("date", today)
    .maybeSingle();

  const used = ((data as Record<string, number> | null)?.[feature] ?? 0);

  if (used >= limit) {
    return NextResponse.json(
      { error: "limit_exceeded", feature, used, limit, plan },
      { status: 429 }
    );
  }

  await supabase
    .from("usage_counts")
    .upsert(
      { user_id: user.id, date: today, [feature]: used + 1 },
      { onConflict: "user_id,date" }
    );

  return NextResponse.json({ allowed: true, used: used + 1, limit, plan });
}
