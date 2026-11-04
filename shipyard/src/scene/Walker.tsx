// Free roam (spec › Phase 1.6): the first-person walker and the camera that follows it. Controls
// write intent into a `Walker` (keys held, drag deltas, an autopilot goal); every frame steps it
// against the floor map in ../walk and places the camera. Nothing here reads the DOM.
import { useFrame, useThree } from '@react-three/fiber';
import { approach } from './common';
import { EYE } from './stations';
import { easeDefault, MOTION, recordMotion } from '../lib/motion';
import { LOOK_PITCH, TURN_SPEED, WALK_SPEED } from './tourModel';
import { floorAt, type P2, type WalkMap } from './walk';

/** Shortest signed difference between two angles, in (-π, π]. */
function angleDelta(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Mutable walk state shared between the DOM controls and the scene (the DiveProgress pattern).
 * Writes go through methods so React never sees a prop being reassigned. Yaw 0 looks down -z and a
 * positive yaw turns left; a positive pitch looks up.
 */
export class Walker {
  readonly pos: P2;
  yaw: number;
  pitch: number;
  /** Eye lift from the floor under you (the dais step), eased. */
  lift = 0;
  /** Held input: forward/back and strafe in -1..1, turn (+ right) in -1..1, Shift for pace. */
  readonly move = { forward: 0, side: 0, turn: 0, run: false };
  /** Autopilot: the points still to walk and the view to settle on at the end. */
  private path: P2[] = [];
  private goal: { yaw: number; pitch: number } | null = null;
  /** The timed leg of the autopilot: seconds elapsed, metres walked and the leg's length. */
  private leg = { t: 0, done: 0, len: 0 };
  /** The last finished leg (test and inspection hook): how long it took on the simulated clock, and its length. */
  lastLeg: { seconds: number; length: number } | null = null;

  /** The floor map of this ship's layout: collision, routes and the waypoint views. */
  readonly map: WalkMap;

  constructor(map: WalkMap, start = 0) {
    this.map = map;
    this.pos = map.camOf(start);
    ({ yaw: this.yaw, pitch: this.pitch } = map.viewOf(start));
  }

  get autopilot(): boolean {
    return this.path.length > 0 || this.goal !== null;
  }
  setMove(forward: number, side: number, turn: number, run: boolean) {
    Object.assign(this.move, { forward, side, turn, run });
  }
  /** A drag adds to the view (radians); pitch is clamped. A look during the final turn ends it. */
  look(dYaw: number, dPitch: number) {
    this.yaw += dYaw;
    this.pitch = Math.max(-LOOK_PITCH, Math.min(LOOK_PITCH, this.pitch + dPitch));
    if (this.path.length === 0) this.goal = null;
  }
  /** Walk to waypoint `i` and take its view; `instant` (reduced motion) arrives at once. */
  goTo(i: number, instant = false) {
    const { camOf, viewOf, route } = this.map;
    const target = camOf(i);
    if (instant) {
      this.pos.x = target.x;
      this.pos.z = target.z;
      ({ yaw: this.yaw, pitch: this.pitch } = viewOf(i));
      this.path = [];
      this.goal = null;
      recordMotion('camera', 0, { cut: true });
      return;
    }
    this.path = route(this.pos, target);
    this.goal = viewOf(i);
    // Between stations the camera takes 700 ms, whatever the distance; walking by hand keeps 2.2 m/s.
    let len = 0;
    let from: P2 = this.pos;
    for (const p of this.path) {
      len += Math.hypot(p.x - from.x, p.z - from.z);
      from = p;
    }
    this.leg = { t: 0, done: 0, len };
    this.lastLeg = null;
    recordMotion('camera', MOTION.camera, { length: len });
  }
  stop() {
    this.path = [];
    this.goal = null;
  }

  /** One frame. */
  step(dt: number, reduced: boolean) {
    const m = this.move;
    const pace = m.run ? 2 : 1;
    if (m.forward || m.side || m.turn) this.stop();

    if (m.turn) this.yaw -= m.turn * TURN_SPEED * pace * dt;
    if (m.forward || m.side) {
      const fx = -Math.sin(this.yaw);
      const fz = -Math.cos(this.yaw);
      // Right is forward turned a quarter clockwise seen from above.
      let dx = fx * m.forward - fz * m.side;
      let dz = fz * m.forward + fx * m.side;
      const len = Math.hypot(dx, dz);
      dx = (dx / len) * WALK_SPEED * pace * dt;
      dz = (dz / len) * WALK_SPEED * pace * dt;
      Object.assign(this.pos, this.map.slide(this.pos, dx, dz));
    }

    if (this.path.length) {
      this.leg.t += dt;
      const progress = reduced ? 1 : Math.min(1, this.leg.t / (MOTION.camera / 1000));
      let budget = easeDefault(progress) * this.leg.len - this.leg.done;
      while (this.path.length && budget > 0) {
        const t = this.path[0];
        const dx = t.x - this.pos.x;
        const dz = t.z - this.pos.z;
        const d = Math.hypot(dx, dz);
        if (d <= budget || progress === 1) {
          this.pos.x = t.x;
          this.pos.z = t.z;
          this.path.shift();
          budget -= d;
          this.leg.done += d;
        } else {
          this.pos.x += (dx / d) * budget;
          this.pos.z += (dz / d) * budget;
          this.leg.done += budget;
          budget = 0;
          // Face the way you walk; the last leg already turns toward the station.
          const ahead = this.path.length === 1 && this.goal ? this.goal.yaw : Math.atan2(-dx, -dz);
          this.yaw += angleDelta(this.yaw, ahead) * Math.min(1, dt * 6);
          this.pitch = approach(this.pitch, 0, dt, 4, false);
        }
      }
      if (this.path.length === 0) this.lastLeg = { seconds: this.leg.t, length: this.leg.len };
    } else if (this.goal) {
      const dy = angleDelta(this.yaw, this.goal.yaw);
      const k = reduced ? 1 : Math.min(1, dt * 5);
      this.yaw += dy * k;
      this.pitch += (this.goal.pitch - this.pitch) * k;
      if (Math.abs(dy) < 0.005 && Math.abs(this.goal.pitch - this.pitch) < 0.005) this.goal = null;
    }

    this.lift = reduced ? floorAt(this.pos) : approach(this.lift, floorAt(this.pos), dt, 8, false);
  }
}

/** `framePitch` tilts the view down (radians) so stations sit higher on phones, where the card covers the lower half. */
export function WalkCamera({ walker, reduced, framePitch = 0 }: { walker: Walker; reduced: boolean; framePitch?: number }) {
  const camera = useThree((s) => s.camera);
  useFrame((_, delta) => {
    walker.step(Math.min(delta, 0.1), reduced);
    camera.position.set(walker.pos.x, EYE + walker.lift, walker.pos.z);
    camera.rotation.set(walker.pitch - framePitch, walker.yaw, 0, 'YXZ');
  });
  return null;
}
