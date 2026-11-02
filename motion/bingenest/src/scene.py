"""BingeNest TV logo reveal: one continuous camera move, 10 s @ 60 fps.

Beats (seconds)
  0.00  popcorn drifts past the lens in focus, rack focus pulls to the logo plane
  0.45  BINGE flies in from deep space, NEST whips in from behind the camera;
        each letter lands with squash, flash, shockwave and a camera kick
  2.55  light sweep across the word
  2.90  a golden comet orbits the word and draws the oval ring (shape morph),
        the purple fills from the centre while the camera pulls back
        (9:16: the stacked two-line word reflows into one line here)
  4.00  camera tilts down, the TV springs up, its screen flickers on and
        T / V fly out of the screen
  5.50  camera pulls back up, the character drops into his seat, popcorn erupts
        toward the lens and the four piles pop in
  6.40  settle, ring glints, final sweep, slow push-in to the end card
"""
import math
import numpy as np
import cv2

from assets import (Sprite, load_sprite, load_rgba, TRIM_OFFSET, bokeh_disc, glint,
                    popcorn_kernel, soft_dot)
from layout import build
from engine import Camera, Card, Frame, bloom, finish

FPS = 60
DURATION = 10.0
NFRAMES = int(FPS * DURATION)
SHUTTER = 0.5 / FPS          # 180-degree shutter
MB_SAMPLES = 6

BLUE = (0.25, 0.80, 1.00)
PINK = (1.00, 0.30, 0.90)
ORANGE = (1.00, 0.62, 0.16)
GOLD = (1.00, 0.82, 0.40)


# ------------------------------------------------------------------ easing

def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def smoother(x):
    x = clamp(x)
    return x * x * x * (x * (x * 6 - 15) + 10)


def out_cubic(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def out_quart(x):
    x = clamp(x)
    return 1 - (1 - x) ** 4


def out_expo(x):
    x = clamp(x)
    return 1.0 if x >= 1 else 1 - 2 ** (-10 * x)


def in_out_sine(x):
    x = clamp(x)
    return 0.5 - 0.5 * math.cos(math.pi * x)


def out_back(x, s=1.70158):
    x = clamp(x) - 1
    return 1 + (s + 1) * x ** 3 + s * x ** 2


def out_elastic(x):
    x = clamp(x)
    if x in (0.0, 1.0):
        return x
    return 2 ** (-10 * x) * math.sin((x * 10 - 0.75) * (2 * math.pi / 3)) + 1


def ring_decay(u, k=10.0, w=18.0):
    """Damped oscillation that starts at 1."""
    if u < 0:
        return 0.0
    return math.exp(-k * u) * math.cos(w * u)


# ------------------------------------------------------------------ spline

def hermite_track(keys):
    """keys: list of (t, value). Returns f(t) – C1 Catmull-Rom style curve with
    zero tangent at both ends so the camera eases in and out."""
    ts = np.array([k[0] for k in keys], float)
    vs = np.array([k[1] for k in keys], float)
    n = len(ts)
    m = np.zeros(n)
    for i in range(1, n - 1):
        m[i] = (vs[i + 1] - vs[i - 1]) / (ts[i + 1] - ts[i - 1])

    def f(t):
        if t <= ts[0]:
            return vs[0]
        if t >= ts[-1]:
            return vs[-1]
        i = int(np.searchsorted(ts, t) - 1)
        h = ts[i + 1] - ts[i]
        u = (t - ts[i]) / h
        h00 = 2 * u ** 3 - 3 * u ** 2 + 1
        h10 = u ** 3 - 2 * u ** 2 + u
        h01 = -2 * u ** 3 + 3 * u ** 2
        h11 = u ** 3 - u ** 2
        return h00 * vs[i] + h10 * h * m[i] + h01 * vs[i + 1] + h11 * h * m[i + 1]
    return f


# ------------------------------------------------------------------ format specific

FORMATS = {
    # W, H, px per logo unit at zoom 1, camera keys (t, cx, cy, zoom, roll)
    "16x9": dict(W=1920, H=1080, base=0.80, keys=[
        (0.0, 652, 760, 1.92, -4.0),
        (1.3, 650, 760, 1.78, -1.6),
        (2.4, 650, 760, 1.68, 0.0),
        (3.0, 646, 770, 1.58, 0.0),
        (3.95, 622, 832, 1.40, 0.6),
        (4.65, 618, 925, 1.42, 0.0),
        (5.45, 620, 905, 1.30, -0.6),
        (6.35, 627, 650, 0.90, 0.0),
        (7.20, 627, 630, 0.905, 0.0),
        (10.0, 627, 628, 0.925, 0.0)],
        fly=(1.0, 1.0)),
    "9x16": dict(W=1080, H=1920, base=0.83, keys=[
        (0.0, 627, 756, 2.05, -3.0),
        (1.3, 627, 756, 1.82, -1.2),
        (2.4, 627, 756, 1.70, 0.0),
        (3.0, 627, 762, 1.58, 0.0),
        (3.95, 618, 840, 0.90, 0.4),
        (4.65, 618, 925, 0.94, 0.0),
        (5.45, 620, 900, 0.90, -0.4),
        (6.35, 627, 690, 0.92, 0.0),
        (7.20, 627, 700, 0.95, 0.0),
        (10.0, 627, 700, 0.985, 0.0)],
        fly=(0.55, 1.45)),
}

WORD_LAND = [1.22 + 0.12 * k for k in range(5)] + [1.98 + 0.12 * k for k in range(4)]
WORD_FLY = 0.82
TV_LAND = [5.12, 5.28]
TV_FLY = 0.62
CHAR_LAND = 6.05
CHAR_FALL = 0.50
TV_RISE = (4.02, 0.46)        # start, duration
TV_ON = 4.50
RING = (2.95, 0.95)           # comet start, duration
IRIS = (3.45, 0.62)
REFLOW = (2.95, 0.70)         # 9:16 only
SWEEP1 = (2.50, 0.60)
SWEEP2 = (7.55, 0.80)
POP_IN = [6.10, 6.18, 6.26, 6.34]


def letter_color(f):
    return BLUE if "blue" in f else PINK if "pink" in f else ORANGE


class Scene:
    def __init__(self, fmt):
        self.fmt = fmt
        F = FORMATS[fmt]
        self.W, self.H, self.base = F["W"], F["H"], F["base"]
        self.fly = F["fly"]
        keys = F["keys"]
        self.cam_cx = hermite_track([(k[0], k[1]) for k in keys])
        self.cam_cy = hermite_track([(k[0], k[2]) for k in keys])
        self.cam_lz = hermite_track([(k[0], math.log(k[3])) for k in keys])
        self.cam_roll = hermite_track([(k[0], k[4]) for k in keys])

        L, word, tv = build()
        self.L, self.word, self.tvword = L, word, tv
        self.spr = {}
        for e in list(L.values()) + word + tv:
            if e["file"] not in self.spr:
                self.spr[e["file"]] = load_sprite(e["file"])

        def anc(e):
            if "anchor" not in e:
                return None
            ox, oy = TRIM_OFFSET[e["file"]]
            return (e["anchor"][0] - ox, e["anchor"][1] - oy)
        self.anchor = {k: anc(e) for k, e in L.items()}
        # character pivots at his seat so the landing squash reads correctly
        ox, oy = TRIM_OFFSET["character"]
        self.char_anchor = (627.0 - ox, 1240.0 - oy)
        self.char_seat_y = L["character"]["y"] + (1240.0 - 627.0) * L["character"]["sy"]

        # stacked two-line stage for the vertical format
        self.stage = None
        if fmt == "9x16":
            def line_center(slots):
                return (min(s["x"] for s in slots) + max(s["x"] for s in slots)) / 2
            cb, cn = line_center(word[:5]), line_center(word[5:])
            self.stage = []
            for k, s in enumerate(word):
                if k < 5:
                    self.stage.append((s["x"] + (627 - cb) - 8, s["y"] - 118))
                else:
                    self.stage.append((s["x"] + (627 - cn) + 8, s["y"] + 118))

        self.disc = bokeh_disc()
        self.dot = soft_dot()
        self.glint = glint()
        self.kernels = [popcorn_kernel(s) for s in range(6)]
        self._prep_oval()
        self._prep_tv_screen()
        self._prep_particles()

    # -------------------------------------------------------------- prep
    def _prep_oval(self):
        spr = self.spr["oval"]
        ox, oy = TRIM_OFFSET["oval"]
        self.oval_maps = []
        for lvl, img in enumerate(spr.levels):
            k = spr.w / img.shape[1]
            yy, xx = np.mgrid[0:img.shape[0], 0:img.shape[1]].astype(np.float32)
            X = (xx + 0.5) * k + ox - 755.0
            Y = (yy + 0.5) * k + oy - 513.0
            rho = np.sqrt((X / 655.0) ** 2 + (Y / 409.0) ** 2)
            # clockwise angle on screen, starting at 9 o'clock
            ang = (np.arctan2(Y / 409.0, X / 655.0) - math.pi) % (2 * math.pi)
            self.oval_maps.append((rho, ang))

    def _prep_tv_screen(self):
        rgba = load_rgba("tv")
        a = rgba[..., 3]
        rgb = rgba[..., :3] / np.maximum(a[..., None], 1e-4)
        dark = (rgb.max(axis=2) < 0.42) & (rgb[..., 2] > rgb[..., 1] + 0.05) & (a > 0.9)
        dark = dark.astype(np.uint8)
        n, lab, stats, _ = cv2.connectedComponentsWithStats(dark, 8)
        big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        m = (lab == big).astype(np.uint8)
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
        m = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 6)
        # brighter towards the centre like a CRT bloom
        yy, xx = np.mgrid[0:m.shape[0], 0:m.shape[1]].astype(np.float32)
        ys, xs = np.where(m > 0.5)
        cy, cx = ys.mean(), xs.mean()
        r = np.hypot((xx - cx) / (np.ptp(xs) / 2 + 1), (yy - cy) / (np.ptp(ys) / 2 + 1))
        v = m * (0.55 + 0.45 * np.clip(1 - r, 0, 1))
        out = np.dstack([v, v, v, v]).astype(np.float32)
        self.tv_screen = Sprite(out, anchor=self.spr["tv"].anchor)
        self.tv_screen_center_px = (cx, cy)

    def _prep_particles(self):
        rng = np.random.default_rng(7)
        pal = [(1.0, 0.35, 0.85), (0.30, 0.75, 1.0), (1.0, 0.78, 0.30), (0.70, 0.40, 1.0)]
        self.bokeh = []
        for _ in range(85):
            self.bokeh.append(dict(
                x=627 + rng.uniform(-2800, 2800), y=760 + rng.uniform(-2200, 2200),
                z=rng.uniform(700, 5200), size=rng.uniform(9, 30),
                col=pal[rng.integers(len(pal))], inten=rng.uniform(0.10, 0.32),
                vy=-rng.uniform(6, 26), vx=rng.uniform(-8, 8), ph=rng.uniform(0, 6.28),
                tw=rng.uniform(0.6, 1.8)))
        # intro floaters: glossy kernels drifting close to the lens. Positions are
        # given in screen space at t=0 (u, v in -1..1) plus distance from camera.
        self.floaters = []
        cam0 = self.camera_base(0.0)
        spots = [(-0.62, -0.45, 0.30), (0.58, 0.38, 0.34), (-0.20, 0.62, 0.45), (0.30, -0.58, 0.52),
                 (-0.80, 0.15, 0.62), (0.82, -0.10, 0.70), (0.08, -0.35, 1.25), (-0.45, 0.40, 1.45),
                 (0.55, 0.20, 1.7), (-0.70, -0.40, 1.9), (0.25, 0.55, 2.2), (-0.05, 0.75, 0.80)]
        for i, (u, v, rel) in enumerate(spots):
            if self.fmt == "9x16":
                u, v = u * 0.9, v * 0.9
            relz = rel * cam0.D
            k = cam0.f / relz
            self.floaters.append(dict(x=cam0.cx + u * self.W / 2 / k, y=cam0.cy + v * self.H / 2 / k,
                                      z=relz - cam0.D, k=i % 6,
                                      s=rng.uniform(0.22, 0.30), rz=rng.uniform(0, 360),
                                      vr=rng.uniform(-40, 40), vx=rng.uniform(-40, 40) * rel,
                                      vy=rng.uniform(-30, 20) * rel, vz=-rng.uniform(140, 260)))
        # popcorn eruption when the character lands
        self.confetti = []
        # bursts out of the bucket and off to the sides, never across his face
        for i in range(30):
            left = i % 2 == 0
            ang = rng.uniform(-math.pi * 0.95, -math.pi * 0.62) if left else rng.uniform(-math.pi * 0.38, -math.pi * 0.05)
            sp = rng.uniform(800, 1650)
            ox = -150 if left else 120
            self.confetti.append(dict(
                x=745 + ox + rng.uniform(-40, 40), y=400 + rng.uniform(-30, 60),
                z=rng.uniform(-40, 40),
                vx=math.cos(ang) * sp * (0.9 if self.fmt == "16x9" else 0.55),
                vy=math.sin(ang) * sp, vz=rng.uniform(-1700, 300),
                k=i % 6, s=rng.uniform(0.12, 0.2), rz=rng.uniform(0, 360),
                vr=rng.uniform(-420, 420), delay=0.06 + rng.uniform(0, 0.14)))
        # impact sparks (direction per spark, per event)
        self.spark_dirs = [(math.cos(a), math.sin(a), rng.uniform(0.6, 1.0))
                           for a in np.linspace(0, 2 * math.pi, 12, endpoint=False) + rng.uniform(0, 0.4, 12)]

    # -------------------------------------------------------------- camera
    def camera_base(self, t):
        return Camera(self.W, self.H, self.base, self.cam_cx(t), self.cam_cy(t),
                      math.exp(self.cam_lz(t)), self.cam_roll(t))

    def camera(self, t):
        cx, cy = self.cam_cx(t), self.cam_cy(t)
        zoom = math.exp(self.cam_lz(t))
        roll = self.cam_roll(t)
        # impact kicks
        sx = sy = sr = 0.0
        for tl, amp in self.impacts():
            u = t - tl
            if 0 <= u < 0.6:
                e = amp * math.exp(-u * 11)
                sx += e * math.sin(u * 61 + tl * 3)
                sy += e * math.sin(u * 47 + tl * 5 + 1.1)
                sr += e * 0.06 * math.sin(u * 39 + tl)
        cam = Camera(self.W, self.H, self.base, cx + sx, cy + sy, zoom, roll + sr)
        # rack focus: foreground kernels -> logo plane
        near = 0.42 * cam.D
        rf = smoother((t - 0.25) / 0.85)
        cam.focus = near + (cam.D - near) * rf
        cam.aperture = 26.0 - 14.0 * smooth((t - 0.6) / 1.5) - 5.0 * smooth((t - 6.0) / 1.2)
        return cam

    def impacts(self):
        ev = [(tl, 3.0) for tl in WORD_LAND] + [(tl, 5.0) for tl in TV_LAND]
        ev += [(TV_RISE[0] + TV_RISE[1], 3.0), (CHAR_LAND, 9.0)]
        return ev

    # -------------------------------------------------------------- letters
    def word_slot(self, k, t):
        s = self.word[k]
        if self.stage is None:
            return s["x"], s["y"], 0.0
        sx, sy = self.stage[k]
        p = smoother((t - (REFLOW[0] + 0.035 * k)) / REFLOW[1])
        x = sx + (s["x"] - sx) * p
        y = sy + (s["y"] - sy) * p
        z = -160.0 * math.sin(math.pi * p)  # letters lift toward camera while reflowing
        return x, y, z

    def word_card(self, k, t):
        s = self.word[k]
        spr = self.spr[s["file"]]
        tl = WORD_LAND[k]
        p = (t - (tl - WORD_FLY)) / WORD_FLY
        x1, y1, z1 = self.word_slot(k, t)
        fx, fy = self.fly
        if k < 5:   # BINGE: from deep space, spiralling in
            side = -1 if k % 2 == 0 else 1
            x0 = x1 + (-760 + 150 * k) * fx
            y0 = y1 + side * 430 * fy
            z0 = 3400.0
            ry0, rz0, rx0 = 150.0 + 20 * k, -38.0 * side, 25.0 * side
            arc = (side * -260 * fx, side * 120 * fy)
        else:       # NEST: whips past the lens from behind the camera
            j = k - 5
            side = 1 if j % 2 == 0 else -1
            x0 = x1 + (560 + 110 * j) * fx
            y0 = y1 + side * 300 * fy
            z0 = -720.0
            ry0, rz0, rx0 = -120.0, 30.0 * side, -18.0 * side
            arc = (180 * fx, -side * 160 * fy)
        if p >= 1:
            u = t - tl
            sq = 0.13 * ring_decay(u, 9, 19)
            return Card(spr, x1, y1, z1, s["sx"] * (1 + sq * 0.5), s["sy"] * (1 - sq),
                        0, 0, s["rot"]), 1.0, math.exp(-u * 14.0)
        e = out_quart(p)
        ez = out_expo(p) * 0.85 + out_quart(p) * 0.15
        a = math.sin(math.pi * e)
        x = x0 + (x1 - x0) * e + arc[0] * a
        y = y0 + (y1 - y0) * e + arc[1] * a
        z = z0 + (z1 - z0) * ez
        r = 1 - out_cubic(p)
        stretch = 1 + 0.10 * math.sin(math.pi * p)
        c = Card(spr, x, y, z, s["sx"] / stretch, s["sy"] * stretch,
                 rx0 * r, ry0 * r, s["rot"] + rz0 * r)
        op = smooth(p / 0.12)
        return c, op, 0.0

    def tv_letter_card(self, k, t):
        s = self.tvword[k]
        spr = self.spr[s["file"]]
        tl = TV_LAND[k]
        p = (t - (tl - TV_FLY)) / TV_FLY
        if p >= 1:
            u = t - tl
            sq = 0.16 * ring_decay(u, 9, 20)
            return Card(spr, s["x"], s["y"], 0, s["sx"] * (1 + sq * 0.5), s["sy"] * (1 - sq), 0, 0, s["rot"]), \
                1.0, math.exp(-u * 14.0)
        # from deep inside the TV screen
        sc = self.L["tv"]
        x0, y0, z0 = sc["x"] + (-40 if k == 0 else 40), sc["y"] - 10, 2600.0
        e = out_quart(p)
        ez = out_expo(p)
        x = x0 + (s["x"] - x0) * e
        y = y0 + (s["y"] - y0) * e - 90 * math.sin(math.pi * e)
        z = z0 * (1 - ez)
        r = 1 - out_cubic(p)
        c = Card(spr, x, y, z, s["sx"], s["sy"], 0, (200 if k == 0 else -200) * r, s["rot"] + (25 if k else -25) * r)
        return c, smooth(p / 0.15), 0.0

    # -------------------------------------------------------------- big pieces
    def oval_card(self, t):
        e = self.L["oval"]
        g = out_cubic((t - RING[0]) / (RING[1] + IRIS[1]))
        sc = 0.93 + 0.07 * g
        return Card(self.spr["oval"], e["x"], e["y"], 0, e["sx"] * sc, e["sy"] * sc, 0, 0, 0,
                    anchor=self.anchor["oval"])

    def oval_mask(self, t):
        th = in_out_sine((t - RING[0]) / RING[1]) * 2 * math.pi
        ir = out_cubic((t - IRIS[0]) / IRIS[1]) * 1.12
        if th >= 2 * math.pi - 1e-4 and ir >= 1.1:
            return None

        def fn(img, lvl):
            rho, ang = self.oval_maps[lvl]
            ring = np.clip((th - ang) / 0.10, 0, 1) * (rho > 0.80)
            fill = np.clip((ir - rho) / 0.09, 0, 1)
            m = np.maximum(ring, fill)
            return img * m[..., None]
        return fn

    def ring_point(self, a):
        """Point on the oval's gold ring, a measured clockwise from 9 o'clock."""
        a = a + math.pi
        return 613.0 + 556.0 * 0.995 * math.cos(a), 812.0 + 322.0 * 0.995 * math.sin(a)

    def tv_card(self, t):
        e = self.L["tv"]
        t0, d = TV_RISE
        p = (t - t0) / d
        if p <= 0:
            return None, 0
        if p < 1:
            yo = 640 * (1 - out_back(p, 1.3))
            st = 1 + 0.16 * math.sin(math.pi * p)
            c = Card(self.spr["tv"], e["x"], e["y"] + yo, 0, e["sx"] / math.sqrt(st), e["sy"] * st,
                     0, 0, 7 * (1 - p) * math.sin(p * 9), anchor=self.anchor["tv"])
            return c, smooth(p / 0.12)
        u = t - (t0 + d)
        sq = 0.10 * ring_decay(u, 8, 21)
        return Card(self.spr["tv"], e["x"], e["y"], 0, e["sx"] * (1 + sq * 0.6), e["sy"] * (1 - sq),
                    0, 0, 0, anchor=self.anchor["tv"]), 1.0

    def char_card(self, t):
        e = self.L["character"]
        p = (t - (CHAR_LAND - CHAR_FALL)) / CHAR_FALL
        if p <= 0:
            return None
        y_land = self.char_seat_y
        if p < 1:
            y = y_land - 1250 * (1 - p * p)
            st = 1 + 0.10 * p
            return Card(self.spr["character"], e["x"], y, 0, e["sx"] / st ** 0.5, e["sy"] * st,
                        0, 0, -4 * (1 - p), anchor=self.char_anchor)
        u = t - CHAR_LAND
        sq = 0.15 * ring_decay(u, 7.5, 16)
        breathe = 0.006 * math.sin((t - CHAR_LAND) * 2.4) * smooth(u / 0.8)
        return Card(self.spr["character"], e["x"], y_land, 0, e["sx"] * (1 + sq * 0.55 + breathe),
                    e["sy"] * (1 - sq + breathe), 0, 0, 0, anchor=self.char_anchor)

    def pop_card(self, key, i, t):
        e = self.L[key]
        p = (t - POP_IN[i]) / 0.55
        if p <= 0:
            return None
        s = out_elastic(p)
        return Card(self.spr["popcorn"], e["x"], e["y"], 0, e["sx"] * s, e["sy"] * s, 0, 0,
                    e["rot"] + 20 * (1 - out_cubic(p)), anchor=self.anchor[key])

    # -------------------------------------------------------------- background
    def background(self, cam, t, fr):
        W, H = self.W, self.H
        w4, h4 = W // 4, H // 4
        lvl = 0.45 + 0.55 * smooth(t / 0.7)
        lvl += 0.35 * math.exp(-max(0.0, t - (RING[0] + RING[1])) * 2.2) * (t > RING[0] + RING[1])
        lvl += 0.12 * smooth((t - RING[0]) / 1.2)
        cx, cy, _ = cam.project(627.0, 780.0, 2600.0)
        R = cam.ppu(2600.0) * 1700
        yy, xx = np.mgrid[0:h4, 0:w4].astype(np.float32)
        dx, dy = xx * 4 - cx, yy * 4 - cy
        r = np.sqrt(dx * dx + dy * dy) / R
        inner = np.float32([0.34, 0.05, 0.60])
        mid = np.float32([0.11, 0.01, 0.24])
        outer = np.float32([0.018, 0.0, 0.045])
        k1 = np.clip(r / 0.55, 0, 1)[..., None]
        k2 = np.clip((r - 0.55) / 0.75, 0, 1)[..., None]
        col = inner + (mid - inner) * k1
        col = col + (outer - col) * k2
        # slow volumetric rays behind the logo
        ang = np.arctan2(dy, dx)
        rays = (0.5 + 0.5 * np.cos(ang * 9 + t * 0.35)) ** 5 * (0.5 + 0.5 * np.cos(ang * 5 - t * 0.22 + 1.0)) ** 2
        rays *= np.exp(-r * 1.6) * (1 - np.exp(-r * 8))
        ray_lvl = 0.10 + 0.45 * smooth((t - RING[0] - 0.4) / 1.4)
        col = col * lvl + rays[..., None] * np.float32([0.55, 0.16, 0.80]) * ray_lvl
        fr.rgb[:] = cv2.resize(col.astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR)

    def draw_bokeh(self, cam, t, fr):
        dw = self.disc.w
        for b in self.bokeh:
            x = b["x"] + b["vx"] * t
            y = b["y"] + b["vy"] * t
            z = b["z"]
            ppu = cam.ppu(z)
            d_px = max(b["size"] * ppu, cam.coc(z) * 1.0 + 4)
            energy = min(1.0, (b["size"] * ppu + 3) / d_px) ** 1.2
            tw = 0.65 + 0.35 * math.sin(t * b["tw"] * 2 + b["ph"])
            inten = b["inten"] * tw * max(0.25, energy) * (0.5 + 0.5 * smooth(t / 0.8))
            sc = d_px / ppu / dw
            fr.draw(cam, Card(self.disc, x, y, z, sc, sc), opacity=inten, additive=True,
                    dof=False, tint=b["col"])

    def kernel_card(self, k, x, y, z, s, rz):
        """Popcorn chunk = the supplied popcorn art, small and spinning."""
        sc = s * 0.30 * (0.85 + 0.06 * k)
        return Card(self.spr["popcorn"], x, y, z, sc, sc, 0, 0, rz)

    def mb(self, fn, t, opacity=1.0, fr=None, cam=None, **kw):
        """Adaptive motion blur: enough sub-frames that ghosts never separate."""
        c0 = fn(t)
        c1 = fn(t - SHUTTER)
        if c0 is None:
            return
        if c1 is None:
            fr.draw(cam, c0, opacity=opacity, **kw)
            return
        a = cam.project(c0.x, c0.y, c0.z)
        b = cam.project(c1.x, c1.y, c1.z)
        disp = math.hypot(a[0] - b[0], a[1] - b[1])
        # rotation / scale changes also smear the edges
        sz = (c0.sprite.w * c0.sx) * cam.ppu(c0.z)
        disp += sz * (abs(c0.ry - c1.ry) + abs(c0.rz - c1.rz) + abs(c0.rx - c1.rx)) / 180.0 * 1.5
        disp += sz * abs(cam.ppu(c0.z) / max(cam.ppu(c1.z), 1e-6) - 1.0)
        n = int(clamp(disp / 2.0, 1, 32))
        if n <= 1:
            fr.draw(cam, c0, opacity=opacity, **kw)
            return
        cards = [fn(t - SHUTTER * j / (n - 1)) for j in range(n)]
        fr.draw(cam, [c for c in cards if c is not None], opacity=opacity, **kw)

    # -------------------------------------------------------------- render
    def render(self, i):
        t = i / FPS
        cam = self.camera(t)
        fr = Frame(self.W, self.H)
        self.background(cam, t, fr)
        self.draw_bokeh(cam, t, fr)

        # intro floaters behind the plane
        floats = []
        fl_op = 1 - smooth((t - 1.6) / 1.0)
        if fl_op > 0:
            for f in self.floaters:
                floats.append((f["z"] + f["vz"] * t, f))
        for z, f in sorted(floats, key=lambda q: -q[0]):
            if z > 0:
                fr.draw(cam, self.kernel_card(f["k"], f["x"] + f["vx"] * t, f["y"] + f["vy"] * t, z,
                                              f["s"], f["rz"] + f["vr"] * t), opacity=fl_op * 0.9)

        # oval + comet
        if t >= RING[0]:
            fr.draw(cam, self.oval_card(t), mask_fn=self.oval_mask(t))
        # top popcorn piles + character
        for key, j in (("pop_tl", 0), ("pop_tr", 1)):
            c = self.pop_card(key, j, t)
            if c:
                fr.draw(cam, c)
        cc = self.char_card(t)
        if cc is not None:
            p = (t - (CHAR_LAND - CHAR_FALL)) / CHAR_FALL
            if p < 1:
                self.mb(self.char_card, t, smooth(p / 0.1), fr, cam)
            else:
                fr.draw(cam, cc)
        # TV body + screen
        tvc, tvo = self.tv_card(t)
        if tvc is not None:
            if t < TV_RISE[0] + TV_RISE[1]:
                self.mb(lambda tt: self.tv_card(tt)[0], t, tvo, fr, cam)
            else:
                fr.draw(cam, tvc, opacity=tvo)
            if t >= TV_ON:
                u = t - TV_ON
                flick = 1.0
                if u < 0.32:
                    rng = np.random.default_rng(i)
                    flick = 0.35 + 0.9 * rng.random()
                glow = (1.25 * math.exp(-u * 7) + 0.20 + 0.04 * math.sin(t * 5.0)) * flick
                sc = Card(self.tv_screen, tvc.x, tvc.y, tvc.z, tvc.sx, tvc.sy, 0, 0, tvc.rz,
                          anchor=self.anchor["tv"])
                fr.draw(cam, sc, opacity=glow * 0.55, additive=True, tint=(0.80, 0.55, 1.0))

        # word letters (far ones first), with motion blur while flying
        sweep1 = self.sweep(cam, t, SWEEP1)
        sweep2 = self.sweep(cam, t, SWEEP2)
        sw = sweep1 or sweep2
        items = []
        for k in range(9):
            if t < WORD_LAND[k] - WORD_FLY:
                continue
            c, op, fl = self.word_card(k, t)
            items.append((c.z, k, c, op, fl))
        items.sort(key=lambda q: (-round(q[0], 1), q[1]))
        for z, k, c, op, fl in items:
            flying = t < WORD_LAND[k]
            if flying:
                self.mb(lambda tt, k=k: self.word_card(k, tt)[0], t, op, fr, cam)
            else:
                fr.draw(cam, c, opacity=op, flash=fl * 0.45, sweep=sw)
        # TV letters
        for k in range(2):
            if t < TV_LAND[k] - TV_FLY:
                continue
            c, op, fl = self.tv_letter_card(k, t)
            if t < TV_LAND[k]:
                self.mb(lambda tt, k=k: self.tv_letter_card(k, tt)[0], t, op, fr, cam)
            else:
                fr.draw(cam, c, opacity=op, flash=fl * 0.45, flash_color=(1.0, 0.95, 0.8), sweep=sweep2)
        # bottom popcorn piles
        for key, j in (("pop_bl", 2), ("pop_br", 3)):
            c = self.pop_card(key, j, t)
            if c:
                fr.draw(cam, c)

        # popcorn eruption
        self.draw_confetti(cam, t, fr)
        # foreground floaters (in front of the plane)
        for z, f in sorted(floats, key=lambda q: -q[0]):
            if z <= 0:
                fr.draw(cam, self.kernel_card(f["k"], f["x"] + f["vx"] * t, f["y"] + f["vy"] * t, z,
                                              f["s"], f["rz"] + f["vr"] * t), opacity=fl_op)

        self.draw_fx(cam, t, fr)
        fr.flush_add()
        out = bloom(fr.rgb)
        return finish(out, i)

    def sweep(self, cam, t, win):
        t0, d = win
        p = (t - t0) / d
        if not 0 < p < 1:
            return None
        ang = math.radians(22)
        # screen-space band travelling across the whole frame
        umin = -0.1 * self.W
        umax = self.W * math.cos(ang) + self.H * math.sin(ang) + 0.1 * self.W
        pos = umin + (umax - umin) * in_out_sine(p)
        return (pos, ang, 0.028 * max(self.W, self.H), 0.55 * math.sin(math.pi * p) ** 0.5, (1.0, 0.97, 0.92))

    def draw_confetti(self, cam, t, fr):
        u0 = t - CHAR_LAND
        if u0 < 0 or u0 > 3.2:
            return
        g = 2600.0
        items = []
        for c in self.confetti:
            u = u0 - c["delay"]
            if u < 0:
                continue
            x = c["x"] + c["vx"] * u
            y = c["y"] + c["vy"] * u + 0.5 * g * u * u
            z = c["z"] + c["vz"] * u
            if z + cam.D < 110:
                continue
            items.append((z, c, x, y, u))
        for z, c, x, y, u in sorted(items, key=lambda q: -q[0]):
            op = smooth(u / 0.05) * (1 - smooth((u - 2.3) / 0.6))
            s = c["s"] * (0.6 + 0.4 * out_back(min(1.0, u / 0.25)))
            def at(tt, c=c, s=s):
                uu = tt - CHAR_LAND - c["delay"]
                return self.kernel_card(c["k"], c["x"] + c["vx"] * uu, c["y"] + c["vy"] * uu + 0.5 * g * uu * uu,
                                        c["z"] + c["vz"] * uu, s, c["rz"] + c["vr"] * uu)
            self.mb(at, t, op, fr, cam)

    def draw_fx(self, cam, t, fr):
        # opening flare – gives frame 1 something to look at
        if t < 0.6:
            x, y, _ = cam.project(650.0, 756.0, 1500.0)
            fr.draw(cam, Card(self.glint, 650.0, 756.0, 1500.0, 9.0, 9.0, 0, 0, t * 40),
                    opacity=(1 - smooth(t / 0.55)) * 0.9, additive=True, dof=False, tint=(1.0, 0.7, 1.0))
        # letter impacts
        lands = [(WORD_LAND[k], self.word_slot(k, WORD_LAND[k]), letter_color(self.word[k]["file"]), 1.0)
                 for k in range(9)]
        lands += [(TV_LAND[k], (self.tvword[k]["x"], self.tvword[k]["y"], 0.0), ORANGE, 1.2) for k in range(2)]
        for tl, (lx, ly, lz), col, big in lands:
            u = t - tl
            if not 0 <= u < 0.7:
                continue
            sx, sy, _ = cam.project(lx, ly, lz)
            ppu = cam.ppu(lz)
            rad = (50 + 150 * out_cubic(u / 0.45)) * ppu * big
            fr.ring(sx, sy, rad, rad * 0.55, 2.5 * ppu + 1, col, 1.1 * (1 - smooth(u / 0.45)))
            for dx, dy, sp in self.spark_dirs:
                d = (40 + 210 * out_cubic(u / 0.6) * sp) * ppu * big
                fr.dot(sx + dx * d, sy + dy * d * 0.7, (3.5 - 3 * u / 0.7) * ppu + 1, (1, 0.95, 0.85),
                       1.5 * (1 - smooth(u / 0.6)))
            if u < 0.25:
                fr.draw(cam, Card(self.glint, lx, ly, lz, 0.9 * big, 0.9 * big, 0, 0, 15),
                        opacity=(1 - u / 0.25) * 0.9, additive=True, dof=False, tint=col)
        # ring comet
        u = (t - RING[0]) / RING[1]
        if 0 <= u <= 1.08:
            th = in_out_sine(u) * 2 * math.pi
            for j in range(14):
                a = th - j * 0.045
                if a < 0:
                    break
                px, py = self.ring_point(a)
                sx, sy, _ = cam.project(px, py, 0.0)
                fr.dot(sx, sy, (11 - 0.6 * j) * cam.ppu(0), GOLD, 2.4 * (1 - j / 14) * (1 - smooth((u - 1) / 0.08)))
            px, py = self.ring_point(th)
            fade = 1 - smooth((u - 0.95) / 0.13)
            fr.draw(cam, Card(self.glint, px, py, 0.0, 1.6, 1.6, 0, 0, th * 60), opacity=fade,
                    additive=True, dof=False, tint=(1.0, 0.9, 0.6))
        # TV land + character land shockwaves
        for tl, (lx, ly), col, size, flat in (
                (TV_RISE[0] + TV_RISE[1], (self.L["tv"]["x"], self.L["tv"]["y"] + 170), GOLD, 1.0, 0.35),
                (CHAR_LAND, (self.L["character"]["x"], self.char_seat_y - 10), (1.0, 0.75, 1.0), 1.8, 0.33)):
            u = t - tl
            if 0 <= u < 0.8:
                sx, sy, _ = cam.project(lx, ly, 0.0)
                ppu = cam.ppu(0)
                rad = (80 + 330 * out_cubic(u / 0.7)) * ppu * size
                fr.ring(sx, sy, rad, rad * flat, 3.5 * ppu + 1, col, 1.2 * (1 - smooth(u / 0.7)))
                fr.ring(sx, sy, rad * 0.72, rad * 0.72 * flat, 2 * ppu + 1, (1, 1, 1), 0.7 * (1 - smooth(u / 0.5)))
        # popcorn pile pops
        for key, j in (("pop_tl", 0), ("pop_tr", 1), ("pop_bl", 2), ("pop_br", 3)):
            u = t - POP_IN[j]
            if 0 <= u < 0.3:
                e = self.L[key]
                fr.draw(cam, Card(self.glint, e["x"], e["y"], 0, 0.7, 0.7, 0, 0, 10),
                        opacity=(1 - u / 0.3) * 0.8, additive=True, dof=False, tint=GOLD)
        # ring glints on the finished logo
        if t > 6.6:
            for j, a in enumerate((0.55, 2.35, 3.55, 5.3)):
                ph = ((t - 6.6) / 1.7 + j * 0.27) % 1.0
                inten = math.sin(math.pi * clamp(ph / 0.35)) ** 2
                if inten > 0.01:
                    px, py = self.ring_point(a)
                    fr.draw(cam, Card(self.glint, px, py, 0, 0.75, 0.75, 0, 0, 0), opacity=inten * 0.85,
                            additive=True, dof=False, tint=(1.0, 0.92, 0.7))
            # TV corner sparkle
            ph = ((t - 6.9) / 2.1) % 1.0
            inten = math.sin(math.pi * clamp(ph / 0.3)) ** 2
            tv = self.L["tv"]
            fr.draw(cam, Card(self.glint, tv["x"] + 212, tv["y"] - 128, 0, 0.55, 0.55, 0, 0, 0),
                    opacity=inten * 0.8, additive=True, dof=False, tint=(1.0, 0.95, 0.8))
