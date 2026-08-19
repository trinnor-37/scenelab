# Audio Design Guide

Comprehensive guide for music selection, sound effects, and voiceover optimization in short-form video ads.

---

## Music Selection Framework

### Emotion-to-Music Mapping

| Target Emotion | Genre/Style | BPM | Key Characteristics | Example Use |
|----------------|-------------|-----|---------------------|-------------|
| **Energy/Excitement** | Electronic, EDM, Pop | 120-140 | Driving beat, synth builds, bass drops | Product launches, sales |
| **Inspiration/Triumph** | Orchestral, Cinematic | 90-120 | String swells, brass crescendos, piano | Success stories, transformations |
| **Trust/Warmth** | Acoustic, Indie Folk | 70-100 | Guitar, soft piano, gentle percussion | Service brands, testimonials |
| **Urgency/Action** | Trap, Fast EDM | 140-160 | Heavy bass, rapid hi-hats, tension | Limited offers, FOMO |
| **Calm/Premium** | Ambient, Lo-fi, Minimal | 60-80 | Pads, soft keys, subtle textures | Luxury, wellness, tech |
| **Playful/Fun** | Upbeat Pop, Funk | 110-130 | Claps, whistles, bouncy bass | Youth brands, casual products |
| **Mystery/Intrigue** | Dark Electronic, Cinematic | 80-100 | Minor keys, atmospheric pads, tension | Reveals, teasers |
| **Nostalgia** | Retro Pop, Vintage | 100-120 | Analog synths, vinyl texture, classic progressions | Heritage brands, throwbacks |

### Music Structure for Short-Form

**15-Second Ads:**
```
0-3s:   Intro/Hook support (light, building)
3-10s:  Main groove (consistent energy)
10-15s: Climax + Resolution (peak then settle)
```

**20-Second Ads:**
```
0-3s:   Intro/Hook support
3-12s:  Main groove with one build
12-18s: Climax at peak moment
18-20s: Resolution/Tag
```

**30-Second Ads:**
```
0-3s:   Intro
3-8s:   Verse/Build 1
8-15s:  Build 2 (escalating)
15-22s: Climax/Peak
22-30s: Resolution + CTA support
```

### Music Selection Criteria

**Technical Requirements:**
- Royalty-free or properly licensed
- Clean (no explicit lyrics if VO present)
- Stems available (for mixing flexibility)
- Loopable sections for editing flexibility

**Creative Alignment:**
- Matches brand personality
- Supports (doesn't fight) voiceover
- Enhances emotional arc
- Appropriate energy for platform/audience

---

## Sound Effect Categories & Usage

### Transition SFX

| SFX Type | Sound | Use Case | Timing |
|----------|-------|----------|--------|
| **Whoosh** | Air movement, sweep | Scene changes, time jumps | On cut |
| **Click/Tap** | UI click, finger tap | App interactions, selections | On action |
| **Swoosh** | Quick pass-by | Text reveals, element entries | 0.2s before visual |
| **Pop** | Bubble pop, light snap | Element appearances, callouts | On appearance |
| **Glitch** | Digital distortion | Tech products, modern brands | 0.1s on cut |

### Emphasis SFX

| SFX Type | Sound | Use Case | Timing |
|----------|-------|----------|--------|
| **Impact Hit** | Deep thud, bass impact | Key reveals, important moments | On peak frame |
| **Ding/Chime** | Bell, notification | Achievements, CTAs, positive moments | On completion |
| **Bass Drop** | Sub-bass hit | Major reveals, climax moments | On peak |
| **Riser** | Ascending tone | Building tension, pre-reveal | 1-2s before peak |
| **Reverse Cymbal** | Cymbal swell | Approaching climax | 1-3s before peak |

### Ambient/Environmental SFX

| Environment | Key Sounds | Purpose |
|-------------|------------|---------|
| **Office** | Keyboard typing, mouse clicks, distant chatter | Productivity, work context |
| **Cafe** | Coffee machine, light chatter, cups | Lifestyle, casual |
| **Outdoors** | Birds, wind, footsteps | Freedom, nature, adventure |
| **City** | Traffic, distant sirens, crowd murmur | Urban, energy, hustle |
| **Home** | Door close, footsteps, ambient room tone | Comfort, relatability |
| **Tech/Digital** | Subtle hums, beeps, data sounds | Innovation, modern |

### Product-Specific SFX

| Product Type | Key Sounds |
|--------------|------------|
| **Beverage** | Pour, fizz, ice, cap twist, refreshing "ahh" |
| **Food** | Sizzle, crunch, chop, plate set |
| **Tech/App** | Notification, swipe, tap, success chime |
| **Fashion** | Fabric rustle, zipper, footsteps, hanger |
| **Automotive** | Engine, door close, key fob, road |
| **Beauty** | Spray, application, cap click, mirror |

---

## Voiceover Specifications

### Pacing by Duration

| Duration | Word Count | WPM | Style |
|----------|------------|-----|-------|
| 10s | 25-30 | 150-180 | Ultra-punchy, headline-only |
| 15s | 35-45 | 140-180 | Fast, punchy, no filler |
| 20s | 50-60 | 150-180 | Energetic but clear |
| 30s | 75-90 | 150-180 | Conversational with room to breathe |
| 45s | 110-130 | 145-170 | Measured, more storytelling |
| 60s | 140-160 | 140-160 | Deliberate, fuller narrative |

### Pacing Annotations for AI Voice

```
[FAST]          — Increased speed (1.1-1.2x)
[SLOW]          — Decreased speed (0.8-0.9x) for emphasis
[PAUSE 0.5s]    — Half-second beat
[PAUSE 1s]      — Full second pause for impact
[PAUSE 2s]      — Two-second dramatic pause
[EMPHASIS]      — Stress following word/phrase
[CONVERSATIONAL] — Natural, relaxed delivery
[AUTHORITATIVE]  — Confident, declarative tone
[EXCITED]       — Higher energy, enthusiasm
[SOFT]          — Quieter, intimate delivery
[RISING]        — Upward inflection (questions, builds)
[FALLING]       — Downward inflection (conclusions, certainty)
```

### ElevenLabs-Specific Settings

| Style Goal | Stability | Similarity | Style |
|------------|-----------|------------|-------|
| **Energetic/Fast** | 0.3-0.5 | 0.7-0.8 | High variation |
| **Conversational** | 0.5-0.7 | 0.6-0.7 | Moderate variation |
| **Authoritative** | 0.7-0.9 | 0.8-0.9 | Low variation |
| **Emotional** | 0.3-0.5 | 0.5-0.7 | High variation |

### Voice Selection Criteria

| Brand Type | Voice Characteristics |
|------------|----------------------|
| **Premium/Luxury** | Deep, measured, confident, minimal inflection |
| **Tech/Startup** | Young, energetic, approachable, clear |
| **Health/Wellness** | Warm, calm, trustworthy, gentle |
| **Finance** | Authoritative, stable, reassuring, mature |
| **Youth/Entertainment** | Dynamic, playful, varied, expressive |
| **Local/Service** | Friendly, relatable, natural, conversational |

---

## Audio Layering Structure

### Three-Layer Model

```
┌─────────────────────────────────────────────────┐
│ LAYER 3: SFX (Accent)        80-90% | Sparse   │
├─────────────────────────────────────────────────┤
│ LAYER 2: VOICEOVER (Mid)     100%  | Primary  │
├─────────────────────────────────────────────────┤
│ LAYER 1: MUSIC (Background)  60-70% | Constant │
└─────────────────────────────────────────────────┘
```

### Ducking Protocol

When voiceover speaks:
- Music drops to 30-40% (automatic ducking)
- SFX remain at 70-80% (brief, non-competing)
- VO at 100% (always audible)

When no voiceover:
- Music rises to 70-80%
- SFX at full impact (80-90%)

### Mixing Guidelines

| Element | Peak dB | Notes |
|---------|---------|-------|
| **Voiceover** | -6 to -3 dB | Always loudest element |
| **Music (under VO)** | -18 to -12 dB | Ducked, supportive |
| **Music (no VO)** | -9 to -6 dB | Can be more present |
| **SFX** | -12 to -6 dB | Depends on importance |
| **Ambient** | -24 to -18 dB | Background, subtle |

---

## Audio-Visual Sync Points

### Mandatory Sync Moments

| Visual Moment | Audio Element | Sync Type |
|---------------|---------------|-----------|
| **Hook reveal** | Beat drop, accent | Frame-accurate |
| **Product appearance** | Subtle emphasis | 0.1s before visual |
| **Transformation moment** | Musical transition | On cut |
| **Peak/Climax** | Biggest musical moment | Frame-accurate |
| **CTA reveal** | Resolution or tag | On appearance |

### Beat-Matching Protocol

1. **Identify key visual moments** in storyboard
2. **Map to music beats** (strong beats = big moments)
3. **Place SFX accents** on or just before visual
4. **Test sync** at 0.5x speed to verify alignment

### Common Sync Errors

| Error | Problem | Fix |
|-------|---------|-----|
| **Late SFX** | Sound after visual | Shift audio 1-2 frames earlier |
| **Music fight** | Music peaks during VO | Choose different section or duck harder |
| **Over-layered** | Too many sounds competing | Remove weakest SFX, simplify |
| **Dead air** | Awkward silence | Add subtle ambient or extend music |

---

## Platform-Specific Audio Considerations

### TikTok/Reels (9:16)

- **Sound-on rate:** ~60-70% of viewers
- **Best practice:** Design to work with AND without sound
- **Music:** Trending sounds can boost algorithm, but limit longevity
- **VO:** Clear, punchy, front-loaded key message

### YouTube Shorts (9:16)

- **Sound-on rate:** Higher than TikTok (~75%)
- **Music:** Original scores perform well
- **VO:** Can be slightly more detailed

### LinkedIn/YouTube (16:9)

- **Sound-on rate:** Often watched without sound initially
- **Captions:** Essential
- **Music:** More professional, less trendy
- **VO:** Can be more measured, authoritative

### Stories (9:16, ephemeral)

- **Sound-on rate:** Variable (~50-60%)
- **Music:** Can be more ambient/background
- **VO:** Short, punchy, CTA-focused

---

## Silent Storytelling Audio Adaptation

For "sound-off first" viewing:

### Music Selection for Silent-First

- Choose tracks with strong visual rhythm (viewers can "feel" the beat)
- Avoid dialogue-dependent moments
- Use music that enhances but isn't required

### SFX Strategy

- Emphasize visual SFX (things you "see" sound)
- Minimize dialogue-reaction SFX
- Focus on transition and emphasis SFX

### Hybrid Approach

Design audio in two layers:
1. **Essential layer:** Works silent (visual rhythm only)
2. **Enhanced layer:** Full audio experience for sound-on viewers

---

## Audio Checklist

Before finalizing audio design:

- [ ] **Music matches** target emotion and brand
- [ ] **BPM appropriate** for content energy
- [ ] **VO word count** matches duration
- [ ] **Pacing annotations** included for AI voice
- [ ] **Ducking** applied when VO speaks
- [ ] **Sync points** mapped to key visuals
- [ ] **SFX accents** placed at emphasis moments
- [ ] **No competing elements** (music vs VO vs SFX)
- [ ] **Works silent** (for sound-off viewers)
- [ ] **Platform-appropriate** mix levels
