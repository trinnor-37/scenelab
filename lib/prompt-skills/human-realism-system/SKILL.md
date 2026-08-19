# human-realism-system

Shared skin/hair/material realism vocabulary and safety clause for any
SceneBloc skill that renders human subjects. This is infrastructure, not a
standalone generation mode — other skills import it, they don't duplicate it.

## Why this exists

Before this skill, realism tags and the skin-tone-accuracy clause were
duplicated per-skill (first written locally inside `one-take-ugc`). That's
fragile: if the tag vocabulary needs a fix or the accuracy clause needs
updating, every skill that copied it has to be updated separately, and
they will drift out of sync. This skill is the single source of truth.
Any skill needing skin/texture/material realism detail should import
`lib/realism.ts`, not maintain its own copy.

## Scope boundary — read this before adding tags here

This system owns **skin, hair texture, and material realism detail only**
(pores, freckles, tattoos, fabric translucency, etc.) — the "how does the
surface of things actually look" layer.

It does NOT own **character identity/consistency** (same face across shots,
same actor across scenes, reference-image locking). That is
`ai-creative-director/references/character-consistency.md`'s job. If a
brief needs both, load both — they answer different questions and neither
should absorb the other's content.

## Mandatory skin-tone-accuracy clause

Any skill applying ANY tag from `references/tag-vocabulary.md` MUST append
this clause. It is a rendering-accuracy safeguard, not a stylistic choice,
and it is not user-editable:

```
Render skin accurately across tones: warm/natural undertones preserved, no
unintended lightening or tone-shifting, no ashy or grey cast, no drift from
the character's established appearance. Output must be the same person.
```

`lib/realism.ts` appends this automatically whenever `tags` is non-empty —
skills importing it do not need to add it manually, and should not omit it.

## Identity-lock pairing

Realism edits apply to skin/hair/texture detail only. Facial structure,
expression, pose, clothing, lighting, and background must stay exactly as
established elsewhere in the prompt. This is the same anti-drift principle
as any continuity-lock mechanism elsewhere in SceneBloc's skills (e.g.
`one-take-ugc`'s Continuity Lock) — applied here to detail rendering
specifically.

## Peak-intensity placement principle

Realism detail should concentrate at the moment(s) in a shot where the
subject is physically closest to camera or most exposed to direct light —
matching how a real camera actually resolves fine detail — rather than
being spread evenly across a timeline. Skills that generate timed
choreography (like `one-take-ugc`) should pass their proximity-peak
timestamp(s) into the realism context so detail gets weighted there.

## How other skills should use this

```ts
import { buildRealismContext } from "@/lib/realism";

const realismContext = buildRealismContext({
  tags: ["visible-pores", "freckles", "baby-hairs-flyaways"],
  peakTimestamps: [6.6, 22.0], // optional — proximity-peak moments
});

// Insert realismContext into the system prompt alongside the skill's own
// SKILL.md content. Do not read tag-vocabulary.md directly — always go
// through buildRealismContext so the accuracy clause is guaranteed present.
```

See `references/tag-vocabulary.md` for the full tag list and category
definitions.
