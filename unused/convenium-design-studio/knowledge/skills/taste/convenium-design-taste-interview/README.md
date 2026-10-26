# convenium-design-taste-interview

- Category: Taste
- Phase: direct
- Status: active
- Routed: yes
- Skill ID: convenium-design-taste-interview

Path A of the taste-profile system. Runs a structured interview that is a 1:1 walk through taste-profile.schema.json's fields, producing a complete saved profile. Trigger phrases - "build my taste profile", "interview me about design preferences", "let's figure out my style". Do NOT use when a style is already picked - use convenium-design-style-picker instead, which runs a shorter residual version of this same question set.

## Runtime instructions

Walk the user field by field through `taste-profile.schema.json`, producing a complete saved profile in `library/design-dna/`. Capture provenance and uncertainty; never infer a preference the user did not state.
