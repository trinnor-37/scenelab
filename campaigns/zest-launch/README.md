# Zest: 20s launch (9:16, SFX only)

Pink grapefruit sparkling water. Hook: **"Real fruit. Real fizz."** The can pops open on the word *fizz*. No music and no voice. The ad ends with a **tap-to-shop button being pressed**, not a logo card.

```
python3 build.py --stills     # → out/zest_launch_20s_9x16.mp4 (+ out/stills/ QA frames)
```

`timeline.json` is the single source of truth for every cut, super, can move, SFX cue and the button press. `build.py` renders it. If an asset is missing, the script draws a labelled placeholder, so this one script gives you today's animatic and later the finished cut.

## The can-lock rule (how "never regenerate my can" is enforced)

Video models redraw every pixel in frame. If a model gets your can as a reference, it repaints the can and the label drifts. So **the can never goes into a generator**:

1. Generators only make **plates**: fruit, fizz, mist, ice and the set. Every plate prompt asks for an empty, can-shaped space with no can, packaging or text in it.
2. Your real photo is cut out (transparent PNG) and **composited** on top in `build.py`.
3. The only operations on it are **move** and **uniform scale** (Lanczos). There is no rotation, warp, relight, recolour, added condensation or label overlay. The drop shadow and bubbles sit *behind* it.
4. The one exception is the spray burst on the pop (0.75 s, screen-blended). It passes briefly across the top rim; the can pixels underneath are untouched. Delete `"spray"` from S2 in `timeline.json` if you don't want anything over the can.
5. If a photo is smaller than its largest on-screen size (about 1,040 px tall in S2), the script prints a warning rather than quietly upscaling.

## What I need from you

| File | What | Why |
|---|---|---|
| `assets/can_closed.png` | Your real can, closed, cut out on transparency, at least 1,100 px tall | 0.0–2.4 s |
| `assets/can_open.png` | **The same can, same angle and lighting, ring-pull opened**, cut out | The pop is a cut on frame 72, from the closed photo to the open one, hidden by the flash, shake, spray and tab-crack. Without it, the closed can is held throughout and the pop is only sound and spray. |
| `assets/plates/*.mp4` | Generated plates (prompts below) | Optional now; gradients stand in |
| `assets/sfx/*.wav` | The 17 SFX files named in `timeline.json` | Silent track until supplied |

**Facts to confirm before this runs as an ad:**
- "Low sugar": the on-screen sub-line is a placeholder `[ Xg sugar per can ]`. Fill it in from the nutrition panel. In the UK and EU, a drink can only claim "low sugar" at **≤2.5 g sugar per 100 ml**. If Zest is above that, change the wording.
- "Made with real pink grapefruit": this needs real grapefruit (juice or extract) in the ingredients list.
- "Naturally flavoured": this needs natural flavourings only.

## Beat sheet (30 fps, 600 frames)

| Time | Shot | Picture | Super | Key SFX |
|---|---|---|---|---|
| 0.0–2.4 | S1 | Halved pink grapefruit drops into frame; the **closed** real can rises in from below (1.0–1.6) | "Real fruit." at 0.3, then "Real" at 1.9 | wet fruit thud, droplets, soft whoosh, settle tick |
| **2.4** (f72) | S2 | **POP**: cut to the open can, 2-frame white flash, 5-frame shake, spray burst | **"fizz."** pops in at 145% → 100% | **ring-pull crack + hiss** on f72 |
| 2.4–6.0 | S2 | Bubbles rise behind the can; slow push-in 50 → 54% of frame height | hook holds to 5.6 | fizz crackle bed |
| 6.0–9.5 | S3 | Grapefruit macro, juice beads; can slides in on the right | "Made with real pink grapefruit" | swish, two drips |
| 9.5–12.5 | S4 | Zest peel twist, backlit citrus-oil mist; can on the left | "Naturally flavoured" | peel snap, mist spritz |
| 12.5–15.5 | S5 | Ice drops into a glass of pink sparkling water; can on the right | "Low sugar" + `[ Xg sugar per can ]` | ice clink, pour |
| 15.5–17.5 | S6 | Hero: can centred and largest, grapefruit halves flanking | "Real fruit · Naturally flavoured · Low sugar" | airy whoosh |
| 17.6–18.0 | S6 | Can lifts up; the **Tap to shop →** button springs up from below | | UI slide-up |
| 18.25 | | Button pulses once (invites the tap) | | |
| **18.7** (f561) | | **Pressed**: touch dot lands, button compresses to 92% and darkens, shadow collapses, ripple ring | | **UI tap click** + mini fizz pop |
| 18.7–20.0 | | Holds on the pressed state to the last frame. No logo card. | | fizz tail |

## Plate prompts (Seedance 2 / Kling, image or text to video, 9:16, 1080×1920)

Shared suffix for every plate. Match the light direction to your can photo before generating.
> Soft key light from upper left, gentle pink-to-coral gradient backdrop, shallow depth of field, high-end beverage commercial, crisp macro detail, natural fruit colour. Keep the centre (or the stated side) of frame clear as empty negative space. **No cans, no bottles, no packaging, no labels, no logos, no text, no hands, no people.**

- **p1_fruit_drop** (2.4 s): A freshly halved pink grapefruit falls into the upper left of frame and lands flat. Juice droplets burst outward in slow motion, glistening ruby flesh and pale pith rind visible. The lower centre stays empty.
- **p2_fizz_rise** (3.6 s): Streams of fine carbonation bubbles rise through a soft pink haze, gently drifting, with backlit sparkle. The centre stays clear. Slow push-in.
- **p2_spray** (0.75 s, **on pure black**, for a screen blend): A burst of fine white mist and droplets erupts upward from a single point at the lower centre, as if under pressure. It fans out, then falls.
- **p3_grapefruit_macro** (3.5 s): Extreme macro of pink grapefruit segments. Juice beads swell and drip slowly, with light glowing through the flesh. Subject on the left; the right half is empty.
- **p4_zest_mist** (3.0 s): A curl of grapefruit peel twists on its own, releasing a fine backlit spray of citrus oil, droplets sparkling. Subject on the right; the left half is empty.
- **p5_ice_glass** (3.0 s): Clear ice cubes drop into a tall plain glass of pale pink sparkling water and bubbles surge. The glass is unbranded. Glass on the left; the right half is empty.
- **p6_hero_set** (4.5 s): Two pink grapefruit halves rest on a soft pink plinth either side of an empty centre spot, with fine bubbles drifting and a gentle light sweep. The centre and lower third stay clear (the button sits there).

No person appears in any shot; the tap is a touch dot, not a hand. That means the human-realism block isn't needed here. If you'd rather a real finger press the button, that shot gets the realism block (skin, eyes, hair, body and posture, skin-tone accuracy, mandatory clauses) as standard.

## SFX

The cue list, offsets and gains are in `timeline.json → sfx`. Source them from a foley library, or record them. A real can crack recorded on a phone beats any library version. `build.py` places each file at its exact time, mixes with no auto-normalising, then sets loudness to **−14 LUFS integrated / −1 dBTP**. Line up the ring-pull **transient** with sample 0 of `can_tab_crack.wav` so it lands on frame 72, and do the same for `ui_tap_click.wav` on frame 561.
