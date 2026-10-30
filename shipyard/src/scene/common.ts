// Shared scene helpers: frame-rate independent easing, material disposal and the boundary that
// swaps a failed model for its stand-in. Ported from ArkhEthos `universe/scene/common.tsx` (the
// helpers the ship scene uses; the universe-only parts stay behind).
import { Component, type ReactNode } from 'react';
import type * as THREE from 'three';

/** Moves `current` toward `target` at a frame-rate independent rate; snaps when reduced. */
export function approach(current: number, target: number, delta: number, rate: number, reduced: boolean) {
  if (reduced) return target;
  const next = current + (target - current) * Math.min(1, delta * rate);
  return Math.abs(target - next) < 0.001 ? target : next;
}

export class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    // Fallbacks render silently; the cause still goes to the console for QA.
    console.warn('[ModelBoundary] model failed, using fallback:', error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function disposeMaterials(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) (mesh.material as THREE.Material).dispose();
  });
}

/** A small seeded generator (mulberry32): effects that need variety stay reproducible, never random at runtime. */
export function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
