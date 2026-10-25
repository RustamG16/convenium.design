// The loadout, as instructions.
//
// This module exists because of a measured lie. `systems.mjs` has persisted a loadout's
// `brief` and `designDna` since the loadout model shipped, the Loadouts screen renders the
// taste profile's avoid-list under the heading "Never, in any run", and NOTHING READ EITHER
// FIELD. `composeInstructions` built its prompt from skill runtimePrompts alone, so two
// loadouts differing only in their brief or their taste profile produced byte-identical
// requests. The behaviour harness measures it: B4 reported `brief` and `designDna` inert
// while all eight slots, the budget and the approvals moved the request.
//
// An interface that says "never, in any run" and enforces it in no run is the exact defect
// this program exists to remove, and it is worse than a dead button because it is invisible.
//
// Order matters. The brief is what the run is for; the avoid-list is what it may not do; the
// preferences are how it should lean. Constraints go ahead of capabilities so a capability
// cannot argue its way past them.

const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();

function preferenceLines(preferences = {}) {
  return Object.entries(preferences)
    .map(([field, value]) => {
      const rendered = Array.isArray(value) ? value.join(', ') : clean(value);
      return rendered ? `- ${field}: ${rendered}` : null;
    })
    .filter(Boolean);
}

/**
 * Build the instruction block a loadout contributes to every agent in a run.
 * Returns '' when the loadout carries neither a brief nor a profile, so a default loadout
 * adds nothing rather than adding noise.
 */
export function composeLoadoutContext(loadout, profile) {
  if (!loadout) return '';
  const blocks = [];

  const brief = clean(loadout.brief);
  if (brief) {
    blocks.push([
      'BRIEF — what this run is for. It is the user\'s own words and it outranks any',
      'default a capability would otherwise assume.',
      '',
      brief,
    ].join('\n'));
  }

  if (profile) {
    const avoid = (profile.avoidList || []).map(clean).filter(Boolean);
    const prefs = preferenceLines(profile.explicitPreferences);
    const parts = [`DESIGN DNA — ${clean(profile.displayName) || profile.profileId}`];

    if (avoid.length) {
      parts.push('', 'NEVER, IN ANY RUN. These are hard constraints, not preferences. They union',
        'across profiles and are never overridden by a doctrine default. Do not produce work',
        'that violates one; if the brief appears to ask for it, say so instead of complying.',
        ...avoid.map(entry => `- ${entry}`));
    }
    if (prefs.length) {
      parts.push('', 'Lean this way where the brief does not say otherwise:', ...prefs);
    }
    blocks.push(parts.join('\n'));
  }

  return blocks.join('\n\n');
}

/**
 * The context for a loadout, with its taste profile resolved.
 * Kept separate from composeLoadoutContext so the pure function stays testable and the
 * filesystem read happens once per request rather than once per agent.
 */
export async function resolveLoadoutContext(loadout) {
  if (!loadout) return { context: '', profile: null };
  let profile = null;
  if (loadout.designDna) {
    try {
      const { listProfiles } = await import('./design-dna.mjs');
      profile = (await listProfiles()).find(item => item.profileId === loadout.designDna) || null;
    } catch { profile = null; }
  }
  return { context: composeLoadoutContext(loadout, profile), profile };
}
