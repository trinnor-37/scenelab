"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,300&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .auth-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    font-family: 'DM Sans', sans-serif;
  }

  .auth-logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 32px;
    letter-spacing: 5px;
    margin-bottom: 40px;
    text-align: center;
  }
  .auth-logo-scene { color: #ede3c0; }
  .auth-logo-bloc  {
    color: #44bbff;
    text-shadow: 0 0 40px rgba(68,187,255,0.55);
  }

  .auth-card {
    width: 100%;
    max-width: 420px;
    background: rgba(5,14,28,0.85);
    border: 1px solid rgba(68,187,255,0.14);
    border-radius: 22px;
    padding: 36px 32px;
    backdrop-filter: blur(24px);
    box-shadow: 0 24px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(68,187,255,0.06);
  }

  .auth-tabs {
    display: flex;
    background: rgba(68,187,255,0.06);
    border: 1px solid rgba(68,187,255,0.12);
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 32px;
    gap: 4px;
  }
  .auth-tab {
    flex: 1;
    padding: 11px;
    background: transparent;
    border: none;
    border-radius: 9px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(155,210,248,0.50);
    cursor: pointer;
    transition: all .18s;
  }
  .auth-tab.active {
    background: rgba(68,187,255,0.14);
    color: #74d0ff;
    box-shadow: 0 2px 12px rgba(68,187,255,0.15);
  }

  .auth-heading {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 40px;
    letter-spacing: 2.5px;
    color: #ede3c0;
    margin-bottom: 8px;
    line-height: 1;
  }
  .auth-sub {
    font-size: 14px;
    color: rgba(155,210,248,0.55);
    margin-bottom: 28px;
    font-style: italic;
    font-weight: 300;
  }

  .auth-field { margin-bottom: 18px; }
  .auth-label {
    display: block;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: rgba(155,210,248,0.60);
    margin-bottom: 9px;
  }
  .auth-input {
    width: 100%;
    background: rgba(8,20,33,0.90);
    border: 1px solid rgba(68,187,255,0.13);
    border-radius: 13px;
    padding: 16px 18px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: #eef5ff;
    outline: none;
    transition: border-color .18s, box-shadow .18s;
  }
  .auth-input:focus {
    border-color: rgba(68,187,255,0.40);
    box-shadow: 0 0 0 3px rgba(68,187,255,0.08);
  }
  .auth-input::placeholder { color: rgba(155,210,248,0.28); }

  .auth-error {
    background: rgba(255,80,80,0.10);
    border: 1px solid rgba(255,80,80,0.22);
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 13px;
    color: #ff9999;
    margin-bottom: 18px;
    line-height: 1.5;
  }

  .auth-submit {
    width: 100%;
    padding: 18px;
    background: #44bbff;
    border: none;
    border-radius: 14px;
    color: #000;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all .22s;
    box-shadow: 0 8px 28px rgba(68,187,255,0.28);
    margin-top: 4px;
  }
  .auth-submit:hover:not(:disabled) {
    background: #74d0ff;
    transform: translateY(-2px);
    box-shadow: 0 14px 40px rgba(68,187,255,0.40);
  }
  .auth-submit:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

  .auth-success {
    background: rgba(62,207,110,0.12);
    border: 1px solid rgba(62,207,110,0.28);
    border-radius: 10px;
    padding: 14px 16px;
    font-size: 13px;
    color: #3ecf6e;
    margin-top: 18px;
    text-align: center;
    line-height: 1.6;
  }

  .auth-back {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 28px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(155,210,248,0.45);
    text-decoration: none;
    cursor: pointer;
    background: none;
    border: none;
    transition: color .15s;
    letter-spacing: 0.02em;
  }
  .auth-back:hover { color: rgba(155,210,248,0.80); }

  .auth-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(68,187,255,0.12) 40%, rgba(68,187,255,0.12) 60%, transparent);
    margin: 24px 0;
  }
`;

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab]       = useState<"signin"|"signup">("signin");
  const [email, setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      if (tab === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return; }
        router.push("/");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) { setError(error.message); return; }
        setSuccess("Account created! Check your email to confirm, then sign in.");
        setTab("signin");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="auth-page">
        <div className="auth-logo">
          <span className="auth-logo-scene">SCENE</span>
          <span className="auth-logo-bloc">BLOC</span>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab${tab==="signin"?" active":""}`} onClick={()=>{setTab("signin");setError("");setSuccess("");}}>Sign In</button>
            <button className={`auth-tab${tab==="signup"?" active":""}`} onClick={()=>{setTab("signup");setError("");setSuccess("");}}>Sign Up</button>
          </div>

          <div className="auth-heading">{tab==="signin"?"WELCOME BACK":"CREATE ACCOUNT"}</div>
          <div className="auth-sub">{tab==="signin"?"Access your saved prompts and history.":"Free account — save and share prompts."}</div>

          <form onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                placeholder={tab==="signup"?"Minimum 6 characters":"••••••••"}
                value={password}
                onChange={e=>setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={tab==="signin"?"current-password":"new-password"}
              />
            </div>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading?(tab==="signin"?"Signing In…":"Creating Account…"):(tab==="signin"?"Sign In →":"Create Account →")}
            </button>
          </form>

          {success && <div className="auth-success">{success}</div>}

          <div className="auth-divider"/>

          <button className="auth-back" onClick={()=>router.push("/")}>
            ← Back to SceneBloc
          </button>
        </div>
      </div>
    </>
  );
}
