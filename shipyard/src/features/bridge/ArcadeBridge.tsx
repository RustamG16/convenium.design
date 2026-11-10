// v3 Bridge pieces (plan/13 § Bridge; reference bridge-space-arcade.png): the crew render on its holo
// pedestal, and the agent's stats. Every stat is a real measure from the knowledge base or the ship.
import type { CSSProperties, ReactNode } from 'react';
import { Portrait } from '../../components/Portrait';
import { TruthLabel } from '../../components/TruthLabel';
import type { Member } from '../../domain/schema';
import type { KbIndex } from '../../kb/artifacts';
import { crewArt } from '../../lib/arcadeArt';
import type { SceneMember } from '../../scene/crew';

/** The alien crew render on a glowing pedestal; worn orbit artifacts circle the head as gold discs. */
export function CrewStage({ member, orbit, children }: { member: SceneMember; orbit: number; children?: ReactNode }) {
  const art = crewArt(member.agent) ?? crewArt(member.id);
  return (
    <div className="br-stage" data-testid="crew-stage" data-member={member.id} style={{ ['--c' as string]: member.pigment } as CSSProperties}>
      <span className="br-banner" aria-hidden="true" />
      {orbit > 0 && (
        <span className="br-orbit" aria-hidden="true">
          {Array.from({ length: Math.min(orbit, 3) }, (_, i) => (
            <span key={i} className="br-coin" style={{ ['--i' as string]: i, ['--n' as string]: Math.min(orbit, 3) } as CSSProperties} />
          ))}
        </span>
      )}
      {art ? <img className="br-figure" src={art.stage} alt={`${member.name}, ${member.role.title}`} /> : <Portrait member={member} />}
      <span className="br-pedestal" aria-hidden="true" />
      {children}
    </div>
  );
}

const TIER_RANK: Record<string, number> = { haiku: 1, sonnet: 2, opus: 3 };

function Meter({ value, max, tint }: { value: number; max: number; tint: string }) {
  const segs = 10;
  const on = max > 0 ? Math.round((value / max) * segs) : 0;
  return (
    <span className="br-meter" aria-hidden="true" style={{ ['--t' as string]: tint } as CSSProperties}>
      {Array.from({ length: segs }, (_, i) => (
        <span key={i} data-on={i < on || undefined} />
      ))}
    </span>
  );
}

/**
 * The reference's "Agent stats" panel, filled with real measures: the skills on the agent's route
 * (against the widest route in the library), the artifacts worn (of the sockets), and the model tier
 * this ship spawns it at (Haiku 1, Sonnet 2, Opus 3).
 */
export function AgentStats({ idx, member, runs, worn, capacity }: { idx: KbIndex; member: Member; runs: string; worn: number; capacity: number }) {
  const routes = idx.agent.get(member.agent)?.routes.length ?? 0;
  const widest = Math.max(1, ...idx.kb.agents.map((a) => a.routes.length));
  const rows = [
    { id: 'routes', label: 'Skills on route', value: routes, max: widest, shown: String(routes), tint: '#45d39a', icon: 'M13 2L5 14h6l-1 8 8-12h-6z' },
    { id: 'worn', label: 'Artifacts worn', value: worn, max: capacity, shown: `${worn}/${capacity}`, tint: '#c36bff', icon: 'M12 3v3m0 12v3m9-9h-3M6 12H3m15 0a6 6 0 1 1-12 0 6 6 0 0 1 12 0z' },
    { id: 'tier', label: 'Model tier', value: TIER_RANK[runs] ?? 0, max: 3, shown: runs, tint: '#f4b740', icon: 'M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5' },
  ];
  return (
    <section className="br-stats" aria-labelledby="br-stats-h" data-testid="agent-stats">
      <h2 id="br-stats-h" className="br-panel-h">
        Agent stats
      </h2>
      <dl className="br-stat-list">
        {rows.map((r) => (
          <div key={r.id} className="br-stat" data-stat={r.id}>
            <dt>
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ color: r.tint }}>
                <path d={r.icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
              {r.label}
            </dt>
            <dd>
              <Meter value={r.value} max={r.max} tint={r.tint} />
              <span className="br-stat-num num">{r.shown}</span>
            </dd>
          </div>
        ))}
      </dl>
      <TruthLabel truth="Verified" detail="from the agent file and this ship" />
    </section>
  );
}
