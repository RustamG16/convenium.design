# Convenium.Design notes — open-sourcing

- **Source:** https://github.com/trailofbits/skills, `plugins/open-sourcing/skills/open-sourcing/` at commit `82fe8226252622fa807643bdca1710901198553a` (plugin 0.1.2, author Evan Sultanik, Trail of Bits).
- **Licence:** CC BY-SA 4.0 (repository licence). Attribution: © Trail of Bits. Any adaptation of these files must stay CC BY-SA 4.0.
- **Vendored:** 2026-10-09, unmodified. Files were read in full before install; the two shell scripts only run read-only `git` queries.
- **Why it is in Convenium.Design:** full-history secret hygiene (Step 2) and GitHub Actions hardening — SHA-pinned actions, `permissions: {}`, zizmor/actionlint (Step 6). Used first for the Convenium Studio GoDaddy deploy (2026-10-09).
- **Convenium.Design caveat:** Step 2's "fresh repository instead of history rewrite" is about making a private repo public. For a repo that is already public and leaked a key, rotation comes first; any history rewrite needs the owner's explicit approval.
