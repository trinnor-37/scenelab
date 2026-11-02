# BingeNest TV — logo reveal

A 10-second, 60 fps logo reveal built entirely in code with a small 2.5D
renderer (numpy, Pillow and OpenCV; ffmpeg for encoding). It runs as one
continuous shot with no cuts. Each beat hands over to the next through a
camera move, a rack focus or a shape morph.

| Format | Size | Output |
|---|---|---|
| Landscape | 1920×1080 | `out/bingenest_tv_16x9_60fps.mp4` |
| Vertical (re-laid out, not cropped) | 1080×1920 | `out/bingenest_tv_9x16_60fps.mp4` |

## Beats

| Time | Beat | Handover |
|---|---|---|
| 0.0–1.0s | Popcorn drifts past the lens in focus over a deep purple void | Rack focus to the logo plane |
| 0.45–2.4s | **BINGE** flies in from deep space; **NEST** whips in from behind the camera. Each letter lands with a squash, a flash, a shockwave and a camera kick. The vertical version stacks the two words on two lines. | Light sweep |
| 2.9–4.1s | A golden comet orbits the word and draws the oval; the purple fills from the centre. The vertical version reflows the two lines into one here. | Shape morph and pull-back |
| 4.0–5.4s | The camera tilts down; the TV springs up, its screen flickers on, and **T** and **V** fly out of the screen | Camera tilt |
| 5.5–6.4s | The camera pulls back and up; the character drops into his seat, popcorn erupts and the four piles pop in | Pull-back |
| 6.4–10s | The end card matches `assets/reference_logo.png`, with a slow push-in, glints and a final sweep | — |

## Run

```bash
pip install numpy pillow opencv-python-headless   # ffmpeg must be on PATH
python3 src/render.py --format 16x9               # full master
python3 src/render.py --format 9x16
python3 src/render.py --format 16x9 --contact     # 16-frame contact sheet
python3 src/render.py --format 9x16 --stills 1.5 6.2 9.9
```

A full render takes about 5–6 minutes per format on 4 cores.

## Files

- `src/engine.py`: the renderer. Perspective camera, sprite cards in 3D with
  yaw, pitch and roll, mip-mapped warps, depth of field, adaptive multi-sample
  motion blur, additive FX, bloom, vignette and grain.
- `src/scene.py`: the timeline. Holds every animation curve, the camera
  keyframes for each format and the particle systems.
- `src/layout.py`: the final logo layout in reference space. The letters are
  auto-kerned on their coloured cores to fit the reference's span and baseline.
- `src/assets.py`: sprite loading and procedural sprites (bokeh, glints).
- `src/prep_character.py`: keys the character off its black background.
- `src/fit_layout.py` and `src/still_check.py`: tools for checking alignment
  against the reference logo.

Tweak the timing with the constants at the top of `src/scene.py`
(`WORD_LAND`, `RING`, `TV_LAND`, `CHAR_LAND` …). Tweak the framing with
`FORMATS[...]["keys"]`, given as `(t, cx, cy, zoom, roll)`.
