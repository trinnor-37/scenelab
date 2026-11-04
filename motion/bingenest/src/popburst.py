"""BingeNest popcorn burst built from the client's own hero frame.

The hero image (assets/popburst/hero_end.webp) is cut into layers by
src/popburst_layers.py. Here every layer is animated in 2.5D with a moving
camera, parallax, real multi-sample motion blur and additive light. Every
popcorn piece flies out of the tub and lands exactly where it sits in the
reference, so the shot ends on the client's frame.

  0.00  hyperspace: the tub rockets in out of the vanishing point, spinning
  0.50  it lands (squash), the heap jiggles and the mouth glows (charge-up)
  0.95  BURST: white-gold flash, the neon ring blasts open, the plume shoots
        up, ~45 kernels and both paper shards fly to their places, extra
        kernels whip past the lens
  1.70  the camera settles; it lands exactly on the reference by 2.20 s

  python3 src/popburst_layers.py            # once: cut the layers
  python3 src/popburst.py --format 16x9     # or 9x16 (a real vertical re-layout)
  python3 src/popburst.py --format 16x9 --stills 0.3 1.1 2.2
"""
import argparse
import json
import math
import os
import subprocess
import sys
from multiprocessing import Pool

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
LAY = os.path.join(ROOT, "out", "popburst", "layers")
OUT = os.path.join(ROOT, "out", "popburst")
FPS, NF = 60, 132
DUR = NF / FPS
SHUTTER = 0.5 / FPS
T_LAND, T_CHARGE, T_BURST = 0.50, 0.70, 0.95


def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def smoother(x):
    x = clamp(x)
    return x * x * x * (x * (x * 6 - 15) + 10)


def out_quart(x):
    return 1 - (1 - clamp(x)) ** 4


def out_expo(x):
    x = clamp(x)
    return 1.0 if x >= 1 else 1 - 2 ** (-10 * x)


def out_back(x, s=1.4):
    x = clamp(x) - 1
    return 1 + (s + 1) * x ** 3 + s * x ** 2


def decay(u, k=9.0, w=20.0):
    return math.exp(-k * u) * math.cos(w * u) if u >= 0 else 0.0


def T(dx=0.0, dy=0.0):
    return np.array([[1, 0, dx], [0, 1, dy], [0, 0, 1]], np.float64)


def RS(rot=0.0, sx=1.0, sy=1.0):
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]]) @ np.diag([sx, sy, 1.0])


class Sprite:
    def __init__(self, rgba):
        a = rgba[..., 3]
        ys, xs = np.where(a > 0.003)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        self.img = np.ascontiguousarray(rgba[y0:y1, x0:x1])
        self.off = (float(x0), float(y0))
        self.c = ((x0 + x1) / 2.0, (y0 + y1) / 2.0)


class Burst:
    def __init__(self, fmt):
        self.fmt = fmt
        meta = json.load(open(os.path.join(LAY, "meta.json")))
        self.meta = meta
        self.SW, self.SH = meta["W"], meta["H"]
        self.mouth = tuple(meta["mouth"])
        self.W, self.H = (1920, 1080) if fmt == "16x9" else (1080, 1920)
        L = lambda n: np.load(os.path.join(LAY, n + ".npy"))
        self.full = L("full")
        self.tub = Sprite(L("tub"))
        pl = L("plume")
        if fmt == "9x16":
            hh, ww = pl.shape[:2]
            yy_, xx_ = np.mgrid[0:hh, 0:ww].astype(np.float32)
            edge = np.minimum.reduce([xx_, ww - 1 - xx_, yy_, hh - 1 - yy_])
            pl = pl * (np.clip(edge / 60.0, 0, 1) ** 1.5)[..., None]
        self.plume = Sprite(pl)
        self.ring = Sprite(L("ring"))
        self.shards = [Sprite(L("shard_l")), Sprite(L("shard_r"))]
        img = self.full
        lab = L("kernel_labels")
        self.kern = []
        rng = np.random.default_rng(5)
        for kk in meta["kernels"]:
            m = (lab == kk["id"]).astype(np.uint8)
            g, sft = kk.get("grow", 5), kk.get("soft", 1.5)
            m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (g, g)))
            a = cv2.GaussianBlur(m.astype(np.float32), (0, 0), sft)
            if fmt == "9x16":
                # pieces cut off by the frame edge would show a hard line once
                # they sit inside the taller canvas: fade them out at the cut
                hh, ww = a.shape
                yy_, xx_ = np.mgrid[0:hh, 0:ww].astype(np.float32)
                edge = np.minimum.reduce([xx_, ww - 1 - xx_, yy_, hh - 1 - yy_])
                a = a * np.clip(edge / 70.0, 0, 1) ** 1.5
            sp = Sprite(np.dstack([img * a[..., None], a]).astype(np.float32))
            dist = math.hypot(sp.c[0] - self.mouth[0], sp.c[1] - self.mouth[1])
            sp.big = kk["area"] > 4000
            sp.ts = T_BURST + 0.02 + dist / 1900.0 * 0.32 + rng.uniform(0, 0.08)
            sp.dur = 0.42 + dist / 1900.0 * 0.35 + rng.uniform(0, 0.1)
            sp.rot0 = rng.uniform(-220, 220)
            sp.arc = rng.uniform(-0.35, 0.35)
            self.kern.append(sp)
        # templates for the extra fly-past kernels: mid-size crisp pieces
        mids = sorted([k for k in self.kern if not k.big], key=lambda k: -k.img.shape[0] * k.img.shape[1])[:8]
        self.fly = []
        for i in range(34):
            ang = rng.uniform(-math.pi * 0.95, math.pi * 0.95) - math.pi / 2
            self.fly.append(dict(spr=mids[i % len(mids)], ang=ang, ts=T_BURST + rng.uniform(0.0, 0.42),
                                 dur=rng.uniform(0.38, 0.6), spin=rng.uniform(-500, 500),
                                 s1=rng.uniform(1.0, 1.9), reach=rng.uniform(0.85, 1.25)))
        self.sparks = [(rng.uniform(-math.pi, 0.15), rng.uniform(0.5, 1.0), rng.uniform(0, 0.25))
                       for _ in range(90)]
        self.streaks = [(rng.uniform(0, 2 * math.pi), rng.uniform(0, 1), rng.uniform(0.6, 1.5), rng.uniform(0.3, 1.0))
                        for _ in range(220)]
        self._layout()

    # ------------------------------------------------------------ layout
    def _layout(self):
        """Map source (hero image) coordinates to the output canvas."""
        if self.fmt == "16x9":
            self.k_in = self.W / self.SW
            self.Cs = (0.0, 0.0)
            self.Cc = (0.0, 0.0)
            self.bg = cv2.resize(np.load(os.path.join(LAY, "bg.npy")), (self.W, self.H), interpolation=cv2.INTER_CUBIC)
            self.full_c = cv2.resize(self.full, (self.W, self.H), interpolation=cv2.INTER_LANCZOS4)
            return
        # vertical: keep the tub/plume/ring big in the middle, push the outer
        # pieces to the top and bottom, and extend the background radially
        self.k_in = 1.13
        self.Cs = (840.0, 430.0)
        self.Cc = (540.0, 990.0)
        bg = np.load(os.path.join(LAY, "bg.npy"))
        W, H = self.W, self.H
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        Cx, Cy = 540.0, 960.0
        sx, sy = 840.0, 380.0
        dx, dy = xx - Cx, yy - Cy
        phi = np.arctan2(dy, dx)
        rho = np.hypot(dx, dy)
        c, s = np.cos(phi), np.sin(phi)

        def edge(cx, cy, w, h):
            tx = np.where(c > 1e-6, (w - cx) / np.maximum(c, 1e-6), np.where(c < -1e-6, -cx / np.minimum(c, -1e-6), 1e9))
            ty = np.where(s > 1e-6, (h - cy) / np.maximum(s, 1e-6), np.where(s < -1e-6, -cy / np.minimum(s, -1e-6), 1e9))
            return np.minimum(tx, ty)
        rs = edge(sx, sy, self.SW - 1, self.SH - 1)
        rc = edge(Cx, Cy, W - 1, H - 1)
        r_src = rho * rs / np.maximum(rc, 1)
        mx = (sx + c * r_src).astype(np.float32)
        my = (sy + s * r_src).astype(np.float32)
        self.bg = cv2.remap(bg, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        self.full_c = None

    def place(self, c):
        """Rest position (canvas) and scale of a piece whose source centre is c."""
        if self.fmt == "16x9":
            return (c[0] * self.k_in, c[1] * self.k_in), self.k_in
        u = (c[0] - 840.0) / 836.0
        v = (c[1] - 440.0) / 470.0
        inner = (self.Cc[0] + (c[0] - self.Cs[0]) * self.k_in, self.Cc[1] + (c[1] - self.Cs[1]) * self.k_in)
        outer = (540.0 + u * 470.0, 990.0 + v * 900.0)
        w = smooth((math.hypot(u * 1.0, v * 0.8) - 0.55) / 0.35)
        return (inner[0] * (1 - w) + outer[0] * w, inner[1] * (1 - w) + outer[1] * w), self.k_in * (1 - w) + 1.0 * w

    # ------------------------------------------------------------ drawing
    def draw(self, cv, spr, M_src, opacity=1.0, additive=False):
        """M_src maps source-image coords -> canvas coords (3x3)."""
        if opacity <= 0.003:
            return
        A = M_src @ T(*spr.off)
        h, w = spr.img.shape[:2]
        corners = np.array([[0, 0, 1], [w, 0, 1], [w, h, 1], [0, h, 1]], np.float64).T
        p = A @ corners
        x0, y0 = int(math.floor(p[0].min())) - 2, int(math.floor(p[1].min())) - 2
        x1, y1 = int(math.ceil(p[0].max())) + 2, int(math.ceil(p[1].max())) + 2
        X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(self.W, x1), min(self.H, y1)
        if X1 <= X0 or Y1 <= Y0 or (X1 - X0) * (Y1 - Y0) > 9_000_000:
            return
        scale = math.sqrt(abs(np.linalg.det(A[:2, :2])))
        img = spr.img
        Ad = A.copy()
        if scale < 0.6:   # pre-shrink for clean minification
            f = max(scale, 0.05)
            img = cv2.resize(img, (max(1, int(w * f)), max(1, int(h * f))), interpolation=cv2.INTER_AREA)
            Ad = A @ np.diag([w / img.shape[1], h / img.shape[0], 1.0])
        Ad = T(-X0, -Y0) @ Ad
        out = cv2.warpAffine(img, Ad[:2], (X1 - X0, Y1 - Y0), flags=cv2.INTER_LINEAR,
                             borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
        d = cv[Y0:Y1, X0:X1]
        if additive:
            d += out[..., :3] * opacity
        else:
            a = out[..., 3:4] * opacity
            d *= 1 - a
            d += out[..., :3] * opacity

    def to_canvas(self, piece_c, rest_c, k, cam):
        """source -> canvas for a piece (rest placement + camera)."""
        return cam @ T(*rest_c) @ np.diag([k, k, 1.0]) @ T(-piece_c[0], -piece_c[1])

    # ------------------------------------------------------------ camera
    def camera(self, t):
        g = smoother(t / 2.05)
        zoom = 1.0 + 0.07 * (1 - g)
        fx, fy = self.place(self.mouth)[0]
        sx = sy = rot = 0.0
        c = smooth((t - T_CHARGE) / (T_BURST - T_CHARGE)) * (t < T_BURST + 0.05)
        sx += c * 3 * math.sin(t * 150)
        sy += c * 3 * math.sin(t * 131 + 1)
        u = t - T_BURST
        if u >= 0:
            e = math.exp(-u * 7.5)
            sx += 16 * e * math.sin(u * 63)
            sy += 13 * e * math.sin(u * 51 + 1)
            rot += 1.2 * e * math.sin(u * 41)
            zoom += 0.05 * math.exp(-u * 6) * math.sin(u * 14) * (1 - smooth((t - 1.9) / 0.3))
        u = t - T_LAND
        if u >= 0:
            sy += 9 * decay(u, 11, 30)
        M = T(fx + sx, fy + sy) @ RS(rot, zoom, zoom) @ T(-fx, -fy)
        return M, zoom

    # ------------------------------------------------------------ one instant
    def frame_at(self, t):
        W, H = self.W, self.H
        cam, zoom = self.camera(t)
        mouth_c, _ = self.place(self.mouth)
        # background with deeper parallax zoom
        bz = 1.0 + 0.45 * (1 - smoother(t / 2.05))
        fx, fy = mouth_c
        Mb = T(fx, fy) @ np.diag([bz, bz, 1]) @ T(-fx, -fy)
        cv = cv2.warpAffine(self.bg, Mb[:2], (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        cv = cv * (0.62 + 0.38 * smooth((t - 0.3) / 0.9))
        add = np.zeros((H // 2, W // 2, 3), np.float32)

        # hyperspace streaks (fade out as the shot settles)
        si = 1.0 - smooth((t - 1.2) / 0.8)
        if si > 0.01:
            m = max(W, H) * 0.5
            for a, ph, sp, it in self.streaks:
                d = (ph + t * sp * 1.1) % 1.0
                r0 = (0.04 + d * d * 1.5) * m
                ln = (0.02 + d * d * 0.45) * m
                i = it * smooth(d / 0.2) * si * 0.9
                p0 = (fx + math.cos(a) * r0, fy + math.sin(a) * r0)
                p1 = (fx + math.cos(a) * (r0 + ln), fy + math.sin(a) * (r0 + ln))
                cv2.line(add, (int(p0[0] * 8), int(p0[1] * 8)), (int(p1[0] * 8), int(p1[1] * 8)),
                         (0.85 * i, 0.45 * i, 1.0 * i), 1, cv2.LINE_AA, 4)

        # ring: blasts open at the burst
        u = t - T_BURST
        if u > -0.02:
            g = out_expo((u + 0.02) / 0.4)
            rc, k = self.place(self.ring.c)
            M = cam @ T(*rc) @ RS(0, 0.12 + 0.88 * g, 0.12 + 0.88 * g) @ np.diag([k, k, 1]) @ T(-self.ring.c[0], -self.ring.c[1])
            hand = smooth((u - 0.22) / 0.2)
            self.draw(cv, self.ring, M, opacity=hand)
            ctr = M @ np.array([self.meta["ring_c"][0], self.meta["ring_c"][1], 1])
            rx = self.meta["ring_r"][0] * math.sqrt(abs(np.linalg.det(M[:2, :2])))
            ry = self.meta["ring_r"][1] * math.sqrt(abs(np.linalg.det(M[:2, :2])))
            it = (1.0 - 0.75 * hand) * (0.7 + 1.6 * math.exp(-max(u, 0) * 6))
            for th, col in ((6, (1.0, 0.25, 0.95)), (2, (1.0, 0.9, 1.0))):
                cv2.ellipse(add, (int(ctr[0] * 8), int(ctr[1] * 8)), (int(rx * 8), int(ry * 8)), 0, 0, 360,
                            tuple(v * it for v in col), th, cv2.LINE_AA, 4)

        # tub pose (shared by the heap)
        p = clamp(t / T_LAND)
        zdep = 24.0 * (1 - p) ** 2.3
        s_t = 1.0 / (1.0 + zdep)
        rot = -32 * (1 - out_back(p, 1.2))
        off = ((-260 if self.fmt == "16x9" else 0) * (1 - out_quart(p)) + 150 * math.sin(math.pi * out_quart(p)) * (self.fmt == "16x9"),
               -120 * (1 - out_quart(p)) - 60 * math.sin(math.pi * out_quart(p)))
        u = t - T_LAND
        sq = 0.07 * decay(u, 9, 19)
        c = smooth((t - T_CHARGE) / (T_BURST - T_CHARGE)) * (1 - smooth((t - T_BURST) / 0.1))
        rot += c * 1.6 * math.sin(t * 170)
        ub = t - T_BURST
        rec = 22 * decay(ub, 8, 17) if ub >= 0 else 0.0
        anti = 0.06 * smooth((t - (T_BURST - 0.1)) / 0.1) * (1 - smooth(ub / 0.06)) if t > T_BURST - 0.1 else 0.0
        tub_rest, k = self.place(self.tub.c)
        base_y = self.tub.c[1] + (self.tub.img.shape[0] / 2)          # pivot at the base of the tub
        piv = (self.tub.c[0], base_y)
        Ma = T(*piv) @ RS(0, 1 + sq * 0.6 + anti * 0.5, 1 - sq - anti) @ T(-piv[0], -piv[1])
        cpiv = (self.tub.c[0], self.tub.c[1] - 60)
        Ma = T(*cpiv) @ RS(rot, s_t, s_t) @ T(-cpiv[0], -cpiv[1]) @ Ma
        # far away it sits on the vanishing point (the mouth), then flies to its spot
        vp = (self.mouth[0] - cpiv[0], self.mouth[1] - 40 - cpiv[1])
        Ma = T(vp[0] * (1 - s_t), vp[1] * (1 - s_t)) @ Ma
        Mtub = cam @ T(off[0], off[1] + rec) @ T(*tub_rest) @ np.diag([k, k, 1]) @ T(-self.tub.c[0], -self.tub.c[1]) @ Ma
        # charge glow at the mouth (behind the plume)
        glow = c * 0.35 + (0.9 * math.exp(-max(ub, 0) * 9) + 0.18 * (1 - smooth((t - 1.6) / 0.5))) * (ub >= 0)
        if t < T_LAND:
            glow = 0
        mx, my = (Mtub @ np.array([self.mouth[0], self.mouth[1] + 10, 1]))[:2]
        if glow > 0.01:
            for rad, col, it in ((200, (1.0, 0.45, 0.95), 0.25), (90, (1.0, 0.80, 0.45), 0.45), (35, (1.0, 1.0, 0.9), 0.7)):
                cv2.circle(add, (int(mx * 8), int(my * 8)), int(rad * zoom * k * 0.5 * 16 / 2),
                           tuple(v * it * glow for v in col), -1, cv2.LINE_AA, 4)

        # plume: a squashed heap on the tub until the burst, then it shoots up
        if t >= T_LAND * 0.3:
            pc, kp = self.place(self.plume.c)
            pv = self.mouth
            if ub < 0:
                jig = 1 + c * 0.12 * abs(math.sin(t * 40))
                Mh = T(*pv) @ RS(0, 0.82, 0.30 * jig) @ T(-pv[0], -pv[1])
                M = Mtub @ T(*self.tub.c) @ np.diag([1 / k, 1 / k, 1]) @ T(-tub_rest[0], -tub_rest[1]) \
                    @ T(*pc) @ np.diag([kp, kp, 1]) @ T(-self.plume.c[0], -self.plume.c[1]) @ Mh
                # (piece follows the tub transform)
                M = Mtub @ np.linalg.inv(T(*tub_rest) @ np.diag([k, k, 1]) @ T(-self.tub.c[0], -self.tub.c[1])) \
                    @ T(*pc) @ np.diag([kp, kp, 1]) @ T(-self.plume.c[0], -self.plume.c[1]) @ Mh
            else:
                sy_ = 0.30 + 0.70 * out_back(ub / 0.5, 1.6)
                sx_ = 0.82 + 0.18 * out_quart(ub / 0.4)
                Mh = T(*pv) @ RS(0, sx_, sy_) @ T(-pv[0], -pv[1])
                M = cam @ T(0, rec) @ T(*pc) @ np.diag([kp, kp, 1]) @ T(-self.plume.c[0], -self.plume.c[1]) @ Mh
            self.draw(cv, self.plume, M)

        # shards: spin out from the mouth
        for j, sh in enumerate(self.shards):
            ts = T_BURST + 0.03 + 0.05 * j
            q = (t - ts) / 0.55
            if q <= 0:
                continue
            e = out_quart(q)
            rc, ks = self.place(sh.c)
            start = (mx - rc[0], my - rc[1])
            pos = (start[0] * (1 - e), start[1] * (1 - e) - 80 * math.sin(math.pi * e))
            M = cam @ T(rc[0] + pos[0], rc[1] + pos[1]) @ RS((1 - e) * (560 if j else -560), 0.15 + 0.85 * e, 0.15 + 0.85 * e) \
                @ np.diag([ks, ks, 1]) @ T(-sh.c[0], -sh.c[1])
            M = np.linalg.inv(cam) @ M if False else M
            self.draw(cv, sh, M, opacity=smooth(q / 0.08))

        # tub on top of the heap's lower part / shards
        if t > 0:
            self.draw(cv, self.tub, Mtub, opacity=smooth(t / 0.06))

        # kernels: each one flies from the mouth to its exact spot
        for sp in sorted(self.kern, key=lambda s: s.big):
            q = (t - sp.ts) / sp.dur
            if q <= 0:
                continue
            e = out_quart(q)
            rc, ks = self.place(sp.c)
            dx, dy = mx - rc[0], my - rc[1]
            perp = (-dy * sp.arc, dx * sp.arc)
            bend = math.sin(math.pi * e)
            pos = (dx * (1 - e) + perp[0] * bend, dy * (1 - e) + perp[1] * bend - 60 * bend)
            sc = (0.12 if not sp.big else 0.25) + (1 - (0.12 if not sp.big else 0.25)) * out_back(q, 1.1)
            M = cam @ T(rc[0] + pos[0], rc[1] + pos[1]) @ RS(sp.rot0 * (1 - e), sc, sc) \
                @ np.diag([ks, ks, 1]) @ T(-sp.c[0], -sp.c[1])
            self.draw(cv, sp, M, opacity=smooth(q / 0.06))

        # extra kernels whipping past the lens (all gone well before the end)
        for f in self.fly:
            q = (t - f["ts"]) / f["dur"]
            if not 0 < q < 1:
                continue
            e = q ** 1.6
            reach = max(W, H) * 0.75 * f["reach"]
            px = mx + math.cos(f["ang"]) * reach * e
            py = my + math.sin(f["ang"]) * reach * e + 300 * e * e
            sc = (0.25 + f["s1"] * e) * self.k_in
            sp = f["spr"]
            M = T(px, py) @ RS(f["spin"] * q, sc, sc) @ T(-sp.c[0], -sp.c[1])
            self.draw(cv, sp, M, opacity=smooth(q / 0.08) * (1 - smooth((q - 0.85) / 0.15)))

        # sparks
        if 0 <= ub < 1.0:
            for a, spd, dl in self.sparks:
                uu = ub - dl * 0.5
                if uu <= 0:
                    continue
                life = 1 - smooth(uu / 0.7)
                r = 900 * spd * (1 - math.exp(-uu * 3.2)) * self.k_in
                x = mx + math.cos(a) * r
                y = my + math.sin(a) * r * 0.8 + 260 * uu * uu
                vx = math.cos(a) * 900 * spd * math.exp(-uu * 3.2) * 3.2
                vy = math.sin(a) * 720 * spd * math.exp(-uu * 3.2) * 3.2 + 520 * uu
                l = 0.012
                cv2.line(add, (int(x * 4), int(y * 4)), (int((x - vx * l) * 4), int((y - vy * l) * 4)),
                         (1.6 * life, 1.1 * life, 0.5 * life), 2, cv2.LINE_AA, 3)

        a2 = cv2.GaussianBlur(add, (0, 0), 1.0) + cv2.GaussianBlur(add, (0, 0), 7) * 0.9
        cv += cv2.resize(a2, (W, H), interpolation=cv2.INTER_LINEAR)
        # burst flash (whole frame)
        if ub >= 0:
            cv += np.float32([1.0, 0.8, 0.85]) * 0.22 * math.exp(-ub * 14)
        return cv

    def samples(self, t):
        if t < T_LAND + 0.08 or T_BURST - 0.02 < t < 1.75:
            return 12
        return 3

    def render(self, i):
        t = i / FPS
        n = self.samples(t)
        acc = None
        for j in range(n):
            tt = max(0.0, t - SHUTTER * j / max(1, n - 1))
            if t >= T_BURST > tt:
                tt = T_BURST
            f = self.frame_at(tt)
            acc = f if acc is None else acc + f
        acc /= n
        # land exactly on the client's frame
        out = np.clip(acc, 0, 1)
        blur = cv2.GaussianBlur(out, (0, 0), 1.2)
        out = np.clip(out + (out - blur) * 0.35, 0, 1)          # gentle sharpen after upscaling
        if self.full_c is not None:
            w = smoother((t - 1.92) / 0.26)
            if w > 0:
                out = out * (1 - w) + np.clip(self.full_c, 0, 1) * w
        return (out * 255 + 0.5).astype(np.uint8)


_s = None


def _init(fmt):
    global _s
    _s = Burst(fmt)


def _frame(i):
    return i, _s.render(i)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--format", default="16x9", choices=["16x9", "9x16"])
    ap.add_argument("--stills", nargs="*", type=float)
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    if a.stills is not None:
        fr = [min(NF - 1, int(round(s * FPS))) for s in a.stills]
        with Pool(os.cpu_count(), initializer=_init, initargs=(a.format,)) as pool:
            for i, im in pool.map(_frame, fr):
                Image.fromarray(im).save(os.path.join(OUT, f"still_{a.format}_{i:03d}.png"))
        return
    W, H = (1920, 1080) if a.format == "16x9" else (1080, 1920)
    path = os.path.join(OUT, f"popburst_{a.format}_60fps.mp4")
    enc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                            "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow",
                            "-crf", "16", "-profile:v", "high", "-level", "4.2", "-pix_fmt", "yuv420p",
                            "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
                            "-movflags", "+faststart", path], stdin=subprocess.PIPE)
    with Pool(os.cpu_count(), initializer=_init, initargs=(a.format,)) as pool:
        for i, im in pool.imap(_frame, range(NF), chunksize=1):
            enc.stdin.write(im.tobytes())
            if i % 30 == 0:
                print(f"[{a.format}] {i}/{NF}", flush=True)
    enc.stdin.close()
    enc.wait()
    print("wrote", path)


if __name__ == "__main__":
    main()
