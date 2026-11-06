// `#/logbook` — what the owner's ships have done (06 section 4.7): export history, the verify results
// they pasted, run.json files they imported, and the commissions those outcomes granted. Every row
// says where it comes from; no row is ranked, scored or compared with another ship.
import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router';
import '../../styles/preflight.css';
import '../../styles/logbook.css';
import { TruthLabel } from '../../components/TruthLabel';
import type { LogEntry } from '../../domain/schema';
import { LIBRARY_EPOCH, libraryShips } from '../../domain/ship';
import { useKb } from '../../kb/context';
import { useDispatch, useStoreState } from '../../store/context';
import { verifyWords } from '../preflight/verifyOutput';
import { CommissionsRail } from './CommissionsRail';
import { MAX_RUN_JSON_BYTES, parseRunJson, runLogEntry } from './runJson';

const stamp = (iso: string): string => `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;

function Row({ entry }: { entry: LogEntry }) {
  if (entry.kind === 'export') {
    return (
      <li className="lb-row" data-kind="export" data-testid="log-row">
        <p className="lb-what">
          Exported <strong>{entry.file ?? 'a file'}</strong>
        </p>
        <p className="stat">
          {stamp(entry.at)} · {entry.note ?? ''} <TruthLabel truth={entry.truth} />
        </p>
      </li>
    );
  }
  if (entry.kind === 'verify-result') {
    return (
      <li className="lb-row" data-kind="verify-result" data-testid="log-row">
        <p className="lb-what">
          verify.py --plan: <strong>{verifyWords(entry.problems ?? 0)}</strong>
        </p>
        <p className="stat">
          {stamp(entry.at)} · pasted by you <TruthLabel truth={entry.truth} />
        </p>
      </li>
    );
  }
  const counts = Object.entries(entry.phaseCounts ?? {});
  return (
    <li className="lb-row" data-kind="run-json" data-testid="log-row">
      <p className="lb-what">
        Run of <strong>{entry.project ?? 'an unnamed project'}</strong> · {entry.note}
      </p>
      <p className="stat">
        {stamp(entry.at)} <TruthLabel truth={entry.truth} detail="read from the file" />
      </p>
      {counts.length > 0 && (
        <ul className="lb-counts" aria-label="phase_counts">
          {counts.map(([phase, n]) => (
            <li key={phase} className="chip">
              {phase} {n}
            </li>
          ))}
        </ul>
      )}
      <p className="stat" data-testid="hash-count">
        artifact_hashes:{' '}
        {entry.artifactHashes === undefined ? (
          <>
            not in the file <TruthLabel truth="Unavailable" />
          </>
        ) : (
          <>
            {entry.artifactHashes} <TruthLabel truth="Verified" />
          </>
        )}
      </p>
    </li>
  );
}

function Section({ title, rows, empty }: { title: string; rows: LogEntry[]; empty: string }) {
  return (
    <div className="lb-group">
      <h4 className="lb-group-head">
        {title} <span className="stat">{rows.length}</span>
      </h4>
      {rows.length === 0 ? (
        <p className="prose-sm">{empty}</p>
      ) : (
        <ul className="lb-rows">
          {rows
            .slice()
            .reverse()
            .map((e, i) => (
              <Row key={`${e.at}-${i}`} entry={e} />
            ))}
        </ul>
      )}
    </div>
  );
}

function ImportPanel({ ships }: { ships: { id: string; name: string }[] }) {
  const dispatch = useDispatch();
  const { logbook } = useStoreState();
  const selectId = useId();
  const fileId = useId();
  const pasteId = useId();
  const [shipId, setShipId] = useState(ships[0]?.id ?? '');
  const [paste, setPaste] = useState('');
  const [issues, setIssues] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  const importText = (text: string, source: string) => {
    const parsed = parseRunJson(text);
    if (!parsed.ok) {
      setIssues(parsed.issues);
      setMessage('');
      return;
    }
    setIssues([]);
    if ((logbook[shipId] ?? []).some((e) => e.runKey === parsed.summary.runKey)) {
      setMessage(`${source} is already in this ship's logbook; the same run is logged once.`);
      return;
    }
    dispatch({ type: 'log/add', shipId, entry: runLogEntry(parsed.summary, new Date().toISOString()) });
    setMessage(`Logged ${source}: ${parsed.summary.phaseRuns} phase runs across ${parsed.summary.phasesRun} phases.`);
    setPaste('');
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_RUN_JSON_BYTES) {
      setIssues([`(root): ${file.name} is larger than ${MAX_RUN_JSON_BYTES / 1024} KB; a run.json is far smaller`]);
      setMessage('');
      return;
    }
    importText(await file.text(), file.name);
  };

  return (
    <section className="lb-import" aria-labelledby="import-h" data-testid="import-panel">
      <h2 id="import-h" className="panel-head">
        Import a run.json
      </h2>
      <p className="prose-sm">
        The <code>.olympus/run.json</code> a finished run leaves in its project. Shipyard reads <code>phase_counts</code> and the number of <code>artifact_hashes</code>, and nothing else.
      </p>
      <div className="field">
        <label htmlFor={selectId} className="label">
          Log it on
        </label>
        <select id={selectId} className="input" value={shipId} onChange={(e) => setShipId(e.target.value)} data-testid="import-ship">
          {ships.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={fileId} className="label">
          Choose the file
        </label>
        <input
          id={fileId}
          className="input"
          type="file"
          accept=".json,application/json"
          data-testid="import-file"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      <div className="field">
        <label htmlFor={pasteId} className="label">
          Or paste its text
        </label>
        <textarea id={pasteId} className="input" rows={4} value={paste} onChange={(e) => setPaste(e.target.value)} data-testid="import-paste" />
        <div className="export-buttons">
          <button type="button" className="btn btn-quiet" disabled={paste.trim() === ''} onClick={() => importText(paste, 'the pasted run.json')} data-testid="import-paste-go">
            Import the pasted text
          </button>
        </div>
      </div>
      {issues.length > 0 && (
        <div className="lb-issues" role="alert" data-testid="import-issues">
          <p>
            <strong>Not imported.</strong> This file is not a usable run.json:
          </p>
          <ul>
            {issues.map((i) => (
              <li key={i}>
                <code>{i}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="pf-message" role="status" data-testid="import-message">
        {message}
      </p>
    </section>
  );
}

export default function LogbookPage() {
  const idx = useKb();
  const { ships, logbook, commissions } = useStoreState();
  const library = useMemo(() => libraryShips(idx, LIBRARY_EPOCH).ships, [idx]);

  const rows = useMemo(() => {
    const byId = new Map([...library, ...ships].map((s) => [s.id, s]));
    const ids = [...new Set([idx.kb.workflows.default, ...ships.map((s) => s.id), ...Object.keys(logbook)])];
    return ids.map((id) => ({ id, ship: byId.get(id), entries: logbook[id] ?? [] }));
  }, [idx, library, ships, logbook]);

  const importable = rows.filter((r) => r.ship).map((r) => ({ id: r.id, name: r.ship!.name }));

  return (
    <main id="main" className="page logbook" data-testid="logbook">
      <header>
        <h1 className="page-title">Logbook</h1>
        <p className="lede">What your ships have done, in your own files. Every row says where it comes from.</p>
        <p className="prose-sm" data-testid="truth-legend">
          What the labels mean: <strong>Verified</strong> is computed from the library or a file you exported; <strong>Simulated</strong> is narrative or a curiosity count, not a measurement of skill; <strong>User-reported</strong> is pasted by you and not checked here; <strong>Unavailable</strong> means the source does not carry the number.
        </p>
      </header>

      <CommissionsRail granted={commissions} />

      <div className="lb-layout">
        <section className="lb-ships" aria-labelledby="ships-h">
          <h2 id="ships-h" className="section-head">
            Ships
          </h2>
          {rows.map(({ id, ship, entries }) => {
            const exports = entries.filter((e) => e.kind === 'export');
            const verifies = entries.filter((e) => e.kind === 'verify-result');
            const runs = entries.filter((e) => e.kind === 'run-json');
            return (
              <article key={id} className="lb-ship" data-testid="logbook-ship" data-ship={id} aria-labelledby={`lb-${id}`}>
                <div className="lb-ship-head">
                  <h3 id={`lb-${id}`} className="card-title">
                    {ship?.name ?? id}
                  </h3>
                  <span className="stat">
                    {ship ? ship.class : 'ship removed'} · {exports.length} {exports.length === 1 ? 'export' : 'exports'} · {verifies.length} {verifies.length === 1 ? 'result' : 'results'} · {runs.length} {runs.length === 1 ? 'run' : 'runs'}
                  </span>
                  {ship && (
                    <Link className="btn btn-quiet" to={`/ship/${id}/preflight`}>
                      Pre-flight and export
                    </Link>
                  )}
                </div>
                {entries.length === 0 ? (
                  <p className="prose-sm" data-testid="logbook-empty">
                    Nothing logged yet. Export this ship from pre-flight, or import a run.json.
                  </p>
                ) : (
                  <>
                    <Section title="Exports" rows={exports} empty="No export yet." />
                    <Section title="verify.py results" rows={verifies} empty="No result pasted yet." />
                    <Section title="Runs (run.json)" rows={runs} empty="No run imported yet." />
                  </>
                )}
              </article>
            );
          })}
        </section>
        <ImportPanel ships={importable} />
      </div>
    </main>
  );
}
