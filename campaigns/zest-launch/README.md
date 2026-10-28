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
4. Two brief exceptions sit over the can, and the can pixels underneath are never changed. The first is the 2-frame white flash on the pop (0.07 s). The second is the spray burst on the pop (0.75 s, screen-blended). It passes briefly across the top rim. Delete `"spray"` from S2 in `timeline.json` to remove it.
5. If a photo is smaller than its largest on-screen size (about 1,040 px tall in S2), the script prints a warning rather than quietly upscaling.

## Assets: status

| File | Status |
|---|---|
| `assets/source/zest_can_front.png` | ✅ Your front can photo (1024×1536, white background) |
| `assets/source/zest_reference_sheet.png` | ✅ Your reference sheet (palette, back panel, top view) |
| `assets/can_closed.png` | ✅ Cut out with `python3 prepare_can.py assets/source/zest_can_front.png assets/can_closed.png`. Alpha only: checked to have **0 changed RGB pixels** against the photo. 584×1500, so it is only ever scaled *down* (largest on-screen size is about 1,040 px). |
| `assets/can_open.png` | ❌ **Missing.** The same can, same angle and light, with the tab opened. Until it exists, the closed can is held and the pop on "fizz" is carried by the flash, shake, spray and ring-pull crack. Drop the file in and re-run; the cut on frame 72 then happens with no other change. |
| `assets/plates/*.mp4` | ❌ Not generated yet (prompts below); gradients stand in |
| `assets/sfx/*.wav` | ❌ The 17 SFX files named in `timeline.json`; the track is silent until supplied |

The brand palette is sampled from the reference sheet: magenta `#A80836`, pink `#FE7B8E`, coral `#FE4B54`, blush `#FEC4CA`. Supers and the button use the magenta.

**Claims, checked against the back panel on the reference sheet:**
- "Low sugar": ✅ the panel shows **0.4 g sugars per 100 ml**, inside the UK/EU limit of ≤2.5 g/100 ml. The super reads "Only 0.4g sugar per 100ml". Confirm this against your production panel, because the sheet looks like a mock-up.
- "Naturally flavoured": ✅ the ingredients list natural flavourings only.
- "Real fruit": ⚠️ **the ingredients list doesn't support this.** They read "Carbonated water, natural grapefruit flavouring, citric acid, natural flavours". That is flavouring, with no grapefruit juice or fruit. The sheet's own icon says "Real fruit *flavour*". The hook and the can both say "Real fruit". If the drink contains no actual grapefruit, change the hook (for example "Real flavour. Real fizz.") and the can copy before this runs. For that reason I replaced my earlier "Made with real pink grapefruit" super with "Pink grapefruit / sparkling water", which only repeats what the can says.

## Beat sheet (30 fps, 600 frames)

| Time | Shot | Picture | Super | Key SFX |
|---|---|---|---|---|
| 0.0–2.4 | S1 | Halved pink grapefruit drops into frame; the **closed** real can rises in from below (1.0–1.6) | "Real fruit." at 0.3, then "Real" at 1.9 | wet fruit thud, droplets, soft whoosh, settle tick |
| **2.4** (f72) | S2 | **POP**: cut to the open can, 2-frame white flash, 5-frame shake, spray burst | **"fizz."** pops in at 145% → 100% | **ring-pull crack + hiss** on f72 |
| 2.4–6.0 | S2 | Bubbles rise behind the can; slow push-in 50 → 54% of frame height | hook holds to 5.6 | fizz crackle bed |
| 6.0–9.5 | S3 | Grapefruit macro, juice beads; can slides in on the right | "Pink grapefruit / sparkling water" | swish, two drips |
| 9.5–12.5 | S4 | Zest peel twist, backlit citrus-oil mist; can on the left | "Naturally flavoured" | peel snap, mist spritz |
| 12.5–15.5 | S5 | Ice drops into a glass of pink sparkling water; can on the right | "Low sugar" + "Only 0.4g sugar per 100ml" | ice clink, pour |
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
