// The crew ecosystem: the ship as a graph (06 section 4.3). Nodes are the ship's crew, placed in
// phase columns by the phase of their first stage; edges follow the stage order (a hands to b), and
// an edge's label is the artifact the receiving stage opens. Click a node to open that member.
// Ported from ArkhEthos `EcosystemMap.tsx` (xyflow, no drag, no zoom on scroll); the slot chips
// became the active artifact, and the phase-3 simulation node is gone.
import '@xyflow/react/dist/style.css';
import { Background, BackgroundVariant, Position, ReactFlow, type Edge, type Node } from '@xyflow/react';
import { useMemo, type CSSProperties } from 'react';
import { isStage, PHASE_IDS, type Phase, type Ship } from '../../domain/schema';
import type { SceneMember } from '../../scene/crew';

const COL = 230;
const ROW = 132;

const PHASE_LABEL: Record<Phase, string> = { always: 'Always', diagnose: 'Diagnose', direct: 'Direct', prepare: 'Prepare', build: 'Build', verify: 'Verify' };

export interface EcosystemMapProps {
  ship: Ship;
  crew: readonly SceneMember[];
  activeId: string;
  onSelect: (id: string) => void;
}

export default function EcosystemMap({ ship, crew, activeId, onSelect }: EcosystemMapProps) {
  const { nodes, edges, phases } = useMemo(() => buildGraph(ship, crew, activeId), [ship, crew, activeId]);
  return (
    <section className="ship-eco" aria-label="Crew ecosystem" data-testid="ecosystem-map">
      <header className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--s2)', flexWrap: 'wrap' }}>
        <div>
          <h2 className="ship-rack-title">Crew ecosystem</h2>
          <p className="muted sheet-line" style={{ margin: 0 }}>
            Stages hand work from one member to the next. An edge names the artifact the next stage opens.
          </p>
        </div>
        <ol className="ship-eco-phases" aria-label="Phases">
          {phases.map((p) => (
            <li key={p}>{PHASE_LABEL[p]}</li>
          ))}
        </ol>
      </header>
      <div className="ship-eco-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnScroll={false}
          zoomOnScroll={false}
          minZoom={0.4}
          maxZoom={1.4}
          proOptions={{ hideAttribution: true }}
          onNodeClick={(_, n) => onSelect(n.id)}
        >
          <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="#2B2525" />
        </ReactFlow>
      </div>
    </section>
  );
}

function buildGraph(ship: Ship, crew: readonly SceneMember[], activeId: string) {
  const stages = ship.voyage.filter(isStage);
  const phaseOf = new Map<string, Phase>();
  for (const s of stages) if (!phaseOf.has(s.member)) phaseOf.set(s.member, s.phase);
  const phases = PHASE_IDS.filter((p) => crew.some((m) => (phaseOf.get(m.id) ?? 'always') === p));
  const col = (m: SceneMember) => phases.indexOf(phaseOf.get(m.id) ?? 'always');

  const rows = new Map<number, SceneMember[]>();
  for (const m of [...crew].sort((a, b) => a.station - b.station)) rows.set(col(m), [...(rows.get(col(m)) ?? []), m]);

  const nodes: Node[] = [];
  for (const [c, members] of rows) {
    members.forEach((m, row) => {
      const active = m.id === activeId;
      nodes.push({
        id: m.id,
        position: { x: c * COL, y: row * ROW + (members.length === 1 ? ROW * 0.5 : 0) },
        data: {
          label: (
            <div className="ship-eco-node" data-active={active || undefined} style={{ ['--c' as string]: m.pigment } as CSSProperties}>
              <span className="ship-eco-name">
                <span className="ship-rail-station num" aria-hidden="true">
                  {m.station}
                </span>
                {m.name}
              </span>
              <span className="muted ship-eco-role">{m.role.agent}</span>
              <span className="muted ship-eco-role">carries {m.loadout.length}</span>
            </div>
          ),
        },
        style: { background: 'transparent', border: 'none', padding: 0, width: 210 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    });
  }

  const edges: Edge[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < stages.length - 1; i++) {
    const a = stages[i];
    const b = stages[i + 1];
    if (a.member === b.member || !phaseOf.has(a.member) || !phaseOf.has(b.member)) continue;
    if (!crew.some((m) => m.id === a.member) || !crew.some((m) => m.id === b.member)) continue;
    const id = `${a.member}-${b.member}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const hot = a.member === activeId || b.member === activeId;
    edges.push({
      id,
      source: a.member,
      target: b.member,
      label: b.activeSkill ?? undefined,
      animated: hot,
      style: { stroke: hot ? (crew.find((m) => m.id === a.member)?.pigment ?? '#6B5B55') : '#6B5B55', strokeWidth: 1.75 },
      labelStyle: { fill: '#CBBFB8', fontSize: 11 },
      labelBgStyle: { fill: '#1A1414' },
    });
  }
  return { nodes, edges, phases };
}
