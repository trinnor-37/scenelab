#!/usr/bin/env python3
"""Finishes the can cutout from `hyperframes remove-background` and crops detail tiles from the sheet.

remove-background keeps the photo's RGB exactly but its matte leaves see-through spots on the
label and a faint haze around the can. This keeps the model's soft edge and repairs only alpha:
the can's solid interior (found by flood-filling the white backdrop) is forced opaque, and
anything outside a 3px band around the can is cleared. RGB is copied from the photo untouched
and verified at the end. Sheet tiles are plain crops.

Usage: python3 -I scripts/prepare_assets.py
"""
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/source/zest-can.png"
MODEL = ROOT / "assets/zest-can-cutout.png"
OUT = ROOT / "assets/zest-can.png"
SHEET = ROOT / "assets/source/zest-sheet.png"

# Tiles on zest-sheet.png (left, top, right, bottom), inside each tile's border, above its caption.
CROPS = {
    "top-detail": (2, 1203, 262, 1478),
    "print-detail": (270, 1203, 514, 1478),
    "fruit-inspiration": (773, 1203, 1022, 1478),
    "top-view": (596, 868, 802, 1078),
}


def backdrop_mask(im):
    """1 where the near-white backdrop connects to the image border."""
    w, h = im.size
    pix = im.load()
    bg = bytearray(w * h)
    q = deque([(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] +
              [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)])
    while q:
        x, y = q.popleft()
        i = y * w + x
        if bg[i]:
            continue
        r, g, b = pix[x, y]
        if min(r, g, b) < 236 or max(r, g, b) - min(r, g, b) > 10:
            continue
        bg[i] = 1
        q.extend(p for p in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)) if 0 <= p[0] < w and 0 <= p[1] < h)
    return Image.frombytes("L", (w, h), bytes(0 if v else 255 for v in bg))


def main():
    photo = Image.open(SRC).convert("RGB")
    model_a = Image.open(MODEL).convert("RGBA").getchannel("A")
    can = backdrop_mask(photo)
    interior = can.filter(ImageFilter.MinFilter(7))   # solid body, 3px in from the edge
    band = can.filter(ImageFilter.MaxFilter(7))       # edge zone, 3px out from the edge
    alpha = ImageChops.multiply(ImageChops.lighter(model_a, interior), band)

    out = photo.convert("RGBA")
    out.putalpha(alpha)
    out = out.crop(alpha.getbbox())
    out.save(OUT)

    left, top = alpha.getbbox()[:2]
    ref = photo.crop((left, top, left + out.width, top + out.height))
    changed = sum(1 for p, q, a in zip(out.convert("RGB").get_flattened_data(), ref.get_flattened_data(),
                                       out.getchannel("A").get_flattened_data()) if a and p != q)
    print(f"{OUT.name}: {out.width}x{out.height}, changed RGB pixels: {changed}")
    assert changed == 0

    sheet = Image.open(SHEET).convert("RGB")
    for name, box in CROPS.items():
        tile = sheet.crop(box)
        tile.save(ROOT / f"assets/crops/{name}.png")
        print(f"crops/{name}.png: {tile.width}x{tile.height}")


if __name__ == "__main__":
    main()
