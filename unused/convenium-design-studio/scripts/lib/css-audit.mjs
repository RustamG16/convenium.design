// Static analysis of the stylesheet: the half of the design system that never renders.
import { readFileSync } from 'node:fs';

const STATUS_HUES = [
  { name: 'red', min: 345, max: 15 },
  { name: 'amber', min: 25, max: 60 },
  { name: 'green', min: 90, max: 165 },
];

const hueName = h => {
  if (h < 15 || h >= 345) return 'red';
  if (h < 45) return 'orange';
  if (h < 70) return 'yellow';
  if (h < 90) return 'lime';
  if (h < 165) return 'green';
  if (h < 195) return 'cyan';
  if (h < 250) return 'blue';
  if (h < 290) return 'violet';
  if (h < 345) return 'magenta';
  return 'red';
};

function toHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
}

function parseColorToken(raw) {
  const hex = raw.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let v = hex[1];
    if (v.length === 3 || v.length === 4) v = v.split('').map(c => c + c).join('');
    return { r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16) };
  }
  const rgb = raw.match(/rgba?\(([^)]+)\)/i);
  if (rgb) {
    const p = rgb[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (p.length >= 3 && !p.slice(0, 3).some(Number.isNaN)) return { r: p[0], g: p[1], b: p[2] };
  }
  return null;
}

// Script-driven motion is motion. GSAP durations were outside every check, which is how an
// 800ms tween shipped under a 150ms rule.
export function auditScriptMotion(path) {
  let text = '';
  try { text = readFileSync(path, 'utf8'); } catch { return { durations: [], overBudget: [], staggers: [] }; }
  const durations = [...text.matchAll(/duration\s*:\s*([\d.]+)/g)].map(m => Number(m[1]) * 1000);
  const staggers = [...text.matchAll(/stagger\s*:\s*([\d.]+)/g)].map(m => Number(m[1])).filter(v => v > 0);
  return {
    durations,
    overBudget: durations.filter(ms => ms > 150),
    staggers,
  };
}

export function auditCss(paths) {
  const sources = paths.map(p => ({ path: p, text: readFileSync(p, 'utf8') }));
  const css = sources.map(s => s.text).join('\n');

  const strip = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // A declaration written as var(--text-body) is only in rem if the token behind it is.
  // Resolve one token chain before classifying, or the sweep to tokens would read as a
  // regression to "no units at all".
  const declaredTokens = new Map();
  for (const m of strip.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)/gi)) {
    if (!declaredTokens.has(m[1])) declaredTokens.set(m[1], m[2].trim());
  }
  const resolveVars = (value, depth = 0) => {
    if (depth > 6 || !value.includes('var(')) return value;
    return resolveVars(value.replace(/var\(\s*(--[a-z0-9-]+)\s*(?:,[^)]*)?\)/gi,
      (whole, name) => declaredTokens.get(name) ?? whole), depth + 1);
  };

  const fontSizes = [...strip.matchAll(/font-size\s*:\s*([^;}]+)/gi)]
    .map(m => resolveVars(m[1].trim()));
  const fontSizeUnits = { total: fontSizes.length, rem: 0, px: 0, em: 0, other: 0 };
  const pxSizes = new Set();
  for (const decl of fontSizes) {
    if (/[\d.]rem\b/.test(decl)) fontSizeUnits.rem++;
    else if (/[\d.]px\b/.test(decl)) { fontSizeUnits.px++; for (const m of decl.matchAll(/([\d.]+)px/g)) pxSizes.add(Number(m[1])); }
    else if (/[\d.]em\b/.test(decl)) fontSizeUnits.em++;
    else fontSizeUnits.other++;
  }

  const radii = new Set();
  for (const m of strip.matchAll(/border-radius\s*:\s*([^;}]+)/gi)) {
    m[1].trim().split(/\s+/).forEach(v => { if (v && !v.startsWith('var(')) radii.add(v.replace(/;$/, '')); });
  }

  const zIndexLiterals = new Set();
  for (const m of strip.matchAll(/z-index\s*:\s*([^;}]+)/gi)) {
    const v = m[1].trim();
    if (!v.startsWith('var(')) zIndexLiterals.add(v);
  }

  const customProps = [...strip.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)/gi)]
    .map(m => ({ name: m[1], value: m[2].trim() }));
  const uniqueProps = new Map();
  for (const p of customProps) if (!uniqueProps.has(p.name)) uniqueProps.set(p.name, p.value);

  const classifyProp = name => {
    if (/^--(space|spacing|gap)/.test(name)) return 'space';
    if (/^--(radius|round)/.test(name)) return 'radius';
    if (/^--(dur|ease|motion|transition)/.test(name)) return 'motion';
    if (/^--(z|layer)/.test(name)) return 'elevation';
    if (/^--(text|size|font|leading|track)/.test(name)) return 'type';
    if (/^--(shadow|elev)/.test(name)) return 'elevation';
    return 'color';
  };
  const tokenFamilies = { color: 0, space: 0, radius: 0, motion: 0, elevation: 0, type: 0 };
  for (const name of uniqueProps.keys()) tokenFamilies[classifyProp(name)]++;

  // Literal colours outside custom-property definitions are the debt this measures.
  const propValueRanges = [];
  for (const m of strip.matchAll(/--[a-z0-9-]+\s*:\s*[^;}]+/gi)) propValueRanges.push([m.index, m.index + m[0].length]);
  const insideToken = i => propValueRanges.some(([a, b]) => i >= a && i < b);

  const hexLiterals = [];
  for (const m of strip.matchAll(/#[0-9a-f]{3,8}\b/gi)) if (!insideToken(m.index)) hexLiterals.push(m[0].toLowerCase());
  const rgbaLiterals = [];
  for (const m of strip.matchAll(/rgba?\([^)]*\)/gi)) if (!insideToken(m.index)) rgbaLiterals.push(m[0].toLowerCase());

  // Accent hue census: every saturated colour anywhere in the sheet.
  const allColors = [...strip.matchAll(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi)].map(m => m[0]);
  const hueBuckets = new Map();
  for (const raw of allColors) {
    const rgb = parseColorToken(raw);
    if (!rgb) continue;
    const { h, s, l } = toHsl(rgb.r, rgb.g, rgb.b);
    if (s < 0.18 || l < 0.08 || l > 0.95) continue; // neutral or near-black/white
    const name = hueName(h);
    hueBuckets.set(name, (hueBuckets.get(name) || 0) + 1);
  }
  const semantic = new Set(['red', 'amber', 'orange', 'yellow', 'green']);
  const nonSemanticHues = [...hueBuckets.keys()].filter(h => !semantic.has(h));

  const transitions = [...strip.matchAll(/transition[a-z-]*\s*:\s*([^;}]+)/gi)]
    .map(m => resolveVars(m[1].trim()));
  const durations = new Set();
  for (const t of transitions) {
    for (const m of t.matchAll(/([\d.]+)m?s\b/g)) durations.add(m[0]);
  }

  const zIndex = new Set();
  for (const m of strip.matchAll(/z-index\s*:\s*([^;}]+)/gi)) zIndex.add(m[1].trim());

  // Spacing debt, tracked so it cannot quietly persist: a padding, margin or gap written
  // as a length rather than as a step on the scale.
  let spacingLiterals = 0;
  for (const m of strip.matchAll(/(padding|margin|gap|row-gap|column-gap)[a-z-]*\s*:\s*([^;}]+)/gi)) {
    for (const v of m[2].split(/\s+/)) {
      if (/^[\d.]+(px|rem|em)$/.test(v) && v !== '0px' && v !== '0') spacingLiterals++;
    }
  }

  const mediaRefs = [...new Set([...strip.matchAll(/url\(['"]?(\/media\/[^'")]+)/gi)].map(m => m[1]))];

  // Ornament, by whatever means. A gradient between two identical colours, or from a colour
  // to transparent, is decoration; a gradient that draws a rule or a scrim is structure, so
  // the test is whether it carries an accent or status hue for mood.
  const ornament = [];
  for (const m of strip.matchAll(/(?:linear|radial|conic)-gradient\([^;{}]*\)/gi)) {
    const value = m[0];
    const decorative = /accent|--signal|--intelligence|--cyan|--violet/i.test(value)
      && !/transparent 0/.test(value);
    if (decorative) ornament.push({ kind: 'accent-gradient', value: value.slice(0, 80) });
  }
  for (const m of strip.matchAll(/url\(["']?data:image\/[^)]*\)/gi)) {
    ornament.push({ kind: 'inline-image', value: m[0].slice(0, 48) + '…' });
  }
  for (const m of strip.matchAll(/filter\s*:\s*drop-shadow\([^;}]*\)/gi)) {
    ornament.push({ kind: 'glow', value: m[0].slice(0, 60) });
  }
  for (const m of strip.matchAll(/mix-blend-mode\s*:\s*(?!normal)[a-z-]+/gi)) {
    ornament.push({ kind: 'blend', value: m[0] });
  }

  // The motion budget is a stated rule with no threshold behind it: DESIGN.md caps every
  // duration at 150ms and every animated translation at 4px.
  const longMotion = [];
  for (const t of transitions) {
    for (const m of t.matchAll(/([\d.]+)(ms|s)/g)) {
      const ms = m[2] === 's' ? Number(m[1]) * 1000 : Number(m[1]);
      if (ms > 150) longMotion.push(m[0]);
    }
  }
  for (const m of strip.matchAll(/animation(?:-duration)?\s*:\s*([^;}]+)/gi)) {
    for (const d of m[1].matchAll(/([\d.]+)(ms|s)\b/g)) {
      const ms = d[2] === 's' ? Number(d[1]) * 1000 : Number(d[1]);
      if (ms > 150) longMotion.push('animation ' + d[0]);
    }
  }
  for (const block of strip.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\}\s*)\}/g)) {
    const name = block[1];
    for (const t of block[2].matchAll(/translate(?:X|Y|3d)?\s*\(([^)]*)\)|translate\s*:\s*([^;}]+)/gi)) {
      for (const px of (t[1] || t[2] || '').matchAll(/(-?[\d.]+)px/g)) {
        if (Math.abs(Number(px[1])) > 4) longMotion.push('keyframe ' + name + ' ' + px[0]);
      }
    }
  }

  return {
    files: sources.map(s => ({ path: s.path, bytes: s.text.length, lines: s.text.split('\n').length })),
    fontSizeUnits,
    uniquePxFontSizes: [...pxSizes].sort((a, b) => a - b),
    radii: [...radii].sort(),
    customPropertyCount: uniqueProps.size,
    tokenFamilies,
    hexLiterals: hexLiterals.length,
    rgbaLiterals: rgbaLiterals.length,
    hueBuckets: Object.fromEntries([...hueBuckets].sort((a, b) => b[1] - a[1])),
    nonSemanticHues,
    important: (strip.match(/!important/g) || []).length,
    transitionDeclarations: transitions.length,
    transitionDurations: [...durations].sort(),
    zIndexSpellings: [...zIndex].sort(),
    zIndexLiterals: [...zIndexLiterals].sort(),
    spacingLiterals,
    ornament,
    longMotion,
    decorativeMediaRefs: mediaRefs,
  };
}
