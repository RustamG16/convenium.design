// Tutorials hub — the totem's guided walkthroughs, plus recorded Playwright walkthroughs.
import { h } from '../dom.js';
import { icon } from '../icons.js';
import { btn, badge } from '../ui.js';
import { store } from '../store.js';
import { TOURS, POSES } from '../tours-data.js';

export function renderTutorials() {
  const done = store.session.tours || {};
  const count = TOURS.filter(t => done[t.id]).length;
  const start = id => import('../tour.js').then(m => m.startTour(id));
  const main = h('div', { class: 'view-tutorials' },
    h('section', { class: 'tut-hero card' },
      h('img', { class: 'tut-totem', src: POSES.wave, alt: 'The Convenium.Design Totem, waving' }),
      h('div', { class: 'tut-copy' },
        h('p', { class: 'eyebrow green' }, '// Tutorials & guide'),
        h('h1', { class: 'display', id: 'page-title', tabindex: '-1' }, 'Learn Convenium.Design with the Totem.'),
        h('p', { class: 'subline' }, 'Short, hands-on walkthroughs on the real screens.'),
        h('p', { class: 'tut-lead' }, 'Each tutorial opens the screen it talks about and points at the exact control. Use Next and Back, or the arrow keys. Esc ends a tour at any time.'),
        h('div', { class: 'tut-progress' }, h('span', { class: 'label' }, 'Completed'), h('div', { class: 'segbar' }, TOURS.map(t => h('i', { class: done[t.id] ? 'done' : '' }))), h('span', { class: 'count' }, `${count} / ${TOURS.length}`)),
        btn(count ? 'Continue learning' : 'Start with the welcome tour', { icoRight: 'ArrowRight', onClick: () => start((TOURS.find(t => !done[t.id]) || TOURS[0]).id), attrs: { 'data-tour': 'tut-start' } }))),
    h('div', { class: 'tut-grid' }, TOURS.map((t, i) => h('article', { class: `card tut-card${done[t.id] ? ' done' : ''}`, dataset: { tourCard: t.id } },
      h('div', { class: 'tut-card-top' }, h('span', { class: 'tut-n' }, String(i + 1).padStart(2, '0')), h('span', { class: 'ico-box' }, icon(t.icon)), done[t.id] ? badge('Done', 'green', 'Check') : badge(`${t.minutes} min`, 'grey')),
      h('strong', { class: 'title-sm' }, t.title), h('p', { class: 'mono-sm' }, t.summary),
      h('div', { class: 'tut-card-foot' }, h('span', { class: 'mono-sm' }, `${t.steps.length} steps`), btn(done[t.id] ? 'Replay' : 'Start', { size: 'sm', tone: done[t.id] ? 'outline' : '', icoRight: 'Play', onClick: () => start(t.id) }))))),
    h('section', { class: 'card pad tut-recorded' },
      h('div', { class: 'card-head' }, icon('Clapperboard'), 'Recorded walkthroughs'),
      h('p', { class: 'mono-sm' }, 'Every tutorial is also played automatically by Playwright and saved as a step-by-step guide with screenshots and a video. Regenerate them with ', h('code', {}, 'npm run tutorials'), ' in convenium-design-studio.'),
      h('div', { class: 'tut-links' }, TOURS.map(t => h('a', { class: 'tag', href: `/tutorials/${t.id}/index.html`, target: '_blank', rel: 'noopener' }, icon('FileText'), t.title)))));
  return { main };
}
