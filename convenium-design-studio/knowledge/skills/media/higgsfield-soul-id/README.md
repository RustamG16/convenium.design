# higgsfield-soul-id

- Category: Media
- Phase: unrouted
- Status: active
- Routed: no
- Skill ID: higgsfield-soul-id

Train a Soul Character — a personalized model on a person's face that Higgsfield uses for identity-faithful image and video generation. Use when: "create my Soul", "train my face", "make my digital twin", "build me an avatar", "learn my appearance", "create a character of me", "set up identity for video", "I want my face in generated images". Chain: train Soul (one-time, returns reference_id) → use in higgsfield-generate via `--soul-id <id>` with models like `text2image_soul_v2` or `soul_cinema_studio`. NOT for: one-shot face swaps (use higgsfield-generate with --image), named-character / non-photo avatars (use higgsfield-generate with prompt).
