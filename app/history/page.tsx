"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Prompt {
  id: string;
  title: string;
  product: string | null;
  scene_count: number;
  prompt_text: string;
  scenes_json: Record<string, unknown> | null;
  created_at: string;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,300&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .hist-page {
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    background:
      radial-gradient(ellipse 60% 50% at 20% 15%, rgba(68,187,255,0.11) 0%, transparent 70%),
      radial-gradient(ellipse 50% 45% at 80% 80%, rgba(120,80,255,0.08) 0%, transparent 70%),
      #020810;
    color: #eef5ff;
  }

  .hist-header {
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
  .hist-logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    letter-spacing: 5px;
  }
  .hist-logo-scene { color: #ede3c0; }
  .hist-logo-bloc  { color: #44bbff; text-shadow: 0 0 28px rgba(68,187,255,0.55); }

  .hist-header-actions { display: flex; gap: 10px; align-items: center; }
  .hist-btn {
    padding: 10px 20px;
    border-radius: 100px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all .18s;
    border: none;
  }
  .hist-btn-primary { background: #44bbff; color: #000; box-shadow: 0 4px 18px rgba(68,187,255,0.25); }
  .hist-btn-primary:hover { background: #74d0ff; transform: translateY(-1px); }
  .hist-btn-ghost { background: transparent; color: rgba(155,210,248,0.55); border: 1px solid rgba(68,187,255,0.15); }
  .hist-btn-ghost:hover { color: rgba(155,210,248,0.85); border-color: rgba(68,187,255,0.30); }

  .hist-body { padding: 40px 7vw 100px; }

  .hist-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 52px;
    letter-spacing: 3px;
    color: #ede3c0;
    margin-bottom: 8px;
    line-height: 1;
  }
  .hist-subtitle {
    font-size: 15px;
    color: rgba(155,210,248,0.55);
    font-style: italic;
    font-weight: 300;
    margin-bottom: 36px;
  }

  .hist-empty {
    text-align: center;
    padding: 80px 20px;
    color: rgba(155,210,248,0.35);
  }
  .hist-empty-icon { font-size: 48px; margin-bottom: 16px; }
  .hist-empty-text { font-size: 16px; font-weight: 500; margin-bottom: 8px; color: rgba(155,210,248,0.55); }
  .hist-empty-sub  { font-size: 14px; }

  .hist-list { display: flex; flex-direction: column; gap: 14px; }

  .hist-card {
    background: rgba(5,14,28,0.80);
    border: 1px solid rgba(68,187,255,0.13);
    border-radius: 18px;
    padding: 22px 24px;
    transition: border-color .18s, box-shadow .18s;
    position: relative;
    overflow: hidden;
  }
  .hist-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(68,187,255,0.04) 0%, transparent 60%);
    opacity: 0;
    transition: opacity .2s;
  }
  .hist-card:hover { border-color: rgba(68,187,255,0.25); box-shadow: 0 8px 32px rgba(0,0,0,0.45); }
  .hist-card:hover::before { opacity: 1; }

  .hist-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }
  .hist-card-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 26px;
    letter-spacing: 1.5px;
    color: #ede3c0;
    line-height: 1.1;
    flex: 1;
  }
  .hist-card-meta {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    align-items: center;
  }
  .hist-pill {
    padding: 4px 12px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .hist-pill-scene { background: rgba(68,187,255,0.12); color: #74d0ff; border: 1px solid rgba(68,187,255,0.20); }

  .hist-card-date {
    font-size: 11px;
    color: rgba(155,210,248,0.35);
    font-weight: 500;
    margin-bottom: 14px;
    letter-spacing: 0.02em;
  }

  .hist-card-preview {
    font-size: 12px;
    color: rgba(155,210,248,0.45);
    line-height: 1.8;
    white-space: pre-wrap;
    max-height: 72px;
    overflow: hidden;
    mask-image: linear-gradient(180deg, #000 50%, transparent 100%);
    margin-bottom: 18px;
    font-family: 'DM Mono', 'Courier New', monospace;
  }

  .hist-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .hist-action {
    padding: 9px 18px;
    border-radius: 100px;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all .18s;
    border: none;
  }
  .hist-action-load { background: #44bbff; color: #000; box-shadow: 0 4px 16px rgba(68,187,255,0.22); }
  .hist-action-load:hover { background: #74d0ff; transform: translateY(-1px); }
  .hist-action-copy { background: transparent; color: #74d0ff; border: 1px solid rgba(68,187,255,0.22); }
  .hist-action-copy:hover { background: rgba(68,187,255,0.10); }
  .hist-action-copy.copied { color: #3ecf6e; border-color: rgba(62,207,110,0.28); background: rgba(62,207,110,0.08); }
  .hist-action-delete { background: transparent; color: rgba(155,210,248,0.35); border: 1px solid rgba(68,187,255,0.09); margin-left: auto; }
  .hist-action-delete:hover { color: #ff9999; border-color: rgba(255,80,80,0.22); background: rgba(255,80,80,0.06); }

  .hist-user-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: rgba(155,210,248,0.55);
    font-weight: 600;
  }
  .hist-user-dot {
    width: 8px; height: 8px;
    background: #3ecf6e;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(62,207,110,0.7);
  }
`;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
}

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser]       = useState<User | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPrompts = useCallback(async () => {
    const res = await fetch("/api/prompts");
    if (res.ok) setPrompts(await res.json());
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth"); return; }
      setUser(user);
      fetchPrompts().finally(() => setLoading(false));
    });
  }, [router, fetchPrompts]);

  const handleLoad = (prompt: Prompt) => {
    if (!prompt.scenes_json) { router.push("/"); return; }
    const encoded = btoa(JSON.stringify({ ...prompt.scenes_json, stage: 6 }));
    router.push(`/?p=${encoded}`);
  };

  const handleCopy = (prompt: Prompt) => {
    navigator.clipboard.writeText(prompt.prompt_text);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    setPrompts(p => p.filter(x => x.id !== id));
    await fetch(`/api/prompts?id=${id}`, { method: "DELETE" });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <style>{css}</style>
      <div className="hist-page">
        <div className="hist-header">
          <div className="hist-logo" onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
            <span className="hist-logo-scene">SCENE</span>
            <span className="hist-logo-bloc">BLOC</span>
          </div>
          <div className="hist-header-actions">
            {user && (
              <div className="hist-user-badge">
                <div className="hist-user-dot" />
                {user.email}
              </div>
            )}
            <button className="hist-btn hist-btn-ghost" onClick={() => router.push("/profile")}>Profile</button>
            <button className="hist-btn hist-btn-primary" onClick={() => router.push("/")}>+ Build New</button>
            <button className="hist-btn hist-btn-ghost" onClick={handleSignOut}>Sign Out</button>
          </div>
        </div>

        <div className="hist-body">
          <div className="hist-title">PROMPT HISTORY</div>
          <div className="hist-subtitle">
            {loading ? "Loading…" : `${prompts.length} saved prompt${prompts.length !== 1 ? "s" : ""}`}
          </div>

          {!loading && prompts.length === 0 && (
            <div className="hist-empty">
              <div className="hist-empty-icon">📂</div>
              <div className="hist-empty-text">No saved prompts yet</div>
              <div className="hist-empty-sub">Build a prompt and save it to your account.</div>
            </div>
          )}

          <div className="hist-list">
            {prompts.map(p => (
              <div key={p.id} className="hist-card">
                <div className="hist-card-top">
                  <div className="hist-card-title">{p.title || "Untitled Prompt"}</div>
                  <div className="hist-card-meta">
                    <div className="hist-pill hist-pill-scene">
                      {p.scene_count} {p.scene_count === 1 ? "Scene" : "Scenes"}
                    </div>
                  </div>
                </div>
                <div className="hist-card-date">{formatDate(p.created_at)}</div>
                <div className="hist-card-preview">{p.prompt_text}</div>
                <div className="hist-card-actions">
                  <button className="hist-action hist-action-load" onClick={() => handleLoad(p)}>
                    Load in Builder
                  </button>
                  <button
                    className={`hist-action hist-action-copy${copiedId === p.id ? " copied" : ""}`}
                    onClick={() => handleCopy(p)}
                  >
                    {copiedId === p.id ? "✓ Copied" : "Copy"}
                  </button>
                  <button className="hist-action hist-action-delete" onClick={() => handleDelete(p.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
