# Convenium.Design notes — implementing-secret-scanning-with-gitleaks

- **Source:** https://github.com/mukul975/Anthropic-Cybersecurity-Skills, `skills/implementing-secret-scanning-with-gitleaks/` at commit `54a798831d2266a3ca61ce68a7acb80b81160d57` (author "mahipal"). Despite the repository name it is **not affiliated with Anthropic**.
- **Licence:** Apache-2.0 (`LICENSE` in this folder).
- **Vendored:** 2026-10-09. Text files only — upstream `scripts/agent.py` and `scripts/process.py` were deliberately **not** copied or run.

## Corrections — these override the skill body
1. `gitleaks detect` / `gitleaks protect` are deprecated since v8.19. Use `gitleaks git <path>` (full history: `--log-opts="--all"`), `gitleaks dir <path>`, and `gitleaks git --pre-commit --staged`. `references/api-reference.md` already uses the new form.
2. Prefer Docker with a pinned tag, e.g. `docker run --rm -v "$PWD:/repo" ghcr.io/gitleaks/gitleaks:v8.x.y git /repo --log-opts="--all" --redact -f json -r /repo/gitleaks-report.json`. Never `:latest`; never `curl | sudo mv`.
3. Pin every action to a full commit SHA, not `@v4`/`@v2` (see `06-ops-security/open-sourcing`, Step 6). `gitleaks-action@v2` needs a paid licence for organisation accounts.
4. Step 6's `git push --force --all` is never run without the repository owner's explicit approval. **Rotate first**, then decide on a history rewrite.
