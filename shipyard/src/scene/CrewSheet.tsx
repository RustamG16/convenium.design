// Phones: crew members away from the camera stand as billboard cards cut from their design sheet
// (`<id>-sheet-640.webp`) instead of rigged GLBs. The sheet's flat studio grey is keyed out in a
// small shader, using the colour of the sheet's corner pixel.
import { Billboard, useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { withBase } from '../lib/baseUrl';
import type { SceneMember } from './crew';

// The keying shader as ArkhEthos wrote it, patched into a plain MeshBasicMaterial with
// `onBeforeCompile` (three-custom-shader-material is not in the pinned package list).
const MAP_FRAGMENT = /* glsl */ `
  vec4 t = texture2D(map, vMapUv);
  if (distance(t.rgb, uKey) < 0.075) discard;
  diffuseColor = t;
`;

/** The corner pixel of the sheet: its background grey. */
function cornerColour(image: CanvasImageSource & { width: number; height: number }): THREE.Color {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 4;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('no 2d');
    ctx.drawImage(image, 0, 0, 8, 8, 0, 0, 4, 4);
    const [r, g, b] = ctx.getImageData(1, 1, 1, 1).data;
    return new THREE.Color(r / 255, g / 255, b / 255);
  } catch {
    return new THREE.Color(0.42, 0.42, 0.42);
  }
}

export function CrewSheet({ member }: { member: SceneMember }) {
  const texture = useTexture(withBase(`/media/${member.model.sheet ?? ''}-640.webp`), (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });
  const material = useMemo(() => {
    const key = cornerColour(texture.image as HTMLImageElement);
    // The sheet arrives sRGB-encoded; compare in the same space the texture is sampled in.
    key.convertSRGBToLinear();
    const m = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uKey = { value: key };
      shader.fragmentShader = shader.fragmentShader.replace('void main() {', 'uniform vec3 uKey;\nvoid main() {').replace('#include <map_fragment>', MAP_FRAGMENT);
    };
    m.customProgramCacheKey = () => 'shipyard-crew-sheet';
    return m;
  }, [texture]);
  useEffect(() => () => material.dispose(), [material]);
  // The figure fills about nine tenths of the square sheet's height.
  const h = member.model.heightM / 0.9;
  return (
    <Billboard lockX lockZ position={[0, h / 2 - 0.03, 0]} name={`sheet-${member.id}`}>
      <mesh material={material}>
        <planeGeometry args={[h, h]} />
      </mesh>
    </Billboard>
  );
}
