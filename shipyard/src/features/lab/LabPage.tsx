// `#/lab` — the artifact lab: a harness, not a product screen (not in the nav). It proves T5 from the
// outside, the way the Armory (T7) and the Bridge editor (T6) will use it:
//   1. every registry skill drawn through `ArtifactMesh` (one canvas), with its glyph in the DOM;
//   2. one artifact in the inspector (`ArtifactInspector`, what the Armory mounts);
//   3. an equip on the store appearing on a body: clone SS Full Run into the drydock, pick a member
//      and a skill, equip, and the Turntable shows it within a frame; unequip takes it off.
import { lazy, Suspense, useMemo, useState } from 'react';
import '../../styles/ship.css';
import { TruthLabel } from '../../components/TruthLabel';
import { equip } from '../../domain/loadout';
import { isFamilyId } from '../../scene/artifacts/families';
import { FamilyGlyph } from '../../scene/artifacts/glyphs';
import { useKb } from '../../kb/context';
import { force2d, hasWebGL, useReducedMotion } from '../../lib/preferences';
import { sceneCrew } from '../../scene/crew';
import { useDispatch, useStoreState } from '../../store/context';
import { useShip } from '../shared/useShip';
import type { ArtifactSpec } from '../../scene/artifacts/sheet';

const Turntable = lazy(() => import('../../scene/Turntable').then((m) => ({ default: m.Turntable })));
const ArtifactSheet = lazy(() => import('../../scene/artifacts/ArtifactInspector').then((m) => ({ default: m.ArtifactSheet })));
const ArtifactInspector = lazy(() => import('../../scene/artifacts/ArtifactInspector').then((m) => ({ default: m.ArtifactInspector })));

export const LAB_SHIP_ID = 'lab-ship';

export default function LabPage() {
  const idx = useKb();
  const reduced = useReducedMotion();
  const dispatch = useDispatch();
  const { ships } = useStoreState();
  const [sceneFailed, setSceneFailed] = useState(false);
  const webgl = hasWebGL() && !force2d() && !sceneFailed;
  const source = useShip('ss-full-run');
  const labShip = useShip(LAB_SHIP_ID);
  const owned = ships.some((s) => s.id === LAB_SHIP_ID);

  const specs = useMemo<ArtifactSpec[]>(() => idx.kb.skills.map((s) => ({ skill: s.id, family: s.artifact.family, pigment: s.artifact.pigment })), [idx]);
  const [picked, setPicked] = useState('visual-qa');
  const pickedSpec = specs.find((s) => s.skill === picked) ?? specs[0];

  const [memberId, setMemberId] = useState('strategist');
  const [skill, setSkill] = useState('gsap-core');
  const [message, setMessage] = useState<string>('');

  const crew = useMemo(() => (labShip && owned ? sceneCrew(idx, labShip) : []), [idx, labShip, owned]);
  const member = crew.find((m) => m.id === memberId) ?? crew[0];

  const doEquip = () => {
    if (!labShip || !owned) return;
    const result = equip(idx, labShip, memberId, skill);
    setMessage(result.ok ? `Equipped ${skill} on ${memberId}: ${result.anchor} socket ${result.index}.` : `Refused: ${result.reason}`);
    dispatch({ type: 'loadout/equip', shipId: LAB_SHIP_ID, member: memberId, skill });
  };

  return (
    <main id="main" className="page lab" data-testid="lab" data-webgl={webgl || undefined}>
      <p className="label">Lab · not a product screen</p>
      <h1 className="page-title">Artifact lab</h1>
      <p className="prose">
        Every registry skill drawn through <code>ArtifactMesh</code>, the inspector the Armory mounts, and an equip on the store appearing on a body.
      </p>

      <section aria-labelledby="lab-all" className="lab-block">
        <h2 id="lab-all" className="section-head">
          All {specs.length} artifacts <TruthLabel truth="Verified" detail={`KB ${idx.kb.sourceHash.slice(0, 8)}`} />
        </h2>
        {webgl ? (
          <Suspense fallback={<p className="state-line">Loading the scene…</p>}>
            <ArtifactSheet artifacts={specs} reduced={reduced} onContextLost={() => setSceneFailed(true)} />
          </Suspense>
        ) : (
          <p className="state-line" data-testid="lab-no-webgl">
            No WebGL here: the glyph list below carries every artifact.
          </p>
        )}
        <ul className="lab-glyphs" data-testid="lab-glyphs">
          {specs.map((s) => (
            <li key={s.skill} data-skill={s.skill} data-family={s.family}>
              <button type="button" className="lab-glyph-btn" aria-pressed={picked === s.skill} onClick={() => setPicked(s.skill)} title={s.skill}>
                {isFamilyId(s.family) ? <FamilyGlyph family={s.family} pigment={s.pigment} size={22} /> : null}
                <span>{s.skill}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="lab-inspect" className="lab-block">
        <h2 id="lab-inspect" className="section-head">
          Inspector
        </h2>
        <div className="lab-inspect-row">
          {webgl ? (
            <Suspense fallback={<p className="state-line">Loading the scene…</p>}>
              <ArtifactInspector artifact={pickedSpec} reduced={reduced} />
            </Suspense>
          ) : (
            isFamilyId(pickedSpec.family) && <FamilyGlyph family={pickedSpec.family} pigment={pickedSpec.pigment} size={160} />
          )}
          <p className="stat" data-testid="lab-picked">
            {pickedSpec.skill} · {pickedSpec.family}
          </p>
        </div>
      </section>

      <section aria-labelledby="lab-equip" className="lab-block">
        <h2 id="lab-equip" className="section-head">
          Equip on the store
        </h2>
        {!owned ? (
          <div className="row">
            <button type="button" className="btn btn-primary" data-testid="lab-clone" disabled={!source} onClick={() => source && dispatch({ type: 'ship/clone', source, name: 'Lab ship' })}>
              Clone SS Full Run into the drydock
            </button>
            <span className="label">Creates a custom ship called Lab ship.</span>
          </div>
        ) : (
          <div className="stack">
            <div className="row">
              <label className="lab-field">
                <span className="label">Member</span>
                <select data-testid="lab-member" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                  {crew.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="lab-field">
                <span className="label">Skill</span>
                <select data-testid="lab-skill" value={skill} onChange={(e) => setSkill(e.target.value)}>
                  {specs.map((s) => (
                    <option key={s.skill} value={s.skill}>
                      {s.skill}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="btn btn-primary" data-testid="lab-equip" onClick={doEquip}>
                Equip
              </button>
              <button type="button" className="btn btn-quiet" data-testid="lab-delete" onClick={() => dispatch({ type: 'ship/delete', id: LAB_SHIP_ID })}>
                Delete the lab ship
              </button>
            </div>
            <p className="stat" role="status" data-testid="lab-result">
              {message}
            </p>
            {member && (
              <div className="lab-body-row">
                {webgl ? (
                  <Suspense fallback={<p className="state-line">Loading the scene…</p>}>
                    <Turntable member={member} reduced={reduced} onContextLost={() => setSceneFailed(true)} />
                  </Suspense>
                ) : null}
                <ul className="lab-worn" data-testid="lab-worn" aria-label={`${member.name} wears`}>
                  {member.loadout.map((a) => (
                    <li key={a.skill} data-skill={a.skill} data-anchor={a.anchor}>
                      {isFamilyId(a.family) && <FamilyGlyph family={a.family} pigment={a.pigment} size={20} />}
                      <span>{a.name}</span>
                      <code>{a.skill}</code>
                      <span className="label">{a.anchor}</span>
                      <button type="button" className="btn btn-quiet btn-sm" data-testid={`lab-unequip-${a.skill}`} onClick={() => dispatch({ type: 'loadout/unequip', shipId: LAB_SHIP_ID, member: member.id, skill: a.skill })}>
                        Unequip
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
