# Realism Tag Vocabulary

Single source of truth for skin/hair/material realism tags across all
SceneBloc skills. Do not fork this list into individual skills — import via
`lib/realism.ts` instead (see SKILL.md).

## Genre profiles — read this first

The same tag can mean different things depending on genre. "Visible pores"
in a UGC context means raw, unretouched exposure. "Visible pores" in a
luxury-editorial context means intentional, controlled fine detail with no
accompanying blemish or oiliness. Don't apply tags genre-blind — use a
profile (see `lib/realism.ts` `REALISM_PROFILES`) so the intensity and
framing language matches what the content actually needs.

| Profile | Use for | Character |
|---|---|---|
| `ugc-raw` | Testimonials, unboxings, phone-recorded demos | Unretouched, imperfection is the point |
| `luxury-editorial` | High-end product/beauty campaigns | Photoreal but polished, blemish-free |
| `commercial-polished` | General brand/product ads | Balanced middle ground |
| `editorial-lifestyle` | Magazine/lifestyle shoots | Natural but flattering, warm |
| `fashion-editorial` | Runway/high-fashion content | Dramatic, precise, styled |
| `cinematic-narrative` | Film-still, story-driven scenes | Detail subordinate to mood/story |
| `documentary-candid` | Observational, unposed content | Unposed, unflattering-allowed |
| `beauty-macro` | Extreme close-up skincare/beauty | Maximum resolvable detail |
| `fitness-athletic` | Sports/fitness content | Sweat, exertion, muscle definition |
| `podcast-studio` | Long-form talking-head, ring-light setups | Consistent, sustained, not peak-weighted |
| `pov-immersive` | First-person POV content | Intimate close-range detail, direct eyeline |
| `product-handling` | Hand/product-contact close-ups | Correct hand joint detail, avoids the AI-hands tell |

This list is deliberately extensible — add new profiles to
`REALISM_PROFILES` in `lib/realism.ts` as new content genres come up,
rather than forcing a brief into the nearest existing one.

Each profile has its own `defaultTags` and `intensityNote` in
`lib/realism.ts` — pass a profile key to `buildRealismContext()` rather
than manually assembling a tag list, unless a brief needs a genuinely
custom combination.

## Texture
- visible-pores
- fine-facial-hairs
- uneven-texture
- t-zone-oiliness
- acne-blemish-detail
- natural-oil-sheen
- capillary-redness

## Pigmentation
- freckles
- moles-beauty-marks
- sun-glow
- tan-lines
- under-eye-detail

## Hair
- baby-hairs-flyaways
- root-texture
- frizz-halo
- natural-hairline
- individual-brow-hairs
- lash-line-moisture

## Adornment
- piercings-contact-shadow
- tattoo-matte-finish

## Body / Material
- stretch-marks
- fabric-translucency
- specular-sheen
- earlobe-translucency

## Aging / Time Markers
- fine-lines-wrinkles
- age-spots
- skin-laxity

## Eyes
- iris-texture
- scleral-detail
- natural-eye-asymmetry

## Mouth & Teeth
- natural-teeth-imperfection
- lip-texture-detail

## Asymmetry
- facial-asymmetry

## Scarring
- scar-detail

## Skin Conditions
- vitiligo-patches
- birthmark-detail

## Hands
- knuckle-texture
- visible-hand-veins
- palm-line-detail

## Physiological / Emotional Response
- blush-flush-response
- goosebumps-texture

## Nails
- nail-texture-detail

## Per-tag detail

Each tag in `lib/realism.ts` now carries a `TAG_DETAILS` entry — a short
descriptive phrase naming 3-5 concrete visual sub-features, not just a
label. `buildRealismContext()` outputs these descriptions, not bare tag
names, so the generating model gets specific guidance (e.g. what
`acne-blemish-detail` actually looks like) rather than having to infer
detail from a slug. Adding a new tag to `REALISM_TAGS` requires adding a
matching `TAG_DETAILS` entry — the two arrays must stay in sync.

## Category usage notes

Not every brief needs tags from every category. A close-up talking-head
shot typically draws from Texture + Pigmentation + Hair. A product-handling
shot with skin contact (rings, bracelets, tattoos) draws from Adornment.
Body/Material tags apply where skin or fabric catches direct light at
close range — the same "proximity-peak" logic from SKILL.md applies to
where in a scene these tags get used, not just when.

## Adding new tags

New tags belong here, not duplicated into an individual skill's own files.
If a skill needs a tag that doesn't fit an existing category, add a new
category rather than overloading an existing one — keep categories
semantically tight so skills can request by category when they don't need
to enumerate individual tags.
