// Screen 02 — Guided intake. One question at a time; answers persist in the demo session.
import { h } from '../dom.js';
import { icon } from '../icons.js';
import { pageHead, segbar, btn, notice, inspector } from '../ui.js';
import { store, saveSession, intakeProgress } from '../store.js';
import { setDockSelection } from '../shell.js';
import { INTAKE } from '../fixtures/northstar.js';

let cursor = null;      // question being viewed (may be an already-answered one, for Edit)
let picked = null;      // option id picked but not yet confirmed
let mode = 'text';

export function renderIntake() {
  const { answered, total, current } = intakeProgress();
  const answers = store.session.intake.answers;
  if (cursor === null || (!INTAKE.find(q => q.id === cursor))) cursor = current?.id ?? null;
  const q = INTAKE.find(x => x.id === cursor);
  const qIndex = q ? INTAKE.indexOf(q) : total;
  if (q && picked === null && answers[q.id]) picked = answers[q.id].option;

  const progressCard = h('section', { class: 'card intake-progress' }, h('span', { class: 'label' }, 'Intake progress'), segbar(total, answered, answered < total ? answered : -1, 'Intake progress'), h('span', { class: 'count' }, `${answered} / ${total}`));

  let body;
  if (!q) {
    body = h('div', { class: 'intake-done' },
      h('p', { class: 'eyebrow green' }, '// Intake complete'),
      h('h2', { class: 'display' }, 'Oracle has what it needs.'),
      h('p', { class: 'subline' }, 'Your answers become a reviewable brief and Design DNA. Nothing starts without your approval.'),
      h('div', { class: 'intake-done-actions' }, btn('Review brief & Design DNA', { href: '#/projects/northstar/brief', icoRight: 'ArrowRight', attrs: { 'data-tour': 'intake-review' } }), btn('Edit an answer', { tone: 'outline', onClick: () => { cursor = INTAKE[0].id; picked = null; rerenderSoon(); } })));
  } else {
    const note = h('input', { class: 'intake-note-input', type: 'text', maxlength: 500, placeholder: 'Add context or details (optional)...', value: store.session.intake.notes[q.id] || '', 'aria-label': 'Additional context',
      oninput: e => { counter.textContent = `${e.target.value.length} / 500`; } });
    const counter = h('span', { class: 'counter' }, `${note.value.length} / 500`);
    body = h('div', {},
      h('p', { class: 'eyebrow green q-count' }, `// Question ${qIndex + 1} of ${total}`),
      h('h2', { class: 'display q-title' }, q.q),
      h('p', { class: 'subline' }, q.sub || 'Choose the answer that fits best. You can add detail below.'),
      h('div', { class: 'choice-grid', role: 'radiogroup', 'aria-label': q.q, 'data-tour': 'intake-options' }, q.options.map(o => {
        const on = picked === o.id;
        return h('button', { type: 'button', role: 'radio', 'aria-checked': on ? 'true' : 'false', class: `choice${on ? ' sel' : ''}`, dataset: { option: o.id },
          onclick: () => { picked = o.id; setDockSelection({ ico: o.icon, label: o.title }); rerenderSoon(); } },
          on ? h('span', { class: 'choice-check' }, icon('Check')) : null,
          icon(o.icon, 'choice-ico'), h('strong', {}, o.title), h('span', {}, o.text));
      })),
      h('div', { class: 'input-modes', role: 'tablist' }, [['text', 'MessageSquare', 'Text'], ['voice', 'AudioLines', 'Voice'], ['attach', 'Paperclip', 'Attach file']].map(([id, ic, t]) =>
        h('button', { type: 'button', role: 'tab', class: mode === id ? 'on' : '', 'aria-selected': mode === id ? 'true' : 'false', onclick: () => { mode = id; rerenderSoon(); } }, icon(ic), t))),
      mode === 'text' ? h('label', { class: 'intake-note' }, note, counter)
        : h('div', { class: 'intake-note muted' }, mode === 'voice' ? 'Voice input is not available in this local build. Continue with text.' : 'File attachments are recorded as references in a project chat. Continue with text here.'),
      notice({ ico: 'Lightbulb', title: 'Why Convenium.Design asks', text: q.why }),
      h('div', { class: 'intake-actions' },
        btn('Back', { tone: 'outline', ico: 'ArrowLeft', onClick: () => { const prev = INTAKE[Math.max(0, qIndex - 1)]; cursor = prev.id; picked = answers[prev.id]?.option ?? null; rerenderSoon(); } }),
        btn('Confirm and continue', { icoRight: 'ArrowRight', attrs: { 'data-tour': 'intake-confirm', disabled: picked ? null : true }, onClick: () => {
          const opt = q.options.find(o => o.id === picked); if (!opt) return;
          const text = note.value.trim();
          const nextAnswers = { ...answers, [q.id]: { option: opt.id, title: opt.title, summary: opt.id === q.options[0].id || !q.summary ? q.summary || opt.text : opt.text, note: text } };
          saveSession({ intake: { answers: nextAnswers, notes: { ...store.session.intake.notes, [q.id]: text } } });
          const nextQ = INTAKE.find(x => !nextAnswers[x.id]);
          cursor = nextQ?.id ?? null; picked = null; setDockSelection(null);
        } })));
  }

  const confirmed = INTAKE.filter(x => answers[x.id]);
  const remaining = INTAKE.filter(x => !answers[x.id]);
  const side = inspector(h('div', { class: 'intake-summary', 'data-tour': 'intake-summary' },
    h('div', { class: 'is-head' }, h('span', { class: 'label strong-label' }, 'Intake summary'), h('div', { class: 'is-row' }, h('span', { class: 'label muted' }, 'Northstar'), h('span', { class: 'count' }, `${answered} / ${total}`)), segbar(total, answered, answered < total ? answered : -1)),
    h('div', { class: 'ins-sec' }, h('span', { class: 'label' }, `Confirmed answers (${confirmed.length})`),
      confirmed.length ? confirmed.map(x => h('div', { class: 'is-item done' }, h('span', { class: 'is-check' }, icon('Check')),
        h('div', {}, h('b', {}, `${INTAKE.indexOf(x) + 1}. ${x.q}`), h('span', {}, answers[x.id].summary)),
        h('button', { class: 'link', type: 'button', onclick: () => { cursor = x.id; picked = answers[x.id].option; rerenderSoon(); } }, 'Edit'))) : h('p', { class: 'mono-sm' }, 'Nothing confirmed yet.')),
    h('div', { class: 'ins-sec' }, h('span', { class: 'label' }, `Remaining decisions (${remaining.length})`),
      remaining.map(x => h('div', { class: 'is-item' }, h('span', { class: 'is-open' }), h('div', {}, h('b', {}, `${INTAKE.indexOf(x) + 1}. ${x.q}`), h('span', {}, 'Not answered'))))),
    notice({ ico: 'Flag', title: answered === total ? 'Ready for your review' : "You're making progress", text: answered === total ? 'Oracle has drafted your brief and Design DNA.' : 'Answer a few more questions and Oracle will generate your plan.' })),
    { label: 'Intake summary' });

  const main = h('div', { class: 'view-intake' },
    pageHead({ eyebrow: 'Northstar', title: 'Guided intake', sub: 'Oracle is asking the right questions to build a stronger plan.', quote: false }),
    progressCard, body);
  return { main, inspector: side };
}

function rerenderSoon() { import('../main.js').then(m => m.rerender()); }
