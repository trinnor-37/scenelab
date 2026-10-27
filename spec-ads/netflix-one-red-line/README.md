# One red line, many jobs — Netflix spec ad

A 19 s spec film plus a 2 s end card, built entirely in code. It's a Python 2.5D renderer using numpy, Pillow and OpenCV, with ffmpeg for encoding.
It renders at 60 fps in two formats: **16:9 (1920×1080)** and a true **9:16 re-layout (1080×1920)**. Every scene has its own vertical composition; nothing is cropped.

> Spec work. Not affiliated with or endorsed by Netflix. The end card says this too.

## Concept

Everything is made of red light strands. One light runs through the whole film, and every scene gives it a new job:

| t (s) | Scene | The strand's job | Copy |
|---|---|---|---|
| 0.0 | Ignite | a spark draws itself into a line | One red line. |
| 2.4 | Player | progress bar and playhead | JOB 01 · Keeps your place. |
| 5.6 | Rows | focus ring hopping tile to tile (it stretches as it slides) | JOB 02 · Finds what's next. |
| 9.0 | Download | download ring that fills, then folds into a check | JOB 03 · Goes where you go. |
| 12.2 | Beat | six heartbeat waveforms with caption UI | JOB 04 · Feels every beat. |
| 15.2 | Screens | the strands trace a TV, a laptop, a tablet and a phone | JOB 05 · Fits every screen. |
| 17.6 | Mark | they braid into the N; end card from 19.0 | Many jobs. One Netflix. |

The film is one continuous shot. Each scene sits at its own anchor in a single 3D world. At every handover, three things happen together:

- The camera flies (and arcs) to the next anchor.
- The strands morph from one shape into the next, staggered per strand, lifting toward the lens mid-flight.
- Focus racks from the old plane to the new one.

There are no cuts.

## Look

- **Stage:** a near-black stage with a slow, drifting dark-red glow and floating dust lit by the glow.
- **Grain:** fine, luminance-weighted film grain.
- **Motion blur:** heavy, on a 0.9-frame shutter. The strands take up to 18 sub-samples per frame and the UI up to 10, scaled to how fast things move.
- **Light:** the strands are bundles of five fibres drawn with anti-aliased sub-pixel lines. They are screen-blended in with a bloom pyramid, which gives them a hot core and a Netflix-red halo.
- **UI:** frosted dark glass panels with a drop shadow, sheen and a lit rim. They float with perspective tilt and depth of field. All poster art is procedural, monochrome and cinematic.
- **Colour:** red (#E50914) is the only accent.

## Typeface: SF Pro Display

SF Pro Display is Apple-licensed, so it isn't bundled here. Copy `SF-Pro-Display-{Regular,Medium,Semibold,Bold,Heavy,Black}.otf` into `./fonts/`, or set `SF_PRO_DIR`. The renderer also checks `~/Library/Fonts` and `/Library/Fonts`, so on a Mac with SF Pro installed it just works.

If SF Pro isn't found, the renderer falls back to Inter Display and says so on startup. Set `REQUIRE_SF_PRO=1` to fail instead of falling back.

## Run

```bash
pip install -r requirements.txt          # plus ffmpeg on PATH
python render.py                         # both formats -> out/
python render.py --format port           # 9:16 only
python render.py --contact               # contact sheet every 0.5 s
python render.py --stills 4,7.5,19.8     # review frames
```

A full render takes roughly 6–8 minutes per format on 4 cores.

## Files

- `engine.py`: easing, fonts, camera and projection, sprite compositing with depth of field, strand rasteriser, background, bloom and grain.
- `assets.py`: glass panels, procedural posters, icons and in-UI text.
- `film.py`: the scenes, handovers, captions and frame renderer.
- `render.py`: the CLI, with parallel frame rendering piped into ffmpeg (libx264, yuv420p, BT.709).
