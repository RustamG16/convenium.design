---
id: queue-001
title: Pending capture — sources supplied but not yet ingested
updated: '2026-08-28'
---

# Pending capture

Sources supplied on 2026-08-28 that MNEMOSYNE has **not** ingested. Added to
`inbox/saved.txt` so the next `ingest` run picks them up.

| URL | What it is | Status |
|---|---|---|
| `https://www.instagram.com/reels/DcWQCQdN28T/` | Unknown — supplied without description | **New.** Not in `saved.txt` before today. Nothing is known about its contents; nothing has been assumed. |
| `https://www.instagram.com/p/Db0wyP_Ev1G/` | divyannshisharma carousel — the skill slides behind [canvas-design](../03-skill-briefs/canvas-design.md), [systematic-debugging](../03-skill-briefs/systematic-debugging.md) and [algorithmic-art](../03-skill-briefs/algorithmic-art.md) | Three slides analysed from supplied screenshots. **The other ~9 slides have not been seen.** |
| lvl_aiautomations — "TOP 5 Claude open repos" | Reel; URL not supplied, only a screenshot | Content captured in [claude-code-repo-stacks.md](../02-tool-inventories/claude-code-repo-stacks.md). **Needs its URL** to be ingestible. |

## Already ingested — do not re-add

| URL | Record |
|---|---|
| `instagram.com/p/Db19yltF-zL/` | `src-0001` → [ibraviz-21-installs](../02-tool-inventories/ibraviz-21-installs.md) |
| `instagram.com/p/DbcJ2RUjPK4/` | `src-0002` → [ibraviz-42-skills-7-crews](../02-tool-inventories/ibraviz-42-skills-7-crews.md) |
| `instagram.com/reel/DcN-pkGBLHE/` | `src-0003` → [claude-code-repo-stacks](../02-tool-inventories/claude-code-repo-stacks.md) |
| `instagram.com/reel/DcCpkSVhprW/` | `src-0004` → [six-files-before-code](../00-rules/six-files-before-code.md) |
| `instagram.com/reel/DbYh2P-MQnj/` | `src-0005` → [system-map-ui](../04-ui-references/system-map-ui.md) |

## To run

```bash
python -m mnemosyne ingest inbox/saved.txt
```

Already-ingested links are skipped automatically, so re-running the whole file is safe.
Ingestion needs a cookie file for Instagram — the same blocker recorded as step 5 in the
project README.
