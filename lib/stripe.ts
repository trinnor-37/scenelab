import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const PRICE_IDS = {
  starter_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY ?? "",
  starter_annual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL  ?? "",
  pro_monthly:     process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY     ?? "",
  pro_annual:      process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL      ?? "",
  studio_monthly:  process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDIO_MONTHLY  ?? "",
  studio_annual:   process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDIO_ANNUAL   ?? "",
} as const;

export function planFromPriceId(priceId: string): Plan {
  const map: Record<string, Plan> = {
    [PRICE_IDS.starter_monthly]: "starter",
    [PRICE_IDS.starter_annual]:  "starter",
    [PRICE_IDS.pro_monthly]:     "pro",
    [PRICE_IDS.pro_annual]:      "pro",
    [PRICE_IDS.studio_monthly]:  "studio",
    [PRICE_IDS.studio_annual]:   "studio",
  };
  return map[priceId] ?? "free";
}

export type Plan = "free" | "starter" | "pro" | "studio";
