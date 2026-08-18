// lib/prompt-skills/seedance2/styles.ts
// Style metadata for the Seedance 2.0 "Platform & Style" picker.
// Mirrors the Style Selection Table in SKILL.md — keep in sync if references/ changes.

export type SeedanceStyleCategory = "creative" | "commercial" | "industry";

export interface SeedanceStyle {
  id: string;              // matches reference filename without extension
  name: string;
  category: SeedanceStyleCategory;
  bestFor: string;
  referenceFile: string;   // relative to lib/prompt-skills/seedance2/references/
}

export const SEEDANCE_STYLES: SeedanceStyle[] = [
  // Creative Styles
  { id: "cinematic", name: "Cinematic", category: "creative",
    bestFor: "Film-quality dramatic content — moody lighting, depth of field, lens flares, anamorphic, color grading, Steadicam/dolly/crane",
    referenceFile: "01-cinematic.md" },
  { id: "3d-cgi", name: "3D CGI", category: "creative",
    bestFor: "3D rendered content — Pixar style, Unreal Engine, photorealistic, isometric, Blender aesthetic",
    referenceFile: "02-3d-cgi.md" },
  { id: "cartoon", name: "Cartoon", category: "creative",
    bestFor: "2D animation — cel-shaded, hand-drawn, flat vector, watercolor, Ghibli, Looney Tunes",
    referenceFile: "03-cartoon.md" },
  { id: "comic-to-video", name: "Comic to Video", category: "creative",
    bestFor: "Animated comics — manga panels, webtoons, storyboards, graphic novels coming to life",
    referenceFile: "04-comic-to-video.md" },
  { id: "fight-scenes", name: "Fight Scenes", category: "creative",
    bestFor: "Action sequences — martial arts, sword fights, chase scenes, superhero combat, explosions",
    referenceFile: "05-fight-scenes.md" },
  { id: "anime-action", name: "Anime Action", category: "creative",
    bestFor: "Japanese animation — shonen, seinen, mecha, slice-of-life, anime openings",
    referenceFile: "08-anime-action.md" },

  // Commercial & Marketing
  { id: "motion-design-ad", name: "Motion Design Ad", category: "commercial",
    bestFor: "Software/SaaS — product launches, feature showcases, UI demos, app promos",
    referenceFile: "06-motion-design-ad.md" },
  { id: "ecommerce-ad", name: "E-Commerce Ad", category: "commercial",
    bestFor: "Product ads — fashion, beauty, electronics, food, DTC/e-commerce conversion content",
    referenceFile: "07-ecommerce-ad.md" },
  { id: "product-360", name: "Product 360", category: "commercial",
    bestFor: "Turntable showcases — multi-angle hero shots, material/texture reveals, unboxing",
    referenceFile: "09-product-360.md" },
  { id: "social-hook", name: "Social Hook", category: "commercial",
    bestFor: "Viral short-form — TikTok, Reels, Shorts, scroll-stopping hooks, trending formats",
    referenceFile: "11-social-hook.md" },
  { id: "brand-story", name: "Brand Story", category: "commercial",
    bestFor: "Brand narratives — origin stories, mission statements, company culture, brand films",
    referenceFile: "12-brand-story.md" },

  // Industry-Specific
  { id: "music-video", name: "Music Video", category: "industry",
    bestFor: "Beat-synced content — performance, narrative music videos, visualizers, lyric videos",
    referenceFile: "10-music-video.md" },
  { id: "fashion-lookbook", name: "Fashion Lookbook", category: "industry",
    bestFor: "Fashion content — lookbooks, runway walks, outfit showcases, fashion campaigns",
    referenceFile: "13-fashion-lookbook.md" },
  { id: "food-beverage", name: "Food & Beverage", category: "industry",
    bestFor: "Food content — restaurant promos, recipe videos, ASMR, appetite appeal, menu items",
    referenceFile: "14-food-beverage.md" },
  { id: "real-estate", name: "Real Estate", category: "industry",
    bestFor: "Property content — house tours, architecture showcases, interior design, aerial views",
    referenceFile: "15-real-estate.md" },
];

export const CATEGORY_LABELS: Record<SeedanceStyleCategory, string> = {
  creative: "Creative Styles",
  commercial: "Commercial & Marketing",
  industry: "Industry-Specific",
};

export function getStyleById(id: string): SeedanceStyle | undefined {
  return SEEDANCE_STYLES.find((s) => s.id === id);
}

// Universal 2-second hook types (style-agnostic — each reference file has its own
// specialized variations on top of these).
export const HOOK_TYPES = [
  { id: "impossible-scale", label: "Impossible Scale", example: "Object at wrong size — tiny person on giant product" },
  { id: "mid-action-freeze", label: "Mid-Action Freeze", example: "Frozen at peak moment — splash frozen mid-air" },
  { id: "perspective-violation", label: "Perspective Violation", example: "Camera where it can't be — inside a glass being poured" },
  { id: "texture-macro", label: "Texture Macro", example: "Extreme close-up on surface — fabric weave filling frame" },
  { id: "color-shock", label: "Color Shock", example: "Dominant unexpected color — monochrome scene, one red element" },
  { id: "motion-contrast", label: "Motion Contrast", example: "Stillness vs movement — frozen world, one thing moving" },
  { id: "reveal", label: "Reveal", example: "Obstruction clears to show subject — fog parts, product appears" },
  { id: "pattern-break", label: "Pattern Break", example: "Uniform pattern disrupted — grid of objects, one different" },
  { id: "time-manipulation", label: "Time Manipulation", example: "Speed shift in opening beat — ultra-slow then snap to real-time" },
  { id: "environmental-impossibility", label: "Environmental Impossibility", example: "Wrong context — product floating in clouds" },
] as const;
