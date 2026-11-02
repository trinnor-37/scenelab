"""Final logo layout in reference ("logo") space: a 1254 x 1254 square that
matches assets/reference_logo.png. Every element gets a centre (x, y), scale
(sx, sy) relative to its trimmed sprite, and a roll in degrees.

Letters are auto-kerned on their coloured cores so the sticker outlines
merge the way they do in the reference art."""
import numpy as np
import cv2
from assets import load_rgba, core_mask

LOGO = 1254.0

WORD = ["B_blue", "I_blue", "N_blue", "G_blue", "E_blue",
        "N_pink", "E_pink", "S_pink", "T_pink"]
TVWORD = ["T_orange", "V_orange"]

# word geometry, tuned against the reference
WORD_SPAN = (78.0, 1222.0)       # left/right of the coloured cores
WORD_BASE_L, WORD_BASE_R = 846.0, 836.0   # core baseline at left / right end
WORD_S_L, WORD_S_R = 0.192, 0.206  # letter height scale ramps up to the right
CONDENSE = 0.86                    # the reference lettering is narrower than the stickers
WORD_ROT = -1.2

TV_SPAN = (462.0, 774.0)
TV_BASE = 1132.0
TV_S = 0.205


def _profiles(core):
    """Per-row leftmost / rightmost core pixel (nan where the row is empty)."""
    h, w = core.shape
    xs = np.arange(w)[None, :]
    any_ = core.any(axis=1)
    left = np.where(any_, np.where(core, xs, w).min(axis=1), np.nan).astype(float)
    right = np.where(any_, np.where(core, xs, -1).max(axis=1), np.nan).astype(float)
    return left, right


_CORE_CACHE = {}


def _core_info(f):
    if f not in _CORE_CACHE:
        rgba = load_rgba(f)
        core = core_mask(rgba)
        ys = np.where(core.any(axis=1))[0]
        left, right = _profiles(core)
        _CORE_CACHE[f] = dict(w=rgba.shape[1], h=rgba.shape[0], bottom=ys.max(), left=left, right=right)
    return _CORE_CACHE[f]


def _kern_word(files, scales, gap, condense=1.0):
    """Return per-letter x offsets (left edge of trimmed sprite, in logo
    units before span fitting) and the core bottoms, all letters bottom-
    aligned on their cores."""
    info = []
    for f, s in zip(files, scales):
        c = _core_info(f)
        info.append(dict(f=f, s=s, sx=s * condense, **c))
    xs = [0.0]
    for k in range(1, len(info)):
        a, b = info[k - 1], info[k]
        # rows in logo units measured upward from the shared baseline
        grid = np.arange(0, 260, 2.0)
        def prof(i, side):
            rows = i["bottom"] - grid / i["s"]
            rows = np.clip(rows, 0, i["h"] - 1).astype(int)
            p = (i["left"] if side == "l" else i["right"])[rows]
            return p * i["sx"]
        ra = prof(a, "r") + xs[-1]
        lb = prof(b, "l")
        diff = lb - ra  # needs + offset >= gap
        ok = ~np.isnan(diff)
        need = gap - diff[ok]
        xs.append(float(np.max(need)))
    return info, xs


def word_slots(files, span, base_l, base_r, s_l, s_r, rot, condense=1.0):
    """Lay the letters out so their cores exactly fill `span`, solving the
    inter-core gap (logo units, may go slightly negative = touching)."""
    n = len(files)
    scales = np.linspace(s_l, s_r, n)

    def extent(gap):
        info, xs = _kern_word(files, scales, gap, condense)
        lefts = [xs[k] + np.nanmin(info[k]["left"]) * info[k]["sx"] for k in range(n)]
        rights = [xs[k] + np.nanmax(info[k]["right"]) * info[k]["sx"] for k in range(n)]
        return info, xs, min(lefts), max(rights)

    lo, hi = -40.0, 60.0
    for _ in range(30):
        g = (lo + hi) / 2
        _, _, x0, x1 = extent(g)
        if x1 - x0 > span[1] - span[0]:
            hi = g
        else:
            lo = g
    info, xs, x0, x1 = extent((lo + hi) / 2)
    slots = []
    for k, i in enumerate(info):
        cx = span[0] + (xs[k] - x0) + i["w"] / 2 * i["sx"]
        u = (cx - span[0]) / (span[1] - span[0])
        base = base_l + (base_r - base_l) * u
        cy = base - (i["bottom"] - i["h"] / 2) * i["s"]
        slots.append(dict(file=i["f"], x=float(cx), y=float(cy), sx=float(i["sx"]), sy=float(i["s"]), rot=rot))
    slots[0]["gap"] = (lo + hi) / 2
    return slots


def build():
    word = word_slots(WORD, WORD_SPAN, WORD_BASE_L, WORD_BASE_R,
                      WORD_S_L, WORD_S_R, WORD_ROT, CONDENSE)
    tv = word_slots(TVWORD, TV_SPAN, TV_BASE, TV_BASE, TV_S, TV_S, 0.0, CONDENSE)
    # anchors (ax, ay) are in ORIGINAL asset pixel coordinates
    L = {
        "oval": dict(file="oval", anchor=(755.0, 513.0), x=613.0, y=812.0, sx=0.849, sy=0.787, rot=0.0),
        "tv": dict(file="tv", anchor=(750.5, 493.0), x=617.0, y=1023.0, sx=0.454, sy=0.399, rot=0.0),
        "character": dict(file="character", anchor=(627.0, 627.0), x=635.0, y=337.0, sx=0.496, sy=0.496, rot=0.0),
        "pop_tl": dict(file="popcorn", anchor=(625.0, 645.0), x=342.0, y=632.0, sx=0.102, sy=0.102, rot=-4.0),
        "pop_tr": dict(file="popcorn", anchor=(625.0, 645.0), x=905.0, y=638.0, sx=0.074, sy=0.074, rot=5.0),
        "pop_bl": dict(file="popcorn", anchor=(625.0, 645.0), x=352.0, y=1150.0, sx=0.120, sy=0.120, rot=-3.0),
        "pop_br": dict(file="popcorn", anchor=(625.0, 645.0), x=876.0, y=1152.0, sx=0.078, sy=0.078, rot=4.0),
    }
    return L, word, tv


if __name__ == "__main__":
    L, word, tv = build()
    print("word gap", round(word[0]["gap"], 2), "tv gap", round(tv[0]["gap"], 2))
    for s in word + tv:
        print({k: (round(v, 3) if isinstance(v, float) else v) for k, v in s.items()})
