---
name: convenium-design-bootstrap
description: First-use analysis, audit, and install flow for ConveniumDesign_claude in a target project. Detects whether this is a first install or a re-audit, inventories the project's stack and existing six-files coverage, writes an audit doc, then offers to improve the existing project or scaffold a new one with the design roster ready. Trigger phrases - "set up Convenium.Design here", "install ConveniumDesign_claude in this project", "audit this project", "bootstrap Convenium.Design". Idempotent - safe to re-run.
---

# Convenium.Design Bootstrap

Idempotent. Every step below checks state before acting — re-running this skill never
duplicates or clobbers a previous run.

## 1. Detect install state

Check for `<target>/.convenium-design/convenium-design-claude.version.json`.

- **Absent** → this is a first install. Continue to step 2.
- **Present** → this is a re-audit or update. Read the file's `schemaVersion` and
  `installedAt`. If the running ConveniumDesign_claude's own version is newer, say so and offer to
  update; if equal, this is a plain re-audit; if the target's version is somehow newer
  than this running copy (a clone mismatch), stop and say so rather than guessing which
  is correct.

## 2. Detect stack and conventions

`Glob` the target root for stack markers: `package.json`, `pyproject.toml`,
`Cargo.toml`, `requirements.txt`, `go.mod`, `*.csproj`, or a bare folder with none of
these. Note whatever's found — this goes in the audit, not into any decision about
whether to proceed.

## 3. Check six-files coverage

Look for `prd.md`, `architecture.md`, `architecture-essentials.md`, `CLAUDE.md`,
`AGENTS.md` at the target root. Record which exist. **Do not read their content to judge
quality** — this step is inventory, not critique; a critique belongs to `themis` if the
user asks for one separately.

## 4. Write the audit

`<target>/.convenium-design/audit-<YYYY-MM-DD>.md`:

```markdown
# ConveniumDesign_claude audit — <target> — <date>

## Install state
First install | Re-audit (previous: <date>, schemaVersion <n>)

## Stack detected
<marker file(s) found, or "none — empty or non-standard project">

## Six-files coverage
- prd.md: present|missing
- architecture.md: present|missing
- architecture-essentials.md: present|missing
- CLAUDE.md: present|missing
- AGENTS.md: present|missing

## Recommendation
<one of the two paths below, with a one-line reason>
```

## 5. Present the two paths

State the audit's recommendation, then ask which the user wants:

- **Improve existing** — the project has real content; ConveniumDesign_claude's roster gets
  installed alongside it, and design work proceeds against what's already there.
- **Bootstrap new** — the project is empty or the six files are largely missing; offer to
  run the `project-scaffold` method (prd → architecture → essentials → CLAUDE/AGENTS →
  adversarial turn → scaffold) before any design work starts, the same way ConveniumDesign_claude
  itself was built.

Do not proceed past this step without the user's choice — this is a real fork, not a
default to assume.

## 6. Install the roster

Copy (never symlink — a symlinked `.claude/` breaks if the source repo moves or is
deleted, and defeats the point of a portable, self-contained clone). Every agent and
skill file references other ConveniumDesign_claude paths as bare project-root-relative paths
(`profiles/taste-profile.schema.json`, `dashboard/state.schema.json`,
`media/manifest.json`) — those references only resolve correctly if the referenced
folders are copied too, not just `.claude/`. Copy all of:

Into `<target>/.claude/`:
- `agents/*` — every file from ConveniumDesign_claude's own `.claude/agents/`.
- `skills/*` — every skill folder from ConveniumDesign_claude's own `.claude/skills/` (this
  includes `convenium-design-loadout-sync/`, the write path for the dashboard's Setups view).
- `skill-index/*`, `ROUTING.md`.

Into `<target>/profiles/`:
- `taste-profile.schema.json`, `doctrines/*` — the schema and the four built-in doctrine
  folders, each holding `design.md` (the human-readable style doc) and `profile.json`
  (the machine-readable default). **Not** anyone's personal saved profiles — those live
  in `~/.convenium-design/profiles/` or `<target>/.convenium-design/profile.json` and are never part of this
  copy.
- `loadouts/loadout.schema.json`, `loadouts/*.json` — the loadout contract and the six
  shipped skill-loadout presets. **Not** `<target>/.convenium-design/loadouts/` (custom setups and
  the active pointer — personal run state, created on first activation).

Into `<target>/dashboard/`:
- `index.html`, `css/*`, `js/*`, `avatars/*`, `data/*`, `state.schema.json`,
  `state.demo.json`, `state.demo.loadout.json` — the whole dashboard template, including
  the seven agent portraits and `data/skill-catalog.json`. **Not** `state.json` — that's
  per-project live state and doesn't exist yet for a fresh install.

Into `<target>/scripts/`:
- `apply-loadout.ps1` — the server-free fallback the dashboard points the user at when
  the browser can't grant File System Access. The `verify-*.ps1` scripts stay with the
  ConveniumDesign_claude repo; they check the template, not a target project.

`media/manifest.json` — copy for reference (small, no binary assets). Do not copy the
full `media/gods/` or `media/hero/` source images; the seven portraits the dashboard
actually displays already live in `dashboard/avatars/` at web-appropriate size.

**Collision rule:** if any destination file already exists **and was not itself
installed by a previous ConveniumDesign_claude run** (check: does
`<target>/.convenium-design/convenium-design-claude.version.json` list it as installed?), do not overwrite
it. Write ConveniumDesign_claude's copy alongside with an `.convenium-design-claude` suffix before the
extension instead (`convenium-design.convenium-design-claude.md`, `convenium-design-claude-<skill-name>/` for skill
folders), and note every renamed file in the audit doc so the user can resolve the
naming manually if they want.

If a file already exists and *was* installed by a previous run, overwrite it normally —
that's the update path, not a collision.

## 7. Write the version marker

`<target>/.convenium-design/convenium-design-claude.version.json`:

```json
{
  "schemaVersion": 1,
  "installedAt": "iso-8601",
  "updatedAt": "iso-8601",
  "installedFiles": ["list of every path written in step 6, for future collision checks"]
}
```

## 8. Confirm

State what was installed, what (if anything) was renamed due to collision, and point at
`CLAUDE.md` as the next thing to read for how the roster dispatches.
