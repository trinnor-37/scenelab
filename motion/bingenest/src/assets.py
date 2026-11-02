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


def popcorn_kernel(seed, size=256):
    """A single popped kernel, shaded as a 3D height field so it reads like
    the supplied popcorn art: glossy butter-yellow lobes, orange creases,
    sharp white highlights and the same white + purple sticker edge."""
    rng = np.random.default_rng(seed + 101)
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    c = size / 2
    R = size * 0.30
    lobes = [(c + rng.uniform(-6, 6), c + rng.uniform(-6, 6), R * rng.uniform(0.62, 0.72))]
    n = int(rng.integers(5, 8))
    base = rng.uniform(0, 2 * np.pi)
    for j in range(n):
        ang = base + j * 2 * np.pi / n + rng.uniform(-0.35, 0.35)
        d = R * rng.uniform(0.55, 0.85)
        lobes.append((c + np.cos(ang) * d, c + np.sin(ang) * d, R * rng.uniform(0.40, 0.58)))
    # a couple of small puffs on top for the classic "butterfly" silhouette
    for _ in range(int(rng.integers(1, 3))):
        ang = rng.uniform(0, 2 * np.pi)
        d = R * rng.uniform(0.15, 0.4)
        lobes.append((c + np.cos(ang) * d, c + np.sin(ang) * d, R * rng.uniform(0.32, 0.42)))
    h = np.zeros((size, size), np.float32)
    for (lx, ly, lr) in lobes:
        ea = rng.uniform(0.85, 1.15)
        d2 = ((x - lx) * ea) ** 2 + ((y - ly) / ea) ** 2
        h = np.maximum(h, np.sqrt(np.clip(lr * lr - d2, 0, None)))
    body = h > 0
    hs = cv2.GaussianBlur(h, (0, 0), size * 0.006)
    gy, gx = np.gradient(hs)
    nz = np.ones_like(hs)
    nrm = np.sqrt(gx * gx + gy * gy + nz * nz)
    Nx, Ny, Nz = -gx / nrm, -gy / nrm, nz / nrm
    L = np.array([-0.45, -0.6, 0.66]); L /= np.linalg.norm(L)
    lam = np.clip(Nx * L[0] + Ny * L[1] + Nz * L[2], 0, 1)
    Hh = L + np.array([0, 0, 1.0]); Hh /= np.linalg.norm(Hh)
    sd = np.clip(Nx * Hh[0] + Ny * Hh[1] + Nz * Hh[2], 0, 1)
    spec = sd ** 90 * 1.3 + sd ** 12 * 0.12
    # creases: where the surface dips below its smoothed neighbourhood
    crease = np.clip((cv2.GaussianBlur(h, (0, 0), size * 0.03) - h) / (R * 0.18), 0, 1)
    hn = np.clip(h / (R * 0.75), 0, 1)
    deep = np.array([0.95, 0.55, 0.06]); mid = np.array([1.0, 0.84, 0.26]); top = np.array([1.0, 0.97, 0.62])
    alb = deep + (mid - deep) * np.clip(hn * 1.6, 0, 1)[..., None]
    alb = alb + (top - alb) * np.clip((lam - 0.55) * 2.2, 0, 1)[..., None]
    shade = (0.68 + 0.45 * lam)[..., None] * (1 - 0.45 * crease[..., None])
    col = alb * shade + spec[..., None] * 1.0 + 0.10 * (1 - Nz)[..., None] * np.array([1.0, 0.85, 0.5])
    dist = cv2.distanceTransform((~body).astype(np.uint8), cv2.DIST_L2, 5)
    white = (dist > 0) & (dist <= size * 0.03)
    purple = (dist > size * 0.03) & (dist <= size * 0.052)
    col[white] = (1.0, 0.97, 0.94)
    col[purple] = (0.50, 0.10, 0.78)
    a = (body | white | purple).astype(np.float32)
    a = cv2.GaussianBlur(a, (0, 0), 0.8)
    col = np.clip(col, 0, 1).astype(np.float32)
    out = np.dstack([col * a[..., None], a]).astype(np.float32)
    return Sprite(out)
