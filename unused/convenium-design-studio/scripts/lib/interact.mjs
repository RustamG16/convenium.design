// The click sweep, and the listener census behind B1/B2.
//
// B1 asks "is this control wired to anything at all". The obvious way is
// DOMDebugger.getEventListeners, which needs one CDP round trip per node and misses
// delegation. Instead this shims addEventListener before any page script runs and records
// every (element, type) registration. One evaluate then answers the question for every
// control at once, and an ancestor walk covers delegated handlers correctly.
//
// B2 asks the harder question: does clicking it CHANGE anything. A handler that runs and does
// nothing observable is the defect this program exists to catch - "Do it for me" had a
// handler; it prefilled a textarea and navigated. So each control is clicked on a freshly
// loaded page and a before/after snapshot is compared.

/** Injected via Page.addScriptToEvaluateOnNewDocument, so it beats app.js to the DOM. */
export const LISTENER_SHIM = `(() => {
  const original = EventTarget.prototype.addEventListener;
  const registry = new WeakMap();
  window.__conveniumDesignListeners = registry;
  EventTarget.prototype.addEventListener = function (type, handler, options) {
    try {
      if (this instanceof Element || this === document || this === window) {
        const key = this instanceof Element ? this : document.documentElement;
        let types = registry.get(key);
        if (!types) { types = new Set(); registry.set(key, types); }
        types.add(type);
      }
    } catch (error) { /* never break the app to measure it */ }
    return original.call(this, type, handler, options);
  };
})()`;

const ACTION_TYPES = ['click', 'pointerdown', 'mousedown', 'keydown', 'change', 'input', 'submit'];

/**
 * Enumerate every interactive control in the active view (plus the app chrome) and say
 * whether each is wired. Returns plain data; runs as one Runtime.evaluate.
 */
export const CONTROL_CENSUS = `((viewId) => {
  const registry = window.__conveniumDesignListeners;
  const actionTypes = ${JSON.stringify(ACTION_TYPES)};

  const listensTo = node => {
    const types = registry && registry.get(node);
    if (!types) return [];
    return actionTypes.filter(t => types.has(t));
  };

  // A control counts as bound if it, or any ancestor up to <html>, registered an action
  // listener. The ancestor walk is what makes delegated handlers count.
  const boundVia = node => {
    let current = node;
    while (current) {
      const hit = listensTo(current);
      if (hit.length) return { on: current === node ? 'self' : 'ancestor', types: hit,
        via: current === node ? null : (current.tagName || '').toLowerCase() + (current.id ? '#' + current.id : '') };
      current = current.parentElement;
    }
    return null;
  };

  const selectorFor = node => {
    if (node.id) return '#' + CSS.escape(node.id);
    const parts = [];
    let current = node;
    while (current && current.nodeType === 1 && parts.length < 5) {
      let part = current.tagName.toLowerCase();
      if (current.id) { parts.unshift(part + '#' + CSS.escape(current.id)); break; }
      const cls = String(current.className || '').trim().split(/\\s+/).filter(Boolean).slice(0, 2);
      if (cls.length) part += '.' + cls.map(c => CSS.escape(c)).join('.');
      const siblings = current.parentElement ? [...current.parentElement.children].filter(s => s.tagName === current.tagName) : [];
      if (siblings.length > 1) part += ':nth-of-type(' + (siblings.indexOf(current) + 1) + ')';
      parts.unshift(part);
      current = current.parentElement;
    }
    return parts.join(' > ');
  };

  const labelFor = node => {
    const text = (node.getAttribute('aria-label') || node.textContent || node.value || '').replace(/\\s+/g, ' ').trim();
    return text.slice(0, 60);
  };

  const CONTROLS = 'button, a[href], summary, [role="button"], input, select, textarea';
  const CHROME = '.topbar, .transport, .statusbar, .undo-bar, .oracle-dock, .proposal-dialog';

  // The chrome pass must enumerate the CHROME, not the document. scope=document re-walked
  // whichever view happened to be active and reported its controls a second time as chrome,
  // which double-counted every finding in the last view of the sweep.
  const nodes = viewId
    ? [...(document.querySelector('#' + CSS.escape(viewId))?.querySelectorAll(CONTROLS) || [])]
    : [...document.querySelectorAll(CHROME.split(', ').map(sel => sel + ' ' + CONTROLS.split(', ').join(', ' + sel + ' ')).join(', '))];
  if (viewId && !document.querySelector('#' + CSS.escape(viewId))) return { controls: [], view: viewId, missing: true };

  const chrome = viewId ? [...document.querySelectorAll('.topbar button, .topbar a')] : [];

  const seen = new Set();
  const controls = [];
  for (const node of [...nodes, ...chrome]) {
    if (seen.has(node)) continue;
    seen.add(node);
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    const visible = rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    const tag = node.tagName.toLowerCase();
    const type = (node.getAttribute('type') || '').toLowerCase();
    const bound = boundVia(node);

    // Three ways to be wired without a listener of your own, all legitimate:
    const isSubmit = tag === 'button' && (type === 'submit' || (!type && node.form));
    const formBound = isSubmit && node.form ? Boolean(boundVia(node.form)) : false;
    const isDialogButton = Boolean(node.closest('dialog form[method="dialog"]'));
    const isLink = tag === 'a' && node.getAttribute('href');
    const isNativeField = tag === 'input' || tag === 'select' || tag === 'textarea';

    controls.push({
      view: viewId || 'chrome',
      selector: selectorFor(node),
      label: labelFor(node),
      tag, type,
      visible,
      disabled: Boolean(node.disabled),
      inHiddenView: !visible && Boolean(node.closest('.view:not(.is-active)')),
      viewTarget: node.dataset ? (node.dataset.viewTarget || null) : null,
      bound: Boolean(bound),
      boundOn: bound ? bound.on : null,
      boundVia: bound ? bound.via : null,
      boundTypes: bound ? bound.types : [],
      isSubmit, formBound, isDialogButton, isLink: Boolean(isLink), isNativeField,
      // A control already IN its target state - the active tab, the selected row - correctly
      // does nothing when clicked. B2 asks whether a control CAN act, not whether it happened
      // to be clicked from a state where acting was meaningful, so these are measured and
      // reported separately rather than counted as defects.
      alreadyActive: node.matches('.is-active, [aria-current], [aria-pressed="true"], [aria-selected="true"]'),
      // The verdict B1 counts. A native field with no listener is inert but harmless; a
      // BUTTON with no listener, no form and no href is a control that cannot do anything.
      wired: Boolean(bound) || formBound || isDialogButton || Boolean(isLink)
        || Boolean(node.dataset && node.dataset.viewTarget),
    });
  }
  return { view: viewId || 'chrome', controls };
})`;

/** One observable snapshot of the whole app, cheap enough to take twice per control. */
export const SNAPSHOT = `(() => {
  const store = {};
  try { for (let i = 0; i < localStorage.length; i += 1) { const k = localStorage.key(i); store[k] = (localStorage.getItem(k) || '').length; } } catch (e) {}
  const active = document.querySelector('.view.is-active');
  const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i += 1) { h = (h * 31 + s.charCodeAt(i)) | 0; } return h; };
  const bodyText = document.body.innerText || '';
  return {
    hash: location.hash,
    view: active ? active.id : null,
    domSize: document.body.innerHTML.length,
    domHash: hash(document.body.innerHTML),
    textHash: hash(bodyText),
    store,
    storeKeys: Object.keys(store).sort().join(','),
    dialogOpen: Boolean(document.querySelector('dialog[open]')),
    undoVisible: Boolean(document.querySelector('#undo-bar:not([hidden])')),
    oracleOpen: document.querySelector('#oracle-dock')?.getAttribute('aria-hidden') === 'false',
    focused: document.activeElement ? (document.activeElement.id || document.activeElement.tagName) : null,
    inspectorOpen: Boolean(document.querySelector('.work-inspector.is-open')),
    formHidden: Boolean(document.querySelector('#add-skill-form.is-hidden')),
  };
})()`;

/** True when the click produced something a person could perceive. */
export function changed(before, after) {
  if (!before || !after) return false;
  // `focused` counts. Programmatic .click() does not move focus on its own, so a change here
  // is always something the page decided to do - a guard sending the caret to the field that
  // needs filling, native constraint validation focusing the first invalid control, a close
  // button returning focus to its trigger. Those are answers, not silence.
  const keys = ['hash', 'view', 'domHash', 'textHash', 'storeKeys', 'dialogOpen', 'undoVisible',
    'oracleOpen', 'inspectorOpen', 'formHidden', 'focused'];
  if (keys.some(key => before[key] !== after[key])) return true;
  // a store value that grew or shrank counts, even when the key set is identical
  for (const key of Object.keys(after.store)) {
    if (before.store[key] !== after.store[key]) return true;
  }
  return Math.abs(after.domSize - before.domSize) > 0;
}

/**
 * Controls the sweep must not click, with the reason. Everything else - including Delete and
 * "Clear local" - IS clicked, against the scratch data directory. A destructive control that
 * is never exercised is a destructive control that is never tested.
 */
export const SKIP = new Map([
  ['#run-comparison', 'issues a model request; covered by B7 against the API directly'],
  ['#results-empty-action', 'proxies #run-comparison'],
  ['#oracle-run', 'issues a model request; covered by B7'],
  ['#oracle-plan', 'issues a model request; covered by B7'],
  ['.attachment-button', 'opens a native file picker that headless Chrome cannot dismiss'],
]);
