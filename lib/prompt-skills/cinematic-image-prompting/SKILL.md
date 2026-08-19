---
name: cinematic-image-prompting
description: Generate professional-grade image prompts for AI filmmaking, commercial advertising, UGC content, and product/editorial photography. Optimized for image-to-video (I2V) workflows with Kling, Veo, Sora, and Seedance.
---

# Cinematic Image Prompting Skill

## Purpose
Generate professional-grade image prompts for AI filmmaking, commercial advertising, UGC content, and product/editorial photography. Optimized for image-to-video (I2V) workflows with Kling, Veo, Sora, and Seedance.

## Trigger Phrases
- "generate image prompt for [use case]"
- "create cinematic images for [project]"
- "I need product shots for [brand]"
- "make UGC ad images"
- "storyboard images for [scene]"
- "commercial photography prompt"
- "editorial lifestyle shots"

## Core Workflow

### Step 1: Identify Use Case
Ask user to specify (or infer from context):
1. **Use case type:** filmmaking | commercial | ugc | product | editorial
2. **Subject/product:** What's the main focus?
3. **Brand aesthetic:** minimalist | luxury | tech | organic | energetic | authentic
4. **Mood:** aspirational | dramatic | calm | playful | authentic | premium
5. **Aspect ratio:** 16:9 | 9:16 | 1:1 | 2.39:1 | 4:5
6. **Target platform:** Instagram | TikTok | YouTube | Print | Web

### Step 2: Generate Prompt Structure
Use the two-layer framework:

**Layer 1: Content Parameters** (in the prompt text)
- Subject (what)
- Context/environment (where)
- Composition/camera (how framed)
- Style/medium (aesthetic)
- Lighting (quality, direction, mood)
- Mood/emotion (vibe)
- Color palette (brand colors)
- Detail level (quality descriptors)
- Text elements (if needed)

**Layer 2: Generation Parameters** (settings/flags)
- Aspect ratio
- Resolution/size
- Model selection
- Quality/steps
- Guidance/CFG
- Seed (for variations)
- Negative prompts

### Step 3: Optimize for I2V Integration
Include motion-ready elements:
- Central subject with negative space
- Directional cues (light source, eye line, wind)
- Layered depth (foreground, subject, background)
- Animatable elements (fabric, hair, particles, reflections)
- Clean backgrounds for camera movement

### Step 4: Output Format
Provide:
1. ✅ **Primary prompt** (200-300 words, optimized)
2. ✅ **Negative prompt** (50-100 words, artifact removal)
3. ✅ **Generation parameters** (aspect ratio, quality, model)
4. ✅ **I2V integration notes** (recommended animation approach)
5. ✅ **3 variations** (different angles/moods for same concept)

---

## Module 1: AI Filmmaking

**Purpose:** Storyboarding, scene development, visual references for narrative filmmaking

### Cinematography Vocabulary

**Shot Sizes:**
- Extreme wide shot (EWS) - establish location, scale
- Wide shot (WS) - show full scene, context
- Medium shot (MS) - waist up, balanced character/environment
- Close-up (CU) - face, emotion, detail
- Extreme close-up (ECU) - eyes, hands, objects (intimate detail)

**Camera Angles:**
- Eye level - neutral, conversational
- Low angle - power, dominance, hero framing
- High angle - vulnerability, overview, bird's-eye
- Dutch/canted - tension, unease, instability
- Over-the-shoulder (OTS) - dialogue, perspective

**Camera Movement Cues:**
- Static/locked-off - stability, contemplation
- "Subtle push-in" - building tension, focus
- "Tracking shot" - following action, immersion
- "Reveal" - information disclosure, surprise

**Lens Selection:**
- 16mm - distortion, intimacy, urgency
- 24mm - environmental storytelling, context
- 35mm - natural perspective, cinematic standard
- 50mm - human eye, neutral
- 85mm - portraiture, shallow DOF, beauty
- 135mm+ - compression, isolation, telephoto

**Film Stocks/Color Science:**
- "Shot on ARRI Alexa" - professional digital cinema
- "Kodak Portra 400" - warm, natural skin tones
- "Kodak Vision3 500T" - theatrical film look
- "Cinestill 800T" - tungsten, cinematic glow
- "RED Komodo 6K" - digital cinema, sharp

**Aspect Ratios:**
- 2.39:1 - Anamorphic widescreen (cinematic epic)
- 2.35:1 - Scope (traditional theatrical)
- 1.85:1 - Standard theatrical
- 16:9 - Streaming, TV, YouTube
- 4:3 - Vintage, artistic, intimate

### Filmmaking Prompt Template

```
[SHOT SIZE] [CAMERA ANGLE], [ASPECT RATIO], [SUBJECT/ACTION] in [ENVIRONMENT],
shot on [CAMERA/FILM STOCK] with [LENS], [LIGHTING DESCRIPTION],
[COLOR GRADING STYLE], [DEPTH OF FIELD], [ATMOSPHERIC ELEMENTS],
[MOOD/TONE], [COMPOSITION NOTES], [REFERENCE STYLE if relevant]

Negative: [common artifacts], overexposed, underexposed, amateur, 
distorted, low quality, blurry
```

### Examples

**Example 1: Dramatic Hero Moment**
```
Low angle medium shot, 2.39:1 anamorphic, determined entrepreneur standing 
in modern glass office overlooking city skyline at sunset, shot on ARRI Alexa 
with 35mm anamorphic lens, dramatic rim lighting from setting sun creating 
golden edge highlights, teal and orange cinematic color grading, shallow depth 
of field with bokeh city lights in background, atmospheric haze with god rays 
streaming through windows, powerful and aspirational mood, rule of thirds 
composition with subject slightly off-center, cinematic film grain, professional 
color science, hero framing

Negative: overexposed highlights, distorted face, amateur lighting, blurry, 
low resolution, noisy, watermarks, text overlays, multiple subjects
```

**Example 2: Intimate Character Moment**
```
Close-up eye level shot, 16:9, woman's face in soft contemplation looking out 
window, shot on Kodak Portra 400 with 85mm portrait lens, soft natural window 
light from camera left creating gentle shadows, warm and nostalgic color palette, 
extremely shallow depth of field with creamy bokeh, slight film grain, quiet and 
introspective mood, centered composition with negative space on right for text, 
editorial photography aesthetic, subtle vignette

Negative: harsh lighting, over-sharpened, digital noise, distorted features, 
multiple faces, cluttered background, artificial look
```

**Example 3: Establishing Wide Shot**
```
Extreme wide shot from high angle, 2.39:1, lone figure walking through vast 
minimalist concrete architecture with dramatic geometric shapes, shot on RED 
Komodo 6K with 24mm wide lens, overcast diffused natural light creating soft 
shadows, desaturated cool color palette with subtle teal tones, everything in 
sharp focus from foreground to background, misty atmospheric depth, isolated and 
contemplative mood, symmetrical composition with figure as small focal point, 
architectural photography meets cinematic storytelling, clean and minimal

Negative: cluttered, busy, distorted architecture, lens flare, chromatic aberration, 
low quality, amateur, oversaturated
```

### Storyboard Sequence Template

When generating multiple shots for a scene:

1. **Establishing Shot** - Set location, time, context (wide)
2. **Medium Shot** - Introduce character, action (medium)
3. **Close-up** - Emotion, reaction, detail (close)
4. **Insert/Detail** - Key object, product, moment (ECU)
5. **Transition Shot** - Connect to next scene (wide or motion)

Maintain consistent:
- Lighting direction (continuity)
- Color palette (visual cohesion)
- Film stock/camera (aesthetic unity)
- Mood/tone (emotional arc)

---

## Module 2: AI Ad Commercials

**Purpose:** High-end brand campaigns, luxury aesthetics, aspirational storytelling

### Premium Brand Aesthetics

**Style References:**
- **Apple** - Minimalist, clean white backgrounds, soft shadows, product-focused
- **Nike** - Dynamic, athletic, bold contrast, motivational energy
- **Luxury Fashion** - Editorial, dramatic lighting, sophisticated color palettes
- **Tech Brands** - Sleek, modern, cool tones, innovative feel
- **Wellness/Beauty** - Soft, glowing, warm, natural, premium textures

### Commercial Lighting Setups

**Key Light Patterns:**
- **Clamshell** - Top + bottom fill, beauty lighting, eliminates shadows
- **Rembrandt** - 45° key light, triangle under eye, dramatic character
- **Gradient Backdrop** - Smooth color transition, professional studio feel
- **Edge/Rim Lighting** - Backlight separating subject from background, premium look
- **Soft Diffused** - Large softbox, no harsh shadows, clean commercial aesthetic

**Background Styles:**
- Seamless white infinity curve
- Gradient (navy to gray, black to charcoal)
- Minimal architectural (concrete, glass, marble)
- Lifestyle environment (modern kitchen, bathroom, office)
- Outdoor natural (beach, forest, urban)

### Commercial Prompt Template

```
[COMPOSITION TYPE] commercial shot, [SUBJECT] in [PREMIUM ENVIRONMENT],
[LIGHTING SETUP], shot on [PROFESSIONAL CAMERA] with [LENS],
[BRAND AESTHETIC DESCRIPTOR], [COLOR GRADING], [DEPTH OF FIELD],
[ASPIRATIONAL/EMOTIONAL ELEMENT], [MOOD], [COMMERCIAL PHOTOGRAPHY STYLE],
[ASPECT RATIO], professional studio production, high-end advertising aesthetic

Negative: amateur, low budget, harsh shadows, overexposed, cluttered, 
busy background, distorted, unrealistic, low quality
```

### Examples

**Example 1: Luxury Product Hero**
```
Centered product photography, premium wireless earbuds on minimalist acrylic 
pedestal against gradient backdrop transitioning from deep navy to soft charcoal 
gray, professional studio lighting with soft key light from 45° creating subtle 
reflections on glossy surfaces, edge lighting defining product contours with 
elegant highlights, shot on Phase One XF with 80mm macro lens, Apple-style 
minimalist aesthetic, desaturated with selective teal and warm metallic accents, 
sharp focus on product with soft gradient blur on background, sophisticated and 
exclusive mood, ultra-detailed texture rendering showing premium materials, 
high-end commercial photography, 1:1 square for Instagram feed, luxury brand 
positioning, editorial quality

Negative: cheap plastic look, harsh shadows, overexposed highlights, cluttered, 
busy, multiple products, amateur lighting, low resolution, artifacts
```

**Example 2: Lifestyle Brand Story**
```
Medium shot lifestyle commercial, confident woman in modern minimalist living 
room using premium skincare product, floor-to-ceiling windows with warm morning 
sunlight streaming in creating natural rim lighting, shot on ARRI Alexa with 
50mm lens, bright and aspirational aesthetic, warm color grading with glowing 
skin tones and soft teal shadows, shallow depth of field with creamy bokeh on 
background plants and architecture, peaceful and elevated mood, shot from slightly 
low angle for aspirational perspective, subject positioned using rule of thirds 
with negative space on left for text overlay, lifestyle editorial photography 
meets high-end commercial, 16:9 for YouTube pre-roll, authentic luxury brand 
storytelling, professional production value

Negative: harsh lighting, artificial look, busy background, distorted features, 
amateur composition, low quality, grainy, cluttered
```

**Example 3: Dynamic Athletic Commercial**
```
Low angle hero shot, athletic figure mid-movement wearing premium running shoes 
in dramatic urban environment at golden hour, powerful backlighting from setting 
sun creating strong rim light and lens flare, shot on RED Komodo 6K with 24mm 
wide lens, Nike-style bold and energetic aesthetic, high contrast with crushed 
blacks and vibrant warm highlights, motion blur on background suggesting speed 
and dynamism, inspirational and powerful mood, centered hero framing with dramatic 
sky occupying top third, sports commercial photography, 9:16 vertical for 
Instagram Stories, motivational brand energy, cinematic production quality

Negative: static, boring, flat lighting, weak composition, distorted proportions, 
amateur, low energy, cluttered, overexposed sky
```

### Brand Consistency Framework

For campaign series (multiple images maintaining visual identity):

**Define once, apply consistently:**
1. **Color palette** - Primary brand colors, accent colors, skin tone rendering
2. **Lighting signature** - Consistent key light direction, shadow quality
3. **Composition style** - Centered vs rule of thirds, symmetry vs dynamic
4. **Depth of field** - Consistent bokeh quality, focus falloff
5. **Mood/tone** - Emotional through-line across all assets
6. **Environment type** - Studio vs lifestyle, minimal vs rich detail

**Variation within consistency:**
- Change camera angle/distance (wide → medium → close)
- Shift environment while maintaining aesthetic (kitchen → bathroom → living room)
- Different models/subjects with same lighting/color treatment
- Product in different contexts but consistent presentation style

---

## Module 3: AI UGC Ads

**Purpose:** Authentic, relatable, conversion-focused content that doesn't look "professional"

### UGC Authenticity Principles

**What Makes UGC Feel Real:**
- Slightly imperfect framing (not centered, cut off edges)
- Natural ambient lighting (window light, overhead, bathroom mirror)
- Real environments (messy bedroom, car interior, bathroom counter)
- Genuine expressions (not model poses, real reactions)
- Smartphone camera quality (not cinema cameras)
- Vertical format (9:16 for TikTok/Reels/Stories)
- Relatable moments (morning routine, unboxing, before/after)

**What Kills UGC Authenticity:**
- Studio lighting, professional backdrops
- Perfect composition, centered subjects
- Model-level beauty/styling
- Overly polished environments
- Wide cinematic aspect ratios
- Artificial poses or expressions
- Too many products in frame

### UGC Environment Types

**High-Converting Locations:**
- **Bathroom mirror selfie** - Skincare, makeup, hair products
- **Bedroom/bed** - Sleep products, wellness, morning routines
- **Kitchen counter** - Food, supplements, appliances
- **Car interior** - On-the-go products, commute content
- **Gym/workout space** - Fitness, athletic wear, supplements
- **Outdoor casual** - Athleisure, lifestyle, natural settings
- **Coffee shop/cafe** - Tech, productivity, lifestyle
- **Couch/living room** - Unboxing, reviews, daily use

### UGC Prompt Template

```
Vertical 9:16 casual smartphone [SHOT TYPE], [SUBJECT/PERSON] [USING/HOLDING PRODUCT]
in [REAL ENVIRONMENT], [NATURAL LIGHTING DESCRIPTION], slightly imperfect framing,
authentic UGC style, [GENUINE MOMENT/ACTION], [RELATABLE MOOD], natural skin texture,
minimal retouching, shot on iPhone/smartphone camera, [REALISTIC DETAIL],
[BACKGROUND CONTEXT], sharp focus on product, real person aesthetic, conversion-optimized

Negative: professional studio, perfect composition, model poses, artificial lighting,
polished environment, multiple products, text overlays, logos, extra limbs,
distorted hands, cartoon style, surreal
```

### Examples

**Example 1: Skincare Bathroom Mirror**
```
Vertical 9:16 casual bathroom mirror selfie, young woman in early 20s holding 
minimal white serum bottle near her face showing product label to camera, standing 
in bright modern bathroom with natural morning window light from left side creating 
soft shadows, slightly off-center framing with top of head partially cut off, 
authentic UGC style, genuine smile looking at phone camera, warm and inviting mood, 
natural skin texture with minimal makeup, shot on iPhone 14 Pro, subtle background 
blur showing bathroom sink and towel, sharp focus on product label and her face, 
casual morning routine vibe, real person aesthetic not model, relatable and trustworthy, 
neutral beige and white color palette, conversion-optimized for TikTok/Reels

Negative: professional studio lighting, perfect composition, heavy makeup, artificial 
poses, polished backdrop, multiple products, text overlays, watermarks, no brand logos 
visible except product label, extra limbs, distorted hands, blurry, grainy, cartoon style
```

**Example 2: Unboxing on Bed**
```
Vertical 9:16 overhead shot, hands opening product package on unmade bed with 
white sheets, natural soft daylight from bedroom window, slightly messy authentic 
environment with phone visible in corner, genuine unboxing moment, warm excited 
mood, shot on smartphone camera from above, product packaging centered in frame 
with hands entering from sides, casual nail polish on natural nails, cozy bedroom 
background softly out of focus, sharp focus on product and packaging, real life 
unboxing aesthetic, relatable and authentic, soft natural colors, UGC conversion style

Negative: studio setup, perfect staging, model hands, artificial lighting, clean 
minimalist environment, professional photography, multiple products, text, logos, 
distorted proportions, blurry
```

**Example 3: Morning Coffee Routine**
```
Vertical 9:16 medium shot, woman in comfortable loungewear sitting at kitchen 
counter holding supplement bottle next to morning coffee and laptop, natural 
window light from behind creating soft glow, slightly casual framing with kitchen 
visible in background, authentic morning routine moment, peaceful and relatable 
mood, natural appearance with messy hair in bun, shot on iPhone, product bottle 
clearly visible on counter with label readable, warm wood and white kitchen aesthetic 
slightly out of focus, sharp focus on subject and product, genuine lifestyle content, 
real morning vibe not staged, soft warm color palette, UGC ad aesthetic

Negative: professional set, model styling, perfect hair and makeup, studio lighting, 
pristine environment, posed expressions, artificial, multiple products, text overlays, 
watermarks, distorted features
```

### UGC Diversity Guidelines

**Represent real customers:**
- Age range (18-25, 25-35, 35-50, 50+)
- Ethnicities (diverse representation)
- Gender (men, women, non-binary)
- Body types (athletic, average, curvy, plus-size)
- Skin types (clear, texture, acne-prone, mature)
- Hair types (straight, wavy, curly, coily, different colors)

**Authenticity markers:**
- Real skin texture (pores, freckles, natural imperfections)
- Natural expressions (not forced smiles)
- Casual styling (not glam)
- Lived-in environments (not staged perfection)

---

## Module 4: Product Shots & Editorial

**Purpose:** Hero product images and lifestyle editorial photography

### 4A: Hero Product Photography

**Purpose:** Clean, professional product shots for e-commerce, social feeds, print

**Lighting Setups:**

**White Seamless Background (E-commerce Standard)**
```
Centered product on white seamless infinity backdrop, professional studio 
lighting with large softbox key light from 45°, soft fill light from opposite 
side eliminating shadows, subtle gradient on backdrop from pure white center 
to very light gray edges, shot on Phase One medium format with 80mm macro lens, 
ultra-sharp focus across entire product, high-key lighting, clean and minimal, 
8K resolution, commercial product photography, 1:1 square crop
```

**Gradient Backdrop (Premium Feel)**
```
Product centered on gradient backdrop transitioning from [COLOR 1] to [COLOR 2],
professional studio edge lighting creating rim highlights on product contours,
soft key light from 45° showing product texture and materials, subtle reflections
on surface below, shot on high-end digital camera with macro lens, sophisticated
and premium aesthetic, selective focus with soft background blur
```

**Lifestyle Context (Product in Use)**
```
Product placed naturally on [SURFACE TYPE] in [ENVIRONMENT], soft natural light
from window creating gentle shadows, top-down flat lay composition OR eye-level
product placement, surrounding elements suggesting usage context (coffee, laptop,
plants, etc.), editorial photography aesthetic, aspirational but authentic
```

### Product Photography Prompt Template

```
[COMPOSITION STYLE], [PRODUCT DESCRIPTION] on [BACKGROUND/SURFACE],
[LIGHTING SETUP], shot on [CAMERA] with [LENS], [BRAND AESTHETIC],
[COLOR PALETTE], [DETAIL LEVEL], [MOOD], [COMMERCIAL PHOTOGRAPHY STYLE],
[ASPECT RATIO], [PRODUCT-SPECIFIC DETAILS: materials, textures, finishes]

Negative: distorted product, poor lighting, shadows obscuring details,
blurry, low resolution, cheap look, cluttered, busy background
```

### Examples

**Example 1: Tech Product Hero**
```
Centered product photography, sleek black wireless charging pad on white acrylic 
pedestal against pure white seamless backdrop, professional studio lighting with 
large octabox softbox from above creating even illumination, subtle rim lighting 
from behind defining edges with elegant highlights, shot on Phase One XF IQ4 150MP 
with 80mm macro lens, minimalist Apple-style aesthetic, desaturated with selective 
deep black and subtle blue LED glow from product, ultra-sharp focus showing premium 
matte finish and precise manufacturing details, sophisticated and innovative mood, 
centered composition, high-end tech product photography, 1:1 square for social feed, 
8K resolution, commercial quality, every detail razor-sharp

Negative: reflections showing photographer, dust particles, fingerprints, scratches, 
uneven lighting, harsh shadows, overexposed highlights, color cast, distorted proportions, 
low resolution
```

**Example 2: Beauty Product with Ingredients**
```
Overhead flat lay composition, luxury face serum bottle centered on marble surface 
surrounded by fresh botanical ingredients (rose petals, herbs, droplets), soft 
diffused natural window light from top-left creating gentle shadows and highlighting 
water droplets, shot on Canon EOS R5 with 50mm macro lens, elegant and organic 
aesthetic, warm natural color palette with soft pinks and greens, shallow depth 
of field with product in sharp focus and ingredients softly blurred, serene and 
premium mood, negative space on right third for text placement, editorial beauty 
photography, 4:5 vertical for Instagram feed, natural luxury brand positioning

Negative: artificial lighting, harsh shadows, wilted ingredients, messy arrangement, 
cluttered, too many elements, blurry product, oversaturated, fake look, low quality
```

### 4B: Editorial Lifestyle Photography

**Purpose:** Magazine-style images showing products in aspirational lifestyle contexts

**Editorial Photography Principles:**
- Natural light preferred (golden hour, window light, overcast)
- Environmental storytelling (setting tells brand story)
- Aspirational but achievable (not unattainable perfection)
- Negative space for magazine layout (headlines, copy)
- Cohesive color palettes (2-3 colors maximum)
- Thoughtful composition (leading lines, layers, depth)

### Editorial Prompt Template

```
Editorial lifestyle photography, [SUBJECT/PRODUCT] in [ASPIRATIONAL ENVIRONMENT],
[NATURAL LIGHTING], shot on [FILM/CAMERA] with [LENS], [MAGAZINE AESTHETIC],
[COLOR PALETTE], [DEPTH OF FIELD], [MOOD], [COMPOSITION NOTES],
[PUBLICATION STYLE: Vogue, Kinfolk, Monocle, etc.], [ASPECT RATIO]

Negative: amateur, cluttered, harsh lighting, busy background, distorted,
low quality, commercial product shot style
```

### Examples

**Example 1: Morning Routine Editorial**
```
Editorial lifestyle photography, minimal white ceramic coffee mug and wellness 
supplement bottle on natural oak wooden breakfast table beside window, soft morning 
sunlight streaming through sheer curtains creating gentle shadows and warm glow, 
shot on Contax T2 film camera with 35mm lens, Kinfolk magazine minimalist aesthetic, 
muted earth tones with warm beige and soft white palette, shallow depth of field 
with products in sharp focus and background kitchen softly blurred, peaceful and 
intentional mood, rule of thirds composition with negative space on left for editorial 
text, slow living editorial photography, natural film grain, 4:5 vertical for magazine 
layout, aspirational morning ritual storytelling

Negative: cluttered, busy, harsh lighting, artificial staging, overstyled, commercial 
product shot, text overlays, multiple competing elements, low quality
```

**Example 2: Fashion Editorial**
```
Editorial fashion photography, model in minimalist black turtleneck leaning against 
brutalist concrete wall in natural outdoor setting, overcast soft natural light 
creating even illumination with no harsh shadows, shot on Hasselblad 500CM medium 
format film with 80mm lens, Vogue editorial aesthetic, desaturated color palette 
with cool grays and muted tones, shallow depth of field with model in sharp focus 
and texture of concrete wall creating depth, confident and sophisticated mood, 
off-center composition following rule of thirds with architectural lines creating 
visual interest, high-fashion editorial photography, medium format film grain, 
2:3 vertical for print magazine, timeless and elegant

Negative: amateur poses, harsh lighting, cluttered background, oversaturated colors, 
digital noise, distorted proportions, low quality, commercial catalog style
```

---

## Model-Specific Output Formatters

### For Seedream 4.0 (Your Current Default)

**Format:**
```
Prompt: [Full detailed prompt as written above]

Generation Settings:
- Mode: Text-to-Image (or Image Editing if applicable)
- Style: [Photorealistic | Artistic | Cinematic]
- Aspect Ratio: [16:9 | 9:16 | 1:1 | custom]
- Quality: High
- Number of Images: 4

Negative Prompt: [All artifact removal and exclusions]
```

### For Midjourney

**Format:**
```
/imagine prompt: [Full detailed prompt] --ar [16:9 | 9:16 | 1:1 | 2:1 | etc.] 
--style raw --s [100-1000, default 250] --v 6.1 --quality 2

Parameters explained:
--ar = aspect ratio
--style raw = photorealistic (remove for more artistic)
--s = stylization (lower = more literal, higher = more artistic)
--v = version (6.1 is latest)
--quality 2 = maximum render quality

Negative prompts: Not directly supported, but add "no [elements]" in main prompt
```

### For DALL-E 3 / GPT-Image (OpenAI API)

**Format:**
```
{
  "model": "dall-e-3",
  "prompt": "[Full detailed prompt - natural language, no special syntax]",
  "n": 1,
  "size": "1024x1024" | "1024x1792" | "1792x1024",
  "quality": "hd",
  "style": "natural" | "vivid"
}

Note: DALL-E 3 doesn't support negative prompts directly. 
Include exclusions in main prompt as "without [elements], no [unwanted]"
```

### For Stable Diffusion / SDXL

**Format:**
```
Positive Prompt:
[Full detailed prompt with emphasis syntax]
(important element:1.3) = increase importance
[alternate|words] = random choice

Negative Prompt:
[All exclusions], (artifact:1.2), (unwanted:1.3)

Settings:
- Model: Stable Diffusion XL 1.0 (or specific checkpoint)
- Sampling Method: DPM++ 2M Karras (or Euler a)
- Steps: 30-50 (higher = more refined)
- CFG Scale: 7-10 (how closely to follow prompt)
- Seed: -1 (random) or [specific number] for reproducibility
- Size: 1024x1024 (or custom)
```

### For Flux (Pro/Dev)

**Format:**
```
Prompt: [Full detailed prompt - Flux excels at natural language]

Settings:
- Model: Flux Pro (commercial) or Flux Dev (open)
- Steps: 20-30 (Flux is efficient)
- Guidance: 3.5-7 (lower than SD, Flux follows well naturally)
- Aspect Ratio: [custom dimensions]
- Seed: [number] or random

Note: Flux is excellent for photorealism and following complex instructions.
Negative prompts less critical but can be included in parentheses at end.
```

---

## I2V Integration Guidelines

### Optimizing Images for Kling AI Image-to-Video

**Composition for I2V:**
1. **Central subject with breathing room** - Don't fill frame edges completely
2. **Clean background** - Easier for AI to animate motion
3. **Directional cues** - Light source, eye line, implied motion path
4. **Depth layers** - Foreground, subject, background for parallax
5. **Animatable elements** - Hair, fabric, liquids, particles, smoke

**Kling I2V Prompt Additions:**
```
[Your cinematic image prompt] + "slight natural movement, subtle camera push-in,
gentle subject motion, realistic physics, professional cinematography"
```

**Best Practices:**
- Lock lighting direction across images for multi-shot sequences
- Maintain color palette for visual continuity
- Similar depth of field creates cohesive look when animated
- Leave 10-15% negative space for camera movement options

### Optimizing Images for Veo 3.1

**Veo excels at:**
- Cinematic camera movements (dolly, pan, tilt, orbit)
- Natural physics (fabric, hair, water)
- Atmospheric effects (fog, rain, particles)

**Image optimization:**
```
[Filmmaking prompt] + "composition suitable for [CAMERA MOVEMENT],
depth information clear, realistic spatial relationships, professional
cinematography framing"
```

### Optimizing Images for Sora2

**Sora2 strengths:**
- Long-form consistent motion (up to 20 seconds)
- Complex scene understanding
- Multiple subjects/elements
- Realistic physics

**Image optimization:**
```
[Your prompt] + "well-defined spatial relationships, clear subject separation,
depth cues for 3D understanding, suitable for extended motion sequence"
```

### Optimizing Images for Seedance 1.5 Pro

**Seedance excels at:**
- Audio-visual synchronization
- Cinematic narrative motion
- Character animation
- Dialect/regional control

**Image optimization:**
```
[Commercial/filmmaking prompt] + "character clearly defined for animation,
environment suitable for camera movement, depth layers for cinematic motion,
suitable for audio synchronization"
```

---

## Brand Consistency Frameworks

### Creating Visual Identity Systems

When building campaigns with multiple images, establish:

**1. Color System**
```
Primary Palette: [2-3 colors]
Example: Deep navy (#1a2332), Warm beige (#e8d5c4), Teal accent (#4a9b9b)

Secondary Palette: [1-2 colors]
Example: Soft white (#f5f5f5), Charcoal (#2d2d2d)

Application:
- Backgrounds: [which colors]
- Product highlights: [which colors]
- Mood/atmosphere: [which colors]
```

**2. Lighting Signature**
```
Key Light: Soft diffused from [direction] at [angle]
Fill Ratio: [ratio between key and fill]
Rim/Edge: [present/absent], [color/intensity]
Ambient: [natural/studio], [quality]
Shadow Quality: [hard/soft], [opacity]
```

**3. Composition Template**
```
Framing: [centered | rule of thirds | symmetrical | dynamic]
Subject Placement: [consistent position across shots]
Negative Space: [where, how much, for what purpose]
Depth Strategy: [shallow DOF | deep focus | selective]
Camera Height: [eye level | low | high]
```

**4. Mood/Tone Consistency**
```
Emotional Target: [aspirational | authentic | dramatic | calm | energetic]
Color Temperature: [warm | cool | neutral]
Contrast Level: [high | medium | low]
Saturation: [vibrant | muted | desaturated]
Texture: [smooth/minimal | rich/detailed]
```

**5. Usage Example**
```
Campaign: "Modern Wellness Brand Launch"

Color System:
- Primary: Soft sage green (#c8d5c2), warm cream (#f9f6f1)
- Accent: Terracotta (#c45e44)

Lighting Signature:
- Natural soft window light from left
- Warm color temperature (4500K)
- Minimal shadows, high-key
- Gentle rim light on products

Composition:
- Rule of thirds, subject left
- 30% negative space right for text
- Shallow DOF (f/2.8)
- Eye-level perspective

Mood:
- Calm, intentional, organic
- Warm and inviting
- Aspirational but accessible
- Minimal and clean

Apply this across all campaign images for consistent brand identity.
```

---

## Advanced Techniques

### Cinematic Color Grading Vocabulary

**Teal and Orange (Blockbuster Look):**
```
"cinematic color grading with teal shadows and warm orange highlights,
high contrast, crushed blacks, lifted shadows with teal tint,
warm skin tones, complementary color scheme"
```

**Bleach Bypass (Gritty, Desaturated):**
```
"bleach bypass color grading, desaturated with retained contrast,
muted colors, silver-toned highlights, filmic grain, gritty aesthetic"
```

**Film Noir (High Contrast B&W):**
```
"film noir black and white, high contrast with deep blacks and bright whites,
dramatic shadows, chiaroscuro lighting, classic Hollywood cinematography"
```

**Vintage Film Stocks:**
```
"Kodak Portra 400 film aesthetic, warm natural colors, gentle skin tones,
subtle grain, slightly faded highlights, filmic color science"

"Kodak Vision3 500T cinematic film, tungsten balanced, rich colors,
professional motion picture film look, fine grain, deep blacks"

"Cinestill 800T night photography, unique halation glow around lights,
cinematic color rendering, high ISO film grain, tungsten color balance"
```

**Modern Digital Cinema:**
```
"ARRI Alexa color science, natural skin tones, wide dynamic range,
professional digital cinema aesthetic, filmic color rendering"

"RED Komodo 6K digital cinema, sharp detail, rich color depth,
professional color grading, cinematic quality"
```

### Material & Texture Rendering

**For Product Photography:**

**Metals:**
```
"brushed aluminum finish with subtle directional grain, soft reflections
showing studio lights, premium metallic sheen, precise edge highlights"
```

**Glass/Transparent:**
```
"crystal clear glass with subtle refraction, clean surface reflections,
transparent edges catching light, premium glass quality"
```

**Fabric/Textiles:**
```
"soft cotton texture with visible weave detail, natural fabric drape,
subtle shadows in folds, premium textile quality"
```

**Leather:**
```
"genuine leather texture with natural grain pattern, subtle sheen on
surface, premium craftsmanship visible, rich material quality"
```

**Matte/Soft Touch:**
```
"premium matte finish with no reflections, soft-touch coating visible,
subtle texture, fingerprint-resistant surface quality"
```

### Atmospheric Effects

**For Cinematic Scenes:**

**Volumetric Lighting:**
```
"god rays streaming through windows, volumetric light beams visible in
atmospheric haze, dust particles floating in sunlight, cinematic atmosphere"
```

**Weather Effects:**
```
"soft morning mist rising from ground, atmospheric fog creating depth,
ethereal and mysterious mood, diffused lighting through haze"

"gentle rain on window creating bokeh, water droplets with soft focus lights,
moody rainy day atmosphere, reflective wet surfaces"
```

**Particle Effects:**
```
"floating dust particles catching light, bokeh particles in background,
magical sparkle effect, ethereal atmosphere, depth from particulate matter"
```

### Perspective & Scale Manipulation

**Forced Perspective:**
```
"forced perspective making product appear larger than environment,
playful scale manipulation, creative composition, surreal but believable"
```

**Miniature/Tilt-Shift Effect:**
```
"tilt-shift lens effect making scene appear miniature, selective focus
on middle ground, blurred foreground and background, toy-like aesthetic"
```

**Macro Extreme Close-Up:**
```
"extreme macro photography revealing microscopic detail, shallow depth
of field measured in millimeters, texture and material structure visible,
scientific precision meets artistic vision"
```

---

## Production Checklists

### Pre-Generation Checklist

Before generating images, confirm:

- [ ] **Use case identified** (filmmaking | commercial | UGC | product | editorial)
- [ ] **Subject/product clearly defined**
- [ ] **Brand aesthetic established** (if applicable)
- [ ] **Aspect ratio determined** based on platform
- [ ] **Color palette defined** (brand colors or mood-based)
- [ ] **Mood/emotion articulated**
- [ ] **Lighting style selected**
- [ ] **I2V integration planned** (if applicable)
- [ ] **Model/platform chosen** (Seedream, Midjourney, etc.)

### Post-Generation Refinement

After initial generation, evaluate:

- [ ] **Composition matches intent** (framing, balance, negative space)
- [ ] **Lighting quality acceptable** (direction, softness, mood)
- [ ] **Color palette accurate** (brand colors, temperature, saturation)
- [ ] **Subject/product clearly visible** (focus, prominence)
- [ ] **Background appropriate** (not distracting, supports subject)
- [ ] **Mood/emotion conveyed** (does it feel right?)
- [ ] **Technical quality sufficient** (resolution, detail, artifacts)
- [ ] **I2V compatibility** (if applicable - clean motion paths)

### Common Fixes Reference

**Problem: Too busy/cluttered**
```
Solution: Add "minimalist," "simple background," "negative space"
Negative: "cluttered, busy background, multiple objects, chaotic"
```

**Problem: Wrong style (too artistic when need photorealistic)**
```
Solution: Add "photorealistic," "shot on [camera]," "professional photography"
Model: Switch to Flux or Seedream (better photorealism)
Midjourney: Add --style raw
```

**Problem: Lighting too harsh**
```
Solution: Specify "soft diffused lighting," "no harsh shadows," "even illumination"
Add: "softbox," "window light," "overcast"
Negative: "harsh shadows, direct sunlight, hard lighting"
```

**Problem: Colors wrong/oversaturated**
```
Solution: Specify exact color palette, add "muted," "desaturated," or specific hex codes
Add: "natural color rendering," "accurate color reproduction"
Negative: "oversaturated, artificial colors, color cast"
```

**Problem: Blurry or low detail**
```
Solution: Add "sharp focus," "8K," "ultra-detailed," "high resolution"
Increase: Quality/steps in generation settings
Negative: "blurry, low resolution, soft focus, out of focus, low quality"
```

**Problem: Distorted anatomy (hands, faces)**
```
Solution: Increase quality settings, use more realistic models
Negative: "distorted hands, extra fingers, deformed face, asymmetrical eyes,
extra limbs, anatomical errors"
SD/SDXL: Use anatomy-focused LoRAs or embeddings
```

**Problem: Not suitable for I2V animation**
```
Solution: Add "central subject with negative space," "depth layers,"
"clean background," "directional lighting cues"
Restructure: Ensure clear foreground/subject/background separation
```

---

## Quick Reference Templates

### 30-Second Quick Prompts

**Cinematic Scene:**
```
[Shot size] [angle], [subject] in [environment], shot on ARRI Alexa 35mm,
[lighting], teal and orange grading, shallow DOF, cinematic, 2.39:1
```

**Commercial Product:**
```
Centered product on gradient backdrop, studio lighting, shot on Phase One,
minimalist, premium aesthetic, sharp focus, commercial photography, 1:1
```

**UGC Ad:**
```
Vertical 9:16 iPhone selfie, [person] with [product] in [real location],
natural light, authentic UGC, relatable mood, sharp on product
```

**Editorial Lifestyle:**
```
Editorial photo, [subject] in [aspirational environment], natural window light,
shot on film, [magazine] aesthetic, muted colors, shallow DOF, 4:5
```

---

## Integration with Existing Skills

### Workflow: AI Creative Director → Cinematic Image → I2V

**Step 1: Use AI Creative Director Skill**
```
User: "Create UGC ad campaign for organic face oil targeting millennial women"

AI Creative Director outputs:
- Campaign strategy
- Shot list (5 scenes)
- Messaging framework
- Visual direction
```

**Step 2: Use Cinematic Image Skill**
```
Generate hero images for each shot:
1. Bathroom mirror selfie (UGC module)
2. Product on marble (Product module)
3. Morning routine (Editorial module)
4. Close-up texture (Filmmaking module)
5. Before/after moment (UGC module)
```

**Step 3: Use Kling I2V Skill**
```
Animate each image:
- Subtle subject motion
- Camera push-in
- Product highlight
- Natural movement
```

**Step 4: Use Viral Shorts Script**
```
Add:
- Hook
- Voiceover
- CTA
- Text overlays
```

**Result:** Complete 30-second UGC video ad from strategy to final output

---

## Final Output Format

When user requests image prompts, provide:

### **PRIMARY PROMPT**
```
[Full 200-300 word optimized prompt following appropriate module template]
```

### **NEGATIVE PROMPT**
```
[50-100 words of exclusions and artifact removal]
```

### **GENERATION PARAMETERS**
```
Model: [Seedream | Midjourney | DALL-E | Flux]
Aspect Ratio: [16:9 | 9:16 | 1:1 | 2.39:1 | etc.]
Quality: [High | Maximum]
Steps: [30-50 for SD/SDXL]
Guidance: [7-10 for SD, 3-7 for Flux]
Seed: [Random or specific number]
```

### **I2V INTEGRATION NOTES** (if applicable)
```
Recommended approach:
- [Camera movement suggestion]
- [Subject motion suggestion]
- [Atmospheric elements to animate]
- [Best I2V platform: Kling | Veo | Sora | Seedance]
```

### **VARIATIONS** (3 alternative approaches)
```
Variation 1: [Different angle/distance]
Variation 2: [Different lighting/mood]
Variation 3: [Different environment/context]
```

---

## Success Metrics

High-quality outputs should have:

✅ **Clear subject/focus** - Viewer knows what to look at
✅ **Appropriate mood** - Emotional tone matches intent
✅ **Professional quality** - Technical execution excellent
✅ **Brand consistency** - Fits visual identity (if applicable)
✅ **Platform optimization** - Aspect ratio and format correct
✅ **I2V readiness** - Composition suitable for animation (if needed)
✅ **Conversion potential** - Compelling for target audience (ads)
✅ **Authentic feel** - Appropriate realism level (UGC vs commercial)

---

## Remember

1. **Start with use case** - Filmmaking vs Commercial vs UGC vs Product determines everything
2. **Be specific, not vague** - "Soft diffused window light from left" > "nice lighting"
3. **Front-load important elements** - Subject, style, lighting first
4. **Use negative prompts strategically** - Remove common artifacts
5. **Optimize for I2V when needed** - Clean backgrounds, depth layers, motion cues
6. **Maintain brand consistency** - Lock color/lighting/mood across campaign
7. **Iterate based on results** - Use seed locking for controlled variations
8. **Choose right model** - Flux for photorealism, Midjourney for creative, etc.

This skill is the **foundation of your entire AI visual production pipeline**. Master it, and you can generate any image needed for filmmaking, commercials, UGC, or product work - all optimized for conversion and video integration.
