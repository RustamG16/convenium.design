#!/usr/bin/env node
// A stand-in for the Claude Code CLI in e2e tests (CLAUDE_BIN). It never calls a model. The mode comes
// from the file named by FAKE_CLAUDE_MODE_FILE (one dev server, several e2e cases), else FAKE_CLAUDE_MODE:
// "complete" writes a run.json, the required files and the run's own 00-run-plan.md, then exits 0;
// "hang" keeps talking forever (for cancel); "garbage" prints malformed output and exits 1.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const file = process.env.FAKE_CLAUDE_MODE_FILE;
const mode = (file && existsSync(file) ? readFileSync(file, 'utf8').trim() : process.env.FAKE_CLAUDE_MODE) || 'complete';
const say = (o) => process.stdout.write(`${JSON.stringify(o)}\n`);

if (process.argv.some((a) => /dangerously|bypassPermissions/.test(a))) {
  process.stderr.write('refusing: a bypass flag was passed\n');
  process.exit(9);
}
// the prompt arrives on stdin, as with `claude -p`
let prompt;
try {
  prompt = readFileSync(0, 'utf8');
} catch {
  prompt = '';
}
say({ type: 'system', subtype: 'init', tools: ['Read', 'Write'], promptChars: prompt.length });

if (mode === 'garbage') {
  process.stdout.write('this is not json\n');
  process.exit(1);
}
if (mode === 'hang') {
  // the cancel test reads this to prove the process is gone afterwards
  if (file) writeFileSync(`${file}.pid`, String(process.pid));
  setInterval(() => say({ type: 'assistant', message: 'still working' }), 500);
} else {
  mkdirSync('.olympus', { recursive: true });
  writeFileSync('.olympus/run.json', JSON.stringify({ phase_counts: { run_plan: 1, audit: 1, direction: 1, build: 1, qa: 1, finish: 1 }, gate_c: 'approved' }, null, 2));
  // real content, not a stub heading: the scorer ignores files under its size and shape floor
  const body = (f) => `# ${f}\n\nWritten by the fake CLI for the live-trial e2e. ${'This line stands in for a real section of the document. '.repeat(4)}\n\n- one finding with its evidence\n- one decision with its reason\n`;
  if (mode === 'stubs') for (const f of ['01-audit.md', '06-build-plan.md', '07-qa.md', '10-finish-review.md']) writeFileSync(`.olympus/${f}`, `# ${f}\n`);
  else for (const f of ['01-audit.md', '06-build-plan.md', '07-qa.md', '10-finish-review.md']) writeFileSync(`.olympus/${f}`, body(f));
  // as the kickoff asks: the exported plan becomes the run's own 00-run-plan.md
  if (existsSync('SHIP-PLAN.md')) writeFileSync('.olympus/00-run-plan.md', readFileSync('SHIP-PLAN.md', 'utf8'));
  say({ type: 'assistant', message: 'done' });
  say({ type: 'result', subtype: 'success', usage: { input_tokens: 1200, output_tokens: 300 } });
  process.exit(0);
}
