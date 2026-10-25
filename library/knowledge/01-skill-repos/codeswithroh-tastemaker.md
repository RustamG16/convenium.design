---
id: repo-005
repo: codeswithroh/tastemaker
url: https://github.com/codeswithroh/tastemaker
description: A Claude Code skill that grounds AI-generated UI in real reference images and a persistent per-developer taste profile, instead of generic AI-slop defaults.
stars: 245
pushed: '2026-08-22'
licence: MIT
verified: '2026-08-28'
verdict: gap — smallest repo, most direct fit to this system
---

# codeswithroh/tastemaker

One skill. Lowest star count in the set (245) and the one worth the most attention here.

## What it does

Grounds AI-generated UI in **real reference images** plus a **persistent per-developer
taste profile**, rather than the model's generic defaults. The repo carries a
`.tastemaker/` directory — the profile is state that accumulates across sessions, not a
prompt you retype.

## Why it matters specifically to KnowledgeFactory

`library/design-dna/`, `library/layout/`, `library/motion/` and `library/typography/`
are **all empty**. They were created to hold exactly this: a durable record of what good
looks like, derived from captured references, that a design agent reads before it starts.

MNEMOSYNE already does the hard half — it ingests references and extracts frames
(`library/frames/` holds 5 sources' worth). What is missing is the step that turns those
frames into a persistent taste profile the design agents actually consult. That is what
tastemaker is.

The two fit together as: **MNEMOSYNE captures → taste profile accumulates → design
agents read the profile.** Without the middle step the frames sit unused, which is the
current state.

## The failure mode it names

"AI-slop defaults" — the observation that an unguided model converges on the same
centred-hero, rounded-card, indigo-gradient look regardless of brief. This is the same
problem the three-design-system setups in [../../doctrines/](../../doctrines/)
are built to solve, approached from the opposite direction: tastemaker constrains toward
*your* taste, the three setups constrain toward *three different* deliberate tastes.

Both are needed. A taste profile alone makes everything look consistent — which becomes
its own kind of sameness.

## Caution

245 stars and a single author. Lower adoption than anything else in the set. Read the
skill before relying on it; the mechanism is more valuable than the implementation, and
the mechanism can be rebuilt locally against `library/frames/` if the code disappoints.
