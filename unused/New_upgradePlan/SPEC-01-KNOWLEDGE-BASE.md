# Spec 01 — the shared knowledge base

> **2026-09-07 amendment — planning only.** The design below is historical and must be read with [MASTERPLAN.md](MASTERPLAN.md) §4. Its corrections supersede conflicting requirements below. No implementation is authorized.
>
> - Keep an independent CLI/digest fallback; do not make the Studio MCP server a runtime dependency. Share query logic outside the UI layer.
> - Add host/status/agency filtering, namespaced IDs, schema/index versions, stable section IDs, atomic rebuild, deletion cleanup and stale-index detection. Agency is not a client security boundary.
> - Bound the full response including metadata, not just excerpts. Define pagination/truncation for long sections and safe path resolution for get().
> - FTS is lexical search, not an evaluator of prose activation conditions. Mandatory rules bypass relevance ranking. Parameterize queries and handle invalid MATCH input.
> - Re-measure payload/token baseline; 21,992 bytes is historical. Test at least 30 labeled routing cases including unsupported hosts, mandatory rules and no-match. Ten sampled matches alone are insufficient.
> - The three verbs are a small starting API, not a ban on needed health/version operations. The agency column can be added through migration; it is not uniquely impossible to retrofit.
> - A document read is not inherently a defect. Adopt retrieval only when bounded responses preserve required routing behavior and reduce measured overhead.

**Status:** approved in principle 2026-09-03. Sub-project 1 of 4.
**Goal:** agents retrieve what they need without loading it. One KB, all agencies, Design first.

---

## 1. The problem, measured

`convenium_design_get_context` ships **31 skills / 21,992 bytes** on every task (`PROGRESS.md`,
Phase 8). That is ~5.5K tokens spent before any work begins, on every request, whether or
not the task needs any of it. `ROUTING-DIGEST.md` is likewise *loaded* in order to route.

Convenium.Design's own two-stage loading rule is correct — route from a digest, then load one body.
The defect is that stage one is a **document read** rather than a **query**. Documents grow;
queries don't.

Bennett's formulation of the same rule (`SOURCE-ANALYSIS.md` §4): *map first, read narrowly*
and *cap the return, not the work*.

## 2. The move

> The agent never loads the index. It queries it.

A query returns five ranked ~400-character excerpts with their file paths — roughly 1K
tokens — and the agent reads a full file only when it decides it needs to.

## 3. Shape

One file: `library/kb.db`. SQLite, FTS5. Built from the markdown; **the markdown stays the
source of truth**. The DB stores paths and hashes and is fully rebuildable, so it is
gitignored.

```sql
-- one row per file
CREATE TABLE doc (
  id          TEXT PRIMARY KEY,   -- stable slug
  agency      TEXT NOT NULL,      -- 'shared' | 'design' | 'marketing' | ...
  corpus      TEXT NOT NULL,      -- 'skill'|'knowledge'|'doctrine'|'design-dna'|'agent'
  title       TEXT NOT NULL,
  path        TEXT NOT NULL,      -- repo-relative, what the agent opens
  hash        TEXT NOT NULL,      -- content hash; drives incremental rebuild
  updated_at  TEXT NOT NULL
);

-- one row per '##' section
CREATE TABLE chunk (
  doc_id   TEXT NOT NULL REFERENCES doc(id),
  ord      INTEGER NOT NULL,
  heading  TEXT,
  text     TEXT NOT NULL,
  PRIMARY KEY (doc_id, ord)
);

-- the search index
CREATE VIRTUAL TABLE chunk_fts USING fts5(
  heading, text, doc_id UNINDEXED, tokenize='porter unicode61'
);

-- the 84 registry records, made queryable
CREATE TABLE skill (
  id                TEXT PRIMARY KEY,
  agency            TEXT NOT NULL,
  category          TEXT NOT NULL,
  phase             TEXT NOT NULL,   -- always|diagnose|direct|prepare|build|verify|unrouted
  enabled           INTEGER NOT NULL,
  routing_condition TEXT,
  doc_id            TEXT REFERENCES doc(id)
);

-- relations; unused by agents, feeds the console later
CREATE TABLE edge (
  from_id TEXT NOT NULL,
  to_id   TEXT NOT NULL,
  kind    TEXT NOT NULL   -- 'buildsOn' | 'breaksInto' | 'replaces'
);
```

### Why `agency` is a column and not a folder

Every query filters `agency IN ('shared', :current)`. Design is populated now; Marketing
rows simply do not exist yet. Adding agency #2 is inserting rows, not restructuring
anything. This is the single decision that has to be made *before* the Design Agency is
finished rather than after — everything else can be retrofitted, this can't.

## 4. Interface — three verbs, no more

```
search(q, agency, corpus?, limit=5, chars=400)
    -> [{ path, heading, excerpt, score, corpus }]
    Ranked FTS5. Bounded by construction: limit x chars caps the return.

get(path, heading?)
    -> { path, heading, text }
    One section. Never the whole file unless heading is omitted AND the file is small.

route(phase, situation)
    -> [{ id, routing_condition, path }]
    Replaces loading ROUTING-DIGEST.md. Returns only the rows whose phase matches and
    whose routing condition could plausibly fire, as one line each.
```

Nothing else. A fourth verb is a design smell — if an agent needs something these three
can't express, the schema is wrong.

## 5. Where it lives

- **Builder — Python.** `library/tools/kb.py build [--full]`. Joins the existing
  `library/tools/` chain (`project.py`, `verify.py`, `build_index.py`); `sqlite3` is stdlib.
  Walks `library/`, splits on `##`, hash-skips unchanged docs. Idempotent.
- **Query — Node.** A tool on the **existing convenium-design-studio MCP server**, beside
  `convenium_design_get_context`. Agents call it directly; no shell hop.
- Both talk to the same file. Neither owns it.

## 6. Acceptance test

This is the whole justification, so it is a hard gate, not a hope:

| Check | Target |
|---|---|
| `route()` replacing the `convenium_design_get_context` payload | **< 1K tokens** vs 21,992 bytes today (~5x) |
| A routing decision made from `route()` | identical skill selection to today's digest, on 10 sampled tasks |
| `search()` return size | bounded by `limit x chars`, never unbounded |
| `kb build` re-run with no changes | 0 writes (idempotent, hash-skipped) |
| Agents' instructions | **unchanged in behaviour** — they route and load exactly as before |

If the first row fails, the design failed. Change it rather than shipping it.

## 7. Build order

1. `kb.py build` + schema. Index `library/` as it stands. No agent touches it yet.
2. Verify counts against `verify.py` (84 skills / 84 records) — the KB must not invent or
   lose rows.
3. The three verbs as an MCP tool. Read-only. Still nothing depends on it.
4. Switch **one** agent's routing from the loaded digest to `route()`. Measure.
5. If the acceptance test passes, switch the rest. If not, stop here — nothing is broken,
   the old path still works.

Steps 1–3 are additive and reversible. Step 4 is the only one that changes behaviour.

## 8. Deliberately not in scope

- **Embeddings / semantic search.** The same three verbs get a vector index later without
  changing a single agent instruction. Not in the prototype.
- **Writing from agents.** The KB is read-only to agents. Markdown stays the write path.
- **Hosting.** Local file. Multi-machine access is a later problem and a different spec.
- **The console.** Sub-project 4. `edge` exists so the console doesn't need a migration.

## 9. Risks

1. **FTS5 availability.** Bundled in CPython's sqlite3 on Windows in practice, but verify in
   step 1 before building anything on it. Fallback is `LIKE` + manual ranking, worse but not
   fatal.
2. **Chunking on `##` is crude.** Files with no headings become one giant chunk and blow the
   `chars` bound. Builder must hard-split any chunk over ~1,200 chars.
3. **Hash-skip hides staleness.** If a file is edited without its hash changing (it can't,
   but if the hash covers the wrong bytes) the KB silently serves old text. `verify.py`
   should re-hash on a `--full` run.
4. **Two languages, one file.** Python writes, Node reads. Schema drift is the failure mode.
   The DDL above lives in exactly one place and both sides load it from there.
5. **The 21,992-byte payload might be load-bearing.** If some agent silently relies on
   seeing all 31 skills, `route()` will break it. That is what step 4's single-agent trial
   is for.
