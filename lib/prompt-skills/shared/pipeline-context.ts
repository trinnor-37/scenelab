// lib/prompt-skills/shared/pipeline-context.ts
//
// Shared "hand-off" layer for chaining SceneBloc skills together.
// Any route that produces output another route should treat as a
// constraint (Cinema Gear -> Seedance / Video Prompt / One-Take, etc.)
// should push it through here rather than inventing its own ad-hoc
// field/format per route.
//
// Pattern mirrors lib/realism.ts: one shared builder, imported by every
// downstream route, so the "this is mandatory, don't re-decide it"
// framing stays consistent everywhere instead of drifting route by route.

export interface UpstreamContext {
  // Extend this union as more producer skills are wired in
  // (e.g. "concept-generator", "voiceover-scripts").
  source: "cinema-gear-20" | string;
  content: string; // raw text block returned by the producing route
}

/**
 * Wraps upstream skill output (e.g. Cinema Gear's gear pairing) into a
 * clearly-labeled, non-negotiable context block for injection into a
 * downstream route's system prompt.
 *
 * Accepts a single context or an array (for future multi-step pipelines
 * where more than one prior skill has already run).
 */
export function buildUpstreamContextBlock(
  context?: UpstreamContext | UpstreamContext[]
): string {
  if (!context) return "";
  const contexts = Array.isArray(context) ? context : [context];
  if (contexts.length === 0) return "";

  return contexts
    .map((c) =>
      `
MANDATORY CONTEXT FROM UPSTREAM SKILL (${c.source}):
The following was already decided by a prior step in this pipeline. Treat
it as a hard constraint, not a suggestion — do not contradict it, and do
not re-choose gear, settings, or framing that it already specifies.

${c.content.trim()}
`.trim()
    )
    .join("\n\n---\n\n");
}
