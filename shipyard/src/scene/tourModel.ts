// Pure logic of the boarding walk: how held keys, a captured mouse and the autopilot's keys become
// movement, and when the walk plays. No React, no network; unit-tested in tests/unit/scene-walk.test.ts.
// Ported from ArkhEthos `features/ship/model.ts` (the walk-controls section, numbers unchanged); the
// slot loadout reducer and the crew helpers stay behind, Shipyard's live in src/domain.

export interface SkipBoardInput {
  /** `?2d`, no WebGL or a lost context: the DOM view */
  twoD: boolean;
  /** this ship's walk has played once */
  seen: boolean;
  /** the owner asked for it (Replay the walk) */
  replay: boolean;
}

/**
 * The walk plays once per ship, under reduced motion too (the 3D view stays and the walk arrives
 * at each stop at once). A replay always plays when the scene can run; the DOM view never does.
 */
export function shouldSkipBoarding(i: SkipBoardInput): boolean {
  if (i.twoD) return true;
  if (i.replay) return false;
  return i.seen;
}

/** Drag sensitivity (touch, or a mouse where Pointer Lock is unavailable), radians per CSS pixel. */
export const LOOK_PER_PX = 0.004;
/** How far the view may tilt up or down (radians); yaw turns all the way round. */
export const LOOK_PITCH = 0.7;
/** Captured-mouse sensitivity, radians per pixel of `movementX/Y`. */
export const MOUSE_LOOK_PER_PX = 0.0022;
/** A single mouse event moving further than this (px) is a browser glitch on capture, not a look. */
export const MOUSE_SPIKE_PX = 300;
/** A press and release this close (px) on the view is a click that captures the mouse, not a drag. */
export const CLICK_SLOP_PX = 6;
/** How long after the mouse is released an Escape still counts as the release (ms). */
export const RELEASE_ESCAPE_MS = 250;

/**
 * A captured-mouse move as a look (shooter style): right turns right (yaw falls), down looks down
 * (pitch falls). Null for a capture spike.
 */
export function mouseLook(movementX: number, movementY: number): { yaw: number; pitch: number } | null {
  if (Math.abs(movementX) > MOUSE_SPIKE_PX || Math.abs(movementY) > MOUSE_SPIKE_PX) return null;
  return { yaw: -movementX * MOUSE_LOOK_PER_PX, pitch: -movementY * MOUSE_LOOK_PER_PX };
}

/**
 * Escape while the mouse is captured only releases it: true while captured, and just after the
 * release (browsers may deliver the Escape keydown after `pointerlockchange`).
 */
export function escapeReleases(captured: boolean, msSinceRelease: number): boolean {
  return captured || msSinceRelease < RELEASE_ESCAPE_MS;
}

/**
 * Free-roam keys (spec › Phase 1.6): W/S or Up/Down walk, A/D strafe, Left/Right or Q/E turn.
 * Physical key codes, so the cluster works on any keyboard layout.
 */
export type WalkKey = 'forward' | 'back' | 'left' | 'right' | 'turnLeft' | 'turnRight';
const WALK_CODES: Record<string, WalkKey> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  KeyD: 'right',
  ArrowLeft: 'turnLeft',
  KeyQ: 'turnLeft',
  ArrowRight: 'turnRight',
  KeyE: 'turnRight',
};
export function walkKey(code: string): WalkKey | null {
  return WALK_CODES[code] ?? null;
}
/** Held keys as the walker's input: forward/back, strafe (+ right) and turn (+ right), each -1..1. */
export function moveOf(held: ReadonlySet<WalkKey>): { forward: number; side: number; turn: number } {
  const axis = (pos: WalkKey, neg: WalkKey) => (held.has(pos) ? 1 : 0) - (held.has(neg) ? 1 : 0);
  return { forward: axis('forward', 'back'), side: axis('right', 'left'), turn: axis('turnRight', 'turnLeft') };
}
/** Walking pace (m/s) and turning pace (rad/s), both doubled by Shift. The autopilot is timed (700 ms a leg), not paced. */
export const WALK_SPEED = 2.2;
export const TURN_SPEED = 1.9;


export type KeyAction = { type: 'go'; index: number } | { type: 'skip' } | null;

/** Maps a key to an autopilot action: Space walks to the next stop, 1-9 to a stop, Escape skips to the bridge. */
export function keyAction(key: string, index: number, count: number): KeyAction {
  const go = (i: number): KeyAction => {
    const next = Math.max(0, Math.min(count - 1, i));
    return next === index ? null : { type: 'go', index: next };
  };
  switch (key) {
    case ' ':
    case 'Spacebar':
      return go(index + 1);
    case 'Escape':
      return { type: 'skip' };
  }
  if (/^[1-9]$/.test(key)) {
    const i = Number(key) - 1;
    return i < count ? go(i) : null;
  }
  return null;
}
