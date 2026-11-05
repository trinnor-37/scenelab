"""Key the character off its solid-black background.

Background = dark pixels flood-connected to the image border. Inside the
silhouette everything stays opaque; in the background region the purple
glow is kept as soft alpha (unpremultiplied) so the halo survives.
"""
import sys
import numpy as np, cv2
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
rgb = np.array(Image.open(src).convert("RGB")).astype(np.float32) / 255
h, w = rgb.shape[:2]
lum = rgb.max(axis=2)
dark = (lum < 0.16).astype(np.uint8)
n, lab = cv2.connectedComponents(dark, connectivity=4)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(border)) & (dark > 0)
fg = (~bg).astype(np.float32)
# soften the hard silhouette edge by one pixel
fg = cv2.GaussianBlur(fg, (0, 0), 0.8)
# glow: in the bg region, alpha follows brightness
glow_a = np.clip(lum / 0.16, 0, 1) ** 1.5
alpha = np.maximum(fg, np.where(bg, glow_a, 0))
alpha = np.clip(alpha, 0, 1)
col = np.where(alpha[..., None] > 1e-3, rgb / np.maximum(alpha[..., None], 1e-3), 0)
col = np.clip(col, 0, 1)
out = np.dstack([col, alpha])
Image.fromarray((out * 255 + 0.5).astype(np.uint8), "RGBA").save(dst)
print("saved", dst, "fg fraction", round(float((alpha > 0.5).mean()), 3))
