"""Procedural asset kit: frosted-glass panels, monochrome cinematic posters, icons, UI text.

Canvas coordinates are world units with the origin at the panel's top-left corner;
`pad` adds room for the soft drop shadow around it. Everything is premultiplied RGBA.
"""
from __future__ import annotations

import math

import cv2
import numpy as np
from PIL import Image, ImageDraw

from engine import RED, Sprite, gauss, smooth, text_mask

WARM = np.array([1.0, 0.965, 0.94], np.float32)   # neutral grade for imagery
INK = (0.96, 0.96, 0.965)
GREY = (0.62, 0.62, 0.64)
DIM = (0.42, 0.42, 0.44)


class Canvas:
    def __init__(self, w, h, ss=2.0, pad=0.0):
        self.w, self.h, self.ss, self.pad = w, h, ss, pad
        self.PW = int(round((w + 2 * pad) * ss))
        self.PH = int(round((h + 2 * pad) * ss))
        self.img = np.zeros((self.PH, self.PW, 4), np.float32)
        xs = (np.arange(self.PW, dtype=np.float32) + 0.5) / ss - pad
        ys = (np.arange(self.PH, dtype=np.float32) + 0.5) / ss - pad
        self.X, self.Y = np.meshgrid(xs, ys)

    # -- primitives -------------------------------------------------------
    def px(self, x, y):
        return (x + self.pad) * self.ss, (y + self.pad) * self.ss

    def over(self, rgb, a):
        """Composite colour rgb (array or tuple) with coverage a (H, W) over the canvas."""
        a = a[..., None].astype(np.float32)
        rgb = np.asarray(rgb, np.float32)
        src = np.concatenate([rgb * a, a], axis=-1) if rgb.ndim == 3 else np.concatenate([a * rgb, a], axis=-1)
        self.img = src + self.img * (1.0 - a)

    def sdf_rrect(self, x, y, w, h, r):
        cx, cy = x + w / 2, y + h / 2
        qx = np.abs(self.X - cx) - (w / 2 - r)
        qy = np.abs(self.Y - cy) - (h / 2 - r)
        return np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - r

    def cover(self, sdf):
        return np.clip(0.5 - sdf * self.ss, 0.0, 1.0)

    def rrect(self, x, y, w, h, r, color, alpha=1.0):
        self.over(color, self.cover(self.sdf_rrect(x, y, w, h, r)) * alpha)

    def stroke_rrect(self, x, y, w, h, r, width, color, alpha=1.0):
        sdf = self.sdf_rrect(x, y, w, h, r)
        self.over(color, self.cover(np.abs(sdf + width / 2) - width / 2) * alpha)

    def capsule(self, x0, y0, x1, y1, width, color, alpha=1.0):
        px, py = self.X - x0, self.Y - y0
        bx, by = x1 - x0, y1 - y0
        h = np.clip((px * bx + py * by) / max(bx * bx + by * by, 1e-6), 0, 1)
        d = np.hypot(px - bx * h, py - by * h) - width / 2
        self.over(color, self.cover(d) * alpha)

    def disc(self, cx, cy, r, color, alpha=1.0):
        self.over(color, self.cover(np.hypot(self.X - cx, self.Y - cy) - r) * alpha)

    def ring(self, cx, cy, r, width, color, alpha=1.0, a0=None, a1=None):
        d = np.abs(np.hypot(self.X - cx, self.Y - cy) - r) - width / 2
        cov = self.cover(d)
        if a0 is not None:
            ang = np.arctan2(self.Y - cy, self.X - cx)
            ang = np.mod(ang - a0, 2 * np.pi)
            cov = cov * (ang <= np.mod(a1 - a0, 2 * np.pi))
        self.over(color, cov * alpha)

    def poly(self, pts, color, alpha=1.0):
        k = 4
        im = Image.new("L", (self.PW * k, self.PH * k), 0)
        ImageDraw.Draw(im).polygon([((x + self.pad) * self.ss * k, (y + self.pad) * self.ss * k) for x, y in pts], fill=255)
        m = np.asarray(im.resize((self.PW, self.PH), Image.BOX), np.float32) / 255.0
        self.over(color, m * alpha)

    def text(self, x, y, s, weight, size, color=INK, alpha=1.0, anchor="l", tracking=0.0):
        """Draw text with its baseline at y. anchor: l / c / r horizontally."""
        m, ox, by, adv = text_mask(s, weight, size, tracking, self.ss)
        px, py = self.px(x, y)
        if anchor == "c":
            px -= adv / 2
        elif anchor == "r":
            px -= adv
        ix, iy = int(round(px - ox)), int(round(py - by))
        full = np.zeros((self.PH, self.PW), np.float32)
        h, w = m.shape
        x0, y0 = max(ix, 0), max(iy, 0)
        x1, y1 = min(ix + w, self.PW), min(iy + h, self.PH)
        if x1 > x0 and y1 > y0:
            full[y0:y1, x0:x1] = m[y0 - iy:y1 - iy, x0 - ix:x1 - ix]
        self.over(color, full * alpha)
        return adv / self.ss

    def image(self, x, y, w, h, rgb, r=0.0, alpha=1.0):
        px0, py0 = self.px(x, y)
        pw, ph = int(round(w * self.ss)), int(round(h * self.ss))
        img = cv2.resize(rgb.astype(np.float32), (pw, ph), interpolation=cv2.INTER_AREA)
        full = np.zeros((self.PH, self.PW, 3), np.float32)
        ix, iy = int(round(px0)), int(round(py0))
        x0, y0 = max(ix, 0), max(iy, 0)
        x1, y1 = min(ix + pw, self.PW), min(iy + ph, self.PH)
        full[y0:y1, x0:x1] = img[y0 - iy:y1 - iy, x0 - ix:x1 - ix]
        self.over(full, self.cover(self.sdf_rrect(x, y, w, h, r)) * alpha)

    def vgrad(self, x, y, w, h, r, color, a_top, a_bot):
        m = self.cover(self.sdf_rrect(x, y, w, h, r))
        k = np.clip((self.Y - y) / h, 0, 1)
        self.over(color, m * (a_top + (a_bot - a_top) * k))

    def sprite(self):
        return Sprite(self.img, self.ss)


# --------------------------------------------------------------------------- glass

def glass(c, x, y, w, h, r, tint=0.115, alpha=0.84, shadow=0.6, seed=0):
    """Photoreal frosted dark glass: soft drop shadow, gradient body, frost, sheen, lit rim."""
    if shadow > 0:
        m = c.cover(c.sdf_rrect(x + 6, y + 30, w - 12, h - 10, r))
        m = cv2.GaussianBlur(m, (0, 0), 26 * c.ss)
        c.over((0.0, 0.0, 0.0), m * shadow)
    sdf = c.sdf_rrect(x, y, w, h, r)
    m = c.cover(sdf)
    k = np.clip((c.Y - y) / h, 0, 1)
    rng = np.random.default_rng(seed)
    frost = cv2.GaussianBlur(rng.standard_normal(m.shape).astype(np.float32), (0, 0), 1.2) * 0.006
    val = (tint * (1.12 - 0.45 * k) + frost)[..., None]
    c.over(val * np.array([1.0, 0.985, 0.985], np.float32), m * alpha)
    # diagonal sheen
    diag = (c.X - x) / w * 0.6 + (c.Y - y) / h * 0.4
    sheen = gauss(diag - 0.32, 0.16) * 0.045 + gauss(diag - 0.55, 0.05) * 0.02
    c.over((1, 1, 1), m * sheen)
    # inner bevel: brighter top rim, faint all around
    rim = c.cover(np.abs(sdf + 0.75) - 0.75)
    top = np.clip(1.0 - (c.Y - y) / (h * 0.55), 0, 1) ** 2
    c.over((1, 1, 1), rim * (0.075 + 0.22 * top))


def pill(c, x, y, w, h, alpha=0.86, seed=0):
    glass(c, x, y, w, h, h / 2, tint=0.13, alpha=alpha, shadow=0.5, seed=seed)


# --------------------------------------------------------------------------- posters

def _noise(h, w, cells, rng):
    ch, cw = max(2, int(h / w * cells)), max(2, cells)
    small = rng.random((ch + 3, cw + 3)).astype(np.float32)
    big = cv2.resize(small, (w + int(3 * w / cw), h + int(3 * h / ch)), interpolation=cv2.INTER_CUBIC)
    return big[:h, :w]


def _fbm(h, w, rng, base=4, octaves=4):
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        out += amp * _noise(h, w, base * 2 ** o, rng)
        tot += amp
        amp *= 0.5
    return out / tot


def _ridge(w, rng, cells=6, octaves=4):
    x = np.zeros(w, np.float32)
    amp = 1.0
    for o in range(octaves):
        n = cells * 2 ** o
        pts = rng.random(n + 3).astype(np.float32)
        x += amp * cv2.resize(pts[None, :], (w + int(3 * w / n), 1), interpolation=cv2.INTER_CUBIC)[0, :w]
        amp *= 0.5
    return (x - x.mean()) / (x.std() + 1e-6)


def poster(kind, w, h, seed=0):
    """Monochrome cinematic still (w x h px) with red as the only colour, returned as RGB float."""
    rng = np.random.default_rng(seed)
    V, U = np.mgrid[0:h, 0:w].astype(np.float32)
    U, V = (U + 0.5) / w, (V + 0.5) / h
    asp = w / h
    lum = np.zeros((h, w), np.float32)
    red = np.zeros((h, w), np.float32)
    if kind == "horizon":
        hy = 0.6
        lum += 0.025 + 0.22 * np.clip(V / hy, 0, 1) ** 3
        lum += (_fbm(h, w, rng, 3, 4) - 0.5) * 0.08 * (V < hy) * (V / hy)
        d2 = ((U - 0.62) * asp) ** 2 + (V - hy) ** 2
        red += 1.3 * np.exp(-d2 / 0.03) + 2.5 * (d2 < 0.0025) + 0.5 * np.exp(-((V - hy) / 0.03) ** 2) * np.exp(-((U - 0.62) / 0.4) ** 2)
        ridge = hy + 0.02 * _ridge(w, rng, 5)[None, :]
        ground = V > ridge
        lum = np.where(ground, 0.012 + 0.03 * np.exp(-((V - hy) / 0.08) ** 2), lum)
        red = np.where(ground, red * 0.08 + 0.25 * np.exp(-((U - 0.62) / 0.05) ** 2) * np.exp(-((V - hy) / 0.3) ** 2) * (_noise(h, w, 60, rng) > 0.5), red)
    elif kind == "city":
        lum += 0.02 + 0.07 * V
        bok = np.zeros((h, w), np.float32)
        bred = np.zeros((h, w), np.float32)
        for _ in range(55):
            cx, cy = rng.random() * w, (0.05 + 0.7 * rng.random()) * h
            r = (0.02 + 0.07 * rng.random()) * w
            b = 0.08 + 0.35 * rng.random() ** 2
            tgt = bred if rng.random() < 0.1 else bok
            layer = np.zeros((h, w), np.float32)
            cv2.circle(layer, (int(cx), int(cy)), int(r), b, -1, cv2.LINE_AA)
            cv2.circle(layer, (int(cx), int(cy)), int(r), b * 1.6, max(1, int(r * 0.08)), cv2.LINE_AA)
            tgt += layer
        lum += cv2.GaussianBlur(bok, (0, 0), w * 0.004)
        red += cv2.GaussianBlur(bred, (0, 0), w * 0.004) * 2.2
        x = 0
        while x < w:
            bw = int((0.06 + 0.12 * rng.random()) * w)
            top = int((0.7 + 0.22 * rng.random()) * h)
            lum[top:, x:x + bw] = 0.01
            red[top:, x:x + bw] = 0.0
            win = (rng.random((h - top, min(bw, w - x))) > 0.985).astype(np.float32) * 0.25
            lum[top:, x:x + bw] += cv2.GaussianBlur(win, (0, 0), 0.6)
            x += bw + int(0.01 * w)
    elif kind == "ridge":
        lum += 0.05 + 0.18 * (1 - V)
        d2 = ((U - 0.72) * asp) ** 2 + (V - 0.2) ** 2
        lum += 0.9 * (d2 < 0.0012) + 0.12 * np.exp(-d2 / 0.02)
        for j in range(5):
            base = 0.38 + 0.11 * j
            line = base + (0.07 - 0.008 * j) * _ridge(w, rng, 3 + j, 4)[None, :]
            val = 0.27 - 0.05 * j
            mask = V > line
            fog = np.exp(-((V - line) / 0.06) ** 2) * 0.05
            lum = np.where(mask, val + fog * (V > line), lum)
        red += 0.18 * np.exp(-((U - 0.3) / 0.25) ** 2) * np.exp(-((V - 0.95) / 0.2) ** 2)
    elif kind == "corridor":
        vx, vy = 0.5, 0.46
        ang = np.arctan2(V - vy, (U - vx) * asp)
        dist = np.hypot((U - vx) * asp, V - vy)
        lines = np.abs(np.cos(ang * 9)) ** 60
        rings = np.abs(np.cos(np.log(dist + 1e-3) * 11.0)) ** 40
        lum += 0.025 + (0.05 * lines + 0.06 * rings) * np.clip(dist * 2.2, 0, 1)
        lum *= 1 - 0.8 * (np.abs(U - vx) * asp < 0.12) * (np.abs(V - vy) < 0.18)
        red += 1.6 * np.exp(-dist ** 2 / 0.004) + 0.4 * np.exp(-dist ** 2 / 0.05)
    elif kind == "figure":
        beam_w = 0.04 + 0.32 * np.clip(V, 0, 1)
        beam = np.exp(-((U - 0.5) / beam_w) ** 2) * np.clip(V * 1.4, 0, 1)
        lum += 0.015 + 0.30 * beam
        dust = (_noise(h, w, 90, rng) > 0.93).astype(np.float32) * beam * 0.3
        lum += cv2.GaussianBlur(dust, (0, 0), 0.8)
        floor = np.exp(-(((U - 0.5) / 0.28) ** 2 + ((V - 0.86) / 0.05) ** 2))
        lum += 0.25 * floor
        head = np.hypot((U - 0.5) * asp, V - 0.6) < 0.045
        body = (V > 0.645) & (V < 0.88) & (np.abs(U - 0.5) < 0.035 + 0.12 * np.clip((V - 0.645) / 0.08, 0, 1) * (V < 0.73) + 0.12 * (V >= 0.73))
        sil = (head | body).astype(np.float32)
        sil = cv2.GaussianBlur(sil, (0, 0), 1.0)
        lum = lum * (1 - sil) + 0.008 * sil
        red += 0.25 * np.exp(-((V - 0.0) / 0.12) ** 2) * np.exp(-((U - 0.5) / 0.08) ** 2)
    elif kind == "wave":
        hy = 0.44
        lum += 0.02 + 0.2 * np.clip(V / hy, 0, 1) ** 2.5 * (V < hy)
        sea = V >= hy
        streak = _noise(h, w, 9, rng) * _noise(h, w, 30, rng)
        streak = cv2.resize(cv2.resize(streak, (w, max(2, h // 24))), (w, h))
        glit = np.exp(-((U - 0.5) / (0.06 + 0.4 * (V - hy))) ** 2) * streak ** 3 * 3.0
        lum = np.where(sea, 0.015 + 0.05 * (V - hy) + 0.35 * glit, lum)
        d2 = ((U - 0.5) * asp) ** 2 + (V - hy + 0.02) ** 2
        red += (1.2 * np.exp(-d2 / 0.01) + 2.0 * (d2 < 0.0008)) * (V < hy) + 0.6 * glit * sea
    rgb = lum[..., None] * WARM + np.clip(red, 0, 4)[..., None] * RED * 0.9
    # lens: vignette + soft halation on the red + grain
    vig = 1 - 0.55 * smooth(((U - 0.5) ** 2 + (V - 0.5) ** 2) / 0.5)
    rgb *= vig[..., None]
    rgb += cv2.GaussianBlur(np.clip(red, 0, 4), (0, 0), w * 0.03)[..., None] * RED * 0.25
    rgb += rng.standard_normal((h, w, 1)).astype(np.float32) * 0.012
    return np.clip(rgb, 0, 1)


def poster_tile(kind, title, w, h, seed, ss=2.0, r=12.0, subtitle=None):
    c = Canvas(w, h, ss, pad=40)
    m = c.cover(c.sdf_rrect(6, 24, w - 12, h - 8, r))
    c.over((0, 0, 0), cv2.GaussianBlur(m, (0, 0), 18 * ss) * 0.65)
    img = poster(kind, int(w * ss), int(h * ss), seed)
    c.image(0, 0, w, h, img, r)
    c.vgrad(0, h * 0.55, w, h * 0.45, r, (0, 0, 0), 0.0, 0.75)
    size = w * 0.105
    fit = text_mask(title, "heavy", size, 0.06, 1.0)[3]
    if fit > w * 0.84:
        size *= w * 0.84 / fit
    c.text(w / 2, h - h * 0.085 - (size * 0.9 if subtitle else 0), title, "heavy", size, INK, anchor="c", tracking=0.06)
    if subtitle:
        c.text(w / 2, h - h * 0.075, subtitle, "medium", size * 0.42, GREY, anchor="c", tracking=0.2)
    c.stroke_rrect(0, 0, w, h, r, 1.2, (1, 1, 1), 0.10)
    return c.sprite()


def still(kind, w, h, seed, ss=2.0, r=10.0, alpha=1.0):
    c = Canvas(w, h, ss)
    c.image(0, 0, w, h, poster(kind, int(w * ss), int(h * ss), seed), r, alpha)
    return c


# --------------------------------------------------------------------------- icons

def icon_pause(c, cx, cy, s, color=INK, alpha=1.0):
    c.rrect(cx - s * 0.36, cy - s * 0.5, s * 0.24, s, s * 0.06, color, alpha)
    c.rrect(cx + s * 0.12, cy - s * 0.5, s * 0.24, s, s * 0.06, color, alpha)


def icon_play(c, cx, cy, s, color=INK, alpha=1.0):
    c.poly([(cx - s * 0.35, cy - s * 0.5), (cx + s * 0.5, cy), (cx - s * 0.35, cy + s * 0.5)], color, alpha)


def icon_skip(c, cx, cy, s, fwd=True, color=INK, alpha=1.0):
    r = s * 0.5
    if fwd:
        c.ring(cx, cy, r, s * 0.085, color, alpha, a0=-math.pi * 0.35, a1=-math.pi * 0.6)
        tip = (cx + r * math.cos(-math.pi * 0.35), cy + r * math.sin(-math.pi * 0.35))
        c.poly([(tip[0] - s * 0.2, tip[1] - s * 0.17), (tip[0] + s * 0.14, tip[1] + s * 0.04), (tip[0] - s * 0.13, tip[1] + s * 0.2)], color, alpha)
    else:
        c.ring(cx, cy, r, s * 0.085, color, alpha, a0=-math.pi * 0.4, a1=-math.pi * 0.65)
        tip = (cx + r * math.cos(-math.pi * 0.65), cy + r * math.sin(-math.pi * 0.65))
        c.poly([(tip[0] + s * 0.2, tip[1] - s * 0.17), (tip[0] - s * 0.14, tip[1] + s * 0.04), (tip[0] + s * 0.13, tip[1] + s * 0.2)], color, alpha)
    c.text(cx, cy + s * 0.17, "10", "semibold", s * 0.42, color, alpha, anchor="c")


def icon_cc(c, cx, cy, s, color=INK, alpha=1.0):
    c.stroke_rrect(cx - s * 0.6, cy - s * 0.42, s * 1.2, s * 0.84, s * 0.14, s * 0.08, color, alpha)
    c.text(cx, cy + s * 0.16, "CC", "bold", s * 0.44, color, alpha, anchor="c")


def icon_speaker(c, cx, cy, s, color=INK, alpha=1.0, waves=2):
    c.poly([(cx - s * 0.5, cy - s * 0.16), (cx - s * 0.28, cy - s * 0.16), (cx - s * 0.02, cy - s * 0.42),
            (cx - s * 0.02, cy + s * 0.42), (cx - s * 0.28, cy + s * 0.16), (cx - s * 0.5, cy + s * 0.16)], color, alpha)
    for i in range(waves):
        c.ring(cx + s * 0.02, cy, s * (0.24 + 0.2 * i), s * 0.075, color, alpha, a0=-0.85, a1=0.85)


def icon_download(c, cx, cy, s, color=INK, alpha=1.0):
    c.capsule(cx, cy - s * 0.42, cx, cy + s * 0.2, s * 0.11, color, alpha)
    c.capsule(cx - s * 0.26, cy - s * 0.02, cx, cy + s * 0.24, s * 0.11, color, alpha)
    c.capsule(cx + s * 0.26, cy - s * 0.02, cx, cy + s * 0.24, s * 0.11, color, alpha)
    c.capsule(cx - s * 0.34, cy + s * 0.46, cx + s * 0.34, cy + s * 0.46, s * 0.1, color, alpha)


def icon_check(c, cx, cy, s, color=INK, alpha=1.0):
    c.capsule(cx - s * 0.36, cy + s * 0.02, cx - s * 0.1, cy + s * 0.28, s * 0.12, color, alpha)
    c.capsule(cx - s * 0.1, cy + s * 0.28, cx + s * 0.4, cy - s * 0.26, s * 0.12, color, alpha)
