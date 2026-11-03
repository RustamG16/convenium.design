// The Armory (06 section 4.4): filters, the virtualised artifact grid, the inspector, and the Charts
// and Modules tabs. One component, two homes: the `#/armory` page (filters left, inspector right at
// 1200 and up) and the drawer on the Bridge (search and family only, so the Bridge's turntable and
// rack stay on screen as drop targets). Under 1200 the inspector is a sheet; under 768 it is
// full-screen and the grid is two columns.
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Member, Ship } from '../../domain/schema';
import { useKb } from '../../kb/context';
import { useMinWidth } from '../../lib/preferences';
import { useDispatch, useStoreState } from '../../store/context';
import { ArtifactDetail } from './ArtifactDetail';
import { ArtifactGrid } from './ArtifactGrid';
import { buildHaystack, familyCounts, filterEntries, NO_FILTERS, PHASES, type Filters } from './search';
import { ChartsTab, ModulesTab } from './ShipModules';

export interface ArmoryViewProps {
  variant: 'page' | 'drawer';
  /** the ship (editable) and member artifacts are equipped to */
  ship?: Ship;
  member?: Member;
  /** an artifact to show open at first (a link from pre-flight or the codex) */
  initialSkill?: string | null;
  onClose?: () => void;
  /** the equip target panel: the left column when there is one, above the grid otherwise */
  targetPanel?: ReactNode;
}

export function ArmoryView({ variant, ship, member, initialSkill = null, onClose, targetPanel }: ArmoryViewProps) {
  const idx = useKb();
  const dispatch = useDispatch();
  const { codex } = useStoreState();
  const wide = useMinWidth(1200);
  const phone = !useMinWidth(768);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [selected, setSelected] = useState<string | null>(initialSkill);
  const [tab, setTab] = useState('artifacts');
  const entries = useMemo(() => buildHaystack(idx.kb.skills), [idx]);
  const deferred = useDeferredValue(filters);
  const codexSet = useMemo(() => new Set(codex), [codex]);
  const agent = member?.agent;
  const list = useMemo(() => filterEntries(entries, deferred, { codex: codexSet, idx, agent }), [entries, deferred, codexSet, idx, agent]);
  const counts = useMemo(() => familyCounts(idx.kb.skills), [idx]);
  const families = idx.kb.families;
  const skill = selected ? idx.skill.get(selected) : undefined;
  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));

  // Opening an artifact's inspector counts once per id toward the codex line (Simulated: curiosity, not skill).
  useEffect(() => {
    if (selected && idx.skill.has(selected)) dispatch({ type: 'codex/inspect', skill: selected });
  }, [selected, idx, dispatch]);

  const inlineInspector = variant === 'page' && wide;
  const wideSide = variant === 'page' && wide;
  const searchField = (
      <label className="field-row" key="search">
        <span className="label">Search</span>
        <input className="field" type="search" value={filters.q} onChange={(e) => set({ q: e.target.value })} placeholder="Name, skill id or description" data-testid="armory-search" aria-label="Search artifacts" />
      </label>
  );
  const filtersPanel = (
    <div className="armory-filters stack-sm" data-testid="armory-filters">
      {wideSide && searchField}
      <label className="field-row">
        <span className="label">Category</span>
        <select className="field" value={filters.family ?? ''} onChange={(e) => set({ family: e.target.value || null })} data-testid="filter-family">
          <option value="">All ({idx.kb.skills.length})</option>
          {families.map((f) => <option key={f.id} value={f.id}>{f.name} ({counts.get(f.id) ?? 0})</option>)}
        </select>
      </label>
      {variant === 'page' && (
        <>
          <label className="field-row">
            <span className="label">Phase</span>
            <select className="field" value={filters.phase ?? ''} onChange={(e) => set({ phase: e.target.value || null })} data-testid="filter-phase">
              <option value="">Any phase</option>
              {PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="field-row">
            <span className="label">Tier</span>
            <select className="field" value={filters.tier ?? ''} onChange={(e) => set({ tier: e.target.value || null })} data-testid="filter-tier">
              <option value="">Any tier</option>
              {idx.kb.tiers.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
        </>
      )}
      <label className="menu-radio">
        <input type="checkbox" checked={filters.fits} disabled={!member} onChange={(e) => set({ fits: e.target.checked })} data-testid="filter-fits" />
        <span>{member ? `Fits ${member.character.name}` : 'Fits the selected member'}</span>
      </label>
      <label className="menu-radio">
        <input type="checkbox" checked={filters.uninspected} onChange={(e) => set({ uninspected: e.target.checked })} data-testid="filter-uninspected" />
        <span>Not yet inspected</span>
      </label>
      <button type="button" className="btn btn-quiet btn-sm" onClick={() => setFilters(NO_FILTERS)} data-testid="filter-clear">Clear filters</button>
    </div>
  );

  const artifacts = (
    <>
      <p className="muted sheet-line" data-testid="armory-count" aria-live="polite">
        <span className="num">{list.length}</span> of <span className="num">{idx.kb.skills.length}</span> artifacts
      </p>
      <ArtifactGrid idx={idx} skills={list} selected={selected} onSelect={setSelected} ship={ship} minCard={phone ? 150 : 200} />
    </>
  );

  const inspector = skill ? <ArtifactDetail key={skill.id} idx={idx} skill={skill} /> : <p className="state-line" data-testid="detail-empty">Pick an artifact to inspect it.</p>;

  return (
    <div className="armory" data-variant={variant} data-testid="armory">
      <Tabs.Root value={tab} onValueChange={setTab}>
        <div className="armory-head row">
          <Tabs.List className="tabs" aria-label="Armory sections">
            <Tabs.Trigger className="tab" value="artifacts" data-testid="tab-artifacts">Artifacts</Tabs.Trigger>
            <Tabs.Trigger className="tab" value="charts" data-testid="tab-charts">Charts</Tabs.Trigger>
            <Tabs.Trigger className="tab" value="modules" data-testid="tab-modules">Modules</Tabs.Trigger>
          </Tabs.List>
          {onClose && <button type="button" className="btn btn-quiet btn-sm" onClick={onClose} data-testid="armory-close">Close Armory</button>}
        </div>
        <Tabs.Content value="artifacts" className="armory-body" data-inline={inlineInspector || undefined}>
          {variant === 'page' && wide ? <aside className="armory-side stack" aria-label="Filters and target">{targetPanel}{filtersPanel}</aside> : <details className="armory-filters-sheet" open={variant === 'drawer'}><summary className="btn btn-quiet btn-sm">Filters</summary>{filtersPanel}</details>}
          <div className="armory-main">{!wideSide && targetPanel}{!wideSide && searchField}{artifacts}</div>
          {inlineInspector && <aside className="armory-inspector" aria-label="Inspector">{inspector}</aside>}
        </Tabs.Content>
        <Tabs.Content value="charts"><ChartsTab ship={ship} /></Tabs.Content>
        <Tabs.Content value="modules"><ModulesTab ship={ship} /></Tabs.Content>
      </Tabs.Root>
      {!inlineInspector && skill && tab === 'artifacts' && (
        <Dialog.Root open onOpenChange={(o) => !o && setSelected(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="dialog-overlay" />
            <Dialog.Content className="dialog dialog-sheet" data-testid="inspector-sheet" aria-describedby={undefined}>
              <Dialog.Title className="sr-only">Inspector: {skill.artifact.name}</Dialog.Title>
              {inspector}
              <Dialog.Close className="btn btn-quiet" data-testid="inspector-close">Close</Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
