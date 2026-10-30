// Opt-in ship sound (DESIGN.md › Ship tour: scene upgrade): mounted only after the owner turns
// sound on in the waypoint card, so nothing ever autoplays on arrival. A low hum fills the
// corridor and the bridge; the weld crackles positionally in the build bay. CC0 Kenney audio,
// provenance in public/media/ship-sound/README.md.
import { PositionalAudio } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import type * as THREE from 'three';
import { withBase } from '../lib/baseUrl';
import { inFront } from './stations';

export const SOUND = {
  hum: withBase('/media/ship-sound/hum.ogg'),
  servo: withBase('/media/ship-sound/servo.ogg'),
  click: withBase('/media/ship-sound/click.ogg'),
  weld: withBase('/media/ship-sound/weld.ogg'),
} as const;

/** DESIGN numbers: hum 0.15, weld 0.2 (positional, ref distance 2). */
const VOLUME = { hum: 0.15, weld: 0.2 } as const;

function Loop({ url, position, volume, distance }: { url: string; position: [number, number, number]; volume: number; distance: number }) {
  const ref = useRef<THREE.PositionalAudio>(null);
  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    a.setVolume(volume);
    return () => {
      if (a.isPlaying) a.stop();
    };
  }, [volume]);
  return (
    <group position={position}>
      <PositionalAudio ref={ref} url={url} distance={distance} loop autoplay />
    </group>
  );
}

export function ShipSound() {
  const weld = inFront('engineer');
  return (
    <Suspense fallback={null}>
      <Loop url={SOUND.hum} position={[0, 2.6, 14]} volume={VOLUME.hum} distance={8} />
      <Loop url={SOUND.hum} position={[0, 2.6, -5]} volume={VOLUME.hum} distance={8} />
      <Loop url={SOUND.weld} position={[weld[0], 1, weld[2]]} volume={VOLUME.weld} distance={2} />
    </Suspense>
  );
}

/** One-shot DOM sounds (servo on waypoint change, click on Talk) at their DESIGN volumes. */
export function playOneShot(kind: 'servo' | 'click') {
  try {
    const a = new Audio(SOUND[kind]);
    a.volume = kind === 'servo' ? 0.3 : 0.25;
    void a.play().catch(() => undefined);
  } catch {
    /* audio unavailable: silent by design */
  }
}
