// Free-roam controls (spec › Phase 1.6). Held keys (W/A/S/D, arrows, Q/E, Shift) become the
// walker's input through `walkKey` and `moveOf`; Space, 1-9 and Escape go through `keyAction`. On a
// desktop any plain left click on the view captures the mouse (Pointer Lock) and it looks shooter
// style with no button held, aiming hover and clicks from the crosshair; Escape or focusing the card
// releases it. A gsap Observer turns touch drags (and mouse drags only where Pointer Lock is refused)
// into a look; a short tap reaches the crew hotspots. The on-screen pad (phones) presses the same held keys.
import gsap from 'gsap';
import { Observer } from 'gsap/Observer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CLICK_SLOP_PX, escapeReleases, keyAction, LOOK_PER_PX, mouseLook, moveOf, walkKey, type WalkKey } from './tourModel';
import type { Walker } from './Walker';

gsap.registerPlugin(Observer);

export interface TourControlsOptions {
  stage: React.RefObject<HTMLElement | null>;
  walker: Walker;
  /** The stop Space steps on from, and how many there are. */
  index: number;
  count: number;
  goTo: (i: number) => void;
  onSkip: () => void;
  /** Phones: no mouse capture; drags look. */
  lite?: boolean;
}

/** This browser can capture the mouse. */
const CAN_CAPTURE = typeof document !== 'undefined' && typeof document.exitPointerLock === 'function' && typeof Element.prototype.requestPointerLock === 'function';

/** Keys typed into fields, or activating a focused control, are never taken over. */
function ownsKey(target: EventTarget | null, key: string): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  if (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return true;
  if ((key === ' ' || key === 'Enter') && /^(BUTTON|A|SUMMARY)$/.test(el.tagName)) return true;
  return Boolean(el.closest('[role="dialog"], [data-radix-popper-content-wrapper]'));
}

export function useTourControls({ stage, walker, index, count, goTo, onSkip, lite = false }: TourControlsOptions) {
  const held = useRef(new Set<WalkKey>());
  const run = useRef(false);
  const sync = useCallback(() => {
    const m = moveOf(held.current);
    walker.setMove(m.forward, m.side, m.turn, run.current);
  }, [walker]);

  /** Press or release one walk key (the phone pad). */
  const press = useCallback(
    (key: WalkKey, on: boolean) => {
      if (on) held.current.add(key);
      else held.current.delete(key);
      sync();
    },
    [sync],
  );

  // Held walk keys.
  useEffect(() => {
    const keys = held.current;
    const onDown = (e: KeyboardEvent) => {
      run.current = e.shiftKey;
      const k = walkKey(e.code);
      if (!k || e.altKey || e.ctrlKey || e.metaKey || ownsKey(e.target, e.key)) {
        if (e.key === 'Shift') sync();
        return;
      }
      e.preventDefault();
      keys.add(k);
      sync();
    };
    const onUp = (e: KeyboardEvent) => {
      run.current = e.shiftKey;
      const k = walkKey(e.code);
      if (k) keys.delete(k);
      sync();
    };
    const clear = () => {
      keys.clear();
      sync();
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', clear);
      keys.clear();
      walker.setMove(0, 0, 0, false);
    };
  }, [walker, sync]);

  // Stops: Space, 1-9, Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || ownsKey(e.target, e.key)) return;
      const action = keyAction(e.key, index, count);
      if (!action) return;
      e.preventDefault();
      if (action.type === 'skip') onSkip();
      else goTo(action.index);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, count, goTo, onSkip]);

  // The mouse looks by capture (shooter style) unless this browser refuses Pointer Lock outright;
  // then, and always for touch, a drag looks.
  const [refused, setRefused] = useState(false);
  const lockable = CAN_CAPTURE && !lite && !refused;

  // Drag on the canvas to look (the cards and buttons above it keep their own pointer).
  useEffect(() => {
    const target = stage.current?.querySelector<HTMLElement>('.ship-canvas');
    if (!target) return;
    const obs = Observer.create({
      target,
      type: 'pointer,touch',
      dragMinimum: 3,
      // Grab the world: dragging right turns the view left, dragging down tilts it up.
      onDrag: (self) => {
        if (document.pointerLockElement) return;
        if (lockable && (self.event as PointerEvent).pointerType === 'mouse') return;
        walker.look(self.deltaX * LOOK_PER_PX, self.deltaY * LOOK_PER_PX);
      },
    });
    return () => obs.kill();
  }, [stage, walker, lockable]);

  // The captured mouse: any plain left click on the view captures it; it then looks with every
  // move; Escape only releases it, and so does focus moving into the card or rail.
  const [captured, setCaptured] = useState(false);
  const capturedNow = useRef(false);
  useEffect(() => {
    if (!lockable) return;
    const target = stage.current?.querySelector<HTMLElement>('.ship-canvas');
    const el = stage.current;
    if (!target || !el) return;
    let releasedAt = -Infinity;
    let everCaptured = false;
    let down: { x: number; y: number } | null = null;
    const onChange = () => {
      const on = document.pointerLockElement === target;
      if (capturedNow.current && !on) releasedAt = performance.now();
      if (on) everCaptured = true;
      capturedNow.current = on;
      setCaptured(on);
    };
    const onDown = (e: PointerEvent) => {
      down = e.pointerType === 'mouse' && e.button === 0 && !capturedNow.current ? { x: e.clientX, y: e.clientY } : null;
    };
    // A click (not the end of a drag) captures. The scene's own click handler still runs, so a
    // click on a crew member both captures and opens Talk.
    const onClick = (e: MouseEvent) => {
      const from = down;
      down = null;
      if (!from || capturedNow.current || Math.hypot(e.clientX - from.x, e.clientY - from.y) > CLICK_SLOP_PX) return;
      // Keys go to the walk, not to a button focused before the capture.
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      // Raw, unaccelerated movement where the browser offers it (Chromium); the plain capture
      // elsewhere. If that fails too before any capture ever worked, fall back to drag look.
      const asked = target.requestPointerLock({ unadjustedMovement: true }) as Promise<void> | undefined;
      asked?.catch(() =>
        target.requestPointerLock()?.catch(() => {
          if (!everCaptured) setRefused(true);
        }),
      );
    };
    const onMove = (e: MouseEvent) => {
      if (!capturedNow.current) return;
      const d = mouseLook(e.movementX, e.movementY);
      if (d) walker.look(d.yaw, d.pitch);
    };
    // Capture phase on window runs before every other Escape handler on the page.
    const onEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !escapeReleases(capturedNow.current, performance.now() - releasedAt)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (capturedNow.current) document.exitPointerLock();
    };
    const onFocus = () => {
      if (capturedNow.current) document.exitPointerLock();
    };
    document.addEventListener('pointerlockchange', onChange);
    document.addEventListener('mousemove', onMove);
    window.addEventListener('keydown', onEscape, true);
    target.addEventListener('pointerdown', onDown);
    target.addEventListener('click', onClick);
    el.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('pointerlockchange', onChange);
      document.removeEventListener('mousemove', onMove);
      window.removeEventListener('keydown', onEscape, true);
      target.removeEventListener('pointerdown', onDown);
      target.removeEventListener('click', onClick);
      el.removeEventListener('focusin', onFocus);
      if (document.pointerLockElement === target) document.exitPointerLock();
      capturedNow.current = false;
      setCaptured(false);
    };
  }, [lockable, stage, walker]);

  return { press, lockable, captured };
}
