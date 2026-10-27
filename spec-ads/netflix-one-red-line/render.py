#!/usr/bin/env python3
"""Render 'One red line' in 16:9 (1920x1080) and a true 9:16 re-layout (1080x1920), 60 fps.

  python render.py                         # both formats -> out/
  python render.py --format land           # one format
  python render.py --stills 1.2,4,7.5      # PNG frames for review
  python render.py --contact               # contact sheet, one frame every 0.5 s
"""
from __future__ import annotations

import argparse
import multiprocessing as mp
import os
import subprocess
import sys
import time

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from engine import font_family  # noqa: E402
from film import DURATION, FPS, Film  # noqa: E402
import score  # noqa: E402

FORMATS = {"land": (1920, 1080), "port": (1080, 1920)}
_FILM = None


def _init(fmt):
    global _FILM
    if _FILM is None or (_FILM.W, _FILM.H) != FORMATS[fmt]:
        _FILM = Film(*FORMATS[fmt])


def _frame(i):
    return i, _FILM.render(i / FPS, i).tobytes()


def render_video(fmt, out, workers, crf, start, end):
    W, H = FORMATS[fmt]
    _init(fmt)  # build assets once in the parent; workers inherit them via fork
    frames = range(int(round(start * FPS)), int(round(end * FPS)))
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-tune", "grain", "-maxrate", "40M", "-bufsize", "80M",
           "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
           "-movflags", "+faststart", out]
    enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    ctx = mp.get_context("fork")
    with ctx.Pool(workers) as pool:
        for n, (i, buf) in enumerate(pool.imap(_frame, frames, chunksize=2)):
            enc.stdin.write(buf)
            if n % 60 == 0:
                el = time.time() - t0
                print(f"  [{fmt}] frame {i}/{frames.stop}  {el:6.1f}s", flush=True)
    enc.stdin.close()
    enc.wait()
    print(f"  [{fmt}] done in {time.time() - t0:.1f}s -> {out}")


def stills(fmt, times, outdir):
    _init(fmt)
    paths = []
    for t in times:
        img = _FILM.render(t, int(t * FPS))
        p = os.path.join(outdir, f"{fmt}_{t:05.2f}.png")
        cv2.imwrite(p, img[..., ::-1])
        paths.append(p)
    return paths


def contact(fmt, outdir, step=0.5, workers=4):
    _init(fmt)
    times = np.arange(0.0, DURATION, step)
    ctx = mp.get_context("fork")
    with ctx.Pool(workers) as pool:
        frames = pool.map(_frame, [int(round(t * FPS)) for t in times])
    W, H = FORMATS[fmt]
    cols = 6 if W > H else 8
    tw = 320 if W > H else 200
    th = int(tw * H / W)
    rows = (len(frames) + cols - 1) // cols
    sheet = np.zeros((rows * (th + 24), cols * tw, 3), np.uint8)
    for n, (i, buf) in enumerate(frames):
        img = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        small = cv2.resize(img, (tw, th), interpolation=cv2.INTER_AREA)
        r, c = divmod(n, cols)
        sheet[r * (th + 24):r * (th + 24) + th, c * tw:(c + 1) * tw] = small
        cv2.putText(sheet, f"{i / FPS:.1f}s", (c * tw + 6, r * (th + 24) + th + 17), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (160, 160, 160), 1)
    p = os.path.join(outdir, f"contact_{fmt}.png")
    cv2.imwrite(p, sheet[..., ::-1])
    return p


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--format", choices=["land", "port", "both"], default="both")
    ap.add_argument("--out", default=os.path.join(HERE, "out"))
    ap.add_argument("--workers", type=int, default=os.cpu_count() or 4)
    ap.add_argument("--crf", type=int, default=18)
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--end", type=float, default=DURATION)
    ap.add_argument("--stills", help="comma-separated times in seconds")
    ap.add_argument("--contact", action="store_true")
    ap.add_argument("--no-music", action="store_true", help="skip muxing the score")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    print(f"typeface: {font_family()}")
    fmts = ["land", "port"] if a.format == "both" else [a.format]
    for f in fmts:
        if a.stills:
            for p in stills(f, [float(x) for x in a.stills.split(",")], a.out):
                print(p)
        elif a.contact:
            print(contact(f, a.out, workers=a.workers))
        else:
            W, H = FORMATS[f]
            name = "netflix_one_red_line_16x9.mp4" if W > H else "netflix_one_red_line_9x16.mp4"
            path = os.path.join(a.out, name)
            render_video(f, path, a.workers, a.crf, a.start, a.end)
            if not a.no_music and a.start == 0.0 and a.end == DURATION:
                wav = os.path.join(a.out, "score.wav")
                if not os.path.exists(wav):
                    score.write_wav(wav, score.score())
                score.mux(path, wav, path)
                print(f"  [{f}] score muxed")


if __name__ == "__main__":
    main()
