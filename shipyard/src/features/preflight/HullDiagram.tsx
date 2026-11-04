import type { Check, HullGroup } from '../../domain/preflight';
import { groupStatus, StatusMark } from './StatusMark';

/** Stern to bow: the order the hull lights in (the clean-pre-flight sweep lights them in this order). */
export const HULL_PANELS: { group: HullGroup; name: string; x: number }[] = [
  { group: 'crew', name: 'Crew', x: 104 },
  { group: 'stages', name: 'Stages', x: 166 },
  { group: 'parallel', name: 'Parallel', x: 228 },
  { group: 'gates', name: 'Gates', x: 290 },
  { group: 'library', name: 'Library', x: 352 },
];

const PANEL_W = 52;
const PANEL_H = 48;
const PANEL_Y = 62;

export interface PanelState {
  group: HullGroup;
  name: string;
  passed: number;
  applicable: number;
  status: ReturnType<typeof groupStatus>;
}

export function panelStates(checks: Check[]): PanelState[] {
  return HULL_PANELS.map(({ group, name }) => {
    const mine = checks.filter((c) => c.group === group);
    const live = mine.filter((c) => c.status !== 'na');
    return {
      group,
      name,
      passed: live.filter((c) => c.status === 'pass' || c.status === 'info').length,
      applicable: live.length,
      status: groupStatus(mine),
    };
  });
}

/** One panel per rule group on a hull profile; a panel fills as its checks pass. Drawing only: the list below says it in words. */
export function HullDiagram({ checks }: { checks: Check[] }) {
  const panels = panelStates(checks);
  return (
    <div className="hull-diagram" data-testid="hull-diagram">
      <svg viewBox="0 0 480 170" aria-hidden="true" focusable="false" className="hull-svg">
        <defs>
          <pattern id="pf-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--chili-soft)" strokeWidth="2" />
          </pattern>
        </defs>
        <path d="M8 86 L84 50 L400 42 L472 86 L400 130 L84 122 Z" fill="var(--surface)" stroke="var(--muted)" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M84 50 L110 20 L262 20 L286 45" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M84 122 L112 150 L270 150 L296 127" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinejoin="round" />
        {HULL_PANELS.map(({ group, x }, i) => {
          const p = panels[i];
          const fraction = p.applicable === 0 ? 0 : p.passed / p.applicable;
          const fillH = PANEL_H * fraction;
          const dash = p.status === 'warn' ? '5 3' : p.status === 'na' ? '1.5 3' : undefined;
          const edge = p.status === 'block' ? 'var(--chili-soft)' : p.status === 'na' ? 'var(--muted)' : 'var(--cotton)';
          return (
            <g key={group} data-panel={group} data-status={p.status} data-lit={fraction === 1 && p.applicable > 0 ? 'true' : 'false'}>
              <rect x={x} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx="4" fill="var(--bg)" />
              <rect x={x} y={PANEL_Y + PANEL_H - fillH} width={PANEL_W} height={fillH} rx="4" fill="var(--cotton)" opacity={p.status === 'pass' ? 0.9 : 0.5} />
              {p.status === 'block' && <rect x={x} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx="4" fill="url(#pf-hatch)" opacity="0.8" />}
              <rect x={x} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx="4" fill="none" stroke={edge} strokeWidth={p.status === 'block' ? 3 : 1.5} strokeDasharray={dash} />
              <rect className="hull-light" data-light={group} x={x} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx="4" />
            </g>
          );
        })}
      </svg>
      <ul className="hull-legend" aria-label="Hull panels, stern to bow">
        {panels.map((p) => (
          <li key={p.group} data-group={p.group} data-status={p.status}>
            <StatusMark status={p.status} withWord={false} />
            <span className="hull-legend-name">{p.name}</span>
            <span className="stat">
              {p.status === 'na' ? 'n.a.' : `${p.passed} of ${p.applicable}`}
              <span className="sr-only">
                {' '}
                checks pass, panel {p.status === 'pass' ? 'lit' : p.status === 'warn' ? 'has a warning' : p.status === 'block' ? 'is blocked' : 'not applicable'}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
