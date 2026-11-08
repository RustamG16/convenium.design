import { useId, useState } from 'react';
import { TruthLabel } from '../../components/TruthLabel';
import { isAbsolutePath, normalizePath, renderKickoffPrompt, renderRunPlan, renderShipJson } from '../../domain/export';
import type { PreflightReport } from '../../domain/preflight';
import type { LogEntry, Ship } from '../../domain/schema';
import { useKb } from '../../kb/context';
import { useDispatch, useStoreState } from '../../store/context';
import { downloadText, saveToShips } from '../../store/files';
import { parseVerifyOutput, verifyWords } from './verifyOutput';

interface Props {
  ship: Ship;
  report: PreflightReport;
}

/**
 * Export: three files and a prompt, then the owner's own check. Everything is enabled only without a
 * blocker (06 section 4.6), and the first blocker is named when it is not. Each export is a logbook row
 * (Verified: the file was made from this ship); a pasted verify.py result is a row too (User-reported).
 */
export function ExportPanel({ ship, report }: Props) {
  const idx = useKb();
  const dispatch = useDispatch();
  const { ui, logbook } = useStoreState();
  const pathId = useId();
  const pasteId = useId();
  const [message, setMessage] = useState('');
  const [showKickoff, setShowKickoff] = useState(false);
  const [paste, setPaste] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [recorded, setRecorded] = useState<{ problems: number } | null>(null);

  const path = ui.designPath;
  const pathOk = isAbsolutePath(path);
  const root = normalizePath(path);
  const blocker = report.checks.find((c) => c.status === 'block');
  const blocked = !report.canExport;
  const planExports = (logbook[ship.id] ?? []).filter((e) => e.kind === 'export' && e.file === '00-run-plan.md').length;

  const note = `Hull ${report.integrity}%, ${report.clean ? 'clean' : `${report.warnings} ${report.warnings === 1 ? 'warning' : 'warnings'}`}`;
  const log = (file: string) => {
    const entry: LogEntry = { at: new Date().toISOString(), kind: 'export', truth: 'Verified', file, hull: report.integrity, clean: report.clean, note };
    dispatch({ type: 'log/add', shipId: ship.id, entry });
  };
  const now = () => new Date().toISOString();

  const downloadShip = () => {
    downloadText(`${ship.id}.ship.json`, renderShipJson(ship));
    log('ship.json');
    setMessage(`Downloaded ${ship.id}.ship.json.`);
  };
  const downloadPlan = () => {
    downloadText('00-run-plan.md', renderRunPlan(idx, ship, root, now()), 'text/markdown');
    log('00-run-plan.md');
    setMessage('Downloaded 00-run-plan.md. Copy it to .olympus/ in the site project, then check it with the command below.');
  };
  const copyKickoff = async () => {
    try {
      await navigator.clipboard.writeText(renderKickoffPrompt(ship, root));
      log('kickoff prompt');
      setMessage('Kickoff prompt copied.');
    } catch {
      setShowKickoff(true);
      setMessage('The browser blocked copying. The prompt is open below: select it and copy.');
    }
  };
  const save = async () => {
    const result = await saveToShips(ship);
    if (result.ok) {
      log(result.path);
      setMessage(`Saved ${result.path}.`);
    } else {
      setMessage(`Not saved: ${result.reason}`);
    }
  };

  const command = `python ${root || '<Convenium.Design>'}/library/tools/verify.py --plan .olympus/00-run-plan.md`;
  const record = () => {
    const parsed = parseVerifyOutput(paste);
    if (!parsed.ok) {
      setPasteError(parsed.reason);
      return;
    }
    setPasteError('');
    dispatch({
      type: 'log/add',
      shipId: ship.id,
      entry: { at: now(), kind: 'verify-result', truth: 'User-reported', problems: parsed.problems, note: parsed.clean ? 'verify.py --plan: CLEAN' : `verify.py --plan: ${verifyWords(parsed.problems)}` },
    });
    setRecorded({ problems: parsed.problems });
    setPaste('');
  };

  const blockedWhy = blocked && blocker ? `Export is blocked by ${blocker.id}: ${blocker.reason}` : '';
  const needPath = !pathOk;

  return (
    <section className="pf-export" id="export" aria-labelledby="export-h" data-testid="export-panel" tabIndex={-1}>
      <h2 id="export-h" className="panel-head">
        Export
      </h2>
      <p className="prose-sm">
        Writes the plan a session runs. Nothing here starts an agent. <TruthLabel truth="Verified" detail="made from this ship" />
      </p>

      <div className="field">
        <label htmlFor={pathId} className="label">
          Convenium.Design folder (absolute path)
        </label>
        <input
          id={pathId}
          className="input"
          type="text"
          spellCheck={false}
          autoComplete="off"
          value={path}
          placeholder="D:\Analyst_Designer\Convenium.Design"
          aria-invalid={path !== '' && !pathOk}
          aria-describedby={`${pathId}-help`}
          onChange={(e) => dispatch({ type: 'ui/designPath', path: e.target.value })}
          data-testid="design-path"
        />
        <p id={`${pathId}-help`} className="prose-sm" data-testid="design-path-help">
          {path === '' ? 'Remembered in this browser. The run plan and the kickoff prompt need it.' : pathOk ? `Skill paths will read ${root}/library/skills/...` : 'That is not an absolute path. Start with a drive letter (D:\\) or a slash.'}
        </p>
      </div>

      {blockedWhy && (
        <p id="export-blocked" className="pf-blocked" data-testid="export-blocked">
          <strong>Blocked.</strong> {blockedWhy}
        </p>
      )}

      <div className="export-primary">
        {/* filled only when it can be pressed: a blocker or a missing path hands the primary to the next goal (finish review M1) */}
        <button type="button" className={`btn ${blocked || needPath ? 'btn-quiet' : 'btn-primary'}`} disabled={blocked || needPath} aria-describedby={blocked ? 'export-blocked' : `${pathId}-enable`} onClick={copyKickoff} data-testid="copy-kickoff">
          Copy kickoff prompt
        </button>
        <p className="prose-sm" id={`${pathId}-enable`} data-testid="copy-kickoff-why">
          {!blocked && needPath ? 'Enter the folder path above to enable.' : 'The one thing a session needs: paste it and the session runs your plan.'}
        </p>
      </div>
      <fieldset className="export-files" data-testid="export-files">
        <legend className="label">Files</legend>
        <div className="export-buttons">
          <button type="button" className="btn btn-quiet" disabled={blocked} aria-describedby={blocked ? 'export-blocked' : undefined} onClick={downloadShip} data-testid="download-ship">
            Download ship.json
          </button>
          <button type="button" className="btn btn-quiet" disabled={blocked || needPath} aria-describedby={blocked ? 'export-blocked' : `${pathId}-help`} onClick={downloadPlan} data-testid="download-plan">
            Download 00-run-plan.md
          </button>
          {import.meta.env.DEV ? (
            <button type="button" className="btn btn-quiet" disabled={blocked} aria-describedby={blocked ? 'export-blocked' : undefined} onClick={save} data-testid="save-ship">
              Save to shipyard/ships/
            </button>
          ) : (
            <p className="prose-sm" data-testid="save-dev-only">
              Saving to shipyard/ships/ is available on the dev server only.
            </p>
          )}
        </div>
      </fieldset>

      <p className="pf-message" role="status" data-testid="export-message">
        {message}
      </p>

      {showKickoff && (
        <div className="field">
          <label htmlFor={`${pathId}-kick`} className="label">
            Kickoff prompt
          </label>
          <textarea id={`${pathId}-kick`} className="input" readOnly rows={8} value={renderKickoffPrompt(ship, root)} onFocus={(e) => e.currentTarget.select()} />
        </div>
      )}

      <div className="field" data-testid="verify-box">
        <label htmlFor={pasteId} className="label">
          After export · paste the verify.py --plan output
        </label>
        <p className="prose-sm">Run this in a terminal, then paste what it printed. Shipyard cannot run it; the result is yours to report.</p>
        <code className="cmd">{command}</code>
        <textarea
          id={pasteId}
          className="input"
          rows={4}
          value={paste}
          disabled={planExports === 0}
          aria-describedby={`${pasteId}-help`}
          aria-invalid={pasteError !== ''}
          placeholder={'FAIL ...\n\nCLEAN (run plan .olympus/00-run-plan.md)'}
          onChange={(e) => {
            setPaste(e.target.value);
            setPasteError('');
          }}
          data-testid="verify-paste"
        />
        <p id={`${pasteId}-help`} className="prose-sm">
          {planExports === 0 ? 'Download 00-run-plan.md first.' : 'Reads the last line: CLEAN, or N problem(s).'}
        </p>
        {pasteError && (
          <p className="pf-error" role="alert" data-testid="verify-error">
            {pasteError}
          </p>
        )}
        <div className="export-buttons">
          <button type="button" className="btn btn-quiet" disabled={planExports === 0 || paste.trim() === ''} onClick={record} data-testid="verify-record">
            Record in the logbook
          </button>
        </div>
        {recorded && (
          <p className="pf-message" role="status" data-testid="verify-recorded">
            Recorded: {verifyWords(recorded.problems)} <TruthLabel truth="User-reported" />
          </p>
        )}
      </div>
    </section>
  );
}
