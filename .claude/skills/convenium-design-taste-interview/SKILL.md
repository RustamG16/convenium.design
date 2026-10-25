---
name: convenium-design-taste-interview
description: Path A of the taste-profile system. Runs a structured interview that is a 1:1 walk through taste-profile.schema.json's fields, producing a complete saved profile. Trigger phrases - "build my taste profile", "interview me about design preferences", "let's figure out my style". Do NOT use when a style is already picked - use convenium-design-style-picker instead, which runs a shorter residual version of this same question set.
---

# Convenium.Design Taste Interview

This is the single source of the questionnaire. The `brand-strategist` agent and the
`convenium-design-style-picker` skill invoke it rather than carrying their own copy of the questions —
if `library/schemas/taste-profile.schema.json` changes, this file changes in the same edit.

Skip any question the brief, the supplied references or the existing Brand DNA already
answers (see the brief-reading rules in `AGENTS.md`); record that field as answered from
evidence, with its source in `provenance`.

## Question set — one per schema field, in order

Ask one at a time. Accept "I don't know" or "surprise me" as a valid answer — record it
as a low-confidence entry rather than forcing a choice.

1. **displayName** — "What should I call this profile?" (defaults to something like
   "<user>'s default" if declined)
2. **explicitPreferences.color** — "Any colours you're drawn to, or want to avoid? Show
   me examples if you have them, or describe the feeling — warm/cool, bold/muted,
   monochrome/colourful."
3. **explicitPreferences.type** — "Serif or sans, for the most part? Anything about type
   you've noticed you like — big and bold headlines, quiet and small, handwritten,
   technical/monospace?"
4. **explicitPreferences.density** — "Do you want a lot on the page, or a lot of room to
   breathe? Think of the difference between a spreadsheet and a magazine spread."
5. **explicitPreferences.motion** — "Should things move — scroll effects, hover states,
   transitions — or should it feel still and considered?"
6. **explicitPreferences.tone** — "In a few words, what should this feel like? (e.g.
   'expensive and quiet', 'loud and alive', 'a tool I use every day')"
7. **avoidList** — "Anything you specifically don't want — a colour, a cliché, a style
   you've seen too much of?"
8. **references** — "Any specific sites, brands, or images you like or dislike? For each
   one, tell me what specifically you like or dislike about it — not just 'like this.'"
   Record each as `{source, verdict, note}`. If the reference is a URL, note whether it
   was actually fetched and viewed or only described secondhand.

## After the interview

1. Compare the answers against the four built-in doctrines
   (`library/doctrines/*/profile.json`, described in each folder's `design.md`). If the
   answers land close to one, set `doctrine` to
   that name and note the match in the summary — this doesn't skip the interview, it
   just tells the user "this sounds like Atelier, here's why" as a useful cross-check.
   If nothing matches well, set `doctrine: "custom"` and say so.
2. Set `confidence.byField` per answer: 1.0 for a direct, specific answer; lower for
   "I don't know"/vague answers; and write a `provenance` entry per field
   (`{field, source: "interview:brand-strategist", at: now}`).
3. Write the profile into the project's `.olympus/brand-dna.json` under `taste` (create the
   file from `library/schemas/brand-dna.schema.json` if the strategist has not yet). When the
   user wants a personal default that follows them across projects, also save a copy to
   `~/.apollo/taste.json` — never into the Convenium.Design folder.
4. Summarise back to the user in plain language and ask for confirmation before the
   profile is used on real design work.
