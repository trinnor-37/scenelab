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

  #blob-bg {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  }

  .app {
    min-height: 100vh;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    position: relative;
    z-index: 2;
  }

  /* ── PARTICLES ── */
  #particles-canvas {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
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
    font-size: clamp(15px, 3vw, 20px);
    color: var(--muted2);
    font-weight: 300;
    font-style: italic;
    line-height: 1.72;
    max-width: 460px;
    margin: 0 auto 56px;
    letter-spacing: 0.01em;
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
`;

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
  { id:"product",   short:"Product", label:"Product Brief" },
  { id:"reference", short:"Frames",  label:"Frame Setup" },
  { id:"visual",    short:"Visual",  label:"Visual DNA" },
  { id:"light",     short:"Light",   label:"Landscape" },
  { id:"choreo",    short:"Motion",  label:"Motion" },
  { id:"brand",     short:"Brand",   label:"Branding" },
  { id:"preview",   short:"Done",    label:"Done" },
];

const EMPTY_SCENE  = { envA:"", envB:"", lightTrans:"", detail1:"", motion:"", detail2:"", particles:"", lightFx:"", refMode:"none", refImgs:[] as string[], startImg:null as string|null, endImg:null as string|null, cameraAngle:"", cameraMovement:"", timeOfDay:"", weather:"", shotDuration:"" };
const EMPTY_SHARED = { product:"", commercialStyle:"", aesthetic:"", optics:"", atmosphere:"", bg:"", tagline:"", colorGrading:"" };

// ── BLOB BACKGROUND ───────────────────────────────────────────────────
function BlobBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let t = 0;

    const blobs = [
      { x:.14, y:.20, r:.58, vx:.00018, vy:.00012, ph:0,    ho:205 },
      { x:.76, y:.14, r:.64, vx:-.00015,vy:.00018, ph:1.05, ho:280 },
      { x:.50, y:.56, r:.54, vx:.00022, vy:-.00015,ph:2.10, ho:162 },
      { x:.88, y:.78, r:.60, vx:-.00018,vy:.00022, ph:3.15, ho:318 },
      { x:.08, y:.68, r:.50, vx:.00012, vy:-.00018,ph:4.20, ho:58  },
      { x:.62, y:.88, r:.47, vx:-.00020,vy:.00010, ph:5.25, ho:142 },
      { x:.30, y:.38, r:.52, vx:.00016, vy:.00020, ph:0.52, ho:248 },
      { x:.47, y:.07, r:.45, vx:.00020, vy:.00015, ph:1.80, ho:300 },
      { x:.92, y:.36, r:.42, vx:-.00022,vy:.00012, ph:2.65, ho:180 },
    ];

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      // Paint dark base so blobs have a solid backdrop
      ctx.fillStyle = "rgb(2,8,16)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      blobs.forEach(b => {
        b.ph += .003;
        b.x += b.vx; b.y += b.vy;
        if (b.x < -.15 || b.x > 1.15) b.vx *= -1;
        if (b.y < -.15 || b.y > 1.15) b.vy *= -1;
        const cx = b.x * canvas.width;
        const cy = b.y * canvas.height;
        const r  = b.r * Math.min(canvas.width, canvas.height);
        const mr = r * (0.9 + 0.1 * Math.sin(b.ph));
        const hue = (b.ho + t * 18) % 360;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, mr);
        g.addColorStop(0,   `hsla(${hue},100%,65%,0.54)`);
        g.addColorStop(.45, `hsla(${(hue+110)%360},100%,55%,0.28)`);
        g.addColorStop(1,   "transparent");
        ctx.save();
        ctx.filter = "blur(40px)";
        ctx.beginPath();
        for (let i = 0; i <= 28; i++) {
          const a = (i/28)*Math.PI*2;
          const w = 1 + .18*Math.sin(a*3+b.ph) + .09*Math.sin(a*5+b.ph*.7);
          const px = cx + Math.cos(a)*mr*w;
          const py = cy + Math.sin(a)*mr*w;
          i ? ctx.lineTo(px,py) : ctx.moveTo(px,py);
        }
        ctx.closePath();
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
      });
      t += .005;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} id="blob-bg" />;
}

// ── FLOATING PARTICLES ───────────────────────────────────────────────
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const count = 80;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      vy: -(Math.random() * 0.35 + 0.12),
      vx: (Math.random() - 0.5) * 0.18,
      alpha: Math.random() * 0.55 + 0.08,
      flicker: Math.random() * Math.PI * 2,
      flickerSpeed: Math.random() * 0.03 + 0.01,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y += p.vy;
        p.x += p.vx;
        p.flicker += p.flickerSpeed;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.flicker));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,230,255,${a})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} id="particles-canvas" />;
}

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
  return `═══════════════════════════════
SCENE ${sceneNum} OF ${totalScenes}${isCont?" — CONTINUATION":""}
═══════════════════════════════
PRODUCT: ${shared.product||"—"}
COMMERCIAL STYLE: ${shared.commercialStyle||"—"}
SHOT DURATION: ${dur}
${contNote}
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
Tagline: "${shared.tagline||"Your Slogan Here"}"`;
}

// ── MAIN APP ──────────────────────────────────────────────────────────
export default function App() {
  const router = useRouter();
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
  const [plan, setPlan]               = useState<"free"|"pro">("free");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

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

  const fetchPlan = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("plan").eq("id", userId).single();
    if (data?.plan) setPlan(data.plan as "free"|"pro");
  };

  const setS  = (k: string) => (v: string) => setShared(p=>({...p,[k]:v}));
  const setScene = (idx: number, k: string, v: unknown) => setScenes(prev=>prev.map((s,i)=>i===idx?{...s,[k]:v}:s));
  const sc = scenes[activeScene];
  const isNewScene = activeScene > 0;

  const refValid = sc.refMode==="none"
    || (sc.refMode==="reference" && sc.refImgs.length>=1)
    || (sc.refMode==="startend" && !!sc.startImg && !!sc.endImg);

  const valid = [
    shared.product.trim().length>=2 && !!shared.commercialStyle,
    refValid,
    !isNewScene ? !!(shared.aesthetic && shared.optics && shared.atmosphere) : true,
    !!(sc.envA && sc.envB && sc.lightTrans),
    !!(sc.detail1 && sc.motion && sc.detail2 && sc.particles && sc.lightFx),
    !!shared.bg,
    true,
  ];

  const addScene = () => {
    const newIdx = scenes.length;
    setScenes(prev=>[...prev,{...EMPTY_SCENE}]);
    setActiveScene(newIdx);
    setStage(1);
  };

  const allPrompts = scenes.map((s,i)=>buildScenePrompt(shared,s,i+1,scenes.length)).join("\n\n");

  const copy = (which: number|"all") => {
    const raw = which==="all" ? allPrompts : buildScenePrompt(shared,scenes[which as number],(which as number)+1,scenes.length);
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
    if (plan === "pro") return text;
    return text + "\n\n━━━━━━━━━━━━━━━━━━━━━━━\nCreated with SceneBloc Free · Upgrade at sceneblocapp.com\n━━━━━━━━━━━━━━━━━━━━━━━";
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

  const reset = () => { setStage(0);setActiveScene(0);setPreviewScene(0);setShared({...EMPTY_SHARED});setScenes([{...EMPTY_SCENE}]); };

  const visibleStages = isNewScene ? STAGES.filter(s=>!["product","visual","brand"].includes(s.id)) : STAGES;

  // ── HERO ────────────────────────────────────────────────────────────
  if (!started) return (
    <>
      <style>{css}</style>
      <BlobBackground />
      <Particles />
      <div className="app">
        <div className="hero fade-in">
          <div className="hero-eyebrow">AI Video Prompt Builder</div>
          <div className="hero-logo">
            <span className="hero-logo-scene">SCENE</span>
            <span className="hero-logo-bloc">BLOC</span>
          </div>
          <p className="hero-tagline">
            Craft cinematic AI video prompts for luxury product commercials — in seconds.
          </p>
          <div className="hero-features">
            <div className="hero-feat"><div className="hero-feat-dot"/><span>Multi-Scene Support</span></div>
            <div className="hero-feat"><div className="hero-feat-dot"/><span>Mood Board Upload</span></div>
            <div className="hero-feat"><div className="hero-feat-dot"/><span>4-Stage Choreography</span></div>
            <div className="hero-feat"><div className="hero-feat-dot"/><span>Start &amp; End Frames</span></div>
          </div>
          <button className="hero-cta" onClick={()=>setStarted(true)}>
            Begin Building →
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
          <div className="stage-num">Step 01 / 06</div>
          <div className="stage-title">PRODUCT BRIEF</div>
          <div className="stage-desc">Tell us exactly what you&apos;re advertising. This shapes every scene.</div>
          <div className="field">
            <div className="field-lbl">Product Name &amp; Description</div>
            <input className="txt-input" placeholder="e.g. A luxurious Swiss automatic watch" value={shared.product} onChange={e=>setS("product")(e.target.value)}/>
            <div className="hint">Try: "A premium skincare serum" · "A limited-edition sneaker" · "A high-end perfume bottle"</div>
          </div>
          <Sel label="Commercial Style / Tone" value={shared.commercialStyle} onChange={setS("commercialStyle")} optKey="commercialStyle" placeholder="How should this feel?"/>
        </div>
      );

      case "reference": return (
        <div className="fade-in">
          <div className="stage-num">{isNewScene?`Scene ${activeScene+1} — Step 1`:"Step 02 / 06"}</div>
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
          <div className="stage-num">Step 03 / 06</div>
          <div className="stage-title">VISUAL DNA</div>
          <div className="stage-desc">These lock across all scenes to keep your entire video consistent.</div>
          <Sel label="Aesthetic" value={shared.aesthetic} onChange={setS("aesthetic")} optKey="aesthetic"/>
          <Sel label="Optics / Lens" value={shared.optics} onChange={setS("optics")} optKey="optics"/>
          <Sel label="Atmosphere" value={shared.atmosphere} onChange={setS("atmosphere")} optKey="atmosphere"/>
          <div className="section-label">Color</div>
          <Sel label="Color Grading" value={shared.colorGrading} onChange={setS("colorGrading")} optKey="colorGrading" placeholder="Choose a grade (optional)"/>
        </div>
      );

      case "light": return (
        <div className="fade-in">
          <div className="stage-num">{isNewScene?`Scene ${activeScene+1} — Step 2`:"Step 04 / 06"}</div>
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
          <div className="stage-num">{isNewScene?`Scene ${activeScene+1} — Step 3`:"Step 05 / 06"}</div>
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
          <div className="stage-num">Step 06 / 06</div>
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
              {previewScene===-1?allPrompts:buildScenePrompt(shared,scenes[previewScene],previewScene+1,scenes.length)}
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
              ⚠ Free tier — copied prompts include a SceneBloc watermark.{!user&&<> <strong style={{cursor:"pointer",textDecoration:"underline"}} onClick={()=>router.push("/auth")}>Sign in</strong> to save history.</>}
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
          <button className="btn-outline" onClick={addScene}>+ Add Scene {scenes.length+1} — Continue This Video</button>
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
      <BlobBackground />
      <Particles />
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
            <div key={s.id+activeScene} className={`prog-bar${i<stage?" done":i===stage?" active":""}`} onClick={()=>i<=stage&&setStage(i)}/>
          ))}
        </div>
        <div className="prog-labels">
          {visibleStages.map((s,i)=>(
            <div key={s.id+activeScene} className={`prog-lbl${i===stage?" active":i<stage?" done":""}`} onClick={()=>i<=stage&&setStage(i)}>{s.short}</div>
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
              <button className="btn-next" disabled={!valid[stage]} onClick={()=>setStage(s=>s+1)}>
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
