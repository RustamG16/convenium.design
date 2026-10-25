#!/usr/bin/env python3
"""project.py — project library/ into the host trees. stdlib only.

    python library/tools/project.py <claude|codex|studio|digest|plugin|all> [--dry-run]

A generated tree is disposable: editing one is a defect; this overwrites it. Every generated
root carries GENERATED.md (source + rebuild command) and MANIFEST.txt (every file written).

Delete budget: a file is deleted only if its exact path is in that root's previous
MANIFEST.txt AND the root has a GENERATED.md. Anything else is a hard halt. On a first run
(no MANIFEST.txt) the generator writes only and deletes nothing.
"""
import json, os, re, shutil, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LIB = os.path.join(ROOT, "library")
REG_PATH = os.path.join(LIB, "registry", "skills.registry.json")

REG = json.load(open(REG_PATH, encoding="utf-8"))
# normalise `enabled` from phase before any projection emits it: pipeline-routed skills
# are enabled, the unrouted capability library is not. apollo_get_context filters on this.
for _r in REG:
    _r["enabled"] = _r.get("phase") != "unrouted"

BY_ID = {r["id"]: r for r in REG}
REGISTRY = {"skills": REG,
            "tools": json.load(open(os.path.join(LIB, "registry", "tools.json"), encoding="utf-8")),
            "plugins": json.load(open(os.path.join(LIB, "registry", "plugins.json"), encoding="utf-8")),
            "presets": json.load(open(os.path.join(LIB, "registry", "presets.json"), encoding="utf-8"))}

AGENTS_DIR = os.path.join(LIB, "agents")
AGENTS = {}
for f in sorted(os.listdir(AGENTS_DIR)):
    if not f.endswith(".md") or f == "README.md":
        continue
    txt = open(os.path.join(AGENTS_DIR, f), encoding="utf-8").read()
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", txt, re.S)
    fm = {}
    for line in m.group(1).splitlines():
        mm = re.match(r"^([A-Za-z_-]+):\s*(.*)$", line)
        if mm:
            fm[mm.group(1)] = mm.group(2).strip()
    body = m.group(2)
    body = re.sub(r"^# .+?\n\n", "", body, count=1, flags=re.S)  # drop the "# name" heading
    AGENTS[f[:-3]] = {"fm": fm, "body": body.strip("\n")}

READONLY_TOOLS = "Read, Glob, Grep, Bash, WebFetch"
WRITE_TOOLS = READONLY_TOOLS + ", Write, Edit, NotebookEdit"


class Plan:
    def __init__(self, root_abs, source_desc, rebuild_cmd):
        self.root = root_abs
        self.source = source_desc
        self.rebuild = rebuild_cmd
        self.files = {}   # relpath (posix, from root) -> str content

    def add(self, rel, content):
        self.files[rel.replace("\\", "/")] = content

    # ---- manifest / delete budget --------------------------------------
    def _manifest_path(self):
        return os.path.join(self.root, "MANIFEST.txt")

    def _prev_manifest(self):
        p = self._manifest_path()
        if not os.path.isfile(p):
            return None
        return set(l.strip() for l in open(p, encoding="utf-8") if l.strip())

    def _has_generated_md(self):
        return os.path.isfile(os.path.join(self.root, "GENERATED.md"))

    def _existing_managed(self, managed_pred):
        out = set()
        for dp, _, fns in os.walk(self.root):
            for fn in fns:
                ap = os.path.join(dp, fn)
                rel = os.path.relpath(ap, self.root).replace("\\", "/")
                if managed_pred(rel):
                    out.add(rel)
        return out

    def reconcile(self, managed_pred):
        """returns (writes, deletes, halt_reason|None)"""
        planned = set(self.files) | {"GENERATED.md", "MANIFEST.txt"}
        existing = self._existing_managed(managed_pred)
        writes = []
        for rel, content in sorted(self.files.items()):
            ap = os.path.join(self.root, rel)
            old = open(ap, encoding="utf-8").read() if os.path.isfile(ap) else None
            if old != content:
                writes.append(rel)
        stale = sorted(existing - planned)
        prev = self._prev_manifest()
        if prev is None:
            return writes, [], None            # first run: write only
        if stale and not self._has_generated_md():
            return writes, stale, f"{self.root}: {len(stale)} stale file(s) but no GENERATED.md"
        illegal = [s for s in stale if s not in prev]
        if illegal:
            return writes, stale, (f"{self.root}: refuse to delete {len(illegal)} file(s) not in "
                                   f"previous MANIFEST.txt: " + ", ".join(illegal[:8]))
        return writes, stale, None

    def apply(self, managed_pred, dry_run):
        writes, deletes, halt = self.reconcile(managed_pred)
        tag = "[dry-run] " if dry_run else ""
        print(f"{tag}{os.path.relpath(self.root, ROOT)}: {len(writes)} write(s), {len(deletes)} delete(s)")
        if halt:
            print("  HALT:", halt)
            return False
        if dry_run:
            for w in writes[:6]:
                print("   +", w)
            if len(writes) > 6:
                print(f"   … +{len(writes) - 6} more")
            for d in deletes:
                print("   -", d)
            return True
        for rel, content in self.files.items():
            ap = os.path.join(self.root, rel)
            os.makedirs(os.path.dirname(ap), exist_ok=True)
            write_text(ap, content)
        for rel in deletes:
            os.remove(os.path.join(self.root, rel))
        # prune now-empty dirs
        for dp, dns, fns in os.walk(self.root, topdown=False):
            if not os.listdir(dp) and dp != self.root:
                os.rmdir(dp)
        man = sorted(self.files) + ["GENERATED.md", "MANIFEST.txt"]
        write_text(os.path.join(self.root, "GENERATED.md"),
                   f"# GENERATED — do not edit\n\nSource: {self.source}\nRebuild: `{self.rebuild}`\n\n"
                   f"Every file listed in `MANIFEST.txt` is overwritten on each rebuild. Hand edits are lost.\n")
        write_text(os.path.join(self.root, "MANIFEST.txt"), "\n".join(sorted(set(man))) + "\n")
        return True


def write_text(path, content, attempts=5):
    """Write LF text. Retries briefly: on Windows a running host (e.g. a Claude Code
    session watching .claude/skills) can hold a file open and fail the write with EINVAL."""
    for i in range(attempts):
        try:
            with open(path, "w", encoding="utf-8", newline="\n") as fh:
                fh.write(content)
            return
        except OSError:
            if i == attempts - 1:
                raise
            time.sleep(0.5 * (i + 1))


def copy_skill_body(sid):
    """return {relpath: content} for every file in the library skill folder."""
    rec = BY_ID[sid]
    src = os.path.join(LIB, "skills", rec["category"], sid)
    out = {}
    for dp, _, fns in os.walk(src):
        for fn in fns:
            ap = os.path.join(dp, fn)
            rel = os.path.relpath(ap, src).replace("\\", "/")
            try:
                out[rel] = open(ap, encoding="utf-8").read()
            except UnicodeDecodeError:
                out[rel] = open(ap, encoding="utf-8", errors="replace").read()
    return out


CLAUDE_LOCATE = ("> **Where Apollo lives.** Paths such as `AGENTS.md`, `START-HERE.md`, `templates/` "
                 "and `library/` are relative to the Apollo folder: `${CLAUDE_PLUGIN_ROOT}` when Apollo "
                 "is installed as a plugin, otherwise the folder named in the project's "
                 "`.olympus/APOLLO.md`, or the current repository when you are working inside Apollo.\n\n")
CODEX_LOCATE = ("Where Apollo lives: paths such as AGENTS.md, START-HERE.md, templates/ and library/ are "
                "relative to the Apollo folder named in the project's .olympus/APOLLO.md, or the current "
                "repository when working inside Apollo.\n\n")


def claude_agent(name):
    a = AGENTS[name]
    ro = a["fm"].get("access") == "read-only"
    body = CLAUDE_LOCATE + re.sub(r"\$([a-z][a-z0-9-]+)",
                                  lambda m: f"the *{m.group(1)}* skill (Skill tool)", a["body"])
    fm = ["---", f"name: {name}", f"description: {a['fm']['description']}",
          f"tools: {READONLY_TOOLS if ro else WRITE_TOOLS}"]
    if a["fm"].get("skills"):
        fm.append(f"skills: {a['fm']['skills']}")
    fm += ["---", "", body, ""]
    return "\n".join(fm)


def codex_agent(name):
    a = AGENTS[name]
    lines = [f'name = "{name}"', f'description = "{a["fm"]["description"]}"']
    if a["fm"].get("access") == "read-only":
        lines.append('sandbox_mode = "read-only"')
    lines.append('developer_instructions = """')
    lines.append(CODEX_LOCATE + a["body"])
    lines.append('"""')
    return "\n".join(lines) + "\n\n"


# ------------------------------------------------- Claude projection policy
# Claude Code loads EVERY .claude/skills/*/SKILL.md frontmatter into the system
# prompt on EVERY turn. Projecting the whole library cost ~7,310 tok/turn, of
# which ~5,208 was unrouted capability skills no pipeline phase ever routes to.
#
# Policy: project the pipeline-routed skills, plus the short allowlist below of
# capabilities that are genuinely invoked by hand. Everything else stays in
# library/skills/ and is reached the way AGENTS.md already prescribes — route
# from registry/ROUTING-DIGEST.md or registry/UNROUTED.md, then load one body.
# Nothing is deleted from the library; only the host projection is narrowed.
#
# To re-project a dropped skill, add its id here and rerun:
#   python library/tools/project.py claude
MANUAL_CLAUDE_SKILLS = {
    "image",                        # generic image generation
    "animate",                      # build motion from scratch
    "prototype",                    # multiple UI variants behind a picker
    "pick-ui-library",              # choose the right frontend library
    "garden-web-design-engineer",   # polished HTML/CSS/JS artifacts
}


def project_to_claude(r):
    """True when this registry record belongs in .claude/skills."""
    if "claude" not in r["hosts"] or r["status"] == "stub":
        return False
    if r.get("phase") != "unrouted":
        return True                      # pipeline-routed: always projected
    return r["id"] in MANUAL_CLAUDE_SKILLS


# ---------------------------------------------------------------- targets
def build_claude(dry):
    ok = True
    ps = Plan(os.path.join(ROOT, ".claude", "skills"),
              "library/skills (routed + MANUAL_CLAUDE_SKILLS; see project_to_claude)",
              "python library/tools/project.py claude")
    for r in REG:
        if not project_to_claude(r):
            continue
        for rel, c in copy_skill_body(r["id"]).items():
            ps.add(f"{r['id']}/{rel}", c)
    ok &= ps.apply(lambda rel: True, dry)

    pa = Plan(os.path.join(ROOT, ".claude", "agents"),
              "library/agents", "python library/tools/project.py claude")
    for name in AGENTS:
        pa.add(f"{name}.md", claude_agent(name))
    ok &= pa.apply(lambda rel: rel.endswith(".md"), dry)
    return ok


def build_codex(dry):
    ok = True
    ps = Plan(os.path.join(ROOT, ".agents", "skills"),
              "library/skills (hosts includes 'codex')",
              "python library/tools/project.py codex")
    for r in REG:
        if "codex" not in r["hosts"] or r["status"] == "stub":
            continue
        for rel, c in copy_skill_body(r["id"]).items():
            ps.add(f"{r['id']}/{rel}", c)
    ok &= ps.apply(lambda rel: True, dry)

    pa = Plan(os.path.join(ROOT, ".codex", "agents"),
              "library/agents", "python library/tools/project.py codex")
    for name in AGENTS:
        pa.add(f"{name}.toml", codex_agent(name))
    ok &= pa.apply(lambda rel: rel.endswith(".toml"), dry)
    return ok


def build_studio(dry):
    root = os.path.join(ROOT, "apollo-studio", "knowledge", "skills")
    p = Plan(root, "library/registry + library/skills (hosts includes 'studio')",
             "python library/tools/project.py studio")
    for r in REG:
        if "studio" not in r["hosts"]:
            continue
        grp = r["group"].lower().replace(" ", "-")
        rp = os.path.join(LIB, "skills", r["category"], r["id"], "SKILL.md")
        body = ""
        if os.path.isfile(rp):
            t = open(rp, encoding="utf-8").read()
            mm = re.match(r"^---\s*\n.*?\n---\s*\n(.*)$", t, re.S)
            body = (mm.group(1).strip() if mm else t.strip())
        readme = (f"# {r['name']}\n\n- Category: {r['group']}\n- Phase: {r['phase']}\n"
                  f"- Status: {r['status']}\n- Routed: {'yes' if r['enabled'] else 'no'}\n"
                  f"- Skill ID: {r['id']}\n\n{r['description']}\n")
        if r.get("runtimePrompt"):
            readme += f"\n## Runtime instructions\n\n{r['runtimePrompt']}\n"
        p.add(f"{grp}/{r['id']}/README.md", readme)
    # the studio's data file
    p.files_registry = json.dumps(REGISTRY, indent=2, ensure_ascii=False) + "\n"
    reg_target = os.path.join(ROOT, "apollo-studio", "skills.registry.json")

    managed = lambda rel: rel.endswith("/README.md") or rel in ("GENERATED.md", "MANIFEST.txt")
    ok = p.apply(managed, dry)
    # skills.registry.json lives one level up — handle separately, never delete
    old = open(reg_target, encoding="utf-8").read() if os.path.isfile(reg_target) else None
    if old != p.files_registry:
        print(f"{'[dry-run] ' if dry else ''}apollo-studio/skills.registry.json: 1 write")
        if not dry:
            write_text(reg_target, p.files_registry)
    return ok


def build_digest(dry):
    target = os.path.join(LIB, "registry", "ROUTING-DIGEST.md")
    active = [r for r in REG if r["phase"] != "unrouted"]
    order = {"always": 0, "diagnose": 1, "direct": 2, "prepare": 3, "build": 4, "verify": 5}
    active.sort(key=lambda r: (order.get(r["phase"], 9), r["id"]))
    lines = ["# Routing digest", "",
             "One line per pipeline-active skill. Route from this table, then follow the "
             "two-stage skill-loading rule in `AGENTS.md`.",
             f"Unrouted skills ({sum(1 for r in REG if r['phase']=='unrouted')}) are in "
             "`UNROUTED.md` — capabilities, invoked explicitly, not part of the pipeline.", "",
             "| Skill | Phase | Line |", "|---|---|---|"]
    for r in active:
        d = r["description"].split(". ")[0].replace("|", "\\|")
        if len(d) > 110:
            d = d[:107] + "…"
        lines.append(f"| `{r['id']}` | {r['phase']} | {d} |")
    content = "\n".join(lines) + "\n"
    write_if_changed(target, content, dry, f"{len(active)} active skills")

    unrouted = sorted((r for r in REG if r["phase"] == "unrouted"), key=lambda r: (r["category"], r["id"]))
    lines = ["# Unrouted skills", "",
             "Generated by `python library/tools/project.py digest` — do not edit. These skills are "
             "in the library and projected to their hosts, but have no phase in Apollo's pipeline. "
             "They are capabilities, invoked explicitly, and are excluded from `ROUTING-DIGEST.md`.",
             "", f"Count: {len(unrouted)}"]
    cat = None
    for r in unrouted:
        if r["category"] != cat:
            cat = r["category"]
            lines += ["", f"## {cat}", ""]
        d = " ".join(r["description"].split())
        lines.append(f"- `{r['id']}` - {d[:140]}")
    write_if_changed(os.path.join(LIB, "registry", "UNROUTED.md"), "\n".join(lines) + "\n", dry,
                     f"{len(unrouted)} unrouted skills")
    return True


def write_if_changed(target, content, dry, note):
    old = open(target, encoding="utf-8").read() if os.path.isfile(target) else None
    n = 0 if old == content else 1
    print(f"{'[dry-run] ' if dry else ''}{os.path.relpath(target, ROOT)}: {n} write ({note})")
    if not dry and n:
        write_text(target, content)


PLUGIN_VERSION = "0.4.0"


def build_plugin(dry):
    """Claude Code plugin + single-plugin marketplace, rooted at the repo itself.

    Install: `/plugin marketplace add <this folder | RustamG16/convenium.design>` then
    `/plugin install apollo@apollo`. Skills become `apollo:<id>`, agents `apollo:<name>`,
    so nothing collides with same-named personal or plugin skills. `agents` must list
    files (a directory is rejected); `skills` may be a directory.
    """
    plugin = {
        "name": "apollo",
        "version": PLUGIN_VERSION,
        "description": ("Gated design agency: a Brand DNA strategist, one Design Director and five "
                        "specialists that take a business from intake to a verified, built design."),
        "author": {"name": "Rustam Gurbanov"},
        "repository": "https://github.com/RustamG16/convenium.design",
        "license": "SEE LICENSE IN third-party/VERSIONS.md",
        "keywords": ["design", "website", "brand", "agents"],
        "skills": "./.claude/skills/",
        "agents": [f"./.claude/agents/{n}.md" for n in AGENTS],
    }
    market = {
        "name": "apollo",
        "owner": {"name": "Rustam Gurbanov"},
        "description": "Apollo design system — one plugin, rooted at this repository.",
        "plugins": [{"name": "apollo", "source": "./", "description": plugin["description"]}],
    }
    d = os.path.join(ROOT, ".claude-plugin")
    if not dry:
        os.makedirs(d, exist_ok=True)
    write_if_changed(os.path.join(d, "plugin.json"), json.dumps(plugin, indent=2) + "\n", dry, "plugin manifest")
    write_if_changed(os.path.join(d, "marketplace.json"), json.dumps(market, indent=2) + "\n", dry, "marketplace")
    return True


TARGETS = {"claude": build_claude, "codex": build_codex, "studio": build_studio,
           "digest": build_digest, "plugin": build_plugin}


def main(argv):
    if not argv or argv[0] not in list(TARGETS) + ["all"]:
        print(__doc__)
        return 2
    dry = "--dry-run" in argv
    names = list(TARGETS) if argv[0] == "all" else [argv[0]]
    ok = True
    for n in names:
        print(f"\n== {n} ==")
        ok &= TARGETS[n](dry)
    print("\n" + ("OK" if ok else "HALT"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
