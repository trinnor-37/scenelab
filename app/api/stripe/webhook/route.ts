import { NextRequest, NextResponse } from "next/server";
import { stripe, planFromPriceId } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

// Stripe sends raw body — do not parse it before signature verification
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId  = session.metadata?.userId;
      if (!userId || !session.subscription) break;

      const sub    = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = sub.items.data[0]?.price.id ?? "";
      const plan    = planFromPriceId(priceId);

      await admin.from("profiles").update({
        plan,
        stripe_subscription_id: sub.id,
        subscription_status:    sub.status,
      }).eq("id", userId);
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;

      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("stripe_subscription_id", sub.id)
        .single();

      if (!profile) break;

      const isActive = sub.status === "active" || sub.status === "trialing";
      const priceId  = sub.items.data[0]?.price.id ?? "";
      const plan     = isActive ? planFromPriceId(priceId) : "free";

      await admin.from("profiles").update({
        plan,
        subscription_status: sub.status,
      }).eq("id", profile.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
