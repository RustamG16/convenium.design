// The motion contract of DESIGN.md as numbers, in one place. Every duration, distance, scale and
// rate the interface animates with is read from here (and from `--t-*` in tokens.css, which a unit
// test keeps equal to these). Nothing animates with a number that is not in this file.
//
// Reduced motion is the right-hand column of the contract: `prefers-reduced-motion` (the app has no
// preference of its own, so the OS setting is the whole of it). 3D stays in reduced motion: 0 rpm and cuts.
import { useEffect, useState } from 'react';

/** Bezier control points of the default ease, cubic-bezier(0.16, 1, 0.3, 1). */
export const EASE_POINTS = [0.16, 1, 0.3, 1] as const;
export const EASE_CSS = `cubic-bezier(${EASE_POINTS.join(', ')})`;
/** The equip arrival: the only overshoot in the product (GSAP name, tween vars take it as is). */
export const EQUIP_EASE = 'back.out(1.6)';

export const MOTION = {
  micro: 160,
  panel: 240,
  camera: 700,
  stagger: 45,
  /** reduced motion replaces a movement with an opacity change this long */
  reduced: 120,

  hover: { liftPx: 2, glow: 0.35, ms: 160 },
  pickUp: { scale: 1.04, ms: 120 },
  /** the valid anchor's ring pulses 1.0 -> 1.12 -> 1.0 at 1.6 Hz */
  pulse: { hz: 1.6, from: 1, to: 1.12 },
  equip: { arcM: 0.4, ms: 520, ease: EQUIP_EASE, socketFlashMs: 80, chipMs: 240 },
  invalid: { returnMs: 240, shakePx: 2, shakeCount: 2, shakeMs: 180 },
  unequip: { ms: 160, scale: 0.85, undoMs: 8000 },
  /** the active artifact turns at 0.25 revolutions per second inside a 3 px rim */
  active: { rps: 0.25, rimPx: 3 },
  /** a check flips: the count ticks up and the ring fills */
  checkFlip: { ms: 400 },
  /** first clean pre-flight of a ship: the ring closes and the hull lights sweep stern to bow */
  sweep: { ms: 900 },
  turntable: { rpm: 1, polarMin: 0.9, polarMax: 1.6 },
  /** only this many cards of a grid enter staggered; the rest are simply there */
  staggerCards: 12,
} as const;

/** Period of the anchor pulse, ms (1 / 1.6 Hz). */
export const PULSE_MS = Math.round(1000 / MOTION.pulse.hz);
/** Seconds per turn of the active artifact and of the orbit. */
export const ACTIVE_TURN_S = 1 / MOTION.active.rps;

/** A CSS cubic-bezier as a function of progress (0..1), so JS-driven moves use the same curve as CSS. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-6) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 40; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}
/** The default ease as a function. */
export const easeDefault = cubicBezier(...EASE_POINTS);

/** Reduced motion right now (the OS setting; there is no app preference to add). */
export function isReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface MotionRecord {
  row: string;
  reduced: boolean;
  ms: number;
  [detail: string]: unknown;
}

/**
 * Test and inspection hook (dev server only): every motion the app starts leaves one record in
 * `window.__motion`, so a test can assert the duration, ease and variant that actually ran.
 */
export function recordMotion(row: string, ms: number, detail: Record<string, unknown> = {}): void {
  if (!import.meta.env.DEV || typeof window === 'undefined') return;
  const w = window as unknown as { __motion?: MotionRecord[] };
  (w.__motion ??= []).push({ row, ms, reduced: isReducedMotion(), ...detail });
}

/**
 * Keeps a value on screen for `ms` after it goes away, so an exit can play. `leaving` is true while it
 * is only being kept. A new value cancels the exit at once (interruptible).
 */
export function usePresence<T>(value: T | null, ms: number): { value: T | null; leaving: boolean } {
  const [held, setHeld] = useState<T | null>(value);
  if (value !== null && held !== value) setHeld(value);
  useEffect(() => {
    if (value !== null || held === null) return;
    const h = window.setTimeout(() => setHeld(null), ms);
    return () => window.clearTimeout(h);
  }, [value, held, ms]);
  return { value: value ?? held, leaving: value === null && held !== null };
}

let lastDrop: { x: number; y: number; at: number } | null = null;
/** Where the last drop landed, so the chip that arrives in a socket can fly in from there. */
export function noteDrop(x: number, y: number): void {
  lastDrop = { x, y, at: Date.now() };
}
/** The drop point if it is fresh (under 1.5 s old); each is used once. */
export function takeDrop(): { x: number; y: number } | null {
  const d = lastDrop;
  lastDrop = null;
  return d && Date.now() - d.at < 1500 ? { x: d.x, y: d.y } : null;
}
