---
name: convenium-design-dashboard-sync
description: The single write path into a project's dashboard state.json. Any agent that starts, updates, blocks, or completes a task calls this skill rather than editing state.json directly - this is what keeps writes from racing across agents. Trigger phrases - this is invoked by other agents/skills as part of normal work, not typically by the user directly.
---

# Convenium.Design Dashboard Sync

## Why this exists

`architecture.md` §6 and §10 are explicit: exactly one write path into `state.json`, so
there's one place that owns the temp-file-then-atomic-rename discipline instead of every
agent reimplementing it slightly differently. Any agent updating its own status, a task,
or logging an event calls this skill. No agent edits `<project>/.convenium-design/dashboard/state.json`
directly with `Write`/`Edit`.

## Operations

**Update agent status** — `{agentName, status, currentTask}`. Sets
`agents[agentName].status`, `.currentTask`, `.lastUpdated = now`.

**Record a skill load** — `{agentName, skillName}`. Appends to
`agents[agentName].skillsLoadedThisRun` if not already present (no duplicates within one
run).

**Upsert a task** — `{id, owner, title, status, breaksInto, buildsOn}`. If `id` exists in
`tasks[]`, update in place; otherwise append. Setting `status: "done"` also sets
`completedAt = now` and increments `agents[owner].tasksCompletedThisRun`. Setting
`status: "active"` for the first time sets `startedAt = now`.

**Log an event** — `{agent, message}`. Appends `{at: now, agent, message}` to `events[]`.
If the array exceeds 200 entries after appending, drop from the front (oldest first) —
the cap from `state.schema.json`.

**Bump the opt-in lifetime stat** — on any task reaching `status: "done"`, if
`~/.convenium-design/stats/agent-stats.json` exists (the user has opted in), increment that agent's
lifetime counter there too. If the file doesn't exist, skip silently — this is opt-in,
not a default.

## Write procedure — every operation follows this exactly

1. Read the current `<project>/.convenium-design/dashboard/state.json`. If it doesn't exist,
   start from an empty valid shape (`version: 1`, empty `agents`/`tasks`/`events`,
   `profile: {profileId: null, doctrine: null}`) rather than erroring.
2. Apply the one requested change from the operations above.
3. Set `updatedAt = now` at the top level.
4. Write to `<project>/.convenium-design/dashboard/state.json.tmp`.
5. Rename `state.json.tmp` over `state.json`. This is the atomic step — a reader polling
   mid-write always sees either the old complete file or the new complete file, never a
   partial one.

Never batch multiple operations into one call without going through steps 1–5 for each —
batching without re-reading between them is how two near-simultaneous calls silently lose
one one's change.

## What this skill does not do

It does not decide *when* an agent's status should change — the calling agent decides
that and calls this skill to record it. This skill is the write mechanism, not a
scheduler.
