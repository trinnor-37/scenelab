"""2.5D engine: easing, fonts, camera projection, sprite compositing, light strands and post.

Everything is rendered in display space as float32 in [0, 1]. UI sprites are stored
premultiplied. The red light lives in a separate emissive buffer that is screen-blended
on top (1 - (1 - base) * exp(-E)), which gives unlimited headroom and a hot core.
"""
from __future__ import annotations

import glob
import math
import os
from functools import lru_cache

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

cv2.setNumThreads(1)

HERE = os.path.dirname(os.path.abspath(__file__))
RED = np.array([229, 9, 20], np.float32) / 255.0  # Netflix red, the only accent


# --------------------------------------------------------------------------- easing

def sat(x):
    return np.clip(x, 0.0, 1.0)


def ramp(t, a, b):
    return sat((t - a) / (b - a))


def smooth(x):
    x = sat(x)
    return x * x * (3.0 - 2.0 * x)


def smoother(x):
    x = sat(x)
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0)


def ease_out(x, p=3.0):
    return 1.0 - (1.0 - sat(x)) ** p


def ease_in(x, p=3.0):
    return sat(x) ** p


def lerp(a, b, w):
    return a + (b - a) * w


def bump(x):
    return np.sin(np.pi * sat(x))


def gauss(x, w):
    return np.exp(-(x / w) ** 2)


# --------------------------------------------------------------------------- fonts

_SF = {"regular": "Regular", "medium": "Medium", "semibold": "Semibold",
       "bold": "Bold", "heavy": "Heavy", "black": "Black"}
_INTER = {"regular": "Regular", "medium": "Medium", "semibold": "SemiBold",
          "bold": "Bold", "heavy": "ExtraBold", "black": "Black"}


def _font_dirs():
    dirs = [os.environ.get("SF_PRO_DIR", ""), os.path.join(HERE, "fonts"),
            os.path.expanduser("~/Library/Fonts"), "/Library/Fonts", "/System/Library/Fonts",
            os.path.expanduser("~/.fonts"), os.path.expanduser("~/.local/share/fonts"),
            "/usr/local/share/fonts", "/usr/share/fonts"]
    return [d for d in dirs if d and os.path.isdir(d)]


@lru_cache(None)
def _font_index():
    idx = {}
    for d in _font_dirs():
        for p in glob.glob(os.path.join(d, "**", "*.*tf"), recursive=True):
            idx.setdefault(os.path.basename(p).lower(), p)
    return idx


@lru_cache(None)
def font_path(weight):
    idx = _font_index()
    for ext in ("otf", "ttf"):
        p = idx.get(f"sf-pro-display-{_SF[weight].lower()}.{ext}")
        if p:
            return p, "SF Pro Display"
    if os.environ.get("REQUIRE_SF_PRO"):
        raise FileNotFoundError("SF Pro Display not found; put SF-Pro-Display-*.otf in ./fonts or set SF_PRO_DIR")
    p = idx.get(f"interdisplay-{_INTER[weight].lower()}.otf")
    if p:
        return p, "Inter Display (fallback - SF Pro Display not installed)"
    raise FileNotFoundError("No SF Pro Display or Inter Display font found")


def font_family():
    return font_path("bold")[1]


@lru_cache(None)
def font(weight, px):
    return ImageFont.truetype(font_path(weight)[0], max(1, int(round(px))))


def text_mask(text, weight, size, tracking=0.0, ss=1.0):
    """Render text to a coverage mask. Returns (mask, x_origin, baseline_y, advance) in pixels."""
    f = font(weight, size * ss)
    asc, desc = f.getmetrics()
    tr = tracking * size * ss
    if tr:
        widths = [f.getlength(c) for c in text]
        total = sum(widths) + tr * max(len(text) - 1, 0)
    else:
        total = f.getlength(text)
    pad = int(6 * ss) + 2
    w = int(math.ceil(total)) + 2 * pad
    h = asc + desc + 2 * pad
    im = Image.new("L", (w, h), 0)
    dr = ImageDraw.Draw(im)
    if tr:
        x = pad
        for c, wc in zip(text, widths):
            dr.text((x, pad + asc), c, font=f, fill=255, anchor="ls")
            x += wc + tr
    else:
        dr.text((pad, pad + asc), text, font=f, fill=255, anchor="ls")
    return np.asarray(im, np.float32) / 255.0, pad, pad + asc, total


def text_sprite(text, weight, size, color=(0.96, 0.96, 0.96), tracking=0.0):
    """Screen-space premultiplied RGBA text sprite (ss=1) plus placement metrics."""
    m, ox, by, adv = text_mask(text, weight, size, tracking, 1.0)
    rgba = np.empty(m.shape + (4,), np.float32)
    rgba[..., :3] = m[..., None] * np.asarray(color, np.float32)
    rgba[..., 3] = m
    return rgba, ox, by, adv


# --------------------------------------------------------------------------- 3D

def rot(yaw=0.0, pitch=0.0, roll=0.0):
    cy, sy = math.cos(yaw), math.sin(yaw)
    cp, sp = math.cos(pitch), math.sin(pitch)
    cr, sr = math.cos(roll), math.sin(roll)
    ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    rx = np.array([[1, 0, 0], [0, cp, -sp], [0, sp, cp]])
    rz = np.array([[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]])
    return ry @ rx @ rz


class Plane:
    """A rectangle (w x h world units) floating in space; (u, v) measured from its top-left."""

    def __init__(self, pos, R, w, h):
        self.pos = np.asarray(pos, float)
        self.R = R
        self.w, self.h = w, h

    def pts(self, u, v, z=0.0):
        u, v, z = np.broadcast_arrays(np.asarray(u, float), np.asarray(v, float), np.asarray(z, float))
        loc = np.stack([u - self.w / 2, v - self.h / 2, z], -1)
        return self.pos + loc @ self.R.T

    def pt(self, u, v, z=0.0):
        return self.pts(u, v, z)


class Cam:
    def __init__(self, pos, F, focus, W, H, aperture=30.0, near=60.0):
        self.pos = np.asarray(pos, float)
        self.F, self.focus, self.W, self.H = F, max(focus, 50.0), W, H
        self.aperture, self.near = aperture, near

    def project(self, P):
        P = np.asarray(P, float)
        d = P[..., 2] - self.pos[2]
        s = self.F / np.maximum(d, 1e-3)
        x = self.W * 0.5 + (P[..., 0] - self.pos[0]) * s
        y = self.H * 0.5 + (P[..., 1] - self.pos[1]) * s
        return np.stack([x, y], -1), d

    def coc(self, d):
        return self.aperture * abs(d - self.focus) / max(d, 1.0)


# --------------------------------------------------------------------------- sprites

class Sprite:
    """Premultiplied RGBA image with a mip chain; w/h are world units."""

    def __init__(self, rgba, ss):
        rgba = np.ascontiguousarray(rgba, np.float32)
        self.w = rgba.shape[1] / ss
        self.h = rgba.shape[0] / ss
        self.levels = [(ss, rgba)]
        cur = rgba
        while min(cur.shape[:2]) > 48:
            cur = cv2.resize(cur, (cur.shape[1] // 2, cur.shape[0] // 2), interpolation=cv2.INTER_AREA)
            self.levels.append((cur.shape[1] / self.w, cur))

    def level(self, need):
        best = self.levels[0]
        for s, img in self.levels:
            if s >= need * 0.85:
                best = (s, img)
        return best[1]


class Layer:
    __slots__ = ("sprite", "pos", "R", "scale", "opacity", "blur", "bias")

    def __init__(self, sprite, pos, R=None, scale=1.0, opacity=1.0, blur=0.0, bias=0.0):
        self.sprite = sprite
        self.pos = np.asarray(pos, float)
        self.R = np.eye(3) if R is None else R
        self.scale, self.opacity, self.blur = scale, opacity, blur
        self.bias = bias  # depth-sort offset; negative draws later (children sitting on a panel)

    def corners(self):
        w = self.sprite.w * self.scale / 2
        h = self.sprite.h * self.scale / 2
        loc = np.array([[-w, -h, 0], [w, -h, 0], [w, h, 0], [-w, h, 0]])
        return self.pos + loc @ self.R.T


def fast_blur(img, sigma):
    if sigma < 0.35:
        return img
    if sigma < 4.0:
        return cv2.GaussianBlur(img, (0, 0), sigma)
    f = int(sigma // 2)
    h, w = img.shape[:2]
    sw, sh = max(1, w // f), max(1, h // f)
    small = cv2.resize(img, (sw, sh), interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (0, 0), sigma / f)
    return cv2.resize(small, (w, h), interpolation=cv2.INTER_LINEAR)


def composite(stack, layer, cam):
    """Composite one layer over the premultiplied stack (H, W, 4) with perspective + depth of field."""
    if layer.opacity < 0.004:
        return
    C = layer.corners()
    xy, d = cam.project(C)
    if d.min() < cam.near:
        return
    dc = float(d.mean())
    op = layer.opacity * float(smooth(ramp(dc, 0.22 * cam.F, 0.5 * cam.F)))
    if op < 0.004:
        return
    sigma = 0.5 * cam.coc(dc) + layer.blur
    pad = int(3 * sigma) + 2
    H, W = stack.shape[:2]
    x0 = max(int(math.floor(xy[:, 0].min())) - pad, 0)
    y0 = max(int(math.floor(xy[:, 1].min())) - pad, 0)
    x1 = min(int(math.ceil(xy[:, 0].max())) + pad, W)
    y1 = min(int(math.ceil(xy[:, 1].max())) + pad, H)
    if x1 - x0 < 2 or y1 - y0 < 2:
        return
    need = cam.F / dc * layer.scale
    img = layer.sprite.level(need)
    ih, iw = img.shape[:2]
    src = np.float32([[0, 0], [iw, 0], [iw, ih], [0, ih]])
    dst = np.float32(xy - [x0, y0])
    Hm = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(img, Hm, (x1 - x0, y1 - y0), flags=cv2.INTER_LINEAR,
                                 borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    if sigma > 0.35:
        warped = fast_blur(warped, sigma)
    if op < 0.999:
        warped *= op
    roi = stack[y0:y1, x0:x1]
    roi *= 1.0 - warped[..., 3:4]
    roi += warped


def overlay(frame, rgba, x, y, opacity=1.0, sigma=0.0):
    """Place a screen-space premultiplied sprite with its top-left at subpixel (x, y) over an RGB frame."""
    if opacity < 0.004:
        return
    pad = int(3 * sigma) + 2
    h, w = rgba.shape[:2]
    H, W = frame.shape[:2]
    ix, iy = int(math.floor(x)) - pad, int(math.floor(y)) - pad
    fx, fy = x - math.floor(x), y - math.floor(y)
    M = np.float32([[1, 0, fx + pad], [0, 1, fy + pad]])
    spr = cv2.warpAffine(rgba, M, (w + 2 * pad + 1, h + 2 * pad + 1), flags=cv2.INTER_LINEAR,
                         borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    if sigma > 0.35:
        spr = cv2.GaussianBlur(spr, (0, 0), sigma)
    x0, y0 = max(ix, 0), max(iy, 0)
    x1, y1 = min(ix + spr.shape[1], W), min(iy + spr.shape[0], H)
    if x1 <= x0 or y1 <= y0:
        return
    s = spr[y0 - iy:y1 - iy, x0 - ix:x1 - ix] * opacity
    roi = frame[y0:y1, x0:x1]
    roi *= 1.0 - s[..., 3:4]
    roi += s[..., :3]


# --------------------------------------------------------------------------- light strands

VMAX = 1.7     # brightness represented by a full 255 in the strand buffer
LEVELS = 28
# (amplitude px, wavelength world, speed, phase, brightness, thickness)
FIBERS = [
    (2.6, 170.0, 0.55, 0.0, 0.38, 1),
    (2.0, 115.0, -0.80, 2.1, 0.38, 1),
    (1.3, 240.0, 0.35, 4.0, 0.55, 1),
    (0.9, 90.0, -1.10, 1.3, 0.55, 1),
    (0.0, 1.0, 0.0, 0.0, 1.00, 0),   # core, thickness chosen by depth
]


def draw_strands(buf, cam, pts, alpha, t, dots=()):
    """Rasterise M strands (each a bundle of fibres) into a uint8 buffer with antialiased sub-pixel lines."""
    M = pts.shape[0]
    seen = []
    for m in range(M):
        P, a = pts[m], alpha[m]
        if a.max() < 0.01:
            continue
        dup = False
        for q in seen:
            if np.array_equal(P, pts[q]) and np.array_equal(a, alpha[q]):
                dup = True
                break
        if dup:
            continue
        seen.append(m)
        xy, d = cam.project(P)
        a = a * smooth(ramp(d, cam.near, cam.near * 3))
        sc = cam.F / np.maximum(d, 1.0)
        tg = np.gradient(xy, axis=0)
        tg /= np.maximum(np.linalg.norm(tg, axis=1, keepdims=True), 1e-6)
        nrm = np.stack([-tg[:, 1], tg[:, 0]], 1)
        seg = np.linalg.norm(np.diff(P, axis=0), axis=1)
        L = np.concatenate([[0.0], np.cumsum(seg)])
        core_th = 2 if float(np.median(sc)) > 0.95 else 1
        for amp, wl, spd, ph, br, th in FIBERS:
            if amp > 0:
                off = amp * np.minimum(sc, 2.5) * np.sin(2 * np.pi * (L / wl + spd * t + m * 0.37) + ph)
                q = xy + nrm * off[:, None]
            else:
                q = xy
                th = core_th
            v = np.clip(a * br / VMAX, 0, 1)
            sv = 0.5 * (v[:-1] + v[1:])
            lev = np.rint(sv * LEVELS).astype(np.int32)
            qi = np.rint(q * 16).astype(np.int32)
            # run-length group consecutive segments with equal brightness into one polyline
            change = np.flatnonzero(np.diff(lev)) + 1
            starts = np.concatenate([[0], change])
            ends = np.concatenate([change, [len(lev)]])
            for s0, s1 in zip(starts, ends):
                lv = lev[s0]
                if lv <= 0:
                    continue
                cv2.polylines(buf, [qi[s0:s1 + 1]], False, int(lv * 255 / LEVELS), th, cv2.LINE_AA, 4)
    for P, r, I in dots:
        xy, d = cam.project(np.asarray(P, float))
        if d < cam.near or I < 0.01:
            continue
        rr = max(r * cam.F / d, 0.6)
        c = (int(round(xy[0] * 16)), int(round(xy[1] * 16)))
        cv2.circle(buf, c, int(round(rr * 16)), int(min(I / VMAX, 1) * 255), -1, cv2.LINE_AA, 4)


# --------------------------------------------------------------------------- post

class Post:
    def __init__(self, W, H, seed=7):
        self.W, self.H = W, H
        rng = np.random.default_rng(seed)
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        nx = (xx - W / 2) / (0.5 * math.hypot(W, H))
        ny = (yy - H / 2) / (0.5 * math.hypot(W, H))
        r2 = nx * nx + ny * ny
        self.vignette = (1.0 - 0.55 * smooth((r2 - 0.12) / 0.9))[..., None].astype(np.float32)
        self.grain = []
        for _ in range(6):
            g = rng.standard_normal((H, W)).astype(np.float32)
            g = cv2.GaussianBlur(g, (0, 0), 0.55)
            g /= g.std()
            self.grain.append(g.astype(np.float16))
        self.lw, self.lh = W // 8, H // 8
        ly, lx = np.mgrid[0:self.lh, 0:self.lw].astype(np.float32)
        self.lu, self.lv = (lx + 0.5) / self.lw, (ly + 0.5) / self.lh
        self.aspect = W / H

    def background(self, t, energy, drift):
        u, v, a = self.lu, self.lv, self.aspect
        g = np.zeros_like(u)
        blobs = [
            (0.30 + 0.10 * math.sin(0.21 * t + 0.3) + drift[0], 0.38 + 0.08 * math.cos(0.17 * t) + drift[1], 0.55, 0.85),
            (0.78 + 0.08 * math.cos(0.15 * t + 1.0) + drift[0] * 0.6, 0.72 + 0.10 * math.sin(0.19 * t + 2.0) + drift[1] * 0.6, 0.45, 0.6),
            (0.55 + 0.20 * math.sin(0.09 * t + 4.0), 0.15 + 0.10 * math.sin(0.13 * t), 0.35, 0.35),
        ]
        for bx, by, rad, k in blobs:
            dx = (u - bx) * a
            dy = v - by
            g += k * np.exp(-(dx * dx + dy * dy) / (rad * rad))
        g *= 0.85 + 0.6 * energy
        col = np.array([0.155, 0.010, 0.018], np.float32)
        base = np.array([0.012, 0.009, 0.010], np.float32)
        small = base + g[..., None] * col
        return cv2.resize(small, (self.W, self.H), interpolation=cv2.INTER_CUBIC)

    def glow(self, core):
        """Bloom pyramid of the strand buffer."""
        H, W = core.shape
        c2 = cv2.resize(core, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
        g1 = cv2.GaussianBlur(c2, (0, 0), 2.5)
        c4 = cv2.resize(c2, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
        g2 = cv2.GaussianBlur(c4, (0, 0), 4.0)
        c8 = cv2.resize(c4, (W // 8, H // 8), interpolation=cv2.INTER_AREA)
        g3 = cv2.GaussianBlur(c8, (0, 0), 7.0)
        g3 = cv2.resize(g3, (W // 4, H // 4), interpolation=cv2.INTER_LINEAR)
        g = 1.4 * g2 + 1.9 * g3
        g = cv2.resize(g, (W // 2, H // 2), interpolation=cv2.INTER_LINEAR) + 0.9 * g1
        return cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR)

    def finish(self, img, idx):
        lum = img.mean(axis=2, keepdims=True)
        amp = 0.012 + 0.036 * lum * (1.0 - lum)
        g = self.grain[idx % len(self.grain)]
        sh = (idx * 7919) % self.H, (idx * 104729) % self.W
        g = np.roll(g, sh, axis=(0, 1)).astype(np.float32)[..., None]
        img = img + g * amp
        return np.clip(img * 255.0 + 0.5, 0, 255).astype(np.uint8)
