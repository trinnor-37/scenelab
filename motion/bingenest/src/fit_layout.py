"""Fit each letter sprite (position + scale) to the reference logo by masked
template matching. Prints logo-space centers/scales used by layout.py."""
import numpy as np, cv2
from PIL import Image

A = "assets/"
ref = np.array(Image.open(A + "reference_logo.png").convert("RGBA")).astype(np.float32)
ref_rgb = ref[..., :3] * (ref[..., 3:] / 255)  # on black

# name, file, search box (x0,y0,x1,y1) in reference coords
JOBS = [
    ("B", "B_blue", (40, 620, 330, 900)),
    ("I", "I_blue", (190, 620, 400, 900)),
    ("N1", "N_blue", (290, 610, 540, 900)),
    ("G", "G_blue", (420, 600, 680, 900)),
    ("E1", "E_blue", (540, 600, 780, 900)),
    ("N2", "N_pink", (660, 590, 930, 900)),
    ("E2", "E_pink", (820, 590, 1060, 900)),
    ("S", "S_pink", (920, 590, 1170, 900)),
    ("T1", "T_pink", (1020, 590, 1250, 900)),
    ("T2", "T_orange", (420, 920, 680, 1170)),
    ("V", "V_orange", (580, 920, 820, 1170)),
]

def load(name):
    a = np.array(Image.open(A + name + ".png").convert("RGBA")).astype(np.float32)
    ys, xs = np.where(a[..., 3] > 8)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return a, (xs.min(), ys.min())

for key, f, (x0, y0, x1, y1) in JOBS:
    spr, off = load(f)
    region = ref_rgb[y0:y1, x0:x1]
    best = None
    for s in np.arange(0.15, 0.27, 0.004):
        for rot in (-6, -3, 0, 3, 6):
            h, w = spr.shape[:2]
            t = cv2.resize(spr, (max(3, int(w * s)), max(3, int(h * s))), interpolation=cv2.INTER_AREA)
            if rot:
                c = (t.shape[1] / 2, t.shape[0] / 2)
                M = cv2.getRotationMatrix2D(c, rot, 1.0)
                t = cv2.warpAffine(t, M, (t.shape[1], t.shape[0]))
            if t.shape[0] >= region.shape[0] or t.shape[1] >= region.shape[1]:
                continue
            al = t[..., 3] / 255
            m = cv2.erode((al > 0.95).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32)
            tm = t[..., :3] * al[..., None]
            r = cv2.matchTemplate(region, tm, cv2.TM_SQDIFF, mask=np.dstack([m] * 3))
            r = r / max(m.sum(), 1)
            mn, _, loc, _ = cv2.minMaxLoc(r)
            if best is None or mn < best[0]:
                best = (mn, s, rot, loc, t.shape)
    mn, s, rot, loc, shp = best
    cx = x0 + loc[0] + shp[1] / 2
    cy = y0 + loc[1] + shp[0] / 2
    print(f'    "{key}": dict(file="{f}", x={cx:.1f}, y={cy:.1f}, s={s:.3f}, rot={rot}),  # err {mn:.0f}')
