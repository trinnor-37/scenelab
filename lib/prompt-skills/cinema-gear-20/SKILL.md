---
name: cinema-gear-20
description: Translate creative intent into precise Higgsfield Cinema Studio 2 gear configurations (camera, lens, focal length, aperture). Use when users describe a mood, scene, genre, or visual style and need the optimal Higgsfield gear stack. Works as the cinematography decision layer that feeds into video generation skills (Veo 3.1, Seedance, Sora2, Kling, MiniMax Hailuo), image prompting (cinematic-image-prompting), and creative director workflows (ai-creative-director). Also use when users mention "Higgsfield", "Cinema Studio 2", "gear selection", "camera choice", or need cinematic look development for AI-generated content.
---

# Higgsfield Cinema Studio 2 — Gear Selection Skill

## Purpose

Act as a **virtual Director of Photography** that translates creative intent (mood, genre, scene type, brand feel) into precise Higgsfield Cinema Studio 2 gear configurations. This skill is the **cinematography decision layer** — it sits between creative direction and prompt generation, ensuring every AI-generated shot has intentional, professional-grade visual language.

## Core Principle

> Cinema = controlled physics. Every gear choice controls a feeling.

Never recommend gear in isolation. Always map: **Emotion → Physics → Gear Stack → Prompt Language**.

## Trigger Phrases

- "What Higgsfield gear should I use for [scene/mood]?"
- "Set up a cinematic look for [project type]"
- "I need a gear stack for [genre/aesthetic]"
- "Which camera and lens for [use case]?"
- "Build me a Higgsfield configuration"
- "Cinematography setup for [brand/product/narrative]"
- Any request involving Higgsfield Cinema Studio 2 settings
- Any scene description that needs cinematic look development

---

## Integration Map — How This Skill Connects

```
USER INTENT (mood/genre/scene)
        │
        ▼
┌─────────────────────────────┐
│  THIS SKILL                 │
│  Higgsfield Gear Selection  │
│  → Camera + Lens + Focal    │
│    Length + Aperture         │
│  → Prompt-ready descriptors │
└─────────┬───────────────────┘
          │
          ▼ outputs feed into:
┌─────────────────────────────────────────────────┐
│  DOWNSTREAM SKILLS                              │
│                                                 │
│  • ai-creative-director → storyboard shots      │
│  • cinematic-image-prompting → I2V source imgs  │
│  • veo3-1-prompt-generation → Veo video prompts │
│  • seedance-15-pro-prompt-generation → Seedance │
│  • kling-3-0-prompt-generation → Kling prompts  │
│  • sora2-prompt-generation → Sora2 prompts      │
│  • minimax-hailuo-23-prompting → Hailuo prompts │
│  • kling-image-to-video → Kling I2V             │
│  • viral-shorts-script-v2 → shot-level visuals  │
│  • json-prompt-builder → structured JSON output │
└─────────────────────────────────────────────────┘
```

**Key Integration Rule:** When this skill outputs a gear stack, it MUST also output **prompt-ready language** — a natural-language cinematography descriptor block that downstream skills can directly inject into their prompts without translation.

---

## Gear Database

### CAMERAS (6 options)

| # | Camera | Signature | Feels Like | Best For |
|---|--------|-----------|------------|----------|
| 1 | **Modular 8K Digital** | Clean. Precise. Commercial. | High-end brand films, tech commercials, crisp YouTube studio content | Ultra clarity, product shots, clean lighting, controlled environments |
| 2 | **Full-Frame Cine Digital** | Modern cinematic standard. | Streaming platform drama, prestige TV, cinematic but clean | Realism with polish, dialogue scenes, controlled narrative projects. **Safest cinematic default.** |
| 3 | **Studio Digital S35** | Classic cinema framing. Slightly tighter feel. | Mid-budget features, indie drama, studio-driven scenes | Slightly more compression, close character work, less exaggerated wide shots |
| 4 | **Grand Format 70mm Film** | Huge. Epic. Monumental. | Historical epics, sweeping landscapes, large-scale drama | Wide environments, hero shots, big emotional stakes |
| 5 | **Classic 16mm Film** | Raw. Textured. Human. | Documentary, flashbacks, memory sequences, indie coming-of-age | Grain, imperfection, emotional realism. Also excellent for horror. |
| 6 | **Premium Large Format (Film Variants)** | Cinematic statement cameras. | Premium auteur aesthetic | Depth, strong subject separation, premium aesthetic. Pairs beautifully with anamorphic lenses. |

### LENSES (10 options)

#### Spherical Lenses (more neutral, natural perspective)

| Lens | Signature | Best For |
|------|-----------|----------|
| **Creative Tilt Lens** | Selective focus plane. Dreamlike. Surreal. | Psychological scenes, stylized moments, subtle unease |
| **70s Cinema Prime** | Slight softness. Gentle contrast. Subtle nostalgia. | Dialogue, romantic scenes, warm drama |
| **Premium Modern Prime** | Clean. Neutral. True-to-life. **Safe default.** | Any scene needing accuracy without personality override |
| **Warm Cinema Prime** | Slight warmth. Skin-friendly tones. Emotional softness. | Intimate scenes, romantic tones |
| **Swirl Bokeh Portrait** | Artistic background distortion. Stylized blur. | Visual personality, character isolation, expressive close-ups |
| **Vintage Prime** | Lower contrast. Slight glow. Old cinema energy. | Flashbacks, period pieces |
| **Clinical Sharp Prime** | Extremely sharp. High contrast. Crisp edges. | Action, sci-fi, hyperreal aesthetic |

#### Anamorphic Lenses (wider feel, horizontal stretch, cinematic flares, more dramatic presence)

| Lens | Signature | Best For |
|------|-----------|----------|
| **Compact Anamorphic** | Controlled stretch. Modern cinematic feel. | Action, dialogue in wide settings |
| **Classic Anamorphic** | Strong flares. Cinematic distortion. Slight softness. | Instant "movie" energy |
| **Halation Diffusion** | Bloom in highlights. Glowy edges. Dreamy aesthetic. | Romantic scenes, memory sequences, sunset shots |

### FOCAL LENGTH (4 ranges)

| Range | Character | Best For |
|-------|-----------|----------|
| **8–14mm** | Very wide. Distortion. Environmental storytelling. | Horror, isolation, scale exaggeration, chaos |
| **24–35mm** | Natural cinematic wide. **Most versatile range.** | Dialogue, two-shots, balanced framing |
| **50mm** | Classic human perspective. **Safest narrative choice.** | Intimate scenes, character-driven shots, emotional moments |
| **85mm+** | Compression. Background melts. | Portraits, isolation, dramatic tension |

### APERTURE (3 ranges)

| Range | Depth Effect | Best For |
|-------|-------------|----------|
| **f/1.4 – f/2** | Shallow. Blurry background. Cinematic separation. | Character focus, emotional intensity, stylized moments |
| **f/4 – f/5.6** | Balanced. More environment visible. | Dialogue scenes, realistic tone |
| **f/8 – f/11** | Everything sharp. Maximum clarity. | Landscapes, epic wide shots, action scenes |

---

## Decision Engine — Scene-to-Gear Mapping

When the user describes a scene, mood, or project type, use this decision flow:

### Step 1: Identify the Emotional Core

Ask (or infer): What feeling should the viewer experience?

Map to one of these archetypes:
- **Clean/Premium** → commercial precision
- **Cinematic/Narrative** → polished storytelling
- **Raw/Human** → textured authenticity
- **Epic/Monumental** → scale and grandeur
- **Dreamlike/Nostalgic** → soft, emotional warmth
- **Tense/Psychological** → unease, isolation
- **Hyperreal/Sharp** → crisp, futuristic edge

### Step 2: Apply the Gear Matrix

| Emotional Core | Camera | Lens | Focal Length | Aperture |
|---------------|--------|------|-------------|----------|
| Clean/Premium | Modular 8K Digital | Premium Modern Prime | 24–35mm | f/4–f/5.6 |
| Cinematic/Narrative | Full-Frame Cine Digital | Compact Anamorphic | 24–35mm | f/2–f/4 |
| Raw/Human | Classic 16mm Film | 70s Cinema Prime | 50mm | f/1.4–f/2 |
| Epic/Monumental | Grand Format 70mm Film | Classic Anamorphic | 24–35mm | f/8–f/11 |
| Dreamlike/Nostalgic | Premium Large Format | Halation Diffusion | 50mm | f/1.4–f/2 |
| Tense/Psychological | Studio Digital S35 | Creative Tilt Lens | 8–14mm | f/1.4–f/2 |
| Hyperreal/Sharp | Modular 8K Digital | Clinical Sharp Prime | 85mm+ | f/4–f/5.6 |

**These are starting points.** Always adjust based on specific scene requirements. Mix and match — a horror scene might use 16mm + Creative Tilt + 8mm + f/1.4 for maximum unease.

### Step 3: Generate Prompt-Ready Descriptors

Convert gear selections into natural language that downstream skills can inject directly.

---

## Output Format

Every gear recommendation MUST include these two deliverables:

### Deliverable 1: Gear Stack Card

```
═══════════════════════════════════════
  HIGGSFIELD CINEMA STUDIO 2 — GEAR STACK
  Scene: [scene description]
  Mood: [emotional core]
═══════════════════════════════════════
  📷 Camera:    [selection + why]
  🔍 Lens:      [selection + why]
  📏 Focal:     [selection + why]
  🔆 Aperture:  [selection + why]
═══════════════════════════════════════
```

### Deliverable 2: Prompt-Ready Cinematography Block

A natural-language paragraph that any downstream video/image generation skill can paste directly into a prompt. This is the critical integration output.

**Format:**
```
[CINEMATOGRAPHY]
Shot on [camera], [lens] lens at [focal length], [aperture]. [Visual character description — what this combination produces: grain quality, bokeh style, flare behavior, contrast feel, color temperature, depth of field behavior]. [Emotional descriptor — what the viewer feels].
```

**Example:**
```
[CINEMATOGRAPHY]
Shot on Classic 16mm Film, 70s Cinema Prime lens at 50mm, f/1.4. Organic film grain with gentle halation around highlights. Warm, slightly desaturated tones with soft contrast rolloff. Shallow depth of field isolates the subject against a creamy, painterly background blur. The image breathes with analog imperfection — intimate, nostalgic, deeply human.
```

---

## Genre/Use Case Quick-Reference Presets

### Commercial / Product / Brand

| Use Case | Camera | Lens | Focal | Aperture |
|----------|--------|------|-------|----------|
| Luxury product hero shot | Modular 8K | Premium Modern Prime | 85mm+ | f/2 |
| Tech product launch | Modular 8K | Clinical Sharp Prime | 50mm | f/4 |
| Beauty / skincare | Full-Frame Cine | Warm Cinema Prime | 85mm+ | f/1.4 |
| Automotive | Grand Format 70mm | Classic Anamorphic | 24–35mm | f/5.6 |
| Food / beverage | Full-Frame Cine | Premium Modern Prime | 50mm | f/2 |
| Fashion editorial | Premium Large Format | Classic Anamorphic | 50mm | f/2 |

### Narrative / Film / Drama

| Use Case | Camera | Lens | Focal | Aperture |
|----------|--------|------|-------|----------|
| Dialogue scene | Full-Frame Cine | Compact Anamorphic | 50mm | f/2–f/4 |
| Action sequence | Studio Digital S35 | Clinical Sharp Prime | 24–35mm | f/5.6–f/8 |
| Romance / intimacy | Full-Frame Cine | Warm Cinema Prime | 85mm+ | f/1.4 |
| Horror / tension | Classic 16mm | Creative Tilt Lens | 8–14mm | f/1.4 |
| Flashback / memory | Classic 16mm | Vintage Prime | 50mm | f/1.4 |
| Epic establishing shot | Grand Format 70mm | Classic Anamorphic | 24–35mm | f/8–f/11 |
| Psychological thriller | Studio Digital S35 | Creative Tilt Lens | 50mm | f/2 |

### Social Media / UGC / Ads

| Use Case | Camera | Lens | Focal | Aperture |
|----------|--------|------|-------|----------|
| UGC-style ad (authentic) | Classic 16mm | 70s Cinema Prime | 50mm | f/2 |
| Premium brand reel | Full-Frame Cine | Compact Anamorphic | 35mm | f/2 |
| Talking head / creator | Full-Frame Cine | Premium Modern Prime | 50mm | f/2 |
| Lifestyle / aspirational | Premium Large Format | Halation Diffusion | 50mm | f/1.4 |
| Product demo | Modular 8K | Premium Modern Prime | 50mm | f/4 |

---

## Multi-Shot Consistency Rules

When building a storyboard or multi-shot sequence (common with ai-creative-director and viral-shorts-script-v2):

1. **Lock the camera** across a sequence unless there's a narrative reason to shift (e.g., flashback = switch to 16mm)
2. **Lens can shift** between shots for dramatic effect (e.g., wide establishing → tight portrait)
3. **Aperture can breathe** — opening up for emotional peaks, closing down for action clarity
4. **Focal length drives the cut rhythm** — wider = establishing, tighter = reaction/emotion

### Transition Gear Shifts (Storytelling Technique)

| Narrative Beat | Gear Shift |
|---------------|------------|
| Present → Flashback | Any camera → Classic 16mm Film + Vintage Prime |
| Calm → Tension | Open aperture → Shift to wider focal + Creative Tilt |
| Reality → Dream | Any lens → Halation Diffusion + f/1.4 |
| Intimate → Epic | 85mm f/1.4 → Cut to 24mm f/8 Grand Format |
| Control → Chaos | Premium Modern Prime → Creative Tilt + 8mm |

---

## Downstream Skill Injection Guide

### For cinematic-image-prompting

Insert the `[CINEMATOGRAPHY]` block into the **Style/medium** and **Lighting** layers of the image prompt. The gear descriptors replace generic cinematography language.

### For ai-creative-director

Use the Gear Stack Card per shot in the storyboard. The `[CINEMATOGRAPHY]` block goes into each shot's visual description. Use Multi-Shot Consistency Rules for sequence coherence.

### For veo3-1-prompt-generation / seedance-15-pro / kling-3-0 / sora2 / minimax-hailuo-23

Inject the `[CINEMATOGRAPHY]` block at the start of the video prompt, before action/movement description. These models respond well to physical camera descriptors — they influence grain, DOF, color response, and flare rendering in the generated output.

### For kling-image-to-video

Use the gear stack to inform the source image prompt (via cinematic-image-prompting), then carry the same cinematography language into the motion prompt for visual consistency.

### For viral-shorts-script-v2

Attach a Gear Stack Card to each shot in the script. The gear shifts across shots become part of the storytelling rhythm — use Transition Gear Shifts to amplify narrative beats.

### For json-prompt-builder

Map gear selections to the structured JSON schema:
```json
{
  "cinematography": {
    "camera": "Full-Frame Cine Digital",
    "lens": "Compact Anamorphic",
    "focal_length": "35mm",
    "aperture": "f/2",
    "look": "Modern cinematic with controlled anamorphic stretch. Clean bokeh with subtle horizontal flares. Balanced depth — subject sharp, environment softly present."
  }
}
```

---

## Advanced: Combining Gear for Signature Looks

### "The Nolan" — Epic + Intimate
- Grand Format 70mm + Classic Anamorphic + 24mm + f/8 (wide establishing)
- Cut to: Same camera + Warm Cinema Prime + 85mm + f/1.4 (character close-up)

### "The A24" — Raw + Intentional
- Classic 16mm + 70s Cinema Prime + 50mm + f/2
- Grain forward, warm contrast, imperfect but deeply controlled

### "The Apple Ad" — Clean + Emotional
- Modular 8K + Premium Modern Prime + 85mm + f/2
- Ultra clean with shallow depth — product floating in perfect space

### "The Villeneuve" — Scale + Tension
- Grand Format 70mm + Clinical Sharp Prime + 24mm + f/5.6
- Vast environments with razor precision — beautiful but unsettling

### "The Wong Kar-wai" — Memory + Mood
- Premium Large Format + Halation Diffusion + 50mm + f/1.4
- Bloom, warmth, romantic imperfection, time suspended

---

## Workflow Summary

```
1. USER describes scene/mood/project
2. THIS SKILL maps intent → Gear Stack + Prompt-Ready Block
3. USER (or Claude) feeds output into downstream generation skill
4. DOWNSTREAM SKILL uses cinematography language in final prompt
5. AI generates visually intentional content
```

Every shot should feel like a decision, not an accident.
