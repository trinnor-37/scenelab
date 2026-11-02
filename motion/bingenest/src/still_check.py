"""Compose the final layout statically in logo space and put it next to the
reference (plus a 50% overlay) for alignment checks."""
import sys, numpy as np, cv2
from PIL import Image
sys.path.insert(0, "src")
from assets import load_rgba, TRIM_OFFSET
from layout import build

S = 1254
def place(canvas, rgba, x, y, sx, sy, rot, anc=None):
    h, w = rgba.shape[:2]
    ax, ay = anc if anc is not None else (w / 2, h / 2)
    M = cv2.getRotationMatrix2D((w / 2, h / 2), -rot, 1.0)
    M[0] *= sx; M[1] *= sy
    M[0, 2] += x - w / 2 * sx * 1; M[1, 2] += y - h / 2 * sy
    # recentre: rotation about centre then scale
    T = np.array([[1, 0, -ax], [0, 1, -ay], [0, 0, 1]])
    Sm = np.array([[sx, 0, 0], [0, sy, 0], [0, 0, 1]])
    th = np.radians(rot); R = np.array([[np.cos(th), -np.sin(th), x], [np.sin(th), np.cos(th), y], [0, 0, 1]])
    A = R @ Sm @ T
    out = cv2.warpAffine(rgba, A[:2], (S, S), flags=cv2.INTER_AREA if sx < 1 else cv2.INTER_LINEAR)
    canvas[:] = out + canvas * (1 - out[..., 3:4])

L, word, tv = build()
c = np.zeros((S, S, 4), np.float32)
cache = {}
def P(e):
    f = e["file"]
    if f not in cache: cache[f] = load_rgba(f)
    anc = None
    if "anchor" in e:
        ox, oy = TRIM_OFFSET[f]; anc = (e["anchor"][0] - ox, e["anchor"][1] - oy)
    place(c, cache[f], e["x"], e["y"], e["sx"], e["sy"], e["rot"], anc)
for k in ["oval", "pop_tl", "pop_tr", "character", "tv"]: P(L[k])
for e in word: P(e)
for e in tv: P(e)
for k in ["pop_bl", "pop_br"]: P(L[k])
bg = np.array([0.12, 0.12, 0.12], np.float32)
mine = c[..., :3] + bg * (1 - c[..., 3:4])
ref = np.array(Image.open("assets/reference_logo.png").convert("RGBA")).astype(np.float32) / 255
refc = ref[..., :3] * ref[..., 3:] + bg * (1 - ref[..., 3:])
ov = mine * 0.5 + refc * 0.5
row = np.concatenate([mine, refc, ov], 1)
Image.fromarray((np.clip(row, 0, 1) * 255).astype(np.uint8)).resize((1881, 627)).save(sys.argv[1])
crop = np.concatenate([mine[560:1254], refc[560:1254]], 0)
Image.fromarray((np.clip(crop, 0, 1) * 255).astype(np.uint8)).resize((900, 996)).save(sys.argv[1].replace(".png", "_word.png"))
