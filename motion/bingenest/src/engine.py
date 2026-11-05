"""2.5D compositor: perspective camera, sprite cards in 3D, depth of field,
multi-sample motion blur, additive FX, bloom and a filmic finish.

World space is "logo space" (the 1254-unit reference square, y down) with z
pointing away from the camera; the finished logo lives on the plane z = 0.
"""
import math
import numpy as np
import cv2

D0 = 1800.0  # camera distance at zoom 1 (logo units)


# ------------------------------------------------------------------ camera

class Camera:
    def __init__(self, W, H, base, cx, cy, zoom, roll_deg=0.0, focus=None, aperture=0.0):
        self.W, self.H, self.base = W, H, base
        self.cx, self.cy = cx, cy
        self.D = D0 / zoom
        self.f = base * D0
        r = math.radians(roll_deg)
        self.cr, self.sr = math.cos(r), math.sin(r)
        self.focus = focus if focus is not None else self.D
        self.aperture = aperture

    def project(self, X, Y, Z):
        """World -> screen. Works on scalars or numpy arrays. Returns (sx, sy, depth)."""
        rx, ry, rz = X - self.cx, Y - self.cy, Z + self.D
        k = self.f / np.maximum(rz, 1e-3)
        px, py = rx * k, ry * k
        sx = self.W / 2 + px * self.cr - py * self.sr
        sy = self.H / 2 + px * self.sr + py * self.cr
        return sx, sy, rz

    def ppu(self, Z):
        """Screen pixels per logo unit at depth Z."""
        return self.f / max(Z + self.D, 1e-3)

    def coc(self, Z):
        """Depth-of-field blur radius (px) for content at world depth Z."""
        d = max(Z + self.D, 1e-3)
        return self.aperture * abs(d - self.focus) / d


def rot_matrix(rx, ry, rz):
    """Rotation (degrees): pitch about x, then yaw about y, then roll about z."""
    a, b, c = (math.radians(v) for v in (rx, ry, rz))
    Rx = np.array([[1, 0, 0], [0, math.cos(a), -math.sin(a)], [0, math.sin(a), math.cos(a)]])
    Ry = np.array([[math.cos(b), 0, math.sin(b)], [0, 1, 0], [-math.sin(b), 0, math.cos(b)]])
    Rz = np.array([[math.cos(c), -math.sin(c), 0], [math.sin(c), math.cos(c), 0], [0, 0, 1]])
    return Rz @ Ry @ Rx


# ------------------------------------------------------------------ helpers

def fast_blur(img, sigma):
    if sigma < 0.6:
        return img
    if sigma <= 6:
        return cv2.GaussianBlur(img, (0, 0), sigma)
    f = min(8, max(2, int(sigma / 3)))
    h, w = img.shape[:2]
    small = cv2.resize(img, (max(1, w // f), max(1, h // f)), interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (0, 0), sigma / f)
    return cv2.resize(small, (w, h), interpolation=cv2.INTER_LINEAR)


class Card:
    """A sprite placed in 3D. `anchor` is the pivot in sprite level-0 pixels."""
    __slots__ = ("sprite", "x", "y", "z", "sx", "sy", "rx", "ry", "rz", "anchor")

    def __init__(self, sprite, x, y, z=0.0, sx=1.0, sy=1.0, rx=0.0, ry=0.0, rz=0.0, anchor=None):
        self.sprite, self.x, self.y, self.z = sprite, x, y, z
        self.sx, self.sy, self.rx, self.ry, self.rz = sx, sy, rx, ry, rz
        self.anchor = anchor if anchor is not None else sprite.anchor

    def corners_world(self):
        s = self.sprite
        ax, ay = self.anchor
        loc = np.array([[-ax, -ay, 0], [s.w - ax, -ay, 0], [s.w - ax, s.h - ay, 0], [-ax, s.h - ay, 0]], float)
        loc[:, 0] *= self.sx
        loc[:, 1] *= self.sy
        R = rot_matrix(self.rx, self.ry, self.rz)
        return loc @ R.T + np.array([self.x, self.y, self.z])


def card_homography(cam, card):
    wc = card.corners_world()
    sx, sy, d = cam.project(wc[:, 0], wc[:, 1], wc[:, 2])
    if np.any(d < 40):
        return None, None
    s = card.sprite
    src = np.float32([[0, 0], [s.w, 0], [s.w, s.h], [0, s.h]])
    dst = np.float32(np.stack([sx, sy], 1))
    H = cv2.getPerspectiveTransform(src, dst)
    # approximate on-screen scale for mip selection
    area = abs(cv2.contourArea(dst))
    scale = math.sqrt(max(area, 1e-6) / (s.w * s.h))
    return H, (dst, scale)


class Frame:
    """Premultiplied float32 RGB canvas over an opaque background."""

    def __init__(self, W, H):
        self.W, self.H = W, H
        self.rgb = np.zeros((H, W, 3), np.float32)
        self.add = np.zeros((H // 2, W // 2, 3), np.float32)  # half-res additive FX buffer

    # -------------------------------------------------------------- sprites
    def draw(self, cam, cards, opacity=1.0, blur=0.0, additive=False, flash=0.0,
             flash_color=(1.0, 1.0, 1.0), sweep=None, mask_fn=None, dof=True,
             tint=None):
        """Draw a card (or a list of motion-blur sub-samples of the same card)."""
        if not isinstance(cards, (list, tuple)):
            cards = [cards]
        if opacity <= 0.003:
            return
        geo = []
        for c in cards:
            H, info = card_homography(cam, c)
            if H is not None:
                geo.append((c, H, info))
        if not geo:
            return
        # depth of field from the card centre
        if dof and cam.aperture > 0:
            blur = math.hypot(blur, cam.coc(cards[len(cards) // 2].z) * 0.5)
        pad = int(math.ceil(blur * 3)) + 2
        pts = np.concatenate([g[2][0] for g in geo], 0)
        x0 = int(math.floor(pts[:, 0].min())) - pad
        y0 = int(math.floor(pts[:, 1].min())) - pad
        x1 = int(math.ceil(pts[:, 0].max())) + pad
        y1 = int(math.ceil(pts[:, 1].max())) + pad
        X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(self.W, x1), min(self.H, y1)
        if X1 <= X0 or Y1 <= Y0:
            return
        # render in the (possibly larger) padded box so blur has data, then crop
        bx0, by0 = max(x0, X0 - pad), max(y0, Y0 - pad)
        bx1, by1 = min(x1, X1 + pad), min(y1, Y1 + pad)
        bw, bh = bx1 - bx0, by1 - by0
        if bw * bh > 12_000_000:
            return
        acc = None
        for c, H, (dst, scale) in geo:
            spr = c.sprite
            lvl = spr.level_for(scale)
            img = spr.levels[lvl]
            if mask_fn is not None:
                img = mask_fn(img, lvl)
            Hl = H @ np.diag([spr.w / img.shape[1], spr.h / img.shape[0], 1.0])
            T = np.array([[1, 0, -bx0], [0, 1, -by0], [0, 0, 1]], float)
            out = cv2.warpPerspective(img, T @ Hl, (bw, bh), flags=cv2.INTER_LINEAR,
                                      borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
            acc = out if acc is None else acc + out
        if len(geo) > 1:
            acc *= 1.0 / len(geo)
        if blur > 0.6:
            acc = fast_blur(acc, blur)
        rx0, ry0 = X0 - bx0, Y0 - by0
        acc = acc[ry0:ry0 + (Y1 - Y0), rx0:rx0 + (X1 - X0)]
        rgb, a = acc[..., :3], acc[..., 3:4]
        if tint is not None:
            rgb = rgb * np.float32(tint)
        if flash > 0:
            rgb = rgb + (a * np.float32(flash_color) - rgb) * min(flash, 1.0)
        if sweep is not None:
            pos, ang, width, strength, color = sweep
            yy, xx = np.mgrid[Y0:Y1, X0:X1].astype(np.float32)
            u = xx * math.cos(ang) + yy * math.sin(ang)
            band = np.exp(-((u - pos) / width) ** 2) * strength
            rgb = rgb + band[..., None] * a * np.float32(color)
        dstv = self.rgb[Y0:Y1, X0:X1]
        if additive:
            dstv += rgb * opacity
        else:
            dstv *= (1.0 - a * opacity)
            dstv += rgb * opacity

    # -------------------------------------------------------------- additive fx (half res)
    def ring(self, cx, cy, rx, ry, thickness, color, intensity, angle=0.0):
        if intensity <= 0.003 or rx < 1:
            return
        c = tuple(float(v * intensity) for v in color)
        cv2.ellipse(self.add, (int(cx * 0.5 * 16), int(cy * 0.5 * 16)),
                    (max(1, int(rx * 0.5 * 16)), max(1, int(ry * 0.5 * 16))), angle, 0, 360, c,
                    max(1, int(thickness * 0.5)), cv2.LINE_AA, 4)

    def dot(self, x, y, r, color, intensity):
        if intensity <= 0.003:
            return
        c = tuple(float(v * intensity) for v in color)
        cv2.circle(self.add, (int(x * 0.5 * 16), int(y * 0.5 * 16)), max(1, int(r * 0.5 * 16)), c, -1,
                   cv2.LINE_AA, 4)

    def line(self, p0, p1, w, color, intensity):
        if intensity <= 0.003:
            return
        c = tuple(float(v * intensity) for v in color)
        cv2.line(self.add, (int(p0[0] * 4), int(p0[1] * 4)), (int(p1[0] * 4), int(p1[1] * 4)), c,
                 max(1, int(w * 0.5)), cv2.LINE_AA, 3)

    def flush_add(self, soften=2.0):
        a = self.add
        glow = cv2.GaussianBlur(a, (0, 0), 6.0)
        a = cv2.GaussianBlur(a, (0, 0), soften) + glow * 0.8
        self.rgb += cv2.resize(a, (self.W, self.H), interpolation=cv2.INTER_LINEAR)
        self.add[:] = 0


# ------------------------------------------------------------------ finishing

def bloom(rgb, threshold=0.72, strength=0.42):
    lum = rgb.max(axis=2, keepdims=True)
    k = np.clip((lum - threshold) / (1.0 - threshold + 1e-6), 0, 1)
    bright = rgb * k
    h, w = rgb.shape[:2]
    s4 = cv2.resize(bright, (w // 4, h // 4), interpolation=cv2.INTER_AREA)
    b1 = cv2.GaussianBlur(s4, (0, 0), 4)
    s16 = cv2.resize(s4, (w // 16, h // 16), interpolation=cv2.INTER_AREA)
    b2 = cv2.GaussianBlur(s16, (0, 0), 5)
    b = b1 * 0.6 + cv2.resize(b2, (w // 4, h // 4), interpolation=cv2.INTER_LINEAR) * 0.8
    return rgb + cv2.resize(b, (w, h), interpolation=cv2.INTER_LINEAR) * strength


_VIG = {}


def finish(rgb, frame_idx, vignette=0.38):
    H, W = rgb.shape[:2]
    if (W, H) not in _VIG:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.hypot((xx - W / 2) / (max(W, H) / 2), (yy - H / 2) / (max(W, H) / 2))
        _VIG[(W, H)] = (1.0 - vignette * np.clip(r, 0, 1.4) ** 2.2)[..., None].astype(np.float32)
    out = rgb * _VIG[(W, H)]
    # soft shoulder so bloom hot-spots roll off instead of clipping hard
    out = np.where(out > 0.85, 0.85 + (1 - np.exp(-(out - 0.85) * 4)) * 0.15 / 1.0, out)
    rng = np.random.default_rng(frame_idx * 7919 + 17)
    grain = rng.standard_normal((H // 2, W // 2), dtype=np.float32) * (1.6 / 255)
    out = out + cv2.resize(grain, (W, H), interpolation=cv2.INTER_LINEAR)[..., None]
    return (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)
