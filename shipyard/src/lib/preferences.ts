// Display preferences the scene reads: reduced motion (the OS setting), phone width, page
// visibility, WebGL availability and the `?2d` switch. Ported from ArkhEthos `app/preferences.ts`
// minus its settings store and the chime (Shipyard keeps sound off and per ship in the store).
import { useSyncExternalStore } from 'react';

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
const systemReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The OS reduced-motion preference. Reduced motion keeps the 3D view and stops the motion in it. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, systemReduced, () => false);
}

function subscribeVisibility(cb: () => void) {
  document.addEventListener('visibilitychange', cb);
  return () => document.removeEventListener('visibilitychange', cb);
}
export function usePageVisible(): boolean {
  return useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => true);
}

function subscribeWidth(cb: () => void) {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
}
/** Phones: under 768px the scene runs lite (dpr 1, no postprocessing, billboard sheets far away). */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribeWidth, () => window.innerWidth < 768, () => false);
}

let webglSupport: boolean | null = null;
/** WebGL availability, probed once per page; false means the DOM fallbacks render instead. */
export function hasWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const c = document.createElement('canvas');
    webglSupport = Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/** `?2d` in the hash route's query (or the page's own) forces the DOM view. */
export function force2d(): boolean {
  if (typeof window === 'undefined') return false;
  const fromHash = window.location.hash.split('?')[1] ?? '';
  return new URLSearchParams(fromHash).has('2d') || new URLSearchParams(window.location.search).has('2d');
}
