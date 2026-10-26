# convenium-design-style-picker

- Category: Taste
- Phase: direct
- Status: active
- Routed: yes
- Skill ID: convenium-design-style-picker

Path B of the taste-profile system. Presents the built-in design doctrines, pre-fills a taste profile from the chosen one, then runs a short residual interview only for fields the doctrine can't answer (audience, avoid-list additions, project constraints). Trigger phrases - "pick a style for me", "show me the design options", "which style should I use". Do NOT use for building a fully bespoke profile from scratch - use convenium-design-taste-interview instead.

## Runtime instructions

Present the built-in design doctrines, let the user pick one, pre-fill the taste profile from it, then resolve the few remaining fields with short residual questions. Write the profile to `library/design-dna/`.
