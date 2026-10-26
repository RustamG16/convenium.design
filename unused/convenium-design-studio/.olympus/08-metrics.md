# Measurement note — Convenium.Design Workbench

No analytics connector, baseline, consent model, or production telemetry scope was supplied. No analytics events were invented or implemented.

For a later approved measurement pass, the minimum local/privacy-respecting readout is `project_created`, `chat_created`, `message_sent`, `response_stopped`, `oracle_opened`, `proposal_reviewed`, `proposal_approved`, and `proposal_cancelled`. Properties must be limited to app mode, surface, anonymized local session, and success/failure state; never prompt text, private paths, API keys, transcript contents, or inferred user attributes.

Success signal: the WKO evaluator can complete the primary Work journey unaided and understands when Oracle requires confirmation.
