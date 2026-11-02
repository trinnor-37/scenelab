"""Asset loading: trimmed, premultiplied float32 RGBA sprites with mip levels,
plus small procedural sprites (bokeh disc, glint, popcorn kernels)."""
import os
import numpy as np
import cv2
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..", "assets")
TRIM_OFFSET = {}   # name -> (x0, y0) of the trimmed sprite inside the original file


class Sprite:
    """Premultiplied RGBA float32 image with a mip chain.

    `anchor` is the sprite's pivot in level-0 pixel coordinates (default: the
    centre of its trimmed bounds)."""

    def __init__(self, rgba_premul, anchor=None):
        self.levels = [np.ascontiguousarray(rgba_premul, dtype=np.float32)]
        while min(self.levels[-1].shape[:2]) > 48:
            p = self.levels[-1]
            self.levels.append(cv2.resize(p, (max(1, p.shape[1] // 2), max(1, p.shape[0] // 2)),
                                          interpolation=cv2.INTER_AREA))
        h, w = self.levels[0].shape[:2]
        self.w, self.h = w, h
        self.anchor = anchor if anchor is not None else (w / 2.0, h / 2.0)

    def level_for(self, scale):
        """Pick the mip level whose resolution is just above `scale`."""
        lvl = 0
        while lvl + 1 < len(self.levels) and scale * (2 ** (lvl + 1)) <= 1.0:
            lvl += 1
        return lvl


def load_rgba(name, trim=True, pad=6):
    a = np.array(Image.open(os.path.join(ROOT, name + ".png")).convert("RGBA")).astype(np.float32) / 255.0
    if trim:
        ys, xs = np.where(a[..., 3] > 0.02)
        y0, y1 = max(0, ys.min() - pad), min(a.shape[0], ys.max() + pad + 1)
        x0, x1 = max(0, xs.min() - pad), min(a.shape[1], xs.max() + pad + 1)
        a = a[y0:y1, x0:x1]
        TRIM_OFFSET[name] = (float(x0), float(y0))
    else:
        TRIM_OFFSET[name] = (0.0, 0.0)
    a[..., :3] *= a[..., 3:4]
    return a


def load_sprite(name):
    return Sprite(load_rgba(name))


def core_mask(rgba_premul):
    """Coloured glyph body of a sticker letter (no white/black outline)."""
    a = rgba_premul[..., 3]
    rgb = rgba_premul[..., :3] / np.maximum(a[..., None], 1e-4)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    m = ((a > 0.5) & (sat > 0.28)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    # fill holes: anything not reachable from the border is inside
    h, w = m.shape
    ff = m.copy()
    mask = np.zeros((h + 2, w + 2), np.uint8)
    cv2.floodFill(ff, mask, (0, 0), 1)
    holes = (ff == 0)
    return (m > 0) | holes


# ---------------------------------------------------------------- procedural

def bokeh_disc(size=96):
    """Soft disc with a slightly brighter rim – reads as a lens bokeh ball."""
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    r = np.hypot(x - (size - 1) / 2, y - (size - 1) / 2) / (size / 2 - 2)
    body = np.clip((1.0 - r) * 6, 0, 1)
    rim = np.exp(-((r - 0.9) / 0.08) ** 2) * 0.35
    a = np.clip(body * 0.55 + rim, 0, 1) * body
    out = np.zeros((size, size, 4), np.float32)
    out[..., :3] = a[..., None]
    out[..., 3] = a
    return Sprite(out)


def soft_dot(size=64):
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    r = np.hypot(x - (size - 1) / 2, y - (size - 1) / 2) / (size / 2)
    a = np.exp(-(r * 2.6) ** 2)
    out = np.zeros((size, size, 4), np.float32)
    out[..., :3] = a[..., None]
    out[..., 3] = a
    return Sprite(out)


def glint(size=256):
    """Four-point star glint (additive)."""
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    c = (size - 1) / 2
    dx, dy = (x - c) / c, (y - c) / c
    r = np.hypot(dx, dy)
    core = np.exp(-(r / 0.07) ** 2)
    halo = np.exp(-(r / 0.28) ** 2) * 0.35
    streak_h = np.exp(-(dy / 0.018) ** 2) * np.clip(1 - np.abs(dx), 0, 1) ** 2.2
    streak_v = np.exp(-(dx / 0.018) ** 2) * np.clip(1 - np.abs(dy), 0, 1) ** 2.2
    d1, d2 = (dx + dy) / 1.414, (dx - dy) / 1.414
    diag = (np.exp(-(d1 / 0.012) ** 2) * np.clip(1 - np.abs(d2) * 1.8, 0, 1) ** 3 +
            np.exp(-(d2 / 0.012) ** 2) * np.clip(1 - np.abs(d1) * 1.8, 0, 1) ** 3) * 0.35
    v = np.clip(core + halo + streak_h + streak_v * 0.8 + diag, 0, 1.5)
    out = np.zeros((size, size, 4), np.float32)
    out[..., 0] = v * 1.0
    out[..., 1] = v * 0.93
    out[..., 2] = v * 0.78
    out[..., 3] = np.clip(v, 0, 1)
    return Sprite(out)


def popcorn_kernel(seed, size=160):
    """A single popped kernel: a cluster of glossy butter-yellow lobes with the
    same purple/white sticker edge as the supplied popcorn art."""
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    c = size / 2
    lobes = [(c, c, size * 0.2)]
    for _ in range(rng.integers(4, 7)):
        ang = rng.uniform(0, 2 * np.pi)
        d = rng.uniform(0.12, 0.2) * size
        lobes.append((c + np.cos(ang) * d, c + np.sin(ang) * d, rng.uniform(0.11, 0.17) * size))
    field = np.zeros((size, size), np.float32)
    shade = np.zeros((size, size), np.float32)
    spec = np.zeros((size, size), np.float32)
    for (lx, ly, lr) in lobes:
        d = np.hypot(x - lx, y - ly) / lr
        inside = d < 1
        field = np.maximum(field, inside.astype(np.float32))
        nz = np.sqrt(np.clip(1 - d ** 2, 0, 1))
        # light from top-left
        lam = np.clip(0.55 * nz + 0.45 * np.clip(((lx - x) * 0.6 + (ly - y) * 0.8) / lr, -1, 1) * 0.5 + 0.35, 0, 1)
        shade = np.where(inside & (lam > shade), lam, shade)
        sp = np.exp(-(((x - (lx - lr * 0.35)) ** 2 + (y - (ly - lr * 0.4)) ** 2) / (lr * 0.22) ** 2))
        spec = np.maximum(spec, sp * inside)
    body = field > 0
    dist_out = cv2.distanceTransform((~body).astype(np.uint8), cv2.DIST_L2, 5)
    white = (dist_out > 0) & (dist_out < size * 0.035)
    purple = (dist_out >= size * 0.035) & (dist_out < size * 0.065)
    col = np.zeros((size, size, 3), np.float32)
    lo, hi = np.array([0.93, 0.60, 0.08]), np.array([1.0, 0.93, 0.36])
    col[body] = (lo + (hi - lo) * shade[body, None])
    col[body] += spec[body, None] * 0.8
    col[white] = (1.0, 0.98, 0.95)
    col[purple] = (0.52, 0.10, 0.80)
    a = (body | white | purple).astype(np.float32)
    a = cv2.GaussianBlur(a, (0, 0), 0.7)
    col = np.clip(col, 0, 1)
    out = np.dstack([col * a[..., None], a]).astype(np.float32)
    return Sprite(out)
