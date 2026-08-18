---
name: video-prompt-generator
description: Create professional, cinematic prompts for any modern director-controllable AI video generation model. Use when users want multi-shot sequences, timed shot blocks, native dialogue and audio, image-to-video keyframes, multilingual scenes, character consistency across shots, or director-level camera, lens, lighting, and physics control. Produces tightly-packed prompts that ship cleanly across strict-moderation video models.
---

# Video Prompt Generator

Modern director-controllable video models understand **cinematic intent**, not just visual descriptions. Write prompts like scene directions from a director who knows real camera work, not just AI generation.

This skill teaches **one universal craft** that ships cleanly across modern video models. The conventions baked in here conform to the strictest content and prompt-format spec available, which means the same prompt that satisfies the strict spec also passes on more permissive models. One craft, one output, lands everywhere.

## Core Principle

Think like a director of photography. Every prompt must answer five questions in order:

1. **What does the camera see?** (Scene + Subject)
2. **How does the camera behave?** (Shot type + Movement + Lens)
3. **What happens over time?** (Action progression with timing)
4. **What does it feel like?** (Lighting + Atmosphere + Sound)
5. **What should the model hold steady?** (Positive consistency / quality constraints)

---

## Pre-Writing Scaffold — The 13-Element Framework

Before writing a single word of the prompt, walk through these 13 elements in order. They are the inputs. The Mandatory Prompt Structure below is the output format that packages them. Steps 1–7 build the world, 8–11 are production specs, 12 maps directly to the timed Shot Blocks, 13 becomes part of the closing constraints/quality line.

### 1. STYLE
Cinematic language first. Genre, tone, camera aesthetic, film stock, color grade. The lens everything else gets filtered through. Pick a single dominant anchor described by **its visual signature** — era, genre, format, palette, grain, lens character — never by naming a specific film, director, photographer, brand, or franchise (those are blocked by §15b). Describe what the look *looks like*, not what it's *from*.
*Example:* `1970s 35mm grindhouse, warm desaturated palette, heavy grain, anamorphic flare.`

### 2. ENVIRONMENT
Real place with real atmosphere. Time of day, textures, mood, what's in frame, what's implied off frame. Give the location a physics — wet, dusty, humid, frozen — not just a name.
*Example:* `An abandoned drive-in theater at dusk, cracked asphalt, weeds through speaker poles, magenta sky bleeding into navy.`

### 3. CHARACTER
One clear energy. Who they are, how they carry themselves, default state before anything happens. Concrete physical anchors — age, build, distinguishing wardrobe, posture — never pronouns.
*Example:* `A late-50s mechanic in oil-stained coveralls and a faded ball cap, broad shoulders, deliberate slow movements, calm tired eyes.`

### 4. CREATURE / ANTAGONIST
Non-human element described physically and mechanically. No magic words. Describe what the body does, how it moves, what it weighs, how it interacts with the environment.
*Example:* `A six-legged mantis-like form, chitinous and matte black, head the size of a car door, mandibles clicking dryly, joints too long for the body, weight distributed across articulating spurs.`

### 5. THREAT
Separate from the creature. What triggers the action. Movement, not appearance. The threat is the inciting moment, not the noun.
*Example:* `The mantis's head tilts a quarter-inch toward the mechanic — the only motion in the whole frame.`

### 6. CORE ACTION
Full story as one sentence chain: setup → inciting moment → escalation → resolution → punchline. This is the spine. Everything else dresses it.
*Example:* `The mechanic looks up from a carburetor, sees the shape between two speaker poles, slowly sets the wrench down, takes one step backward — and the entire screen of the drive-in lights up white behind him.`

### 7. ENERGY
Emotional contract with the viewer. Where the humor lives, where the horror lives, the final feeling. Pick one. Don't try to land two emotions in a single beat.
*Example:* `Slow dread that snaps into awe — not fear of the creature, fear of what it's looking at.`

### 8. CAMERA
Shot list with shot-type names. How the camera behaves emotionally across the arc. Handheld vs smooth, when it shakes, when it locks off, what lens, what height. Camera is a character.
*Example:* `Lock-off wide on a tripod, then a slow 6-second push-in to a tight medium on the mechanic's face, then a sharp tilt up to the brightening drive-in screen behind him.`

### 9. LIGHTING
DP brief. Source, quality, direction, how it shifts across the timeline. Practical logic only, no fantasy light. Every shift must be motivated by something physical in the scene.
*Example:* `Single source: the dying sunset behind the speaker poles, low and red, hard rim across his cheekbone. At the punchline beat, the drive-in screen blasts white and rewashes the entire frame from behind.`

### 10. PHYSICS
How everything moves. Weight, momentum, texture. Bodies, objects, creatures. This is what separates cinematic from generated-looking.
*Example:* `The wrench has weight — it makes the mechanic's arm dip slightly when he holds it. When he sets it down, the metal taps the engine block with a real ping. The mantis's head moves with the silence of something that does not breathe.`

### 11. AUDIO
Sound design arc. Ambient baseline, how it breaks, what fills each beat, what the silence does, final audio punchline. Treat sound as parallel to picture, not an afterthought.
*Example:* `Crickets and a distant freeway hum throughout. The wrench tap on the engine block. A single dry mandible click. Then the drive-in screen ignites and a 1950s newsreel announcer voice hits at full volume: "Tonight's feature presentation."`

### 12. TIMELINE
Timestamp every beat. 0–3s, 3–5s, etc. Shot type, action, camera behavior, mood. Director's cut on paper. This maps directly into the Shot Blocks below — one timeline beat = one Shot Block.
*Example:*
- 0–3s: Wide lock-off, mechanic at carburetor, golden-hour calm.
- 3–6s: Slow push-in, mechanic looks up, registers something off-camera.
- 6–9s: Tight medium, sets wrench down, takes one step back.
- 9–12s: Sharp tilt up, drive-in screen blasts white, newsreel voice hits.

### 13. STYLE BOOSTERS
Closing list of aesthetic keywords that reinforce the vibe. Final tone calibration pass. These flow into the closing constraints/quality line — film stock, grade, lens character, atmosphere.
*Example:* `Anamorphic flare, halation on highlights, fine 35mm grain, warm shadow rolloff, low-contrast magenta-to-navy gradient, practical-only lighting, 24fps.`

> Once you've worked through all 13, you have everything you need to fill the mandatory output format below. Steps 1–7 build the world, 8–11 are production specs, 12 maps directly to the timed Shot Blocks, 13 becomes part of the closing constraints/quality line.

---

## Pre-Writing Scaffold (Compact) — The 8-Element Formula

For shorter or single-shot prompts, use this compact scaffold for fast packing:

**`Subject + Action + Scene + Lighting + Camera + Style + Quality + Constraints`**

Target word count: **50–150 words**. Every word earns its place.

Use this instead of the 13-element scaffold when:
- The idea is a single beat, not a multi-shot arc (a product shot, a character portrait, a single character moment, an atmospheric texture)
- The user wants something tight and dense, not narrative
- You're building a fast variation off an existing template

For ideas with a real arc (setup → escalation → payoff), use the 13-element scaffold. The 8-element formula is for moments; the 13-element scaffold is for stories.

---

## Mandatory Prompt Structure

Every prompt this skill produces MUST follow this standardized architecture. No exceptions. The 13-element scaffold's TIMELINE step feeds Step 2 directly — each timeline beat becomes one Shot Block.

### Step 1: Scene Header

One line establishing location, time of day, and dominant light source.

```
[Location] at/during [time]. [Dominant light description].
```

**Example:** `A rain-soaked pit lane at a night race. Harsh overhead floodlights cut through mist and tire smoke.`

### Step 2: Shot Blocks (Numbered + Timed)

Every shot gets its own clearly separated block with:
- **Shot number and label** — descriptive name for the beat
- **Timing window** — exact seconds this shot occupies
- **Camera specs** — shot type, angle, lens suggestion, movement
- **Subject action** — what happens progressively over time
- **Sensory layer** — sound cues, lighting shifts, atmospheric detail

```
SHOT [N] — [DESCRIPTIVE LABEL] ([start]–[end] seconds)
[Shot type], [angle], [lens if relevant]. [Camera movement description].
[Subject action described as progression over time, not static state].
[Sound/atmosphere cues]. [Lighting notes if shifting].
```

**CRITICAL FORMATTING RULES:**
- Each shot block MUST be separated by a blank line
- Never run shots together in a single paragraph
- Each shot should be 2–5 lines maximum
- Timing windows must be continuous and non-overlapping
- Total timing must match the target duration
- **One primary action verb per shot block.** Compound choreography is allowed but expressed as a sequence inside the shot's progression, never as stacked verbs.
- **Maximum 2 characters per shot.** Identity drift compounds above two.

### Step 3: Constraints Block (Positive-Only)

Every prompt ends with a constraints line that holds the model steady. **Always write constraints as positive instructions describing the desired behavior, never as negations of unwanted behavior.** Strict-moderation models ignore "no X" phrasing entirely; positive phrasing works on all models.

**Standard universal block:**
```
maintain face and clothing consistency, character face stable without deformation, normal human structure, natural and smooth movements, stable picture, stable background, pure visual narrative without subtitles, [lighting type], cinematic realism, professional cinema quality, 24fps.
```

**Category-specific positive variants:**

**People / Characters:**
```
maintain face and clothing consistency, character face stable without deformation, normal human structure, stable identity throughout, natural skin texture, natural and smooth movements, pure visual narrative without subtitles, cinematic realism, 24fps.
```

**Vehicles / Mechanical:**
```
physically accurate vehicle dynamics, intact body geometry, correct wheel count and placement, grounded weight and momentum, realistic surface reflections, filmic contrast, natural color grading, professional cinema quality, 24fps.
```

**Action / Sports:**
```
realistic biomechanics, grounded inertia, continuous motion at natural speed, stable framing through impact, pure visual narrative without subtitles, cinematic sports realism, 24fps.
```

**Single rule, no modes:** *Always write constraints as positive instructions describing the desired behavior, never as negations of unwanted behavior.*

---

## Shot-Level Camera Language

Modern video models respond to SPECIFIC cinematographic terms. Vague descriptions produce static, lifeless output.

### Camera Behavior Descriptors

**Handheld family** — for raw, immersive energy:
- `raw handheld shake` — aggressive documentary feel
- `subtle handheld camera shake` — controlled imperfection
- `intense handheld micro-jitters` — almost imperceptible organic movement
- `handheld and imperfect, slightly shaking as if shot with a long lens`

**Mounted/Mechanical family** — for precision and power:
- `rigidly mounted to [surface], subtle mechanical vibration only`
- `side-tracking camera, strong sense of speed`
- `low chase camera close to [subject]`
- `static low rear-angle camera, placed near the ground`

**Transition movements** — for connecting beats:
- `camera sharply zooms in` — fast cinematic zoom
- `camera suddenly whip-pans and performs a fast zoom`
- `camera pulls back as [subject] [action]` — smooth cinematic pull-back
- `camera tilts sharply upward following [subject]`
- `aggressive focus pull` — snap focus shift between planes

### Speed Modifiers

Pair any movement keyword with a speed modifier for precise control: **slow / medium / fast / gradual**.

- `slow push-in` — builds tension, intimacy
- `medium dolly forward` — natural cinematic pace
- `fast whip-pan` — energy, surprise, transition
- `gradual pull-back` — reveal over time, emotional distance

### Lens Suggestions

Include lens references when they meaningfully affect the shot's character:

| Lens | When to Use | Example Context |
|------|-------------|-----------------|
| `wide-angle (16–24mm)` | Onboard cameras, cockpit POV, establishing | Race cars, action POV |
| `35mm` | Documentary feel, natural perspective | Handheld tracking, street scenes |
| `50mm` | Clean portraits, neutral | Dialogue, medium shots |
| `85mm` | Compressed backgrounds, isolation | Close-ups, emotional beats |
| `long lens / telephoto` | Surveillance feel, compressed depth | Aircraft, distant subjects |

### Motion Physics Descriptors

These sell realism. Always include at least one per shot:

- `motion blur on background, subject stays sharp`
- `strong parallax with [environment elements]`
- `dust and [particles] visible in [light source]`
- `heat shimmer / heat distortion visible`
- `realistic reflections on [surface]`
- `[material] flexing / vibrating under force`
- `tire smoke / drift smoke trailing`
- `snow particles / water spray in sunlight`
- `debris and sparks [direction]`
- `rubber dust and heat shimmer visible`

For more depth, see `references/CAMERA-TECHNIQUES.md`.

---

## Multi-Shot Generation

Numbered + timed shot blocks remain the universal output format. For very simple ideas, a single tightly written shot is often stronger than forcing multiple shots. Use multi-shot when the idea has a real arc — setup, escalation, payoff.

### Rules for Multi-Shot Prompts

1. **Always number shots** with descriptive labels and timing windows
2. **Each shot = one camera setup** — new angle, new movement, or new subject emphasis
3. **Timing must be explicit and continuous** — no gaps, no overlaps
4. **Transitions between shots should be implied** through cut language: "Hard cut to," "Cut to," "Camera snaps to"
5. **Maintain subject consistency** by using the same role-based descriptors across shots, never pronouns
6. **Total duration must equal sum of shot windows**
7. **4–6 shot blocks is a comfortable upper bound for most prompts.** Beyond that, tighten or split into separate generations.

### Pacing Guide

| Duration | Shots | Rhythm |
|----------|-------|--------|
| 5 seconds | 1–2 | Single beat or beat + reaction |
| 8–10 seconds | 2–4 | Setup → build → payoff |
| 10–12 seconds | 3–5 | Montage or short narrative arc |
| 15 seconds | 4–6 | Full micro-story with escalation |

---

## Image-to-Video / Reference Frames

When the user provides a reference image or keyframe:

### Rules
1. **Open with the anchor instruction** — tell the model to use the image
2. **Never redescribe what's already visible** — the image IS the description
3. **Focus entirely on motion evolution FROM the image** — what changes, what moves, where the camera goes
4. **Match the image's existing lighting and style** — don't introduce conflicting aesthetics
5. **Limit to 1–3 reference images per prompt.** More references dilute the model's attention.

### Template
```
Use the provided image as the [exact opening visual reference / start frame / keyframe].

SHOT 1 — [LABEL] (0–Xs)
Starts from the provided [image/keyframe]. [Describe motion that evolves FROM what's visible].
[Camera movement]. [Physics/atmosphere].

SHOT 2 — [LABEL] (X–Ys)
[Continuation of motion, new camera angle or escalation].
...

[Positive constraints].
```

If your model supports image references, anchor the reference at the start of the prompt with a phrase like *"Use the provided image as the exact opening keyframe"* and never redescribe what's already visible in it.

---

## Character Establishment

### For Recurring Characters
Define subjects early with consistent identifiers. Modern video models lock traits across shots when you give them concrete anchors.

```
[Role/Description] — then reference as [Role] consistently throughout
```

**Do:** `the driver grips the wheel` → later: `the driver's right hand slams the gearbox`
**Don't:** `the man grips the wheel` → later: `he slams the gearbox` (pronouns break coreference)

### For Anonymous Subjects
Use role-based descriptors consistently:

```
a male athlete → the athlete (throughout)
a pilot → the pilot (throughout)
```

### Reference Image Anchoring
If your model supports image references, anchor the character to a reference image at the start of the prompt and append a positive consistency phrase: *"The character must stay identical throughout — same face, same hair, same outfit."*

---

## Audio & Dialogue

### Native Audio Attribution
```
[Character Role, tone descriptor]: "Dialogue here."
```

### Sound Design in Action Prompts
Embed sound cues directly into shot descriptions rather than listing them separately:

**Do:** `Engine revs spike. Tires screech on asphalt.` (inside the shot block)
**Don't:** `Sound effects: engine, tires` (listed separately)

### Audio Reference Uploads
If your model supports audio reference uploads, you can attach a track for beat-synced mood control. Match the cut rhythm to the reference audio's beat pattern.

### Audio Keywords Reference
See `references/AUDIO-KEYWORDS.md` for comprehensive lists of speech, dialogue, singing, sound effect, and ambient keywords.

---

## Duration & Word-Count Optimization

| Duration | Best For | Complexity Level |
|----------|----------|------------------|
| 5s | Single action, one camera move | Simple |
| 8–10s | Action + reaction, 2–3 camera setups | Medium |
| 10–12s | Montage sequence, commercial | High |
| 15s | Full narrative arc with escalation | Maximum |

**Rule:** More duration = more shots needed. Never write a 10+ second prompt as a single paragraph. Always break into timed shots.

**Word-count discipline:** Aim for **50–150 words** in the prompt body. Every word earns its place. Trim adjective stacks, cut redundant atmosphere, drop anything that doesn't change what the camera sees or does. Tight, dense prompts ship more reliably than long sprawling ones across all modern video models.

---

## Multilingual Support

Modern video models handle multiple languages, dialects, and code-switching within scenes.

```
The vendor speaks in Japanese with a friendly tone: "今日は寒いですね。"
A tourist responds in slightly accented Japanese: "はい、でも雰囲気が素敵です。"
Her companion adds softly in English: "This feels like a movie scene."
```

---

## Text Rendering

When the model needs to render legible text on signage, screens, or props, specify the text with bold formatting:

```
Clean engraved lettering on the machine reads: **"Brew Calm."**
```

---

## Content Safety Primer

Modern strict-moderation video models reject certain content patterns at the prompt-filter layer before generation even starts. The filter is a **keyword/pattern layer, not semantic** — it pattern-matches English tokens. This is exploitable through vocabulary substitution and cinematic framing.

### 15a. The Stricter-Spec Rule

The filters on the strictest modern video models are the upper bound. The same craft that satisfies the strictest model passes everywhere else silently. This skill teaches one set of phrasing habits that ship across all models — write to the stricter spec, ship anywhere.

### 15b. Hard Blocks — Never Include

These are rejected reliably regardless of framing:

- **Real human faces in uploaded reference images** (deepfake interceptors)
- **Real celebrity names** — use a descriptive role instead (*"the legendary ringside coach"* not *"Mike Tyson"*)
- **Copyrighted characters by name OR visual pattern** — filters recognize the visual signature of Disney princesses, Marvel/DC heroes, anime icons, etc., even when the name is omitted. Describe an *original* character with similar energy instead.
- **Real brand names and logos** — use a generic descriptor (*"a matte-black sports coupe"* not *"a Ferrari"*)
- **Explicit violence with literal action verbs** — *"a soldier shoots someone in the street"* is the canonical instant-block. Rewrite using the substitution bank below.
- **NSFW / sexual content** of any framing
- **Gore** — visible blood, dismemberment, viscera
- **Politically sensitive content**

### 15c. Soft Blocks — Use With Caution

Context-dependent. Sometimes pass on retry, sometimes don't:

- Weapons and firearms (hand-to-hand combat passes more readily than weapon-based action)
- Historical violence references
- Suggestive poses, fashion / swimwear framings
- Explicit dark/horror gore (creature/monster content generally passes; explicit gore does not)

### 15d. Vocabulary Substitution Bank

Pattern-matched filters trip on specific English tokens. Substitute as follows:

| Avoid | Use instead |
|---|---|
| attack | impact |
| punch | momentum, force transfer |
| shoot | muzzle flash |
| stab | sudden contact |
| blood | crimson liquid |
| kill / die | consequence, collapse, stillness |
| explosion | concussive bloom, shockwave |
| weapon | instrument, object |
| gun | mechanism |
| corpse / dead body | motionless figure |
| naked | unclothed silhouette (still risky; prefer not to depict) |
| celebrity name | descriptive role |
| copyrighted character | original character with similar energy |
| brand name | generic descriptor |

### 15e. The "Camera Carries the Drama" Principle

When a scene needs tension, weight, or impact, lean on **camera movement, lighting, and physics descriptors** rather than action verbs. *"Wide shot, low angle, rim lighting, debris suspended in slow rolling motion, time stretches"* is dramatic AND passes filters. *"He punches him in the face"* is neither. **This is the highest-leverage craft technique in the skill.**

### 15f. Reference-Image Safety

- **Never upload real photographs of real human faces.** Use AI-generated portraits, illustrated/anime characters, oil-painted, 3D-rendered, or stylized side-profile references instead.
- Real photos of environments, objects, vehicles, and landscapes are fine — face-detection blocks only target human faces.
- When you need a recognizable character across shots, build them from prose (*"a tall woman with copper-red hair, late 30s, in a charcoal trench coat"*) rather than uploading a photo.

### 15g. The Stylization Distance Lever

Every step away from photoreal reduces filter strictness:

`photoreal → painted → illustrated → 3D-animated → abstract`

When a prompt is borderline, push it one step toward stylization to ship reliably. A photoreal action scene that gets blocked will often pass as a 3D-animated equivalent.

---

## Iteration & Troubleshooting

When a prompt doesn't land, diagnose before re-rolling. Most failures are structural and fixable in one revision pass.

### 16a. Failure-Mode Catalog

| Symptom | Likely cause | Surgical fix |
|---|---|---|
| Identity drift / face morphing | Vague subject description, no reference anchor | Add age/clothing/distinguishing features; anchor to a reference image if available; append a positive consistency phrase |
| Stiff / generated-looking motion | No physics descriptors, action verbs too generic | Add motion physics (parallax, motion blur, debris, weight); replace generic verb with mechanical specifics |
| Ignored timing windows | Shot blocks merged into prose, overlapping windows | Enforce blank-line separation; verify windows are continuous and non-overlapping |
| Action blending (multiple verbs collapse into one mush) | Stacked verbs in one shot | Split into separate timed beats, one primary action verb per shot |
| Constraints ignored | Using "no X" phrasing | Rewrite as positive "stable / consistent / natural" phrasing |
| Character switches identity across shots | Pronouns instead of role names | Replace every pronoun with role descriptor |
| Audio desync / dialogue not lip-synced | Dialogue floating outside a shot block | Embed dialogue inside the shot block where the speaking happens, with explicit tone descriptor |
| Style mismatch / generic look | Vague style adjectives | Swap for one specific anchor (film, director, photographer, era) |
| Lighting feels artificial / floating | No source named | Name the practical source (window, neon sign, fire, overhead floodlight) and motivate every shift |
| Prompt being ignored / partial output | Too many elements, prompt too long | Trim to single style anchor + tight constraints; cut redundant adjectives; aim for 50–150 words |
| Prompt rejected / silently filtered | Blocked vocabulary or visual pattern | Run through the Vocabulary Substitution Bank in §15d; push the prompt one step along the Stylization Distance lever; let camera/lighting carry the drama instead of action verbs |

### 16b. Diagnostic Decision Tree

Walk this in order after viewing the result:

1. **Did the prompt make it past the filter at all?** → No: §15d substitution bank + §15g stylization lever.
2. **Did the model honor camera mounting?** → No: more specific mount language ("rigidly bolted to," "static tripod lock-off").
3. **Did identity hold across shots?** → No: replace pronouns with role descriptors; add reference image; append positive consistency phrase.
4. **Did timing land where you wanted?** → No: enforce blank-line separation; verify windows are continuous.
5. **Did motion feel weighted?** → No: add physics descriptors (parallax, weight, momentum, debris).

### 16c. Iteration Workflow — Re-roll vs Revise

- **Re-roll if:** the prompt is structurally sound, output is one-off bad luck, and **less than 30%** of beats landed.
- **Revise if:** a specific failure mode is reproducible, the prompt has a structural defect, or **more than 30%** of beats landed (preserve what worked).
- **Second-pass template:** keep the Scene Header and any working Shot Blocks verbatim. Surgically rewrite only the broken shot. Tighten constraints. Re-run.

### 16d. Common Mistakes Table

| Mistake | Fix |
|---|---|
| Vague subject | Add specifics (age, build, wardrobe, posture) |
| Multiple actions per shot | One primary verb per shot |
| Too many characters per shot | Maximum 2 |
| Negative-phrased constraints | Positive rewrite |
| Inconsistent character across shots | Role descriptor + reference image + positive consistency phrase |
| Overly long prompt | Trim to 50–150 words |
| No quality suffix | Append the standard positive constraints block |
| Vague style | Single film/director/photographer/era anchor |
| Blocked vocabulary | Run through §15d substitution bank |

---

## Proven Prompt Templates

Before writing any prompt, consult `references/EXAMPLES.md`. It contains battle-tested prompt structures across many categories — object tracking, macro, vehicles, fight choreography, sports, multi-shot narrative, POV, emotional performance, fantasy/surreal, animal/wildlife — plus a set of compact templates and example prompts demonstrating the 8-element formula. Match the user's request to the closest template, study its structural patterns, and adapt the DNA to the new content.

---

## Complete Prompt Template (Full / Multi-Shot)

```
[SCENE HEADER]
[Location] at/during [time]. [Dominant light/atmosphere].

SHOT 1 — [DESCRIPTIVE LABEL] ([start]–[end]s)
[Shot type + angle + lens]. [Camera movement].
[Subject action as progression]. [Sound/physics cues].

SHOT 2 — [DESCRIPTIVE LABEL] ([start]–[end]s)
[Shot type + angle]. [Camera movement].
[Action progression]. [Sensory details].

SHOT 3 — [DESCRIPTIVE LABEL] ([start]–[end]s)
[Shot type + angle]. [Camera movement].
[Action progression + climax/payoff]. [Atmosphere].

[Positive constraints block].
```

## Complete Prompt Template (Compact / Single-Shot, 50–150 words)

```
[Subject with specifics] [primary action with physics] in [scene with atmosphere].
[Lighting source and direction]. [Camera type, angle, lens, movement]. [Style anchor].
[Positive constraints block].
```

---

## Example: Sports Action (Basketball)

```
An empty outdoor basketball court in late afternoon. Warm dusty sunlight cuts through the backboard, shallow depth of field.

SHOT 1 — THE RITUAL (0–5s)
Cinematic medium shot of a basketball player sitting on the gym floor tying his sneakers. Intense handheld camera shake, subtle micro-jitters and organic sway, imperfect framing. Natural breathing movement, raw documentary feel. Warm dusty light, immersive realism.

SHOT 2 — THE EXPLOSION (5–10s)
Extreme close-up of hands tightening white sneaker laces on a polished wooden court. Shallow depth of field, warm sunlight streaks, subtle handheld shake. As the laces pull tight, the camera suddenly whip-pans and performs a fast zoom toward the background with aggressive focus pull. The basketball player bursts into frame, accelerating toward the hoop and executing a powerful slam dunk. The rim rattles, net snaps, dust particles and light beams burst around the moment. Dynamic motion blur, raw energy, cinematic timing, dramatic sports film style.

Realistic biomechanics, grounded inertia, continuous motion at natural speed, maintain face and clothing consistency, character face stable without deformation, cinematic sports realism, natural lighting, 24fps.
```

## Example: Vehicle Commercial (Multi-Shot Montage)

```
A mountain hairpin road in golden late-afternoon light. Turbo whistles and tire screams fill the air.

SHOT 1 — THE DRIFT (0–2s)
Wide shot of the red sports coupe sliding sideways through the sunlit mountain turn. Camera low and tracking alongside at wheel level. Drift smoke plume trailing, turbo spool and tire squeal build. Rocky cliff and tunnel mouth visible in background.

SHOT 2 — THE DRIVER (2–4s)
Medium shot inside the cockpit showing the driver from chest up, both hands controlling the steering wheel. Camera slow push-in from passenger side. Warm rim light across his jaw, engine note rising, intense concentration.

SHOT 3 — THE EYES (4–6s)
Extreme close-up of the driver's eyes, pupils fixed. Reflections of the curving road and guardrail in his iris. Camera micro-push with shallow depth. Heartbeat-thump sound layered under turbo whistle for tension.

SHOT 4 — THE SHIFT (6–8s)
Close-up of the driver's right hand slamming the short-throw gearbox. Knuckles tightening on the metal knob as he abruptly shifts gears. Camera whip pan with the motion. Metallic gear crunch, loud turbo whoosh synchronized on shift.

SHOT 5 — THE REVEAL (8–10s)
Wide crane shot of the red sports coupe powering out of the corner in a controlled, smoke-filled drift. Camera rises and arcs to reveal skid marks on asphalt. Full-throttle turbo blast and ringing engine note lead to a rapid logo reveal overlay of the campaign tagline.

Physically accurate vehicle dynamics, intact body geometry, correct wheel count and placement, grounded weight and momentum, realistic surface reflections, montage multi-shot Hollywood movie quality, filmic contrast, natural color grading, professional cinema quality, 24fps.
```

## Example: Cinematic Racing (Image-to-Video)

```
Use the provided image as the exact opening visual reference. Cinematic racing video, duration 8–12 seconds.

SHOT 1 — ONBOARD GRIP (0–2s)
Camera rigidly mounted to the race car chassis, identical angle and position as the reference image. Low, centered nose-mounted camera, wide-angle lens (16–24mm). The car enters the pit lane at speed, decelerating hard. Track lines and pit lane markings streak past with motion blur. Subtle mechanical vibration only.

SHOT 2 — PIT ENTRY IMPACT CUT (2–3s)
Hard cut to front three-quarter low angle as the car snaps into its pit box. Brakes glow faintly, tires squeal, pit crew already in motion. Sound peaks: engine downshift, air guns spinning up.

SHOT 3 — RAPID PIT STOP MONTAGE (3–7s)
Fast, aggressive editing at natural speed.
Extreme close-up: pneumatic impact wrench engages the lug nut, sparks and vibration.
Macro shot: tire comes off, rubber dust and heat shimmer visible.
Low side angle: fresh tire fitted, mechanic's gloved hands blur with speed.
Top-down micro shot: jack lifts the car, carbon fiber flexing slightly.
Wide pit crew shot: all four corners moving in perfect sync.
Camera styles vary: macro, ultra-low, shoulder-height pit wall, whip pans between actions. Lighting is harsh pit-lane daylight, high contrast, realistic shadows.

SHOT 4 — RELEASE (7–9s)
Close-up on front jack dropping. Lollipop man or signal light snaps green. Engine revs spike.

SHOT 5 — EXIT & FINAL CAMERA (9–12s)
Cut to static low rear-angle camera, placed near the ground in the pit lane. The car launches forward, blasting past the camera. Rear diffuser, spinning tires, heat distortion visible. The car drives away into the track, shrinking into the distance. Camera remains fixed, watching the car exit frame.

Physically accurate vehicle dynamics, intact body geometry, grounded weight and momentum, realistic crash physics, cinematic lens behavior, filmic contrast, natural color grading, professional cinema quality, 24fps.
```

## Example: Nature/Wildlife (Single Continuous)

```
Dense forest canopy in bright midday light. Dappled sunlight flickers through branches.

SHOT 1 — THE HUNT (0–5s)
Head-tracking flight shot of a peregrine falcon. Camera locked to the bird's head at a close ultra-wide angle (same angle throughout). The falcon flies forward, weaving around trees and branches. Clean precise tracking keeps the head centered, wings visible at the edges. Dappled sunlight, wind noise, feather flutter.

SHOT 2 — THE DIVE (5–10s)
Continuation on same tracking angle. After the midpoint, the falcon suddenly accelerates and dives toward prey below. Sharp forward surge, controlled bank, rapid closing distance. Strong motion blur on background, parallax with trees and terrain intensifying.

Cinematic wildlife realism, continuous motion at natural speed, natural lighting, realistic flight physics, stable framing, 24fps.
```

## Example: Action Sequence (Multi-Shot)

```
A destroyed urban skyline at golden hour. Warm dusty sunlight, debris and smoke drifting through the air.

SHOT 1 — THE LAUNCH (0–2s)
Wide shot, over-the-shoulder behind the jumper launching off a crumbled rooftop. Camera dollies back and cranes up slightly. Warm dusty sunlight, skyscraper canyon, debris whooshes past. Heavy handheld camera shake during the concussive bloom.

SHOT 2 — THE APPROACH (2–4s)
Medium side profile of the jumper mid-air as a vintage car spins into frame with its door open. Camera tracks in smoothly on a gimbal. Time stretches, debris suspended in slow rolling motion, steady framing to read the approach.

SHOT 3 — THE GRAB (4–6s)
Close-up on the jumper's hand making contact with the car door handle and scraping metal. Camera pushes in with rapid micro-shake on contact. Shallow depth of field, dust and glass flecks, metallic groan implied.

Realistic biomechanics, grounded inertia, physically accurate dynamics, filmic contrast, natural color grading, cinematic realism, professional cinema quality, 24fps.
```

## Example: POV Immersion (Race Car)

```
Interior of a race car cockpit at night. Packed oval speedway under bright floodlights. Engine vibration transmitted into camera.

SHOT 1 — FULL SPEED (0–4s)
Ultra-realistic first-person POV, camera behaves like the driver's head inside a helmet. Aggressive handheld movement, natural human micro-jitters, fast reactive head turns left and right. Interior cockpit visible with roll cage edges, windshield frame and dashboard silhouettes. Heavy breathing inside helmet causing subtle rhythmic image blur and slight fogging on glass. Multiple race cars ahead moving at high velocity, intense motion parallax and wind distortion.

SHOT 2 — THE IMPACT (4–8s)
Sudden concussive bloom directly ahead. Cars losing traction, spinning, debris and sparks filling the frame. Camera reacts instinctively with sharp head movements searching for a gap. The car narrowly weaves through the chaos at full speed. One motionless vehicle launches upward and passes directly overhead.

SHOT 3 — TIME FREEZE (8–11s)
Time drops into extreme slow motion. Camera tilts sharply upward following the airborne car, looking into the sky as it rotates above illuminated by stadium lights. Floating debris and sparks suspended in slow motion. Heartbeat and breathing implied through visual shake.

SHOT 4 — SNAP BACK (11–15s)
Time ramps smoothly back to natural speed. Camera snaps forward to the track again. Speed surges, focus locks back onto racing line, motion blur and vibration intensify. The car continues through the aftermath into clear track ahead.

Physically accurate vehicle dynamics, realistic impact physics, cinematic lens behavior, filmic contrast, natural color grading, immersive adrenaline-filled realism, continuous motion within shots, professional cinema quality, 24fps.
```

## Example: Compact Single-Shot (Product, ~80 words)

```
A matte-black ceramic coffee mug on a weathered oak table, steam curling upward in slow ribbons, morning sunlight raking across the rim from a kitchen window at frame-left, hard rim light catching the steam. Static medium close-up, 85mm lens, shallow depth of field, soft bokeh of a window frame in background. Warm Scandinavian editorial style, fine grain, low-saturation palette.

Stable picture, stable background, realistic surface reflections, natural and smooth steam motion, pure visual narrative without subtitles, cinematic realism, 24fps.
```

## Example: Compact Character Portrait (~100 words)

```
A late-30s woman with copper-red hair pulled back, weathered tan leather jacket, sitting on the tailgate of an old pickup truck at dusk. She slowly turns her head toward the camera, the desert wind catching loose strands of hair across her cheek. Golden hour from camera-left, hard sun rim across her shoulder, soft fill from open sky. Static medium close-up on a 50mm lens, slow gentle push-in over five seconds. Documentary photographic style, muted earth tones, subtle film grain.

Maintain face and clothing consistency, character face stable without deformation, natural skin texture, natural and smooth movements, stable picture, cinematic realism, 24fps.
```
