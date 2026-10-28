# Zest reel: 30 s, 9:16, kinetic / Hot Sauce

HyperFrames project for the Zest pink grapefruit launch reel. The brief, approved script and start prompt are in `brief/`. The approved style frames are in `styleframes/`, and the board they came from is in `reference/styleframes-board.html`.

```
python3 -I scripts/prepare_assets.py   # can cut-out (alpha repair, RGB verified unchanged) + sheet crops
python3 -I scripts/vo_edit.py          # tighten the voice take, write word timings
bash scripts/make_sfx.sh               # placeholder SFX
npx hyperframes@0.8.211 check          # lint + runtime + layout + contrast
npx hyperframes@0.8.211 render -o renders/zest-reel-review-raw.mp4 -f 30
```

In this cloud session, renders need `HYPERFRAMES_BROWSER_PATH` set to the pre-installed headless shell. GSAP and the fonts are stored in the project because the jsDelivr CDN is blocked here.

## The can

- `assets/zest-can.png` is your photo, cut out with `hyperframes remove-background`. Only its alpha channel was repaired: the model left see-through spots on the label and a haze around the can. Every visible pixel matches the photo (checked: 0 changed).
- In the film, the can is only moved, scaled and rotated. No caption or graphic sits over it, apart from the white flash and the coral flood at the hook's scene change.
- The tab macro, slice and fruit images are plain crops from `zest-sheet.png`. They're about 260 px, so they're shown at no more than about 2× size.

## Voice

- The voice is Ollie B (ElevenLabs eleven_v3), supplied by you and approved. `scripts/vo_edit.py` shortens only the silences, from 31.9 s to 27.4 s. Each cut has an 8 ms fade and no word is touched. The voice is levelled to −16 LUFS, with headroom for the effects.
- No speech model can be downloaded here (Hugging Face is blocked), so the word timings come from matching the take's pauses to the script's sentences. Word times inside a phrase are spread by syllable count. The captions are close but not exact, especially on "Zest is the fruit's bright, citrusy peel", which has its own internal pause.

## Not final yet

- **SFX:** `assets/sfx/*.wav` are placeholders synthesised in code. To swap one, drop in a pack sound with the same file name and re-render.
- **Score:** none yet. The brief asks for a score retuned to the look. That needs a music source (your pack, or a generated track quoted before spending).
- **The can never visibly opens.** Only closed-can photos exist, so the crack is sound plus spray.
- **Hook claim:** "Crack open real grapefruit" and "made with real fruit" depend on the product containing real grapefruit. The listed ingredients show flavouring only.
