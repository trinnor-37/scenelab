"""Render the BingeNest TV logo reveal.

  python3 src/render.py --format 16x9            # full 60 fps H.264 master
  python3 src/render.py --format 9x16
  python3 src/render.py --format 16x9 --stills 0.3 1.5 4.0   # review frames (PNG)
  python3 src/render.py --format 16x9 --contact             # contact sheet
"""
import argparse, os, subprocess, sys, time
import numpy as np
from multiprocessing import Pool
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from scene import Scene, FPS, NFRAMES  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), "..", "out")
_scene = None


def _init(fmt):
    global _scene
    _scene = Scene(fmt)


def _frame(i):
    return i, _scene.render(i)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--format", default="16x9", choices=["16x9", "9x16"])
    ap.add_argument("--stills", nargs="*", type=float)
    ap.add_argument("--contact", action="store_true")
    ap.add_argument("--start", type=int, default=0)
    ap.add_argument("--end", type=int, default=NFRAMES)
    ap.add_argument("--workers", type=int, default=os.cpu_count())
    ap.add_argument("--crf", type=int, default=14)
    ap.add_argument("--out", default=None)
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)

    if a.stills is not None or a.contact:
        times = a.stills if a.stills else [0.15, 0.7, 1.3, 1.7, 2.15, 2.7, 3.3, 3.7, 4.3, 4.75,
                                           5.2, 5.6, 6.0, 6.2, 6.6, 9.9]
        frames = [min(NFRAMES - 1, int(round(tt * FPS))) for tt in times]
        with Pool(a.workers, initializer=_init, initargs=(a.format,)) as pool:
            res = dict(pool.map(_frame, frames))
        ims = []
        for tt, f in zip(times, frames):
            im = Image.fromarray(res[f])
            if not a.contact:
                im.save(os.path.join(OUT, f"still_{a.format}_{tt:05.2f}.png"))
            ims.append(im)
        if a.contact:
            cols = 4
            tw = 480 if a.format == "16x9" else 270
            th = int(tw * ims[0].height / ims[0].width)
            sheet = Image.new("RGB", (cols * tw, ((len(ims) + cols - 1) // cols) * th))
            for k, im in enumerate(ims):
                sheet.paste(im.resize((tw, th), Image.LANCZOS), ((k % cols) * tw, (k // cols) * th))
            sheet.save(os.path.join(OUT, f"contact_{a.format}.png"))
        return

    W, H = (1920, 1080) if a.format == "16x9" else (1080, 1920)
    path = a.out or os.path.join(OUT, f"bingenest_tv_{a.format}_60fps.mp4")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "slow", "-crf", str(a.crf), "-tune", "film",
           "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709",
           "-color_trc", "bt709", "-movflags", "+faststart", path]
    enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    with Pool(a.workers, initializer=_init, initargs=(a.format,)) as pool:
        for n, (i, fr) in enumerate(pool.imap(_frame, range(a.start, a.end), chunksize=2)):
            enc.stdin.write(fr.tobytes())
            if n % 60 == 0:
                el = time.time() - t0
                print(f"[{a.format}] frame {i}/{a.end}  {el:.0f}s elapsed", flush=True)
    enc.stdin.close()
    enc.wait()
    print("wrote", path, f"in {time.time() - t0:.0f}s")


if __name__ == "__main__":
    main()
