// Two ways to look at artifacts without a body, both drawn through `ArtifactMesh`:
//
// - `ArtifactInspector`: one artifact on a slow turntable (the Armory inspector in T7 mounts this
//   in its 420 px panel; the DOM fallback there is the large `FamilyGlyph`).
// - `ArtifactSheet`: every artifact of a list laid out on a grid in ONE canvas (one WebGL context),
//   sorted family by family. The lab proves all registry skills render with it.
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import { ArtifactMesh } from './ArtifactMesh';
import { sheetOrder, type ArtifactSpec } from './sheet';

function Studio({ pigment }: { pigment: string }) {
  return (
    <>
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[2.5, 2.5, 3]} scale={[4, 4, 1]} color="#fff2e0" />
        <Lightformer form="rect" intensity={1.2} position={[-3, 1.5, 1]} scale={[3, 5, 1]} color={pigment} />
        <Lightformer form="rect" intensity={1.6} position={[0, 4, -3]} scale={[6, 2, 1]} color="#fff6ea" />
      </Environment>
      <hemisphereLight args={['#fff6ea', '#2a2320', 2.2]} />
      <directionalLight position={[2, 4, 3]} intensity={3.5} />
    </>
  );
}

export function ArtifactInspector({ artifact, reduced, onContextLost }: { artifact: ArtifactSpec; reduced: boolean; onContextLost?: () => void }) {
  return (
    <div className="artifact-inspector" data-testid="artifact-inspector" data-skill={artifact.skill} role="img" aria-label={`${artifact.skill}, ${artifact.family} artifact, 3D`}>
      <Canvas
        dpr={[1, 1.5]}
        frameloop={reduced ? 'demand' : 'always'}
        camera={{ position: [0, 0.1, 0.8], fov: 34, near: 0.05, far: 20 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            onContextLost?.();
          });
        }}
      >
        <Studio pigment={artifact.pigment} />
        <ArtifactMesh key={artifact.skill} family={artifact.family} pigment={artifact.pigment} skill={artifact.skill} pose="held" animate={!reduced} active={artifact.active} />
        <OrbitControls enablePan={false} enableZoom={false} autoRotate={!reduced} autoRotateSpeed={2} minPolarAngle={0.6} maxPolarAngle={2.2} />
      </Canvas>
    </div>
  );
}

const COLS = 13;
const CELL = 0.62;

export function ArtifactSheet({ artifacts, reduced, onContextLost }: { artifacts: readonly ArtifactSpec[]; reduced: boolean; onContextLost?: () => void }) {
  const ordered = useMemo(() => sheetOrder(artifacts), [artifacts]);
  const rows = Math.ceil(ordered.length / COLS);
  const width = COLS * CELL;
  const height = rows * CELL;
  // Fit the grid in view: a vertical fov of 36 degrees at a distance that holds the wider side.
  const dist = Math.max(height / 2 / Math.tan((36 / 2) * (Math.PI / 180)), width / 2 / Math.tan((36 / 2) * (Math.PI / 180)) / 1.7) * 1.08;
  return (
    <div className="artifact-sheet" data-testid="artifact-sheet" data-count={ordered.length} role="img" aria-label={`${ordered.length} artifacts, 3D`}>
      <Canvas
        dpr={[1, 1.5]}
        frameloop={reduced ? 'demand' : 'always'}
        camera={{ position: [0, 0, dist], fov: 36, near: 0.1, far: 80 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        onCreated={({ gl, scene, get }) => {
          if (import.meta.env.DEV) (window as unknown as { __sheet?: unknown }).__sheet = { scene, get };
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            onContextLost?.();
          });
        }}
      >
        <Studio pigment="#e8c46a" />
        {ordered.map((a, i) => (
          <group key={a.skill} position={[((i % COLS) - (COLS - 1) / 2) * CELL, (rows / 2 - 0.5 - Math.floor(i / COLS)) * CELL, 0]}>
            <ArtifactMesh family={a.family} pigment={a.pigment} skill={a.skill} pose="worn" animate={!reduced} active={a.active} />
          </group>
        ))}
      </Canvas>
    </div>
  );
}
