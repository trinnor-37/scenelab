"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const PRICE_IDS = {
  starter_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY ?? "",
  starter_annual:  process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL  ?? "",
  pro_monthly:     process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY     ?? "",
  pro_annual:      process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL      ?? "",
  studio_monthly:  process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDIO_MONTHLY  ?? "",
  studio_annual:   process.env.NEXT_PUBLIC_STRIPE_PRICE_STUDIO_ANNUAL   ?? "",
};

type PlanKey = "free" | "starter" | "pro" | "studio";

const TIERS: {
  id: PlanKey;
  name: string;
  monthlyPrice: number | null;
  annualTotal: number | null;
  annualMonthly: number | null;
  priceKey: { monthly: keyof typeof PRICE_IDS | null; annual: keyof typeof PRICE_IDS | null };
  tag?: string;
  popular?: boolean;
  founding?: boolean;
  features: { text: string; included: boolean }[];
  cta: string;
}[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    annualTotal: null,
    annualMonthly: null,
    priceKey: { monthly: null, annual: null },
    features: [
      { text: "Unlimited prompt building",         included: true },
      { text: "All 9 builder steps",               included: true },
      { text: "Save prompt history",               included: true },
      { text: "3 AI Concept generations / day",    included: true },
      { text: "1 Voiceover Script / day",          included: true },
      { text: "No watermark on prompts",           included: false },
      { text: "A/B Variations",                    included: false },
      { text: "Full Pipeline (Image + Video)",     included: false },
      { text: "Priority support",                  included: false },
    ],
    cta: "Get Started Free",
  },
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 19,
    annualTotal: 171,
    annualMonthly: 14.25,
    priceKey: { monthly: "starter_monthly", annual: "starter_annual" },
    features: [
      { text: "Unlimited prompt building",         included: true },
      { text: "All 9 builder steps",               included: true },
      { text: "Save prompt history",               included: true },
      { text: "No watermark on prompts",           included: true },
      { text: "15 AI Concept generations / day",   included: true },
      { text: "5 Voiceover Scripts / day",         included: true },
      { text: "5 A/B Variations / day",            included: true },
      { text: "Full Pipeline (Image + Video)",     included: false },
      { text: "Priority support",                  included: false },
    ],
  tag: "7-day free trial",
    cta: "Start Starter",
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 35,
    annualTotal: 315,
    annualMonthly: 26.25,
    priceKey: { monthly: "pro_monthly", annual: "pro_annual" },
    popular: true,
    features: [
      { text: "Everything in Starter",             included: true },
      { text: "Unlimited AI Concepts",             included: true },
      { text: "Unlimited Voiceover Scripts",       included: true },
      { text: "Unlimited A/B Variations",          included: true },
      { text: "Full Pipeline (Image + Video)",     included: true },
      { text: "Priority support",                  included: true },
      { text: "Early access to new features",      included: true },
      { text: "Multi-seat / team access",          included: false },
      { text: "API access",                        included: false },
    ],
    cta: "Start Free Trial",
  },
  {
    id: "studio",
    name: "Studio",
    monthlyPrice: 65,
    annualTotal: 585,
    annualMonthly: 48.75,
    priceKey: { monthly: "studio_monthly", annual: "studio_annual" },
    founding: true,
    features: [
      { text: "Everything in Pro",                 included: true },
      { text: "Up to 5 seats",                     included: true },
      { text: "White-label prompt exports",        included: true },
      { text: "API access",                        included: true },
      { text: "Dedicated account manager",         included: true },
      { text: "Early access to new features",      included: true },
      { text: "Priority feature requests",         included: true },
      { text: "Custom onboarding session",         included: true },
      { text: "SLA support",                       included: true },
    ],
    cta: "Coming Soon",
  },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,300&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .px-page {
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    color: #eef5ff;
  }

  /* ── HEADER ── */
  .px-header {
    padding: 22px 7vw 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(68,187,255,0.13);
    position: sticky;
    top: 0;
    background: rgba(2,8,16,0.92);
    backdrop-filter: blur(32px);
    z-index: 10;
  }
  .px-logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    letter-spacing: 5px;
    cursor: pointer;
  }
  .px-logo-scene { color: #ede3c0; }
  .px-logo-bloc  { color: #44bbff; text-shadow: 0 0 28px rgba(68,187,255,0.55); }

  .px-header-nav { display: flex; gap: 8px; align-items: center; }
  .px-nav-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 9px 18px;
    background: transparent;
    border: 1px solid rgba(68,187,255,0.18);
    border-radius: 100px;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.07em; text-transform: uppercase;
    color: #74d0ff; cursor: pointer;
    transition: all .18s;
  }
  .px-nav-btn:hover { background: rgba(68,187,255,0.10); border-color: rgba(68,187,255,0.35); }
  .px-nav-btn-primary { background: #44bbff; color: #000; border-color: #44bbff; box-shadow: 0 4px 18px rgba(68,187,255,0.25); }
  .px-nav-btn-primary:hover { background: #74d0ff; border-color: #74d0ff; transform: translateY(-1px); }

  /* ── HERO ── */
  .px-hero {
    text-align: center;
    padding: 72px 7vw 56px;
  }
  .px-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: #44bbff;
    margin-bottom: 18px;
  }
  .px-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(48px, 8vw, 80px);
    letter-spacing: 3px;
    color: #ede3c0;
    line-height: 1;
    margin-bottom: 20px;
  }
  .px-sub {
    font-size: 17px;
    color: rgba(155,210,248,0.55);
    font-weight: 300;
    max-width: 480px;
    margin: 0 auto 40px;
    line-height: 1.6;
  }

  /* ── TOAST ── */
  .px-toast {
    display: inline-block;
    padding: 12px 24px;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 40px;
  }
  .px-toast-success { background: rgba(62,207,110,0.12); color: #3ecf6e; border: 1px solid rgba(62,207,110,0.25); }
  .px-toast-cancel  { background: rgba(255,80,80,0.10);  color: #ff7070; border: 1px solid rgba(255,80,80,0.20); }

  /* ── TOGGLE ── */
  .px-toggle-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    margin-bottom: 52px;
  }
  .px-toggle-lbl {
    font-size: 13px;
    font-weight: 600;
    color: rgba(155,210,248,0.55);
    cursor: pointer;
    transition: color .15s;
  }
  .px-toggle-lbl.active { color: #eef5ff; }
  .px-toggle {
    width: 48px; height: 26px;
    background: rgba(68,187,255,0.15);
    border: 1px solid rgba(68,187,255,0.25);
    border-radius: 100px;
    position: relative;
    cursor: pointer;
    transition: background .18s, border-color .18s;
  }
  .px-toggle.on { background: rgba(68,187,255,0.30); border-color: rgba(68,187,255,0.50); }
  .px-toggle-dot {
    position: absolute;
    top: 3px; left: 3px;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: rgba(155,210,248,0.50);
    transition: transform .18s, background .18s;
  }
  .px-toggle.on .px-toggle-dot { transform: translateX(22px); background: #44bbff; }
  .px-annual-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #3ecf6e;
    background: rgba(62,207,110,0.10);
    border: 1px solid rgba(62,207,110,0.22);
    border-radius: 100px;
    padding: 3px 9px;
  }

  /* ── PRICING GRID ── */
  .px-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    max-width: 1140px;
    margin: 0 auto;
    padding: 0 7vw 80px;
  }
  @media (max-width: 900px) { .px-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 560px) { .px-grid { grid-template-columns: 1fr; } }

  .px-card {
    background: rgba(5,14,28,0.85);
    border: 1px solid rgba(68,187,255,0.12);
    border-radius: 22px;
    padding: 28px 24px 32px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    transition: border-color .2s, transform .2s;
  }
  .px-card:hover { border-color: rgba(68,187,255,0.28); transform: translateY(-2px); }
  .px-card.popular {
    border-color: rgba(68,187,255,0.45);
    background: rgba(5,14,30,0.95);
  }
  .px-card.popular::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(160deg, rgba(68,187,255,0.07) 0%, transparent 55%);
    pointer-events: none;
  }
  .px-card.current {
    border-color: rgba(62,207,110,0.40);
    background: rgba(5,16,24,0.95);
  }

  .px-card-tag {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 100px;
    display: inline-block;
    margin-bottom: 16px;
    align-self: flex-start;
  }
  .px-card-tag-popular  { background: rgba(68,187,255,0.15); color: #44bbff; border: 1px solid rgba(68,187,255,0.30); }
  .px-card-tag-trial    { background: rgba(62,207,110,0.10); color: #3ecf6e; border: 1px solid rgba(62,207,110,0.22); }
  .px-card-tag-founding { background: rgba(255,180,50,0.10); color: #f5b942; border: 1px solid rgba(255,180,50,0.25); }
  .px-card-tag-current  { background: rgba(62,207,110,0.10); color: #3ecf6e; border: 1px solid rgba(62,207,110,0.22); }

  .px-plan-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 32px;
    letter-spacing: 3px;
    color: #ede3c0;
    line-height: 1;
    margin-bottom: 6px;
  }
  .px-card.popular .px-plan-name { color: #44bbff; }

  .px-price-row { margin-bottom: 6px; }
  .px-price {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 52px;
    letter-spacing: 1px;
    color: #eef5ff;
    line-height: 1;
  }
  .px-price-currency { font-size: 26px; vertical-align: super; color: rgba(155,210,248,0.70); }
  .px-price-period {
    font-size: 13px;
    color: rgba(155,210,248,0.40);
    font-weight: 400;
    margin-top: 2px;
  }
  .px-price-annual-note {
    font-size: 11px;
    color: rgba(155,210,248,0.35);
    margin-bottom: 20px;
    min-height: 16px;
  }

  .px-divider {
    height: 1px;
    background: rgba(68,187,255,0.10);
    margin: 20px 0;
  }

  .px-features { flex: 1; display: flex; flex-direction: column; gap: 11px; margin-bottom: 28px; }
  .px-feature {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.4;
  }
  .px-feature-icon {
    font-size: 13px;
    flex-shrink: 0;
    margin-top: 1px;
    width: 16px;
    text-align: center;
  }
  .px-feature.included  { color: #eef5ff; }
  .px-feature.excluded  { color: rgba(155,210,248,0.28); text-decoration: line-through; text-decoration-color: rgba(155,210,248,0.15); }
  .px-feature-icon-yes  { color: #3ecf6e; }
  .px-feature-icon-no   { color: rgba(155,210,248,0.20); }

  .px-cta {
    width: 100%;
    padding: 15px 0;
    border-radius: 100px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all .18s;
    border: none;
  }
  .px-cta-outline {
    background: transparent;
    border: 1.5px solid rgba(68,187,255,0.25);
    color: rgba(155,210,248,0.65);
  }
  .px-cta-outline:hover { border-color: rgba(68,187,255,0.50); color: #eef5ff; }
  .px-cta-primary {
    background: #44bbff;
    color: #000;
    box-shadow: 0 4px 24px rgba(68,187,255,0.30);
  }
  .px-cta-primary:hover { background: #74d0ff; transform: translateY(-1px); box-shadow: 0 6px 30px rgba(68,187,255,0.40); }
  .px-cta-gold {
    background: linear-gradient(135deg, #f5b942 0%, #e8962a 100%);
    color: #0a0500;
    box-shadow: 0 4px 24px rgba(245,185,66,0.25);
  }
  .px-cta-gold:hover { transform: translateY(-1px); box-shadow: 0 6px 30px rgba(245,185,66,0.35); }
  .px-cta-current {
    background: rgba(62,207,110,0.12);
    border: 1.5px solid rgba(62,207,110,0.30);
    color: #3ecf6e;
    cursor: default;
  }
  .px-cta:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── FOOTER NOTE ── */
  .px-footer-note {
    text-align: center;
    padding: 0 7vw 80px;
    font-size: 13px;
    color: rgba(155,210,248,0.35);
    line-height: 1.7;
  }
  .px-footer-note a { color: #44bbff; text-decoration: none; }
  .px-footer-note a:hover { text-decoration: underline; }
  .px-footer-divider { max-width: 400px; height: 1px; background: rgba(68,187,255,0.08); margin: 0 auto 32px; }

  /* ── TRIAL BANNER ── */
  .px-trial-banner {
    max-width: 700px;
    margin: 0 auto 40px;
    background: rgba(68,187,255,0.06);
    border: 1px solid rgba(68,187,255,0.18);
    border-radius: 14px;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 13px;
    color: rgba(155,210,248,0.75);
  }
  .px-trial-icon { font-size: 20px; flex-shrink: 0; }
  .px-trial-strong { color: #44bbff; font-weight: 700; }
`;

function PricingContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [annual,   setAnnual]   = useState(false);
  const [user,     setUser]     = useState<User | null>(null);
  const [plan,     setPlan]     = useState<string>("free");
  const [trialEnd, setTrialEnd] = useState<Date | null>(null);
  const [loading,  setLoading]  = useState<string | null>(null);

  const success  = searchParams.get("success")  === "true";
  const canceled = searchParams.get("canceled") === "true";

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) loadProfile(user.id);
    });
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("plan, trial_ends_at")
      .eq("id", userId)
      .single();
    if (!data) return;
    if (data.trial_ends_at && new Date(data.trial_ends_at) > new Date()) {
      setPlan("pro");
      setTrialEnd(new Date(data.trial_ends_at));
    } else {
      setPlan(data.plan ?? "free");
    }
  };

  const trialDaysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))
    : null;

  const handleUpgrade = async (priceKey: keyof typeof PRICE_IDS | null) => {
    if (!priceKey) {
      router.push("/auth");
      return;
    }
    if (!user) { router.push("/auth"); return; }

    const priceId = PRICE_IDS[priceKey];
    if (!priceId || priceId.startsWith("price_") === false) {
      alert("Stripe price ID not configured yet. Please add it to .env.local.");
      return;
    }

    setLoading(priceKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const ctaStyle = (tier: typeof TIERS[number]) => {
    if (tier.id === plan) return "px-cta px-cta-current";
    if (tier.id === "pro") return "px-cta px-cta-primary";
    if (tier.id === "studio") return "px-cta px-cta-gold";
    if (tier.id === "free") return "px-cta px-cta-outline";
    return "px-cta px-cta-outline";
  };

  const ctaAction = (tier: typeof TIERS[number]) => {
    if (tier.id === plan) return;
    if (tier.id === "studio") return;
    if (tier.id === "free") { router.push("/"); return; }
    const key = annual ? tier.priceKey.annual : tier.priceKey.monthly;
    handleUpgrade(key);
  };

  return (
    <>
      <style>{css}</style>
      <div className="px-page">
        {/* Header */}
        <div className="px-header">
          <div className="px-logo" onClick={() => router.push("/")}>
            <span className="px-logo-scene">SCENE</span>
            <span className="px-logo-bloc">BLOC</span>
          </div>
          <div className="px-header-nav">
            <button className="px-nav-btn" onClick={() => router.push("/")}>← Builder</button>
            {user ? (
              <button className="px-nav-btn px-nav-btn-primary" onClick={() => router.push("/profile")}>
                My Account
              </button>
            ) : (
              <button className="px-nav-btn px-nav-btn-primary" onClick={() => router.push("/auth")}>
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Hero */}
        <div className="px-hero">
          <div className="px-eyebrow">Pricing</div>
          <div className="px-title">Simple, Honest Pricing</div>
          <div className="px-sub">
            Start free. Upgrade when you need more. Cancel anytime.
          </div>

          {success && (
            <div className="px-toast px-toast-success">
              ✓ Subscription activated — welcome aboard!
            </div>
          )}
          {canceled && (
            <div className="px-toast px-toast-cancel">
              Checkout canceled — no charge was made.
            </div>
          )}

          {trialDaysLeft !== null && trialDaysLeft > 0 && (
            <div className="px-trial-banner">
              <div className="px-trial-icon">⏳</div>
              <div>
                You&apos;re on a <span className="px-trial-strong">7-day Pro trial</span> —{" "}
                <span className="px-trial-strong">{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}</span> remaining.
                Upgrade before it ends to keep Pro access.
              </div>
            </div>
          )}

          {/* Monthly / Annual toggle */}
          <div className="px-toggle-wrap">
            <span
              className={`px-toggle-lbl${!annual ? " active" : ""}`}
              onClick={() => setAnnual(false)}
            >
              Monthly
            </span>
            <div className={`px-toggle${annual ? " on" : ""}`} onClick={() => setAnnual(v => !v)}>
              <div className="px-toggle-dot" />
            </div>
            <span
              className={`px-toggle-lbl${annual ? " active" : ""}`}
              onClick={() => setAnnual(true)}
            >
              Annual
            </span>
            {annual && <div className="px-annual-badge">3 months free</div>}
          </div>
        </div>

        {/* Pricing grid */}
        <div className="px-grid">
          {TIERS.map(tier => {
            const isCurrent = user && tier.id === plan;
            const price = annual ? tier.annualMonthly : tier.monthlyPrice;

            return (
              <div
                key={tier.id}
                className={`px-card${tier.popular ? " popular" : ""}${isCurrent ? " current" : ""}`}
              >
                {/* Tags */}
                {isCurrent ? (
                  <div className="px-card-tag px-card-tag-current">Current plan</div>
                ) : tier.popular && tier.tag ? (
                  <>
                    <div className="px-card-tag px-card-tag-popular">Most Popular</div>
                  </>
                ) : tier.founding ? (
                  <div className="px-card-tag px-card-tag-founding">Founding Rate — first 50 subscribers</div>
                ) : (
                  <div style={{ height: 28 }} />
                )}

                {/* Trial tag for Pro */}
                {tier.tag && !isCurrent && (
                  <div className="px-card-tag px-card-tag-trial" style={{ marginBottom: 12 }}>
                    {tier.tag}
                  </div>
                )}

                <div className="px-plan-name">{tier.name}</div>

                <div className="px-price-row">
                  {price === null || price === 0 ? (
                    <div className="px-price">Free</div>
                  ) : (
                    <div className="px-price">
                      <span className="px-price-currency">£</span>
                      {annual ? tier.annualMonthly?.toFixed(2) : price}
                    </div>
                  )}
                  <div className="px-price-period">
                    {price === 0 || price === null ? "forever" : "per month"}
                  </div>
                </div>

                <div className="px-price-annual-note">
                  {annual && tier.annualTotal
                    ? `Billed annually — £${tier.annualTotal}/yr`
                    : tier.annualTotal
                    ? `Save £${(((tier.monthlyPrice ?? 0) * 12) - tier.annualTotal).toFixed(0)}/yr with annual`
                    : ""}
                </div>

                <div className="px-divider" />

                <div className="px-features">
                  {tier.features.map((f, i) => (
                    <div key={i} className={`px-feature${f.included ? " included" : " excluded"}`}>
                      <span className={`px-feature-icon${f.included ? " px-feature-icon-yes" : " px-feature-icon-no"}`}>
                        {f.included ? "✓" : "✕"}
                      </span>
                      {f.text}
                    </div>
                  ))}
                </div>

                <button
                  className={ctaStyle(tier)}
                  onClick={() => ctaAction(tier)}
                  disabled={!!loading || isCurrent === true}
                >
                  {isCurrent
                    ? "Current Plan"
                    : loading === (annual ? tier.priceKey.annual : tier.priceKey.monthly)
                    ? "Loading…"
                    : tier.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer notes */}
        <div className="px-footer-note">
          <div className="px-footer-divider" />
          <p>
            Bought our blueprint?{" "}
            <a href="mailto:founders@scenebloc.com">Email founders@scenebloc.com</a>{" "}
            for your lifetime discount.
          </p>
          <p style={{ marginTop: 10 }}>
            All prices in GBP. Cancel anytime — no lock-in. Subscriptions managed via{" "}
            <a href="https://stripe.com" target="_blank" rel="noopener noreferrer">Stripe</a>.
          </p>
        </div>
      </div>
    </>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}
