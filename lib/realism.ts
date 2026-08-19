// lib/realism.ts
//
// Shared human-realism-system helper. Any route generating human subjects
// with skin/hair/material detail should import buildRealismContext() from
// here rather than maintaining its own tag list or accuracy clause.
//
// This is the single source of truth referenced by
// lib/prompt-skills/human-realism-system/SKILL.md — if you're duplicating
// tags or the accuracy clause inside a skill-specific file, stop and use
// this instead.

export const REALISM_TAGS = [
  // Texture
  "visible-pores",
  "fine-facial-hairs",
  "uneven-texture",
  "t-zone-oiliness",
  "acne-blemish-detail",
  "natural-oil-sheen",
  "capillary-redness",
  // Pigmentation
  "freckles",
  "moles-beauty-marks",
  "sun-glow",
  "tan-lines",
  "under-eye-detail",
  // Hair
  "baby-hairs-flyaways",
  "root-texture",
  "frizz-halo",
  "natural-hairline",
  "individual-brow-hairs",
  "lash-line-moisture",
  // Adornment
  "piercings-contact-shadow",
  "tattoo-matte-finish",
  // Body / Material
  "stretch-marks",
  "fabric-translucency",
  "specular-sheen",
  "earlobe-translucency",
  // Aging / Time Markers
  "fine-lines-wrinkles",
  "age-spots",
  "skin-laxity",
  // Eyes
  "iris-texture",
  "scleral-detail",
  "natural-eye-asymmetry",
  // Mouth & Teeth
  "natural-teeth-imperfection",
  "lip-texture-detail",
  // Asymmetry
  "facial-asymmetry",
  // Scarring
  "scar-detail",
  // Skin Conditions
  "vitiligo-patches",
  "birthmark-detail",
  // Hands
  "knuckle-texture",
  "visible-hand-veins",
  "palm-line-detail",
  // Physiological / Emotional Response
  "blush-flush-response",
  "goosebumps-texture",
  // Nails
  "nail-texture-detail",
] as const;

export type RealismTag = (typeof REALISM_TAGS)[number];

// Per-tag descriptive detail. A bare tag name (e.g. "acne-blemish-detail")
// underspecifies what to actually render — the generating model needs
// concrete visual detail, not just a label, to produce something as
// specific as real reference material would. Each entry names 3-5 concrete
// sub-features, mirroring the depth of detail good reference prompts use,
// without copying any source's exact wording.
export const TAG_DETAILS: Record<RealismTag, string> = {
  "visible-pores": "individual pore texture visible across nose, cheeks, and forehead, not smoothed",
  "fine-facial-hairs": "fine vellus hair catching light along jaw, upper lip, and cheeks",
  "uneven-texture": "natural variation in surface texture across the face rather than uniform smoothness",
  "t-zone-oiliness": "subtle natural oil sheen across forehead, nose, and chin",
  "acne-blemish-detail": "inflamed papules and clogged pores on cheeks/jawline, occasional post-inflammatory dark marks, tiny bumps, medically plausible — not exaggerated or theatrical",
  "natural-oil-sheen": "soft natural skin sheen catching available light, not glossy or wet-look",
  "capillary-redness": "faint natural redness under eyes and across cheeks from normal circulation",
  "freckles": "natural dark freckles varied in size and opacity across nose bridge, cheekbones, and temples, blended into pore texture, never painted-on dots",
  "moles-beauty-marks": "a few flat and raised moles placed naturally on face or neck",
  "sun-glow": "skin warmed and slightly deepened on cheekbones, nose bridge, forehead, shoulders, and collarbones — sun-exposure luminosity, not burnt or oversaturated",
  "tan-lines": "subtle tan-line contrast at clothing edges consistent with the sun-glow level",
  "under-eye-detail": "natural fine texture and faint shadow beneath the eyes, not retouched flat",
  "baby-hairs-flyaways": "individual flyaway strands catching light at the hairline, not painted-on or uniform",
  "root-texture": "visible natural root texture and slight regrowth variation at the part/hairline",
  "frizz-halo": "soft frizz halo visible in backlight along the hairline and crown",
  "natural-hairline": "slightly irregular, non-uniform hairline shape rather than a sharp graphic edge",
  "individual-brow-hairs": "separated individual brow hairs with natural directional growth, not a solid painted shape",
  "lash-line-moisture": "faint natural moisture along the lash line catching light",
  "piercings-contact-shadow": "correct anatomical placement with accurate metal-on-skin contact shadows and light reflections",
  "tattoo-matte-finish": "healed matte-finish ink with correct occlusion around body contours, integrated into skin texture rather than sitting on top like a sticker",
  "stretch-marks": "fine striae of varied width and depth following natural body growth lines, subtly lighter or darker than surrounding skin with a faint sheen where light catches them",
  "fabric-translucency": "fabric showing subtle light-through translucency where thin or backlit",
  "specular-sheen": "sharp specular highlight where light catches a curved surface directly",
  "earlobe-translucency": "faint warm light-through translucency at the earlobe edge when backlit",
  "fine-lines-wrinkles": "natural fine lines at the eyes, forehead, and nasolabial area consistent with the character's implied age — not erased flat, not exaggerated",
  "age-spots": "subtle natural pigment variation and small age-consistent spots on sun-exposed areas like cheeks and hands",
  "skin-laxity": "natural, age-appropriate skin firmness and subtle settling under the jaw and around the eyes rather than uniformly taut",
  "iris-texture": "visible fibrous iris detail and natural color variation, not a flat single-tone circle",
  "scleral-detail": "faint natural vein detail and subtle moisture sheen in the sclera, not stark uniform white",
  "natural-eye-asymmetry": "one eye subtly different in shape, size, or eyelid crease from the other, as in real faces",
  "natural-teeth-imperfection": "natural tooth color variation and minor alignment imperfection rather than uniform veneer-white symmetry",
  "lip-texture-detail": "visible natural lip texture and fine vertical lip lines, not airbrushed smooth",
  "facial-asymmetry": "subtle overall facial asymmetry — nose, brow height, or jaw slightly uneven, as in real faces rather than a mirrored-perfect construction",
  "scar-detail": "a healed scar with realistic texture and slightly different light response than surrounding skin, placed and sized to fit the character's implied history",
  "vitiligo-patches": "irregular depigmented patches with soft natural borders in a plausible distribution",
  "birthmark-detail": "a naturally shaped, softly bordered birthmark distinct from a mole, sized and placed plausibly",
  "knuckle-texture": "natural knuckle skin texture, fine creases, and slight redness at joints",
  "visible-hand-veins": "subtle visible veins across the back of the hand consistent with lighting and hand position",
  "palm-line-detail": "natural palm crease lines and texture visible when the palm is shown",
  "blush-flush-response": "natural flushed color across cheeks and upper chest consistent with the scene's emotional or physical intensity",
  "goosebumps-texture": "fine natural skin texture change (goosebumps) on exposed skin consistent with temperature or reaction in the scene",
  "nail-texture-detail": "natural nail surface texture, cuticle detail, and slight ridge variation rather than a flat uniform gloss",
};

// Genre-aware presets. Same subject, same physical world, different
// treatment of realism depending on what the content is for. This list is
// deliberately extensible — add new profiles here as new content genres
// come up rather than forcing a brief into the nearest existing one.
export const REALISM_PROFILES = {
  "ugc-raw": {
    label: "UGC Raw",
    description:
      "Unretouched, unfiltered phone-camera realism. Imperfection is the point — it's what signals authenticity over polish.",
    defaultTags: [
      "visible-pores",
      "t-zone-oiliness",
      "uneven-texture",
      "capillary-redness",
      "natural-oil-sheen",
      "baby-hairs-flyaways",
      "frizz-halo",
    ] as RealismTag[],
    intensityNote:
      "Push detail toward the raw/unflattering end deliberately — natural oil sheen, visible pore texture, minor asymmetry. Do not smooth or beautify. This should look like a real unedited phone camera caught it, not a filtered version of reality.",
  },
  "luxury-editorial": {
    label: "Luxury Editorial",
    description:
      "Photoreal but polished — the level of detail a skilled retoucher leaves in on purpose, not raw exposure.",
    defaultTags: [
      "visible-pores",
      "fine-facial-hairs",
      "natural-oil-sheen",
      "specular-sheen",
      "individual-brow-hairs",
      "lash-line-moisture",
    ] as RealismTag[],
    intensityNote:
      "Detail should read as intentional and controlled — fine pore texture and natural sheen, but no blemishes, no oiliness, no asymmetry emphasis. The goal is 'clearly a real person, not CGI-smooth' while still looking premium and camera-ready. Avoid anything that reads as candid or unflattering.",
  },
  "commercial-polished": {
    label: "Commercial Polished",
    description:
      "Mid-ground between UGC and luxury — approachable, camera-ready, but not glossy. Typical product-demo or brand-ad register.",
    defaultTags: [
      "visible-pores",
      "natural-oil-sheen",
      "capillary-redness",
      "baby-hairs-flyaways",
    ] as RealismTag[],
    intensityNote:
      "Balanced — enough texture to avoid looking artificial, not so much it reads as raw or unpolished. This is the default register for most commercial work that isn't explicitly UGC or explicitly luxury.",
  },
  "editorial-lifestyle": {
    label: "Editorial Lifestyle",
    description:
      "Magazine/lifestyle-shoot realism — natural but flattering, shot as if for a real editorial spread.",
    defaultTags: [
      "visible-pores",
      "freckles",
      "sun-glow",
      "natural-oil-sheen",
      "baby-hairs-flyaways",
    ] as RealismTag[],
    intensityNote:
      "Natural light, natural texture, warm and approachable — think real editorial photography, not studio-perfect. Some texture and asymmetry is welcome; nothing should look staged or overworked.",
  },
  "fashion-editorial": {
    label: "Fashion Editorial",
    description:
      "High-fashion/runway realism — striking, dramatic, precise skin rendering under controlled studio light.",
    defaultTags: [
      "visible-pores",
      "specular-sheen",
      "individual-brow-hairs",
      "lash-line-moisture",
      "under-eye-detail",
    ] as RealismTag[],
    intensityNote:
      "Sharp, precise detail under hard or dramatic lighting — specular highlights should read crisply. Skin can look striking rather than 'natural'; this is styled and intentional, not candid.",
  },
  "cinematic-narrative": {
    label: "Cinematic Narrative",
    description:
      "Film-still realism — detail serves mood and story rather than product or authenticity signaling.",
    defaultTags: [
      "visible-pores",
      "fine-facial-hairs",
      "capillary-redness",
      "natural-oil-sheen",
    ] as RealismTag[],
    intensityNote:
      "Detail should feel motivated by the scene's lighting and mood rather than foregrounded for its own sake — a sweat sheen under dramatic light, texture visible in a close-up that serves the story beat. Subordinate to cinematography, not the main event.",
  },
  "documentary-candid": {
    label: "Documentary Candid",
    description:
      "Observational, unposed realism — as if caught by a documentary crew, not directed for camera.",
    defaultTags: [
      "visible-pores",
      "uneven-texture",
      "capillary-redness",
      "under-eye-detail",
      "baby-hairs-flyaways",
      "facial-asymmetry",
      "natural-eye-asymmetry",
    ] as RealismTag[],
    intensityNote:
      "Unposed, unflattering-allowed, real — fatigue, uneven lighting reaction, asymmetry are all fine here. This should look observed, not performed for the lens.",
  },
  "beauty-macro": {
    label: "Beauty Macro",
    description:
      "Extreme close-up beauty/skincare realism — the product's effect on skin is the actual subject.",
    defaultTags: [
      "visible-pores",
      "fine-facial-hairs",
      "natural-oil-sheen",
      "specular-sheen",
      "under-eye-detail",
    ] as RealismTag[],
    intensityNote:
      "Maximum resolvable detail — this is a macro shot where skin texture IS the content. Every pore, every fine hair, every sheen highlight should be sharp and deliberate. No softening.",
  },
  "fitness-athletic": {
    label: "Fitness Athletic",
    description:
      "Sweat, exertion, and muscle-definition realism for fitness/sports content.",
    defaultTags: [
      "visible-pores",
      "natural-oil-sheen",
      "specular-sheen",
      "capillary-redness",
    ] as RealismTag[],
    intensityNote:
      "Sweat sheen and flushed skin from exertion, specular highlights along muscle definition under gym/studio lighting. Detail should communicate physical effort, not sit static.",
  },
  "podcast-studio": {
    label: "Podcast Studio",
    description:
      "Static-camera, extended-talking-head realism under consistent studio/ring light — built to hold up over long duration, not a single hero moment.",
    defaultTags: [
      "visible-pores",
      "t-zone-oiliness",
      "capillary-redness",
      "under-eye-detail",
      "fine-facial-hairs",
      "iris-texture",
      "scleral-detail",
    ] as RealismTag[],
    intensityNote:
      "Detail should stay consistent and unforced across a long static shot, not peak-weighted toward one moment — a podcast frame is held for minutes, not seconds, so texture must read naturally at rest, not just at a proximity peak. Slight oil sheen builds believably under continuous ring/studio light. Avoid anything that looks freshly touched-up or camera-conscious; this is a sustained, relaxed register. Eyes are held on camera for long stretches, so iris and scleral detail matter more here than in shorter formats.",
  },
  "pov-immersive": {
    label: "POV Immersive",
    description:
      "First-person point-of-view realism — the viewer IS the other person in the scene, not an observer of it.",
    defaultTags: [
      "visible-pores",
      "capillary-redness",
      "lash-line-moisture",
      "natural-oil-sheen",
      "under-eye-detail",
      "iris-texture",
      "natural-eye-asymmetry",
    ] as RealismTag[],
    intensityNote:
      "Detail is seen at close, intimate, often slightly-too-close distance — the kind of proximity only possible when the camera IS a person's eyes. Push detail toward what's only visible at conversational-or-closer range: individual lash moisture, skin sheen catching light at an angle only a face-to-face vantage would see, visible iris detail. Eyeline should read as looking directly at the viewer/lens, not past it.",
  },
  "product-handling": {
    label: "Product Handling",
    description:
      "Close-up hand/product-contact realism — for shots where hands holding, opening, or applying a product are the focal point.",
    defaultTags: [
      "knuckle-texture",
      "visible-hand-veins",
      "palm-line-detail",
      "nail-texture-detail",
      "natural-oil-sheen",
    ] as RealismTag[],
    intensityNote:
      "Hands are one of the most commonly-flagged AI generation tells — prioritize correct joint texture, natural asymmetric finger positioning, and visible palm/knuckle detail wherever hands are in focus. Avoid smooth, waxy, or over-symmetric hand rendering.",
  },
} as const;

export type RealismProfileKey = keyof typeof REALISM_PROFILES;


// Mandatory — kept in sync with human-realism-system/SKILL.md. Do not edit
// one without the other; they must say the same thing.
export const SKIN_TONE_ACCURACY_CLAUSE = `
Render skin accurately across tones: warm/natural undertones preserved, no
unintended lightening or tone-shifting, no ashy or grey cast, no drift from
the character's established appearance. Output must be the same person.
`.trim();

export const IDENTITY_LOCK_NOTE = `
Realism edits apply to skin/hair/texture detail only. Facial structure,
expression, pose, clothing, lighting, and background must stay exactly as
established elsewhere in the prompt.
`.trim();

interface BuildRealismContextInput {
  profile?: RealismProfileKey;       // if set, supplies default tags + intensity framing
  tags?: string[];                    // explicit tags — merge with or override profile defaults
  peakTimestamps?: number[];
}

/**
 * Builds the realism context block to insert into a system prompt.
 * Always includes the mandatory accuracy clause when any tags are present.
 *
 * Usage patterns:
 *   - profile only: buildRealismContext({ profile: "ugc-raw" })
 *       -> uses that profile's default tags + intensity language
 *   - profile + extra tags: buildRealismContext({ profile: "luxury-editorial", tags: ["freckles"] })
 *       -> profile defaults + explicit tags, merged and deduplicated
 *   - tags only, no profile: buildRealismContext({ tags: [...] })
 *       -> works exactly as before, no genre framing applied (backward compatible)
 */
export function buildRealismContext({
  profile,
  tags = [],
  peakTimestamps,
}: BuildRealismContextInput): string {
  const profileConfig = profile ? REALISM_PROFILES[profile] : undefined;
  const mergedTags = Array.from(
    new Set([...(profileConfig?.defaultTags ?? []), ...tags])
  );

  if (mergedTags.length === 0) return "";

  const validTags = mergedTags.filter((t) =>
    (REALISM_TAGS as readonly string[]).includes(t)
  );
  const unknownTags = mergedTags.filter(
    (t) => !(REALISM_TAGS as readonly string[]).includes(t)
  );

  const lines: string[] = [];

  if (profileConfig) {
    lines.push(
      `REALISM PROFILE: ${profileConfig.label}`,
      profileConfig.description,
      profileConfig.intensityNote,
      ""
    );
  }

  lines.push("REALISM DETAIL:");
  for (const tag of validTags) {
    lines.push(`- ${tag}: ${TAG_DETAILS[tag as RealismTag]}`);
  }

  if (unknownTags.length > 0) {
    lines.push(
      `NOTE: the following tags were not recognized and were ignored: ${unknownTags.join(", ")}. Consider adding them to lib/realism.ts if they represent a genuine new realism category.`
    );
  }

  if (peakTimestamps && peakTimestamps.length > 0) {
    lines.push(
      `PEAK-INTENSITY MOMENTS: concentrate the above detail at these timestamps (proximity to camera/light is highest here): ${peakTimestamps
        .map((t) => `${t}s`)
        .join(", ")}. Do not spread detail evenly across the timeline.`
    );
  }

  lines.push("", SKIN_TONE_ACCURACY_CLAUSE, "", IDENTITY_LOCK_NOTE);

  return lines.join("\n");
}
