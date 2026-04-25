import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/stripe";

export type FeatureKey = "concepts" | "voiceover" | "variations";

export const LIMITS: Record<Plan, Record<FeatureKey, number>> = {
  free:    { concepts: 3,   voiceover: 2,   variations: 2 },
  starter: { concepts: 15,  voiceover: 10,  variations: 10 },
  pro:     { concepts: 999, voiceover: 999, variations: 999 },
  studio:  { concepts: 999, voiceover: 999, variations: 999 },
};

export async function getEffectivePlan(userId: string): Promise<Plan> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("plan, trial_ends_at")
    .eq("id", userId)
    .single();

  if (!data) return "free";
  if (data.trial_ends_at && new Date(data.trial_ends_at) > new Date()) return "pro";
  return (data.plan as Plan) || "free";
}

export async function checkUsage(
  userId: string,
  feature: FeatureKey
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const plan  = await getEffectivePlan(userId);
  const limit = LIMITS[plan][feature];
  if (limit >= 999) return { allowed: true, used: 0, limit };

  const supabase = await createClient();
  const today    = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("usage_counts")
    .select("concepts, voiceover, variations, pipeline")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  const row  = data as Record<string, number> | null;
  const used = row?.[feature] ?? 0;
  return { allowed: used < limit, used, limit };
}

export async function incrementUsage(userId: string, feature: FeatureKey): Promise<void> {
  const supabase = await createClient();
  const today    = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("usage_counts")
    .select("concepts, voiceover, variations, pipeline")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  const current = ((data as Record<string, number> | null)?.[feature] ?? 0);

  await supabase
    .from("usage_counts")
    .upsert(
      { user_id: userId, date: today, [feature]: current + 1 },
      { onConflict: "user_id,date" }
    );
}
