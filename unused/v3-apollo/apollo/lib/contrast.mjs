#!/usr/bin/env node
/**
 * contrast.mjs — WCAG 2.1 contrast checker for an Apollo brandspec.
 *
 * A hand-written contrast ratio is a claim. A computed one is a fact. Apollo
 * never writes a ratio into a spec by hand, so this runs before any token set
 * or handoff goes out.
 *
 * Two modes, and the difference matters:
 *
 *   Declared pairs  (brandspec.contrastPairs[]) are ENFORCED. These are the
 *                   combinations that actually occur in the design. A failure
 *                   here exits 1.
 *   Full matrix     is ADVISORY. Most token pairs never appear together, so
 *                   failing the build on them would be noise. Reported, never
 *                   fatal.
 *
 * A combination that cannot occur should be declared forbidden in the token's
 * `rule`, not left untested — "untested" and "not allowed" look identical in a
 * spec sheet and are not the same thing.
 *
 * Usage:
 *   node lib/contrast.mjs <brandspec.json> [--write] [--matrix] [--json]
 *
 *   --write    write the computed results back into the spec's `contrast` block
 *   --matrix   also print the full N×N advisory matrix
 *   --json     emit JSON only (for the eval runner)
 *
 * Exit 0 = every declared pair passes. Exit 1 = at least one declared failure,
 * or the spec could not be read.
 *
 * No dependencies. Node 14+.
 */

import { readFileSync, writeFileSync } from 'node:fs';

/* ---------- WCAG 2.1 relative luminance and contrast ---------------------- */

/** Parse #RGB, #RRGGBB, #RRGGBBAA, or rgb()/rgba() into [r,g,b] 0-255. */
export function parseColor(input) {
  if (typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();

  const hex = s.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
    if (h.length === 8) h = h.slice(0, 6);
    if (h.length !== 6) return null;
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }

  const rgb = s.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const parts = rgb[1].split(/[,\s/]+/).filter(Boolean).slice(0, 3);
    if (parts.length !== 3) return null;
    const vals = parts.map((p) =>
      p.endsWith('%') ? Math.round((parseFloat(p) / 100) * 255) : parseFloat(p)
    );
    return vals.some(Number.isNaN) ? null : vals;
  }

  return null;
}

/** WCAG 2.1 relative luminance. */
export function luminance([r, g, b]) {
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** Contrast ratio, 1..21, rounded to 2dp. */
export function contrastRatio(fg, bg) {
  const a = parseColor(fg);
  const b = parseColor(bg);
  if (!a || !b) return null;
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/** Required ratio for a usage type under WCAG 2.1 AA. */
const THRESHOLD = { normal: 4.5, large: 3.0, ui: 3.0 };

export function evaluate(fg, bg, type = 'normal') {
  const ratio = contrastRatio(fg, bg);
  const required = THRESHOLD[type] ?? THRESHOLD.normal;
  if (ratio === null) return { fg, bg, type, ratio: null, required, pass: false, error: 'unparseable color' };
  return { fg, bg, type, ratio, required, pass: ratio >= required };
}

/* ---------- brandspec plumbing -------------------------------------------- */

/** Pull { name -> hex } out of tokens.color, tolerating both shapes. */
function colorTokens(spec) {
  const out = {};
  const colors = spec?.tokens?.color ?? {};
  for (const [name, entry] of Object.entries(colors)) {
    // Either { value, role, rule } or a bare hex string.
    const value = typeof entry === 'string' ? entry : entry?.value;
    if (parseColor(value)) out[name] = value;
  }
  return out;
}

/** Resolve "accent" or "#19E28D" to a hex. */
function resolve(token, tokens) {
  if (tokens[token]) return tokens[token];
  return parseColor(token) ? token : null;
}

function main(argv) {
  const args = argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  const specPath = args.find((a) => !a.startsWith('--'));
  const asJson = flags.has('--json');

  if (!specPath) {
    console.error('usage: node lib/contrast.mjs <brandspec.json> [--write] [--matrix] [--json]');
    return 1;
  }

  let spec;
  try {
    spec = JSON.parse(readFileSync(specPath, 'utf8'));
  } catch (err) {
    console.error(`cannot read ${specPath}: ${err.message}`);
    return 1;
  }

  const tokens = colorTokens(spec);
  const names = Object.keys(tokens);

  if (names.length === 0) {
    console.error('no parseable colors under tokens.color — nothing to check');
    return 1;
  }

  // --- declared pairs: enforced -------------------------------------------
  const declared = Array.isArray(spec.contrastPairs) ? spec.contrastPairs : [];
  const results = [];
  for (const pair of declared) {
    const fg = resolve(pair.fg, tokens);
    const bg = resolve(pair.bg, tokens);
    if (!fg || !bg) {
      results.push({ ...pair, ratio: null, pass: false, error: 'unknown token' });
      continue;
    }
    results.push({ ...evaluate(fg, bg, pair.type), fgToken: pair.fg, bgToken: pair.bg });
  }

  const failures = results.filter((r) => !r.pass);

  // --- advisory matrix ------------------------------------------------------
  const matrix = [];
  if (flags.has('--matrix') || declared.length === 0) {
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const r = evaluate(tokens[names[i]], tokens[names[j]], 'normal');
        matrix.push({ ...r, fgToken: names[i], bgToken: names[j] });
      }
    }
  }

  if (asJson) {
    console.log(JSON.stringify({ declared: results, matrix, failures: failures.length }, null, 2));
  } else {
    console.log('');
    console.log(`Contrast — ${specPath}`);
    console.log(`  colors: ${names.length}  declared pairs: ${declared.length}`);

    if (declared.length === 0) {
      console.log('');
      console.log('  No contrastPairs[] declared. Showing the advisory matrix only —');
      console.log('  declare the pairs that actually occur to make this enforcing.');
    } else {
      console.log('');
      console.log('  Declared pairs (enforced)');
      for (const r of results) {
        const mark = r.pass ? 'PASS' : 'FAIL';
        const ratio = r.ratio === null ? '  n/a' : String(r.ratio).padStart(5);
        const note = r.error ? `  <- ${r.error}` : '';
        console.log(`    ${mark}  ${ratio}:1  need ${r.required}  ${r.fgToken} on ${r.bgToken}${note}`);
      }
    }

    if (matrix.length > 0) {
      console.log('');
      console.log('  Full matrix (advisory — most of these never co-occur)');
      for (const r of matrix.sort((a, b) => (a.ratio ?? 0) - (b.ratio ?? 0))) {
        const mark = r.pass ? '   ' : ' ! ';
        console.log(`   ${mark} ${String(r.ratio).padStart(5)}:1  ${r.fgToken} / ${r.bgToken}`);
      }
    }
    console.log('');
  }

  // --- write back -----------------------------------------------------------
  if (flags.has('--write')) {
    spec.contrast = {
      checkedAt: new Date().toISOString(),
      standard: 'WCAG 2.1 AA',
      pairs: results.map(({ fgToken, bgToken, ratio, required, type, pass }) => ({
        fg: fgToken, bg: bgToken, type, ratio, required, pass,
      })),
    };
    writeFileSync(specPath, JSON.stringify(spec, null, 2) + '\n', 'utf8');
    if (!asJson) console.log(`  wrote contrast block -> ${specPath}\n`);
  }

  if (failures.length > 0) {
    if (!asJson) console.log(`  ${failures.length} declared pair(s) FAILED\n`);
    return 1;
  }
  return 0;
}

process.exit(main(process.argv));
