"""Finish the Cycles renders from src/tub3d.py.

  python3 src/tub3d_post.py --format 16x9

Reads out/tub3d/raw_<fmt>/fNNNN.png (16-bit straight-alpha RGBA), adds a
soft glow around the bright highlights (the ring, the mouth glow, embers),
then writes:
  popcorn_tub3d_<fmt>_60fps_full.mp4         over the purple hyperspace background
  popcorn_tub3d_<fmt>_alpha_prores4444.mov   transparent, for editors
  png_<fmt>/                                 transparent PNG sequence
"""
import argparse
import glob
import os
import subprocess
import sys

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from popbox2 import Hyperspace  # noqa: E402

FPS = 60
ROOT = os.path.join(os.path.dirname(__file__), "..", "out", "tub3d")


def load(path):
    a = cv2.imread(path, cv2.IMREAD_UNCHANGED).astype(np.float32) / 65535.0
    a = a[..., [2, 1, 0, 3]]
    a[..., :3] *= a[..., 3:4]          # -> premultiplied
    return a


def glow(c):
    """Glow only where it belongs: the neon ring (saturated magenta) and the
    truly blown-out hot spots (mouth glow, embers). Ordinary bright popcorn
    and white stripes get no glow, so the image stays crisp and saturated."""
    rgb = c[..., :3]
    a = np.maximum(c[..., 3:4], 1e-4)
    st = rgb / a
    r, g, b = st[..., 0], st[..., 1], st[..., 2]
    neon = np.clip((np.minimum(r, b) - g - 0.25) / 0.25, 0, 1) * np.clip((np.maximum(r, b) - 0.6) / 0.3, 0, 1)
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    hot = np.clip((y - 0.985) / 0.015, 0, 1)
    src = rgb * (neon * 1.0 + hot * 0.25)[..., None]
    h, w = rgb.shape[:2]
    acc = np.zeros_like(rgb)
    for f, sig, k in ((4, 3, 0.7), (8, 6, 0.6), (16, 8, 0.5)):
        s_ = cv2.resize(src, (w // f, h // f), interpolation=cv2.INTER_AREA)
        s_ = cv2.GaussianBlur(s_, (0, 0), sig)
        acc += cv2.resize(s_, (w, h), interpolation=cv2.INTER_LINEAR) * k
    out = c.copy()
    out[..., :3] += acc
    out[..., 3] = np.maximum(out[..., 3], np.clip(acc.max(axis=2), 0, 1))
    return out


def grade(o):
    """Final look: clean blacks, gentle S-curve, richer colour (no hue shifts)."""
    o = np.clip((o - 0.03) / 0.97, 0, None)
    o = np.where(o > 0.95, 0.95 + (1 - np.exp(-(o - 0.95) * 8)) * 0.05, o)
    o = np.clip(o, 0, 1)
    lum = (0.2126 * o[..., 0] + 0.7152 * o[..., 1] + 0.0722 * o[..., 2])[..., None]
    o = np.clip(lum + (o - lum) * 1.18, 0, 1)
    return o * o * (3 - 2 * o) * 0.35 + o * 0.65


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--format", default="16x9")
    a = ap.parse_args()
    raw = sorted(glob.glob(os.path.join(ROOT, f"raw_{a.format}", "f*.png")))
    assert raw, "no renders found"
    h, w = cv2.imread(raw[0], cv2.IMREAD_UNCHANGED).shape[:2]
    seq = os.path.join(ROOT, f"png_{a.format}")
    os.makedirs(seq, exist_ok=True)
    hs = Hyperspace(w, h)
    yy = np.linspace(-1, 1, h)[:, None]
    xx = np.linspace(-1, 1, w)[None, :]
    vig = (1 - 0.32 * np.clip(xx ** 2 + yy ** 2, 0, 1.6))[..., None].astype(np.float32)
    full = os.path.join(ROOT, f"popcorn_tub3d_{a.format}_60fps_full.mp4")
    enc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                            "-s", f"{w}x{h}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow",
                            "-crf", "17", "-profile:v", "high", "-level", "4.2", "-maxrate", "12M",
                            "-bufsize", "24M", "-pix_fmt", "yuv420p", "-movflags", "+faststart", full],
                           stdin=subprocess.PIPE)
    for i, p in enumerate(raw):
        c = np.clip(glow(load(p)), 0, None)
        al = np.clip(c[..., 3:4], 0, 1)
        straight = np.where(al > 1e-4, c[..., :3] / np.maximum(al, 1e-4), 0)
        rgba = np.concatenate([np.clip(straight, 0, 1), al], 2)
        cv2.imwrite(os.path.join(seq, f"popcorn_tub3d_{a.format}_{i:04d}.png"),
                    (rgba[..., [2, 1, 0, 3]] * 255 + 0.5).astype(np.uint8))
        bg = np.clip(hs.frame(i / FPS), 0, 1)
        o = grade((c[..., :3] + bg * (1 - al)) * vig)
        enc.stdin.write((np.clip(o, 0, 1) * 255 + 0.5).astype(np.uint8).tobytes())
    enc.stdin.close()
    enc.wait()
    mov = os.path.join(ROOT, f"popcorn_tub3d_{a.format}_alpha_prores4444.mov")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i",
                    os.path.join(seq, f"popcorn_tub3d_{a.format}_%04d.png"), "-c:v", "prores_ks",
                    "-profile:v", "4444", "-pix_fmt", "yuva444p10le", "-alpha_bits", "16", "-vendor", "apl0", mov],
                   check=True)
    print("wrote", full, mov, len(raw), "frames")


if __name__ == "__main__":
    main()
