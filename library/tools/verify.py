#!/usr/bin/env python3
"""The single health check for Convenium.Design. stdlib only. Exit 0 = clean, 1 = problems.

    python library/tools/verify.py                    # library + system checks
    python library/tools/verify.py --project <path>   # a website project's six context files

Library checks:
  1. every skill folder has SKILL.md whose frontmatter `name:` equals the folder name
  2. exactly one registry record per skill folder, and one folder per record
  3. phase, hosts and status are valid; `enabled` agrees with phase
  4. descriptions are real text (not empty, not a bare YAML `|` / `>` marker)
  5. routed skills carry a runtimePrompt
  6. library/agents holds exactly the sanctioned agents
  7. every agent `skills:` entry is a registry id or a declared external skill, and is
     projected for every host the agent runs on
  8. every slots.json / presets.json skill reference is a registry id
  9. defaultOn skills reach every host (claude + codex)
 10. no skill body cites a repo path that exists neither in the skill folder nor the repo

System checks (formerly scripts/validate-system.ps1):
 11. required files exist; templates/run.json parses
 12. every generated skill folder has SKILL.md with a matching name and a description
 13. registry <-> .claude/skills and .agents/skills parity; every agent in both host formats
 14. generated trees match a fresh projection (project.py all --dry-run plans 0 writes)
 15. line caps; CLAUDE.md shares no 16-word run with AGENTS.md; no TODO markers in
     system-authored files
"""
import json, os, re, subprocess, sys

TOOLS = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.dirname(TOOLS)
ROOT = os.path.dirname(LIB)
SKILLS = os.path.join(LIB, "skills")
REGISTRY = os.path.join(LIB, "registry")

VALID_PHASES = {"always", "diagnose", "direct", "prepare", "build", "verify", "unrouted"}
VALID_HOSTS = {"claude", "codex", "studio"}
VALID_STATUS = {"active", "stub", "manual"}
SANCTIONED_AGENTS = {
    "visual-analyst", "independent-critic", "asset-producer", "design-engineer",
    "analytics-specialist", "design-director", "brand-strategist",
}
REQUIRED_FILES = [
    "README.md", "START-HERE.md", "PROMPT.md", "CLAUDE.md", "USAGE.md", "AGENTS.md",
    "ARCHITECTURE.md", "ARCHITECTURE-ESSENTIALS.md", ".codex/config.toml",
    "config/MCP-SETUP.md", "templates/run.json",
    *[f"templates/{n}.md" for n in ("00-brief", "01-audit", "02-concepts", "03-critique",
                                    "04-decision", "05-asset-manifest", "06-build-plan",
                                    "07-qa", "08-metrics", "09-handoff", "10-finish-review",
                                    "DESIGN", "PRODUCT")],
    *[f"templates/project-context/{n}" for n in ("PRD.md", "ARCHITECTURE.md",
                                                 "ARCHITECTURE-ESSENTIALS.md", "AGENTS.md",
                                                 "CODEX.md", "PROGRESS-AND-DECISIONS.md")],
    "templates/BRAND.md", "library/schemas/brand-dna.schema.json",
    "library/schemas/taste-profile.schema.json",
    "library/README.md", "library/registry/skills.registry.json",
    "library/registry/ROUTING-DIGEST.md", "library/tools/project.py", "library/tools/verify.py",
]
LINE_CAPS = {"library/registry/ROUTING-DIGEST.md": 200, "CLAUDE.md": 120, "PROMPT.md": 120}
PROJECT_CONTEXT = ["PRD.md", "ARCHITECTURE.md", "ARCHITECTURE-ESSENTIALS.md", "AGENTS.md",
                   "CODEX.md", "PROGRESS-AND-DECISIONS.md"]
# skipped by the TODO scan: vendored, generated, retired, or project material
TODO_SKIP = {".git", "node_modules", "third-party", "test_projects", "unused", ".olympus",
             ".claude", ".agents", ".codex", "knowledge", "skills"}
CITED_PATH = re.compile(r"`((?:library|templates|scripts|profiles|dashboard|config|"
                        r"references|\.claude/agents|\.claude/skills|\.agents/skills)/[^`\s]+)`")

bad = []


def read(path):
    return open(path, encoding="utf-8", errors="replace").read()


def frontmatter(text):
    m = re.match(r"^---\s*\n(.*?)\n---", text, re.S)
    return m.group(1) if m else None


def fm_field(fm, key):
    m = re.search(rf"^{key}:\s*(.+)$", fm or "", re.M)
    return m.group(1).strip().strip("\"'") if m else None


def inline_list(value):
    return [s.strip() for s in (value or "").strip("[]").split(",") if s.strip()]


# ------------------------------------------------------------------ library
def check_library():
    folders = {}  # id -> [categories]
    for cat in sorted(os.listdir(SKILLS)):
        catdir = os.path.join(SKILLS, cat)
        if not os.path.isdir(catdir):
            continue
        for sid in sorted(os.listdir(catdir)):
            sdir = os.path.join(catdir, sid)
            if not os.path.isdir(sdir):
                continue
            folders.setdefault(sid, []).append(cat)
            p = os.path.join(sdir, "SKILL.md")
            if not os.path.isfile(p):
                bad.append(f"{cat}/{sid}: no SKILL.md")
                continue
            body = read(p)
            if fm_field(frontmatter(body), "name") != sid:
                bad.append(f"{cat}/{sid}: frontmatter name != folder")
            for m in CITED_PATH.finditer(body):
                ref = m.group(1).rstrip(".,;:)")
                if any(c in ref for c in "<>*{}$"):
                    continue
                if not (os.path.exists(os.path.join(sdir, ref)) or os.path.exists(os.path.join(ROOT, ref))):
                    bad.append(f"{sid}: SKILL.md cites missing path {ref}")
    for sid, cats in folders.items():
        if len(cats) > 1:
            bad.append(f"{sid}: exists in multiple categories {cats}")

    reg = json.load(open(os.path.join(REGISTRY, "skills.registry.json"), encoding="utf-8"))
    by_id = {r["id"]: r for r in reg}
    if len(by_id) != len(reg):
        bad.append("duplicate id in skills.registry.json")
    for r in reg:
        sid = r["id"]
        if sid not in folders:
            bad.append(f"registry record {sid} has no skill folder")
        if r["phase"] not in VALID_PHASES:
            bad.append(f"{sid}: invalid phase {r['phase']!r}")
        desc = str(r.get("description", "")).strip()
        if desc in ("", "|", ">", "|-", ">-") or len(desc) < 12:
            bad.append(f"{sid}: description is empty or a bare YAML marker ({desc!r})")
        hosts = r.get("hosts") or []
        if not hosts or not set(hosts) <= VALID_HOSTS:
            bad.append(f"{sid}: invalid hosts {hosts!r}")
        if r.get("status") not in VALID_STATUS:
            bad.append(f"{sid}: invalid status {r.get('status')!r}")
        if "enabled" not in r:
            bad.append(f"{sid}: missing `enabled`")
        elif bool(r["enabled"]) != (r["phase"] != "unrouted"):
            bad.append(f"{sid}: enabled={r['enabled']} disagrees with phase={r['phase']}")
        if r["phase"] != "unrouted" and not str(r.get("runtimePrompt", "")).strip():
            bad.append(f"{sid}: routed ({r['phase']}) but empty runtimePrompt")
        if r.get("defaultOn") and not {"claude", "codex"} <= set(hosts):
            bad.append(f"{sid}: defaultOn but not projected to both claude and codex")
    for sid in folders:
        if sid not in by_id:
            bad.append(f"skill folder {sid} has no registry record")

    ext = {}
    ext_path = os.path.join(REGISTRY, "external-skills.json")
    if os.path.isfile(ext_path):
        ext = json.load(open(ext_path, encoding="utf-8"))
    external = set(ext.get("plugin", [])) | set(ext.get("builtin", []))

    agents_dir = os.path.join(LIB, "agents")
    present = {f[:-3] for f in os.listdir(agents_dir) if f.endswith(".md") and f != "README.md"}
    for a in sorted(present - SANCTIONED_AGENTS):
        bad.append(f"unsanctioned agent file in library/agents: {a}.md")
    for a in sorted(SANCTIONED_AGENTS - present):
        bad.append(f"missing sanctioned agent file: {a}.md")
    for a in sorted(present & SANCTIONED_AGENTS):
        fm = frontmatter(read(os.path.join(agents_dir, f"{a}.md")))
        if fm_field(fm, "name") != a:
            bad.append(f"agent {a}: frontmatter name mismatch")
        for sk in inline_list(fm_field(fm, "skills")):
            if sk in external:
                continue
            r = by_id.get(sk)
            if not r:
                bad.append(f"agent {a}: skill {sk} is neither registered nor a declared external skill")
            elif not {"claude", "codex"} <= set(r["hosts"]) or r["status"] == "stub":
                bad.append(f"agent {a}: skill {sk} is not projected to both claude and codex")

    slots = json.load(open(os.path.join(REGISTRY, "slots.json"), encoding="utf-8"))
    for slot in slots.get("slots", []):
        for c in [slot.get("default")] + [c["skill"] for c in slot.get("candidates", [])]:
            if c and c not in by_id:
                bad.append(f"slots.json {slot['id']}: skill {c} not in registry")
    for p in json.load(open(os.path.join(REGISTRY, "presets.json"), encoding="utf-8")):
        for sk in p["skills"]:
            if sk not in by_id:
                bad.append(f"presets.json {p['id']}: skill {sk} not in registry")
    return folders, reg


# ------------------------------------------------------------------- system
def check_system(reg):
    for rel in REQUIRED_FILES:
        if not os.path.isfile(os.path.join(ROOT, rel)):
            bad.append(f"missing required file: {rel}")
    try:
        json.load(open(os.path.join(ROOT, "templates", "run.json"), encoding="utf-8"))
    except Exception as e:  # noqa: BLE001 - report any parse failure
        bad.append(f"templates/run.json is invalid JSON: {e}")

    have = {}
    for host, rel in (("claude", ".claude/skills"), ("codex", ".agents/skills")):
        d = os.path.join(ROOT, rel)
        have[host] = {n for n in os.listdir(d) if os.path.isdir(os.path.join(d, n))} if os.path.isdir(d) else set()
        for n in sorted(have[host]):
            p = os.path.join(d, n, "SKILL.md")
            if not os.path.isfile(p):
                bad.append(f"{rel}/{n}: no SKILL.md")
                continue
            fm = frontmatter(read(p))
            if fm is None or fm_field(fm, "name") != n:
                bad.append(f"{rel}/{n}: frontmatter missing or name mismatch")
            elif not re.search(r"^description:\s*\S", fm, re.M):
                bad.append(f"{rel}/{n}: missing description")
    ids = {r["id"] for r in reg}
    for r in reg:
        if r["status"] == "stub" or not r["enabled"]:
            continue
        for host, rel in (("claude", ".claude/skills"), ("codex", ".agents/skills")):
            if host in r["hosts"] and r["id"] not in have[host]:
                bad.append(f"registry id {r['id']} ({host} host) has no {rel} folder")
    for host, rel in (("claude", ".claude/skills"), ("codex", ".agents/skills")):
        for n in sorted(have[host] - ids):
            bad.append(f"{rel}/{n} has no registry record")

    for f in os.listdir(os.path.join(LIB, "agents")):
        if not f.endswith(".md") or f == "README.md":
            continue
        n = f[:-3]
        if not os.path.isfile(os.path.join(ROOT, ".claude", "agents", f)):
            bad.append(f"agent {n} missing .claude/agents/{f}")
        toml = os.path.join(ROOT, ".codex", "agents", f"{n}.toml")
        if not os.path.isfile(toml):
            bad.append(f"agent {n} missing .codex/agents/{n}.toml")
        else:
            t = read(toml)
            for key in ("name", "description", "developer_instructions"):
                if not re.search(rf"^{key}\s*=", t, re.M):
                    bad.append(f".codex/agents/{n}.toml is missing {key}")

    dry = subprocess.run([sys.executable, os.path.join(TOOLS, "project.py"), "all", "--dry-run"],
                         capture_output=True, text=True, encoding="utf-8", errors="replace")
    out = dry.stdout + dry.stderr
    if dry.returncode != 0 or "HALT" in out:
        bad.append("project.py all --dry-run did not report OK:\n" + out)
    pending = sum(int(n) for n in re.findall(r"(\d+) write", out))
    if pending:
        bad.append(f"generated trees are stale: project.py all --dry-run plans {pending} write(s); "
                   "run `python library/tools/project.py all` and commit")

    # plugin manifest: every component path exists inside the repo (claude plugin validate
    # is the authoritative check; this catches the drift project.py cannot see)
    pj = os.path.join(ROOT, ".claude-plugin", "plugin.json")
    if not os.path.isfile(pj):
        bad.append("missing .claude-plugin/plugin.json (run `python library/tools/project.py plugin`)")
    else:
        manifest = json.load(open(pj, encoding="utf-8"))
        paths = [manifest.get("skills", "")] + list(manifest.get("agents", []))
        for rel in filter(None, paths):
            if not rel.startswith("./") or not os.path.exists(os.path.join(ROOT, rel)):
                bad.append(f"plugin.json path {rel!r} must start with ./ and exist")

    for rel, cap in LINE_CAPS.items():
        p = os.path.join(ROOT, rel)
        if os.path.isfile(p):
            n = len(read(p).splitlines())
            if n > cap:
                bad.append(f"{rel} is {n} lines (cap {cap})")

    norm = lambda t: re.sub(r"\s+", " ", re.sub(r"[^a-zA-Z0-9 ]", " ", t)).lower().strip()
    agents_words = norm(read(os.path.join(ROOT, "AGENTS.md")))
    for line in read(os.path.join(ROOT, "CLAUDE.md")).splitlines():
        w = norm(line).split()
        for i in range(len(w) - 15):
            window = " ".join(w[i:i + 16])
            if window in agents_words:
                bad.append(f"CLAUDE.md shares a 16-word run with AGENTS.md: '{window}'")
                break

    markers = ("[" + "TODO", "TODO" + ":")
    for dp, dns, fns in os.walk(ROOT):
        dns[:] = [d for d in dns if d not in TODO_SKIP]
        for fn in fns:
            if not fn.endswith((".md", ".py", ".ps1", ".json", ".toml", ".mjs", ".js")):
                continue
            p = os.path.join(dp, fn)
            if any(m in read(p) for m in markers):
                bad.append(f"unresolved TODO marker in {os.path.relpath(p, ROOT)}")


# ------------------------------------------------------------------ project
def check_project(path):
    path = os.path.abspath(path)
    for name in PROJECT_CONTEXT:
        p = os.path.join(path, name)
        if not os.path.isfile(p):
            bad.append(f"missing project context file: {name}")
        elif not read(p).strip():
            bad.append(f"empty project context file: {name}")
    router = os.path.join(path, "CODEX.md")
    if os.path.isfile(router) and len(read(router).splitlines()) > 120:
        bad.append("CODEX.md is over 120 lines; keep the router short")
    return path


def main(argv):
    if argv[:1] == ["--project"]:
        if len(argv) < 2:
            print(__doc__)
            return 2
        path = check_project(argv[1])
        label = f"project context {path}"
    else:
        folders, reg = check_library()
        check_system(reg)
        print(f"skills {len(folders)} | registry records {len(reg)}")
        label = "library + system"
    for b in bad:
        print("FAIL ", b)
    print(f"\nCLEAN ({label})" if not bad else f"\n{len(bad)} problem(s)")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
