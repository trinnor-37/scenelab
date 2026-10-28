#!/usr/bin/env python3
"""Cuts the real can out of its white-background product photo.

Only an alpha channel is added: the background is found by flood-filling near-white
pixels inward from the image border, and every can pixel keeps its original RGB.

Usage: python3 prepare_can.py assets/source/zest_can_front.png assets/can_closed.png
"""
import sys
from collections import deque

from PIL import Image, ImageFilter

WHITE_MIN = 236  # all channels at least this bright...
NEUTRAL = 10     # ...and close to grey (max - min), so pale pink label areas never count as background


def is_bg(px):
    r, g, b = px
    return min(r, g, b) >= WHITE_MIN and max(r, g, b) - min(r, g, b) <= NEUTRAL


def main(src, dst):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    pix = im.load()
    bg = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.extend(((x, 0), (x, h - 1)))
    for y in range(h):
        q.extend(((0, y), (w - 1, y)))
    while q:
        x, y = q.popleft()
        i = y * w + x
        if bg[i] or not is_bg(pix[x, y]):
            continue
        bg[i] = 1
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))

    alpha = Image.frombytes("L", (w, h), bytes(0 if v else 255 for v in bg))
    # pull the matte in by 1px and soften it so no white halo shows on pink
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert("RGBA")
    out.putalpha(alpha)
    out = out.crop(alpha.getbbox())
    out.save(dst)
    print(f"{dst}: {out.size[0]}x{out.size[1]}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
