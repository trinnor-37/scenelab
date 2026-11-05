"""BingeNest popcorn-box burst: a 2.2 s transparent overlay at 60 fps.

  0.00  a striped popcorn box rockets in from deep space, spinning
  0.55  hero turn, logo to camera; the box charges up: it shakes and light
        leaks out between the kernels
  1.05  BURST: the four walls hinge open and tumble away, around 200 kernels
        blast out (many straight past the lens), with a shockwave, light
        streaks and sparks
  2.20  the frame is nearly clear, ready to hand off to the next shot

The box is real geometry: each wall is a planar quad in 3D with its own
lighting, an inside face and back-face handling. Motion blur is temporal
supersampling: each output frame averages up to 18 sub-frames across a
180-degree shutter.

The output is premultiplied RGBA, written as a straight-alpha PNG sequence,
ProRes 4444 with alpha, and an MP4 preview over a dark backdrop.
"""
import math
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from assets import Sprite, load_rgba, popcorn_kernel, glint, soft_dot  # noqa: E402
from engine import Camera, Card, card_homography, fast_blur, rot_matrix  # noqa: E402

FPS = 60
DURATION = 2.2
NFRAMES = int(round(FPS * DURATION))
SHUTTER = 0.5 / FPS

T_ARRIVE = 0.55
T_BURST = 1.05

# box geometry (world units, y down, z away from camera)
TOP, BOT, HGT = 300.0, 205.0, 285.0
RIM_Y = -HGT / 2

FORMATS = {
    "16x9": dict(W=1920, H=1080, base=1.30, spread=(1.0, 1.0), fly_from=(-520.0, 120.0)),
    "9x16": dict(W=1080, H=1920, base=1.80, spread=(0.62, 1.35), fly_from=(0.0, 700.0)),
}

RED = np.array([0.86, 0.07, 0.13], np.float32)
WHITE = np.array([0.98, 0.96, 0.93], np.float32)


# ------------------------------------------------------------------ easing
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


def out_back(x, s=1.7):
    x = clamp(x) - 1
    return 1 + (s + 1) * x ** 3 + s * x ** 2


# ------------------------------------------------------------------ textures
def side_texture(logo=None, inside=False, w=540, h=600):
    """A tapered wall: the trapezoid is painted into a w x h rectangle (alpha 0
    outside) so it maps onto a planar rectangle in 3D exactly."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    v = yy / (h - 1)                                  # 0 top .. 1 bottom
    half_top, half_bot = w / 2, w / 2 * BOT / TOP
    half = half_top + (half_bot - half_top) * v
    u = (xx - w / 2) / half                           # -1..1 across the wall at this height
    inside_shape = np.abs(u) <= 1.0
    n = 9
    stripe = (np.floor((u + 1) / 2 * n) % 2 == 0)
    col = np.where(stripe[..., None], RED, WHITE).astype(np.float32)
    # anti-aliased stripe edges
    f = ((u + 1) / 2 * n) % 1.0
    edge = np.clip(np.minimum(f, 1 - f) * half[..., None][..., 0] * 2 / n * 2.2, 0, 1)
    col = col * edge[..., None] + (RED * 0.5 + WHITE * 0.5) * (1 - edge[..., None])
    # paper: subtle fibre noise and a vertical light falloff
    rng = np.random.default_rng(3 if inside else 1)
    noise = cv2.GaussianBlur(rng.standard_normal((h, w)).astype(np.float32), (0, 0), 1.2) * 0.025
    col = col * (1.0 + noise[..., None]) * (1.03 - 0.10 * v[..., None])
    # rolled rim at the top
    rim = np.clip(1 - np.abs(yy - 9) / 9, 0, 1)
    col = col * (1 - rim[..., None] * 0.5) + WHITE * rim[..., None] * 0.5
    # edge darkening near the folds
    col *= (0.86 + 0.14 * np.clip((1 - np.abs(u)) * 6, 0, 1))[..., None]
    if inside:
        col = col * (0.42 + 0.25 * (1 - v))[..., None]
        col = col[:, ::-1]
    a = inside_shape.astype(np.float32)
    a = cv2.GaussianBlur(a, (0, 0), 0.7)
    rgba = np.dstack([col * a[..., None], a]).astype(np.float32)
    if logo is not None and not inside:
        lh = int(h * 0.50)
        lw = int(logo.shape[1] * lh / logo.shape[0])
        L = cv2.resize(logo, (lw, lh), interpolation=cv2.INTER_AREA)
        x0, y0 = (w - lw) // 2, int(h * 0.30)
        reg = rgba[y0:y0 + lh, x0:x0 + lw]
        la = L[..., 3:4]
        reg[..., :3] = L[..., :3] + reg[..., :3] * (1 - la)
    return Sprite(rgba)


def bottom_texture(w=420, h=420):
    rgba = np.zeros((h, w, 4), np.float32)
    rgba[..., :3] = RED * 0.35
    rgba[..., 3] = 1.0
    rgba[..., :3] *= rgba[..., 3:4]
    return Sprite(rgba)


# ------------------------------------------------------------------ RGBA compositor
class Layer:
    """Premultiplied RGBA float canvas (transparent)."""

    def __init__(self, W, H):
        self.W, self.H = W, H
        self.c = np.zeros((H, W, 4), np.float32)

    def warp(self, img, Hm, opacity=1.0, blur=0.0, tint=None, additive=False):
        h, w = img.shape[:2]
        src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
        dst = cv2.perspectiveTransform(src[None], Hm)[0]
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
        out = out[Y0 - by0:Y1 - by0, X0 - bx0:X1 - bx0]
        if tint is not None:
            out = out.copy()
            out[..., :3] *= np.float32(tint)
        d = self.c[Y0:Y1, X0:X1]
        if additive:
            d[..., :3] += out[..., :3] * opacity
            d[..., 3] = np.maximum(d[..., 3], np.clip(out[..., :3].max(axis=2) * opacity, 0, 1))
        else:
            k = 1 - out[..., 3:4] * opacity
            d *= k
            d += out * opacity


def sprite_level(spr, scale):
    lvl = spr.level_for(scale)
    img = spr.levels[lvl]
    return img, np.diag([spr.w / img.shape[1], spr.h / img.shape[0], 1.0])


def draw_quad(layer, cam, spr, corners, tint=None, opacity=1.0, blur=0.0):
    """corners: 4x3 world points matching sprite (0,0),(w,0),(w,h),(0,h)."""
    sx, sy, d = cam.project(corners[:, 0], corners[:, 1], corners[:, 2])
    if np.any(d < 30):
        return
    dst = np.float32(np.stack([sx, sy], 1))
    src = np.float32([[0, 0], [spr.w, 0], [spr.w, spr.h], [0, spr.h]])
    Hm = cv2.getPerspectiveTransform(src, dst)
    area = abs(cv2.contourArea(dst))
    img, S = sprite_level(spr, math.sqrt(max(area, 1e-6) / (spr.w * spr.h)))
    layer.warp(img, Hm @ S, opacity, blur, tint)


def draw_card(layer, cam, card, opacity=1.0, blur=0.0, tint=None, additive=False):
    Hm, info = card_homography(cam, card)
    if Hm is None:
        return
    img, S = sprite_level(card.sprite, info[1])
    layer.warp(img, Hm @ S, opacity, blur, tint, additive)


# ------------------------------------------------------------------ scene
class PopBox:
    def __init__(self, fmt):
        F = FORMATS[fmt]
        self.fmt = fmt
        self.W, self.H, self.base = F["W"], F["H"], F["base"]
        self.spread = F["spread"]
        self.fly_from = F["fly_from"]
        logo = load_rgba("reference_logo")
        self.tex_logo = side_texture(logo)
        self.tex_plain = side_texture()
        self.tex_in = side_texture(inside=True)
        self.tex_bot = bottom_texture()
        self.kernels = [popcorn_kernel(s) for s in range(8)]
        self.glint = glint()
        self.dot = soft_dot()
        self.L = np.array([-0.45, -0.65, -0.60])
        self.L /= np.linalg.norm(self.L)
        self._prep_box()
        self._prep_popcorn()

    # ------------------------------------------------------------ geometry
    def _prep_box(self):
        t, b, hh = TOP / 2, BOT / 2, HGT / 2
        # wall corners in box space: (top-left, top-right, bottom-right, bottom-left) seen from outside
        self.walls = []
        for k in range(4):
            ang = math.radians(90 * k)
            R = rot_matrix(0, math.degrees(ang), 0)
            # front wall (k=0) faces -z (toward camera); the quad is the
            # bounding rectangle of the trapezoid, which lies in the wall plane
            tl = np.array([-t, -hh, -t]); tr = np.array([t, -hh, -t])
            br = np.array([t, hh, -b]); bl = np.array([-t, hh, -b])
            # the rectangle's bottom edge must be as wide as the top one
            # (the texture holds the trapezoid); extend along the wall plane
            q = np.stack([tl, tr, br, bl]) @ R.T
            tex = self.tex_logo if k in (0, 2) else self.tex_plain
            self.walls.append(dict(q=q, tex=tex, k=k))
        b_ = BOT / 2
        self.bottom = np.array([[-b_, hh, -b_], [b_, hh, -b_], [b_, hh, b_], [-b_, hh, b_]])

    def _prep_popcorn(self):
        rng = np.random.default_rng(11)
        # mound: kernels filling the top of the box, dome-shaped
        self.mound = []
        for i in range(64):
            r = math.sqrt(rng.uniform(0, 1))
            a = rng.uniform(0, 2 * math.pi)
            x, z = math.cos(a) * r * TOP * 0.50, math.sin(a) * r * TOP * 0.50
            y = RIM_Y - (115 * (1 - r ** 2.2) + rng.uniform(-10, 14))
            self.mound.append(dict(p=np.array([x, y, z]), k=i % 8, s=rng.uniform(0.26, 0.34),
                                   rz=rng.uniform(0, 360), ph=rng.uniform(0, 6.28)))
        # burst kernels: fired from inside the box
        sx, sy = self.spread
        self.burst = []
        for i in range(150):
            # direction: upward hemisphere, a big share straight at the camera
            if i % 3 == 0:
                d = np.array([rng.uniform(-0.55, 0.55), rng.uniform(-0.75, 0.15), -1.0])
                sp = rng.uniform(1900, 3000)
            else:
                th = rng.uniform(0, 2 * math.pi)
                el = rng.uniform(0.05, 1.0)
                d = np.array([math.cos(th) * el * 1.4, -rng.uniform(0.35, 1.0), -abs(math.sin(th)) * el - 0.15])
                sp = rng.uniform(1200, 2400)
            d = d / np.linalg.norm(d)
            v = d * sp
            v[0] *= sx
            v[1] *= sy
            self.burst.append(dict(p=np.array([rng.uniform(-90, 90), RIM_Y + rng.uniform(-20, 80),
                                               rng.uniform(-90, 90)]),
                                   v=v, k=i % 8, s=rng.uniform(0.20, 0.36), rz=rng.uniform(0, 360),
                                   vr=rng.uniform(-700, 700), delay=rng.uniform(0, 0.06)))
        # mound kernels join the burst with their own launch velocity
        for m in self.mound:
            d = np.array([m["p"][0] / 140, -1.0 - rng.uniform(0, 0.6), m["p"][2] / 140 - rng.uniform(0, 0.9)])
            d /= np.linalg.norm(d)
            v = d * rng.uniform(900, 2000)
            v[0] *= sx
            v[1] *= sy
            m["v"] = v
            m["vr"] = rng.uniform(-600, 600)
        # wall debris
        self.wall_motion = []
        for k in range(4):
            self.wall_motion.append(dict(
                out=rng.uniform(1150, 1500), up=rng.uniform(250, 520),
                axis=rng.normal(size=3), spin=rng.uniform(380, 640) * (1 if k % 2 else -1)))
        self.streaks = [(rng.uniform(0, 2 * math.pi), rng.uniform(0.6, 1.0), rng.uniform(0.85, 1.25))
                        for _ in range(16)]
        self.sparks = [(rng.uniform(0, 2 * math.pi), rng.uniform(0.3, 1.0), rng.uniform(-1, 1))
                       for _ in range(36)]

    # ------------------------------------------------------------ animation
    def box_pose(self, t):
        """Box-to-world rotation + position (pre-burst)."""
        fx, fy = self.fly_from
        p = clamp(t / T_ARRIVE)
        e = out_expo(p) * 0.8 + out_quart(p) * 0.2
        z = 5200 * (1 - e)
        x = fx * (1 - out_quart(p)) + 180 * math.sin(math.pi * out_quart(p)) * (1 if fx <= 0 else -1) * (fx != 0)
        y = fy * (1 - out_quart(p)) - 120 * math.sin(math.pi * out_quart(p))
        yaw = -740 * (1 - out_quart(p)) - 18 + 26 * smooth((t - T_ARRIVE) / (T_BURST - T_ARRIVE))
        pitch = 17 - 45 * (1 - out_quart(p))
        roll = 30 * (1 - out_quart(p)) * math.sin(p * 7)
        # hero settle wobble on arrival
        u = t - T_ARRIVE
        if u > 0:
            roll += 4 * math.exp(-u * 7) * math.sin(u * 22)
        # charge-up shake
        c = smooth((t - 0.78) / (T_BURST - 0.78))
        if 0 < c and t < T_BURST:
            x += c * 7 * math.sin(t * 157)
            y += c * 5 * math.sin(t * 131 + 1)
            roll += c * 3.5 * math.sin(t * 173)
        # anticipation squash just before the burst
        sq = 1 - 0.07 * smooth((t - (T_BURST - 0.12)) / 0.12)
        R = rot_matrix(pitch, yaw, roll)
        S = np.diag([1 / math.sqrt(sq), sq, 1 / math.sqrt(sq)])
        return R @ S, np.array([x, y, z])

    def camera(self, t):
        zoom = 1.0 + 0.06 * smooth((t - 0.4) / 0.7)
        roll = 0.0
        cx = cy = 0.0
        u = t - T_BURST
        if u >= 0:
            zoom += -0.08 * math.exp(-u * 6) * math.cos(u * 14) + 0.06 * (1 - math.exp(-u * 2))
            e = math.exp(-u * 9)
            cx += 9 * e * math.sin(u * 63)
            cy += 7 * e * math.sin(u * 51 + 1)
            roll += 1.4 * e * math.sin(u * 41)
        cam = Camera(self.W, self.H, self.base, cx, cy, zoom, roll)
        cam.focus = cam.D
        cam.aperture = 9.0
        return cam

    def lambert(self, n):
        d = max(0.0, float(np.dot(n, -self.L)))
        return 0.50 + 0.62 * d

    # ------------------------------------------------------------ draw
    def draw_box(self, layer, cam, t):
        M, P = self.box_pose(t)
        cam_pos = np.array([cam.cx, cam.cy, -cam.D])
        blur = cam.coc(P[2]) * 0.5
        faces = []
        for w in self.walls:
            q = w["q"] @ M.T + P
            c = q.mean(0)
            n = np.cross(q[1] - q[0], q[3] - q[0])
            n /= np.linalg.norm(n)
            n = -n  # outward
            out_facing = np.dot(n, cam_pos - c) > 0
            faces.append((c[2], q, w, n, out_facing))
        bq = self.bottom @ M.T + P
        # back walls (seen from inside) first, then the inner floor, the mound, then front walls
        backs = [f for f in faces if not f[4]]
        fronts = [f for f in faces if f[4]]
        for z, q, w, n, _ in sorted(backs, key=lambda f: -f[0]):
            sh = self.lambert(-n) * 0.9
            draw_quad(layer, cam, self.tex_in, q[[1, 0, 3, 2]], tint=(sh, sh, sh), blur=blur)
        draw_quad(layer, cam, self.tex_bot, bq, blur=blur)
        # glow from inside while charging
        c = smooth((t - 0.70) / (T_BURST - 0.70))
        if c > 0:
            gp = np.array([0.0, RIM_Y - 30, 0.0]) @ M.T + P
            for sc, op, col in ((6.0, 0.30, (1.0, 0.70, 0.35)), (2.8, 0.35, (1.0, 0.92, 0.75))):
                draw_card(layer, cam, Card(self.dot, gp[0], gp[1], gp[2], sc * (0.6 + c), sc * (0.6 + c) * 0.7),
                          opacity=op * c, tint=col, additive=True)
        # mound kernels (they jiggle while the box charges)
        ks = []
        for m in self.mound:
            p = m["p"].copy()
            if c > 0:
                p[1] -= c * 9 * abs(math.sin(t * 38 + m["ph"]))
            wp = p @ M.T + P
            ks.append((wp, m))
        for wp, m in sorted(ks, key=lambda q: -q[0][2]):
            s = m["s"] * 0.75
            draw_card(layer, cam, Card(self.kernels[m["k"]], wp[0], wp[1], wp[2], s, s, 0, 0, m["rz"]),
                      blur=blur)
        for z, q, w, n, _ in sorted(fronts, key=lambda f: -f[0]):
            sh = self.lambert(n)
            # glossy sheen sweeping as the face turns
            draw_quad(layer, cam, w["tex"], q, tint=(sh, sh, sh), blur=blur)
        return M, P

    def draw_debris(self, layer, cam, t):
        M, P = self.box_pose(T_BURST)
        u = t - T_BURST
        cam_pos = np.array([cam.cx, cam.cy, -cam.D])
        g = np.array([0.0, 1500.0, 0.0])
        items = []
        # walls: hinge open on their bottom edge, then fly
        for w, mo in zip(self.walls, self.wall_motion):
            q0 = w["q"] @ M.T + P
            hinge = (q0[2] + q0[3]) / 2
            c = q0.mean(0)
            outward = c - P
            outward[1] = 0
            outward /= (np.linalg.norm(outward) + 1e-6)
            axis_h = q0[2] - q0[3]
            axis_h /= np.linalg.norm(axis_h)
            ang_h = math.radians(70) * out_quart(u / 0.16)
            Rh = cv2.Rodrigues(axis_h * ang_h * (1 if np.dot(np.cross(axis_h, c - hinge), outward) < 0 else -1))[0]
            q = (q0 - hinge) @ Rh.T + hinge
            # free flight after the hinge kick
            ax = mo["axis"] / np.linalg.norm(mo["axis"])
            Rs = cv2.Rodrigues(ax * math.radians(mo["spin"]) * u)[0]
            cq = q.mean(0)
            vel = outward * mo["out"] * np.array([self.spread[0], 1, 1]) + np.array([0, -mo["up"], -350.0])
            cnew = cq + vel * u + 0.5 * g * u * u
            q = (q - cq) @ Rs.T + cnew
            items.append(("wall", q.mean(0)[2], q, w))
        bq = self.bottom @ M.T + P
        bq = bq + np.array([0, 260, 900.0]) * u + 0.5 * g * u * u
        items.append(("bottom", bq.mean(0)[2], bq, None))
        # kernels
        for b in self.burst + self.mound:
            uu = u - b.get("delay", 0.0)
            if uu < 0:
                continue
            p0 = (b["p"] @ M.T + P)
            # air drag so the burst decelerates instead of flying linearly
            k = 1.1
            dist = (1 - math.exp(-k * uu)) / k
            p = p0 + b["v"] * dist + 0.5 * g * uu * uu
            if p[2] + cam.D < 60:
                continue
            items.append(("k", p[2], p, b, uu))
        for it in sorted(items, key=lambda q: -q[1]):
            if it[0] == "wall":
                q, w = it[2], it[3]
                cpos = q.mean(0)
                n = -np.cross(q[1] - q[0], q[3] - q[0])
                n /= np.linalg.norm(n)
                blur = cam.coc(cpos[2]) * 0.5
                if np.dot(n, cam_pos - cpos) > 0:
                    sh = self.lambert(n)
                    draw_quad(layer, cam, w["tex"], q, tint=(sh, sh, sh), blur=blur)
                else:
                    sh = self.lambert(-n) * 0.85
                    draw_quad(layer, cam, self.tex_in, q[[1, 0, 3, 2]], tint=(sh, sh, sh), blur=blur)
            elif it[0] == "bottom":
                draw_quad(layer, cam, self.tex_bot, it[2], blur=cam.coc(it[1]) * 0.5)
            else:
                p, b, uu = it[2], it[3], it[4]
                s = b["s"] * 0.75
                rz = b["rz"] + b["vr"] * uu
                card = Card(self.kernels[b["k"]], p[0], p[1], p[2], s, s,
                            25 * math.sin(math.radians(rz) * 0.7 + b["k"]),
                            30 * math.sin(math.radians(rz) * 0.9 + 2 * b["k"]), rz)
                draw_card(layer, cam, card, blur=cam.coc(p[2]) * 0.5)

    def draw_light(self, layer, cam, t):
        """Burst light: flash core, shockwave ring, streaks and sparks (additive)."""
        u = t - T_BURST
        if u < 0 or u > 0.9:
            return
        M, P = self.box_pose(T_BURST)
        core = np.array([0.0, RIM_Y + 20, 0.0]) @ M.T + P
        sx, sy, _ = cam.project(*core)
        ppu = cam.ppu(core[2])
        add = np.zeros((self.H // 2, self.W // 2, 3), np.float32)

        def pt(x, y):
            return (int(x * 0.5 * 16), int(y * 0.5 * 16))
        # shockwave
        rad = (60 + 620 * out_quart(u / 0.45)) * ppu
        inten = 1.1 * (1 - smooth(u / 0.38))
        if inten > 0:
            cv2.ellipse(add, pt(sx, sy), (int(rad * 0.5 * 16), int(rad * 0.42 * 0.5 * 16)), 0, 0, 360,
                        (1.0 * inten, 0.85 * inten, 0.6 * inten), max(1, int(3 * ppu * 0.5)), cv2.LINE_AA, 4)
        # light streaks
        for a, ln, sp in self.streaks:
            r0 = (40 + 700 * out_quart(u / 0.45) * sp) * ppu
            r1 = r0 + (260 * ln * (1 - smooth(u / 0.5))) * ppu
            i2 = 1.6 * (1 - smooth(u / 0.45))
            if i2 <= 0:
                continue
            p0 = (sx + math.cos(a) * r0, sy + math.sin(a) * r0 * 0.8)
            p1 = (sx + math.cos(a) * r1, sy + math.sin(a) * r1 * 0.8)
            cv2.line(add, pt(*p0), pt(*p1), (1.0 * i2, 0.82 * i2, 0.45 * i2), max(1, int(2.5 * ppu * 0.5)),
                     cv2.LINE_AA, 4)
        # sparks
        for a, sp, zz in self.sparks:
            d = (60 + 820 * sp * out_quart(u / 0.7)) * ppu
            i3 = 2.0 * (1 - smooth(u / 0.7))
            if i3 > 0:
                cv2.circle(add, pt(sx + math.cos(a) * d, sy + math.sin(a) * d * 0.75 + 140 * u * u * ppu),
                           max(1, int((3.2 - 2 * u) * ppu * 0.5 * 16)), (1.0 * i3, 0.9 * i3, 0.7 * i3), -1,
                           cv2.LINE_AA, 4)
        add = cv2.GaussianBlur(add, (0, 0), 1.5) + cv2.GaussianBlur(add, (0, 0), 7) * 0.8
        add = cv2.resize(add, (self.W, self.H), interpolation=cv2.INTER_LINEAR)
        layer.c[..., :3] += add
        layer.c[..., 3] = np.maximum(layer.c[..., 3], np.clip(add.max(axis=2), 0, 1))
        # flash core
        f = math.exp(-u * 12)
        draw_card(layer, cam, Card(self.dot, core[0], core[1], core[2], 16 * (0.5 + u * 3), 12 * (0.5 + u * 3)),
                  opacity=1.3 * f, tint=(1.0, 0.85, 0.6), additive=True)
        draw_card(layer, cam, Card(self.glint, core[0], core[1], core[2], 3.2, 3.2, 0, 0, 12),
                  opacity=1.2 * f, tint=(1.0, 0.9, 0.75), additive=True)

    def sub(self, t):
        layer = Layer(self.W, self.H)
        cam = self.camera(t)
        if t < T_BURST:
            self.draw_box(layer, cam, t)
        else:
            self.draw_debris(layer, cam, t)
            self.draw_light(layer, cam, t)
        return layer.c

    def samples_for(self, t):
        if t < 0.5 or T_BURST - 0.02 < t < T_BURST + 0.7:
            return 18
        if t < 0.75:
            return 10
        return 6

    def render(self, i):
        t = i / FPS
        n = self.samples_for(t)
        acc = None
        for j in range(n):
            tt = t - SHUTTER * (j / max(1, n - 1))
            if t >= T_BURST > tt:
                tt = T_BURST  # never blend the closed box into burst frames
            c = self.sub(max(0.0, tt))
            acc = c if acc is None else acc + c
        acc /= n
        # gentle bloom on the overlay itself
        rgb = acc[..., :3]
        lum = rgb.max(axis=2, keepdims=True)
        br = rgb * np.clip((lum - 0.97) / 0.3, 0, 1)
        h, w = rgb.shape[:2]
        b = cv2.resize(cv2.GaussianBlur(cv2.resize(br, (w // 4, h // 4), interpolation=cv2.INTER_AREA), (0, 0), 5),
                       (w, h), interpolation=cv2.INTER_LINEAR) * 0.30
        acc[..., :3] += b
        acc[..., 3] = np.maximum(acc[..., 3], np.clip(b.max(axis=2), 0, 1))
        return np.clip(acc, 0, 1)


# ------------------------------------------------------------------ output
_scene = None


def _init(fmt):
    global _scene
    _scene = PopBox(fmt)


def _frame(i):
    return i, _scene.render(i)


def backdrop(W, H):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.hypot((xx - W / 2) / max(W, H), (yy - H / 2) / max(W, H)) * 2
    a = np.arctan2(yy - H / 2, xx - W / 2)
    rays = (0.5 + 0.5 * np.cos(a * 18)) ** 6 * np.exp(-r * 1.4) * 0.10
    col = np.float32([0.30, 0.06, 0.48]) * np.exp(-r * 1.8)[..., None] + np.float32([0.04, 0.0, 0.07])
    return col + rays[..., None] * np.float32([0.7, 0.3, 0.9])


def main():
    import argparse
    import subprocess
    from multiprocessing import Pool
    ap = argparse.ArgumentParser()
    ap.add_argument("--format", default="16x9", choices=list(FORMATS))
    ap.add_argument("--stills", nargs="*", type=float)
    a = ap.parse_args()
    out = os.path.join(os.path.dirname(__file__), "..", "out", "popbox")
    os.makedirs(out, exist_ok=True)
    W, H = FORMATS[a.format]["W"], FORMATS[a.format]["H"]
    bg = backdrop(W, H)

    def comp(c):
        return (np.clip(c[..., :3] + bg * (1 - c[..., 3:4]), 0, 1) * 255 + 0.5).astype(np.uint8)

    if a.stills is not None:
        frames = [min(NFRAMES - 1, int(round(s * FPS))) for s in a.stills]
        with Pool(os.cpu_count(), initializer=_init, initargs=(a.format,)) as pool:
            for i, c in pool.map(_frame, frames):
                Image.fromarray(comp(c)).save(os.path.join(out, f"still_{a.format}_{i / FPS:05.2f}.png"))
        return

    seq = os.path.join(out, f"png_{a.format}")
    os.makedirs(seq, exist_ok=True)
    prev = os.path.join(out, f"popbox_{a.format}_preview.mp4")
    enc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                            "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow",
                            "-crf", "18", "-profile:v", "high", "-level", "4.2", "-maxrate", "8M", "-bufsize", "16M",
                            "-pix_fmt", "yuv420p", "-movflags", "+faststart", prev], stdin=subprocess.PIPE)
    with Pool(os.cpu_count(), initializer=_init, initargs=(a.format,)) as pool:
        for i, c in pool.imap(_frame, range(NFRAMES), chunksize=1):
            # straight (un-premultiplied) alpha for the PNGs
            al = c[..., 3:4]
            straight = np.where(al > 1e-4, c[..., :3] / np.maximum(al, 1e-4), 0)
            rgba = np.concatenate([np.clip(straight, 0, 1), al], 2)
            Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), "RGBA").save(
                os.path.join(seq, f"popbox_{a.format}_{i:04d}.png"), compress_level=3)
            enc.stdin.write(comp(c).tobytes())
            if i % 30 == 0:
                print(f"[{a.format}] {i}/{NFRAMES}", flush=True)
    enc.stdin.close()
    enc.wait()
    mov = os.path.join(out, f"popbox_{a.format}_alpha_prores4444.mov")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i",
                    os.path.join(seq, f"popbox_{a.format}_%04d.png"), "-c:v", "prores_ks", "-profile:v", "4444",
                    "-pix_fmt", "yuva444p10le", "-alpha_bits", "16", "-vendor", "apl0", mov], check=True)
    print("wrote", prev, mov, seq)


if __name__ == "__main__":
    main()
