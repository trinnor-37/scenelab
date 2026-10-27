"""'One red line, many jobs.' A Netflix spec ad, 19 s + 2 s end card.

One continuous shot. Every scene lives at its own anchor in a single 3D world; the camera
flies between anchors while the light strands morph from one job to the next, and focus
racks from the old plane to the new one. Scenes return geometry in anchor-local space.

Timeline (s)
  0.0  Ignite     a spark draws the line                       "One red line."
  2.4  Player     the line becomes the progress bar            JOB 01 Keeps your place.
  5.6  Rows       it wraps into the focus ring and hops tiles  JOB 02 Finds what's next.
  9.0  Download   it closes into a download ring, then a check JOB 03 Goes where you go.
 12.2  Beat       it splits into heartbeat waveforms           JOB 04 Feels every beat.
 15.2  Screens    the strands trace TV, laptop, tablet, phone  JOB 05 Fits every screen.
 17.6  Mark       they braid into the N                         end card from 19.0
"""
from __future__ import annotations

import math

import cv2
import numpy as np

from assets import (DIM, GREY, INK, Canvas, glass, icon_cc, icon_check, icon_download, icon_pause,
                    icon_play, icon_skip, icon_speaker, pill, poster, poster_tile, still)
from engine import (RED, Cam, Layer, Plane, Post, bump, composite, draw_strands, ease_out, gauss, lerp, overlay,
                    ramp, rot, sat, smooth, smoother, text_mask, text_sprite)

FPS = 60
DURATION = 21.0
M, N = 6, 420                      # strands, points per strand
S = np.linspace(0.0, 1.0, N)
HALF = 0.55                        # half-length of every handover
SHUTTER = 0.9                      # fraction of a frame the shutter is open (heavy blur)

# emissive colour response (screen-blended): hot pink-white core, Netflix-red bloom
C_CORE = np.array([3.0, 0.42, 0.48], np.float32)
C_GLOW = np.array([1.25, 0.032, 0.06], np.float32)


# --------------------------------------------------------------------------- helpers

def measure(s, weight, size, tracking=0.0):
    return text_mask(s, weight, size, tracking, 1.0)[3]


def resample(path, n=N):
    p = np.asarray(path, float)
    if p.shape[1] == 2:
        p = np.concatenate([p, np.zeros((len(p), 1))], 1)
    seg = np.linalg.norm(np.diff(p, axis=0), axis=1)
    cum = np.concatenate([[0.0], np.cumsum(seg)])
    u = np.linspace(0.0, cum[-1], n)
    return np.stack([np.interp(u, cum, p[:, i]) for i in range(3)], 1)


def rrect_path(cx, cy, w, h, r, k=20):
    """Closed rounded rectangle, clockwise on screen, starting at the top-left of the top edge."""
    x0, y0, x1, y1 = cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2
    r = min(r, w / 2, h / 2)
    pts = []
    for (ax, ay, a0) in [(x1 - r, y0 + r, -math.pi / 2), (x1 - r, y1 - r, 0.0),
                         (x0 + r, y1 - r, math.pi / 2), (x0 + r, y0 + r, math.pi)]:
        for i in range(k + 1):
            a = a0 + math.pi / 2 * i / k
            pts.append((ax + r * math.cos(a), ay + r * math.sin(a)))
    pts.append((x1 - r, y0))
    pts = [(x0 + r, y0)] + pts
    return resample(pts)


def circle_path(cx, cy, r, a0=-math.pi / 2):
    a = a0 + 2 * math.pi * S
    return np.stack([cx + r * np.cos(a), cy + r * np.sin(a), np.zeros(N)], 1)


def reveal(s0, s1, soft=0.01):
    return smooth((S - s0) / soft) * smooth((s1 - S) / soft)


def pulses(t, speed=0.16, count=3, width=0.045, seed=0.0, base=0.82, gain=0.55):
    out = np.full(N, base)
    for j in range(count):
        c = (seed + speed * t + j / count) % 1.0
        d = (S - c + 0.5) % 1.0 - 0.5
        out += gain * np.exp(-(d / width) ** 2)
    return out


def knots(t, ks):
    """Piecewise smootherstep through (time, value) knots."""
    if t <= ks[0][0]:
        return ks[0][1]
    for (t0, v0), (t1, v1) in zip(ks, ks[1:]):
        if t <= t1:
            return v0 + (v1 - v0) * float(smoother((t - t0) / (t1 - t0)))
    return ks[-1][1]


def text_canvas(s, weight, size, color=INK, tracking=0.0, ss=2.0):
    """Sprite holding one line of text; returns (sprite, width, height, baseline) in world units."""
    w = measure(s, weight, size, tracking) + 8
    h = size * 1.4
    c = Canvas(w, h, ss)
    c.text(4, size * 1.05, s, weight, size, color, tracking=tracking)
    return c.sprite(), w, h, size * 1.05


class Lay:
    def __init__(self, W, H):
        self.W, self.H = W, H
        self.P = H > W
        self.F = 1700.0

    def pick(self, land, port):
        return port if self.P else land


# --------------------------------------------------------------------------- scenes

class Scene:
    stagger = 0.045   # per-strand delay of the incoming morph
    bulge = 260.0     # how far the strands lift toward camera mid-morph
    swirl = 40.0
    swoop = -120.0    # camera arc during the incoming handover
    first = last = False

    def __init__(self, lay, t0, t1, anchor):
        self.l = lay
        self.t0, self.t1 = t0, t1
        self.A = np.asarray(anchor, float)

    @property
    def dur(self):
        return self.t1 - self.t0

    def pick(self, a, b):
        return self.l.pick(a, b)

    def vis(self, tl):
        a = 1.0 if self.first else float(smooth(ramp(tl, -HALF * 0.8, HALF * 0.6)))
        b = 1.0 if self.last else 1.0 - float(smooth(ramp(tl, self.dur - HALF * 0.6, self.dur + HALF * 0.8)))
        return a * b

    def cam(self, tl):
        return 0.0, 0.0, 1.0

    def layers(self, tl):
        return []

    def energy(self, tl):
        return 0.0

    @staticmethod
    def same(pts, a):
        return np.repeat(pts[None], M, 0), np.repeat(np.asarray(a, float)[None], M, 0)


class Ignite(Scene):
    first = True

    def cam(self, tl):
        return 0.0, 0.0, 1.12 - 0.12 * float(smoother(tl / self.dur))

    def strands(self, tl):
        L = self.pick(1400, 900)
        y0 = self.pick(-40, -80)
        g = float(ease_out(ramp(tl, 0.3, 1.55), 3))
        settle = 1.0 - g
        x = (S - 0.5) * L
        y = y0 + settle * 36 * np.sin(2 * np.pi * (2.2 * S - 1.2 * tl)) * np.sin(np.pi * S)
        z = -90 * settle * np.sin(np.pi * S)
        half = 0.5 * g + 0.004
        on = float(smooth(ramp(tl, 0.06, 0.3)))
        a = reveal(0.5 - half, 0.5 + half, 0.012) * on
        heads = gauss(S - (0.5 - half), 0.012) + gauss(S - (0.5 + half), 0.012)
        a = 1.25 * a * lerp(1.0, pulses(tl, seed=0.1), g) + 0.9 * settle * heads * on
        pts, a = self.same(np.stack([x, y, z], 1), a)
        dots = [((0.0, y0, 0.0), 2.5 + 9 * float(bump(ramp(tl, 0.02, 0.7))), 1.7 * float(bump(ramp(tl, 0.02, 0.8))))]
        return pts, a, dots

    def energy(self, tl):
        return 0.15 + 0.35 * float(smooth(ramp(tl, 0.3, 1.6)))


class Player(Scene):
    def __init__(self, *a):
        super().__init__(*a)
        pw = self.pw = self.pick(1180.0, 960.0)
        ph = self.ph = pw * 9 / 16
        self.cy = self.pick(-150.0, -300.0)
        self.cx = self.pick(30.0, 0.0)
        c = Canvas(pw, ph, 2.0, pad=80)
        glass(c, -12, -12, pw + 24, ph + 24, 30, tint=0.09, alpha=0.9, shadow=0.7)
        c.image(0, 0, pw, ph, poster("city", int(pw * 2), int(ph * 2), seed=11), 20)
        c.vgrad(0, 0, pw, ph * 0.32, 20, (0, 0, 0), 0.65, 0.0)
        c.vgrad(0, ph * 0.45, pw, ph * 0.55, 20, (0, 0, 0), 0.0, 0.85)
        s = pw / 1180
        c.text(pw * 0.045, ph * 0.105, "NIGHTFALL", "heavy", 34 * s, INK, tracking=0.16)
        c.text(pw * 0.045, ph * 0.105 + 40 * s, "S1:E4  “Signal”", "regular", 24 * s, GREY)
        self.tr = (pw * 0.045, pw * 0.875, ph * 0.84)
        x0, x1, ty = self.tr
        c.capsule(x0, ty, x1, ty, 5 * s, (1, 1, 1), 0.2)
        c.text(pw * 0.955, ty + 8 * s, "-21:32", "medium", 22 * s, GREY, anchor="r")
        cyc = ph * 0.935
        ic = 30 * s
        icon_pause(c, x0 + 14 * s, cyc, ic * 0.95)
        icon_skip(c, x0 + 78 * s, cyc, ic, fwd=False)
        icon_skip(c, x0 + 140 * s, cyc, ic, fwd=True)
        icon_speaker(c, x0 + 205 * s, cyc, ic)
        c.text(pw / 2, cyc + 9 * s, "Nightfall  ·  E4  Signal", "medium", 24 * s, INK, anchor="c")
        icon_cc(c, pw * 0.955 - 18 * s, cyc, ic * 0.95)
        c.stroke_rrect(0, 0, pw, ph, 20, 1.0, (1, 1, 1), 0.12)
        self.sprite = c.sprite()

        # floating chip
        txt, sub = "Continue watching", "21 min left"
        cw = measure(txt, "semibold", 26) + measure(sub, "medium", 24) + 110
        c = Canvas(cw, 64, 2.0, pad=50)
        pill(c, 0, 0, cw, 64, seed=3)
        c.disc(34, 32, 7, RED)
        end = c.text(56, 41, txt, "semibold", 26, INK)
        c.text(56 + end + 18, 41, sub, "medium", 24, GREY)
        self.chip = c.sprite()
        self.chip_w = cw

        if self.l.P:
            cw, ch = 960.0, 440.0
            c = Canvas(cw, ch, 2.0, pad=70)
            glass(c, 0, 0, cw, ch, 30, seed=5)
            c.text(44, 96, "NIGHTFALL", "heavy", 62, INK, tracking=0.1)
            c.text(44, 146, "2026  ·  Thriller  ·  Limited Series", "medium", 26, GREY)
            c.text(44, 214, "A signal from a drowned city pulls a", "regular", 30, INK, 0.85)
            c.text(44, 256, "night-shift engineer into the dark.", "regular", 30, INK, 0.85)
            c.rrect(44, 308, 420, 92, 14, RED)
            icon_play(c, 96, 354, 28)
            c.text(132, 365, "Resume  S1:E4", "bold", 32, INK)
            glass(c, 488, 308, 92, 92, 46, tint=0.16, shadow=0)
            c.capsule(534, 334, 534, 374, 5, INK)
            c.capsule(514, 354, 554, 354, 5, INK)
            self.card = c.sprite()

    def plane(self, tl):
        k = float(smoother(tl / self.dur))
        yaw = self.pick(0.17 - 0.11 * k, 0.0)
        pitch = self.pick(0.035, 0.12 - 0.08 * k)
        bob = 5 * math.sin(1.3 * tl)
        return Plane((self.cx, self.cy + bob, 0.0), rot(yaw, pitch), self.pw, self.ph)

    def progress(self, tl):
        return 0.28 + 0.36 * float(smoother(ramp(tl, 0.35, 2.9)))

    def cam(self, tl):
        k = float(smoother(tl / self.dur))
        return self.pick(30 * k, 0.0), self.pick(0.0, -40 * k), 1.04 - 0.07 * k

    def strands(self, tl):
        pl = self.plane(tl)
        x0, x1, ty = self.tr
        P = pl.pts(lerp(x0, x1, S), np.full(N, ty), -2.0)
        p = self.progress(tl)
        lit = smooth((p - S) / 0.01 + 0.5)
        a = 0.13 * (1 - lit) + lit * pulses(tl, speed=0.12, seed=0.4) + 0.7 * gauss(S - p, 0.012)
        pts, a = self.same(P, a)
        head = pl.pt(lerp(x0, x1, p), ty, -3.0)
        return pts, a, [(head, 8.5, 1.35)]

    def layers(self, tl):
        v = self.vis(tl)
        pl = self.plane(tl)
        out = [Layer(self.sprite, pl.pos, pl.R, opacity=v)]
        ci = float(ease_out(ramp(tl, 0.5, 1.3)))
        if self.l.P:
            k = float(smoother(tl / self.dur))
            out.append(Layer(self.card, (0.0, 260 + 30 * (1 - ci) - 20 * k, -40.0), rot(0, 0.06), opacity=v * ci))
            out.append(Layer(self.chip, (0.0, 640 + 40 * (1 - ci), -120.0), opacity=v * ci))
        else:
            out.append(Layer(self.chip, (self.cx + self.pw / 2 - self.chip_w / 2 + 70, self.cy + self.ph / 2 + 4 + 30 * (1 - ci), -190.0),
                             rot(0.1, 0), opacity=v * ci))
        return out

    def energy(self, tl):
        return 0.45


class Rows(Scene):
    def __init__(self, *a):
        super().__init__(*a)
        P = self.l.P
        kinds = [("figure", "THE QUIET HOUR"), ("horizon", "SALT & IRON"), ("corridor", "VANTA"),
                 ("ridge", "HOLLOW CREEK"), ("wave", "LOW TIDE"), ("city", "NIGHTFALL")]
        if P:
            self.tw, self.th, self.gap = 290.0, 435.0, 30.0
            self.pos = [((i % 3 - 1) * (self.tw + self.gap), 150 + (i // 3 - 0.5) * (self.th + self.gap)) for i in range(6)]
            self.seq = [0, 1, 4]
        else:
            self.tw, self.th, self.gap = 250.0, 375.0, 26.0
            self.pos = [((i - 2.5) * (self.tw + self.gap), -100.0) for i in range(6)]
            self.seq = [1, 2, 3]
        self.tiles = [poster_tile(k, t, self.tw, self.th, seed=20 + i) for i, (k, t) in enumerate(kinds)]
        self.back = []
        if not P:
            back = [("wave", "DRIFT"), ("ridge", "NORTHERN"), ("city", "AFTERGLOW"), ("figure", "WITNESS"),
                    ("horizon", "EMBERS"), ("corridor", "PASSAGE")]
            self.back = [poster_tile(k, t, self.tw, self.th, seed=40 + i) for i, (k, t) in enumerate(back)]
        self.label, self.label_w, _, _ = text_canvas("Because you watched Nightfall", "semibold", self.pick(30, 34))
        self.hops = [(1.0, 1.45), (2.0, 2.45)]
        self.pad = 10.0
        self.fs = 0.08

    def group(self, tl):
        k = float(smoother(tl / self.dur))
        R = rot(self.pick(-0.13 + 0.06 * k, 0.0), self.pick(0.02, 0.08 - 0.05 * k))
        return R

    def rect(self, i):
        x, y = self.pos[i]
        hw = self.tw * (1 + self.fs) / 2 + self.pad
        hh = self.th * (1 + self.fs) / 2 + self.pad
        return np.array([x - hw, y - hh, x + hw, y + hh])

    def ring(self, tl):
        r = self.rect(self.seq[0])
        for j, (a, b) in enumerate(self.hops):
            if tl <= a:
                break
            src, dst = self.rect(self.seq[j]), self.rect(self.seq[j + 1])
            lead = float(smoother(ramp(tl, a, b - 0.13)))
            lag = float(smoother(ramp(tl, a + 0.13, b)))
            dx, dy = dst[0] - src[0], dst[1] - src[1]
            wl, wr = (lag, lead) if dx > 0 else (lead, lag)
            wt, wb = (lag, lead) if dy > 0 else (lead, lag)
            if dx == 0:
                wl = wr = lead
            if dy == 0:
                wt = wb = lead
            r = np.array([lerp(src[0], dst[0], wl), lerp(src[1], dst[1], wt),
                          lerp(src[2], dst[2], wr), lerp(src[3], dst[3], wb)])
        return r

    def focus(self, tl):
        r = self.ring(tl)
        cx, cy = (r[0] + r[2]) / 2, (r[1] + r[3]) / 2
        out = []
        for x, y in self.pos:
            d = math.hypot(x - cx, y - cy) / (self.tw + self.gap)
            out.append(float(smooth(1.0 - d)))
        return out

    def cam(self, tl):
        k = float(smoother(tl / self.dur))
        r = self.ring(tl)
        cx = (r[0] + r[2]) / 2
        cy = (r[1] + r[3]) / 2
        if self.l.P:
            return 0.12 * cx, 0.10 * (cy - 150), 1.03 - 0.06 * k
        return 0.18 * cx, 0.0, 1.03 - 0.05 * k

    def strands(self, tl):
        R = self.group(tl)
        r = self.ring(tl)
        P = rrect_path((r[0] + r[2]) / 2, (r[1] + r[3]) / 2, r[2] - r[0], r[3] - r[1], 14 + self.pad)
        P[:, 2] = -42.0
        P = P @ R.T
        a = pulses(tl, speed=0.3, count=2, seed=0.2)
        return (*self.same(P, a), [])

    def layers(self, tl):
        v = self.vis(tl)
        R = self.group(tl)
        fw = self.focus(tl)
        out = []
        for i, (x, y) in enumerate(self.pos):
            stag = float(ease_out(ramp(tl, -0.3 + 0.06 * i, 0.5 + 0.06 * i)))
            p = R @ np.array([x, y + 40 * (1 - stag), -40 * fw[i]])
            out.append(Layer(self.tiles[i], p, R, scale=1 + self.fs * fw[i], opacity=v * stag * (0.72 + 0.28 * fw[i])))
        for i, spr in enumerate(self.back):
            x = (i - 2.5) * (self.tw + self.gap) + 120
            p = R @ np.array([x, -100 - self.th - 110, 260.0])
            out.append(Layer(spr, p, R, opacity=v * 0.5))
        x0 = self.pos[0][0] - self.tw / 2
        y0 = self.pos[0][1] - self.th / 2 - self.pick(34, 64)
        lp = R @ np.array([x0 + self.label_w / 2, y0, 0.0])
        out.append(Layer(self.label, lp, R, opacity=v * float(smooth(ramp(tl, 0.2, 0.7)))))
        return out

    def energy(self, tl):
        return 0.5


class Download(Scene):
    def __init__(self, *a):
        super().__init__(*a)
        P = self.l.P
        pw = self.pw = self.pick(1000.0, 900.0)
        rh = self.rh = self.pick(150.0, 205.0)
        top = self.top = self.pick(118.0, 150.0)
        rows = [("Nightfall", None, "ring"), ("Nightfall", "S1:E4  ·  Signal  ·  52 min", "check"),
                ("Salt & Iron", "S2:E1  ·  Ballast  ·  47 min", "check"),
                ("Low Tide", "Episode 1  ·  58 min", "get")]
        kinds = ["city", "city", "horizon", "wave"]
        nrows = 4 if P else 3
        ph = self.ph = top + nrows * rh + self.pick(10.0, 30.0)
        self.cx, self.cy = self.pick(20.0, 0.0), self.pick(-135.0, 140.0)
        c = Canvas(pw, ph, 2.0, pad=80)
        glass(c, 0, 0, pw, ph, 34, seed=9)
        c.text(44, self.pick(74, 92), "Downloads", "bold", self.pick(42, 52), INK)
        c.text(pw - 44, self.pick(72, 88), "Smart Downloads", "medium", self.pick(22, 26), GREY, anchor="r")
        c.capsule(44, top - 14, pw - 44, top - 14, 1.2, (1, 1, 1), 0.09)
        tw = self.pick(200.0, 250.0)
        th = tw * 9 / 16
        ts, ms = self.pick(30, 36), self.pick(22, 27)
        self.ir = self.pick(34.0, 44.0)
        for i in range(nrows):
            title, meta, st = rows[i]
            y0 = top + i * rh
            c.image(44, y0 + (rh - th) / 2, tw, th, poster(kinds[i], int(tw * 2), int(th * 2), seed=60 + i), 10)
            c.stroke_rrect(44, y0 + (rh - th) / 2, tw, th, 10, 1.0, (1, 1, 1), 0.1)
            tx = 44 + tw + 30
            c.text(tx, y0 + rh / 2 - 6, title, "bold", ts, INK)
            if meta:
                c.text(tx, y0 + rh / 2 + ms + 8, meta, "medium", ms, GREY)
            sx, sy = pw - 44 - self.ir, y0 + rh / 2
            if st == "check":
                c.ring(sx, sy, self.ir, 2.4, GREY, 0.5)
                icon_check(c, sx, sy, self.ir * 0.9, GREY)
            elif st == "get":
                c.ring(sx, sy, self.ir, 2.4, GREY, 0.5)
                icon_download(c, sx, sy, self.ir * 0.85, GREY)
            else:
                self.ring_uv = (sx, sy)
                self.meta_uv = (tx, y0 + rh / 2 + ms + 8)
            if i < nrows - 1:
                c.capsule(tx, y0 + rh, pw - 44, y0 + rh, 1.0, (1, 1, 1), 0.06)
        self.sprite = c.sprite()
        a = Canvas(self.ir * 2, self.ir * 2, 2.0)
        icon_download(a, self.ir, self.ir, self.ir * 0.85, INK)
        self.arrow = a.sprite()
        self.ms = ms
        self.meta_cache = {}

    def plane(self, tl):
        k = float(smoother(tl / self.dur))
        R = rot(self.pick(0.11 - 0.06 * k, 0.0), self.pick(0.03, 0.10 - 0.06 * k))
        return Plane((self.cx, self.cy + 4 * math.sin(1.1 * tl), 0.0), R, self.pw, self.ph)

    def prog(self, tl):
        return knots(tl, [(0.3, 0.0), (0.85, 0.38), (1.15, 0.47), (1.6, 0.84), (1.95, 1.0)])

    def morph(self, tl):
        return float(smoother(ramp(tl, 2.0, 2.45)))

    def push(self, tl):
        return float(smoother(ramp(tl, 0.0, 3.0)))

    def cam(self, tl):
        w = self.push(tl)
        ring = self.plane(tl).pt(*self.ring_uv)
        return self.pick(0.5, 0.0) * w * ring[0], self.pick(0.45, 0.2) * w * (ring[1] - self.pick(-130, 130)), 1.0 - self.pick(0.2, 0.07) * w

    def strands(self, tl):
        pl = self.plane(tl)
        cx, cy = self.ring_uv
        r = self.ir
        circ = circle_path(cx, cy, r)
        chk = resample([(cx - 0.44 * r, cy + 0.02 * r), (cx - 0.12 * r, cy + 0.36 * r), (cx + 0.5 * r, cy - 0.34 * r)])
        m = self.morph(tl)
        uv = lerp(circ, chk, m)
        P = pl.pts(uv[:, 0], uv[:, 1], -3.0 - 40 * float(bump(m)))
        p = self.prog(tl)
        lit = smooth((p - S) / 0.008 + 0.5)
        a = 0.16 + lit * (pulses(tl, speed=0.4, count=2, seed=0.7) - 0.16) + 0.75 * gauss(S - p, 0.015) * (p < 0.999)
        a = lerp(a, pulses(tl, speed=0.25, count=2, base=1.0, gain=0.4), m)
        flash = float(bump(ramp(tl, 1.92, 2.35)))
        dots = [(pl.pt(cx, cy, -6.0), r * 0.5, 0.55 * flash)] if flash > 0.01 else []
        return (*self.same(P, a), dots)

    def meta(self, s):
        if s not in self.meta_cache:
            self.meta_cache[s] = text_canvas(s, "medium", self.ms, GREY)
        return self.meta_cache[s]

    def layers(self, tl):
        v = self.vis(tl)
        pl = self.plane(tl)
        out = [Layer(self.sprite, pl.pos, pl.R, opacity=v)]
        cx, cy = self.ring_uv
        ao = 1.0 - float(smooth(ramp(tl, 1.9, 2.15)))
        out.append(Layer(self.arrow, pl.pt(cx, cy, -1.0), pl.R, opacity=v * ao, bias=-400))
        p = self.prog(tl)
        if self.morph(tl) > 0.5:
            s = "S1:E5  ·  Undertow  ·  Downloaded"
        else:
            s = f"S1:E5  ·  Undertow  ·  {int(round(p * 100))}%"
        spr, w, h, base = self.meta(s)
        mx, my = self.meta_uv
        out.append(Layer(spr, pl.pt(mx - 4 + w / 2, my - base + h / 2, -1.0), pl.R, opacity=v, bias=-400))
        return out

    def energy(self, tl):
        return 0.45 + 0.5 * float(bump(ramp(tl, 1.9, 2.5)))


class Beat(Scene):
    stagger = 0.03
    BEATS = [0.3, 1.0, 1.6, 2.1, 2.5]

    def __init__(self, *a):
        super().__init__(*a)
        cap = "[ heartbeat quickens ]"
        size = self.pick(34, 40)
        w = measure(cap, "regular", size) + 90
        h = size * 2.1
        c = Canvas(w, h, 2.0, pad=50)
        pill(c, 0, 0, w, h, seed=13)
        c.text(w / 2, h / 2 + size * 0.36, cap, "regular", size, INK, anchor="c")
        self.cap = c.sprite()
        txt = "Spatial Audio"
        size = self.pick(24, 28)
        w = measure(txt, "semibold", size) + 100
        h = size * 2.4
        c = Canvas(w, h, 2.0, pad=50)
        pill(c, 0, 0, w, h, seed=14)
        icon_speaker(c, 38, h / 2, size * 0.95, INK, waves=2)
        c.text(68, h / 2 + size * 0.36, txt, "semibold", size, INK)
        self.chip = c.sprite()
        self.chip_w = w

    def amps(self, tl):
        return [math.exp(-(tl - b) * 3.2) if tl >= b else 0.0 for b in self.BEATS]

    def cam(self, tl):
        amps = self.amps(tl)
        hit = sum(amps)
        shake = sum(a * math.sin(70 * (tl - b)) for a, b in zip(amps, self.BEATS))
        k = float(smoother(tl / self.dur))
        return 4.0 * shake, 2.5 * shake, 1.02 - 0.05 * k - 0.025 * hit

    def strands(self, tl):
        Lw = self.pick(1500.0, 960.0)
        yc = self.pick(-170.0, 10.0)
        A = self.pick(210.0, 260.0)
        env = np.sin(np.pi * S) ** 0.8
        amps = self.amps(tl)
        pts = np.zeros((M, N, 3))
        al = np.zeros((M, N))
        hit = sum(amps)
        for k in range(M):
            ph = k * 1.7
            sc = 1.0 - 0.11 * k
            sc0 = 0.5 + 0.004 * (k - 2.5)
            y = 11 * np.sin(2 * np.pi * (7 * S) + ph - 1.4 * tl) + 6 * np.sin(2 * np.pi * 19 * S + 2.3 * tl + ph)
            for amp, b in zip(amps, self.BEATS):
                if amp <= 0.002:
                    continue
                tau = tl - b
                q = (-0.3 * gauss(S - sc0 + 0.016, 0.011) + gauss(S - sc0, 0.008) - 0.5 * gauss(S - sc0 - 0.016, 0.011))
                dist = np.abs(S - sc0)
                rip = np.sin(2 * np.pi * (dist * 24 - tau * 7)) * gauss(dist - 0.55 * tau, 0.08) * 0.32 * math.exp(-tau * 2.0)
                y = y - A * sc * (q * amp + rip)
            pts[k, :, 0] = (S - 0.5) * Lw
            pts[k, :, 1] = yc + env * y + (k - 2.5) * 3.0
            pts[k, :, 2] = (k - 2.5) * -16.0
            al[k] = pulses(tl, speed=0.2, count=3, seed=0.13 * k) * (1.0 - 0.07 * k) * (1.0 + 0.45 * hit)
        return pts, al, []

    def layers(self, tl):
        v = self.vis(tl)
        ci = float(ease_out(ramp(tl, 0.55, 1.2)))
        out = [Layer(self.cap, (0.0, self.pick(140.0, 560.0) + 24 * (1 - ci), -60.0), opacity=v * ci)]
        cj = float(ease_out(ramp(tl, 0.2, 0.9)))
        pos = self.pick((960 - 120 - self.chip_w / 2, -440.0, -150.0), (540 - 70 - self.chip_w / 2, -500.0, -150.0))
        out.append(Layer(self.chip, (pos[0], pos[1] - 20 * (1 - cj), pos[2]), rot(-0.08, 0), opacity=v * cj))
        return out

    def energy(self, tl):
        return 0.4 + 0.9 * sum(self.amps(tl))


class Screens(Scene):
    stagger = 0.07
    bulge = 340.0

    def __init__(self, *a):
        super().__init__(*a)
        P = self.l.P
        # name, body w, h, radius, inset, inner radius, centre (x, y, z), poster kind
        if P:
            self.dev = [("tv", 900.0, 520.0, 16.0, 16.0, 6.0, (0.0, -330.0, 140.0), "ridge"),
                        ("laptop", 620.0, 400.0, 18.0, 14.0, 6.0, (0.0, 175.0, 0.0), "horizon"),
                        ("tablet", 280.0, 380.0, 26.0, 14.0, 12.0, (250.0, 610.0, -110.0), "wave"),
                        ("phone", 170.0, 340.0, 30.0, 8.0, 24.0, (-250.0, 640.0, -200.0), "figure")]
        else:
            self.dev = [("tv", 700.0, 404.0, 14.0, 14.0, 5.0, (-520.0, -200.0, 140.0), "ridge"),
                        ("laptop", 480.0, 312.0, 16.0, 12.0, 6.0, (300.0, -190.0, 0.0), "horizon"),
                        ("tablet", 240.0, 330.0, 24.0, 13.0, 11.0, (770.0, -120.0, -60.0), "wave"),
                        ("phone", 150.0, 304.0, 28.0, 8.0, 22.0, (-50.0, -70.0, -230.0), "figure")]
        self.sprites = []
        for i, (name, w, h, r, ins, ri, ctr, kind) in enumerate(self.dev):
            base = 30.0 if name == "laptop" else 0.0
            ext = 60.0 if name == "laptop" else 0.0
            c = Canvas(w + 2 * ext, h + base, 1.6, pad=60)
            glass(c, ext, 0, w, h, r, tint=0.07, alpha=0.95, shadow=0.6, seed=30 + i)
            sw, sh = w - 2 * ins, h - 2 * ins
            c.image(ext + ins, ins, sw, sh, poster(kind, int(sw * 1.6), int(sh * 1.6), seed=70 + i), ri, 0.9)
            c.vgrad(ext + ins, ins, sw, sh * 0.5, ri, (1, 1, 1), 0.05, 0.0)
            if name == "laptop":
                c.poly([(ext - 2, h), (ext + w + 2, h), (w + 2 * ext, h + base), (0, h + base)], (0.11, 0.11, 0.115), 0.95)
                c.capsule(ext + w * 0.42, h + 4, ext + w * 0.58, h + 4, 3, (0.2, 0.2, 0.2), 0.9)
            self.sprites.append(c.sprite())

    def paths(self):
        out = []
        for name, w, h, r, ins, ri, ctr, kind in self.dev:
            cx, cy, cz = ctr
            outer = rrect_path(cx, cy, w, h, r)
            if name == "laptop":
                x0, x1, y1 = cx - w / 2, cx + w / 2, cy + h / 2
                outer = resample([(x0 + r, cy - h / 2), (x1 - r, cy - h / 2), (x1, cy - h / 2 + r), (x1, y1),
                                  (x1 + 60, y1 + 30), (x0 - 60, y1 + 30), (x0, y1), (x0, cy - h / 2 + r), (x0 + r, cy - h / 2)])
            inner = rrect_path(cx, cy, w - 2 * ins, h - 2 * ins, ri)
            outer[:, 2] = cz - 2
            inner[:, 2] = cz - 2
            out.append((outer, inner))
        return out

    def R(self, tl):
        k = float(smoother(tl / self.dur))
        return rot(self.pick(0.05 - 0.07 * k, 0.0), self.pick(0.0, 0.05 - 0.05 * k))

    def cam(self, tl):
        k = float(smoother(tl / self.dur))
        return self.pick(-50 + 100 * k, 0.0), self.pick(0.0, -60 + 120 * k), 1.1 - 0.06 * k

    def strands(self, tl):
        p = self.paths()
        R = self.R(tl)
        order = [p[0][0], p[0][1], p[1][0], p[1][1], p[2][0], p[3][0]]
        pts = np.stack(order) @ R.T
        al = np.stack([pulses(tl, speed=0.35, count=2, seed=0.17 * k) for k in range(M)])
        al[[1, 3]] *= 0.75
        return pts, al, []

    def layers(self, tl):
        v = self.vis(tl)
        R = self.R(tl)
        out = []
        for i, (name, w, h, r, ins, ri, ctr, kind) in enumerate(self.dev):
            o = float(smooth(ramp(tl, 0.05 + 0.08 * i, 0.7 + 0.08 * i)))
            cx, cy, cz = ctr
            if name == "laptop":
                cy += 15
            out.append(Layer(self.sprites[i], R @ np.array([cx, cy, cz]), R, opacity=v * o))
        return out

    def energy(self, tl):
        return 0.5


class Mark(Scene):
    last = True
    stagger = 0.06
    bulge = 380.0
    swoop = -160.0

    def __init__(self, *a):
        super().__init__(*a)
        self.hn = self.pick(400.0, 540.0)
        self.wn = self.hn * 0.56
        self.sw = self.wn * 0.3
        self.cy = self.pick(-150.0, -170.0)
        hn, wn, sw = self.hn, self.wn, self.sw
        c = Canvas(wn, hn, 2.0, pad=60)
        stem = (RED * 0.74).tolist()
        c.poly([(0, 0), (sw, 0), (sw, hn), (0, hn)], stem)
        c.poly([(wn - sw, 0), (wn, 0), (wn, hn), (wn - sw, hn)], stem)
        stems = c.img[..., 3].copy()
        k = np.clip((c.Y) / hn, 0, 1)
        left = (c.X < wn / 2)
        shade = np.where(left, smooth((k - 0.45) / 0.55), smooth((0.55 - k) / 0.55)) * 0.55
        c.over((0, 0, 0), stems * shade)
        diag = Canvas(wn, hn, 2.0, pad=60)
        diag.poly([(0, 0), (sw, 0), (wn, hn), (wn - sw, hn)], (0, 0, 0))
        sh = cv2.GaussianBlur(diag.img[..., 3], (0, 0), 10.0)
        c.over((0, 0, 0), sh * stems * 0.55)
        c.poly([(0, 0), (sw, 0), (wn, hn), (wn - sw, hn)], RED.tolist())
        g = np.clip(1.0 - c.Y / hn, 0, 1)
        c.over((1, 1, 1), diag.img[..., 3] * g * 0.06)
        self.n = c.sprite()

    def fill(self, tl):
        return float(smooth(ramp(tl, 0.85, 1.6)))

    def cam(self, tl):
        k = float(smoother(ramp(tl, 0.0, self.dur)))
        return 0.0, 0.0, 1.07 - 0.08 * k

    def strands(self, tl):
        hn, wn, sw = self.hn, self.wn, self.sw
        pts = np.zeros((M, N, 3))
        x0, y0 = -wn / 2, self.cy - hn / 2
        for k in range(M):
            off = (0.06 + 0.88 * (k + 0.5) / M) * sw
            path = [(x0 + off, y0 + hn), (x0 + off, y0), (x0 + wn - sw + off, y0 + hn), (x0 + wn - sw + off, y0)]
            pts[k] = resample(path)
            pts[k, :, 2] = -4.0
        dim = lerp(1.0, 0.1, float(smooth(ramp(tl, 1.3, 2.3))))
        al = np.stack([pulses(tl, speed=0.3, count=2, seed=0.11 * k, base=0.9) for k in range(M)]) * dim
        return pts, al, []

    def layers(self, tl):
        f = self.fill(tl)
        return [Layer(self.n, (0.0, self.cy, 0.0), scale=1.0 + 0.04 * (1 - f), opacity=f)]

    def energy(self, tl):
        return 0.5 + 0.9 * float(bump(ramp(tl, 0.7, 1.8))) + 0.2 * float(smooth(ramp(tl, 1.4, 2.4)))


# --------------------------------------------------------------------------- captions

class Caption:
    """Screen-space type with a per-word rise / unblur reveal and a lift-and-blur exit."""

    def __init__(self, text, weight, size, x, y, tin, tout=None, align="l", color=INK, tracking=0.0, maxw=None, per_word=True):
        if maxw:
            wfull = measure(text, weight, size, tracking)
            if wfull > maxw:
                size *= maxw / wfull
        self.words = []
        parts = text.split(" ") if per_word else [text]
        space = measure(" ", weight, size) if per_word else 0
        xs, cur = [], 0.0
        for p in parts:
            spr, ox, by, adv = text_sprite(p, weight, size, color, tracking)
            self.words.append((spr, ox, by))
            xs.append(cur)
            cur += adv + space
        total = cur - space
        x0 = x - total / 2 if align == "c" else x
        self.xs = [x0 + v for v in xs]
        self.y, self.tin, self.tout, self.size = y, tin, tout, size

    def draw(self, frame, t):
        for i, ((spr, ox, by), x) in enumerate(zip(self.words, self.xs)):
            p = float(ease_out(ramp(t, self.tin + 0.06 * i, self.tin + 0.06 * i + 0.65), 3))
            if p <= 0:
                continue
            dy = (1 - p) * self.size * 0.42
            sig = (1 - p) * 9.0
            op = p
            if self.tout is not None:
                q = float(smooth(ramp(t, self.tout - 0.42 + 0.03 * i, self.tout + 0.03 * i)))
                dy -= q * self.size * 0.3
                sig += q * 8.0
                op *= 1 - q
            overlay(frame, spr, x - ox, self.y - by + dy, op, sig)


# --------------------------------------------------------------------------- film

class Film:
    def __init__(self, W, H):
        self.W, self.H = W, H
        lay = self.l = Lay(W, H)
        F = lay.F
        P = lay.P
        T = [0.0, 2.4, 5.6, 9.0, 12.2, 15.2, 17.6, DURATION]
        if P:
            anchors = [(0, 0, 0), (0, 0, 1500), (-150, 1500, 3000), (150, 3000, 4500),
                       (0, 4500, 6000), (-200, 6000, 7500), (0, 7300, 9000)]
        else:
            anchors = [(0, 0, 0), (0, 0, 1500), (1500, -250, 3000), (2900, 250, 4500),
                       (4300, -50, 6000), (5900, 150, 7500), (7300, 0, 9000)]
        kinds = [Ignite, Player, Rows, Download, Beat, Screens, Mark]
        self.scenes = [k(lay, T[i], T[i + 1], anchors[i]) for i, k in enumerate(kinds)]
        self.post = Post(W, H)
        self.F = F
        rng = np.random.default_rng(3)
        dust = []
        for s in self.scenes:
            n = 70
            d = np.stack([rng.uniform(-1.1, 1.1, n) * W, rng.uniform(-1.1, 1.1, n) * H, rng.uniform(-500, 1800, n)], 1)
            dust.append(d + s.A)
        self.dust = np.concatenate(dust)
        self.dust_b = rng.uniform(0.25, 1.0, len(self.dust))
        self.dust_ph = rng.uniform(0, 2 * np.pi, len(self.dust))
        self.captions = self._captions()

    def _captions(self):
        l = self.l
        W, H = self.W, self.H
        red = tuple(float(v) for v in RED)
        caps = []
        if l.P:
            caps.append(Caption("One red line.", "bold", 104, W / 2, 1060, 1.0, 2.35, align="c", maxw=W - 160))
            lx, ly, hy, ls, hs = 90, 214, 318, 30, 92
        else:
            caps.append(Caption("One red line.", "bold", 96, W / 2, 660, 1.0, 2.35, align="c"))
            lx, ly, hy, ls, hs = 150, 808, 900, 26, 84
        jobs = [("JOB 01", "Keeps your place.", 2.75, 5.35), ("JOB 02", "Finds what’s next.", 5.95, 8.75),
                ("JOB 03", "Goes where you go.", 9.35, 11.95), ("JOB 04", "Feels every beat.", 12.55, 14.95),
                ("JOB 05", "Fits every screen.", 15.5, 17.4)]
        for lab, head, tin, tout in jobs:
            caps.append(Caption(lab, "semibold", ls, lx, ly, tin - 0.08, tout - 0.05, color=red, tracking=0.24, per_word=False))
            caps.append(Caption(head, "bold", hs, lx, hy, tin, tout, maxw=W - 2 * lx))
        if l.P:
            caps.append(Caption("Many jobs. One Netflix.", "bold", 76, W / 2, 1250, 19.05, align="c", maxw=W - 160))
            caps.append(Caption("Spec ad  ·  not affiliated with or endorsed by Netflix", "regular", 24, W / 2, 1840, 19.45,
                                align="c", color=DIM, per_word=False))
        else:
            caps.append(Caption("Many jobs. One Netflix.", "bold", 64, W / 2, 750, 19.05, align="c"))
            caps.append(Caption("Spec ad  ·  not affiliated with or endorsed by Netflix", "regular", 19, W / 2, 1030, 19.45,
                                align="c", color=DIM, per_word=False))
        return caps

    # -- timeline -----------------------------------------------------------
    def seg(self, t):
        if t < self.scenes[0].t1 - HALF:
            return self.scenes[0], None, 0.0
        for j in range(1, len(self.scenes)):
            tb = self.scenes[j].t0
            if tb - HALF <= t < tb + HALF:
                return self.scenes[j - 1], self.scenes[j], (t - (tb - HALF)) / (2 * HALF)
        for s in self.scenes:
            if s.t0 <= t < s.t1:
                return s, None, 0.0
        return self.scenes[-1], None, 0.0

    def _cam_of(self, s, t):
        dx, dy, k = s.cam(t - s.t0)
        return s.A + np.array([dx, dy, -self.F * k])

    def camera(self, t):
        A, B, u = self.seg(t)
        if B is None:
            pos = self._cam_of(A, t)
            focus = A.A[2] - pos[2]
        else:
            wc = float(smoother(u))
            pos = lerp(self._cam_of(A, t), self._cam_of(B, t), wc)
            pos[1] += B.swoop * float(bump(u))
            pos[2] -= self.F * 0.12 * float(bump(u))
            wf = float(smoother((u * 2 * HALF - 0.14) / (2 * HALF - 0.14)))
            focus = lerp(A.A[2] - pos[2], B.A[2] - pos[2], wf)
        return Cam(pos, self.F, focus, self.W, self.H, aperture=34.0)

    def strands(self, t):
        A, B, u = self.seg(t)
        pa, aa, da = A.strands(t - A.t0)
        pa = pa + A.A
        da = [(np.asarray(p) + A.A, r, I) for p, r, I in da]
        if B is None:
            return pa, aa, da
        pb, ab, db = B.strands(t - B.t0)
        pb = pb + B.A
        db = [(np.asarray(p) + B.A, r, I) for p, r, I in db]
        tt = u * 2 * HALF
        st = B.stagger
        span = 2 * HALF - st * (M - 1)
        wk = smoother((tt - st * np.arange(M)) / span)
        pts = pa + (pb - pa) * wk[:, None, None]
        b = bump(wk)[:, None]
        ks = np.arange(M)[:, None]
        prof = np.sin(2 * np.pi * 1.5 * S[None, :] + 0.9 * ks)
        pts[..., 2] -= B.bulge * b * (0.55 + 0.45 * prof)
        pts[..., 1] += B.swirl * b * np.cos(2 * np.pi * 2 * S[None, :] + 0.7 * ks)
        a = (aa + (ab - aa) * wk[:, None]) * (1 + 0.35 * b)
        wm = float(wk.mean())
        dots = [(p, r, I * (1 - wm)) for p, r, I in da] + [(p, r, I * wm) for p, r, I in db]
        return pts, a, dots

    def layers(self, t):
        out = []
        for s in self.scenes:
            tl = t - s.t0
            if -HALF - 0.05 <= tl <= s.dur + HALF + 0.05:
                for L in s.layers(tl):
                    L.pos = L.pos + s.A
                    out.append(L)
        return out

    def energy(self, t):
        return sum(s.energy(t - s.t0) * s.vis(t - s.t0) for s in self.scenes
                   if -HALF <= t - s.t0 <= s.dur + HALF)

    # -- rendering ------------------------------------------------------------
    def _subtimes(self, t, k):
        dt = SHUTTER / FPS
        return t - dt / 2 + (np.arange(k) + 0.5) / k * dt

    def render(self, t, idx=0):
        W, H = self.W, self.H
        dt = SHUTTER / FPS
        c0, c1 = self.camera(t - dt / 2), self.camera(t + dt / 2)
        cam = self.camera(t)
        f = max(cam.focus, 200.0)
        move = (abs(c1.pos[0] - c0.pos[0]) + abs(c1.pos[1] - c0.pos[1])) * self.F / f + abs(c1.pos[2] - c0.pos[2]) / f * 0.5 * max(W, H)
        k_ui = int(np.clip(math.ceil(move / 3.0), 1, 10))

        energy = self.energy(t)
        drift = (-cam.pos[0] * 0.00003, -cam.pos[1] * 0.00003)
        bg = self.post.background(t, energy, drift)

        stack = np.zeros((H, W, 4), np.float32)
        for ts in self._subtimes(t, k_ui) if k_ui > 1 else [t]:
            cm = self.camera(ts)
            ls = self.layers(ts)
            ls.sort(key=lambda L: -(L.pos[2] - cm.pos[2] + L.bias))
            for L in ls:
                composite(stack, L, cm)
        if k_ui > 1:
            stack /= k_ui
        ui = bg * (1.0 - stack[..., 3:4]) + stack[..., :3]
        self._dust(ui, cam, t)

        # light strands with motion blur sampled across the shutter
        pa, aa, _ = self.strands(t - dt / 2)
        pb, ab, _ = self.strands(t + dt / 2)
        xa, _ = c0.project(pa)
        xb, _ = c1.project(pb)
        live = (np.maximum(aa, ab) > 0.05)
        disp = float(np.max(np.linalg.norm(xb - xa, axis=-1)[live])) if live.any() else 0.0
        k_s = int(np.clip(math.ceil(disp / 2.0), 2, 18))
        core = np.zeros((H, W), np.float32)
        buf = np.zeros((H, W), np.uint8)
        for ts in self._subtimes(t, k_s):
            buf.fill(0)
            pts, a, dots = self.strands(ts)
            draw_strands(buf, self.camera(ts), pts, a, ts, dots)
            core += buf
        core *= 1.7 / (255.0 * k_s)
        core = cv2.GaussianBlur(core, (0, 0), 0.6)
        glow = self.post.glow(core) * (0.9 + 0.25 * energy)
        em = core[..., None] * C_CORE + glow[..., None] * C_GLOW
        out = 1.0 - (1.0 - ui) * np.exp(-em)
        out *= self.post.vignette
        for c in self.captions:
            c.draw(out, t)
        return self.post.finish(out, idx)

    def _dust(self, img, cam, t):
        P = self.dust.copy()
        P[:, 1] -= 9.0 * t
        P[:, 0] += 6.0 * np.sin(0.4 * t + self.dust_ph)
        xy, d = cam.project(P)
        ok = (d > 150) & (xy[:, 0] > -20) & (xy[:, 0] < self.W + 20) & (xy[:, 1] > -20) & (xy[:, 1] < self.H + 20)
        if not ok.any():
            return
        buf = np.zeros(img.shape[:2], np.uint8)
        for (x, y), dd, b in zip(xy[ok], d[ok], self.dust_b[ok]):
            coc = cam.coc(dd)
            r = 0.9 * self.F / dd + 0.45 * coc
            v = b * 200.0 / (1.0 + 0.12 * coc * coc) * float(smooth(ramp(dd, 150, 500)))
            if v < 2:
                continue
            cv2.circle(buf, (int(x * 16), int(y * 16)), int(max(r, 0.7) * 16), int(min(v, 255)), -1, cv2.LINE_AA, 4)
        img += buf[..., None].astype(np.float32) * (np.array([0.22, 0.12, 0.12], np.float32) / 255.0)
