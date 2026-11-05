"""Split the client's hero frame (assets/popburst/hero_end.webp) into
animatable layers. Writes premultiplied float32 RGBA .npy layers plus
debug previews into out/popburst/layers/.

Layers (back to front): bg (holes inpainted), ring, tub, shards, plume,
kernels (separate popcorn pieces, one entry per connected piece)."""
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(ROOT, "assets", "popburst", "hero_end.webp")
OUT = os.path.join(ROOT, "out", "popburst", "layers")

RING_C = (840.0, 442.0)
RING_R = (452.0, 418.0)
MOUTH = (835.0, 395.0)
TUB = np.int32([[498, 372], [1170, 372], [1172, 430], [1066, 866], [604, 866], [496, 430]])
SHARDS = {
    "shard_l": np.int32([[218, 300], [296, 238], [500, 418], [462, 520]]),
    "shard_r": np.int32([[1040, 846], [1112, 846], [1448, 592], [1398, 580]]),
}


def feather(m, r=1.2):
    return cv2.GaussianBlur(m.astype(np.float32), (0, 0), r)


def build():
    os.makedirs(OUT, exist_ok=True)
    img = np.array(Image.open(SRC).convert("RGB")).astype(np.float32) / 255
    H, W = img.shape[:2]
    hsv = cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    r, g, b = img[..., 0], img[..., 1], img[..., 2]

    tub = np.zeros((H, W), np.uint8)
    cv2.fillPoly(tub, [TUB], 1)

    # popcorn: warm yellows/golds + the white-hot burst at the mouth
    warm = (h >= 8) & (h <= 38) & (s > 70) & (v > 120)
    cream = (r > 0.85) & (g > 0.75) & (b < 0.80) & (r - b > 0.12)
    pop = (warm | cream).astype(np.uint8)
    yy, xx = np.mgrid[0:H, 0:W]
    pop[(tub > 0) & (yy > 425)] = 0                     # logo gold stays on the tub
    for poly in SHARDS.values():
        m_ = np.zeros((H, W), np.uint8); cv2.fillPoly(m_, [poly], 1); pop[m_ > 0] = 0
    pop = cv2.morphologyEx(pop, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    pop = cv2.morphologyEx(pop, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    # fill tiny holes inside kernels
    inv = (1 - pop).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(inv, 4)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    for i in range(1, n):
        if i not in border and st[i, cv2.CC_STAT_AREA] < 6000:
            pop[lab == i] = 1

    shard = {}
    for k, poly in SHARDS.items():
        m = np.zeros((H, W), np.uint8)
        cv2.fillPoly(m, [poly], 1)
        shard[k] = m

    # ring: bright pink/white annulus band (not covered by tub / popcorn)
    d = np.sqrt(((xx - RING_C[0]) / RING_R[0]) ** 2 + ((yy - RING_C[1]) / RING_R[1]) ** 2)
    band = np.abs(d - 1.0) < 0.075
    ringm = band & (v > 150) & ((r > 0.75) & (b > 0.55)) & (tub == 0) & (pop == 0)
    ringm = cv2.dilate(ringm.astype(np.uint8), np.ones((5, 5), np.uint8))
    ringm[(tub > 0) | (pop > 0)] = 0
    ring_glow = np.clip(1 - np.abs(d - 1.0) / 0.07, 0, 1) * (tub == 0) * (pop == 0)

    # popcorn split: the plume (biggest connected mass at the mouth) vs loose kernels
    n, lab, st, cen = cv2.connectedComponentsWithStats(pop, 8)
    plume = np.zeros((H, W), np.uint8)
    kernels = []
    for i in range(1, n):
        a = st[i, cv2.CC_STAT_AREA]
        if a < 120:
            continue
        x, y, w_, h_ = st[i, :4]
        cx, cy = cen[i]
        m = (lab == i).astype(np.uint8)
        if a > 4000:   # big out-of-focus kernel: close its holes, it owns its soft halo
            m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
            lab[m > 0] = i
            pop[m > 0] = 1
        near_mouth = abs(cx - MOUTH[0]) < 420 and cy < 470 and a > 30000
        if near_mouth:
            plume |= m
        else:
            kernels.append(dict(id=int(i), box=[int(x), int(y), int(w_), int(h_)], c=[float(cx), float(cy)],
                                area=int(a)))
    # background: remove everything that moves (generously, incl. soft halos),
    # inpaint coarsely from the surrounding purple, then add radial rays back
    hole = (tub | plume | ringm | (pop > 0)).astype(np.uint8)
    for m in shard.values():
        hole |= m
    hole |= ((np.sqrt(((xx - MOUTH[0]) / 380.0) ** 2 + ((yy - MOUTH[1] + 60) / 330.0) ** 2) < 1.0)).astype(np.uint8)
    hole = cv2.dilate(hole, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
    for kk in kernels:
        if kk["area"] > 4000:
            hole |= cv2.dilate((lab == kk["id"]).astype(np.uint8),
                               cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (91, 91)))
    f = 8
    sm = cv2.resize((img * 255).astype(np.uint8), (W // f, H // f), interpolation=cv2.INTER_AREA)
    hs = cv2.resize(hole, (W // f, H // f), interpolation=cv2.INTER_NEAREST)
    fill = cv2.inpaint(sm, hs, 12, cv2.INPAINT_TELEA)
    fill = cv2.GaussianBlur(fill, (0, 0), 3)
    fill = cv2.resize(fill, (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255
    # tame the inpaint: keep it in the purple family, no white blobs
    lum = fill.max(axis=2, keepdims=True)
    fill = np.where(lum > 0.55, fill * (0.55 / np.maximum(lum, 1e-3)), fill)
    ang = np.arctan2(yy - 380.0, xx - 840.0)
    rad = np.hypot(xx - 840.0, (yy - 380.0) * 1.2) / 900.0
    rays = (0.5 + 0.5 * np.cos(ang * 23 + 0.7)) ** 8 * 0.5 + (0.5 + 0.5 * np.cos(ang * 11)) ** 5 * 0.5
    proc = np.float32([0.38, 0.06, 0.62]) * np.exp(-rad * 1.4)[..., None] * 1.1 \
        + np.float32([0.75, 0.3, 1.0]) * (rays * np.clip(rad * 2.5, 0, 1) * np.exp(-rad * 0.8) * 0.35)[..., None]
    fill = fill * 0.55 + proc * 0.6
    hf = feather(hole, 9)[..., None]
    bg = img * (1 - hf) + fill * hf

    def layer(mask, soft=1.0, grow=0):
        if grow:
            mask = cv2.dilate(mask.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (grow, grow)))
        a = feather(mask, soft)
        return np.dstack([img * a[..., None], a]).astype(np.float32)

    np.save(os.path.join(OUT, "full.npy"), img.astype(np.float32))
    np.save(os.path.join(OUT, "bg.npy"), bg.astype(np.float32))
    np.save(os.path.join(OUT, "tub.npy"), layer(tub, 0.8))
    np.save(os.path.join(OUT, "plume.npy"), layer(plume, 1.2, 3))
    np.save(os.path.join(OUT, "ring.npy"), layer(ringm, 1.5))
    np.save(os.path.join(OUT, "ring_glow.npy"), ring_glow.astype(np.float32))
    for k, m in shard.items():
        np.save(os.path.join(OUT, f"{k}.npy"), layer(m, 0.8))
    np.save(os.path.join(OUT, "kernel_labels.npy"), lab.astype(np.int32))
    np.save(os.path.join(OUT, "pop_mask.npy"), pop)
    # per-kernel soft alpha (big blurry ones keep a wide halo)
    kalpha = np.zeros((H, W), np.float32)
    for kk in kernels:
        m = (lab == kk["id"]).astype(np.uint8)
        g_, sft = (29, 10) if kk["area"] > 4000 else (5, 1.5)
        kk["grow"], kk["soft"] = g_, sft
    json.dump(dict(kernels=kernels, ring_c=RING_C, ring_r=RING_R, mouth=MOUTH, W=W, H=H),
              open(os.path.join(OUT, "meta.json"), "w"), indent=1)

    # debug: colour-coded layer map + background
    dbg = img * 0.25
    dbg[tub > 0] = (0.2, 0.4, 1.0)
    dbg[plume > 0] = (1.0, 0.85, 0.1)
    for kk in kernels:
        dbg[lab == kk["id"]] = (0.1, 1.0, 0.3)
    dbg[ringm > 0] = (1.0, 0.2, 1.0)
    for m in shard.values():
        dbg[m > 0] = (1.0, 0.2, 0.2)
    sheet = np.concatenate([dbg, bg], 1)
    Image.fromarray((np.clip(sheet, 0, 1) * 255).astype(np.uint8)).resize((1672, 470)).save(
        os.path.join(OUT, "debug_layers.png"))
    print("kernels:", len(kernels), "plume px:", int(plume.sum()))


if __name__ == "__main__":
    build()
