#!/usr/bin/env python3
"""Zest 20s launch: renders timeline.json into a 9:16 MP4.

The real can is composited from the supplied cut-out photos (assets/can_closed.png,
assets/can_open.png). It is only ever moved and uniformly scaled; its pixels are
never generated, recoloured, warped, rotated or painted over. Anything missing
(can photos, generated plates, SFX) falls back to a labelled placeholder, so the
same script produces the animatic now and the finished cut later.

Usage: python3 build.py [--out out/zest_launch_20s_9x16.mp4] [--stills]
"""
import argparse
import json
import math
import random
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
CACHE = ROOT / ".cache"

TL = json.loads((ROOT / "timeline.json").read_text())
W, H, FPS, DUR = TL["width"], TL["height"], TL["fps"], TL["duration"]
NFRAMES = int(round(DUR * FPS))
POP = TL["pop_time"]
INK = TL["colors"]["ink"]


# ---------- easing ----------

def clamp01(v):
    return max(0.0, min(1.0, v))


def ease_out_cubic(p):
    return 1 - (1 - p) ** 3


def ease_in_out_cubic(p):
    return 4 * p ** 3 if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2


def ease_out_back(p, s=1.70158):
    return 1 + (s + 1) * (p - 1) ** 3 + s * (p - 1) ** 2


def lerp(a, b, p):
    return a + (b - a) * p


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# ---------- fonts / text ----------

_fonts = {}


def font(size, body=False):
    key = (size, body)
    if key not in _fonts:
        path = TL["font_body"] if body else TL["font"]
        try:
            _fonts[key] = ImageFont.truetype(path, size)
        except OSError:
            _fonts[key] = ImageFont.load_default(size)
    return _fonts[key]


_text_cache = {}


def text_img(text, size, body=False, color=INK):
    key = (text, size, body, color)
    if key not in _text_cache:
        f = font(size, body)
        l, t, r, b = f.getbbox(text)
        img = Image.new("RGBA", (r - l + 8, b - t + 8), (0, 0, 0, 0))
        ImageDraw.Draw(img).text((4 - l, 4 - t), text, font=f, fill=color)
        _text_cache[key] = img
    return _text_cache[key]


def with_alpha(img, a):
    if a >= 0.999:
        return img
    out = img.copy()
    out.putalpha(out.getchannel("A").point(lambda v: int(v * a)))
    return out


# ---------- backgrounds and plates ----------

_bg_cache = {}


def gradient(top, bottom):
    key = (top, bottom)
    if key not in _bg_cache:
        mask = Image.linear_gradient("L").resize((W, H))
        _bg_cache[key] = Image.composite(
            Image.new("RGB", (W, H), hex_rgb(bottom)), Image.new("RGB", (W, H), hex_rgb(top)), mask
        ).convert("RGBA")
    return _bg_cache[key]


def plate_frames(name):
    """Extracts a generated plate (assets/plates/<name>.mp4) to cached 1080x1920 frames."""
    src = ASSETS / "plates" / f"{name}.mp4"
    if not src.exists():
        return None
    out = CACHE / name
    if not out.exists():
        out.mkdir(parents=True)
        subprocess.run(
            ["ffmpeg", "-v", "error", "-i", str(src), "-vf",
             f"fps={FPS},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}",
             str(out / "%05d.jpg")],
            check=True,
        )
    return sorted(out.glob("*.jpg"))


_plates = {}


def plate_at(name, local_t):
    if name not in _plates:
        _plates[name] = plate_frames(name)
    frames = _plates[name]
    if not frames:
        return None
    i = min(int(local_t * FPS), len(frames) - 1)
    return Image.open(frames[i]).convert("RGBA")


# ---------- the real can ----------

def placeholder_can(state):
    w, h = 420, 800
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((10, 30, w - 10, h - 10), 70, fill=(236, 236, 240, 255), outline=(150, 150, 160, 255), width=6)
    d.rounded_rectangle((40, 10, w - 40, 70), 30, fill=(205, 205, 212, 255))
    if state == "open":
        d.ellipse((w // 2 - 40, 18, w // 2 + 40, 58), fill=(90, 90, 100, 255))
    f = font(44, body=True)
    for i, line in enumerate(["REAL CAN", "PHOTO", f"({state})", "composite", "only"]):
        tw = f.getlength(line)
        d.text(((w - tw) / 2, 290 + i * 60), line, font=f, fill=(110, 110, 120, 255))
    return img


_can_src = {}


def can_source(state):
    if state not in _can_src:
        path = ASSETS / f"can_{state}.png"
        if not path.exists() and state == "open":
            path = ASSETS / "can_closed.png"  # no open-can photo yet: hold the closed can
        if path.exists():
            img = Image.open(path).convert("RGBA")
            bbox = img.getchannel("A").getbbox()
            _can_src[state] = img.crop(bbox) if bbox else img
        else:
            _can_src[state] = placeholder_can(state)
    return _can_src[state]


_can_sized = {}
_upscale_warned = set()


def can_at_height(state, px):
    key = (state, px)
    if key not in _can_sized:
        src = can_source(state)
        if px > src.height and state not in _upscale_warned and (ASSETS / f"can_{state}.png").exists():
            print(f"warning: can_{state}.png is {src.height}px tall but is shown at {px}px; supply a larger photo", file=sys.stderr)
            _upscale_warned.add(state)
        w = max(1, round(src.width * px / src.height))
        _can_sized[key] = src.resize((w, px), Image.LANCZOS)
    return _can_sized[key]


_shadow = None


def shadow_img(w):
    global _shadow
    if _shadow is None:
        base = Image.new("RGBA", (600, 160), (0, 0, 0, 0))
        ImageDraw.Draw(base).ellipse((60, 50, 540, 110), fill=(80, 10, 35, 110))
        _shadow = base.filter(ImageFilter.GaussianBlur(22))
    return _shadow.resize((int(w * 1.25), int(w * 1.25 * 160 / 600)))


def can_state(shot, t):
    c = shot["can"]
    p = ease_out_cubic(clamp01((t - c["t0"]) / max(1e-6, c["t1"] - c["t0"])))
    if shot["id"] == "S2":
        p = ease_in_out_cubic(clamp01((t - c["t0"]) / (c["t1"] - c["t0"])))
    pos = {k: lerp(c["from"][k], c["to"][k], p) for k in ("x", "y", "h")}
    c2 = shot.get("can2")
    if c2:
        p2 = ease_in_out_cubic(clamp01((t - c2["t0"]) / (c2["t1"] - c2["t0"])))
        pos = {k: lerp(pos[k], c2["to"][k], p2) for k in ("x", "y", "h")}
    state = c["state"]
    return state, pos


# ---------- procedural placeholder fx ----------

def draw_bubbles(layer, t, seed, behind_box):
    rnd = random.Random(seed)
    d = ImageDraw.Draw(layer)
    for _ in range(46):
        x = rnd.uniform(0.08, 0.92) * W
        speed = rnd.uniform(160, 420)
        r = rnd.uniform(5, 18)
        phase = rnd.uniform(0, H)
        y = H - ((phase + t * speed) % (H + 80))
        a = int(rnd.uniform(70, 150))
        d.ellipse((x - r, y - r, x + r, y + r), outline=(255, 255, 255, a), width=3)


def draw_spray(layer, t, top_xy):
    local = t - POP
    if local < 0 or local > 0.75:
        return
    rnd = random.Random(7)
    d = ImageDraw.Draw(layer)
    fade = 1 - local / 0.75
    for _ in range(90):
        ang = rnd.uniform(-math.pi * 0.92, -math.pi * 0.08)
        v = rnd.uniform(700, 1900)
        r = rnd.uniform(4, 13)
        x = top_xy[0] + math.cos(ang) * v * local
        y = top_xy[1] + math.sin(ang) * v * local + 1400 * local ** 2
        a = int(230 * fade)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, a))


def draw_fruit_placeholder(layer, t):
    p = ease_out_cubic(clamp01(t / 0.12)) if t < 0.12 else 1.0
    cx, cy, r = W * 0.3, lerp(-300, H * 0.33, p), 210
    d = ImageDraw.Draw(layer)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 196, 160, 255), outline=(232, 120, 90, 255), width=16)
    d.ellipse((cx - r + 30, cy - r + 30, cx + r - 30, cy + r - 30), fill=(244, 104, 120, 255))
    for i in range(10):
        a = i * math.pi / 5
        d.line((cx, cy, cx + math.cos(a) * (r - 30), cy + math.sin(a) * (r - 30)), fill=(255, 190, 190, 255), width=6)
    f = font(30, body=True)
    d.text((cx - 120, cy + r + 16), "placeholder: p1 fruit", font=f, fill=(90, 20, 40, 160))


# ---------- supers ----------

def draw_super(frame, sup, t, shake):
    first = sup["parts"][0]["t"]
    if t < first or t > sup["end"]:
        return
    size, body = sup["size"], sup.get("body", False)
    widths = [text_img(p["text"], size, body).width - 8 for p in sup["parts"]]
    x = (W - sum(widths)) / 2
    out_a = clamp01((sup["end"] - t) / 0.2)
    for part, pw in zip(sup["parts"], widths):
        lt = t - part["t"]
        if lt >= 0:
            pin = clamp01(lt / (7 / FPS))
            a = ease_out_cubic(pin) * out_a
            dy = (1 - ease_out_cubic(pin)) * 26
            scale = 1.0
            if part.get("pop"):
                scale = lerp(1.45, 1.0, ease_out_back(clamp01(lt / (8 / FPS))))
                a = out_a
                dy = 0
            img = text_img(part["text"], round(size * scale), body)
            cy = sup["y"] * H + size / 2 + dy + shake[1]
            # anchor on the left edge so a popping word grows away from the word before it
            frame.alpha_composite(with_alpha(img, a), (round(x + shake[0]), round(cy - img.height / 2)))
        x += pw


# ---------- tap-to-shop button ----------

_btn_cache = {}


def button_img(pressed):
    if pressed not in _btn_cache:
        b = TL["button"]
        ss = 2
        w, h = b["w"] * ss, b["h"] * ss
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        fill = TL["colors"]["button_pressed" if pressed else "button"]
        d.rounded_rectangle((0, 0, w - 1, h - 1), h // 2, fill=fill)
        f = font(58 * ss)
        label = b["label"]
        lw = f.getlength(label)
        arrow_w = 70 * ss
        x0 = (w - lw - arrow_w) / 2
        l, tt, r, bb = f.getbbox(label)
        d.text((x0, (h - (bb - tt)) / 2 - tt), label, font=f, fill=TL["colors"]["cream"])
        ax, ay = x0 + lw + 34 * ss, h / 2
        d.line((ax, ay, ax + 34 * ss, ay), fill=TL["colors"]["cream"], width=7 * ss)
        d.line((ax + 18 * ss, ay - 16 * ss, ax + 34 * ss, ay, ax + 18 * ss, ay + 16 * ss), fill=TL["colors"]["cream"], width=7 * ss, joint="curve")
        _btn_cache[pressed] = img.resize((b["w"], b["h"]), Image.LANCZOS)
    return _btn_cache[pressed]


def draw_button(frame, t):
    b = TL["button"]
    if t < b["enter_t0"]:
        return
    pe = ease_out_back(clamp01((t - b["enter_t0"]) / (b["enter_t1"] - b["enter_t0"])), 1.2)
    cy = lerp(H + b["h"], b["y"] * H, pe)
    cx = W / 2
    lt = t - b["press_t"]
    pressed = lt >= 0
    scale, sh_off = 1.0, 14
    pt = t - b["pulse_t"]
    if 0 <= pt < 0.3:
        scale = 1 + 0.035 * math.sin(math.pi * pt / 0.3)
    if pressed:
        if lt < 3 / FPS:
            scale = lerp(1.0, 0.92, lt / (3 / FPS))
        else:
            scale = lerp(0.92, 0.955, ease_out_cubic(clamp01((lt - 3 / FPS) / 0.25)))
        sh_off = 3
    # shadow
    sw, shh = int(b["w"] * scale), int(b["h"] * scale)
    shadow = Image.new("RGBA", (sw + 80, shh + 80), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((40, 40, 40 + sw, 40 + shh), shh // 2, fill=(90, 10, 40, 90 if not pressed else 60))
    shadow = shadow.filter(ImageFilter.GaussianBlur(16 if not pressed else 8))
    frame.alpha_composite(shadow, (round(cx - sw / 2 - 40), round(cy - shh / 2 - 40 + sh_off)))
    img = button_img(pressed).resize((sw, shh), Image.LANCZOS)
    frame.alpha_composite(img, (round(cx - sw / 2), round(cy - shh / 2)))
    # touch point (no hand) + ripple
    tx, ty = cx + b["w"] * 0.18, cy + 6
    over = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    dt = t - (b["press_t"] - 0.22)
    if 0 <= dt < 0.6:
        s = lerp(1.35, 1.0, ease_out_cubic(clamp01(dt / 0.18)))
        if pressed:
            s = 0.82
        a = clamp01(dt / 0.1) * (1 - clamp01((lt - 0.2) / 0.18) if pressed else 1)
        r = 40 * s
        d.ellipse((tx - r, ty - r, tx + r, ty + r), fill=(255, 255, 255, int(120 * a)))
    if 0 <= lt < 0.5:
        p = ease_out_cubic(lt / 0.5)
        r = lerp(30, 300, p)
        d.ellipse((tx - r, ty - r, tx + r, ty + r), outline=(255, 255, 255, int(170 * (1 - p))), width=8)
    frame.alpha_composite(over)


# ---------- frame ----------

def shot_at(t):
    for s in TL["shots"]:
        if s["start"] <= t < s["end"]:
            return s
    return TL["shots"][-1]


def render(fi):
    t = fi / FPS
    shot = shot_at(t)
    local = t - shot["start"]
    plate = plate_at(shot["plate"], local)
    frame = (plate if plate else gradient(*shot["bg"])).copy()
    fx = shot.get("fx", [])
    if not plate:
        lbl = text_img(f"plate: {shot['plate']} (placeholder)", 28, True, "#5A1530")
        frame.alpha_composite(with_alpha(lbl, 0.55), (36, H - 70))

    shake = (0, 0)
    if "shake" in fx:
        k = fi - round(POP * FPS)
        shake = [(0, 0), (9, -7), (-7, 6), (5, -4), (-2, 2)][k] if 0 <= k < 5 else (0, 0)

    state, pos = can_state(shot, t)
    can = can_at_height(state, round(pos["h"] * H))
    cx, cy = pos["x"] * W + shake[0], pos["y"] * H + shake[1]
    left, top = round(cx - can.width / 2), round(cy - can.height / 2)

    back = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if "bubbles" in fx and not plate:
        draw_bubbles(back, t, sum(map(ord, shot["id"])), None)
    if "fruit_placeholder" in fx and not plate:
        draw_fruit_placeholder(back, t)
    frame.alpha_composite(back)

    sh = shadow_img(can.width)
    frame.alpha_composite(sh, (round(cx - sh.width / 2), round(top + can.height - sh.height * 0.45)))
    frame.alpha_composite(can, (left, top))  # the real can: moved and scaled only

    if "spray" in fx:
        spray_plate = plate_at("p2_spray", t - POP) if t - POP < 0.75 else None
        if spray_plate:
            frame = ImageChops.screen(frame.convert("RGB"), spray_plate.convert("RGB")).convert("RGBA")
        else:
            front = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            draw_spray(front, t, (cx, top + 10))
            frame.alpha_composite(front)

    for sup in TL["supers"]:
        draw_super(frame, sup, t, shake)
    draw_button(frame, t)

    k = fi - round(POP * FPS)
    if k in (0, 1):
        frame = Image.blend(frame, Image.new("RGBA", (W, H), (255, 255, 255, 255)), 0.32 if k == 0 else 0.12)
    return frame.convert("RGB")


# ---------- audio ----------

def build_audio(path):
    cues = [c for c in TL["sfx"] if (ASSETS / "sfx" / c["file"]).exists()]
    missing = sorted({c["file"] for c in TL["sfx"]} - {c["file"] for c in cues})
    if missing:
        print(f"sfx missing ({len(missing)}): {', '.join(missing)}", file=sys.stderr)
    if not cues:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
                        "-t", str(DUR), "-c:a", "pcm_s16le", str(path)], check=True)
        return
    cmd = ["ffmpeg", "-v", "error", "-y"]
    chains = []
    for i, c in enumerate(cues):
        cmd += ["-i", str(ASSETS / "sfx" / c["file"])]
        ms = round(c["t"] * 1000)
        chains.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,volume={c['gain_db']}dB,adelay={ms}|{ms}[a{i}]")
    mix = "".join(f"[a{i}]" for i in range(len(cues)))
    graph = ";".join(chains) + f";{mix}amix=inputs={len(cues)}:normalize=0,apad,atrim=0:{DUR},afade=t=out:st={DUR - 0.25}:d=0.25,loudnorm=I=-14:TP=-1:LRA=11[out]"
    cmd += ["-filter_complex", graph, "-map", "[out]", "-ar", "48000", "-c:a", "pcm_s16le", str(path)]
    subprocess.run(cmd, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(ROOT / "out" / "zest_launch_20s_9x16.mp4"))
    ap.add_argument("--stills", action="store_true", help="also write QA stills at the key beats")
    args = ap.parse_args()
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(exist_ok=True)
    video_tmp, audio_tmp = CACHE / "video.mp4", CACHE / "audio.wav"

    enc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
         "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", str(video_tmp)],
        stdin=subprocess.PIPE,
    )
    still_frames = {round(s * FPS): s for s in (0.4, 2.3, 2.4, 2.5, 4.0, 7.0, 10.5, 13.5, 16.5, 18.6, 18.7, 19.97)}
    stills_dir = out.parent / "stills"
    if args.stills:
        stills_dir.mkdir(exist_ok=True)
    for fi in range(NFRAMES):
        img = render(fi)
        enc.stdin.write(img.tobytes())
        if args.stills and fi in still_frames:
            img.save(stills_dir / f"f{fi:03d}_{still_frames[fi]:05.2f}s.jpg", quality=88)
    enc.stdin.close()
    if enc.wait() != 0:
        sys.exit("video encode failed")

    build_audio(audio_tmp)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(video_tmp), "-i", str(audio_tmp), "-c:v", "copy",
                    "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(out)], check=True)
    for p in ("can_closed", "can_open"):
        if not (ASSETS / f"{p}.png").exists():
            print(f"placeholder used: assets/{p}.png not found", file=sys.stderr)
    print(out)


if __name__ == "__main__":
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg is required")
    main()
