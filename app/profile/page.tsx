"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,300&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .prof-page {
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    color: #eef5ff;
  }

  /* ── HEADER ── */
  .prof-header {
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
  .prof-logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    letter-spacing: 5px;
    cursor: pointer;
  }
  .prof-logo-scene { color: #ede3c0; }
  .prof-logo-bloc  { color: #44bbff; text-shadow: 0 0 28px rgba(68,187,255,0.55); }

  .prof-header-nav { display: flex; gap: 8px; align-items: center; }
  .prof-nav-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 18px;
    background: transparent;
    border: 1px solid rgba(68,187,255,0.18);
    border-radius: 100px;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: #74d0ff;
    cursor: pointer;
    transition: all .18s;
  }
  .prof-nav-btn:hover { background: rgba(68,187,255,0.10); border-color: rgba(68,187,255,0.35); }
  .prof-nav-btn-primary { background: #44bbff; color: #000; border-color: #44bbff; box-shadow: 0 4px 18px rgba(68,187,255,0.25); }
  .prof-nav-btn-primary:hover { background: #74d0ff; border-color: #74d0ff; transform: translateY(-1px); }
  .prof-nav-btn-ghost { color: rgba(155,210,248,0.50); border-color: rgba(68,187,255,0.10); }
  .prof-nav-btn-ghost:hover { color: rgba(155,210,248,0.80); border-color: rgba(68,187,255,0.28); }
  .prof-user-dot {
    width: 7px; height: 7px;
    background: #3ecf6e;
    border-radius: 50%;
    box-shadow: 0 0 7px rgba(62,207,110,0.8);
    flex-shrink: 0;
  }

  /* ── BODY ── */
  .prof-body {
    max-width: 760px;
    margin: 0 auto;
    padding: 52px 7vw 100px;
  }

  .prof-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 52px;
    letter-spacing: 3px;
    color: #ede3c0;
    line-height: 1;
    margin-bottom: 6px;
  }
  .prof-subtitle {
    font-size: 14px;
    color: rgba(155,210,248,0.45);
    font-style: italic;
    font-weight: 300;
    margin-bottom: 40px;
  }

  /* ── AVATAR CARD ── */
  .prof-identity {
    background: rgba(5,14,28,0.85);
    border: 1px solid rgba(68,187,255,0.13);
    border-radius: 22px;
    padding: 32px 28px;
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 16px;
    position: relative;
    overflow: hidden;
  }
  .prof-identity::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(68,187,255,0.04) 0%, transparent 60%);
    pointer-events: none;
  }
  .prof-avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(68,187,255,0.22) 0%, rgba(120,80,255,0.18) 100%);
    border: 2px solid rgba(68,187,255,0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 30px;
    color: #74d0ff;
    letter-spacing: 2px;
    flex-shrink: 0;
    text-shadow: 0 0 20px rgba(68,187,255,0.5);
  }
  .prof-identity-info { flex: 1; min-width: 0; }
  .prof-email {
    font-size: 18px;
    font-weight: 700;
    color: #eef5ff;
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .prof-badges { display: flex; gap: 8px; flex-wrap: wrap; }
  .prof-badge {
    padding: 4px 13px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }
  .prof-badge-live {
    background: rgba(62,207,110,0.12);
    color: #3ecf6e;
    border: 1px solid rgba(62,207,110,0.25);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .prof-badge-live-dot {
    width: 6px; height: 6px;
    background: #3ecf6e;
    border-radius: 50%;
    box-shadow: 0 0 7px rgba(62,207,110,0.9);
  }
  .prof-badge-free {
    background: rgba(68,187,255,0.10);
    color: #74d0ff;
    border: 1px solid rgba(68,187,255,0.20);
  }

  /* ── STATS GRID ── */
  .prof-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  @media (max-width: 540px) { .prof-stats { grid-template-columns: 1fr 1fr; } }

  .prof-stat {
    background: rgba(5,14,28,0.80);
    border: 1px solid rgba(68,187,255,0.10);
    border-radius: 18px;
    padding: 22px 20px;
    transition: border-color .18s;
  }
  .prof-stat:hover { border-color: rgba(68,187,255,0.22); }
  .prof-stat-value {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 42px;
    letter-spacing: 2px;
    color: #44bbff;
    text-shadow: 0 0 30px rgba(68,187,255,0.35);
    line-height: 1;
    margin-bottom: 6px;
  }
  .prof-stat-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: rgba(155,210,248,0.45);
  }

  /* ── TIER CARD ── */
  .prof-tier {
    background: rgba(5,14,28,0.80);
    border: 1px solid rgba(68,187,255,0.10);
    border-radius: 18px;
    padding: 24px 24px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .prof-tier-info {}
  .prof-tier-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(155,210,248,0.40);
    margin-bottom: 6px;
  }
  .prof-tier-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    letter-spacing: 2px;
    color: #ede3c0;
    line-height: 1;
  }
  .prof-tier-desc {
    font-size: 12px;
    color: rgba(155,210,248,0.40);
    margin-top: 5px;
    font-weight: 400;
  }
  .prof-tier-badge {
    padding: 10px 20px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: rgba(68,187,255,0.10);
    color: #74d0ff;
    border: 1px solid rgba(68,187,255,0.20);
    white-space: nowrap;
  }

  /* ── ACTIONS ── */
  .prof-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .prof-action-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px 22px;
    background: rgba(5,14,28,0.80);
    border: 1px solid rgba(68,187,255,0.10);
    border-radius: 16px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #eef5ff;
    cursor: pointer;
    transition: all .18s;
    text-align: left;
    width: 100%;
  }
  .prof-action-btn:hover { border-color: rgba(68,187,255,0.25); background: rgba(5,14,28,0.95); }
  .prof-action-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }
  .prof-action-icon-blue { background: rgba(68,187,255,0.12); }
  .prof-action-icon-red  { background: rgba(255,80,80,0.10); }
  .prof-action-text { flex: 1; }
  .prof-action-title { font-size: 14px; font-weight: 600; color: #eef5ff; }
  .prof-action-sub   { font-size: 11px; color: rgba(155,210,248,0.40); margin-top: 2px; font-weight: 400; }
  .prof-action-arrow { color: rgba(155,210,248,0.30); font-size: 18px; }
  .prof-action-btn-signout .prof-action-title { color: rgba(255,120,120,0.80); }
  .prof-action-btn-signout:hover { border-color: rgba(255,80,80,0.22); background: rgba(255,80,80,0.04); }
`;

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function memberSince(iso: string) {
  const months = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 30));
  if (months < 1) return "Less than a month";
  if (months === 1) return "1 month";
  return `${months} months`;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser]           = useState<User | null>(null);
  const [promptCount, setCount]   = useState<number | null>(null);
  const [loading, setLoading]     = useState(true);

  const fetchCount = useCallback(async () => {
    const res = await fetch("/api/prompts");
    if (res.ok) {
      const data = await res.json();
      setCount(Array.isArray(data) ? data.length : 0);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth"); return; }
      setUser(user);
      fetchCount().finally(() => setLoading(false));
    });
  }, [router, fetchCount]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <style>{css}</style>
      <div className="prof-page">
        <div className="prof-header">
          <div className="prof-logo" onClick={() => router.push("/")}>
            <span className="prof-logo-scene">SCENE</span>
            <span className="prof-logo-bloc">BLOC</span>
          </div>
          <div className="prof-header-nav">
            <button className="prof-nav-btn" onClick={() => router.push("/history")}>
              <div className="prof-user-dot" />History
            </button>
            <button className="prof-nav-btn prof-nav-btn-primary" onClick={() => router.push("/")}>
              + Build New
            </button>
            <button className="prof-nav-btn prof-nav-btn-ghost" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>

        <div className="prof-body">
          <div className="prof-title">MY PROFILE</div>
          <div className="prof-subtitle">Account details and usage overview</div>

          {/* Identity */}
          <div className="prof-identity">
            <div className="prof-avatar">
              {user ? initials(user.email ?? "??") : "—"}
            </div>
            <div className="prof-identity-info">
              <div className="prof-email">{user?.email ?? "—"}</div>
              <div className="prof-badges">
                <div className="prof-badge prof-badge-live">
                  <div className="prof-badge-live-dot" />Active
                </div>
                <div className="prof-badge prof-badge-free">Free Tier</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="prof-stats">
            <div className="prof-stat">
              <div className="prof-stat-value">
                {loading ? "—" : (promptCount ?? 0)}
              </div>
              <div className="prof-stat-label">Prompts Saved</div>
            </div>
            <div className="prof-stat">
              <div className="prof-stat-value" style={{ fontSize: "24px", paddingTop: "9px" }}>
                {user ? formatDate(user.created_at) : "—"}
              </div>
              <div className="prof-stat-label">Member Since</div>
            </div>
            <div className="prof-stat">
              <div className="prof-stat-value" style={{ fontSize: "28px", paddingTop: "7px" }}>
                {user ? memberSince(user.created_at) : "—"}
              </div>
              <div className="prof-stat-label">Time as Member</div>
            </div>
          </div>

          {/* Tier */}
          <div className="prof-tier">
            <div className="prof-tier-info">
              <div className="prof-tier-label">Current Plan</div>
              <div className="prof-tier-name">FREE TIER</div>
              <div className="prof-tier-desc">Unlimited prompt building · Prompts saved to account · SceneBloc watermark on copy</div>
            </div>
            <div className="prof-tier-badge">Free</div>
          </div>

          {/* Action links */}
          <div className="prof-actions">
            <button className="prof-action-btn" onClick={() => router.push("/history")}>
              <div className="prof-action-icon prof-action-icon-blue">📂</div>
              <div className="prof-action-text">
                <div className="prof-action-title">Prompt History</div>
                <div className="prof-action-sub">
                  {loading ? "Loading…" : `${promptCount ?? 0} saved prompt${promptCount !== 1 ? "s" : ""}`}
                </div>
              </div>
              <div className="prof-action-arrow">›</div>
            </button>

            <button className="prof-action-btn" onClick={() => router.push("/")}>
              <div className="prof-action-icon prof-action-icon-blue">✦</div>
              <div className="prof-action-text">
                <div className="prof-action-title">Build a New Prompt</div>
                <div className="prof-action-sub">Open the cinematic prompt builder</div>
              </div>
              <div className="prof-action-arrow">›</div>
            </button>

            <button className="prof-action-btn prof-action-btn-signout" onClick={handleSignOut}>
              <div className="prof-action-icon prof-action-icon-red">→</div>
              <div className="prof-action-text">
                <div className="prof-action-title">Sign Out</div>
                <div className="prof-action-sub">You will be redirected to the home screen</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
