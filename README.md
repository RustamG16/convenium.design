# Convenium.Design

Convenium.Design is a portable, gated design-orchestration system: one persistent **Design Director**
routes an evidence-based website redesign through explicit approval gates, activating a skill
or specialist only when its routing condition is true. It is deliberately not an "everything
at once" swarm — implementation cannot begin until a human selects a concept, and every run
leaves a verifiable trace (`.olympus/` in the target project).

This repository is the **system** — reusable, host-neutral operating context. It never holds
project-specific decisions or evidence; those belong in `<website-project>/.olympus/`.

## Read order

New to this repo (human or agent)? Read in this order:

1. [`ARCHITECTURE-ESSENTIALS.md`](ARCHITECTURE-ESSENTIALS.md) — one screen: what Convenium.Design is, the
   run, where things live.
2. [`AGENTS.md`](AGENTS.md) — the full operating doctrine. This is the single source of truth
   for both hosts; `CLAUDE.md` and `PROMPT.md` only add host-specific mechanics on top.
3. [`START-HERE.md`](START-HERE.md) — the gated workflow and the intake questions.
4. [`USAGE.md`](USAGE.md) — the human runbook: kickoff prompts for Claude Code and Codex, the
   gates explained in three sentences, follow-up commands.
5. Then only what the current decision needs: [`ARCHITECTURE.md`](ARCHITECTURE.md) for the full
   routing table, a `library/doctrines/<name>/design.md` for a chosen doctrine, a specific
   `library/agents/<name>.md` before delegating.

## Set up on a new device

### Prerequisites

| Tool | Version | Used for |
|---|---|---|
| [Git](https://git-scm.com/) | any recent | cloning, version control |
| A browser | any recent | the ship console (`ship/index.html`) — no build step, no server |
| [Python](https://www.python.org/) | 3.9+ (stdlib only) | `library/tools/*.py` — projecting and verifying the skill library |
| PowerShell | 5.1+ (Windows) or [PowerShell 7](https://github.com/PowerShell/PowerShell) (macOS/Linux) | `scripts/*.ps1` validators |

No API keys are required to use the system.

### Windows: enable long paths first

The skill library has deeply nested paths (some vendored skills, e.g. under
`remotion-best-practices/`, nest 6+ levels deep). Windows' default 260-character path limit can
break `git clone`'s checkout step with `Filename too long` errors — set this **before**
cloning:

```powershell
git config --global core.longpaths true
```

If you still hit path-length errors afterward (rare, only on deeply nested user profile paths),
also lift the OS-level limit once, as Administrator, then reboot:

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

Cloning to a short root path (e.g. `D:\Convenium.Design` rather than a deeply nested `Documents`
folder) further reduces the risk.

### Clone and verify

```bash
git clone https://github.com/RustamG16/convenium.design.git
cd Convenium.Design
```

Check the clone and this machine — stdlib Python, no installs:

```bash
python library/tools/apollo.py doctor
```

It runs `verify.py` (the single health check: library, registry, agents, generated trees,
plugin manifest) and then warns about anything that makes Convenium.Design behave differently here than
elsewhere — personal skills with the same names as Convenium.Design's, a retired global Convenium.Design, absolute
paths. It must report `verify clean` before you trust the clone.

### Install for Claude Code (recommended: as a plugin)

```text
/plugin marketplace add RustamG16/convenium.design        (or a local path to this folder)
/plugin install convenium-design@convenium-design
```

The plugin carries every Convenium.Design skill and agent, namespaced (`apollo:gsap-core`,
`apollo:design-director`), so nothing collides with skills you have installed personally.
Without the plugin, start Claude Code with `claude --add-dir <this folder>` instead.

### Attach a project (both hosts)

```bash
python library/tools/apollo.py attach <your-project>
```

This writes `.olympus/APOLLO.md` (where Convenium.Design lives on this machine, what to read first) and a
short pointer block in the project's `AGENTS.md`/`CLAUDE.md`. Convenium.Design itself is never copied in.
`.olympus/` is gitignored by default so client research stays private; pass
`--commit-olympus` to keep the run trail in the project's history. `detach` reverses it.

### The ship console

Open `ship/index.html` in any browser — no install, no server. The crew are the agents, the
ships are the workflows; "hiring" new crew or switching ships customises the presentation in
your browser while the library stays the source of truth. See `ship/README.md`.

## What is included

| Path | Holds |
|---|---|
| `library/` | **Source of truth** — skills, agents, doctrines, registry, design DNA. Edit only here. |
| `.claude/`, `.agents/`, `.codex/` | **Generated, disposable** projections of `library/` for each host. Never edit directly — rebuild with `python library/tools/project.py all`. |
| `ship/` | The 2D ship console: crew = agents, ships = workflows. `ship/data/` is generated; the rest is source. |
| `templates/` | Stable output contracts for every run (`00-brief.md` … `10-finish-review.md`, `run.json`). |
| `config/MCP-SETUP.md` | Optional external MCP connections and their activation rules. |
| `test_projects/` | Device-specific test/demo projects. **Gitignored** — each one is its own independent git repo, never tracked or pushed as part of Convenium.Design. |
| `scripts/` | Thin PowerShell wrappers around `library/tools/verify.py`, kept for existing habits. |
| `unused/` | Retired plans, skills and experiments, kept instead of deleted. Nothing reads it; see `unused/README.md`. |

The skill library also vendors the requested
[Impeccable](https://github.com/pbakaus/impeccable) package and
[GreenSock's official GSAP skills](https://github.com/greensock/gsap-skills). Exact upstream
commits and licenses are recorded in `third-party/`.

## Use it with a website project

1. Attach this repo and the website project folder to the same Claude Code / Codex session.
2. Send the kickoff prompt from [`USAGE.md`](USAGE.md) (host-specific — Claude Code and Codex
   have slightly different phrasing).
3. The agent must ask the intake questions in `START-HERE.md` before auditing or editing.
4. Approve the direction at Gate B.
5. Review the verified implementation at Gate C.

Do not copy this system into the website. Project-specific decisions and evidence belong in
`<project>/.olympus/`; this repo stays reusable and unchanged by any single project's run.

## Core promise

The system separates four kinds of work that broad "make it award-winning" prompts usually
collapse together:

1. **Evidence** — what is wrong and why.
2. **Direction** — one direction, resolved at intake from the questionnaire and taste profile.
3. **Production** — only the chosen direction, with an explicit asset plan.
4. **Verification** — browser evidence, analytics, and an independent critique.

That separation is the main defense against wasted tokens, random redesigns, and
polished-but-wrong output.

## Maintaining the library

`library/` is the only place to edit skills, agents, and the registry. After any change there,
rebuild every generated tree and re-verify before committing:

```bash
python library/tools/project.py all      # regenerate .claude/ .agents/ .codex/ .claude-plugin/ ship/data/
python library/tools/verify.py           # the single health check — exit 0 = clean
python library/tools/build_index.py      # refresh library/INDEX.md
```

`project.py <claude|codex|ship|digest|plugin>` runs one projector; add `--dry-run` to preview
without writing.
