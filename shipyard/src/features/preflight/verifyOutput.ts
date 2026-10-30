/**
 * Reads what `python library/tools/verify.py --plan <file>` prints. Shipyard never runs the check; the
 * owner runs it and pastes the output, so the result is User-reported, not Verified.
 *
 * verify.py ends with `CLEAN (run plan <path>)`, or `N problem(s)` after one `FAIL ...` line per problem.
 */
export type VerifyParse = { ok: true; problems: 0; clean: true; lines: string[] } | { ok: true; problems: number; clean: false; lines: string[] } | { ok: false; reason: string };

const MAX_PASTE = 20_000;

export function parseVerifyOutput(text: string): VerifyParse {
  if (text.length > MAX_PASTE) return { ok: false, reason: 'That is too long to be verify.py output. Paste only what the command printed.' };
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const fails = lines.filter((l) => /^FAIL\b/.test(l));
  const clean = lines.some((l) => /^CLEAN\b/.test(l));
  const count = lines.map((l) => /^(\d+) problem\(s\)$/.exec(l)).find((m) => m !== null);
  if (clean && !count && fails.length === 0) return { ok: true, clean: true, problems: 0, lines };
  if (count) return { ok: true, clean: false, problems: Number(count[1]), lines };
  if (clean) return { ok: false, reason: 'The output says CLEAN but also lists FAIL lines. Paste the output of one run.' };
  return { ok: false, reason: 'That is not verify.py --plan output. Expect a last line of "CLEAN (run plan ...)" or "N problem(s)".' };
}

/** "CLEAN" or "3 problems", the words the logbook row uses. */
export function verifyWords(problems: number): string {
  return problems === 0 ? 'CLEAN' : `${problems} ${problems === 1 ? 'problem' : 'problems'}`;
}
