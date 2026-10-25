# packages/engine (stub)

- `classify(profile) → { role, confidence, secondaryRole, cardMode }` — rule-based scoring
  from `classificationHints`; LLM tie-break only when the top two are within 10%.
- `compose(profile, role, dna, edits) → SectionPlan` — required + optional sections in the
  role's narrative order, hero variant from DNA, card mode when below minimum viable, copy
  from the copy step with `source` paths on every string.
- `copy(fields, language) → CopyResult` — one structured LLM call via `LLMGateway`; validated
  for length, language and no new proper nouns; cached by input hash.
- `LLMGateway` — the only network interface; logs model, tokens, cost per call.

No markup, no colours, no fonts live here.
