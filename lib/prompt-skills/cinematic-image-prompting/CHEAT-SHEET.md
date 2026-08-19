# Cinematic Image Prompting - Quick Reference Cheat Sheet

## 4 Core Use Cases (Pick One First)

| Use Case | Style | Aspect Ratio | Key Feature |
|----------|-------|--------------|-------------|
| **Filmmaking** | Cinematic, ARRI/RED cameras, anamorphic | 2.39:1, 16:9 | Shot sizes, camera angles, film stocks |
| **Commercial** | Premium, studio lit, aspirational | 16:9, 1:1, 4:5 | Gradient backdrops, edge lighting, luxury |
| **UGC Ads** | Authentic, smartphone, real environments | 9:16 | Imperfect framing, natural light, relatable |
| **Product/Editorial** | Clean or lifestyle, professional | 1:1, 4:5, 16:9 | Sharp focus, material textures, negative space |

---

## Universal Prompt Formula

```
[STYLE/MEDIUM] [SHOT SIZE] [ANGLE], [SUBJECT] in [ENVIRONMENT],
[LIGHTING], shot on [CAMERA] with [LENS], [COLOR GRADING],
[DEPTH OF FIELD], [MOOD], [COMPOSITION], [ASPECT RATIO]

Negative: [artifacts], [unwanted elements], [quality issues]
```

---

## Shot Sizes (Filmmaking)

- **EWS** - Extreme wide (establish location)
- **WS** - Wide (show full scene)
- **MS** - Medium (waist up, balanced)
- **CU** - Close-up (face, emotion)
- **ECU** - Extreme close-up (eyes, details)

---

## Camera Angles (Filmmaking)

- **Eye level** - Neutral, conversational
- **Low angle** - Power, dominance, hero
- **High angle** - Vulnerability, overview
- **Dutch/canted** - Tension, unease
- **OTS** - Over-the-shoulder (dialogue)

---

## Lens Selection

| Lens | Effect | Use For |
|------|--------|---------|
| 16mm | Distortion, intimacy | POV, urgency |
| 24mm | Environmental storytelling | Wide context |
| 35mm | Cinematic standard | Narrative scenes |
| 50mm | Natural, human eye | Versatile shots |
| 85mm | Shallow DOF, beauty | Portraits, products |
| 135mm+ | Compression, isolation | Telephoto drama |

---

## Film Stocks / Cameras

**Digital Cinema:**
- ARRI Alexa - Professional digital, natural colors
- RED Komodo 6K - Sharp, rich color depth
- Sony Venice - Cinematic, wide dynamic range

**Film Stocks:**
- Kodak Portra 400 - Warm, natural skin
- Kodak Vision3 500T - Theatrical film
- Cinestill 800T - Tungsten, night glow

---

## Color Grading Presets

```
Teal & Orange (Blockbuster):
"teal shadows, warm orange highlights, high contrast, crushed blacks"

Bleach Bypass (Gritty):
"desaturated, retained contrast, silver highlights, filmic grain"

Film Noir:
"high contrast B&W, deep blacks, dramatic shadows, chiaroscuro"

Natural/Warm:
"warm color temperature, natural skin tones, gentle saturation"

Cool/Tech:
"cool blue tones, clinical, high contrast, modern aesthetic"
```

---

## Lighting Setups

### Commercial/Product
```
Studio Setup:
"soft key light from 45°, gentle fill opposite side, edge/rim lighting
from behind, gradient backdrop, no harsh shadows"

Hero Product:
"large softbox overhead, subtle rim highlights, gradient backdrop
transitioning from [color] to [color]"
```

### UGC/Authentic
```
Natural Light:
"soft natural window light from [left/right], gentle shadows,
morning/afternoon ambient light"

Bathroom Mirror:
"overhead bathroom lighting, natural window light from side,
soft shadows, authentic ambient"
```

### Cinematic/Filmmaking
```
Dramatic:
"low key lighting, strong shadows, rim light separating subject,
atmospheric haze, god rays"

Natural Exterior:
"golden hour sunlight, soft warm glow, long shadows,
magic hour cinematography"
```

---

## Composition Quick Picks

- **Centered** - Symmetry, formal, product focus
- **Rule of thirds** - Dynamic, editorial, narrative
- **Off-center** - Tension, negative space for text
- **Overhead/flat lay** - Product arrangements, food
- **Low angle** - Hero shots, aspirational
- **High angle** - Vulnerability, overview

---

## UGC Authenticity Checklist

✅ Vertical 9:16 aspect ratio  
✅ "Shot on iPhone" or smartphone camera  
✅ Slightly imperfect framing  
✅ Natural ambient lighting (no studio)  
✅ Real environments (bathroom, bedroom, kitchen)  
✅ Genuine expressions (not model poses)  
✅ Minimal retouching, natural skin texture  
✅ One product clearly visible  

❌ Studio lighting  
❌ Perfect composition  
❌ Professional backdrop  
❌ Model-level beauty  
❌ Multiple products  
❌ Overly polished  

---

## Commercial Product Checklist

✅ Centered or rule of thirds  
✅ Professional studio lighting  
✅ Clean background (white, gradient, minimal)  
✅ Sharp focus on product  
✅ Material textures visible  
✅ Premium aesthetic  
✅ Negative space for text (if needed)  
✅ Brand colors incorporated  

---

## Common Negative Prompts

**Universal (always include):**
```
low quality, blurry, distorted, amateur, low resolution, 
noisy, grainy, artifacts, watermarks
```

**For People/UGC:**
```
extra limbs, distorted hands, deformed face, extra fingers,
asymmetrical eyes, model poses, heavy makeup (for UGC)
```

**For Products:**
```
dust, scratches, fingerprints, uneven lighting, harsh shadows,
reflections showing photographer, color cast
```

**For Scenes:**
```
cluttered, busy background, oversaturated, artificial, 
unrealistic, cartoon style, surreal
```

---

## Aspect Ratios by Platform

| Platform | Ratio | Size | Use |
|----------|-------|------|-----|
| Instagram Feed | 1:1 | 1080x1080 | Square posts |
| Instagram/TikTok Vertical | 9:16 | 1080x1920 | Stories, Reels, TikTok |
| Instagram Portrait | 4:5 | 1080x1350 | Feed portraits |
| YouTube/Web | 16:9 | 1920x1080 | Landscape video |
| Cinematic Wide | 2.39:1 | 2048x858 | Film/epic content |
| Print/Editorial | 4:5, 2:3 | Various | Magazine layouts |

---

## I2V Optimization Quick Tips

**For Kling, Veo, Sora, Seedance:**

✅ Central subject with 10-15% negative space  
✅ Clean, uncluttered background  
✅ Clear depth layers (foreground/subject/background)  
✅ Directional lighting cues  
✅ Animatable elements (hair, fabric, particles)  
✅ Locked lighting direction across sequence  
✅ Consistent color palette  

**Add to prompt for I2V:**
```
"composition suitable for camera movement, depth information clear,
realistic spatial relationships, professional cinematography framing"
```

---

## 30-Second Templates

### Filmmaking Scene
```
Medium shot eye level, 2.39:1, [subject] in [environment], 
shot on ARRI Alexa 35mm, soft natural light, teal and orange grading, 
shallow DOF, cinematic film grain
```

### Commercial Product
```
Centered product on gradient backdrop navy to gray, studio edge lighting,
shot on Phase One 80mm macro, minimalist premium aesthetic, sharp focus,
commercial photography, 1:1
```

### UGC Ad
```
Vertical 9:16 iPhone selfie, [person] with [product] in bathroom mirror,
natural window light, authentic UGC style, relatable mood, 
sharp focus on product label
```

### Editorial Lifestyle
```
Editorial photo, [subject] in modern minimalist kitchen, 
soft morning window light, shot on Contax T2 35mm film, 
Kinfolk aesthetic, muted earth tones, shallow DOF, 4:5
```

---

## Model Selection Guide

| Model | Best For | Strengths | Format |
|-------|----------|-----------|--------|
| **Seedream 4.0** | Commercial, editorial, product | High quality, versatile | Your default |
| **Midjourney** | Creative, cinematic, artistic | Aesthetic quality, artistic | `--ar --style raw` |
| **DALL-E 3** | Quick iterations, API access | Natural language, fast | Simple prompt |
| **Flux Pro** | Photorealism, complex scenes | Best photorealism, instruction following | Natural language |
| **SDXL/SD** | Local control, customization | LoRAs, fine control, free | Positive+negative |

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Too busy/cluttered | Add "minimalist, simple background, negative space" |
| Wrong style | Specify "photorealistic" + camera, add --style raw (MJ) |
| Harsh lighting | "soft diffused lighting, no harsh shadows, even illumination" |
| Wrong colors | Specify hex codes, add "accurate color reproduction" |
| Blurry | Add "sharp focus, 8K, ultra-detailed, high resolution" |
| Bad anatomy | Increase quality, use realistic models, strong negatives |
| Not I2V ready | "central subject, negative space, depth layers, clean background" |

---

## Production Workflow

```
1. Identify Use Case → [Filmmaking | Commercial | UGC | Product]
2. Define Parameters → [Subject, mood, lighting, aspect ratio]
3. Build Prompt → [Use appropriate module template]
4. Add Negatives → [Remove artifacts, unwanted elements]
5. Set Generation → [Model, quality, aspect ratio, seed]
6. Generate 4-8 → [Review, select best]
7. Refine → [Lock seed, adjust prompt details]
8. Export → [Optimize for platform/I2V if needed]
```

---

## Brand Consistency Template

**Define once, apply to all campaign images:**

```
Color Palette: [Primary colors], [Accent colors]
Lighting: [Direction], [Quality], [Temperature]
Composition: [Style], [Negative space strategy]
Depth of Field: [Shallow/deep], [f-stop if relevant]
Mood: [Aspirational/authentic/dramatic/etc.]
Camera/Film: [Consistent across all shots]
```

---

## Material Textures (Products)

```
Metal: "brushed aluminum, soft reflections, metallic sheen, edge highlights"
Glass: "crystal clear, subtle refraction, clean reflections, transparency"
Fabric: "cotton texture, visible weave, natural drape, soft folds"
Leather: "genuine leather grain, natural pattern, subtle sheen, premium"
Matte: "soft-touch coating, no reflections, subtle texture, fingerprint-resistant"
```

---

## Remember

1. **Start simple** - Basic template, then refine
2. **Be specific** - "Soft window light from left" > "nice light"
3. **Front-load** - Important elements first in prompt
4. **Use negatives** - Remove artifacts proactively
5. **Lock seed** - When close, for controlled variations
6. **Platform first** - Aspect ratio based on destination
7. **Iterate** - 2-5 generations is normal
8. **Brand consistency** - Lock color/light/mood across campaign

---

## Integration with Your Workflow

```
AI Creative Director → Campaign strategy + shot list
        ↓
Cinematic Image Skill → Generate hero images
        ↓
Kling/Veo/Sora I2V → Animate images
        ↓
Viral Shorts Script → Add hook + voiceover + CTA
        ↓
Final deliverable → Complete video ad
```

---

**This skill is your visual production foundation. Everything starts with great images.**
