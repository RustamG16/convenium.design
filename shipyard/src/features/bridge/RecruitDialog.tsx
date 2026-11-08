// Recruit (1 to 8 crew): pick the runtime agent the member plays (fixed once recruited), then the
// cosmetic character. The loadout is derived from the agent's routes and the slots it owns.
import * as Dialog from '@radix-ui/react-dialog';
import { useState, type CSSProperties } from 'react';
import { memberSlug, MAX_CREW, SWATCHES, suggestBody, suggestPigment } from '../../domain/crew';
import { BODY_IDS, type AgentId, type Character, type Ship } from '../../domain/schema';
import { useKb } from '../../kb/context';
import { useDispatch } from '../../store/context';
import { useNotify } from '../shared/notices';

export function RecruitDialog({ ship, onClose, onRecruited }: { ship: Ship; onClose: () => void; onRecruited: (memberId: string) => void }) {
  const idx = useKb();
  const dispatch = useDispatch();
  const notify = useNotify();
  const [agent, setAgent] = useState<AgentId>('design-engineer');
  const [name, setName] = useState('');
  const [body, setBody] = useState<Character['body']>(suggestBody(ship));
  const [pigment, setPigment] = useState<string>(suggestPigment(ship));
  const desc = idx.agent.get(agent)?.description ?? '';
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog dialog-tall" data-testid="recruit-dialog" aria-describedby={undefined}>
          <Dialog.Title className="card-title">Recruit to {ship.name}</Dialog.Title>
          <p className="muted sheet-line">{ship.crew.length} of {MAX_CREW} aboard. The agent a recruit plays is fixed; the character is yours to shape.</p>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              const id = memberSlug(ship.crew.map((m) => m.id), name.trim());
              dispatch({ type: 'crew/recruit', shipId: ship.id, input: { agent, name, body, pigment } });
              notify(`${name.trim()} recruited as ${agent}.`, { undo: true });
              onRecruited(id);
              onClose();
            }}
          >
            <label className="field-row"><span className="label">Name</span><input className="field" required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} data-testid="recruit-name" autoFocus /></label>
            <label className="field-row"><span className="label">Runtime agent</span>
              <select className="field" value={agent} onChange={(e) => setAgent(e.target.value as AgentId)} data-testid="recruit-agent">
                {idx.kb.agents.map((x) => x.id).map((a) => <option key={a} value={a}>{a} ({idx.agent.get(a)?.access === 'write' ? 'writes' : 'read-only'}, {idx.agent.get(a)?.model})</option>)}
              </select>
              <span className="muted sheet-line">{desc.slice(0, 220)}</span>
            </label>
            <fieldset className="menu-group"><legend className="label">Body</legend>
              <div className="choice-row">
                {BODY_IDS.map((b) => <label key={b} className="choice"><input type="radio" name="rbody" checked={body === b} onChange={() => setBody(b)} data-testid={`recruit-body-${b}`} /><span>{b === 'standin' ? 'Stand-in' : b.charAt(0).toUpperCase() + b.slice(1)}</span></label>)}
              </div>
            </fieldset>
            <fieldset className="menu-group"><legend className="label">Pigment</legend>
              <div className="choice-row">
                {SWATCHES.map((c, i) => (
                  <label key={c} className="swatch" style={{ ['--sw' as string]: c } as CSSProperties}>
                    <input type="radio" name="rpig" checked={pigment === c} onChange={() => setPigment(c)} aria-label={`Pigment ${i + 1}, ${c}`} />
                    <span aria-hidden="true" />
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="dialog-actions">
              <button type="submit" className="btn btn-primary" data-testid="recruit-confirm">Recruit</button>
              <Dialog.Close className="btn btn-quiet">Cancel</Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
