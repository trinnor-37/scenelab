"""BingeNest popcorn-tub eruption, v2 (styled after the client's references).

2.2 s @ 60 fps, delivered as a transparent overlay plus a full version over a
purple hyperspace background.

  0.00  a glossy striped tub with a scalloped rim rockets in, spinning
  0.50  hero turn, logo to camera; the tub charges up (shake, inner glow,
        kernels jiggling)
  0.95  ERUPTION: a neon ring blasts open behind it, an energy blaze at the
        mouth, a geyser of fluffy kernels pours out toward the lens, embers fly
  1.32  the tub shatters into its own curved striped shards
  2.20  the frame is clearing, ready for the next shot

The tub is ray-traced per pixel (ray / truncated-cone intersection in numpy):
smooth curved shading, glossy highlight, purple rim light, a visible inside
and the scalloped lip. Popcorn is procedural, built as height fields. Motion
blur is temporal supersampling: up to 20 sub-frames per frame over a
180-degree shutter.
"""
import math
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from assets import Sprite, load_rgba, soft_dot, glint  # noqa: E402
from engine import Camera, Card, card_homography, fast_blur, rot_matrix  # noqa: E402

FPS = 60
DURATION = 2.2
NFRAMES = int(round(FPS * DURATION))
SHUTTER = 0.5 / FPS

T_ARRIVE = 0.50
T_ERUPT = 0.95
T_SHATTER = 1.32   # (unused: the tub now exits instead of shattering)
T_EXIT = 1.48      # tub dives toward the lens and whooshes out of frame

RT, RB, HGT = 175.0, 128.0, 300.0           # tub: top radius, bottom radius, height
SCALLOPS, SC_AMP, LIP = 14, 9.0, 13.0       # rim waves, wave depth, rolled-lip height
B_SLOPE = (RB - RT) / HGT
A_CONE = RT + B_SLOPE * HGT / 2             # r(y) = A + B*y, y in [-H/2, H/2], y down

FORMATS = {
    "16x9": dict(W=1920, H=1080, base=1.55, spread=(1.0, 1.0), fly=(-560.0, 160.0)),
    "9x16": dict(W=1080, H=1920, base=1.72, spread=(0.6, 1.35), fly=(0.0, 760.0)),
}

RED = np.array([0.88, 0.05, 0.10], np.float32)
WHITE = np.array([1.0, 0.97, 0.95], np.float32)


def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def out_quart(x):
    x = clamp(x)
    return 1 - (1 - x) ** 4


def out_expo(x):
    x = clamp(x)
    return 1.0 if x >= 1 else 1 - 2 ** (-10 * x)


def r_of(y):
    return A_CONE + B_SLOPE * y


def rim_y(theta):
    """Top edge of the tub (local y, up is negative) – scalloped."""
    return -HGT / 2 + SC_AMP * (0.5 - 0.5 * np.cos(SCALLOPS * theta))


# ------------------------------------------------------------------ textures

def tub_texture(TW=2048, TH=640):
    """Unrolled tub wall: u = angle (0..2pi), v = height (top..bottom)."""
    logo = load_rgba("reference_logo")
    vv, uu = np.mgrid[0:TH, 0:TW].astype(np.float32)
    th = uu / TW * 2 * np.pi
    n = 26
    f = (th / (2 * np.pi) * n) % 1.0
    # soft stripe edges (about 1.5 px)
    w = TW / n
    e = np.clip((np.minimum(f, 1 - f) * w - 0.0) / 1.6, 0, 1)
    k = np.floor(th / (2 * np.pi) * n) % 2
    col = np.where((k == 0)[..., None], RED, WHITE)
    other = np.where((k == 0)[..., None], WHITE, RED)
    col = col * (0.5 + 0.5 * e[..., None]) + other * (0.5 - 0.5 * e[..., None])
    rng = np.random.default_rng(5)
    noise = cv2.GaussianBlur(rng.standard_normal((TH, TW)).astype(np.float32), (0, 0), 1.0) * 0.018
    col = col * (1 + noise[..., None])
    # logo: centred on the side that faces the camera (theta = -pi/2 -> 1.5pi)
    yloc = vv / (TH - 1) * HGT - HGT / 2
    lh = int(TH * 0.70)
    lw = int(logo.shape[1] * lh / logo.shape[0])
    L = cv2.resize(logo, (lw, lh), interpolation=cv2.INTER_AREA)
    v0 = int(TH * 0.255)
    r_avg = (RT + RB) / 2
    cu = 1.5 * np.pi / (2 * np.pi) * TW
    # per-row horizontal compensation so the logo isn't distorted by the taper
    mapx = np.zeros((TH, TW), np.float32) - 1
    mapy = np.zeros((TH, TW), np.float32) - 1
    rows = np.arange(TH)
    scale = r_of(yloc[:, 0]) / r_avg            # physical width per texel, relative
    for v in rows[(rows >= v0) & (rows < v0 + lh)]:
        lx = (uu[v] - cu) * scale[v] + lw / 2
        mapx[v] = lx
        mapy[v] = v - v0
    Lw = cv2.remap(L, mapx, mapy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    la = Lw[..., 3:4]
    col = Lw[..., :3] + col * (1 - la)
    inner = (col * 0.0 + np.where((k == 0)[..., None], np.float32([0.80, 0.30, 0.34]), np.float32([0.95, 0.90, 0.90])))
    return np.ascontiguousarray(col, np.float32), np.ascontiguousarray(inner, np.float32)


def fluffy_kernel(seed, size=320):
    """Photo-ish popped kernel: bumpy cauliflower lobes, cream tops, butter-gold
    underside, a few brown hull flecks, soft buttery highlight. No outline."""
    rng = np.random.default_rng(seed * 7 + 3)
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    c = size / 2
    R = size * 0.27
    lobes = [(c + rng.uniform(-8, 8), c + rng.uniform(-8, 8), R * rng.uniform(0.6, 0.75))]
    nl = int(rng.integers(6, 10))
    base = rng.uniform(0, 2 * np.pi)
    for j in range(nl):
        a = base + j * 2 * np.pi / nl + rng.uniform(-0.4, 0.4)
        d = R * rng.uniform(0.55, 1.0)
        lobes.append((c + math.cos(a) * d, c + math.sin(a) * d, R * rng.uniform(0.38, 0.6)))
    h = np.zeros((size, size), np.float32)
    for (lx, ly, lr) in lobes:
        ea = rng.uniform(0.8, 1.2)
        d2 = ((x - lx) * ea) ** 2 + ((y - ly) / ea) ** 2
        h = np.maximum(h, np.sqrt(np.clip(lr * lr - d2, 0, None)))
    body = h > 0
    # cauliflower bumps: multi-octave noise on the height field
    bump = np.zeros_like(h)
    for octv, amp in ((size / 22, 1.0), (size / 48, 0.5), (size / 100, 0.25)):
        nz = cv2.GaussianBlur(rng.standard_normal((size, size)).astype(np.float32), (0, 0), octv)
        bump += nz / (nz.std() + 1e-6) * amp
    hb = h + bump * (R * 0.035) * body
    hs = cv2.GaussianBlur(hb, (0, 0), 1.2)
    gy, gx = np.gradient(hs)
    nrm = np.sqrt(gx * gx + gy * gy + 1)
    Nx, Ny, Nz = -gx / nrm, -gy / nrm, 1 / nrm
    L = np.array([-0.5, -0.65, 0.58]); L /= np.linalg.norm(L)
    lam = np.clip(Nx * L[0] + Ny * L[1] + Nz * L[2], 0, 1)
    Hh = L + np.array([0, 0, 1.0]); Hh /= np.linalg.norm(Hh)
    sd = np.clip(Nx * Hh[0] + Ny * Hh[1] + Nz * Hh[2], 0, 1)
    crease = np.clip((cv2.GaussianBlur(h, (0, 0), size * 0.025) - h) / (R * 0.16), 0, 1)
    hn = np.clip(h / (R * 0.7), 0, 1)
    gold = np.array([1.0, 0.60, 0.10]); butter = np.array([1.0, 0.86, 0.40]); cream = np.array([1.0, 0.97, 0.86])
    alb = gold + (butter - gold) * np.clip(hn * 2.2, 0, 1)[..., None]
    alb = alb + (cream - alb) * np.clip((lam - 0.35) * 1.8, 0, 1)[..., None]
    # hull flecks in a couple of creases
    fl = cv2.GaussianBlur((rng.random((size, size)) > 0.9975).astype(np.float32), (0, 0), size * 0.018)
    fl = np.clip(fl / (fl.max() + 1e-6) * 2.4, 0, 1) * np.clip(crease * 3 + 0.35, 0, 1) * body
    alb = alb * (1 - fl[..., None] * 0.8) + np.array([0.78, 0.36, 0.07]) * fl[..., None] * 0.8
    shade = (0.76 + 0.42 * lam)[..., None] * (1 - 0.42 * crease[..., None])
    # soft translucent edge glow (light bleeding through thin popcorn)
    edge = np.clip(1 - Nz, 0, 1) ** 2
    col = alb * shade + (sd ** 30)[..., None] * 0.75 + (sd ** 6)[..., None] * 0.08 \
        + edge[..., None] * np.array([1.0, 0.8, 0.45]) * 0.18
    a = cv2.GaussianBlur(body.astype(np.float32), (0, 0), 0.9)
    col = np.clip(col, 0, 1).astype(np.float32)
    return Sprite(np.dstack([col * a[..., None], a]).astype(np.float32))


def chip_sprite(seed, size=96):
    """Small red/white paper chip (rhombus) for the confetti."""
    rng = np.random.default_rng(seed)
    img = np.zeros((size, size, 4), np.float32)
    pts = np.int32([[size * 0.5, 4], [size - 4, size * 0.45], [size * 0.5, size - 4], [4, size * 0.55]])
    m = np.zeros((size, size), np.uint8)
    cv2.fillConvexPoly(m, pts, 1, cv2.LINE_AA)
    stripe = ((np.mgrid[0:size, 0:size][1] + np.mgrid[0:size, 0:size][0] * 0.3) // (size / 3)) % 2
    col = np.where(stripe[..., None] == 0, RED, WHITE) if seed % 2 else np.where(stripe[..., None] == 0, WHITE, RED)
    a = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 0.7)
    img[..., :3] = col * a[..., None]
    img[..., 3] = a
    return Sprite(img)


# ------------------------------------------------------------------ RGBA layer
class Layer:
    def __init__(self, W, H):
        self.W, self.H = W, H
        self.c = np.zeros((H, W, 4), np.float32)

    def over(self, X0, Y0, rgba):
        h, w = rgba.shape[:2]
        x0, y0 = max(0, X0), max(0, Y0)
        x1, y1 = min(self.W, X0 + w), min(self.H, Y0 + h)
        if x1 <= x0 or y1 <= y0:
            return
        s = rgba[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0]
        d = self.c[y0:y1, x0:x1]
        d *= 1 - s[..., 3:4]
        d += s

    def add(self, X0, Y0, rgb):
        h, w = rgb.shape[:2]
        x0, y0 = max(0, X0), max(0, Y0)
        x1, y1 = min(self.W, X0 + w), min(self.H, Y0 + h)
        if x1 <= x0 or y1 <= y0:
            return
        s = rgb[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0]
        d = self.c[y0:y1, x0:x1]
        d[..., :3] += s
        d[..., 3] = np.maximum(d[..., 3], np.clip(s.max(axis=2), 0, 1))

    def card(self, cam, card, opacity=1.0, blur=0.0, tint=None, additive=False):
        Hm, info = card_homography(cam, card)
        if Hm is None:
            return
        spr = card.sprite
        lvl = spr.level_for(info[1])
        img = spr.levels[lvl]
        Hm = Hm @ np.diag([spr.w / img.shape[1], spr.h / img.shape[0], 1.0])
        self.warp(img, Hm, opacity, blur, tint, additive)

    def quad(self, cam, spr, corners, tint=None, opacity=1.0, blur=0.0):
        sx, sy, d = cam.project(corners[:, 0], corners[:, 1], corners[:, 2])
        if np.any(d < 30):
            return
        dst = np.float32(np.stack([sx, sy], 1))
        src = np.float32([[0, 0], [spr.w, 0], [spr.w, spr.h], [0, spr.h]])
        Hm = cv2.getPerspectiveTransform(src, dst)
        sc = math.sqrt(max(abs(cv2.contourArea(dst)), 1e-6) / (spr.w * spr.h))
        lvl = spr.level_for(sc)
        img = spr.levels[lvl]
        self.warp(img, Hm @ np.diag([spr.w / img.shape[1], spr.h / img.shape[0], 1.0]), opacity, blur, tint)

    def warp(self, img, Hm, opacity, blur, tint, additive=False):
        h, w = img.shape[:2]
        dst = cv2.perspectiveTransform(np.float32([[[0, 0], [w, 0], [w, h], [0, h]]]), Hm)[0]
        pad = int(math.ceil(blur * 3)) + 2
        x0 = int(math.floor(dst[:, 0].min())) - pad
        y0 = int(math.floor(dst[:, 1].min())) - pad
        x1 = int(math.ceil(dst[:, 0].max())) + pad
        y1 = int(math.ceil(dst[:, 1].max())) + pad
        X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(self.W, x1), min(self.H, y1)
        if X1 <= X0 or Y1 <= Y0 or (x1 - x0) * (y1 - y0) > 16_000_000:
            return
        bx0, by0 = max(x0, X0 - pad), max(y0, Y0 - pad)
        bx1, by1 = min(x1, X1 + pad), min(y1, Y1 + pad)
        T = np.array([[1, 0, -bx0], [0, 1, -by0], [0, 0, 1]], float)
        out = cv2.warpPerspective(img, T @ Hm, (bx1 - bx0, by1 - by0), flags=cv2.INTER_LINEAR,
                                  borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
        if blur > 0.6:
            out = fast_blur(out, blur)
        out = out[Y0 - by0:Y1 - by0, X0 - bx0:X1 - bx0] * opacity
        if tint is not None:
            out[..., :3] *= np.float32(tint)
        if additive:
            self.add(X0, Y0, out[..., :3])
        else:
            self.over(X0, Y0, out)


# ------------------------------------------------------------------ scene
class Tub:
    def __init__(self, fmt):
        F = FORMATS[fmt]
        self.fmt = fmt
        self.W, self.H, self.base = F["W"], F["H"], F["base"]
        self.spread, self.fly = F["spread"], F["fly"]
        self.tex, self.tex_in = tub_texture()
        self.TH, self.TW = self.tex.shape[:2]
        self.kern = [fluffy_kernel(s) for s in range(12)]
        self.chips = [chip_sprite(s) for s in range(4)]
        self.dot = soft_dot()
        self.glint = glint()
        self.L = np.array([-0.50, -0.62, -0.60]); self.L /= np.linalg.norm(self.L)
        self._prep()

    def _prep(self):
        rng = np.random.default_rng(21)
        sx, sy = self.spread
        # heaped mound above the rim (local coords)
        self.mound = []
        for i in range(115):
            r = math.sqrt(rng.uniform(0, 1))
            a = rng.uniform(0, 2 * math.pi)
            rr = r * RT * 0.95
            x, z = math.cos(a) * rr, math.sin(a) * rr
            y = -HGT / 2 - (175 * (1 - r ** 1.8) + rng.uniform(-14, 14)) + 22
            self.mound.append(dict(p=np.array([x, y, z]), k=i % 12, s=rng.uniform(0.36, 0.46),
                                   rz=rng.uniform(0, 360), ph=rng.uniform(0, 6.3)))
        # eruption geyser – a stream spawning over ~0.4 s
        self.geyser = []
        for i in range(380):
            ts = T_ERUPT + (rng.uniform(0, 1) ** 1.6) * 0.55
            ang = rng.uniform(0, 2 * math.pi)
            cone = rng.uniform(0.15, 1.0)
            up = rng.uniform(750, 1700)
            d = np.array([math.cos(ang) * math.sin(cone) * 1.3, -math.cos(cone), math.sin(ang) * math.sin(cone)])
            v = d * up
            if i % 3 == 0:              # a third aimed at the lens
                v[2] -= rng.uniform(900, 2000)
            v[0] *= sx
            v[1] *= sy
            self.geyser.append(dict(ts=ts, p=np.array([rng.uniform(-80, 80), -HGT / 2 + rng.uniform(-10, 40),
                                                       rng.uniform(-80, 80)]),
                                    v=v, k=i % 12, s=rng.uniform(0.30, 0.50), rz=rng.uniform(0, 360),
                                    vr=rng.uniform(-500, 500)))
        for m in self.mound:
            d = np.array([m["p"][0] / 160, -1.0 - rng.uniform(0, 0.5), m["p"][2] / 160 - rng.uniform(0.2, 1.0)])
            d /= np.linalg.norm(d)
            v = d * rng.uniform(1100, 2300)
            v[0] *= sx
            v[1] *= sy
            m["v"] = v
            m["vr"] = rng.uniform(-420, 420)
            m["ts"] = T_ERUPT + rng.uniform(0, 0.06)
        # shards: tiles of the tub wall
        self.shards = []
        na, nv = 9, 3
        for i in range(na):
            for j in range(nv):
                a0 = (i + rng.uniform(-0.15, 0.15)) / na * 2 * math.pi
                a1 = (i + 1 + rng.uniform(-0.15, 0.15)) / na * 2 * math.pi
                y0 = -HGT / 2 + j * HGT / nv
                y1 = y0 + HGT / nv
                self.shards.append(dict(a0=a0, a1=a1, y0=y0, y1=y1,
                                        out=rng.uniform(900, 1700), up=rng.uniform(-200, 650),
                                        toward=rng.uniform(200, 1500),
                                        axis=rng.normal(size=3), spin=rng.uniform(300, 900) * rng.choice([-1, 1])))
        self.shard_sprites = [self._shard_sprite(s) for s in self.shards]
        self.chip_list = [dict(p=np.array([rng.uniform(-60, 60), -HGT / 2 + rng.uniform(0, 100), rng.uniform(-60, 60)]),
                               v=np.array([rng.uniform(-1500, 1500) * sx, rng.uniform(-1900, -300) * sy,
                                           rng.uniform(-1900, 300)]),
                               k=i % 4, s=rng.uniform(0.25, 0.5), rz=rng.uniform(0, 360),
                               vr=rng.uniform(-900, 900), ts=T_ERUPT + rng.uniform(0, 0.6))
                          for i in range(75)]
        self.embers = [(rng.uniform(-1, 1), rng.uniform(0.4, 1.0), rng.uniform(0, 0.45), rng.uniform(-1, 1))
                       for _ in range(70)]

    def _shard_sprite(self, s):
        """Texture patch for one shard (sampled from the tub texture)."""
        u0 = s["a0"] / (2 * math.pi) * self.TW
        u1 = s["a1"] / (2 * math.pi) * self.TW
        v0 = (s["y0"] + HGT / 2) / HGT * (self.TH - 1)
        v1 = (s["y1"] + HGT / 2) / HGT * (self.TH - 1)
        w, h = 160, int(160 * (v1 - v0) / max(1, (u1 - u0)) + 1)
        h = int(np.clip(h, 40, 320))
        mx, my = np.meshgrid(np.linspace(u0, u1, w), np.linspace(v0, v1, h))
        mx = (mx % self.TW).astype(np.float32)
        img = cv2.remap(self.tex, mx, my.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        rng = np.random.default_rng(abs(int(u0 * 7 + v0)) + 1)
        # jagged torn edges
        m = np.ones((h, w), np.float32)
        jag = cv2.GaussianBlur(rng.random((h, w)).astype(np.float32), (0, 0), 3)
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        dist = np.minimum.reduce([xx, w - 1 - xx, yy, h - 1 - yy])
        m = np.clip((dist - (jag - 0.4) * 14) / 1.5, 0, 1)
        return Sprite(np.dstack([img * m[..., None], m]).astype(np.float32))

    # ------------------------------------------------------------ motion
    def pose(self, t):
        fx, fy = self.fly
        p = clamp(t / T_ARRIVE)
        e = out_expo(p) * 0.8 + out_quart(p) * 0.2
        eq = out_quart(p)
        z = 5600 * (1 - e)
        x = fx * (1 - eq) + (200 * math.sin(math.pi * eq) if fx != 0 else 0)
        y = fy * (1 - eq) - 140 * math.sin(math.pi * eq)
        yaw = -900 * (1 - eq) + 12 * math.sin(smooth((t - T_ARRIVE) / 0.45) * math.pi) * 0.5
        pitch = 16 - 50 * (1 - eq)
        roll = 28 * (1 - eq) * math.sin(p * 6)
        u = t - T_ARRIVE
        if u > 0:
            roll += 4 * math.exp(-u * 7) * math.sin(u * 22)
            y -= 10 * math.sin(u * 3.0)            # gentle hover
        c = smooth((t - 0.70) / (T_ERUPT - 0.70))
        if c > 0 and t < T_ERUPT + 0.35:
            k = c * (1 - smooth((t - T_ERUPT) / 0.35))
            x += k * 6 * math.sin(t * 157)
            y += k * 5 * math.sin(t * 131 + 1)
            roll += k * 3 * math.sin(t * 173)
        sq = 1 - 0.08 * smooth((t - (T_ERUPT - 0.10)) / 0.10) * (1 - smooth((t - T_ERUPT) / 0.08))
        if t > T_ERUPT:  # recoil: kicks down as the geyser fires
            u2 = t - T_ERUPT
            y += 40 * math.exp(-u2 * 6) * math.sin(u2 * 18 + 0.3)
        ue = clamp((t - T_EXIT) / 0.42)
        if ue > 0:
            ein = ue ** 2.6
            sgn = 1 if fx <= 0 else -1
            x += sgn * 950 * ein * (1 if self.fmt == "16x9" else 0.55)
            y += 620 * ein
            z -= 1250 * ein
            yaw += 70 * ein
            roll += -35 * ein * sgn
            pitch += -25 * ein
        R = rot_matrix(pitch, yaw, roll)
        S = np.diag([1 / math.sqrt(sq), sq, 1 / math.sqrt(sq)])
        return R, S, np.array([x, y, z])

    def camera(self, t):
        zoom = 1.0 + 0.07 * smooth((t - 0.35) / 0.6)
        cx, roll = 0.0, 0.0
        cy = -105.0 if self.fmt == "16x9" else -70.0
        u = t - T_ERUPT
        if u >= 0:
            zoom += -0.06 * math.exp(-u * 7) * math.cos(u * 15) + 0.05 * (1 - math.exp(-u * 2.5))
            e = math.exp(-u * 8)
            cx += 8 * e * math.sin(u * 61)
            cy += 7 * e * math.sin(u * 53 + 1)
            roll += 1.2 * e * math.sin(u * 37)
        u = t - (T_EXIT + 0.3)
        if u >= 0:   # whoosh buffet as the tub passes the lens
            e = math.exp(-u * 9)
            cx += 6 * e * math.sin(u * 70)
            cy += 5 * e * math.sin(u * 59)
        cam = Camera(self.W, self.H, self.base, cx, cy, zoom, roll)
        cam.focus = cam.D
        cam.aperture = 11.0
        return cam

    # ------------------------------------------------------------ ray-traced tub
    def trace_tub(self, cam, R, S, P, inner):
        """inner=False: outer surface; inner=True: inside back wall visible over the rim."""
        # screen bbox from sampled silhouette points
        th = np.linspace(0, 2 * np.pi, 24, endpoint=False)
        pts = []
        for y in (-HGT / 2 - SC_AMP, HGT / 2):
            r = r_of(y)
            pts.append(np.stack([np.cos(th) * r, np.full_like(th, y), np.sin(th) * r], 1))
        pts = np.concatenate(pts) @ (R @ S).T + P
        sx, sy, d = cam.project(pts[:, 0], pts[:, 1], pts[:, 2])
        if np.all(d < 50):
            return None
        if np.any(d < 50):   # very close to the lens: trace the whole frame
            sx = np.array([0, self.W]); sy = np.array([0, self.H])
        x0, x1 = int(sx.min()) - 3, int(sx.max()) + 4
        y0, y1 = int(sy.min()) - 3, int(sy.max()) + 4
        x0, y0 = max(0, x0), max(0, y0)
        x1, y1 = min(self.W, x1), min(self.H, y1)
        if x1 <= x0 or y1 <= y0:
            return None
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        dx, dy = xx - self.W / 2, yy - self.H / 2
        px = cam.cr * dx + cam.sr * dy
        py = -cam.sr * dx + cam.cr * dy
        dw = np.stack([px / cam.f, py / cam.f, np.ones_like(px)], -1)
        Minv = np.linalg.inv(S) @ R.T
        O = Minv @ (np.array([cam.cx, cam.cy, -cam.D]) - P)
        dl = dw @ Minv.T
        ox, oy, oz = O
        dxl, dyl, dzl = dl[..., 0], dl[..., 1], dl[..., 2]
        b, a = B_SLOPE, A_CONE
        A = dxl * dxl + dzl * dzl - b * b * dyl * dyl
        Bq = 2 * (ox * dxl + oz * dzl - b * dyl * (a + b * oy))
        C = ox * ox + oz * oz - (a + b * oy) ** 2
        disc = Bq * Bq - 4 * A * C
        ok = disc > 0
        sq = np.sqrt(np.where(ok, disc, 0))
        t1 = (-Bq - sq) / (2 * A)
        t2 = (-Bq + sq) / (2 * A)
        tn, tf = np.minimum(t1, t2), np.maximum(t1, t2)

        def hit(tt):
            X = ox + tt * dxl
            Y = oy + tt * dyl
            Z = oz + tt * dzl
            thv = np.arctan2(Z, X) % (2 * np.pi)
            valid = ok & (tt > 0) & (Y <= HGT / 2) & (Y >= rim_y(thv))
            return X, Y, Z, thv, valid

        Xn, Yn, Zn, thn, vn = hit(tn)
        if not inner:
            X, Y, Z, thv, valid = Xn, Yn, Zn, thn, vn
            sign = 1.0
        else:
            Xf, Yf, Zf, thf, vf = hit(tf)
            valid = vf & ~vn
            X, Y, Z, thv = Xf, Yf, Zf, thf
            sign = -1.0
        if not valid.any():
            return None
        # texture lookup
        u = (thv / (2 * np.pi) * self.TW).astype(np.float32)
        v = ((Y + HGT / 2) / HGT * (self.TH - 1)).astype(np.float32)
        tex = cv2.remap(self.tex_in if inner else self.tex, u, v, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP)
        # normals (outward), with the rolled lip bending them upward
        r = r_of(Y)
        n = np.stack([X, -r * b, Z], -1)
        n /= np.linalg.norm(n, axis=-1, keepdims=True) + 1e-6
        lipt = np.clip(1 - (Y - rim_y(thv)) / LIP, 0, 1)
        n = n * (1 - lipt[..., None] * 0.65) + np.stack([0 * X, -np.ones_like(X), 0 * X], -1) * lipt[..., None] * 0.65
        n /= np.linalg.norm(n, axis=-1, keepdims=True) + 1e-6
        n = n * sign
        nw = n @ R.T
        V = -dw / np.linalg.norm(dw, axis=-1, keepdims=True)
        L = -self.L
        ndl = np.clip(nw @ L, 0, 1)
        Hh = (L + V)
        Hh /= np.linalg.norm(Hh, axis=-1, keepdims=True)
        ndh = np.clip(np.sum(nw * Hh, -1), 0, 1)
        ndv = np.clip(np.sum(nw * V, -1), 0, 1)
        lipc = lipt[..., None]
        base = tex * (1 - lipc) + WHITE * lipc
        if inner:
            ao = 0.45 + 0.55 * np.clip(1 - (Y + HGT / 2) / (HGT * 0.6), 0, 1)
            colr = base * (0.55 + 0.45 * ndl)[..., None] * ao[..., None]
            colr += (ndh ** 40 * 0.25)[..., None]
        else:
            amb = np.float32([0.80, 0.72, 0.95])
            colr = base * (amb * 0.72 + (0.50 * ndl)[..., None])
            colr += (ndh ** 70 * 0.85 + ndh ** 10 * 0.07)[..., None]
            rim = (1 - ndv) ** 3
            colr += rim[..., None] * np.float32([0.85, 0.30, 1.0]) * 0.55
            # warm bounce from the glow above, on the upper wall
            colr += (np.clip(1 - (Y + HGT / 2) / 90, 0, 1) * 0.10)[..., None] * np.float32([1.0, 0.8, 0.4])
        a = cv2.GaussianBlur(valid.astype(np.float32), (0, 0), 0.65)
        colr = np.clip(colr, 0, 1.4)
        out = np.dstack([colr * a[..., None], a]).astype(np.float32)
        return x0, y0, out

    # ------------------------------------------------------------ draw
    def kernel(self, layer, cam, p, k, s, rz, op=1.0):
        rel = p[2] + cam.D
        op *= smooth((rel - 180) / 260)      # don't let kernels become giant blobs on the lens
        if op <= 0.01:
            return
        card = Card(self.kern[k % 12], p[0], p[1], p[2], s * 0.62, s * 0.62,
                    20 * math.sin(math.radians(rz) * 0.7 + k), 26 * math.sin(math.radians(rz) * 0.9 + 2 * k), rz)
        layer.card(cam, card, opacity=op, blur=cam.coc(p[2]) * 0.55)

    def ring(self, layer, cam, t, P):
        u = t - T_ERUPT
        if u < -0.05:
            return
        c = np.array([P[0], P[1] - 60, P[2] + 40])
        sx, sy, _ = cam.project(*c)
        ppu = cam.ppu(c[2])
        grow = out_expo((u + 0.05) / 0.35)
        rad = (60 + 330 * grow) * ppu
        fade = 1 - smooth((t - (T_EXIT + 0.1)) / 0.5)
        inten = (0.9 + 1.4 * math.exp(-max(u, 0) * 6)) * fade
        if inten <= 0.01:
            return
        W2, H2 = self.W // 2, self.H // 2
        buf = np.zeros((H2, W2, 3), np.float32)
        cv2.circle(buf, (int(sx * 8), int(sy * 8)), int(rad * 8), (1.0, 0.85, 1.0), max(1, int(ppu * 2.2)), cv2.LINE_AA, 4)
        core = cv2.GaussianBlur(buf, (0, 0), 1.0)
        glow = cv2.GaussianBlur(buf, (0, 0), 9) * np.float32([1.0, 0.25, 1.0]) * 3.0
        glow2 = cv2.GaussianBlur(buf, (0, 0), 28) * np.float32([0.8, 0.2, 1.0]) * 5.0
        tot = cv2.resize((core + glow + glow2) * inten, (self.W, self.H), interpolation=cv2.INTER_LINEAR)
        layer.add(0, 0, tot)

    def blaze(self, layer, cam, t, R, S, P, front=False):
        c = smooth((t - 0.72) / (T_ERUPT - 0.72))
        u = t - T_ERUPT
        burst = math.exp(-max(u, 0) * 4.5) * (u >= 0)
        lvl = c * 0.35 + burst * 1.4
        lvl *= 1 - smooth((t - T_EXIT) / 0.3)
        if lvl <= 0.01:
            return
        gp = np.array([0.0, -HGT / 2 - 40, 0.0]) @ (R @ S).T + P
        if front:
            layer.card(cam, Card(self.glint, gp[0], gp[1] - 40, gp[2], 3.6 * (0.6 + burst), 3.6 * (0.6 + burst), 0, 0, 8),
                       opacity=lvl * 0.4, tint=(1.0, 0.92, 0.75), additive=True)
            return
        for sc, op, col in ((9.0, 0.45, (1.0, 0.45, 0.9)), (6.0, 0.55, (1.0, 0.75, 0.35)), (3.0, 0.9, (1.0, 0.96, 0.85))):
            k = sc * (0.7 + 0.6 * burst)
            layer.card(cam, Card(self.dot, gp[0], gp[1], gp[2] + 30, k, k * 0.8), opacity=op * lvl, tint=col,
                       additive=True)

    def embers_draw(self, layer, cam, t, P):
        u = t - T_ERUPT
        if u < 0 or u > 1.1:
            return
        W2, H2 = self.W // 2, self.H // 2
        buf = np.zeros((H2, W2, 3), np.float32)
        top = np.array([P[0], P[1] - HGT / 2 - 20, P[2]])
        ppu = cam.ppu(top[2])
        sx0, sy0, _ = cam.project(*top)
        for ex, sp, dl, ez in self.embers:
            uu = u - dl * 0.5
            if uu < 0:
                continue
            x = sx0 + ex * 900 * sp * uu * ppu * self.spread[0]
            y = sy0 + (-1600 * sp * uu + 900 * uu * uu) * ppu * self.spread[1]
            life = 1 - smooth(uu / 0.9)
            if life <= 0:
                continue
            col = (1.0 * life * 2, 0.6 * life * 2, 0.2 * life * 2)
            # streak along velocity for speed
            vx = ex * 900 * sp * ppu * self.spread[0]
            vy = (-1600 * sp + 1800 * uu) * ppu * self.spread[1]
            l = 0.012
            cv2.line(buf, (int(x * 4), int(y * 4)), (int((x - vx * l) * 4), int((y - vy * l) * 4)), col,
                     max(1, int(ppu * 1.2)), cv2.LINE_AA, 3)
        buf = cv2.GaussianBlur(buf, (0, 0), 0.8) + cv2.GaussianBlur(buf, (0, 0), 5) * 0.8
        layer.add(0, 0, cv2.resize(buf, (self.W, self.H), interpolation=cv2.INTER_LINEAR))

    def fx(self, t):
        """Smooth light effects, rendered once per output frame.
        Returns (behind, front) additive RGB buffers."""
        back, front = Layer(self.W, self.H), Layer(self.W, self.H)
        cam = self.camera(t)
        R, S, P = self.pose(min(t, T_EXIT))
        self.ring(back, cam, t, P)
        self.blaze(back, cam, t, R, S, P)
        self.blaze(front, cam, t, R, S, P, front=True)
        self.embers_draw(front, cam, t, P)
        return back.c[..., :3], front.c[..., :3]

    def sub(self, t):
        layer = Layer(self.W, self.H)
        cam = self.camera(t)
        R, S, P = self.pose(t)
        M = R @ S
        g = np.array([0.0, 1500.0 * self.spread[1], 0.0])
        kernels = []
        intact = True
        if intact:
            r = self.trace_tub(cam, R, S, P, inner=True)
            if r:
                layer.over(*r[:2], r[2])
        # mound (until it erupts) + geyser kernels
        c = smooth((t - 0.70) / (T_ERUPT - 0.70))
        for m in self.mound:
            if t < m["ts"]:
                p = m["p"].copy()
                p[1] -= c * 10 * abs(math.sin(t * 40 + m["ph"]))
                kernels.append((p @ M.T + P, m["k"], m["s"], m["rz"], 1.0, True))
            else:
                u = t - m["ts"]
                R0, S0, P0 = self.pose(m["ts"])
                p0 = m["p"] @ (R0 @ S0).T + P0
                dist = (1 - math.exp(-1.0 * u)) / 1.0
                p = p0 + m["v"] * dist + 0.5 * g * u * u
                kernels.append((p, m["k"], m["s"], m["rz"] + m["vr"] * u, 1.0, False))
        for gk in self.geyser:
            if t < gk["ts"]:
                continue
            u = t - gk["ts"]
            R0, S0, P0 = self.pose(gk["ts"])
            p0 = gk["p"] @ (R0 @ S0).T + P0
            v = (R0 @ np.array([gk["v"][0], gk["v"][1], 0.0])) + np.array([0, 0, gk["v"][2]])
            dist = (1 - math.exp(-1.6 * u)) / 1.6
            p = p0 + v * dist + 0.5 * g * u * u
            grow = 0.55 + 0.45 * out_quart(u / 0.12)
            kernels.append((p, gk["k"], gk["s"] * grow, gk["rz"] + gk["vr"] * u, smooth(u / 0.03), False))
        # paper chips
        chips = []
        for ch in self.chip_list:
            if t < ch["ts"]:
                continue
            u = t - ch["ts"]
            R0, S0, P0 = self.pose(ch["ts"])
            p0 = ch["p"] @ (R0 @ S0).T + P0
            p = p0 + ch["v"] * (1 - math.exp(-1.4 * u)) / 1.4 + 0.5 * g * 0.6 * u * u
            chips.append((p, ch, u))
        # draw: kernels inside the tub that sit behind the front wall are covered by it,
        # so draw mound kernels first, then the outer wall, then the airborne stuff
        in_tub = [k for k in kernels if k[5]]
        flying = [k for k in kernels if not k[5]]
        for p, k, s, rz, op, _ in sorted(in_tub, key=lambda q: -q[0][2]):
            self.kernel(layer, cam, p, k, s, rz, op)
        if intact:
            r = self.trace_tub(cam, R, S, P, inner=False)
            if r:
                layer.over(*r[:2], r[2])
        else:
            self.draw_shards(layer, cam, t, R, S, P)
        items = [(p[2], "k", (p, k, s, rz, op)) for p, k, s, rz, op, _ in flying]
        items += [(p[2], "c", (p, ch, u)) for p, ch, u in chips]
        for z, kind, d in sorted(items, key=lambda q: -q[0]):
            if z + cam.D < 70:
                continue
            if kind == "k":
                self.kernel(layer, cam, *d)
            else:
                p, ch, u = d
                rz = ch["rz"] + ch["vr"] * u
                layer.card(cam, Card(self.chips[ch["k"]], p[0], p[1], p[2], ch["s"], ch["s"],
                                     60 * math.sin(u * 9 + ch["k"]), 70 * math.cos(u * 7 + ch["k"]), rz),
                           blur=cam.coc(p[2]) * 0.55)
        return layer.c

    def draw_shards(self, layer, cam, t, R, S, P):
        u = t - T_SHATTER
        M = R @ S
        g = np.array([0.0, 1500.0 * self.spread[1], 0.0])
        cam_pos = np.array([cam.cx, cam.cy, -cam.D])
        items = []
        for s, spr in zip(self.shards, self.shard_sprites):
            am = (s["a0"] + s["a1"]) / 2
            ym = (s["y0"] + s["y1"]) / 2
            # flat patch through the four corners of the curved tile
            corners = []
            for a, y in ((s["a0"], s["y0"]), (s["a1"], s["y0"]), (s["a1"], s["y1"]), (s["a0"], s["y1"])):
                r = r_of(y)
                corners.append([math.cos(a) * r, y, math.sin(a) * r])
            q = np.array(corners) @ M.T + P
            c0 = q.mean(0)
            outward = (np.array([math.cos(am), 0, math.sin(am)]) @ R.T)
            vel = outward * s["out"] * np.array([self.spread[0], 1, 1]) + np.array([0, -s["up"], -s["toward"]])
            dist = (1 - math.exp(-0.9 * u)) / 0.9
            cn = c0 + vel * dist + 0.5 * g * u * u
            ax = s["axis"] / np.linalg.norm(s["axis"])
            Rs = cv2.Rodrigues(ax * math.radians(s["spin"]) * u)[0]
            qn = (q - c0) @ Rs.T + cn
            items.append((cn[2], qn, spr))
        for z, q, spr in sorted(items, key=lambda i: -i[0]):
            cpos = q.mean(0)
            n = np.cross(q[1] - q[0], q[3] - q[0])
            n /= np.linalg.norm(n) + 1e-6
            facing = np.dot(n, cam_pos - cpos)
            d = abs(float(np.dot(n, -self.L)))
            sh = 0.55 + 0.6 * d
            tint = (sh, sh, sh) if facing < 0 else (sh * 0.75, sh * 0.62, sh * 0.68)
            layer.quad(cam, spr, q, tint=tint, blur=cam.coc(z) * 0.55)

    def samples(self, t):
        if t < 0.42:
            return 16
        if t < T_ERUPT - 0.02:
            return 6
        if t < T_EXIT + 0.5:
            return 14
        return 8

    def render(self, i):
        t = i / FPS
        n = self.samples(t)
        acc = None
        for j in range(n):
            tt = t - SHUTTER * (j / max(1, n - 1))
            c = self.sub(max(0.0, tt))
            acc = c if acc is None else acc + c
        acc /= n
        back, front = self.fx(t)
        a = acc[..., 3:4]
        acc[..., :3] += back * (1 - a)
        acc[..., 3:4] = a + (1 - a) * np.clip(back.max(axis=2, keepdims=True), 0, 1)
        acc[..., :3] += front
        acc[..., 3] = np.maximum(acc[..., 3], np.clip(front.max(axis=2), 0, 1))
        rgb = acc[..., :3]
        lum = rgb.max(axis=2, keepdims=True)
        br = rgb * np.clip((lum - 0.95) / 0.3, 0, 1)
        h, w = rgb.shape[:2]
        b = cv2.resize(cv2.GaussianBlur(cv2.resize(br, (w // 4, h // 4), interpolation=cv2.INTER_AREA), (0, 0), 6),
                       (w, h), interpolation=cv2.INTER_LINEAR) * 0.35
        acc[..., :3] += b
        acc[..., 3] = np.maximum(acc[..., 3], np.clip(b.max(axis=2), 0, 1))
        return np.clip(acc, 0, 1)


# ------------------------------------------------------------------ background (full version)
class Hyperspace:
    """Purple light-speed tunnel like the client references."""

    def __init__(self, W, H, seed=4):
        self.W, self.H = W, H
        rng = np.random.default_rng(seed)
        self.streaks = [(rng.uniform(0, 2 * math.pi), rng.uniform(0, 1), rng.uniform(0.5, 1.6),
                         rng.uniform(0.3, 1.0), rng.integers(0, 3)) for _ in range(260)]
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        m = max(W, H)
        r = np.hypot((xx - W / 2) / m, (yy - H * 0.45) / m) * 2
        a = np.arctan2(yy - H * 0.45, xx - W / 2)
        rays = (0.5 + 0.5 * np.cos(a * 22)) ** 8 * 0.5 + (0.5 + 0.5 * np.cos(a * 9 + 1)) ** 4 * 0.5
        base = np.float32([0.05, 0.0, 0.13]) + np.float32([0.42, 0.06, 0.75]) * np.exp(-r * 1.7)[..., None]
        base += np.float32([0.8, 0.35, 1.0]) * (np.exp(-r * 5) * 0.45)[..., None]
        base += np.float32([0.6, 0.2, 0.9]) * (rays * np.exp(-r * 0.9) * 0.35)[..., None]
        self.base = base.astype(np.float32)

    def frame(self, t):
        W, H = self.W, self.H
        buf = np.zeros((H // 2, W // 2, 3), np.float32)
        cx, cy = W / 4, H * 0.45 / 2
        m = max(W, H) / 2
        cols = [(1.0, 0.45, 1.0), (0.75, 0.55, 1.0), (1.0, 0.8, 1.0)]
        for a, ph, sp, it, ci in self.streaks:
            d = ((ph + t * sp * 0.9) % 1.0)
            r0 = (0.05 + d ** 2 * 1.4) * m
            ln = (0.03 + d ** 2 * 0.35) * m
            i = it * smooth(d / 0.2) * 0.9
            c = tuple(v * i for v in cols[ci])
            p0 = (cx + math.cos(a) * r0, cy + math.sin(a) * r0)
            p1 = (cx + math.cos(a) * (r0 + ln), cy + math.sin(a) * (r0 + ln))
            cv2.line(buf, (int(p0[0] * 8), int(p0[1] * 8)), (int(p1[0] * 8), int(p1[1] * 8)), c, 1, cv2.LINE_AA, 3)
        buf = cv2.GaussianBlur(buf, (0, 0), 0.8) + cv2.GaussianBlur(buf, (0, 0), 4) * 0.7
        return self.base + cv2.resize(buf, (W, H), interpolation=cv2.INTER_LINEAR)


# ------------------------------------------------------------------ output
_scene = None


def _init(fmt):
    global _scene
    _scene = Tub(fmt)


def _frame(i):
    return i, _scene.render(i)


def main():
    import argparse
    import subprocess
    from multiprocessing import Pool
    ap = argparse.ArgumentParser()
    ap.add_argument("--format", default="16x9", choices=list(FORMATS))
    ap.add_argument("--stills", nargs="*", type=float)
    a = ap.parse_args()
    out = os.path.join(os.path.dirname(__file__), "..", "out", "popbox_v2")
    os.makedirs(out, exist_ok=True)
    W, H = FORMATS[a.format]["W"], FORMATS[a.format]["H"]
    hs = Hyperspace(W, H)

    def comp(c, i):
        bg = hs.frame(i / FPS)
        o = c[..., :3] + bg * (1 - c[..., 3:4])
        yy = np.linspace(-1, 1, H)[:, None]
        xx = np.linspace(-1, 1, W)[None, :]
        vig = 1 - 0.35 * np.clip(xx ** 2 + yy ** 2, 0, 1.6)
        o = o * vig[..., None]
        o = np.where(o > 0.85, 0.85 + (1 - np.exp(-(o - 0.85) * 4)) * 0.15, o)
        return (np.clip(o, 0, 1) * 255 + 0.5).astype(np.uint8)

    if a.stills is not None:
        frames = [min(NFRAMES - 1, int(round(s * FPS))) for s in a.stills]
        with Pool(os.cpu_count(), initializer=_init, initargs=(a.format,)) as pool:
            for i, c in pool.map(_frame, frames):
                Image.fromarray(comp(c, i)).save(os.path.join(out, f"still_{a.format}_{i / FPS:05.2f}.png"))
        return

    seq = os.path.join(out, f"png_{a.format}")
    os.makedirs(seq, exist_ok=True)
    full = os.path.join(out, f"popcorn_tub_{a.format}_60fps_full.mp4")
    enc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                            "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow",
                            "-crf", "18", "-profile:v", "high", "-level", "4.2", "-maxrate", "10M",
                            "-bufsize", "20M", "-pix_fmt", "yuv420p", "-movflags", "+faststart", full],
                           stdin=subprocess.PIPE)
    with Pool(os.cpu_count(), initializer=_init, initargs=(a.format,)) as pool:
        for i, c in pool.imap(_frame, range(NFRAMES), chunksize=1):
            al = c[..., 3:4]
            straight = np.where(al > 1e-4, c[..., :3] / np.maximum(al, 1e-4), 0)
            rgba = np.concatenate([np.clip(straight, 0, 1), al], 2)
            Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), "RGBA").save(
                os.path.join(seq, f"popcorn_tub_{a.format}_{i:04d}.png"), compress_level=3)
            enc.stdin.write(comp(c, i).tobytes())
            if i % 30 == 0:
                print(f"[{a.format}] {i}/{NFRAMES}", flush=True)
    enc.stdin.close()
    enc.wait()
    mov = os.path.join(out, f"popcorn_tub_{a.format}_alpha_prores4444.mov")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i",
                    os.path.join(seq, f"popcorn_tub_{a.format}_%04d.png"), "-c:v", "prores_ks", "-profile:v", "4444",
                    "-pix_fmt", "yuva444p10le", "-alpha_bits", "16", "-vendor", "apl0", mov], check=True)
    print("wrote", full, mov)


if __name__ == "__main__":
    main()
