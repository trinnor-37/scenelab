"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,100;0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,300;1,9..40,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #020810;
    --surface: #050e1c;
    --surface2: #081421;
    --surface3: #0c1c2e;
    --border: rgba(68,187,255,0.07);
    --border2: rgba(68,187,255,0.13);
    --border3: rgba(68,187,255,0.26);
    --text: #eef5ff;
    --cream: #ede3c0;
    --muted: rgba(155,210,248,0.30);
    --muted2: rgba(155,210,248,0.60);
    --blue: #44bbff;
    --blue-bright: #74d0ff;
    --blue-dim: rgba(68,187,255,0.10);
    --blue-glow: rgba(68,187,255,0.07);
    --green: #3ecf6e;
    --green-dim: rgba(62,207,110,0.10);
    --radius: 20px;
    --radius-sm: 14px;
  }

  .app {
    min-height: 100vh;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    position: relative;
    z-index: 2;
  }

  /* ── HERO ── */
  .hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 7vw 110px;
    text-align: center;
    position: relative;
    z-index: 2;
  }

  .hero-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 6px;
    text-transform: uppercase;
    color: var(--blue);
    margin-bottom: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    opacity: 0.78;
    animation: heroFadeUp 1s ease both;
    animation-delay: 0.1s;
  }
  .hero-eyebrow::before, .hero-eyebrow::after {
    content: '';
    width: 48px;
    height: 1px;
  }
  .hero-eyebrow::before { background: linear-gradient(90deg, transparent, rgba(68,187,255,0.55)); }
  .hero-eyebrow::after  { background: linear-gradient(90deg, rgba(68,187,255,0.55), transparent); }

  .hero-logo {
    font-family: 'Bebas Neue', sans-serif;
    line-height: 0.88;
    margin-bottom: 34px;
    overflow: hidden;
  }
  .hero-logo-scene {
    font-size: clamp(84px, 20vw, 168px);
    letter-spacing: 16px;
    color: var(--cream);
    display: block;
    text-shadow: 0 2px 40px rgba(237,227,192,0.07);
    animation: logoSlideDown 0.9s cubic-bezier(0.16,1,0.3,1) both;
    animation-delay: 0.25s;
  }
  .hero-logo-bloc {
    font-size: clamp(84px, 20vw, 168px);
    letter-spacing: 16px;
    color: var(--blue);
    display: block;
    text-shadow: 0 0 90px rgba(68,187,255,0.65), 0 0 180px rgba(68,187,255,0.22);
    animation: logoSlideUp 0.9s cubic-bezier(0.16,1,0.3,1) both;
    animation-delay: 0.35s;
  }

  @keyframes logoSlideDown {
    from { opacity: 0; transform: translateY(-40px) scaleY(1.1); letter-spacing: 40px; }
    to   { opacity: 1; transform: translateY(0) scaleY(1); letter-spacing: 16px; }
  }
  @keyframes logoSlideUp {
    from { opacity: 0; transform: translateY(40px) scaleY(1.1); letter-spacing: 40px; }
    to   { opacity: 1; transform: translateY(0) scaleY(1); letter-spacing: 16px; }
  }

  .hero-tagline {
    font-size: clamp(22px, 5vw, 38px);
    color: var(--blue-bright);
    font-weight: 800;
    font-style: normal;
    line-height: 1.2;
    max-width: 560px;
    margin: 0 auto 56px;
    letter-spacing: 0.18em;
    animation: heroFadeUp 1s ease both;
    animation-delay: 0.6s;
  }

  .hero-features {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 60px;
    animation: heroFadeUp 1s ease both;
    animation-delay: 0.75s;
  }
  .hero-feat {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 11px 22px;
    background: rgba(5,14,28,0.72);
    border: 1px solid var(--border2);
    border-radius: 100px;
    font-size: 13px;
    font-weight: 600;
    color: var(--muted2);
    letter-spacing: 0.03em;
    backdrop-filter: blur(14px);
  }
  .hero-feat-dot {
    width: 5px;
    height: 5px;
    background: var(--blue);
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(68,187,255,0.9);
    flex-shrink: 0;
  }

  .hero-cta {
    padding: 24px 68px;
    background: var(--blue);
    border: none;
    border-radius: var(--radius);
    color: #000;
    font-family: 'DM Sans', sans-serif;
    font-size: 17px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.25s;
    box-shadow: 0 0 56px rgba(68,187,255,0.32), 0 22px 60px rgba(0,0,0,0.65);
    animation: heroFadeUp 1s ease both;
    animation-delay: 0.90s;
  }
  .hero-cta:hover {
    background: var(--blue-bright);
    transform: translateY(-3px);
    box-shadow: 0 0 88px rgba(68,187,255,0.52), 0 30px 76px rgba(0,0,0,0.72);
  }
  .hero-cta:active { transform: translateY(-1px); }

  .hero-scroll {
    position: absolute;
    bottom: 44px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    animation: heroFloat 3.2s ease infinite, heroFadeUp 1s ease both;
    animation-delay: 0s, 1.2s;
  }
  .hero-scroll-line {
    width: 1px;
    height: 48px;
    background: linear-gradient(180deg, rgba(68,187,255,0.65), transparent);
  }
  .hero-scroll-text {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 3.5px;
    text-transform: uppercase;
    color: var(--muted);
  }

  @keyframes heroFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes heroFloat {
    0%,100% { transform: translateX(-50%) translateY(0); opacity: 0.38; }
    50%      { transform: translateX(-50%) translateY(-11px); opacity: 1; }
  }

  /* ── HEADER ── */
  .header {
    padding: 22px 7vw 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border2);
    position: sticky;
    top: 0;
    background: rgba(2,8,16,0.92);
    backdrop-filter: blur(32px);
    z-index: 20;
  }

  .logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 30px;
    letter-spacing: 5px;
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .logo-scene { color: var(--cream); }
  .logo-bloc {
    color: var(--blue);
    text-shadow: 0 0 28px rgba(68,187,255,0.55), 0 0 60px rgba(68,187,255,0.18);
  }

  .stage-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(68,187,255,0.08);
    border: 1px solid rgba(68,187,255,0.18);
    border-radius: 100px;
    padding: 8px 18px;
    font-size: 10px;
    font-weight: 700;
    color: var(--blue-bright);
    letter-spacing: 0.10em;
    text-transform: uppercase;
  }
  .dot {
    width: 6px; height: 6px;
    background: var(--blue);
    border-radius: 50%;
    animation: pulse 2s ease infinite;
    box-shadow: 0 0 8px var(--blue);
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.28;transform:scale(.58);} }

  /* ── PROGRESS ── */
  .progress-wrap {
    padding: 22px 7vw 0;
    display: flex;
    gap: 6px;
  }
  .prog-bar {
    flex: 1;
    height: 3px;
    background: rgba(68,187,255,0.07);
    border-radius: 100px;
    transition: background .35s;
    cursor: pointer;
  }
  .prog-bar.done   { background: var(--blue); box-shadow: 0 0 10px rgba(68,187,255,0.50); }
  .prog-bar.active { background: rgba(68,187,255,0.38); }

  .prog-labels {
    display: flex;
    padding: 8px 7vw 0;
    gap: 6px;
  }
  .prog-lbl {
    flex: 1;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--muted);
    text-align: center;
    transition: color .3s;
    cursor: pointer;
  }
  .prog-lbl.active { color: var(--blue-bright); }
  .prog-lbl.done   { color: var(--muted2); }

  /* ── SCENE BAR ── */
  .scene-bar {
    display: flex;
    gap: 8px;
    padding: 18px 7vw 0;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .scene-bar::-webkit-scrollbar { display: none; }
  .scene-tab {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 18px;
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 100px;
    font-size: 12px;
    font-weight: 600;
    color: var(--muted2);
    cursor: pointer;
    white-space: nowrap;
    transition: all .15s;
    flex-shrink: 0;
  }
  .scene-tab.active {
    background: var(--blue-dim);
    border-color: rgba(68,187,255,0.35);
    color: var(--blue-bright);
  }
  .scene-tab .scene-dot { width: 5px; height: 5px; background: var(--blue); border-radius: 50%; }
  .add-scene-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 18px;
    background: transparent;
    border: 1px dashed rgba(68,187,255,0.18);
    border-radius: 100px;
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    cursor: pointer;
    white-space: nowrap;
    transition: all .15s;
    flex-shrink: 0;
  }
  .add-scene-btn:hover { border-color: var(--blue); color: var(--blue-bright); }

  /* ── LOCKED BANNER ── */
  .locked-banner {
    background: var(--green-dim);
    border: 1px solid rgba(62,207,110,0.16);
    border-radius: var(--radius-sm);
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 26px;
  }
  .locked-banner-icon { font-size: 15px; }
  .locked-banner-text { font-size: 13px; color: var(--green); font-weight: 600; line-height: 1.5; }
  .locked-banner-text span { color: rgba(62,207,110,0.50); font-weight: 400; }

  /* ── CONTENT ── */
  .content { padding: 42px 7vw 160px; }

  .stage-num {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3.5px;
    text-transform: uppercase;
    color: var(--blue);
    margin-bottom: 12px;
    opacity: 0.70;
  }
  .stage-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 68px;
    letter-spacing: 3px;
    line-height: 0.92;
    margin-bottom: 16px;
    color: var(--cream);
    text-shadow: 0 2px 32px rgba(237,227,192,0.05);
  }
  .stage-desc {
    font-size: 16px;
    color: var(--muted2);
    line-height: 1.70;
    font-style: italic;
    font-weight: 300;
    margin-bottom: 40px;
    letter-spacing: 0.01em;
  }

  /* ── FIELD ── */
  .field { margin-bottom: 32px; }
  .field-lbl {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--muted2);
    margin-bottom: 13px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .field-lbl::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  /* ── SELECT ── */
  .sel-wrap { position: relative; }
  .sel-btn {
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: var(--radius-sm);
    padding: 20px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all .18s;
    text-align: left;
  }
  .sel-btn:hover {
    border-color: var(--border3);
    background: var(--surface2);
    box-shadow: 0 0 0 3px rgba(68,187,255,0.05), 0 8px 28px rgba(0,0,0,0.45);
  }
  .sel-btn.open {
    border-color: rgba(68,187,255,0.32);
    background: var(--surface2);
    box-shadow: 0 0 0 3px rgba(68,187,255,0.06), 0 8px 28px rgba(0,0,0,0.45);
  }
  .sel-val { font-size: 16px; font-weight: 500; color: var(--text); }
  .sel-ph  { color: var(--muted); font-weight: 400; }
  .sel-arr { color: var(--muted); font-size: 10px; transition: transform .2s; flex-shrink: 0; margin-left: 10px; }
  .sel-arr.open { transform: rotate(180deg); }

  .dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0; right: 0;
    background: #05111f;
    border: 1px solid var(--border3);
    border-radius: var(--radius-sm);
    overflow: hidden;
    z-index: 50;
    box-shadow: 0 20px 60px rgba(0,0,0,.92), 0 0 0 1px rgba(68,187,255,0.04);
    animation: dropIn .13s ease;
    max-height: 300px;
    overflow-y: auto;
  }
  @keyframes dropIn { from{opacity:0;transform:translateY(-8px);} to{opacity:1;transform:translateY(0);} }
  .dd-item {
    padding: 14px 22px;
    font-size: 14px;
    cursor: pointer;
    transition: background .1s;
    color: var(--muted2);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 500;
  }
  .dd-item:last-child { border-bottom: none; }
  .dd-item:hover { background: var(--blue-glow); color: var(--text); }
  .dd-item.sel  { background: var(--blue-dim); color: var(--blue-bright); font-weight: 600; }
  .dd-divider   { height: 1px; background: var(--border2); }
  .dd-custom-item {
    padding: 14px 22px;
    font-size: 12px;
    cursor: pointer;
    color: var(--blue-bright);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background .1s;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .dd-custom-item:hover { background: var(--blue-glow); }

  .custom-input-wrap { margin-top: 9px; position: relative; }
  .custom-input {
    width: 100%;
    background: var(--surface2);
    border: 1px solid rgba(68,187,255,0.28);
    border-radius: var(--radius-sm);
    padding: 16px 22px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: var(--text);
    outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  .custom-input:focus {
    border-color: rgba(68,187,255,0.55);
    box-shadow: 0 0 0 3px rgba(68,187,255,0.07), 0 6px 24px rgba(0,0,0,0.40);
  }
  .custom-input::placeholder { color: var(--muted); }
  .custom-clear {
    position: absolute;
    right: 16px; top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--muted);
    font-size: 13px;
    cursor: pointer;
    padding: 4px 8px;
    transition: color .15s;
  }
  .custom-clear:hover { color: var(--text); }

  .txt-input {
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: var(--radius-sm);
    padding: 20px 24px;
    font-family: 'DM Sans', sans-serif;
    font-size: 16px;
    color: var(--text);
    outline: none;
    transition: all .18s;
  }
  .txt-input:focus {
    border-color: rgba(68,187,255,0.35);
    box-shadow: 0 0 0 3px rgba(68,187,255,0.07), 0 8px 28px rgba(0,0,0,0.40);
  }
  .txt-input::placeholder { color: var(--muted); }
  .hint { font-size: 12px; color: var(--muted); margin-top: 10px; line-height: 1.72; }

  .locked-field {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 18px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .locked-field-val { font-size: 15px; font-weight: 500; color: var(--muted2); }

  /* ── REF MODE ── */
  .ref-mode-grid {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 10px;
    margin-bottom: 28px;
  }
  .ref-mode-card {
    padding: 26px 12px 22px;
    background: var(--surface);
    border: 1.5px solid var(--border2);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all .20s;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .ref-mode-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(140deg, rgba(68,187,255,0.06) 0%, transparent 55%);
    opacity: 0;
    transition: opacity .2s;
  }
  .ref-mode-card:hover {
    border-color: rgba(68,187,255,0.28);
    background: var(--surface2);
    transform: translateY(-2px);
    box-shadow: 0 14px 40px rgba(0,0,0,0.55);
  }
  .ref-mode-card:hover::after { opacity: 1; }
  .ref-mode-card.active {
    background: var(--blue-dim);
    border-color: rgba(68,187,255,0.45);
    box-shadow: 0 0 32px rgba(68,187,255,0.12), 0 14px 40px rgba(0,0,0,0.55);
    transform: translateY(-2px);
  }
  .ref-mode-card.active::after { opacity: 1; }
  .ref-mode-icon  { font-size: 22px; margin-bottom: 12px; }
  .ref-mode-label {
    font-size: 10px;
    font-weight: 800;
    color: var(--text);
    line-height: 1.3;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .ref-mode-card.active .ref-mode-label { color: var(--blue-bright); }
  .ref-mode-sub { font-size: 10px; color: var(--muted); margin-top: 6px; line-height: 1.3; }

  /* ── MOODBOARD ── */
  .moodboard-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 13px; }
  .moodboard-count {
    font-size: 11px;
    font-weight: 700;
    color: var(--blue-bright);
    background: var(--blue-dim);
    border: 1px solid rgba(68,187,255,0.18);
    border-radius: 100px;
    padding: 4px 14px;
    letter-spacing: 0.05em;
  }
  .moodboard-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
  .mb-slot {
    aspect-ratio: 1;
    background: var(--surface);
    border: 1.5px dashed var(--border2);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all .15s;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 6px;
  }
  .mb-slot:hover { border-color: rgba(68,187,255,0.38); background: var(--surface2); }
  .mb-slot.filled { border-style: solid; border-color: rgba(68,187,255,0.28); }
  .mb-slot img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .mb-slot-icon { font-size: 20px; color: var(--muted); }
  .mb-slot-num  { font-size: 9px; font-weight: 700; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; }
  .mb-remove {
    position: absolute;
    top: 6px; right: 6px;
    background: rgba(2,8,16,.90);
    border: none;
    border-radius: 50%;
    width: 24px; height: 24px;
    color: #fff;
    font-size: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    transition: background .15s;
  }
  .mb-remove:hover { background: rgba(200,0,0,.85); }
  .mb-add {
    aspect-ratio: 1;
    background: transparent;
    border: 1.5px dashed rgba(68,187,255,0.16);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all .18s;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 7px;
  }
  .mb-add:hover { border-color: var(--blue); background: var(--blue-glow); transform: scale(1.02); }
  .mb-add span { font-size: 22px; color: var(--muted); }
  .mb-add p { font-size: 9px; color: var(--muted); font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }

  /* ── UPLOAD ── */
  .upload-row.two { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; margin-top: 4px; }
  .upload-zone {
    background: var(--surface);
    border: 1.5px dashed var(--border2);
    border-radius: var(--radius);
    padding: 28px 14px;
    text-align: center;
    cursor: pointer;
    transition: all .20s;
    position: relative;
    overflow: hidden;
  }
  .upload-zone:hover { border-color: rgba(68,187,255,0.38); background: var(--surface2); }
  .upload-zone.has-img { border-style: solid; border-color: rgba(68,187,255,0.28); padding: 0; }
  .upload-zone img { width: 100%; height: 150px; object-fit: cover; display: block; border-radius: calc(var(--radius) - 2px); }
  .upload-zone-icon  { font-size: 24px; margin-bottom: 9px; }
  .upload-zone-label { font-size: 10px; font-weight: 800; color: var(--muted2); letter-spacing: 0.08em; text-transform: uppercase; }
  .upload-zone-sub   { font-size: 11px; color: var(--muted); margin-top: 5px; }
  .upload-remove {
    position: absolute;
    top: 8px; right: 8px;
    background: rgba(2,8,16,.90);
    border: none;
    border-radius: 50%;
    width: 26px; height: 26px;
    color: #fff;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ── NAV ── */
  .nav-row { display: flex; gap: 12px; margin-top: 40px; }
  .btn-back {
    flex: 1;
    padding: 20px;
    background: transparent;
    border: 1px solid var(--border2);
    border-radius: var(--radius);
    color: var(--muted2);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all .18s;
    letter-spacing: 0.03em;
  }
  .btn-back:hover { color: var(--text); border-color: var(--border3); background: rgba(68,187,255,0.04); }
  .btn-next {
    flex: 2;
    padding: 20px;
    background: var(--blue);
    border: none;
    border-radius: var(--radius);
    color: #000;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    transition: all .22s;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    box-shadow: 0 8px 32px rgba(68,187,255,0.24);
  }
  .btn-next:hover {
    background: var(--blue-bright);
    transform: translateY(-2px);
    box-shadow: 0 14px 44px rgba(68,187,255,0.40);
  }
  .btn-next:disabled { opacity: .18; cursor: not-allowed; transform: none; box-shadow: none; }

  /* ── PREVIEW ── */
  .preview-card {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: var(--radius);
    overflow: hidden;
    margin-bottom: 16px;
    box-shadow: 0 0 52px rgba(68,187,255,0.04), 0 24px 64px rgba(0,0,0,0.55);
  }
  .preview-hd {
    padding: 16px 22px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--surface2);
  }
  .preview-title {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 3.5px;
    text-transform: uppercase;
    color: var(--blue-bright);
    opacity: 0.70;
  }
  .copy-btn {
    background: var(--blue-dim);
    border: 1px solid rgba(68,187,255,0.22);
    border-radius: 10px;
    padding: 8px 18px;
    color: var(--blue-bright);
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    transition: all .2s;
    letter-spacing: 0.10em;
    text-transform: uppercase;
  }
  .copy-btn:hover {
    background: var(--blue);
    color: #000;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(68,187,255,0.36);
  }
  .copy-btn.copied {
    background: rgba(62,207,110,0.12);
    border-color: rgba(62,207,110,0.28);
    color: var(--green);
  }
  .preview-body {
    padding: 22px;
    font-size: 12px;
    line-height: 2.1;
    color: var(--muted2);
    white-space: pre-wrap;
    max-height: 280px;
    overflow-y: auto;
    font-family: 'DM Mono', 'Courier New', monospace;
    letter-spacing: 0.01em;
  }

  .scene-preview-tabs { display: flex; gap: 7px; margin-bottom: 16px; flex-wrap: wrap; }
  .sp-tab {
    padding: 8px 16px;
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: 100px;
    font-size: 10px;
    font-weight: 700;
    color: var(--muted2);
    cursor: pointer;
    transition: all .15s;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .sp-tab.active {
    background: var(--blue-dim);
    border-color: rgba(68,187,255,0.30);
    color: var(--blue-bright);
  }

  .copy-all-btn {
    width: 100%;
    padding: 21px;
    background: var(--blue);
    border: none;
    border-radius: var(--radius);
    color: #000;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    transition: all .22s;
    margin-bottom: 11px;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    box-shadow: 0 8px 32px rgba(68,187,255,0.24);
  }
  .copy-all-btn:hover {
    background: var(--blue-bright);
    transform: translateY(-2px);
    box-shadow: 0 14px 48px rgba(68,187,255,0.42);
  }
  .copy-all-btn.copied {
    background: rgba(62,207,110,0.14);
    border: 1px solid rgba(62,207,110,0.32);
    color: var(--green);
  }

  /* ── DONE ── */
  .done-icon {
    width: 78px; height: 78px;
    background: var(--blue-dim);
    border: 1px solid rgba(68,187,255,0.22);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    font-size: 28px;
    box-shadow: 0 0 52px rgba(68,187,255,0.22), 0 0 100px rgba(68,187,255,0.08);
  }
  .done-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 46px;
    letter-spacing: 3.5px;
    text-align: center;
    margin-bottom: 14px;
    color: var(--cream);
  }
  .done-sub {
    font-size: 15px;
    color: var(--muted2);
    text-align: center;
    line-height: 1.72;
    margin-bottom: 32px;
    font-style: italic;
    font-weight: 300;
  }

  .btn-full {
    width: 100%;
    padding: 20px;
    background: var(--blue);
    border: none;
    border-radius: var(--radius);
    color: #000;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    transition: all .22s;
    margin-bottom: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    box-shadow: 0 8px 32px rgba(68,187,255,0.24);
  }
  .btn-full:hover { background: var(--blue-bright); box-shadow: 0 14px 44px rgba(68,187,255,0.40); transform: translateY(-1px); }

  .btn-outline {
    width: 100%;
    padding: 17px;
    background: transparent;
    border: 1px solid var(--border2);
    border-radius: var(--radius);
    color: var(--muted2);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 11px;
    transition: all .18s;
    letter-spacing: 0.03em;
  }
  .btn-outline:hover { color: var(--text); border-color: var(--border3); background: rgba(68,187,255,0.04); }

  .section-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border2) 30%, var(--border2) 70%, transparent);
    margin: 30px 0;
  }

  /* ── AUTH HEADER ELEMENTS ── */
  .auth-header-btn {
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
    color: var(--blue-bright);
    cursor: pointer;
    transition: all .18s;
    text-decoration: none;
  }
  .auth-header-btn:hover { background: var(--blue-dim); border-color: rgba(68,187,255,0.35); }
  .auth-user-dot {
    width: 7px; height: 7px;
    background: #3ecf6e;
    border-radius: 50%;
    box-shadow: 0 0 7px rgba(62,207,110,0.8);
    flex-shrink: 0;
  }
  .header-right { display: flex; align-items: center; gap: 8px; }

  /* ── WATERMARK BADGE ── */
  .watermark-note {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 16px;
    background: rgba(255,180,0,0.06);
    border: 1px solid rgba(255,180,0,0.16);
    border-radius: 12px;
    font-size: 12px;
    color: rgba(255,200,80,0.75);
    font-weight: 600;
    margin-bottom: 16px;
    letter-spacing: 0.02em;
  }

  /* ── SAVE BUTTON ── */
  .save-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    width: 100%;
    padding: 17px;
    background: transparent;
    border: 1px solid rgba(62,207,110,0.25);
    border-radius: var(--radius);
    color: #3ecf6e;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    margin-bottom: 11px;
    transition: all .20s;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .save-btn:hover:not(:disabled) { background: rgba(62,207,110,0.08); border-color: rgba(62,207,110,0.40); transform: translateY(-1px); }
  .save-btn:disabled { opacity: 0.50; cursor: not-allowed; }
  .save-btn.saved { border-color: rgba(62,207,110,0.40); background: rgba(62,207,110,0.10); }

  /* ── SHARE BUTTON ── */
  .share-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    width: 100%;
    padding: 17px;
    background: transparent;
    border: 1px solid rgba(68,187,255,0.22);
    border-radius: var(--radius);
    color: var(--blue-bright);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    margin-bottom: 11px;
    transition: all .20s;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .share-btn:hover { background: var(--blue-dim); border-color: rgba(68,187,255,0.40); transform: translateY(-1px); }
  .share-btn.shared { border-color: rgba(62,207,110,0.35); color: var(--green); background: rgba(62,207,110,0.08); }

  /* ── FLOATING COPY BAR ── */
  .float-copy-bar {
    position: fixed;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    display: flex;
    gap: 10px;
    background: rgba(5,14,28,0.92);
    border: 1px solid var(--border3);
    border-radius: 100px;
    padding: 10px 10px 10px 22px;
    align-items: center;
    backdrop-filter: blur(24px);
    box-shadow: 0 16px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(68,187,255,0.08);
    animation: floatIn .3s ease both;
    white-space: nowrap;
  }
  @keyframes floatIn { from{opacity:0;transform:translateX(-50%) translateY(16px);} to{opacity:1;transform:translateX(-50%) translateY(0);} }
  .float-copy-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--muted2);
    letter-spacing: 0.02em;
  }
  .float-copy-btn {
    padding: 11px 26px;
    background: var(--blue);
    border: none;
    border-radius: 100px;
    color: #000;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    transition: all .2s;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    box-shadow: 0 4px 20px rgba(68,187,255,0.35);
  }
  .float-copy-btn:hover { background: var(--blue-bright); transform: scale(1.04); }
  .float-copy-btn.copied { background: var(--green); }

  /* ── SECTION GROUP ── */
  .section-label {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--blue);
    margin: 36px 0 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    opacity: 0.70;
  }
  .section-label::before, .section-label::after { content:''; flex:1; height:1px; background: var(--border); }

  @keyframes fadeUp { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
  .fade-in { animation: fadeUp .30s ease; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }

  /* ── HERO ACCOUNT BUTTON ── */
  .hero-account {
    position: fixed;
    top: 24px;
    right: 32px;
    z-index: 100;
  }

  .hero-signin-btn {
    padding: 10px 22px;
    background: transparent;
    border: 1px solid rgba(68,187,255,0.28);
    border-radius: 100px;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: #74d0ff;
    cursor: pointer;
    transition: all .18s;
    backdrop-filter: blur(14px);
    background: rgba(2,8,16,0.55);
  }
  .hero-signin-btn:hover {
    background: rgba(68,187,255,0.10);
    border-color: rgba(68,187,255,0.50);
    transform: translateY(-1px);
  }

  .hero-avatar-btn {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(68,187,255,0.22) 0%, rgba(120,80,255,0.18) 100%);
    border: 1.5px solid rgba(68,187,255,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 15px;
    letter-spacing: 1px;
    color: #74d0ff;
    cursor: pointer;
    transition: all .18s;
    box-shadow: 0 0 18px rgba(68,187,255,0.20), 0 4px 16px rgba(0,0,0,0.55);
    backdrop-filter: blur(14px);
    position: relative;
  }
  .hero-avatar-btn:hover {
    border-color: rgba(68,187,255,0.65);
    box-shadow: 0 0 28px rgba(68,187,255,0.35), 0 6px 22px rgba(0,0,0,0.65);
    transform: translateY(-1px);
  }
  .hero-avatar-dot {
    position: absolute;
    bottom: 1px;
    right: 1px;
    width: 9px;
    height: 9px;
    background: #3ecf6e;
    border-radius: 50%;
    border: 1.5px solid #020810;
    box-shadow: 0 0 8px rgba(62,207,110,0.8);
  }

  /* ── DROPDOWN ── */
  .hero-dropdown {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: 240px;
    background: rgba(5,12,24,0.97);
    border: 1px solid rgba(68,187,255,0.16);
    border-radius: 18px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(68,187,255,0.06);
    backdrop-filter: blur(32px);
    overflow: hidden;
    animation: dropdownFade .16s ease;
    transform-origin: top right;
  }
  @keyframes dropdownFade {
    from { opacity: 0; transform: scale(0.94) translateY(-6px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .dd-header {
    padding: 16px 16px 13px;
    border-bottom: 1px solid rgba(68,187,255,0.09);
  }
  .dd-email {
    font-size: 12px;
    font-weight: 600;
    color: #eef5ff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 7px;
  }
  .dd-tier {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    background: rgba(68,187,255,0.10);
    border: 1px solid rgba(68,187,255,0.18);
    border-radius: 100px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: #74d0ff;
  }
  .dd-tier-dot {
    width: 5px;
    height: 5px;
    background: #44bbff;
    border-radius: 50%;
    box-shadow: 0 0 6px rgba(68,187,255,0.9);
  }

  .dd-items { padding: 6px; }
  .dd-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 11px;
    border-radius: 11px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: rgba(220,240,255,0.85);
    cursor: pointer;
    transition: background .14s, color .14s;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
  }
  .dd-item:hover { background: rgba(68,187,255,0.09); color: #eef5ff; }
  .dd-item-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    flex-shrink: 0;
    background: rgba(68,187,255,0.08);
  }
  .dd-item-label { flex: 1; }
  .dd-item-arrow { font-size: 14px; color: rgba(155,210,248,0.30); }

  .dd-item-disabled {
    opacity: 0.40;
    cursor: not-allowed;
    pointer-events: none;
  }
  .dd-item-disabled:hover { background: transparent; }
  .dd-soon {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(155,210,248,0.35);
    background: rgba(68,187,255,0.06);
    border: 1px solid rgba(68,187,255,0.10);
    border-radius: 100px;
    padding: 2px 7px;
  }

  .dd-divider { height: 1px; background: rgba(68,187,255,0.08); margin: 4px 6px; }

  .dd-item-signout { color: rgba(255,130,130,0.70); }
  .dd-item-signout:hover { background: rgba(255,80,80,0.07); color: rgba(255,150,150,0.90); }
  .dd-item-signout .dd-item-icon { background: rgba(255,80,80,0.08); }

  /* ── CONCEPT GENERATOR ── */
  .concept-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 7vw 80px;
    text-align: center;
  }
  .concept-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 6px;
    text-transform: uppercase;
    color: var(--blue);
    margin-bottom: 16px;
    opacity: 0.78;
  }
  .concept-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(28px, 7vw, 54px);
    color: var(--cream);
    letter-spacing: 4px;
    margin-bottom: 8px;
    line-height: 1;
  }
  .concept-sub {
    font-size: 15px;
    color: var(--muted2);
    margin-bottom: 36px;
    max-width: 420px;
    line-height: 1.6;
  }
  .concept-form {
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }
  .concept-generate-btn {
    background: var(--blue);
    color: #000;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 700;
    border: none;
    border-radius: var(--radius);
    padding: 17px 36px;
    cursor: pointer;
    transition: opacity 0.2s;
    width: 100%;
  }
  .concept-generate-btn:hover:not(:disabled) { opacity: 0.85; }
  .concept-generate-btn:disabled { opacity: 0.45; cursor: default; }
  .concept-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--muted2);
    font-size: 14px;
    padding: 20px 0;
  }
  .concept-loading-dots { display: flex; gap: 5px; }
  .concept-loading-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--blue);
  }
  .concept-loading-dot:nth-child(1) { animation: cldot 1.2s 0s infinite both; }
  .concept-loading-dot:nth-child(2) { animation: cldot 1.2s 0.2s infinite both; }
  .concept-loading-dot:nth-child(3) { animation: cldot 1.2s 0.4s infinite both; }
  @keyframes cldot { 0%,80%,100%{opacity:0.2;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
  .concept-cards {
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 100%;
    max-width: 580px;
    margin-top: 28px;
    text-align: left;
  }
  .concept-card {
    background: var(--surface);
    border: 1.5px solid var(--border2);
    border-radius: var(--radius);
    padding: 20px 22px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }
  .concept-card:hover { border-color: rgba(68,187,255,0.35); background: var(--surface2); }
  .concept-card.selected { border-color: var(--blue); background: var(--blue-dim); }
  .concept-card-hd {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }
  .concept-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    color: var(--blue);
    background: var(--blue-dim);
    border-radius: 100px;
    padding: 3px 10px;
  }
  .concept-card-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
  }
  .concept-struct {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .concept-struct-item { display: flex; flex-direction: column; gap: 3px; }
  .concept-struct-lbl {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .concept-struct-val {
    font-size: 12px;
    color: var(--muted2);
    line-height: 1.45;
  }
  .concept-cta-row {
    display: flex;
    gap: 10px;
    margin-top: 22px;
    width: 100%;
    max-width: 580px;
  }
  .concept-proceed-btn {
    flex: 1;
    background: var(--blue);
    color: #000;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 700;
    border: none;
    border-radius: var(--radius);
    padding: 15px;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .concept-proceed-btn:disabled { opacity: 0.4; cursor: default; }
  .concept-proceed-btn:hover:not(:disabled) { opacity: 0.85; }
  .concept-skip-btn {
    background: transparent;
    color: var(--muted2);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    border: 1.5px solid var(--border2);
    border-radius: var(--radius);
    padding: 15px 18px;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    white-space: nowrap;
  }
  .concept-skip-btn:hover { border-color: var(--border3); color: var(--text); }

  .concept-edit-panel {
    background: var(--surface2);
    border: 1.5px solid var(--border3);
    border-radius: var(--radius);
    padding: 20px 22px;
    width: 100%;
    max-width: 580px;
    text-align: left;
    margin-top: 4px;
  }
  .concept-edit-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  .concept-edit-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--blue);
  }
  .concept-edit-cancel {
    font-size: 12px;
    color: var(--muted);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-family: 'DM Sans', sans-serif;
    transition: color 0.15s;
  }
  .concept-edit-cancel:hover { color: var(--text); }
  .concept-edit-field { margin-bottom: 13px; }
  .concept-edit-field:last-of-type { margin-bottom: 0; }
  .concept-edit-lbl {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 5px;
  }
  .concept-edit-input {
    width: 100%;
    background: var(--surface);
    border: 1.5px solid var(--border2);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    line-height: 1.55;
    resize: vertical;
    min-height: 56px;
    transition: border-color 0.15s;
  }
  .concept-edit-input.single-line { min-height: 0; resize: none; height: 40px; }
  .concept-edit-input:focus { outline: none; border-color: var(--blue); }
  .concept-use-btn {
    width: 100%;
    background: var(--blue);
    color: #000;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 700;
    border: none;
    border-radius: var(--radius);
    padding: 14px;
    cursor: pointer;
    margin-top: 16px;
    transition: opacity 0.2s;
  }
  .concept-use-btn:hover { opacity: 0.85; }
  .concept-edit-hint {
    font-size: 11px;
    color: var(--muted);
    margin-top: 10px;
    text-align: center;
  }

  /* ── HOOK SELECTOR ── */
  .hook-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 11px;
    margin-top: 8px;
  }
  .hook-card {
    background: var(--surface);
    border: 1.5px solid var(--border2);
    border-radius: var(--radius-sm);
    padding: 17px 15px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    text-align: left;
  }
  .hook-card:hover { border-color: rgba(68,187,255,0.30); }
  .hook-card.selected { border-color: var(--blue); background: var(--blue-dim); }
  .hook-card-icon { font-size: 20px; margin-bottom: 8px; }
  .hook-card-name { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .hook-card-desc { font-size: 11px; color: var(--muted); line-height: 1.4; }

  /* ── AI PANELS ── */
  .ai-generate-btn {
    width: 100%;
    background: transparent;
    color: var(--blue);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    border: 1.5px solid var(--border3);
    border-radius: var(--radius);
    padding: 15px;
    cursor: pointer;
    transition: background 0.2s;
    margin-top: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .ai-generate-btn:hover:not(:disabled) { background: var(--blue-dim); }
  .ai-generate-btn:disabled { opacity: 0.45; cursor: default; }
  .ai-panel {
    background: var(--surface);
    border: 1.5px solid var(--border2);
    border-radius: var(--radius);
    margin-top: 10px;
    overflow: hidden;
  }
  .ai-panel-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 18px;
    border-bottom: 1px solid var(--border);
  }
  .ai-panel-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--blue);
  }
  .ai-panel-copy {
    font-size: 12px;
    background: transparent;
    color: var(--muted2);
    border: 1px solid var(--border2);
    border-radius: 8px;
    padding: 4px 10px;
    cursor: pointer;
    transition: color 0.2s;
  }
  .ai-panel-copy:hover { color: var(--text); }
  .ai-panel-body { padding: 18px; }
  .voiceover-text {
    font-family: 'DM Mono', monospace;
    font-size: 12.5px;
    color: var(--text);
    line-height: 1.85;
    white-space: pre-wrap;
    max-height: 420px;
    overflow-y: auto;
  }
  .variation-group { margin-bottom: 20px; }
  .variation-group:last-child { margin-bottom: 0; }
  .variation-group-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--blue);
    margin-bottom: 9px;
  }
  .variation-item {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 11px 13px;
    margin-bottom: 7px;
    font-size: 13px;
    color: var(--text);
    line-height: 1.5;
  }
  .variation-item:last-child { margin-bottom: 0; }
  .variation-letter {
    font-size: 10px;
    font-weight: 700;
    color: var(--blue);
    margin-bottom: 4px;
    letter-spacing: 1px;
  }
  .ai-loading-row {
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--muted2);
    font-size: 13px;
    padding: 4px 0;
  }
  .ai-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--blue);
  }
  .ai-dot:nth-child(1){animation:cldot 1.2s 0s infinite both}
  .ai-dot:nth-child(2){animation:cldot 1.2s 0.2s infinite both}
  .ai-dot:nth-child(3){animation:cldot 1.2s 0.4s infinite both}

  /* ── START SCREEN ── */
  .start-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 6vw 80px;
    text-align: center;
    position: relative;
    z-index: 2;
  }
  .start-logo { font-family: 'Bebas Neue', sans-serif; line-height: 0.88; margin-bottom: 28px; }
  .start-logo-scene { font-size: clamp(40px, 10vw, 72px); letter-spacing: 10px; color: var(--cream); display: block; }
  .start-logo-bloc  { font-size: clamp(40px, 10vw, 72px); letter-spacing: 10px; color: var(--blue); display: block;
    text-shadow: 0 0 60px rgba(68,187,255,0.55); }
  .start-question {
    font-size: clamp(18px, 3.5vw, 28px);
    font-weight: 300;
    color: var(--muted2);
    margin-bottom: 48px;
    letter-spacing: 0.5px;
  }
  .start-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    width: 100%;
    max-width: 900px;
  }
  @media (max-width: 680px) { .start-cards { grid-template-columns: 1fr; } }
  .start-card {
    background: var(--surface);
    border: 1.5px solid var(--border2);
    border-radius: var(--radius);
    padding: 32px 24px 28px;
    cursor: pointer;
    transition: border-color 0.22s, background 0.22s, transform 0.18s;
    text-align: left;
    position: relative;
    overflow: hidden;
  }
  .start-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(68,187,255,0.4), transparent);
    opacity: 0;
    transition: opacity 0.22s;
  }
  .start-card:hover { border-color: rgba(68,187,255,0.45); background: var(--surface2); transform: translateY(-3px); }
  .start-card:hover::before { opacity: 1; }
  .start-card.featured { border-color: rgba(68,187,255,0.22); }
  .start-card-icon {
    width: 44px; height: 44px;
    border-radius: 12px;
    background: var(--blue-dim);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    margin-bottom: 18px;
  }
  .start-card-type {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--blue);
    margin-bottom: 8px;
  }
  .start-card-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(22px, 3vw, 30px);
    letter-spacing: 2px;
    color: var(--cream);
    margin-bottom: 10px;
    line-height: 1.05;
  }
  .start-card-desc {
    font-size: 13px;
    color: var(--muted2);
    line-height: 1.6;
  }
  .start-card-arrow {
    position: absolute;
    bottom: 22px; right: 22px;
    font-size: 18px;
    color: rgba(68,187,255,0.35);
    transition: color 0.18s, transform 0.18s;
  }
  .start-card:hover .start-card-arrow { color: var(--blue); transform: translateX(4px); }

  /* ── IMAGE BUILDER ── */
  .img-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60px 7vw 100px;
    position: relative;
    z-index: 2;
  }
  .img-header {
    width: 100%;
    max-width: 580px;
    margin-bottom: 32px;
    text-align: center;
  }
  .img-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: var(--blue);
    margin-bottom: 10px;
    opacity: 0.8;
  }
  .img-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(26px, 6vw, 46px);
    color: var(--cream);
    letter-spacing: 3px;
    margin-bottom: 6px;
  }
  .img-sub { font-size: 14px; color: var(--muted2); line-height: 1.55; }
  .img-mode-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
    max-width: 580px;
    margin-bottom: 8px;
  }
  .img-mode-card {
    background: var(--surface);
    border: 1.5px solid var(--border2);
    border-radius: var(--radius);
    padding: 20px 18px;
    cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
    text-align: left;
  }
  .img-mode-card:hover { border-color: rgba(68,187,255,0.35); }
  .img-mode-card.selected { border-color: var(--blue); background: var(--blue-dim); }
  .img-mode-icon { font-size: 22px; margin-bottom: 10px; }
  .img-mode-name { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .img-mode-desc { font-size: 11px; color: var(--muted); line-height: 1.4; }
  .img-form {
    width: 100%;
    max-width: 580px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .img-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 0;
  }
  .img-field {
    margin-bottom: 14px;
  }
  .img-field-lbl {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 6px;
  }
  .img-sel {
    width: 100%;
    background: var(--surface);
    border: 1.5px solid var(--border2);
    border-radius: var(--radius-sm);
    padding: 11px 14px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    cursor: pointer;
    transition: border-color 0.15s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2344bbff' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }
  .img-sel:focus { outline: none; border-color: var(--blue); }
  .img-generate-btn {
    width: 100%;
    max-width: 580px;
    background: var(--blue);
    color: #000;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 700;
    border: none;
    border-radius: var(--radius);
    padding: 17px;
    cursor: pointer;
    transition: opacity 0.2s;
    margin-top: 4px;
  }
  .img-generate-btn:hover:not(:disabled) { opacity: 0.85; }
  .img-generate-btn:disabled { opacity: 0.4; cursor: default; }
  .img-back-btn {
    background: transparent;
    border: none;
    color: var(--muted2);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    cursor: pointer;
    padding: 0;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color 0.15s;
    align-self: flex-start;
    max-width: 580px;
    width: 100%;
  }
  .img-back-btn:hover { color: var(--text); }
  .img-result-card {
    width: 100%;
    max-width: 580px;
    background: var(--surface);
    border: 1.5px solid var(--border2);
    border-radius: var(--radius);
    overflow: hidden;
    margin-top: 4px;
  }
  .img-result-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 18px;
    border-bottom: 1px solid var(--border);
  }
  .img-result-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--blue);
  }
  .img-result-body {
    padding: 18px;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--text);
    line-height: 1.8;
    white-space: pre-wrap;
    max-height: 480px;
    overflow-y: auto;
  }
  .img-i2v-section {
    width: 100%;
    max-width: 580px;
    margin-top: 14px;
    background: var(--surface);
    border: 1.5px solid var(--border2);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .img-i2v-hd {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
    padding: 12px 18px;
    border-bottom: 1px solid var(--border);
  }
  .img-i2v-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
  .img-i2v-tool {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .img-i2v-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    background: var(--blue-dim);
    color: var(--blue);
    border-radius: 6px;
    padding: 3px 8px;
    white-space: nowrap;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .img-i2v-text { font-size: 12px; color: var(--muted2); line-height: 1.5; }
  .img-continue-btn {
    width: 100%;
    max-width: 580px;
    background: var(--blue);
    color: #000;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 700;
    border: none;
    border-radius: var(--radius);
    padding: 17px;
    cursor: pointer;
    margin-top: 14px;
    transition: opacity 0.2s;
  }
  .img-continue-btn:hover { opacity: 0.85; }
  .img-restart-btn {
    width: 100%;
    max-width: 580px;
    background: transparent;
    color: var(--muted2);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    border: 1.5px solid var(--border2);
    border-radius: var(--radius);
    padding: 14px;
    cursor: pointer;
    margin-top: 8px;
    transition: border-color 0.2s, color 0.2s;
  }
  .img-restart-btn:hover { border-color: var(--border3); color: var(--text); }
  .pipeline-section-lbl {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
    padding: 12px 0 4px;
    border-top: 1px solid var(--border);
  }
  .pipeline-step-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
    color: var(--blue);
    background: var(--blue-dim);
    border-radius: 100px;
    padding: 3px 10px;
    margin-bottom: 8px;
    letter-spacing: 1px;
  }

  /* ── CINEMATOGRAPHY STEP ── */
  .cine-mood-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 8px;
  }
  .cine-mood-card {
    background: var(--surface);
    border: 1.5px solid var(--border2);
    border-radius: var(--radius-sm);
    padding: 16px 14px;
    cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
    text-align: left;
  }
  .cine-mood-card:hover { border-color: rgba(68,187,255,0.30); }
  .cine-mood-card.selected { border-color: var(--blue); background: var(--blue-dim); }
  .cine-mood-icon { font-size: 18px; margin-bottom: 7px; }
  .cine-mood-name { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 3px; }
  .cine-mood-subdesc { font-size: 11px; color: var(--muted); line-height: 1.35; }

  .cine-gear-panel {
    background: var(--surface);
    border: 1.5px solid var(--border2);
    border-radius: var(--radius);
    padding: 18px 20px;
    margin-top: 16px;
  }
  .cine-gear-hd {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--blue);
    margin-bottom: 14px;
  }
  .cine-gear-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .cine-gear-item { display: flex; flex-direction: column; gap: 5px; }
  .cine-gear-lbl {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .cine-gear-sel-wrap { position: relative; }
  .cine-gear-sel {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: var(--radius-sm);
    padding: 9px 10px 9px 12px;
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  .cine-gear-sel:hover, .cine-gear-sel.open { border-color: var(--blue); }
  .cine-gear-sel-val { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cine-gear-arr { font-size: 9px; color: var(--muted); flex-shrink: 0; }
  .cine-gear-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: var(--surface3);
    border: 1.5px solid var(--border3);
    border-radius: var(--radius-sm);
    z-index: 120;
    box-shadow: 0 8px 32px rgba(0,0,0,0.55);
    max-height: 200px;
    overflow-y: auto;
  }
  .cine-gear-opt {
    padding: 9px 12px;
    font-size: 12px;
    color: var(--muted2);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    transition: background 0.1s;
  }
  .cine-gear-opt:hover { background: var(--blue-glow); color: var(--text); }
  .cine-gear-opt.sel { color: var(--blue); font-weight: 600; }

  .cine-presets-section { margin-top: 18px; }
  .cine-presets-lbl {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
  }
  .cine-presets-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .cine-preset-btn {
    background: transparent;
    color: var(--muted2);
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 600;
    border: 1.5px solid var(--border2);
    border-radius: 100px;
    padding: 7px 14px;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
    white-space: nowrap;
  }
  .cine-preset-btn:hover { border-color: rgba(68,187,255,0.35); color: var(--text); }
  .cine-preset-btn.active { border-color: var(--blue); color: var(--blue); background: var(--blue-dim); }

  /* ── PLATFORM & STYLE STEP ─────────────────────────────────────────── */
  .plat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    margin-top: 10px;
  }
  .plat-card {
    background: var(--surface);
    border: 1.5px solid var(--border2);
    border-radius: var(--radius-sm);
    padding: 16px 14px;
    cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
    text-align: center;
  }
  .plat-card:hover { border-color: rgba(68,187,255,0.30); }
  .plat-card.selected { border-color: var(--blue); background: var(--blue-dim); }
  .plat-card-name { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .plat-card-sub  { font-size: 10px; color: var(--muted); letter-spacing: 0.5px; }
  .plat-badge {
    display: inline-block;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--blue);
    background: var(--blue-dim);
    border: 1px solid var(--blue);
    border-radius: 100px;
    padding: 2px 8px;
    margin-top: 6px;
  }
  .style-section-lbl {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
    margin: 20px 0 10px;
  }
  .style-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 9px;
    margin-bottom: 4px;
  }
  .style-card {
    background: var(--surface);
    border: 1.5px solid var(--border2);
    border-radius: var(--radius-sm);
    padding: 14px 13px;
    cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
  }
  .style-card:hover { border-color: rgba(68,187,255,0.30); }
  .style-card.selected { border-color: var(--blue); background: var(--blue-dim); }
  .style-card-name { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 3px; }
  .style-card-desc { font-size: 11px; color: var(--muted); line-height: 1.35; }
  .hook2-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 9px;
    margin-top: 8px;
  }
  .hook2-card {
    background: var(--surface);
    border: 1.5px solid var(--border2);
    border-radius: var(--radius-sm);
    padding: 14px 10px;
    cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: var(--muted2);
    line-height: 1.3;
  }
  .hook2-card:hover { border-color: rgba(68,187,255,0.30); color: var(--text); }
  .hook2-card.selected { border-color: var(--blue); background: var(--blue-dim); color: var(--blue); }
  .dur-row { display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
  .dur-pill {
    background: transparent;
    border: 1.5px solid var(--border2);
    border-radius: 100px;
    padding: 9px 22px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: var(--muted2);
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }
  .dur-pill:hover { border-color: rgba(68,187,255,0.35); color: var(--text); }
  .dur-pill.selected { border-color: var(--blue); color: var(--blue); background: var(--blue-dim); }
  .upgrade-notice {
    background: rgba(68,187,255,0.07);
    border: 1px solid rgba(68,187,255,0.22);
    border-radius: 12px;
    padding: 14px 16px;
    margin-top: 10px;
    font-size: 13px;
    color: rgba(155,210,248,0.80);
    line-height: 1.5;
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .upgrade-notice-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .upgrade-notice-text { flex: 1; }
  .upgrade-notice-btn {
    display: inline-block;
    margin-top: 8px;
    padding: 7px 16px;
    background: #44bbff;
    color: #000;
    border: none;
    border-radius: 100px;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background .15s;
  }
  .upgrade-notice-btn:hover { background: #74d0ff; }
  .done-platform-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }
  .done-plat-pill {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--blue);
    border: 1px solid var(--blue);
    border-radius: 100px;
    padding: 5px 14px;
  }
  .done-style-pill {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--muted2);
    border: 1px solid var(--border2);
    border-radius: 100px;
    padding: 5px 14px;
  }
`;

type ConceptOption = { id:string; title:string; hook:string; build:string; peak:string; closure:string };
type AbVariations  = { hookVariations:string[]; emotionalAngles:string[]; ctaVariations:string[] };
type PipelineMode  = 'video' | 'image' | 'both';
type ImgStep       = 'mode' | 'form' | 'done';

// ── PLATFORM & STYLE DATA ────────────────────────────────────────────
const PLATFORMS = [
  { id:"seedance", name:"Seedance 2.0", sub:"Higgsfield", recommended:true },
  { id:"kling",    name:"Kling 3.0",    sub:"",           recommended:false },
  { id:"runway",   name:"Runway Gen-4", sub:"",           recommended:false },
  { id:"veo",      name:"Veo 3.1",      sub:"",           recommended:false },
  { id:"sora",     name:"Sora 2",       sub:"",           recommended:false },
  { id:"minimax",  name:"MiniMax Hailuo", sub:"",         recommended:false },
];
const SEEDANCE_STYLES = [
  { category:"Creative", name:"Cinematic",       desc:"Film-quality dramatic content, moody lighting, anamorphic" },
  { category:"Creative", name:"3D CGI",          desc:"Pixar style, Unreal Engine, photorealistic renders" },
  { category:"Creative", name:"Cartoon",         desc:"2D animation, cel-shaded, Ghibli, hand-drawn" },
  { category:"Creative", name:"Comic to Video",  desc:"Manga panels, webtoons, graphic novels coming to life" },
  { category:"Creative", name:"Fight Scenes",    desc:"Martial arts, combat, explosions, action sequences" },
  { category:"Creative", name:"Anime Action",    desc:"Shonen, seinen, mecha, anime openings" },
  { category:"Commercial", name:"Motion Design Ad", desc:"SaaS, app launches, UI demos, feature showcases" },
  { category:"Commercial", name:"E-Commerce Ad",    desc:"Fashion, beauty, electronics, DTC conversion content" },
  { category:"Commercial", name:"Product 360",      desc:"Turntable showcases, multi-angle hero shots, unboxing" },
  { category:"Commercial", name:"Social Hook",      desc:"TikTok, Reels, Shorts, scroll-stopping viral formats" },
  { category:"Commercial", name:"Brand Story",      desc:"Origin stories, mission statements, brand films" },
  { category:"Industry", name:"Music Video",       desc:"Beat-synced, performance, narrative, visualizers" },
  { category:"Industry", name:"Fashion Lookbook",  desc:"Runway walks, outfit showcases, fashion campaigns" },
  { category:"Industry", name:"Food & Beverage",   desc:"Restaurant promos, ASMR, appetite appeal" },
  { category:"Industry", name:"Real Estate",        desc:"Property tours, architecture, interior design, aerial" },
];
const PLATFORM_HOOKS = ["Impossible Scale","Mid-Action Freeze","Perspective Violation","Texture Macro","Color Shock","Motion Contrast"];
const PLATFORM_DURATIONS = ["4s","8s","10s","15s"];

// ── IMAGE PROMPT BUILDER DATA ─────────────────────────────────────────
const IMG_MODES = [
  { id:"filming",    icon:"🎬", name:"AI Filmmaking",         desc:"Cinematic storyboard shots for I2V workflows" },
  { id:"commercial", icon:"◈",  name:"Commercial Ad",          desc:"Premium brand aesthetics — Apple, Nike, Luxury" },
  { id:"ugc",        icon:"📱", name:"UGC Ad",                 desc:"Authentic real-looking content, relatable" },
  { id:"editorial",  icon:"✦",  name:"Product & Editorial",    desc:"Hero shots and lifestyle photography" },
];
const IMG_MOODS     = ["Aspirational","Dramatic","Intimate","Raw & Authentic","Dreamlike","Tense","Epic","Playful","Moody","Clean & Minimal"];
const IMG_LIGHTINGS = ["Golden Hour","Studio Soft Box","Harsh Midday","Blue Hour","Neon Cinematic","Backlit Silhouette","Practical Only","Overcast Natural","Candlelit","High-Key Studio"];
const IMG_PLATFORMS = ["None / Universal","Instagram","TikTok","YouTube Shorts","YouTube / Long-form","Pinterest","LinkedIn","Ad Creative"];
const IMG_ASPECTS   = ["1:1 (Square)","4:5 (Instagram)","9:16 (Vertical / Reels)","16:9 (Widescreen)","21:9 (Cinematic)","3:2 (Photo)"];

const IMG_MODE_TECHNICAL: Record<string, string> = {
  filming:    "cinematic film still, anamorphic lens compression, 2.39:1 aspect ratio, shallow depth of field, film grain texture, motivated foreground elements, shot on ARRI ALEXA 35, Panavision anamorphic optics",
  commercial: "premium commercial photography, ultra-high resolution, sharp focus, professional studio quality, advertising aesthetic, hero product framing, brand photography",
  ugc:        "authentic user-generated content, smartphone camera quality, natural candid moment, slightly imperfect, handheld feel, real environment, relatable lifestyle, Instagram repost quality",
  editorial:  "editorial product photography, hero shot composition, fashion magazine quality, sharp details, rich textures, luxury editorial style, art directed, studio or location",
};
const IMG_MODE_NEGATIVE: Record<string, string> = {
  filming:    "stock photo, generic, flat lighting, no depth, amateur, digital-looking, oversaturated, CG render, plastic, HDR overprocessed",
  commercial: "UGC, amateur, lo-fi, grainy, unlit, messy background, person-centric unless intended",
  ugc:        "studio, overly produced, too clean, stock photo, advertising-looking, perfect lighting, professional model",
  editorial:  "amateur, blurry, poor composition, cluttered, bad styling, wrong focus, unattractive background",
};
const IMG_COLOR_GRADE: Record<string, string> = {
  "Aspirational":    "lifted matte with warm highlights",
  "Dramatic":        "high contrast, teal shadows, crushed blacks",
  "Intimate":        "warm skin tones, gentle vignette",
  "Raw & Authentic": "desaturated, documentary grade",
  "Dreamlike":       "pastel fade, halation glow",
  "Tense":           "cold blue grade, high contrast",
  "Epic":            "teal and orange, IMAX-style grade",
  "Playful":         "vibrant saturated, punchy primary colors",
  "Moody":           "low-key dark, pools of light",
  "Clean & Minimal": "neutral, bright, clinical white balance",
};
const IMG_I2V_MOTION: Record<string, string> = {
  filming:    "slow dolly push-in with subtle camera breathing, hold final frame 2s",
  commercial: "smooth product reveal rotation, elegant hero hold at 70% mark",
  ugc:        "handheld slight shake, natural movement then stabilize",
  editorial:  "gentle parallax pull-back, product stays sharp, environment drifts",
};

function buildImagePrompt(mode: string, subject: string, environment: string, mood: string, lighting: string, platform: string, aspect: string): string {
  const tech  = IMG_MODE_TECHNICAL[mode]  || "";
  const neg   = IMG_MODE_NEGATIVE[mode]   || "";
  const grade = IMG_COLOR_GRADE[mood]     || "cinematic color grade";
  const motion= IMG_I2V_MOTION[mode]      || "slow push-in";
  const subj  = subject  || "subject";
  const env   = environment ? `, ${environment}` : "";
  const moodStr    = mood      || "cinematic";
  const lightStr   = lighting  || "cinematic lighting";
  const platNote   = platform && platform !== "None / Universal" ? ` Optimized for ${platform}.` : "";
  const aspectNote = aspect ? ` Aspect ratio: ${aspect}.` : "";

  const main = `${subj}${env}, ${moodStr.toLowerCase()} mood, ${lightStr.toLowerCase()}, ${tech}, color grade: ${grade}.${platNote}${aspectNote}`;

  const v1 = `${subj}${env} — wide establishing shot, subject set within vast environment, ${lightStr.toLowerCase()}, ${tech}, emphasise scale and context, ${grade}`;
  const v2 = `Extreme close-up of ${subj}, macro detail, ${lightStr.toLowerCase()}, shallow depth of field, textures and materials prominent, ${grade}, cinematic isolation`;
  const v3 = `${subj} in motion${env}, ${moodStr.toLowerCase()} energy, slight motion blur on environment, subject pin-sharp, dynamic diagonal composition, ${lightStr.toLowerCase()}, ${grade}`;

  return `═══════════════════════════════
IMAGE PROMPT
Mode: ${IMG_MODES.find(m=>m.id===mode)?.name || mode}
═══════════════════════════════

[MAIN PROMPT]
${main}

[NEGATIVE PROMPT]
${neg}, blurry, low quality, distorted, deformed, watermark, text overlay, pixelated, bad composition, ugly

[GENERATION PARAMETERS]
Steps: ${mode==="filming"?"40":"30"} | CFG Scale: ${mode==="commercial"?"7.5":"7.0"} | Sampler: DPM++ 2M Karras | Aspect: ${aspect||"16:9"}

─────────────────────────────
VARIATION 1 — Establishing
${v1}

VARIATION 2 — Intimate Close-up
${v2}

VARIATION 3 — Dynamic Motion
${v3}

─────────────────────────────
I2V INTEGRATION NOTES

Kling AI: Import as reference image → set consistency strength 0.7–0.85 → motion prompt: "${motion}"
Seedance: Use as first frame → enable subject consistency → motion intensity: medium → duration: 5–8s
Veo 3: Set as conditioning frame → continuation mode → add audio: ambient sound matching the ${moodStr.toLowerCase()} mood`;
}

const HOOK_TYPES = [
  { id:"bold-visual",   icon:"⚡", name:"Bold Visual Contrast",     desc:"Juxtapose two extremes to stop the scroll" },
  { id:"transform",     icon:"✦",  name:"Transformation Promise",   desc:"Before → after that feels inevitable" },
  { id:"micro-fail",    icon:"↩",  name:"Micro-Fail to Win",        desc:"Tiny relatable friction, then the product solves it" },
  { id:"hyper-benefit", icon:"◈",  name:"Hyper-Specific Benefit",   desc:"One ultra-precise benefit lands harder than ten generic ones" },
  { id:"incomplete",    icon:"?",  name:"Incomplete Information",    desc:"Open a loop the brain must close" },
  { id:"social-proof",  icon:"✦",  name:"Social Proof Trigger",     desc:"Credibility through implied consensus or authority" },
];

// ── CINEMA GEAR 2.0 ───────────────────────────────────────────────────
const CINE_CAMERAS      = ["Modular 8K Digital","Full-Frame Cine Digital","Studio Digital S35","Grand Format 70mm Film","Classic 16mm Film","Premium Large Format"];
const CINE_LENSES       = ["Creative Tilt","70s Cinema Prime","Premium Modern Prime","Warm Cinema Prime","Swirl Bokeh Portrait","Vintage Prime","Clinical Sharp Prime","Compact Anamorphic","Classic Anamorphic","Halation Diffusion"];
const CINE_FOCAL_LENGTHS = ["8–14mm","24–35mm","50mm","85mm+"];
const CINE_APERTURES    = ["f/1.4–f/2","f/4–f/5.6","f/8–f/11"];

const CINE_MOODS = [
  { id:"clean",      icon:"◻",  name:"Clean / Premium",        desc:"Technical perfection, clinical clarity" },
  { id:"cinematic",  icon:"◈",  name:"Cinematic / Narrative",  desc:"Story-first, character-driven depth" },
  { id:"raw",        icon:"⬡",  name:"Raw / Human",            desc:"Documentary grain, organic truth" },
  { id:"epic",       icon:"▲",  name:"Epic / Monumental",      desc:"Colossal scale, deliberate grandeur" },
  { id:"dreamlike",  icon:"◎",  name:"Dreamlike / Nostalgic",  desc:"Hazy memory, emotional warmth" },
  { id:"tense",      icon:"◆",  name:"Tense / Psychological",  desc:"Selective distortion, unease" },
  { id:"hyperreal",  icon:"✦",  name:"Hyperreal / Sharp",      desc:"Maximum resolution, hyper-conscious" },
];

type CineGear = { camera:string; lens:string; focalLength:string; aperture:string };

const CINE_MOOD_MAP: Record<string, CineGear> = {
  "Clean / Premium":        { camera:"Studio Digital S35",      lens:"Premium Modern Prime",  focalLength:"50mm",    aperture:"f/4–f/5.6" },
  "Cinematic / Narrative":  { camera:"Full-Frame Cine Digital", lens:"Warm Cinema Prime",     focalLength:"24–35mm", aperture:"f/1.4–f/2" },
  "Raw / Human":            { camera:"Classic 16mm Film",       lens:"Vintage Prime",         focalLength:"24–35mm", aperture:"f/1.4–f/2" },
  "Epic / Monumental":      { camera:"Grand Format 70mm Film",  lens:"Classic Anamorphic",    focalLength:"8–14mm",  aperture:"f/8–f/11" },
  "Dreamlike / Nostalgic":  { camera:"Classic 16mm Film",       lens:"Halation Diffusion",    focalLength:"85mm+",   aperture:"f/1.4–f/2" },
  "Tense / Psychological":  { camera:"Modular 8K Digital",      lens:"Creative Tilt",         focalLength:"50mm",    aperture:"f/4–f/5.6" },
  "Hyperreal / Sharp":      { camera:"Modular 8K Digital",      lens:"Clinical Sharp Prime",  focalLength:"50mm",    aperture:"f/8–f/11" },
};

const SIGNATURE_LOOKS: Array<{ name:string } & CineGear & { mood:string }> = [
  { name:"The Nolan",        mood:"Epic / Monumental",    camera:"Grand Format 70mm Film",  lens:"Classic Anamorphic",   focalLength:"8–14mm",  aperture:"f/8–f/11" },
  { name:"The A24",          mood:"Raw / Human",          camera:"Classic 16mm Film",       lens:"Vintage Prime",        focalLength:"24–35mm", aperture:"f/1.4–f/2" },
  { name:"The Apple Ad",     mood:"Clean / Premium",      camera:"Studio Digital S35",      lens:"Premium Modern Prime", focalLength:"50mm",    aperture:"f/4–f/5.6" },
  { name:"The Villeneuve",   mood:"Epic / Monumental",    camera:"Modular 8K Digital",      lens:"Classic Anamorphic",   focalLength:"8–14mm",  aperture:"f/4–f/5.6" },
  { name:"The Wong Kar-wai", mood:"Dreamlike / Nostalgic",camera:"Classic 16mm Film",       lens:"Swirl Bokeh Portrait", focalLength:"85mm+",   aperture:"f/1.4–f/2" },
];

function buildCineDescriptor(camera:string, lens:string, focalLength:string, aperture:string): string {
  const camChar: Record<string,string> = {
    "Modular 8K Digital":     "hyper-resolving digital",
    "Full-Frame Cine Digital": "full-frame cinematic digital",
    "Studio Digital S35":      "clean S35 digital",
    "Grand Format 70mm Film":  "grand-format 70mm film",
    "Classic 16mm Film":       "organic 16mm film grain",
    "Premium Large Format":    "large-format cinematic digital",
  };
  const lenChar: Record<string,string> = {
    "Creative Tilt":        "tilt-shift selective-focus optics",
    "70s Cinema Prime":     "vintage 1970s cinema prime",
    "Premium Modern Prime": "high-resolving modern prime",
    "Warm Cinema Prime":    "warm character-driven prime",
    "Swirl Bokeh Portrait": "Petzval swirl-bokeh portrait optics",
    "Vintage Prime":        "vintage character prime",
    "Clinical Sharp Prime": "clinical high-contrast prime",
    "Compact Anamorphic":   "compact anamorphic",
    "Classic Anamorphic":   "classic anamorphic with horizontal flares",
    "Halation Diffusion":   "halation diffusion optics",
  };
  const aptChar: Record<string,string> = {
    "f/1.4–f/2":  "razor-shallow depth of field",
    "f/4–f/5.6":  "controlled selective depth",
    "f/8–f/11":   "deep focus — everything sharp",
  };
  return `${camChar[camera]||camera} paired with ${lenChar[lens]||lens} at ${focalLength}, ${aptChar[aperture]||aperture}.`;
}

const MAX_REF = 8;
const CUSTOM_KEY = "__custom__";

const COMMERCIAL_STYLES = ["Luxury / High-end","Bold & Energetic","Soft & Emotional","Minimalist / Clean","Cinematic / Epic","Urban / Street","Futuristic / Tech","Natural / Organic"];
const OPT: Record<string,string[]> = {
  aesthetic:       ["Cinematic","Industrial","Minimalist","Vintage","Luxury","Neon Noir","Editorial","Raw Documentary","Dark & Moody","Hyper-real"],
  optics:          ["24mm wide prime","35mm street prime","50mm standard prime","85mm portrait prime","135mm telephoto prime","Macro close-up","Anamorphic widescreen","Fisheye distortion","Tilt-shift miniature","Ultra-wide 16mm","Vintage anamorphic","Spherical 65mm"],
  atmosphere:      ["High grain","Crystal clear 4K","Light leaks","Heavy fog","Lens flare","Deep shadows","Hazy glow","Rain-soaked","Dreamy soft focus","Sharp clinical"],
  envA:            ["Sleek white studio","Gritty urban street","Lush forest clearing","Rooftop at golden hour","Industrial warehouse","Luxury penthouse","Desert landscape","Neon-lit city alley","Underwater seabed","Arctic tundra"],
  envB:            ["Infinite black void","Bright showroom floor","Soft cloud backdrop","Outdoor sunrise field","Glass boardroom","Marble product stage","Futuristic white space","Velvet dark lounge","Candlelit cellar","Cosmic nebula"],
  lightTrans:      ["Natural sun → Studio strobe","Dark neon → Soft glow","Overcast → Dramatic backlit","Warm tungsten → Cold LED","Sunrise → Midday sun","Sunset → Studio flash","Candlelight → Neon","Daylight → Moonlight"],
  detail1:         ["Brand logo","Product surface texture","Packaging edge","Key feature","Material grain","Label / typography","Clasp or fastening","Signature silhouette"],
  motion:          ["Upward floating","Forward surging","Slow rotation","Diagonal drift","Spiraling rise","Gravity-defying levitation","Explosive burst","Graceful descent"],
  detail2:         ["Material texture","Craftsmanship seam","Signature finish","Hidden detail","Core mechanism","Signature color","Engraved mark","Reflective surface"],
  particles:       ["Floating water drops","Glowing embers","Geometric shapes","Bokeh light orbs","Gold dust motes","Petal fragments","Smoke wisps","Crystalline shards","Firefly sparks","Silver rain"],
  lightFx:         ["Golden glint","Lens flare","Rim light flash","Specular highlight","Prism split","Strobe pulse","Aurora shimmer","Rainbow caustics"],
  bg:              ["Pure black","Pure white","Brand primary color","Deep navy","Warm ivory","Matte charcoal","Soft champagne","Midnight blue","Velvet burgundy","Forest green"],
  commercialStyle: COMMERCIAL_STYLES,
  // ── NEW Phase 2 fields ──
  colorGrading:    ["Golden hour warm","Teal & orange","High contrast","Desaturated matte","Cool blue cinematic","Vibrant saturated","Bleach bypass","Night vision green","Moody crushed blacks","Pastel fade"],
  cameraAngle:     ["Eye-level","Bird's eye","Dutch angle","POV (first-person)","Over-the-shoulder","Low angle","Worm's eye","High angle","Side profile","45° elevated"],
  cameraMovement:  ["Dolly in","Dolly out","Tracking shot","Crane / jib up","Crane / jib down","Handheld organic","Static locked-off","Circular orbit","Slow push-in","Rapid pull-back"],
  timeOfDay:       ["Golden hour","Blue hour","Midday sun","Midnight","Pre-dawn","Dusk","Overcast day","Magic hour"],
  weather:         ["Clear & crisp","Foggy","Light rain","Heavy rain / storm","Hazy heat shimmer","Misty","Snow-dusted","Humid tropical"],
  shotDuration:    ["3 seconds","5 seconds","7 seconds","8 seconds","10 seconds","12 seconds","15 seconds"],
};

const CUSTOM_PLACEHOLDERS: Record<string,string> = {
  aesthetic:       "e.g. Dreamy pastel surrealism",
  optics:          "e.g. Tilt-shift miniature effect",
  atmosphere:      "e.g. Underwater distortion",
  envA:            "e.g. Moonlit rooftop garden",
  envB:            "e.g. Floating island in the clouds",
  lightTrans:      "e.g. Candlelight fading to neon glow",
  detail1:         "e.g. Stitched leather strap",
  motion:          "e.g. Slow backwards pull with a twist",
  detail2:         "e.g. Polished sapphire crystal face",
  particles:       "e.g. Cherry blossom petals",
  lightFx:         "e.g. Aurora shimmer",
  bg:              "e.g. Deep forest green",
  commercialStyle: "e.g. Dark and mysterious thriller",
  colorGrading:    "e.g. Faded vintage Kodachrome",
  cameraAngle:     "e.g. Extreme low angle ground shot",
  cameraMovement:  "e.g. Slow aerial descent spiral",
  timeOfDay:       "e.g. Pre-dawn deep indigo",
  weather:         "e.g. Light drizzle with wet reflections",
  shotDuration:    "e.g. 20 seconds",
};

const STAGES = [
  { id:"product",   short:"Brief",    label:"Product Brief" },
  { id:"hook",      short:"Hook",     label:"Hook Type" },
  { id:"reference", short:"Frames",   label:"Frame Setup" },
  { id:"visual",    short:"Visual",   label:"Visual DNA" },
  { id:"cine",      short:"Cinema",   label:"Cinematography" },
  { id:"platform",  short:"Platform", label:"Platform & Style" },
  { id:"light",     short:"Light",    label:"Landscape" },
  { id:"choreo",    short:"Motion",   label:"Motion" },
  { id:"brand",     short:"Brand",    label:"Branding" },
  { id:"preview",   short:"Done",     label:"Done" },
];

const EMPTY_SCENE  = { envA:"", envB:"", lightTrans:"", detail1:"", motion:"", detail2:"", particles:"", lightFx:"", refMode:"none", refImgs:[] as string[], startImg:null as string|null, endImg:null as string|null, cameraAngle:"", cameraMovement:"", timeOfDay:"", weather:"", shotDuration:"" };
const EMPTY_SHARED = { product:"", commercialStyle:"", aesthetic:"", optics:"", atmosphere:"", bg:"", tagline:"", colorGrading:"", hookType:"", conceptTitle:"", conceptHook:"", conceptBuild:"", conceptPeak:"", conceptClosure:"", cineMood:"", cineCamera:"", cineLens:"", cineFocalLength:"", cineAperture:"", platform:"", platformStyle:"", platformHook:"", platformDuration:"8s" };

// ── SELECT WITH CUSTOM ────────────────────────────────────────────────
function Sel({ label, value, onChange, optKey, placeholder="Choose an option...", locked=false }: {
  label: string; value: string; onChange: (v:string)=>void; optKey: string; placeholder?: string; locked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [customVal, setCustomVal] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isCustom = value && !OPT[optKey]?.includes(value);

  if (locked) return (
    <div className="field">
      <div className="field-lbl">{label}</div>
      <div className="locked-field">
        <span className="locked-field-val">{value}</span>
        <span style={{fontSize:14,color:"var(--muted)"}}>🔒</span>
      </div>
    </div>
  );

  const handleCustomConfirm = () => {
    if (customVal.trim()) { onChange(customVal.trim()); setShowCustomInput(false); }
  };
  const handleSelectCustom = () => {
    setOpen(false); setCustomVal(isCustom ? value : ""); setShowCustomInput(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };
  const handleClearCustom = () => { setShowCustomInput(false); setCustomVal(""); onChange(""); };

  return (
    <div className="field">
      <div className="field-lbl">{label}</div>
      <div className="sel-wrap">
        <button className={`sel-btn${open?" open":""}`} onClick={()=>{setOpen(o=>!o);setShowCustomInput(false);}}>
          <span className={`sel-val${!value?" sel-ph":""}`}>
            {isCustom ? <span>✏️ {value}</span> : (value || placeholder)}
          </span>
          <span className={`sel-arr${open?" open":""}`}>▼</span>
        </button>
        {open && (
          <div className="dropdown">
            {OPT[optKey]?.map(opt=>(
              <div key={opt} className={`dd-item${value===opt?" sel":""}`} onClick={()=>{onChange(opt);setOpen(false);setShowCustomInput(false);}}>
                {opt}{value===opt&&<span>✓</span>}
              </div>
            ))}
            <div className="dd-divider"/>
            <div className="dd-custom-item" onClick={handleSelectCustom}>✏️ Write my own…</div>
          </div>
        )}
      </div>
      {(showCustomInput || (isCustom && !open)) && (
        <div className="custom-input-wrap fade-in">
          <input ref={inputRef} className="custom-input"
            placeholder={CUSTOM_PLACEHOLDERS[optKey] || "Type your own value..."}
            value={showCustomInput ? customVal : value}
            onChange={e => showCustomInput ? setCustomVal(e.target.value) : onChange(e.target.value)}
            onKeyDown={e => { if(e.key==="Enter") handleCustomConfirm(); if(e.key==="Escape") handleClearCustom(); }}
            onBlur={() => { if(showCustomInput && customVal.trim()) handleCustomConfirm(); }}
          />
          <button className="custom-clear" onClick={handleClearCustom}>✕</button>
        </div>
      )}
    </div>
  );
}

// ── MOODBOARD ─────────────────────────────────────────────────────────
function MoodboardUpload({ images, onChange }: { images: string[]; onChange: (imgs:string[])=>void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_REF - images.length;
    const toRead = files.slice(0, remaining);
    let results: string[] = [], count = 0;
    toRead.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => { results.push(ev.target!.result as string); if (++count === toRead.length) onChange([...images, ...results]); };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };
  const remove = (idx: number) => onChange(images.filter((_,i)=>i!==idx));
  const canAdd = images.length < MAX_REF;
  const emptyCount = Math.max(0, (images.length < 6 ? 6 : MAX_REF) - images.length - (canAdd?1:0));
  return (
    <div>
      <div className="moodboard-header">
        <div className="field-lbl" style={{marginBottom:0}}>Mood Board</div>
        <div className="moodboard-count">{images.length} / {MAX_REF}</div>
      </div>
      <div style={{height:13}}/>
      <div className="moodboard-grid">
        {images.map((img,i)=>(
          <div key={i} className="mb-slot filled">
            <img src={img} alt={`ref-${i+1}`}/>
            <button className="mb-remove" onClick={e=>{e.stopPropagation();remove(i);}}>✕</button>
          </div>
        ))}
        {canAdd&&<div className="mb-add" onClick={()=>fileRef.current?.click()}><span>+</span><p>Add Image</p></div>}
        {Array.from({length:emptyCount}).map((_,i)=>(
          <div key={`e${i}`} className="mb-slot" style={{cursor:"default",opacity:.14}}>
            <div className="mb-slot-icon">🖼️</div>
            <div className="mb-slot-num">Empty</div>
          </div>
        ))}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleFiles}/>
      <div className="hint" style={{marginTop:13}}>
        Upload up to {MAX_REF} images. Color grading, lighting, and visual style will be pulled from all of them.
        {canAdd&&<span style={{color:"var(--blue-bright)"}}> Tap + to add more.</span>}
      </div>
    </div>
  );
}

// ── SINGLE UPLOAD ──────────────────────────────────────────────────────
function UploadZone({ label, sub, value, onChange }: { label:string; sub?:string; value:string|null; onChange:(v:string|null)=>void }) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target!.result as string);
    reader.readAsDataURL(f); e.target.value="";
  };
  return (
    <div className={`upload-zone${value?" has-img":""}`} onClick={()=>ref.current?.click()}>
      {value ? (
        <><img src={value} alt={label}/><button className="upload-remove" onClick={e=>{e.stopPropagation();onChange(null);}}>✕</button></>
      ) : (
        <><div className="upload-zone-icon">📎</div><div className="upload-zone-label">{label}</div>{sub&&<div className="upload-zone-sub">{sub}</div>}</>
      )}
      <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
    </div>
  );
}

// ── MUSIC DIRECTION ───────────────────────────────────────────────────
function getMusicDirection(style: string) {
  const s = style.toLowerCase();
  if (s.includes("luxury"))                           return { emotion:"Aspirational awe",   musicStyle:"Neo-classical orchestral", bpm:"50–70",   instruments:"Strings, solo piano, subtle harp" };
  if (s.includes("energetic")||s.includes("bold"))    return { emotion:"Power & momentum",   musicStyle:"Cinematic trap / hip-hop", bpm:"130–155", instruments:"808 bass, epic brass, heavy percussion" };
  if (s.includes("emotional")||s.includes("soft"))    return { emotion:"Tender nostalgia",   musicStyle:"Indie folk / acoustic",    bpm:"60–80",   instruments:"Acoustic guitar, light piano, breathy vocals" };
  if (s.includes("minimal")||s.includes("clean"))     return { emotion:"Calm clarity",       musicStyle:"Ambient minimal",          bpm:"70–90",   instruments:"Sparse piano, subtle synth pads, silence" };
  if (s.includes("epic")||s.includes("cinematic"))    return { emotion:"Grandeur & triumph", musicStyle:"Hybrid orchestral",        bpm:"120–140", instruments:"Full orchestra, epic brass, choir" };
  if (s.includes("urban")||s.includes("street"))      return { emotion:"Raw authenticity",   musicStyle:"Neo-soul / lo-fi",         bpm:"85–100",  instruments:"Rhodes piano, vinyl crackle, smooth bass" };
  if (s.includes("futuristic")||s.includes("tech"))   return { emotion:"Precision & wonder", musicStyle:"Synthwave / electronic",   bpm:"110–130", instruments:"Synthesizers, digital FX, pulsing bass" };
  if (s.includes("natural")||s.includes("organic"))   return { emotion:"Grounded serenity",  musicStyle:"Acoustic world music",     bpm:"65–85",   instruments:"Flute, acoustic guitar, gentle percussion" };
  return { emotion:"Cinematic grandeur", musicStyle:"Hybrid orchestral", bpm:"110–130", instruments:"Full orchestra, epic brass, strings" };
}

// ── PROMPT BUILDER ────────────────────────────────────────────────────
function buildScenePrompt(shared: typeof EMPTY_SHARED, scene: typeof EMPTY_SCENE, sceneNum: number, totalScenes: number) {
  const isCont = sceneNum > 1;
  const dur = scene.shotDuration || "7 seconds";
  const refLine = scene.refMode==="reference"
    ? `\nREFERENCE MOOD BOARD: ${scene.refImgs.length} image(s) attached — extract color grading, lighting, and visual tone equally from all references.`
    : scene.refMode==="startend"
    ? `\nSTART FRAME: Attached — begin this scene exactly from this frame.\nEND FRAME: Attached — conclude this scene at this frame.`
    : `\nREFERENCE: None — generate freely within the established visual language.`;
  const contNote = isCont ? `\nSCENE CONTINUITY: Scene ${sceneNum} of ${totalScenes}. Maintain identical visual DNA, color grading, optics, and atmosphere from Scene 1. Seamless continuation — do NOT reinvent the aesthetic.\n` : "";
  const optLine = (label: string, val: string) => val ? `\n${label}: ${val}` : "";
  const conceptBlock = shared.conceptTitle ? `\n[0. CREATIVE CONCEPT]${isCont?" (LOCKED — inherited from Scene 1)":""}\nConcept: "${shared.conceptTitle}"\nHook: ${shared.conceptHook}\nBuild: ${shared.conceptBuild}\nPeak: ${shared.conceptPeak}\nClosure: ${shared.conceptClosure}\n` : "";
  const hookLine = shared.hookType && !isCont ? `\nHOOK TYPE: ${shared.hookType}` : "";
  const cineBlock = shared.cineCamera ? `\n\n[CINEMATOGRAPHY]${isCont?" (LOCKED — inherited from Scene 1)":""}\nEmotional Core: ${shared.cineMood||"—"}\nCamera: ${shared.cineCamera}\nLens: ${shared.cineLens||"—"}\nFocal Length: ${shared.cineFocalLength||"—"}\nAperture: ${shared.cineAperture||"—"}\nVisual Character: ${buildCineDescriptor(shared.cineCamera,shared.cineLens,shared.cineFocalLength,shared.cineAperture)}` : "";
  const music = !isCont ? getMusicDirection(shared.commercialStyle) : null;
  const musicBlock = music ? `\n\n[5. MUSIC DIRECTION]\nEmotion Target: ${music.emotion}\nMusic Style: ${music.musicStyle}\nBPM Range: ${music.bpm} BPM\nKey Instruments: ${music.instruments}` : "";
  return `═══════════════════════════════
SCENE ${sceneNum} OF ${totalScenes}${isCont?" — CONTINUATION":""}
═══════════════════════════════
PRODUCT: ${shared.product||"—"}
COMMERCIAL STYLE: ${shared.commercialStyle||"—"}${hookLine}
SHOT DURATION: ${dur}
${contNote}${conceptBlock}
[1. VISUAL DNA]${isCont?" (LOCKED — inherited from Scene 1)":""}
Aesthetic: ${shared.aesthetic||"—"}
Optics / Lens: ${shared.optics||"—"}
Atmosphere: ${shared.atmosphere||"—"}${optLine("Color Grading",shared.colorGrading)}
${refLine}

[2. LIGHT & LANDSCAPE]
Environment A: ${scene.envA||"—"}
Environment B: ${scene.envB||"—"}
Lighting Transition: ${scene.lightTrans||"—"}${optLine("Time of Day",scene.timeOfDay)}${optLine("Weather & Mood",scene.weather)}

[3. THE 4-STAGE CHOREOGRAPHY]
Camera Angle: ${scene.cameraAngle||"Three-quarter perspective"}
Camera Movement: ${scene.cameraMovement||"Dynamic — see stages below"}

STAGE 1 — THE FULL-VIEW WRAP (0–25% of ${dur})
Start Point: Close-up on ${scene.detail1||"—"} of the ${shared.product||"subject"}
Movement: A rapid 360° radial orbit around the ${shared.product||"subject"}.
Goal: Establish full geometry — front, sides, and back in one motion.

STAGE 2 — THE ENVIRONMENT MORPH (25–50% of ${dur})
Action: ${shared.product||"Subject"} moves ${scene.motion||"—"}.
Transition: ${scene.envA||"Environment A"} dissolves into ${scene.envB||"Environment B"}.
Goal: Seamless "portal" effect using the product's movement as anchor.

STAGE 3 — THE MACRO-DETAIL SPIRAL (50–85% of ${dur})
Focus: ${scene.detail2||"—"} of the ${shared.product||"subject"}
Movement: Slow, tight helical spiral around the product.
Atmosphere: ${scene.particles||"—"} drift through the shot.

STAGE 4 — THE STRATEGIC HERO HOLD (85–100% of ${dur})
Camera: Pulls back and stabilizes.
Angle: ${scene.cameraAngle||"Three-quarter perspective (front + side/back simultaneously)"}.
Highlight: ${scene.lightFx||"—"} passes over the brand logo.

[4. BRANDING]${isCont?" (LOCKED — inherited from Scene 1)":""}
Background: ${shared.bg||"—"}
Tagline: "${shared.tagline||"Your Slogan Here"}"${cineBlock}${musicBlock}`;
}

function buildSeedancePrompt(shared: typeof EMPTY_SHARED, scene: typeof EMPTY_SCENE, sceneNum: number, totalScenes: number) {
  const isCont  = sceneNum > 1;
  const durStr  = shared.platformDuration || "8s";
  const durNum  = parseInt(durStr);
  const b1End   = Math.round(durNum * 0.25);
  const b2End   = Math.round(durNum * 0.50);
  const b3End   = Math.round(durNum * 0.85);
  const style   = shared.platformStyle || "Cinematic";
  const hook    = shared.platformHook  || "Bold Visual";
  const music   = !isCont ? getMusicDirection(shared.commercialStyle) : null;
  const contHdr = isCont
    ? `SCENE ${sceneNum} OF ${totalScenes} — CONTINUATION\nInherit all visual DNA, colour grading, and lighting from Scene 1.\n\n`
    : `SCENE ${sceneNum} OF ${totalScenes}\n\n`;
  const hookDesc = scene.detail1
    ? `Open on ${scene.detail1} of ${shared.product||"subject"}`
    : `Establish ${shared.product||"subject"} in ${scene.envA||"environment"}`;
  const taglineBlock = shared.tagline ? `\n[TAGLINE: "${shared.tagline}"]` : "";
  return `═══════════════════════════════
${contHdr}[STYLE: ${style}]
[PRODUCT: ${shared.product||"—"}]

[HOOK: 0–2s | ${hook} — ${hookDesc}]

[BEAT 1: 2–${b1End}s | ${scene.envA||"environment"} — ${scene.cameraMovement||"dynamic movement"}, ${shared.atmosphere||"—"} atmosphere, ${shared.optics||"—"} lens]

[BEAT 2: ${b1End}–${b2End}s | ${shared.product||"subject"} ${scene.motion||"reveals"} — ${scene.envA||"Env A"} transitions into ${scene.envB||"Env B"}, ${shared.colorGrading||"cinematic colour grading"}]

[BEAT 3: ${b2End}–${b3End}s | Macro detail on ${scene.detail2||shared.product||"subject"} — ${scene.particles||"particles"} drifting, ${shared.cineMood||"moody"} lighting, tight helical orbit]

[BEAT 4: ${b3End}–${durNum}s | Pull to hero frame — ${scene.lightFx||"light sweep"} over brand mark, ${scene.cameraAngle||"three-quarter"} angle lock]

[SOUND DESIGN: ${music ? `${music.musicStyle} at ${music.bpm} BPM — ${music.instruments}` : "Cinematic ambient — foley-driven, minimal score"}]

[TECHNICAL: 16:9 | ${durStr} | Style: ${style} | Platform: Seedance 2.0 (Higgsfield)]${taglineBlock}`;
}

function getPrompt(shared: typeof EMPTY_SHARED, scene: typeof EMPTY_SCENE, sceneNum: number, totalScenes: number) {
  if (shared.platform === "Seedance 2.0") return buildSeedancePrompt(shared, scene, sceneNum, totalScenes);
  return buildScenePrompt(shared, scene, sceneNum, totalScenes);
}

// ── GEAR DROPDOWN (Cinema override) ──────────────────────────────────
function GearDrop({ label, value, options, onChange }: { label:string; value:string; options:string[]; onChange:(v:string)=>void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  return (
    <div className="cine-gear-item">
      <div className="cine-gear-lbl">{label}</div>
      <div className="cine-gear-sel-wrap" ref={ref}>
        <button className={`cine-gear-sel${open?" open":""}`} onClick={()=>setOpen(o=>!o)}>
          <span className="cine-gear-sel-val">{value||"—"}</span>
          <span className="cine-gear-arr">▼</span>
        </button>
        {open && (
          <div className="cine-gear-dropdown">
            {options.map(opt=>(
              <div key={opt} className={`cine-gear-opt${value===opt?" sel":""}`} onClick={()=>{onChange(opt);setOpen(false);}}>
                <span>{opt}</span>
                {value===opt && <span>✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────
export default function App() {
  const router = useRouter();
  // Start screen + pipeline
  const [showStart, setShowStart]       = useState(false);
  const [pipelineMode, setPipelineMode] = useState<PipelineMode>('video');
  // Image builder
  const [inImgBuilder, setInImgBuilder] = useState(false);
  const [imgStep, setImgStep]           = useState<ImgStep>('mode');
  const [imgMode, setImgMode]           = useState('');
  const [imgSubject, setImgSubject]     = useState('');
  const [imgEnv, setImgEnv]             = useState('');
  const [imgMood, setImgMood]           = useState('');
  const [imgLighting, setImgLighting]   = useState('');
  const [imgPlatform, setImgPlatform]   = useState('');
  const [imgAspect, setImgAspect]       = useState('16:9 (Widescreen)');
  const [imgPromptText, setImgPromptText] = useState('');
  const [copiedImg, setCopiedImg]         = useState(false);

  const [started, setStarted]         = useState(false);
  const [stage, setStage]             = useState(0);
  const [activeScene, setActiveScene] = useState(0);
  const [previewScene, setPreviewScene] = useState(0);
  const [copied, setCopied]           = useState<number|"all"|null>(null);
  const [shared, setShared]           = useState({...EMPTY_SHARED});
  const [scenes, setScenes]           = useState([{...EMPTY_SCENE}]);
  const [shared_link, setSharedLink]  = useState(false);
  // Auth state
  const [user, setUser]               = useState<User | null>(null);
  const [plan, setPlan]               = useState<"free"|"starter"|"pro"|"studio">("free");
  const [upgradeMsg, setUpgradeMsg]   = useState<string|null>(null);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  // Hero account dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Concept Generator
  const [conceptScreen, setConceptScreen]     = useState(false);
  const [conceptProduct, setConceptProduct]   = useState('');
  const [conceptAudience, setConceptAudience] = useState('');
  const [conceptOptions, setConceptOptions]   = useState<ConceptOption[]>([]);
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  const [selectedConceptId, setSelectedConceptId] = useState('');
  const [editingConcept, setEditingConcept]       = useState(false);
  const [editedConcept, setEditedConcept]         = useState<ConceptOption|null>(null);
  // AI features on Done screen
  const [voiceoverScript, setVoiceoverScript]     = useState('');
  const [loadingVoiceover, setLoadingVoiceover]   = useState(false);
  const [voiceoverVisible, setVoiceoverVisible]   = useState(false);
  const [copiedVoiceover, setCopiedVoiceover]     = useState(false);
  const [abVariations, setAbVariations]           = useState<AbVariations|null>(null);
  const [loadingVariations, setLoadingVariations] = useState(false);
  const [variationsVisible, setVariationsVisible] = useState(false);

  // Restore state from share URL + hydrate auth session
  useEffect(() => {
    // Auth listener
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchPlan(user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchPlan(session.user.id);
      else setPlan("free");
    });

    // Share URL restore
    try {
      const p = new URLSearchParams(window.location.search).get("p");
      if (p) {
        const { shared: s, scenes: sc, stage: st } = JSON.parse(atob(p));
        setShared({ ...EMPTY_SHARED, ...s });
        setScenes(sc.map((x: typeof EMPTY_SCENE) => ({ ...EMPTY_SCENE, ...x, refImgs: [], startImg: null, endImg: null })));
        setStage(st ?? STAGES.length - 1);
        setStarted(true);
      }
    } catch { /* malformed URL param — ignore */ }

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [dropdownOpen]);

  const fetchPlan = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("plan, trial_ends_at").eq("id", userId).single();
    if (!data) return;
    if (data.trial_ends_at && new Date(data.trial_ends_at) > new Date()) {
      setPlan("pro");
    } else {
      setPlan((data.plan ?? "free") as "free"|"starter"|"pro"|"studio");
    }
  };

  const setS  = (k: string) => (v: string) => setShared(p=>({...p,[k]:v}));
  const setScene = (idx: number, k: string, v: unknown) => setScenes(prev=>prev.map((s,i)=>i===idx?{...s,[k]:v}:s));
  const sc = scenes[activeScene];
  const isNewScene = activeScene > 0;

  const refValid = sc.refMode==="none"
    || (sc.refMode==="reference" && sc.refImgs.length>=1)
    || (sc.refMode==="startend" && !!sc.startImg && !!sc.endImg);

  const valid = [
    shared.product.trim().length>=2 && !!shared.commercialStyle, // 0: product
    !!shared.hookType,                                             // 1: hook
    refValid,                                                      // 2: reference
    !isNewScene ? !!(shared.aesthetic && shared.optics && shared.atmosphere) : true, // 3: visual
    true,                                                          // 4: cine (always passable)
    true,                                                          // 5: platform (always passable)
    !!(sc.envA && sc.envB && sc.lightTrans),                      // 6: light
    !!(sc.detail1 && sc.motion && sc.detail2 && sc.particles && sc.lightFx), // 7: choreo
    !!shared.bg,                                                   // 8: brand
    true,                                                          // 9: preview
  ];

  const addScene = () => {
    const newIdx = scenes.length;
    setScenes(prev=>[...prev,{...EMPTY_SCENE}]);
    setActiveScene(newIdx);
    setStage(1);
  };

  const allPrompts = scenes.map((s,i)=>getPrompt(shared,s,i+1,scenes.length)).join("\n\n");

  const copy = (which: number|"all") => {
    const raw = which==="all" ? allPrompts : getPrompt(shared,scenes[which as number],(which as number)+1,scenes.length);
    navigator.clipboard.writeText(withWatermark(raw));
    setCopied(which);
    setTimeout(()=>setCopied(null),2000);
  };

  const shareLink = () => {
    const state = { shared, scenes: scenes.map(s=>({ ...s, refImgs:[], startImg:null, endImg:null })), stage: STAGES.length - 1 };
    const encoded = btoa(JSON.stringify(state));
    const url = `${window.location.origin}${window.location.pathname}?p=${encoded}`;
    navigator.clipboard.writeText(url);
    setSharedLink(true);
    setTimeout(()=>setSharedLink(false),2500);
  };

  const withWatermark = (text: string) => {
    if (plan === "starter" || plan === "pro" || plan === "studio") return text;
    return text + "\n\n━━━━━━━━━━━━━━━━━━━━━━━\nCreated with SceneBloc Free · Upgrade at scenebloc.com\n━━━━━━━━━━━━━━━━━━━━━━━";
  };

  const savePrompt = async () => {
    if (!user) { router.push("/auth"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:       shared.product || "Untitled Prompt",
          product:     shared.product,
          scene_count: scenes.length,
          prompt_text: allPrompts,
          scenes_json: { shared, scenes: scenes.map(s=>({ ...s, refImgs:[], startImg:null, endImg:null })) },
        }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStage(0); setActiveScene(0); setPreviewScene(0); setStarted(false);
    setShared({...EMPTY_SHARED}); setScenes([{...EMPTY_SCENE}]);
    setConceptScreen(false); setConceptProduct(''); setConceptAudience('');
    setConceptOptions([]); setSelectedConceptId(''); setEditingConcept(false); setEditedConcept(null);
    setVoiceoverScript(''); setVoiceoverVisible(false);
    setAbVariations(null); setVariationsVisible(false);
    setShowStart(true); setPipelineMode('video');
    setInImgBuilder(false); setImgStep('mode'); setImgMode(''); setImgSubject('');
    setImgEnv(''); setImgMood(''); setImgLighting(''); setImgPlatform('');
    setImgAspect('16:9 (Widescreen)'); setImgPromptText(''); setCopiedImg(false);
  };

  // ── CONCEPT GENERATOR HANDLERS ───────────────────────────────────────
  const generateConcepts = async () => {
    if (!conceptProduct.trim()) return;
    setLoadingConcepts(true);
    setConceptOptions([]);
    setUpgradeMsg(null);
    try {
      const res = await fetch('/api/ai/concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: conceptProduct, audience: conceptAudience }),
      });
      if (res.status === 429) {
        const d = await res.json();
        setUpgradeMsg(`You've used your ${d.limit} AI Concept${d.limit!==1?"s":""} today. Resets at midnight UTC. Upgrade to Pro for unlimited access.`);
        return;
      }
      if (res.status === 401) { setUpgradeMsg("Sign in to use AI features."); return; }
      const data = await res.json();
      if (data.concepts) setConceptOptions(data.concepts);
    } catch { /* ignore */ } finally {
      setLoadingConcepts(false);
    }
  };

  const proceedWithConcept = () => {
    setShared(prev => ({
      ...prev,
      product: conceptProduct,
      ...(editedConcept ? {
        conceptTitle:   editedConcept.title,
        conceptHook:    editedConcept.hook,
        conceptBuild:   editedConcept.build,
        conceptPeak:    editedConcept.peak,
        conceptClosure: editedConcept.closure,
      } : {}),
    }));
    setConceptScreen(false);
    setStarted(true);
  };

  // ── AI DONE-SCREEN HANDLERS ──────────────────────────────────────────
  const generateVoiceover = async () => {
    setLoadingVoiceover(true);
    setVoiceoverScript('');
    setUpgradeMsg(null);
    try {
      const sceneIdx = previewScene === -1 ? 0 : previewScene;
      const currentPrompt = previewScene === -1 ? allPrompts : getPrompt(shared, scenes[sceneIdx], sceneIdx+1, scenes.length);
      const duration = scenes[sceneIdx].shotDuration || "7 seconds";
      const res = await fetch('/api/ai/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt, duration, product: shared.product }),
      });
      if (res.status === 429) {
        const d = await res.json();
        setUpgradeMsg(`You've used your ${d.limit} Voiceover Script${d.limit!==1?"s":""} today. Resets at midnight UTC. Upgrade to Pro for unlimited access.`);
        return;
      }
      if (res.status === 401) { setUpgradeMsg("Sign in to use AI features."); return; }
      const data = await res.json();
      if (data.script) { setVoiceoverScript(data.script); setVoiceoverVisible(true); }
    } catch { /* ignore */ } finally {
      setLoadingVoiceover(false);
    }
  };

  const generateVariations = async () => {
    setLoadingVariations(true);
    setAbVariations(null);
    setUpgradeMsg(null);
    try {
      const res = await fetch('/api/ai/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: allPrompts, product: shared.product, hookType: shared.hookType, commercialStyle: shared.commercialStyle }),
      });
      if (res.status === 429) {
        const d = await res.json();
        setUpgradeMsg(`You've used your ${d.limit} A/B Variation${d.limit!==1?"s":""} today. Resets at midnight UTC. Upgrade to Pro for unlimited access.`);
        return;
      }
      if (res.status === 401) { setUpgradeMsg("Sign in to use AI features."); return; }
      const data = await res.json();
      if (data.hookVariations) { setAbVariations(data); setVariationsVisible(true); }
    } catch { /* ignore */ } finally {
      setLoadingVariations(false);
    }
  };

  const visibleStages = isNewScene ? STAGES.filter(s=>!["product","hook","visual","cine","platform","brand"].includes(s.id)) : STAGES;

  // ── HERO ────────────────────────────────────────────────────────────
  const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : "";

  // ── START SCREEN ─────────────────────────────────────────────────────
  if (showStart) return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="start-screen fade-in">
          <div className="start-logo">
            <span className="start-logo-scene">SCENE</span>
            <span className="start-logo-bloc">BLOC</span>
          </div>
          <div className="start-question">What are we creating today?</div>
          <div className="start-cards">
            {/* IMAGE PROMPTS */}
            <div className="start-card" onClick={()=>{ setShowStart(false); setPipelineMode('image'); setInImgBuilder(true); }}>
              <div className="start-card-icon">◉</div>
              <div className="start-card-type">Image Prompts</div>
              <div className="start-card-name">Reference<br/>Frames</div>
              <div className="start-card-desc">Generate cinematic reference frames for I2V workflows — Kling, Seedance, Veo</div>
              <div className="start-card-arrow">→</div>
            </div>
            {/* VIDEO PROMPTS */}
            <div className="start-card featured" onClick={()=>{ setShowStart(false); setPipelineMode('video'); setConceptScreen(true); }}>
              <div className="start-card-icon">▶</div>
              <div className="start-card-type">Video Prompts</div>
              <div className="start-card-name">Full Video<br/>Builder</div>
              <div className="start-card-desc">Build cinematic AI video prompts step-by-step — the complete SceneBloc flow</div>
              <div className="start-card-arrow">→</div>
            </div>
            {/* BOTH */}
            <div className="start-card" onClick={()=>{ setShowStart(false); setPipelineMode('both'); setInImgBuilder(true); }}>
              <div className="start-card-icon">⬡</div>
              <div className="start-card-type">Full Pipeline</div>
              <div className="start-card-name">Image +<br/>Video</div>
              <div className="start-card-desc">Full pipeline: generate reference frames first, then animate with a video prompt</div>
              <div className="start-card-arrow">→</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // ── IMAGE PROMPT BUILDER ──────────────────────────────────────────────
  if (inImgBuilder) {
    const imgGenerate = () => {
      const result = buildImagePrompt(imgMode, imgSubject, imgEnv, imgMood, imgLighting, imgPlatform, imgAspect);
      setImgPromptText(result);
      setImgStep('done');
    };
    const imgCopy = () => { navigator.clipboard.writeText(imgPromptText); setCopiedImg(true); setTimeout(()=>setCopiedImg(false),2000); };
    const imgContinueToVideo = () => { setInImgBuilder(false); };
    const imgRestartImage = () => { setImgStep('mode'); setImgMode(''); setImgSubject(''); setImgEnv(''); setImgMood(''); setImgLighting(''); setImgPlatform(''); setImgAspect('16:9 (Widescreen)'); setImgPromptText(''); };

    return (
      <>
        <style>{css}</style>
        <div className="app">
          <div className="img-screen">
            <div className="img-header">
              <div className="img-eyebrow">{pipelineMode==='both'?'Step 1 of 2 — Image Prompts':'Image Prompt Builder'}</div>
              <div className="img-title">IMAGE PROMPT BUILDER</div>
              <div className="img-sub">
                {imgStep==='mode' && "Choose the visual style that matches your creative intent."}
                {imgStep==='form' && "Describe your shot — the more specific, the better the output."}
                {imgStep==='done' && "Your image prompt is ready. Copy it into your preferred image AI."}
              </div>
            </div>

            {/* ── STEP: MODE SELECTION ── */}
            {imgStep==='mode' && (
              <>
                <div className="img-mode-grid">
                  {IMG_MODES.map(m=>(
                    <div key={m.id} className={`img-mode-card${imgMode===m.id?" selected":""}`} onClick={()=>setImgMode(m.id)}>
                      <div className="img-mode-icon">{m.icon}</div>
                      <div className="img-mode-name">{m.name}</div>
                      <div className="img-mode-desc">{m.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{width:'100%',maxWidth:580,display:'flex',gap:10,marginTop:8}}>
                  <button className="img-generate-btn" disabled={!imgMode} onClick={()=>setImgStep('form')} style={{flex:1}}>
                    {imgMode ? `Continue with ${IMG_MODES.find(m=>m.id===imgMode)?.name} →` : "Select a mode above"}
                  </button>
                  <button className="img-restart-btn" style={{width:'auto',padding:'14px 18px',marginTop:0}} onClick={()=>{ setShowStart(true); setPipelineMode('video'); setInImgBuilder(false); }}>← Back</button>
                </div>
              </>
            )}

            {/* ── STEP: FORM ── */}
            {imgStep==='form' && (
              <>
                <button className="img-back-btn" onClick={()=>setImgStep('mode')}>← Change mode</button>
                <div className="img-form">
                  <div className="img-field">
                    <div className="img-field-lbl">Subject</div>
                    <input className="txt-input" placeholder="e.g. A luxury Swiss watch, a person pouring coffee, a sneaker" value={imgSubject} onChange={e=>setImgSubject(e.target.value)}/>
                  </div>
                  <div className="img-field">
                    <div className="img-field-lbl">Environment / Background</div>
                    <input className="txt-input" placeholder="e.g. Marble studio, urban rooftop, lush forest clearing" value={imgEnv} onChange={e=>setImgEnv(e.target.value)}/>
                  </div>
                  <div className="img-form-row">
                    <div className="img-field">
                      <div className="img-field-lbl">Mood</div>
                      <select className="img-sel" value={imgMood} onChange={e=>setImgMood(e.target.value)}>
                        <option value="">Choose mood…</option>
                        {IMG_MOODS.map(m=><option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="img-field">
                      <div className="img-field-lbl">Lighting</div>
                      <select className="img-sel" value={imgLighting} onChange={e=>setImgLighting(e.target.value)}>
                        <option value="">Choose lighting…</option>
                        {IMG_LIGHTINGS.map(l=><option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="img-form-row">
                    <div className="img-field">
                      <div className="img-field-lbl">Platform</div>
                      <select className="img-sel" value={imgPlatform} onChange={e=>setImgPlatform(e.target.value)}>
                        {IMG_PLATFORMS.map(p=><option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="img-field">
                      <div className="img-field-lbl">Aspect Ratio</div>
                      <select className="img-sel" value={imgAspect} onChange={e=>setImgAspect(e.target.value)}>
                        {IMG_ASPECTS.map(a=><option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>
                  <button className="img-generate-btn" disabled={!imgSubject.trim()} onClick={imgGenerate}>
                    Generate Image Prompt →
                  </button>
                </div>
              </>
            )}

            {/* ── STEP: DONE ── */}
            {imgStep==='done' && (
              <>
                <div className="img-result-card">
                  <div className="img-result-hd">
                    <div className="img-result-title">Image Prompt</div>
                    <button className="ai-panel-copy" onClick={imgCopy}>{copiedImg?"✓ Copied":"Copy"}</button>
                  </div>
                  <div className="img-result-body">{imgPromptText}</div>
                </div>
                <div className="img-i2v-section">
                  <div className="img-i2v-hd">I2V Integration Guide</div>
                  <div className="img-i2v-body">
                    <div className="img-i2v-tool">
                      <div className="img-i2v-badge">Kling AI</div>
                      <div className="img-i2v-text">Import generated image → Image-to-Video → consistency strength 0.7–0.85 → add motion prompt from the I2V notes above</div>
                    </div>
                    <div className="img-i2v-tool">
                      <div className="img-i2v-badge">Seedance</div>
                      <div className="img-i2v-text">Use as first frame → enable Subject Consistency → motion intensity medium → target duration 5–8s</div>
                    </div>
                    <div className="img-i2v-tool">
                      <div className="img-i2v-badge">Veo 3</div>
                      <div className="img-i2v-text">Set as conditioning frame → Continuation mode → add ambient audio description matching the mood → run at highest quality tier</div>
                    </div>
                  </div>
                </div>
                {pipelineMode==='both' ? (
                  <button className="img-continue-btn" onClick={imgContinueToVideo}>
                    Continue to Video Builder → (Step 2 of 2)
                  </button>
                ) : (
                  <button className="img-continue-btn" onClick={imgRestartImage} style={{background:'transparent',border:'1.5px solid var(--border3)',color:'var(--blue)'}}>
                    ← Build Another Image Prompt
                  </button>
                )}
                <button className="img-restart-btn" onClick={reset}>↺ Start Over</button>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── CONCEPT GENERATOR SCREEN ─────────────────────────────────────────
  if (!started && conceptScreen) return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="concept-screen fade-in">
          <div className="concept-eyebrow">AI Creative Director</div>
          <div className="concept-title">CONCEPT GENERATOR</div>
          <p className="concept-sub">Enter your product and audience — SceneBloc generates 3 distinct storyboard concepts to choose from.</p>
          <div className="concept-form">
            <input
              className="txt-input"
              placeholder="Product name & description (e.g. A premium Swiss watch)"
              value={conceptProduct}
              onChange={e=>setConceptProduct(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter' && conceptProduct.trim()) generateConcepts(); }}
            />
            <input
              className="txt-input"
              placeholder="Target audience (e.g. High-income men 30–45, luxury lifestyle)"
              value={conceptAudience}
              onChange={e=>setConceptAudience(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter' && conceptProduct.trim()) generateConcepts(); }}
            />
            <button
              className="concept-generate-btn"
              onClick={generateConcepts}
              disabled={!conceptProduct.trim() || loadingConcepts}
            >
              {loadingConcepts ? (
                <span className="ai-loading-row" style={{justifyContent:'center'}}>
                  <span className="ai-dot"/><span className="ai-dot"/><span className="ai-dot"/>
                  &nbsp;Generating concepts…
                </span>
              ) : "Generate 3 Concepts →"}
            </button>
            {upgradeMsg && (
              <div className="upgrade-notice fade-in" style={{marginTop:12}}>
                <div className="upgrade-notice-icon">⚡</div>
                <div className="upgrade-notice-text">
                  {upgradeMsg}
                  <br/>
                  <button className="upgrade-notice-btn" onClick={()=>router.push("/pricing")}>
                    Upgrade to Pro →
                  </button>
                </div>
              </div>
            )}
          </div>
          {conceptOptions.length > 0 && (
            <div className="concept-cards">
              {conceptOptions.map(c => (
                <div
                  key={c.id}
                  className={`concept-card${selectedConceptId===c.id?" selected":""}`}
                  onClick={()=>{ setSelectedConceptId(c.id); setEditedConcept({...c}); setEditingConcept(false); }}
                >
                  <div className="concept-card-hd">
                    <span className="concept-badge">OPTION {c.id}</span>
                    <span className="concept-card-title">{c.title}</span>
                  </div>
                  <div className="concept-struct">
                    <div className="concept-struct-item">
                      <div className="concept-struct-lbl">Hook</div>
                      <div className="concept-struct-val">{c.hook}</div>
                    </div>
                    <div className="concept-struct-item">
                      <div className="concept-struct-lbl">Build</div>
                      <div className="concept-struct-val">{c.build}</div>
                    </div>
                    <div className="concept-struct-item">
                      <div className="concept-struct-lbl">Peak</div>
                      <div className="concept-struct-val">{c.peak}</div>
                    </div>
                    <div className="concept-struct-item">
                      <div className="concept-struct-lbl">Closure</div>
                      <div className="concept-struct-val">{c.closure}</div>
                    </div>
                  </div>
                </div>
              ))}

              {/* ── Edit panel ── */}
              {editingConcept && editedConcept && (
                <div className="concept-edit-panel fade-in">
                  <div className="concept-edit-hd">
                    <div className="concept-edit-badge">Editing — Option {editedConcept.id}</div>
                    <button className="concept-edit-cancel" onClick={()=>setEditingConcept(false)}>✕ Cancel</button>
                  </div>
                  <div className="concept-edit-field">
                    <div className="concept-edit-lbl">Concept Title</div>
                    <textarea
                      className="concept-edit-input single-line"
                      value={editedConcept.title}
                      onChange={e=>setEditedConcept(p=>p?{...p,title:e.target.value}:p)}
                    />
                  </div>
                  <div className="concept-edit-field">
                    <div className="concept-edit-lbl">Hook — 0–25%</div>
                    <textarea
                      className="concept-edit-input"
                      value={editedConcept.hook}
                      onChange={e=>setEditedConcept(p=>p?{...p,hook:e.target.value}:p)}
                    />
                  </div>
                  <div className="concept-edit-field">
                    <div className="concept-edit-lbl">Build — 25–50%</div>
                    <textarea
                      className="concept-edit-input"
                      value={editedConcept.build}
                      onChange={e=>setEditedConcept(p=>p?{...p,build:e.target.value}:p)}
                    />
                  </div>
                  <div className="concept-edit-field">
                    <div className="concept-edit-lbl">Peak — 50–85%</div>
                    <textarea
                      className="concept-edit-input"
                      value={editedConcept.peak}
                      onChange={e=>setEditedConcept(p=>p?{...p,peak:e.target.value}:p)}
                    />
                  </div>
                  <div className="concept-edit-field">
                    <div className="concept-edit-lbl">Closure — 85–100%</div>
                    <textarea
                      className="concept-edit-input"
                      value={editedConcept.closure}
                      onChange={e=>setEditedConcept(p=>p?{...p,closure:e.target.value}:p)}
                    />
                  </div>
                  <button className="concept-use-btn" onClick={proceedWithConcept}>
                    Use This Concept →
                  </button>
                  <div className="concept-edit-hint">Changes apply only to your build — the original concepts stay as shown above.</div>
                </div>
              )}

              <div className="concept-cta-row">
                {!selectedConceptId ? (
                  <>
                    <button className="concept-proceed-btn" disabled>Select a concept above</button>
                    <button className="concept-skip-btn" onClick={()=>{setConceptScreen(false);setStarted(true);}}>Skip →</button>
                  </>
                ) : editingConcept ? (
                  <button className="concept-skip-btn" style={{flex:1}} onClick={()=>setEditingConcept(false)}>← Back to concept selection</button>
                ) : (
                  <>
                    <button className="concept-proceed-btn" onClick={proceedWithConcept}>Build with this Concept →</button>
                    <button className="concept-skip-btn" onClick={()=>setEditingConcept(true)}>✏ Edit</button>
                  </>
                )}
              </div>
            </div>
          )}
          {!loadingConcepts && conceptOptions.length === 0 && (
            <div style={{marginTop:8}}>
              <button className="concept-skip-btn" onClick={()=>{setConceptScreen(false);setStarted(true);}}>
                Skip — Enter builder directly
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

<div style={{width:'100%',background:'rgba(2,8,16,0.95)',padding:'80px 20px',textAlign:'center'}}>
  <p style={{color:'rgba(155,210,248,0.6)',fontSize:12,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:8,fontFamily:'DM Sans, sans-serif'}}>Simple Pricing</p>
  <h2 style={{color:'var(--cream)',fontSize:'clamp(28px,5vw,48px)',fontFamily:'Bebas Neue, sans-serif',marginBottom:40,letterSpacing:3}}>START FREE. SCALE WHEN READY.</h2>
  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,maxWidth:800,margin:'0 auto 40px'}}>
    <div style={{background:'rgba(68,187,255,0.05)',border:'1px solid rgba(68,187,255,0.15)',borderRadius:16,padding:'24px 16px'}}>
      <div style={{color:'var(--cream)',fontFamily:'Bebas Neue, sans-serif',fontSize:20,letterSpacing:2,marginBottom:4}}>Free</div>
      <div style={{color:'var(--blue)',fontFamily:'Bebas Neue, sans-serif',fontSize:36,lineHeight:1}}>£0</div>
      <div style={{color:'rgba(155,210,248,0.5)',fontSize:12,marginTop:8}}>7-day Pro trial included</div>
    </div>
    <div style={{background:'rgba(68,187,255,0.10)',border:'2px solid rgba(68,187,255,0.40)',borderRadius:16,padding:'24px 16px',position:'relative'}}>
      <div style={{position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',background:'var(--blue)',color:'#000',fontSize:10,fontWeight:800,padding:'3px 12px',borderRadius:100,letterSpacing:2,textTransform:'uppercase'}}>Popular</div>
      <div style={{color:'var(--cream)',fontFamily:'Bebas Neue, sans-serif',fontSize:20,letterSpacing:2,marginBottom:4}}>Pro</div>
      <div style={{color:'var(--blue)',fontFamily:'Bebas Neue, sans-serif',fontSize:36,lineHeight:1}}>£35<span style={{fontSize:14}}>/mo</span></div>
      <div style={{color:'rgba(155,210,248,0.5)',fontSize:12,marginTop:8}}>Unlimited AI production</div>
    </div>
    <div style={{background:'rgba(68,187,255,0.05)',border:'1px solid rgba(68,187,255,0.15)',borderRadius:16,padding:'24px 16px',opacity:0.6}}>
      <div style={{color:'var(--cream)',fontFamily:'Bebas Neue, sans-serif',fontSize:20,letterSpacing:2,marginBottom:4}}>Studio</div>
      <div style={{color:'var(--blue)',fontFamily:'Bebas Neue, sans-serif',fontSize:36,lineHeight:1}}>£65<span style={{fontSize:14}}>/mo</span></div>
      <div style={{color:'rgba(155,210,248,0.5)',fontSize:12,marginTop:8}}>Coming soon</div>
    </div>
  </div>
  <button onClick={()=>router.push('/pricing')} style={{padding:'16px 48px',background:'rgba(68,187,255,0.15)',border:'2px solid rgba(68,187,255,0.60)',borderRadius:20,color:'#ffffff',fontFamily:'DM Sans, sans-serif',fontSize:15,fontWeight:800,cursor:'pointer',letterSpacing:'0.06em',textTransform:'uppercase'}}>View Full Pricing & Compare Plans</button>
</div>

  if (!started) return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* Account button — fixed top-right */}
        <div className="hero-account" ref={dropdownRef}>
          {user ? (
            <>
              <button className="hero-avatar-btn" onClick={() => setDropdownOpen(o => !o)} aria-label="Account menu">
                {userInitials}
                <div className="hero-avatar-dot"/>
              </button>
              {dropdownOpen && (
                <div className="hero-dropdown">
                  <div className="dd-header">
                    <div className="dd-email">{user.email}</div>
                    <div className="dd-tier"><div className="dd-tier-dot"/>Free Tier</div>
                  </div>
                  <div className="dd-items">
                    <button className="dd-item" onClick={()=>{setDropdownOpen(false);router.push("/profile");}}>
                      <div className="dd-item-icon">👤</div>
                      <span className="dd-item-label">View Profile</span>
                      <span className="dd-item-arrow">›</span>
                    </button>
                    <button className="dd-item" onClick={()=>{setDropdownOpen(false);router.push("/history");}}>
                      <div className="dd-item-icon">📂</div>
                      <span className="dd-item-label">Prompt History</span>
                      <span className="dd-item-arrow">›</span>
                    </button>
                    <div className="dd-divider"/>
                    <button className="dd-item dd-item-disabled" tabIndex={-1}>
                      <div className="dd-item-icon">⚡</div>
                      <span className="dd-item-label">Upgrade</span>
                      <span className="dd-soon">Coming Soon</span>
                    </button>
                    <div className="dd-divider"/>
                    <button className="dd-item dd-item-signout" onClick={async()=>{setDropdownOpen(false);await supabase.auth.signOut();router.refresh();}}>
                      <div className="dd-item-icon">→</div>
                      <span className="dd-item-label">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <button className="hero-signin-btn" onClick={() => router.push("/auth")}>Sign In</button>
          )}
        </div>

        <div className="hero fade-in">
          <div className="hero-eyebrow">The AI Creative Studio</div>
          <div className="hero-logo">
            <span className="hero-logo-scene">SCENE</span>
            <span className="hero-logo-bloc">BLOC</span>
          </div>
          <p className="hero-tagline">
            DIRECT. CREATE. PRODUCE.
          </p>
          <div className="hero-features">
            <div className="hero-feat"><div className="hero-feat-dot"/><span>Concept Generator</span></div>
            <div className="hero-feat"><div className="hero-feat-dot"/><span>Cinema Gear 2.0</span></div>
            <div className="hero-feat"><div className="hero-feat-dot"/><span>Image Prompts</span></div>
            <div className="hero-feat"><div className="hero-feat-dot"/><span>Video Prompts</span></div>
            <div className="hero-feat"><div className="hero-feat-dot"/><span>Voiceover Scripts</span></div>
            <div className="hero-feat"><div className="hero-feat-dot"/><span>A/B Variations</span></div>
          </div>
          <button className="hero-cta" onClick={()=>setShowStart(true)}>
            Let&apos;s Start Building →
          </button>
          <div className="hero-scroll">
            <div className="hero-scroll-line"/>
            <div className="hero-scroll-text">Tap to start</div>
          </div>
        </div>
      </div>
    </>
  );

  // ── WIZARD ──────────────────────────────────────────────────────────
  const renderContent = () => {
    const s = visibleStages[stage];
    if (!s) return null;

    switch(s.id) {
      case "product": return (
        <div className="fade-in">
          <div className="stage-num">Step 01 / 09</div>
          <div className="stage-title">PRODUCT BRIEF</div>
          <div className="stage-desc">Tell us exactly what you&apos;re advertising. This shapes every scene.</div>
          {shared.conceptTitle && (
            <div className="locked-banner" style={{marginBottom:18}}>
              <div className="locked-banner-icon">✦</div>
              <div className="locked-banner-text">Concept: <strong>{shared.conceptTitle}</strong> <span>— selected from Concept Generator</span></div>
            </div>
          )}
          <div className="field">
            <div className="field-lbl">Product Name &amp; Description</div>
            <input className="txt-input" placeholder="e.g. A luxurious Swiss automatic watch" value={shared.product} onChange={e=>setS("product")(e.target.value)}/>
            <div className="hint">Try: "A premium skincare serum" · "A limited-edition sneaker" · "A high-end perfume bottle"</div>
          </div>
          <Sel label="Commercial Style / Tone" value={shared.commercialStyle} onChange={setS("commercialStyle")} optKey="commercialStyle" placeholder="How should this feel?"/>
        </div>
      );

      case "hook": return (
        <div className="fade-in">
          <div className="stage-num">Step 02 / 09</div>
          <div className="stage-title">HOOK TYPE</div>
          <div className="stage-desc">Choose your psychological trigger — the opening seconds that stop the scroll and demand attention.</div>
          <div className="hook-grid">
            {HOOK_TYPES.map(h=>(
              <div key={h.id} className={`hook-card${shared.hookType===h.name?" selected":""}`} onClick={()=>setS("hookType")(h.name)}>
                <div className="hook-card-icon">{h.icon}</div>
                <div className="hook-card-name">{h.name}</div>
                <div className="hook-card-desc">{h.desc}</div>
              </div>
            ))}
          </div>
        </div>
      );

      case "reference": return (
        <div className="fade-in">
          <div className="stage-num">{isNewScene?`Scene ${activeScene+1} — Step 1`:"Step 03 / 09"}</div>
          <div className="stage-title">FRAME SETUP</div>
          <div className="stage-desc">{isNewScene?`Choose how Scene ${activeScene+1} connects visually to your previous footage.`:"Choose how you want to guide this scene visually."}</div>
          <div className="field-lbl" style={{marginBottom:13}}>Input Mode</div>
          <div className="ref-mode-grid">
            <div className={`ref-mode-card${sc.refMode==="none"?" active":""}`} onClick={()=>setScene(activeScene,"refMode","none")}>
              <div className="ref-mode-icon">✦</div>
              <div className="ref-mode-label">No Reference</div>
              <div className="ref-mode-sub">Pure prompt only</div>
            </div>
            <div className={`ref-mode-card${sc.refMode==="reference"?" active":""}`} onClick={()=>setScene(activeScene,"refMode","reference")}>
              <div className="ref-mode-icon">🖼️</div>
              <div className="ref-mode-label">Mood Board</div>
              <div className="ref-mode-sub">Up to 8 references</div>
            </div>
            <div className={`ref-mode-card${sc.refMode==="startend"?" active":""}`} onClick={()=>setScene(activeScene,"refMode","startend")}>
              <div className="ref-mode-icon">🎬</div>
              <div className="ref-mode-label">Start &amp; End</div>
              <div className="ref-mode-sub">Define exact boundaries</div>
            </div>
          </div>
          {sc.refMode==="reference"&&(
            <div className="fade-in"><MoodboardUpload images={sc.refImgs} onChange={v=>setScene(activeScene,"refImgs",v)}/></div>
          )}
          {sc.refMode==="startend"&&(
            <div className="fade-in">
              <div className="field-lbl">Start &amp; End Frames</div>
              <div className="upload-row two">
                <UploadZone label="Start Frame" sub="Where scene begins" value={sc.startImg} onChange={v=>setScene(activeScene,"startImg",v)}/>
                <UploadZone label="End Frame" sub="Where scene ends" value={sc.endImg} onChange={v=>setScene(activeScene,"endImg",v)}/>
              </div>
              {isNewScene&&<div className="hint" style={{marginTop:11}}>💡 Use the last frame of your previous scene as the Start Frame for a seamless continuation.</div>}
            </div>
          )}
        </div>
      );

      case "visual": return (
        <div className="fade-in">
          <div className="stage-num">Step 04 / 09</div>
          <div className="stage-title">VISUAL DNA</div>
          <div className="stage-desc">These lock across all scenes to keep your entire video consistent.</div>
          <Sel label="Aesthetic" value={shared.aesthetic} onChange={setS("aesthetic")} optKey="aesthetic"/>
          <Sel label="Optics / Lens" value={shared.optics} onChange={setS("optics")} optKey="optics"/>
          <Sel label="Atmosphere" value={shared.atmosphere} onChange={setS("atmosphere")} optKey="atmosphere"/>
          <div className="section-label">Color</div>
          <Sel label="Color Grading" value={shared.colorGrading} onChange={setS("colorGrading")} optKey="colorGrading" placeholder="Choose a grade (optional)"/>
        </div>
      );

      case "cine": {
        const applyMood = (moodName: string) => {
          const gear = CINE_MOOD_MAP[moodName];
          setShared(p=>({ ...p, cineMood:moodName, cineCamera:gear.camera, cineLens:gear.lens, cineFocalLength:gear.focalLength, cineAperture:gear.aperture }));
        };
        const applyLook = (look: typeof SIGNATURE_LOOKS[number]) => {
          setShared(p=>({ ...p, cineMood:look.mood, cineCamera:look.camera, cineLens:look.lens, cineFocalLength:look.focalLength, cineAperture:look.aperture }));
        };
        const isLookActive = (look: typeof SIGNATURE_LOOKS[number]) =>
          shared.cineCamera===look.camera && shared.cineLens===look.lens && shared.cineFocalLength===look.focalLength && shared.cineAperture===look.aperture;
        return (
          <div className="fade-in">
            <div className="stage-num">Step 05 / 09</div>
            <div className="stage-title">CINEMATOGRAPHY</div>
            <div className="stage-desc">Set the physical camera language — locked across all scenes.</div>

            {/* Signature Looks — shown first so users can one-tap */}
            <div className="cine-presets-section">
              <div className="cine-presets-lbl">Signature Looks</div>
              <div className="cine-presets-row">
                {SIGNATURE_LOOKS.map(look=>(
                  <button key={look.name} className={`cine-preset-btn${isLookActive(look)?" active":""}`} onClick={()=>applyLook(look)}>
                    {look.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood selector */}
            <div className="section-label" style={{marginTop:20}}>Emotional Core</div>
            <div className="cine-mood-grid">
              {CINE_MOODS.map(m=>(
                <div key={m.id} className={`cine-mood-card${shared.cineMood===m.name?" selected":""}`} onClick={()=>applyMood(m.name)}>
                  <div className="cine-mood-icon">{m.icon}</div>
                  <div className="cine-mood-name">{m.name}</div>
                  <div className="cine-mood-subdesc">{m.desc}</div>
                </div>
              ))}
            </div>

            {/* Auto gear stack — always visible after first selection, shows defaults if nothing yet */}
            <div className="cine-gear-panel">
              <div className="cine-gear-hd">
                {shared.cineCamera ? "Gear Stack — tap any field to override" : "Recommended Gear Stack — select a mood or look above"}
              </div>
              <div className="cine-gear-grid">
                <GearDrop label="Camera"       value={shared.cineCamera}      options={CINE_CAMERAS}       onChange={v=>setS("cineCamera")(v)}/>
                <GearDrop label="Lens"         value={shared.cineLens}        options={CINE_LENSES}        onChange={v=>setS("cineLens")(v)}/>
                <GearDrop label="Focal Length" value={shared.cineFocalLength} options={CINE_FOCAL_LENGTHS} onChange={v=>setS("cineFocalLength")(v)}/>
                <GearDrop label="Aperture"     value={shared.cineAperture}    options={CINE_APERTURES}     onChange={v=>setS("cineAperture")(v)}/>
              </div>
              {shared.cineCamera && (
                <div style={{marginTop:14,padding:"10px 12px",background:"var(--surface2)",borderRadius:"var(--radius-sm)",fontSize:12,color:"var(--muted2)",lineHeight:1.55}}>
                  <span style={{color:"var(--muted)",fontSize:10,fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",display:"block",marginBottom:4}}>Visual Character</span>
                  {buildCineDescriptor(shared.cineCamera,shared.cineLens,shared.cineFocalLength,shared.cineAperture)}
                </div>
              )}
            </div>
          </div>
        );
      }

      case "platform": return (
        <div className="fade-in">
          <div className="stage-num">Step 06 / 09</div>
          <div className="stage-title">PLATFORM & STYLE</div>
          <div className="stage-desc">Choose your AI video platform and creative direction — locked across all scenes.</div>

          {/* Platform selector */}
          <div className="section-label">AI Video Platform</div>
          <div className="plat-grid">
            {PLATFORMS.map(p=>(
              <div key={p.id} className={`plat-card${shared.platform===p.name?" selected":""}`} onClick={()=>setShared(prev=>({...prev,platform:p.name}))}>
                <div className="plat-card-name">{p.name}</div>
                {p.sub && <div className="plat-card-sub">{p.sub}</div>}
                {p.recommended && <div className="plat-badge">Recommended</div>}
              </div>
            ))}
          </div>

          {/* Seedance styles */}
          {shared.platform==="Seedance 2.0" && (
            <>
              {(["Creative","Commercial","Industry"] as const).map(cat=>(
                <div key={cat}>
                  <div className="style-section-lbl">{cat} Styles</div>
                  <div className="style-grid">
                    {SEEDANCE_STYLES.filter(s=>s.category===cat).map(s=>(
                      <div key={s.name} className={`style-card${shared.platformStyle===s.name?" selected":""}`} onClick={()=>setShared(prev=>({...prev,platformStyle:s.name}))}>
                        <div className="style-card-name">{s.name}</div>
                        <div className="style-card-desc">{s.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* 2-second hook */}
          <div className="section-label" style={{marginTop:24}}>2-Second Hook</div>
          <div className="hook2-grid">
            {PLATFORM_HOOKS.map(h=>(
              <div key={h} className={`hook2-card${shared.platformHook===h?" selected":""}`} onClick={()=>setShared(prev=>({...prev,platformHook:h}))}>
                {h}
              </div>
            ))}
          </div>

          {/* Duration */}
          <div className="section-label" style={{marginTop:24}}>Shot Duration</div>
          <div className="dur-row">
            {PLATFORM_DURATIONS.map(d=>(
              <button key={d} className={`dur-pill${shared.platformDuration===d?" selected":""}`} onClick={()=>setShared(prev=>({...prev,platformDuration:d}))}>
                {d}
              </button>
            ))}
          </div>
        </div>
      );

      case "light": return (
        <div className="fade-in">
          <div className="stage-num">{isNewScene?`Scene ${activeScene+1} — Step 2`:"Step 07 / 09"}</div>
          <div className="stage-title">LIGHT & LANDSCAPE</div>
          <div className="stage-desc">{isNewScene?`Set the environment for Scene ${activeScene+1} — can differ from Scene 1.`:`Set the two environments your ${shared.product||"product"} moves through.`}</div>
          {isNewScene&&<div className="locked-banner"><div className="locked-banner-icon">🔒</div><div className="locked-banner-text">Visual DNA locked from Scene 1 <span>— Aesthetic, Optics &amp; Atmosphere carry over automatically.</span></div></div>}
          <Sel label="Starting Environment" value={sc.envA} onChange={v=>setScene(activeScene,"envA",v)} optKey="envA"/>
          <Sel label="Ending Environment"   value={sc.envB} onChange={v=>setScene(activeScene,"envB",v)} optKey="envB"/>
          <Sel label="Lighting Transition"  value={sc.lightTrans} onChange={v=>setScene(activeScene,"lightTrans",v)} optKey="lightTrans"/>
          <div className="section-label">Conditions</div>
          <Sel label="Time of Day" value={sc.timeOfDay} onChange={v=>setScene(activeScene,"timeOfDay",v)} optKey="timeOfDay" placeholder="Choose time (optional)"/>
          <Sel label="Weather &amp; Mood" value={sc.weather} onChange={v=>setScene(activeScene,"weather",v)} optKey="weather" placeholder="Choose weather (optional)"/>
        </div>
      );

      case "choreo": return (
        <div className="fade-in">
          <div className="stage-num">{isNewScene?`Scene ${activeScene+1} — Step 3`:"Step 08 / 09"}</div>
          <div className="stage-title">CHOREOGRAPHY</div>
          <div className="stage-desc">{isNewScene?`New motion for Scene ${activeScene+1}. Visual DNA stays locked from Scene 1.`:`Build the 4-stage motion for your ${shared.product||"product"}.`}</div>
          <div className="section-label">Camera</div>
          <Sel label="Camera Angle"    value={sc.cameraAngle}    onChange={v=>setScene(activeScene,"cameraAngle",v)}    optKey="cameraAngle"    placeholder="Choose angle (optional)"/>
          <Sel label="Camera Movement" value={sc.cameraMovement} onChange={v=>setScene(activeScene,"cameraMovement",v)} optKey="cameraMovement" placeholder="Choose movement (optional)"/>
          <Sel label="Shot Duration"   value={sc.shotDuration}   onChange={v=>setScene(activeScene,"shotDuration",v)}   optKey="shotDuration"   placeholder="How long is this scene?"/>
          <div className="section-label">Choreography</div>
          <Sel label="Stage 1 — Opening Detail Focus" value={sc.detail1}   onChange={v=>setScene(activeScene,"detail1",v)}   optKey="detail1"/>
          <Sel label="Stage 2 — Subject Movement"     value={sc.motion}    onChange={v=>setScene(activeScene,"motion",v)}    optKey="motion"/>
          <Sel label="Stage 3 — Macro Detail Focus"   value={sc.detail2}   onChange={v=>setScene(activeScene,"detail2",v)}   optKey="detail2"/>
          <Sel label="Stage 3 — Floating Particles"   value={sc.particles} onChange={v=>setScene(activeScene,"particles",v)} optKey="particles"/>
          <Sel label="Stage 4 — Final Light Effect"   value={sc.lightFx}   onChange={v=>setScene(activeScene,"lightFx",v)}  optKey="lightFx"/>
        </div>
      );

      case "brand": return (
        <div className="fade-in">
          <div className="stage-num">Step 09 / 09</div>
          <div className="stage-title">BRANDING</div>
          <div className="stage-desc">Final frame — locked across all scenes.</div>
          <Sel label="Background Color" value={shared.bg} onChange={setS("bg")} optKey="bg"/>
          <div className="field">
            <div className="field-lbl">Tagline / Slogan</div>
            <input className="txt-input" placeholder="e.g. Engineered for the bold." value={shared.tagline} onChange={e=>setS("tagline")(e.target.value)}/>
          </div>
        </div>
      );

      case "preview": return (
        <div className="fade-in">
          <div className="done-icon">✦</div>
          <div className="done-title">{scenes.length>1?`${scenes.length} SCENES READY`:"PROMPT READY"}</div>
          <div className="done-sub">
            Built for: <strong style={{color:"var(--blue-bright)"}}>{shared.product}</strong><br/>
            {scenes.length>1?`${scenes.length} scenes — paste each into your AI video platform in order.`:"Your prompt is ready — paste it into your preferred AI video platform."}
          </div>
          {(shared.platform || shared.platformStyle || shared.platformHook) && (
            <div className="done-platform-badge">
              {shared.platform && <div className="done-plat-pill">{shared.platform}</div>}
              {shared.platformStyle && <div className="done-style-pill">{shared.platformStyle}</div>}
              {shared.platformHook && <div className="done-style-pill">{shared.platformHook}</div>}
              {shared.platformDuration && <div className="done-style-pill">{shared.platformDuration}</div>}
            </div>
          )}
          {pipelineMode==="both" && imgPromptText && (
            <>
              <div className="pipeline-step-badge">Step 1 — Generate this image</div>
              <div className="preview-card" style={{marginBottom:16}}>
                <div className="preview-hd">
                  <div className="preview-title">Image Prompt</div>
                  <button className={`copy-btn${copiedImg?" copied":""}`} onClick={()=>{navigator.clipboard.writeText(imgPromptText);setCopiedImg(true);setTimeout(()=>setCopiedImg(false),2000);}}>
                    {copiedImg?"✓ Copied!":"Copy"}
                  </button>
                </div>
                <div className="preview-body">{imgPromptText}</div>
              </div>
              <div className="pipeline-step-badge" style={{marginTop:8,marginBottom:16}}>Step 2 — Animate with this prompt</div>
            </>
          )}
          {scenes.length>1&&(
            <div className="scene-preview-tabs">
              {scenes.map((_,i)=>(
                <div key={i} className={`sp-tab${previewScene===i?" active":""}`} onClick={()=>setPreviewScene(i)}>Scene {i+1}{i===0?" (Anchor)":""}</div>
              ))}
              <div className={`sp-tab${previewScene===-1?" active":""}`} onClick={()=>setPreviewScene(-1)}>All</div>
            </div>
          )}
          <div className="preview-card">
            <div className="preview-hd">
              <div className="preview-title">{previewScene===-1?"All Scenes":`Scene ${previewScene+1}`}</div>
              <button
                className={`copy-btn${copied===(previewScene===-1?"all":previewScene)?" copied":""}`}
                onClick={()=>copy(previewScene===-1?"all":previewScene as number)}
              >
                {copied===(previewScene===-1?"all":previewScene)?"✓ Copied!":"Copy"}
              </button>
            </div>
            <div className="preview-body">
              {previewScene===-1?allPrompts:getPrompt(shared,scenes[previewScene],previewScene+1,scenes.length)}
            </div>
          </div>
          {scenes.length>1&&(
            <button className={`copy-all-btn${copied==="all"?" copied":""}`} onClick={()=>copy("all")}>
              {copied==="all"?"✓ All Scenes Copied!":"⬆ Copy All Scenes"}
            </button>
          )}
          {scenes.length===1&&(
            <button className={`copy-all-btn${copied===0?" copied":""}`} onClick={()=>copy(0)}>
              {copied===0?"✓ Prompt Copied!":"⬆ Copy Prompt"}
            </button>
          )}
          {plan==="free"&&(
            <div className="watermark-note">
              ⚠ Free tier — copied prompts include a SceneBloc watermark.{" "}
              <strong style={{cursor:"pointer",textDecoration:"underline"}} onClick={()=>router.push("/pricing")}>Upgrade to remove it →</strong>
              {!user&&<> <strong style={{cursor:"pointer",textDecoration:"underline"}} onClick={()=>router.push("/auth")}> Sign in</strong> to save history.</>}
            </div>
          )}
          <button
            className={`save-btn${saved?" saved":""}`}
            onClick={savePrompt}
            disabled={saving}
          >
            {saved?"✓ Saved to Account":saving?"Saving…":(user?"⬆ Save to Account":"⬆ Save to Account (Sign In Required)")}
          </button>
          <button className={`share-btn${shared_link?" shared":""}`} onClick={shareLink}>
            {shared_link ? "✓ Link Copied to Clipboard!" : "↗ Share Prompt via Link"}
          </button>

          {/* ── VOICEOVER SCRIPT ── */}
          <button className="ai-generate-btn" onClick={generateVoiceover} disabled={loadingVoiceover}>
            {loadingVoiceover
              ? <><span className="ai-dot"/><span className="ai-dot"/><span className="ai-dot"/> Generating script…</>
              : "🎙 Generate Voiceover Script"}
          </button>
          {voiceoverVisible && voiceoverScript && (
            <div className="ai-panel fade-in">
              <div className="ai-panel-hd">
                <div className="ai-panel-title">Voiceover Script</div>
                <button className="ai-panel-copy" onClick={()=>{navigator.clipboard.writeText(voiceoverScript);setCopiedVoiceover(true);setTimeout(()=>setCopiedVoiceover(false),2000);}}>
                  {copiedVoiceover?"✓ Copied":"Copy"}
                </button>
              </div>
              <div className="ai-panel-body">
                <div className="voiceover-text">{voiceoverScript}</div>
              </div>
            </div>
          )}

          {/* ── A/B VARIATIONS ── */}
          <button className="ai-generate-btn" onClick={generateVariations} disabled={loadingVariations} style={{marginTop:8}}>
            {loadingVariations
              ? <><span className="ai-dot"/><span className="ai-dot"/><span className="ai-dot"/> Generating variations…</>
              : "⚡ Generate A/B Variations"}
          </button>
          {variationsVisible && abVariations && (
            <div className="ai-panel fade-in">
              <div className="ai-panel-hd">
                <div className="ai-panel-title">A/B Variations</div>
              </div>
              <div className="ai-panel-body">
                <div className="variation-group">
                  <div className="variation-group-title">Hook Variations — opening 3 seconds</div>
                  {abVariations.hookVariations.map((v,i)=>(
                    <div key={i} className="variation-item">
                      <div className="variation-letter">HOOK {String.fromCharCode(65+i)}</div>
                      {v}
                    </div>
                  ))}
                </div>
                <div className="variation-group">
                  <div className="variation-group-title">Emotional Angle Variations</div>
                  {abVariations.emotionalAngles.map((v,i)=>(
                    <div key={i} className="variation-item">
                      <div className="variation-letter">ANGLE {String.fromCharCode(65+i)}</div>
                      {v}
                    </div>
                  ))}
                </div>
                <div className="variation-group">
                  <div className="variation-group-title">CTA Variations</div>
                  {abVariations.ctaVariations.map((v,i)=>(
                    <div key={i} className="variation-item">
                      <div className="variation-letter">CTA {String.fromCharCode(65+i)}</div>
                      {v}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {upgradeMsg && (
            <div className="upgrade-notice fade-in">
              <div className="upgrade-notice-icon">⚡</div>
              <div className="upgrade-notice-text">
                {upgradeMsg}
                <br/>
                <button className="upgrade-notice-btn" onClick={()=>router.push("/pricing")}>
                  Upgrade to Pro →
                </button>
              </div>
            </div>
          )}

          <button className="btn-outline" onClick={addScene} style={{marginTop:8}}>+ Add Scene {scenes.length+1} — Continue This Video</button>
          <button className="btn-outline" onClick={reset} style={{marginTop:4}}>↺ Build a New Commercial</button>
        </div>
      );
      default: return null;
    }
  };

  const isPreview = visibleStages[stage]?.id==="preview";

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="logo">
            <span className="logo-scene">SCENE</span>
            <span className="logo-bloc">BLOC</span>
          </div>
          <div className="header-right">
            <div className="stage-pill"><div className="dot"/>{visibleStages[stage]?.label}</div>
            {user ? (
              <>
                <button className="auth-header-btn" onClick={()=>router.push("/history")}>
                  <div className="auth-user-dot"/>History
                </button>
                <button className="auth-header-btn" onClick={()=>router.push("/profile")}>Profile</button>
              </>
            ) : (
              <button className="auth-header-btn" onClick={()=>router.push("/auth")}>Sign In</button>
            )}
          </div>
        </div>
        <div className="progress-wrap">
          {visibleStages.map((s,i)=>(
            <div key={s.id+activeScene} className={`prog-bar${i<stage?" done":i===stage?" active":""}`} onClick={()=>setStage(i)}/>
          ))}
        </div>
        <div className="prog-labels">
          {visibleStages.map((s,i)=>(
            <div key={s.id+activeScene} className={`prog-lbl${i===stage?" active":i<stage?" done":""}`} onClick={()=>setStage(i)}>{s.short}</div>
          ))}
        </div>
        {isPreview&&(
          <div className="scene-bar">
            {scenes.map((_,i)=>(
              <div key={i} className={`scene-tab${activeScene===i?" active":""}`} onClick={()=>setActiveScene(i)}>
                {i===0&&<div className="scene-dot"/>}Scene {i+1}{i===0?" (Anchor)":""}
              </div>
            ))}
            <button className="add-scene-btn" onClick={addScene}>+ Scene {scenes.length+1}</button>
          </div>
        )}
        <div className="content">
          {renderContent()}
          {!isPreview&&(
            <div className="nav-row">
              {stage>0&&<button className="btn-back" onClick={()=>setStage(s=>s-1)}>← Back</button>}
              <button className="btn-next" onClick={()=>setStage(s=>s+1)}>
                {stage===visibleStages.length-2?(isNewScene?"Build Scene →":"Build Prompt →"):"Continue →"}
              </button>
            </div>
          )}
        </div>
        {isPreview&&(
          <div className="float-copy-bar">
            <span className="float-copy-label">{scenes.length>1?`${scenes.length} scenes ready`:"Prompt ready"}</span>
            <button className={`float-copy-btn${copied==="all"||copied===0?" copied":""}`} onClick={()=>copy(scenes.length>1?"all":0)}>
              {copied==="all"||copied===0?"✓ Copied!":"Copy All"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
