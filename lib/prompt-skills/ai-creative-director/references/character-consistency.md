# Character Consistency Guide

Advanced techniques for maintaining character consistency across multiple AI-generated shots.

---

## The Consistency Challenge

Current AI image/video models generate each shot independently. Without explicit guidance, the same "character" can appear with:
- Different facial features
- Changed hair color/style
- Altered clothing
- Inconsistent body type
- Varying skin tone

**Goal:** Create prompts that maximize character consistency across all shots in a storyboard.

---

## Core Techniques

### Technique 1: Character Anchor System

Create a detailed character description and reference it in every shot.

**Step 1: Define the Character Anchor**

```
CHARACTER ANCHOR:
- Age: Mid-30s
- Gender: Woman
- Ethnicity: East Asian
- Build: Slim, athletic
- Height impression: Average
- Hair: Shoulder-length black hair, subtle waves, side part
- Skin: Light olive complexion
- Face: Oval face, defined cheekbones, warm brown eyes
- Clothing: Cream cable-knit sweater, high-waisted dark jeans, white sneakers
- Accessories: Small gold hoop earrings, delicate gold necklace, simple watch
- Expression default: Confident, approachable
```

**Step 2: Reference in Every Shot**

```
Shot 1: [Full character anchor description], standing in modern kitchen, 
morning light through window, reaching for coffee mug...

Shot 2: The same mid-30s East Asian woman with shoulder-length black wavy 
hair, cream cable-knit sweater, now sitting at kitchen table...

Shot 3: The same woman (cream sweater, gold hoops, black wavy hair), 
now walking toward front door...
```

### Technique 2: Repetition of Key Identifiers

Choose 3-5 "sticky" visual identifiers and repeat them verbatim in every prompt:

**High-Consistency Identifiers:**
| Element | Why It Works | Example |
|---------|--------------|---------|
| **Hair color + style** | Highly distinctive | "auburn hair in loose bun" |
| **Distinctive clothing** | Visible, memorable | "oversized denim jacket" |
| **Accessories** | Unique markers | "round tortoiseshell glasses" |
| **Skin tone** | Consistent baseline | "warm brown skin" |
| **Age indicator** | Anchors appearance | "late-20s" |

**Low-Consistency Identifiers (Avoid relying on):**
| Element | Why It Fails |
|---------|--------------|
| Exact facial features | Models struggle with precise faces |
| Specific tattoos | Often rendered differently |
| Complex patterns | Interpreted variably |
| Precise body proportions | Inconsistent rendering |

### Technique 3: Reference Frame Method

Generate a "hero shot" first, then reference it for subsequent shots.

**Workflow:**

```
SHOT 1 (Hero/Reference):
A young professional woman, late-20s, with warm brown skin, natural 
curly black hair pulled back in a high puff, wearing a fitted burgundy 
blazer over white blouse, confident expression, standing in modern 
office lobby. Cinematic, realistic, high detail. 
[THIS IS THE REFERENCE FRAME]

SHOT 2:
The exact same woman from Shot 1 (late-20s, brown skin, curly black 
hair in high puff, burgundy blazer, white blouse), now sitting at a 
glass desk, typing on laptop, focused expression...

SHOT 3:
The exact same woman from Shot 1 (burgundy blazer, curly black hair 
puff, brown skin), now standing at whiteboard, gesturing while 
explaining, engaged expression...
```

### Technique 4: Negative Consistency Prompts

Explicitly state what should NOT change:

```
...the same woman, maintaining consistent:
- Hair color and style (black wavy, shoulder-length)
- Skin tone (light olive)
- Clothing (cream sweater, dark jeans)
- Accessories (gold hoops, delicate necklace)
Do not change her appearance, facial features, or outfit.
```

---

## Platform-Specific Consistency Methods

### For Seedream 4.0 (Best for Consistency)

Use reference-based generation:

1. **Generate hero image** with full character description
2. **Upload as reference** for subsequent shots
3. **In prompt:** "Using the reference image for character appearance..."

See: `/mnt/skills/user/seedream4-prompt-generation/SKILL.md`

### For Veo 3.1

Use "Ingredients to Video" workflow:

1. Generate character reference images first
2. Upload as "ingredients"
3. Prompt references the provided character images

See: `/mnt/skills/user/veo3-1-prompt-generation/SKILL.md`

### For Kling (Image-to-Video)

Animate from consistent source images:

1. Generate static character images with consistent prompts
2. Use image-to-video to add motion
3. Character consistency comes from source images

See: `/mnt/skills/user/kling-image-to-video/SKILL.md`

### For Sora2 / MiniMax Hailuo

Rely on detailed prompting:

1. Use Character Anchor System (Technique 1)
2. Repeat key identifiers in every shot
3. Keep same lighting/environment when possible

See respective skill files for platform-specific guidance.

---

## Character Description Templates

### Template A: Full Professional Description

```
CHARACTER: [Name/Role]
Demographics: [Age range], [gender], [ethnicity/skin tone]
Build: [Body type], [height impression]
Hair: [Color], [length], [style], [texture]
Face: [Shape], [notable features], [eye color]
Clothing: [Top], [bottom], [shoes]
Accessories: [Jewelry], [glasses], [watch], [bag]
Default expression: [Emotional baseline]
Distinguishing features: [Unique elements]
```

### Template B: Quick Reference (3-5 Elements)

```
CHARACTER: [Role]
Key identifiers: [Hair], [Skin], [Main clothing item], [Accessory], [Build]
```

**Example:**
```
CHARACTER: Fitness Coach
Key identifiers: Blonde ponytail, tan skin, neon pink sports bra, 
Apple Watch, athletic build
```

### Template C: Relative Description (For Multiple Characters)

```
CHARACTER A (Primary): [Full description]
CHARACTER B (Secondary): [Differentiated from A]
- Different from A: [Hair color], [clothing color], [build]
- Same as A: [Setting-appropriate style], [similar age range]
```

---

## Clothing Consistency Strategies

### The "Signature Piece" Method

Choose ONE highly distinctive clothing item that appears in every shot:

| Signature Type | Example | Why It Works |
|----------------|---------|--------------|
| **Color** | "Bright red jacket" | High visibility, memorable |
| **Pattern** | "Black and white striped shirt" | Distinctive, recognizable |
| **Style** | "Oversized vintage denim jacket" | Unique silhouette |
| **Logo/Graphic** | "Plain white tee with small chest logo" | Keep simple for AI |

### Color Palette Anchoring

Define a consistent color palette:

```
CHARACTER PALETTE:
- Primary: Cream/off-white (sweaters, blouses)
- Secondary: Dark navy (jeans, jackets)
- Accent: Gold (jewelry, buttons)
- Avoid: Bright colors, busy patterns
```

### Environment-Appropriate Consistency

If character moves between settings, keep consistency realistic:

```
OFFICE SHOTS: Navy blazer, white shirt, dark trousers, leather shoes
HOME SHOTS: Same navy blazer over white tee, dark jeans, barefoot
OUTDOOR SHOTS: Navy blazer, white tee, jeans, white sneakers

Consistent elements: Navy blazer, white top base, gold watch
```

---

## Multi-Character Consistency

### Differentiation Strategy

When multiple characters appear, make them visually distinct:

| Character | Hair | Clothing Color | Build | Accessory |
|-----------|------|----------------|-------|-----------|
| **A (Primary)** | Dark, long | Warm tones (cream, rust) | Slim | Gold jewelry |
| **B (Secondary)** | Light, short | Cool tones (blue, gray) | Athletic | Silver watch |

### Pairing Descriptions

When characters appear together:

```
Shot with both characters: 
Character A (dark-haired woman in cream sweater, gold hoops) stands 
next to Character B (blonde man in blue button-down, silver watch). 
They face each other in conversation...
```

---

## Troubleshooting Common Issues

### Issue: Face Changes Between Shots

**Causes:**
- Relying on facial feature descriptions
- Different angles/lighting

**Fixes:**
- Focus on hair, clothing, accessories instead
- Keep lighting consistent across shots
- Use similar angles when possible

### Issue: Clothing Color Drift

**Causes:**
- Using generic color terms
- Lighting changes affecting perception

**Fixes:**
- Use specific color descriptions: "cream off-white" not "white"
- Include material: "navy blue wool blazer" not "blue jacket"
- Repeat exact color words in every prompt

### Issue: Body Type Inconsistency

**Causes:**
- Vague build descriptions
- Different poses

**Fixes:**
- Be specific: "slim, athletic build" not "fit"
- Include height context: "tall woman" or "petite frame"
- Mention posture: "stands with confident posture"

### Issue: Hair Changes

**Causes:**
- Hair is highly variable in AI generation
- Style descriptions are interpreted loosely

**Fixes:**
- Use specific, unique hair descriptions
- Include length, color, texture, style in every prompt
- "Shoulder-length auburn hair with subtle waves, center part"

### Issue: Accessories Disappear

**Causes:**
- Accessories mentioned once but forgotten
- Model prioritizes other elements

**Fixes:**
- Repeat accessories in every prompt
- Make accessories distinctive and simple
- "Always wearing gold hoop earrings and delicate chain necklace"

---

## Quality Checklist

Before generating images, verify:

- [ ] **Character anchor** defined with 5+ key identifiers
- [ ] **Same hair description** in every shot prompt
- [ ] **Same skin tone** specified consistently  
- [ ] **Same clothing items** repeated verbatim
- [ ] **Same accessories** mentioned in each shot
- [ ] **Age/build** referenced consistently
- [ ] **Lighting** kept similar when possible
- [ ] **Reference frame** established for complex sequences

---

## Example: Full Storyboard with Consistency

**CHARACTER ANCHOR:**
```
Mid-30s professional woman, warm brown skin, natural curly black hair 
in a high bun, wearing an oversized sage green cardigan over white tee, 
high-waisted light jeans, small gold stud earrings, warm confident smile
```

**SHOT PROMPTS:**

```
Shot 1:
A mid-30s professional woman with warm brown skin, natural curly black 
hair in a high bun, wearing an oversized sage green cardigan over white 
tee, high-waisted light jeans, small gold stud earrings. She sits on a 
gray couch, looking frustrated at her laptop, soft afternoon light from 
window. Cinematic, realistic.

Shot 2:
The same mid-30s woman (brown skin, curly black hair in high bun, sage 
green cardigan, white tee, gold studs). She suddenly looks up from 
laptop with a surprised, hopeful expression. Same gray couch, same soft 
afternoon light. Cinematic, realistic.

Shot 3:
The same woman (sage green cardigan, curly hair bun, gold studs, brown 
skin). Now standing in a modern kitchen, smiling warmly while holding a 
coffee mug with both hands. Morning light, cream-colored cabinets behind 
her. Cinematic, realistic.

Shot 4:
The same mid-30s woman with brown skin, curly black hair bun, sage green 
cardigan, gold stud earrings. She's walking down a sunny city sidewalk, 
confident stride, slight smile, looking ahead. Urban background blurred, 
golden hour lighting. Cinematic, realistic.

Shot 5:
Close-up on the same woman's face (brown skin, curly black edges visible, 
gold studs). Warm smile, eyes looking directly at camera. Soft, flattering 
light. Cinematic portrait style.
```

**Consistency elements repeated in every shot:**
- "mid-30s woman"
- "warm brown skin"  
- "curly black hair in high bun"
- "sage green cardigan"
- "gold stud earrings"
