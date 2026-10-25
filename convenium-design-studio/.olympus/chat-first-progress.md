# Chat-First Rebuild Progress

## 2026-09-16 — implementation start

- Scope: approved chat-first usability rebuild; no new intake or alternatives.
- Worktree: preserved existing dirty changes; no files reverted.
- Grounded: current Node ESM server, workspace/state APIs, hash router, vanilla renderer, existing tests, and historical finish review.
- Prepared: design spec, implementation plan, route/control contract, verification matrix.
- Next: implement route/data foundations, then shell, chat workflow, Constructor, supporting screens, and full verification.
- Route foundation: canonical routes and legacy normalization implemented; focused route tests pass 7/7.
- Integration status: full shell check currently fails because the retained HTML/navigation still exposes the nine legacy destinations and has not yet been replaced by the chat-first shell. No full-pass claim is made.
