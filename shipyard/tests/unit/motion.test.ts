import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { cubicBezier, easeDefault, EASE_CSS, EASE_POINTS, EQUIP_EASE, MOTION, PULSE_MS } from '../../src/lib/motion';

/**
 * The motion constants are the contract of DESIGN.md in code. These tests read DESIGN.md and
 * tokens.css as text and fail when a number in src/lib/motion.ts and the document disagree.
 */
const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8').replace(/\r\n/g, '\n');
const design = read('../../DESIGN.md');
const tokens = read('../../src/styles/tokens.css');
const css = read('../../src/styles/motion.css');
const row = (event: string) => {
  const line = design.split('\n').find((l) => l.startsWith(`| ${event}`));
  if (!line) throw new Error(`no motion-contract row "${event}"`);
  return line;
};
const token = (name: string) => new RegExp(`--${name}:\\s*([^;]+);`).exec(tokens)?.[1].trim();

describe('motion constants against DESIGN.md', () => {
  it('token block: micro 160 / panel 240 / camera 700, stagger 45', () => {
    expect(design).toMatch(/\| Motion: micro \/ panel \/ camera; stagger \| 160 \/ 240 \/ 700ms; 45ms per card \|/);
    expect([MOTION.micro, MOTION.panel, MOTION.camera, MOTION.stagger]).toEqual([160, 240, 700, 45]);
  });
  it('the default ease and the one overshoot', () => {
    expect(design).toContain('cubic-bezier(0.16,1,0.3,1)');
    expect(EASE_POINTS).toEqual([0.16, 1, 0.3, 1]);
    expect(EQUIP_EASE).toBe('back.out(1.6)');
    expect(design).toContain('`back.out(1.6)` (GSAP)');
    expect(design).toContain('the only overshoot in the product');
  });
  it('tokens.css carries the same numbers the code does', () => {
    expect(token('t-micro')).toBe(`${MOTION.micro}ms`);
    expect(token('t-panel')).toBe(`${MOTION.panel}ms`);
    expect(token('t-camera')).toBe(`${MOTION.camera}ms`);
    expect(token('t-reduced')).toBe(`${MOTION.reduced}ms`);
    expect(token('stagger')).toBe(`${MOTION.stagger}ms`);
    expect(token('ease')?.replace(/\s/g, '')).toBe(EASE_CSS.replace(/\s/g, ''));
    expect(token('t-pick')).toBe(`${MOTION.pickUp.ms}ms`);
    expect(token('t-flash')).toBe(`${MOTION.equip.socketFlashMs}ms`);
    expect(token('t-chip')).toBe(`${MOTION.equip.chipMs}ms`);
    expect(token('t-pulse')).toBe(`${PULSE_MS}ms`);
    expect(token('t-orbit')).toBe(`${1 / MOTION.active.rps}s`);
    expect(token('t-shake')).toBe(`${MOTION.invalid.shakeMs}ms`);
  });
  it('hover: lift 2px, glow 0 to 0.35, 160ms', () => {
    expect(row('Hover artifact card')).toContain('lift 2px + family glow');
    expect(row('Hover artifact card')).toContain('0.35, 160ms');
    expect(MOTION.hover).toEqual({ liftPx: 2, glow: 0.35, ms: 160 });
    expect(css).toContain('translateY(-2px)');
    expect(css).toContain('opacity: 0.35');
  });
  it('pick up: scale 1.04, 120ms', () => {
    expect(row('Pick up')).toContain('card scales 1.04');
    expect(row('Pick up')).toContain('120ms');
    expect(MOTION.pickUp).toEqual({ scale: 1.04, ms: 120 });
    expect(css).toContain('scale(1.04)');
  });
  it('valid anchor: 1.0 to 1.12 at 1.6 Hz', () => {
    expect(row('Valid anchor under drag')).toContain('1.0');
    expect(row('Valid anchor under drag')).toContain('1.12 at 1.6Hz');
    expect(MOTION.pulse).toEqual({ hz: 1.6, from: 1, to: 1.12 });
    expect(PULSE_MS).toBe(625);
    expect(css).toContain('scale(1.12)');
  });
  it('equip: 0.4 m arc, 520ms back.out(1.6), flash 80ms, chip 240ms', () => {
    const r = row('Equip (drop)');
    expect(r).toContain('0.4m arc');
    expect(r).toContain('520ms');
    expect(r).toContain('socket flash 80ms');
    expect(r).toContain('chip lands in the socket 240ms');
    expect(MOTION.equip).toMatchObject({ arcM: 0.4, ms: 520, socketFlashMs: 80, chipMs: 240 });
  });
  it('invalid drop: return 240ms, 2px shake x2 in 180ms', () => {
    const r = row('Invalid drop');
    expect(r).toContain('returns 240ms');
    expect(r).toContain('2px horizontal shake');
    expect(r).toContain('180ms');
    expect(MOTION.invalid).toEqual({ returnMs: 240, shakePx: 2, shakeCount: 2, shakeMs: 180 });
  });
  it('unequip: fade + 0.85 in 160ms, undo toast 8s', () => {
    const r = row('Unequip');
    expect(r).toContain('scale 0.85, 160ms');
    expect(r).toContain('undo toast 8s');
    expect(MOTION.unequip).toEqual({ ms: 160, scale: 0.85, undoMs: 8000 });
  });
  it('active in stage: 0.25 rps, 3px rim', () => {
    const r = row('Active-in-stage');
    expect(r).toContain('0.25 rps');
    expect(r).toContain('3px');
    expect(MOTION.active).toEqual({ rps: 0.25, rimPx: 3 });
  });
  it('check flips 400ms; clean pre-flight sweep 900ms', () => {
    expect(row('Pre-flight check flips')).toContain('400ms');
    expect(row('Clean pre-flight')).toContain('900ms');
    expect(MOTION.checkFlip.ms).toBe(400);
    expect(MOTION.sweep.ms).toBe(900);
  });
  it('camera 700ms; turntable 1 rpm, polar 0.9-1.6', () => {
    expect(row('Camera (scene)')).toContain('700ms between stations');
    expect(row('Turntable')).toContain('1 rpm, orbit polar 0.9');
    expect(row('Turntable')).toContain('1.6 rad, no pan');
    expect(MOTION.camera).toBe(700);
    expect(MOTION.turntable).toEqual({ rpm: 1, polarMin: 0.9, polarMax: 1.6 });
  });
  it('reduced motion replaces a movement with a 120 ms opacity change', () => {
    expect(row('Hover artifact card')).toContain('120ms opacity');
    expect(row('Equip (drop)')).toContain('120ms opacity');
    expect(MOTION.reduced).toBe(120);
  });
  it('no scattered overshoot: back.out lives only in the motion constants', () => {
    expect(css).not.toMatch(/back\.|elastic|bounce/);
  });
});

describe('the default ease as a function', () => {
  it('starts at 0, ends at 1, is monotonic and front-loaded (an ease-out)', () => {
    expect(easeDefault(0)).toBe(0);
    expect(easeDefault(1)).toBe(1);
    let last = 0;
    for (let i = 1; i <= 100; i++) {
      const v = easeDefault(i / 100);
      expect(v).toBeGreaterThanOrEqual(last - 1e-9);
      last = v;
    }
    expect(easeDefault(0.2)).toBeGreaterThan(0.6);
  });
  it('is the identity for the diagonal curve', () => {
    const linear = cubicBezier(0, 0, 1, 1);
    for (const t of [0.1, 0.5, 0.9]) expect(linear(t)).toBeCloseTo(t, 4);
  });
});
