// The studio screen, once.
//
// Two surfaces render this: modules/flow-studio.js inside the DGO shell, and
// tools/flow-studio.html standalone. Neither owns any markup — a second copy of a screen
// this fiddly would diverge within a week, and the divergence would show up as a payload
// that generates correctly in one place and not the other.
//
// What differs between the surfaces is genuinely environmental, and only that is injected:
//
//   esc, head, kpis, emptyState   markup helpers, so each surface keeps its own chrome
//   toast, confirm                feedback, which the platform routes through <dgo-shell>
//   getState, setState            view state (selection, collapsed branches)
//   storage                       where the plan is kept between visits
//
// ── WHY THE LAYOUT IS THE WAY IT IS ────────────────────────────────────────────────────
// The first version of this screen put a 45-row action catalog down the left column, the
// plan below it, and the Copy button 669px down the page. That is backwards. The plan is
// the thing being made; the catalog is a means of adding to it, and the Copy button is the
// entire point of the tool. Both were below the fold while the picker held the best space.
//
// So: the plan column is the subject and is always visible. The catalog is not on the page
// at all — it opens as a palette anchored to the exact insertion point you clicked, which
// also removes the mode error in the old design, where you set a target in one dropdown and
// then pressed Add somewhere else with nothing showing where the action would land. The
// output panel is pinned to the bottom of the working column so Copy is always reachable.
// The trigger is the first row of the plan rather than a separate tab, because a trigger is
// part of the flow, not a mode of the editor.
//
// Editing does not re-render the whole screen. A full re-render on every keystroke throws
// away focus and caret position in the middle of typing an expression, which is exactly
// when it hurts most. Typing updates the plan and refreshes only the output and findings;
// the structure re-renders when the structure actually changes.

import * as PA from './index.js';
import { ActionNamePolicy, DesignerClipboard } from '../../config/power-automate.config.js';
import { installStudioStyles } from './studio.css.js';

const STORE_KEY = 'dgo.flow-studio.plan';
const HISTORY_LIMIT = 50;

const blankPlan = () => ({ name: 'Generated actions', steps: [], trigger: null, triggerSpec: null, notes: [] });

/** Panels the right-hand column can show instead of an action editor. */
const TRIGGER = '__trigger__';
const IMPORT = '__import__';
const CHECK = '__check__';

/** Expressions worth one click. These are the ones people mistype, not the ones they forget. */
const TOKENS = [
  ["@{triggerBody()?['field']}", 'trigger field'],
  ['@triggerBody()', 'whole trigger body'],
  ["@{outputs('Action')}", 'action output'],
  ["@body('Action')", 'action body (whole)'],
  ["@{variables('name')}", 'variable'],
  ['@{item()}', 'current item'],
  ['@{utcNow()}', 'now'],
  ['@{guid()}', 'new guid']
];

export function createStudio(host) {
  const { esc, emptyState, toast, confirm, getState, setState, storage } = host;

  let plan = blankPlan();
  let root = null;
  let lastField = null;                       // for the token chips
  let pendingInsert = null;                   // { listKey, index } while the palette is open
  let paletteIndex = 0;
  const history = { past: [], future: [] };

  /* ── persistence ────────────────────────────────────────────────────────────────── */
  // The plan is the operator's work, not view state, so it outlives a reload. It is entirely
  // local — nothing here is sent anywhere, and there is nothing in a plan worth syncing.
  const snapshot = () => JSON.stringify(plan);
  const save = () => {
    try { storage.set(STORE_KEY, snapshot()); flashSaved(); } catch { /* quota or private mode */ }
  };
  function load() {
    try {
      const parsed = JSON.parse(storage.get(STORE_KEY) || 'null');
      return parsed && Array.isArray(parsed.steps) ? { ...blankPlan(), ...parsed } : null;
    } catch { return null; }
  }

  /** Record a point to come back to. No-ops when nothing actually changed. */
  function pushHistory(before) {
    if (before === snapshot()) return;
    history.past.push(before);
    if (history.past.length > HISTORY_LIMIT) history.past.shift();
    history.future.length = 0;
  }

  /** Structural changes go through here, so undo has something to undo. */
  function mutate(fn) {
    const before = snapshot();
    const result = fn();
    pushHistory(before);
    save();
    return result;
  }

  /**
   * Typing is undoable too, at the granularity of one field.
   *
   * Field edits write on `input` so the output stays live, but a history entry per keystroke
   * would make Ctrl+Z useless. Instead the plan is captured when a field takes focus and the
   * entry is committed on `change` — which fires on blur, and only when the value actually
   * changed. One edit, one undo step.
   */
  let editBaseline = null;
  const beginFieldEdit = () => { editBaseline = snapshot(); };
  const commitFieldEdit = () => {
    if (editBaseline === null) return;
    pushHistory(editBaseline);
    editBaseline = null;
  };
  function undo() {
    if (!history.past.length) return false;
    history.future.push(snapshot());
    plan = JSON.parse(history.past.pop());
    save();
    return true;
  }
  function redo() {
    if (!history.future.length) return false;
    history.past.push(snapshot());
    plan = JSON.parse(history.future.pop());
    save();
    return true;
  }

  /* ── plan navigation ────────────────────────────────────────────────────────────── */
  let uid = 0;
  const newId = () => `s${Date.now().toString(36)}${(uid += 1).toString(36)}`;

  /** Locate a step and the list it belongs to, so it can be moved, copied or removed in place. */
  function locate(id, steps = plan.steps, parent = null, branchKey = '') {
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].id === id) return { step: steps[i], list: steps, index: i, parent, branchKey };
      for (const [key, list] of Object.entries(steps[i].branches || {})) {
        const found = locate(id, list, steps[i], key);
        if (found) return found;
      }
    }
    return null;
  }

  /** Branch labels for a step, including a Switch's cases, which the operator names. */
  function branchesOf(step, action) {
    const out = [...(action?.branches || [])];
    if (action?.dynamicCases) {
      for (const c of step.values?.cases || []) {
        out.unshift({ key: `case:${c?.name ?? c?.value}`, label: `case ${c?.name || c?.value || ''}` });
      }
    }
    return out;
  }

  /**
   * A list key addresses one sibling list: 'root', or '<stepId>|<branchKey>'. Insertion
   * points carry the key AND the index, which is what lets the palette drop an action exactly
   * where the + was pressed instead of appending to a list chosen in a dropdown.
   */
  function listFor(key) {
    if (key === 'root') return plan.steps;
    const [stepId, branchKey] = String(key).split('|');
    const found = locate(stepId);
    if (!found) return plan.steps;
    found.step.branches = found.step.branches || {};
    found.step.branches[branchKey] = found.step.branches[branchKey] || [];
    return found.step.branches[branchKey];
  }

  /** The list key a given step sits in — needed when a drop targets a step rather than a gap. */
  function keyOfList(stepId) {
    const found = locate(stepId);
    if (!found) return 'root';
    return found.parent ? `${found.parent.id}|${found.branchKey}` : 'root';
  }

  /** True when `ancestorId` contains `stepId`, so a drag cannot drop a container into itself. */
  function contains(ancestorId, stepId) {
    const found = locate(ancestorId);
    if (!found) return false;
    let hit = false;
    const visit = list => list.forEach(s => {
      if (s.id === stepId) hit = true;
      Object.values(s.branches || {}).forEach(visit);
    });
    Object.values(found.step.branches || {}).forEach(visit);
    return hit;
  }

  /* ── mutations ──────────────────────────────────────────────────────────────────── */
  const addStep = (actionId, listKey, index) => mutate(() => {
    const action = PA.actionById(actionId);
    if (!action) return null;
    const step = { id: newId(), actionId, name: '', values: PA.defaultValues(action), branches: {} };
    const list = listFor(listKey);
    list.splice(index ?? list.length, 0, step);
    return step;
  });

  const removeStep = id => mutate(() => {
    const found = locate(id);
    if (found) found.list.splice(found.index, 1);
  });

  const moveStep = (id, delta) => mutate(() => {
    const found = locate(id);
    if (!found) return;
    const next = found.index + delta;
    if (next < 0 || next >= found.list.length) return;
    const [item] = found.list.splice(found.index, 1);
    found.list.splice(next, 0, item);
  });

  /** Move a step to an arbitrary list and index — the drag-and-drop path. */
  const relocate = (id, listKey, index) => mutate(() => {
    const found = locate(id);
    if (!found) return;
    const target = listFor(listKey);
    const sameList = target === found.list;
    found.list.splice(found.index, 1);
    let at = index ?? target.length;
    if (sameList && found.index < at) at -= 1;      // removing shifts everything after it left
    target.splice(Math.max(0, Math.min(at, target.length)), 0, found.step);
  });

  /** Deep copy with fresh ids, so the copy is a separate step rather than an alias. */
  function reid(step) {
    const branches = {};
    for (const [k, list] of Object.entries(step.branches || {})) branches[k] = list.map(reid);
    // runAfterRef points at a sibling id; a copy that keeps it would fork off the original's
    // predecessor, which is never what "duplicate" means. Drop it and let the copy chain.
    const { runAfterRef, ...rest } = step;
    return { ...JSON.parse(JSON.stringify(rest)), id: newId(), branches };
  }

  const duplicateStep = id => mutate(() => {
    const found = locate(id);
    if (!found) return null;
    const copy = reid(found.step);
    found.list.splice(found.index + 1, 0, copy);
    return copy;
  });

  /* ── field rendering ────────────────────────────────────────────────────────────── */
  const rowsOf = (step, name) => Array.isArray(step.values?.[name]) ? step.values[name] : [];

  function repeatRows(step, fd, columns) {
    const rows = rowsOf(step, fd.name);
    const body = rows.map((row, i) => `<div class="fs-row" data-row="${i}" data-field="${esc(fd.name)}">${
      columns.map(col => col.kind === 'select'
        ? `<select data-cell="${esc(col.key)}" aria-label="${esc(col.label)}">${col.options.map(([v, l]) =>
            `<option value="${esc(v)}" ${String(row?.[col.key] ?? '') === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`
        : `<input data-cell="${esc(col.key)}" value="${esc(row?.[col.key] ?? '')}" placeholder="${esc(col.label)}" aria-label="${esc(col.label)}">`
      ).join('')
    }<button type="button" class="fs-x" data-row-remove aria-label="Remove row">×</button></div>`).join('');
    return `<div class="fs-repeat" data-repeat="${esc(fd.name)}">${body}
      <button type="button" class="fs-addrow" data-row-add="${esc(fd.name)}">+ Add row</button></div>`;
  }

  function renderField(step, fd, values = step.values) {
    const v = values?.[fd.name];
    const help = fd.help ? `<small class="fs-help">${esc(fd.help)}</small>` : '';
    const req = fd.required ? '<span class="fs-req" aria-label="required">required</span>' : '';
    const head = `<span class="fs-label">${esc(fd.label)}${req}</span>`;
    const attrs = `data-field="${esc(fd.name)}"${fd.placeholder ? ` placeholder="${esc(fd.placeholder)}"` : ''}`;
    // Schema fields are the worst thing to write by hand and the easiest to derive, so the
    // sample box sits with the field rather than behind a menu.
    const sampler = fd.inferFromSample ? `<details class="fs-sampler"><summary>Infer from a sample payload</summary>
        <textarea data-sample="${esc(fd.name)}" rows="5" spellcheck="false" placeholder='{ "action": "track", "payload": { "reference": "DGO/2026/001" } }'></textarea>
        <button type="button" class="fs-btn" data-infer="${esc(fd.name)}">Infer schema</button>
        <small class="fs-help">No <code>required</code> list is generated: a sample is one observation, and asserting it would fail later payloads that omit an optional field.</small>
      </details>` : '';

    switch (fd.kind) {
      case 'textarea':
      case 'json':
        return `<div class="fs-field">${head}<textarea rows="${fd.rows || 4}" ${attrs} spellcheck="false">${esc(v ?? '')}</textarea>${help}${sampler}</div>`;
      case 'select':
        return `<div class="fs-field">${head}<select ${attrs}>${(fd.options || []).map(([val, lab]) =>
          `<option value="${esc(val)}" ${String(v ?? '') === val ? 'selected' : ''}>${esc(lab)}</option>`).join('')}</select>${help}</div>`;
      case 'boolean':
        return `<div class="fs-field fs-field--check"><label class="fs-check"><input type="checkbox" ${attrs} ${v === true || v === 'true' ? 'checked' : ''}> ${esc(fd.label)}</label>${help}</div>`;
      case 'keyvalue':
        return `<div class="fs-field">${head}${help}${repeatRows(step, fd, [{ key: 'name', label: 'Name' }, { key: 'value', label: 'Value' }])}</div>`;
      case 'fieldmap':
        return `<div class="fs-field">${head}${help}${repeatRows(step, fd, [{ key: 'name', label: 'Column internal name' }, { key: 'value', label: 'Value' }])}</div>`;
      case 'cases':
        return `<div class="fs-field">${head}${help}${repeatRows(step, fd, [{ key: 'name', label: 'Branch label' }, { key: 'value', label: 'Matches value' }])}</div>`;
      case 'conditions':
        return `<div class="fs-field">${head}${help}${repeatRows(step, fd, [
          { key: 'left', label: 'Value' },
          { key: 'operator', label: 'Operator', kind: 'select', options: PA.ConditionOperators.map(o => [o.id, o.label]) },
          { key: 'right', label: 'Compare with' }
        ])}</div>`;
      default:
        return `<div class="fs-field">${head}<input ${attrs} value="${esc(v ?? '')}" spellcheck="false">${help}</div>`;
    }
  }

  /* ── the plan column ────────────────────────────────────────────────────────────── */

  /** A slim insertion point. Every one of these knows its list and index exactly. */
  const insertPoint = (listKey, index, label) =>
    `<button type="button" class="fs-insert" data-insert="${esc(listKey)}" data-at="${index}"
      aria-label="Add an action ${esc(label)}"><span>+</span></button>`;

  function renderTree(steps, listKey, names, selected, collapsed) {
    const rows = [];
    steps.forEach((step, i) => {
      const action = PA.actionById(step.actionId);
      if (!action) return;
      const typed = step.name || action.label;
      const resolved = names.get(step.id) || '';
      const renamed = resolved && ActionNamePolicy.toKey(typed) !== resolved;
      const branches = branchesOf(step, action);
      const isOpen = branches.length && !collapsed.includes(step.id);
      rows.push(`<div class="fs-item ${step.id === selected ? 'is-selected' : ''}" data-step="${esc(step.id)}"
          draggable="true" tabindex="0" role="button" aria-selected="${step.id === selected}">
        <div class="fs-item__main">
          ${branches.length ? `<button type="button" class="fs-twist ${isOpen ? 'is-open' : ''}" data-collapse="${esc(step.id)}"
              aria-expanded="${isOpen}" aria-label="${isOpen ? 'Collapse' : 'Expand'} ${esc(typed)}">▸</button>`
            : '<span class="fs-twist fs-twist--none" aria-hidden="true"></span>'}
          <span class="fs-item__text">
            <span class="fs-item__name">${esc(typed)}</span>
            <span class="fs-item__meta">${esc(action.label)}${action.connector ? ' · connector' : ''}${
              renamed ? ` · pastes as <code>${esc(resolved)}</code>` : ''}</span>
          </span>
        </div>
        <div class="fs-item__tools">
          <button type="button" class="fs-x" data-move="${esc(step.id)}" data-delta="-1" aria-label="Move up" title="Move up">↑</button>
          <button type="button" class="fs-x" data-move="${esc(step.id)}" data-delta="1" aria-label="Move down" title="Move down">↓</button>
          <button type="button" class="fs-x" data-duplicate="${esc(step.id)}" aria-label="Duplicate" title="Duplicate">⧉</button>
          <button type="button" class="fs-x fs-x--danger" data-remove="${esc(step.id)}" aria-label="Remove" title="Remove">×</button>
        </div>
      </div>`);

      if (isOpen) {
        rows.push(branches.map(b => {
          const list = step.branches?.[b.key] || [];
          const key = `${step.id}|${b.key}`;
          return `<div class="fs-branch">
            <div class="fs-branch__label">${esc(b.label)}</div>
            ${list.length ? renderTree(list, key, names, selected, collapsed)
              : `<div class="fs-branch__empty">nothing here yet</div>${insertPoint(key, 0, `to ${b.label}`)}`}
          </div>`;
        }).join(''));
      }
      rows.push(insertPoint(listKey, i + 1, `after ${typed}`));
    });
    return rows.join('');
  }

  function renderPlanColumn(names, selected) {
    const u = getState({ collapsed: [] });
    const collapsed = u.collapsed || [];
    const triggerLabel = plan.trigger ? plan.trigger.name : 'No trigger';
    return `<aside class="fs-plan">
      <div class="fs-plan__bar">
        <input class="fs-planname" data-plan-name value="${esc(plan.name || '')}" aria-label="Plan name" placeholder="Plan name">
        <div class="fs-plan__tools">
          <button type="button" class="fs-x" data-undo ${history.past.length ? '' : 'disabled'} title="Undo (Ctrl+Z)" aria-label="Undo">↶</button>
          <button type="button" class="fs-x" data-redo ${history.future.length ? '' : 'disabled'} title="Redo (Ctrl+Y)" aria-label="Redo">↷</button>
          <button type="button" class="fs-x" data-export-plan title="Save plan to a file" aria-label="Save plan">⤓</button>
          <button type="button" class="fs-x" data-import-plan title="Open a saved plan" aria-label="Open plan">⤒</button>
        </div>
      </div>

      <div class="fs-plan__blueprint">
        <select data-blueprint aria-label="Start from a blueprint">
          <option value="">Start from a blueprint…</option>
          ${PA.Blueprints.map(b => `<option value="${esc(b.id)}">${esc(b.label)}</option>`).join('')}
        </select>
        <select data-endpoint aria-label="Endpoint for the blueprint">
          ${PA.endpointOptions().map(e => `<option value="${esc(e.key)}">${esc(e.key)}</option>`).join('')}
        </select>
      </div>

      <div class="fs-tree" data-tree>
        <div class="fs-item fs-item--trigger ${selected === TRIGGER ? 'is-selected' : ''}" data-panel="${TRIGGER}" tabindex="0" role="button">
          <div class="fs-item__main">
            <span class="fs-twist fs-twist--none" aria-hidden="true"></span>
            <span class="fs-item__text">
              <span class="fs-item__name">${esc(triggerLabel)}</span>
              <span class="fs-item__meta">Trigger · definition export only</span>
            </span>
          </div>
        </div>
        ${plan.steps.length ? insertPoint('root', 0, 'at the start') : ''}
        ${plan.steps.length
          ? renderTree(plan.steps, 'root', names, selected, collapsed)
          : `<div class="fs-blank">
              <p>No actions yet.</p>
              ${insertPoint('root', 0, 'as the first action')}
              <p class="fs-help">Or pick a blueprint above.</p>
            </div>`}
      </div>

      <div class="fs-plan__foot">
        <button type="button" class="fs-btn fs-btn--ghost" data-panel-open="${IMPORT}">Import from designer</button>
        <button type="button" class="fs-btn fs-btn--ghost" data-panel-open="${CHECK}">Check payload</button>
        ${plan.steps.length ? '<button type="button" class="fs-btn fs-btn--ghost" data-clear>Clear</button>' : ''}
      </div>
    </aside>`;
  }

  /* ── the right column ───────────────────────────────────────────────────────────── */
  const tokenBar = () => `<div class="fs-tokens" data-tokens hidden>${
    TOKENS.map(([t, label]) => `<button type="button" class="fs-token" data-token="${esc(t)}" title="${esc(t)}">${esc(label)}</button>`).join('')
  }</div>`;

  function renderEditor(selected, names) {
    if (selected === TRIGGER) return renderTriggerPanel();
    if (selected === IMPORT) return renderImportPanel();
    if (selected === CHECK) return renderCheckPanel();

    const found = selected ? locate(selected) : null;
    if (!found) {
      return `<div class="fs-pane">${emptyState('Nothing selected',
        'Pick an action on the left to edit it, or press a + to add one.')}</div>`;
    }
    const step = found.step;
    const action = PA.actionById(step.actionId);
    const resolved = names.get(step.id) || '';
    const earlier = found.list.slice(0, found.index);
    const statuses = step.runAfterStatuses?.length ? step.runAfterStatuses : ['Succeeded'];
    const previous = found.index > 0 ? found.list[found.index - 1] : null;
    // Ordering controls only mean something once there is something to run after. The first
    // action in a list always starts its branch, so showing it a "run after" would be a lie.
    const ordering = !previous ? '' : `
      <details class="fs-ordering">
        <summary>Runs after <b>${esc(step.runAfterRef ? (earlier.find(s => s.id === step.runAfterRef)?.name || 'an earlier action') : (previous.name || PA.actionById(previous.actionId)?.label))}</b> · ${esc(statuses.join(', '))}</summary>
        <div class="fs-field">
          <span class="fs-label">Run after</span>
          <select data-order="ref">
            <option value="">${esc(previous.name || PA.actionById(previous.actionId)?.label || 'the previous action')} (the one before this)</option>
            ${earlier.slice(0, -1).map(s => `<option value="${esc(s.id)}" ${step.runAfterRef === s.id ? 'selected' : ''}>${esc(s.name || PA.actionById(s.actionId)?.label || 'Action')}</option>`).join('')}
          </select>
          <small class="fs-help">Pick an earlier action to fork off it instead of continuing the chain. Two actions after the same one, on opposite statuses, is how a failure branch is made.</small>
        </div>
        <div class="fs-field">
          <span class="fs-label">Only when it finished as</span>
          <div class="fs-statuses">${PA.RunAfterStatuses.map(st =>
            `<label class="fs-check"><input type="checkbox" data-order="status" value="${esc(st)}" ${statuses.includes(st) ? 'checked' : ''}> ${esc(st)}</label>`).join('')}</div>
        </div>
      </details>`;

    return `<div class="fs-pane">
      <header class="fs-pane__head">
        <div class="fs-pane__kicker">${esc(action.label)}${action.connector ? ' · needs a connection' : ''}</div>
        <h2>${esc(step.name || action.label)}</h2>
        <p class="fs-help">${esc(action.summary || '')}</p>
      </header>
      <form class="fs-form" data-editor="${esc(step.id)}">
        <div class="fs-field">
          <span class="fs-label">Action name</span>
          <input data-field="__name" value="${esc(step.name || '')}" placeholder="${esc(action.label)}" spellcheck="false">
          <small class="fs-help">Pastes as <code>${esc(resolved)}</code>. Underscores show as spaces; ${esc(ActionNamePolicy.forbidden.join(' '))} are rejected.</small>
        </div>
        ${ordering}
        ${(action.fields || []).map(fd => renderField(step, fd)).join('')}
      </form>
      ${tokenBar()}
    </div>`;
  }

  function renderTriggerPanel() {
    const spec = plan.triggerSpec || { id: '', values: {} };
    const trigger = PA.triggerById(spec.id);
    return `<div class="fs-pane">
      <header class="fs-pane__head">
        <div class="fs-pane__kicker">Trigger</div>
        <h2>${esc(trigger ? trigger.label : 'No trigger')}</h2>
        <p class="fs-help">A trigger cannot be pasted — the designer's paste path creates actions only. Choosing one here puts it in the workflow definition export instead.</p>
      </header>
      <form class="fs-form" data-trigger-form>
        <div class="fs-field">
          <span class="fs-label">Trigger</span>
          <select data-trigger>
            <option value="">None — actions only</option>
            ${PA.Triggers.map(t => `<option value="${esc(t.id)}" ${spec.id === t.id ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}
          </select>
        </div>
        ${trigger ? (trigger.fields || []).map(fd => renderField({ values: spec.values }, fd, spec.values)).join('') : ''}
      </form>
    </div>`;
  }

  function renderImportPanel() {
    return `<div class="fs-pane">
      <header class="fs-pane__head">
        <div class="fs-pane__kicker">Import</div>
        <h2>Bring an action in from your own tenant</h2>
        <p class="fs-help">Select an action in the Power Automate designer, open <b>Code view</b>, and paste what it shows. Connector operation names change over time; importing the real thing is how you get the exact shape rather than the catalog's best guess.</p>
      </header>
      <div class="fs-form">
        <div class="fs-field">
          <span class="fs-label">Pasted JSON</span>
          <textarea data-import rows="12" spellcheck="false" placeholder='{ "Get_items": { "type": "OpenApiConnection", "inputs": { … } } }'></textarea>
        </div>
        <button type="button" class="fs-btn" data-import-add>Add it to the plan</button>
        <small class="fs-help">A copied Scope works too. A single copied action does not — it carries the designer's internal model rather than the definition.</small>
      </div>
    </div>`;
  }

  /**
   * The payload self-check.
   *
   * The generator's envelope was built from the designer's own source, but source is not the
   * same as the build running in a given tenant. Rather than argue about whether the format
   * is right, this compares it against a real copy from the operator's own designer and says
   * exactly where the two differ.
   */
  function renderCheckPanel() {
    return `<div class="fs-pane">
      <header class="fs-pane__head">
        <div class="fs-pane__kicker">Diagnostic</div>
        <h2>Check the payload against your designer</h2>
        <p class="fs-help">In Power Automate, put an action inside a <b>Scope</b>, right-click the Scope and choose <b>Copy</b>. Paste it below. This compares what your designer produced with what this tool generates, and names any difference.</p>
      </header>
      <div class="fs-form">
        <div class="fs-field">
          <span class="fs-label">Paste a real copy from your designer</span>
          <textarea data-check rows="10" spellcheck="false" placeholder="Paste the clipboard contents here"></textarea>
        </div>
        <button type="button" class="fs-btn" data-check-run>Compare</button>
        <div data-check-out></div>
      </div>
    </div>`;
  }

  function renderOutput() {
    const issues = PA.validatePlan(plan);
    const errors = PA.errorsOf(issues);
    const blocked = errors.length > 0;
    const support = PA.browserSupport();
    const built = blocked ? { mode: PA.planMode(plan), fragments: [] } : PA.buildFragments(plan);

    const modeLine = {
      empty: 'Add an action to generate something.',
      single: 'One action — pastes as itself, no wrapper.',
      scope: 'Pastes as one Scope: a single paste carries one root action.',
      sequence: 'Pastes in parts — Initialize variable cannot be nested, so the set cannot be wrapped.'
    }[built.mode] || '';

    const groups = [['error', errors, 'Fix before generating'], ['warning', PA.warningsOf(issues), 'Worth checking'], ['note', PA.notesOf(issues), 'Before you paste']]
      .filter(([, xs]) => xs.length)
      .map(([sev, xs, title]) => `<details class="fs-find fs-find--${sev}" ${sev === 'error' ? 'open' : ''}>
        <summary>${esc(title)} <span class="fs-count">${xs.length}</span></summary>
        <ul>${xs.map(i => `<li>${i.where ? `<b>${esc(i.where)}</b> — ` : ''}${esc(i.message)}</li>`).join('')}</ul>
      </details>`).join('');

    const parts = built.fragments.map((frag, i) => `<div class="fs-part">
        <button type="button" class="fs-btn fs-btn--primary" data-copy="${i}">
          ${built.fragments.length > 1 ? `Copy part ${i + 1} of ${built.fragments.length}` : 'Copy for the designer'}
        </button>
        <button type="button" class="fs-btn fs-btn--ghost" data-toggle-json="${i}">JSON</button>
        <span class="fs-part__name">${esc(frag.name)}</span>
        <textarea class="fs-json" data-json="${i}" rows="10" readonly spellcheck="false" hidden>${esc(PA.payloadText(frag))}</textarea>
      </div>`).join('');

    return `<div class="fs-out">
      ${support.ok ? '' : `<div class="fs-alert" role="alert"><b>${esc(support.name)} cannot paste into the designer.</b> ${esc(support.reason)}</div>`}
      <div class="fs-out__head">
        <span class="fs-out__title">Paste</span>
        <span class="fs-out__mode">${esc(modeLine)}</span>
      </div>
      ${blocked
        ? `<p class="fs-out__blocked">${errors.length} thing${errors.length === 1 ? '' : 's'} to fix before this can generate.</p>`
        : parts || '<p class="fs-out__blocked">Nothing to paste yet.</p>'}
      <div class="fs-out__second">
        <button type="button" class="fs-btn fs-btn--ghost" data-copy-definition>Copy workflow definition</button>
        <span class="fs-help">for Logic Apps code view or a solution package — not the Power Automate designer, which has no editable code view</span>
      </div>
      ${groups}
    </div>`;
  }

  /* ── the palette ────────────────────────────────────────────────────────────────── */
  function paletteMatches() {
    const q = String(getState({ q: '' }).q || '').trim().toLowerCase();
    if (!q) return PA.Actions;
    return PA.Actions.filter(a =>
      a.label.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) ||
      (a.summary || '').toLowerCase().includes(q) ||
      (PA.ActionGroups.find(g => g.id === a.group)?.label || '').toLowerCase().includes(q));
  }

  function renderPalette() {
    if (!pendingInsert) return '';
    const matches = paletteMatches();
    if (paletteIndex >= matches.length) paletteIndex = Math.max(0, matches.length - 1);
    const groupLabel = id => PA.ActionGroups.find(g => g.id === id)?.label || '';
    return `<div class="fs-palette-wrap" data-palette-wrap>
      <div class="fs-palette" role="dialog" aria-label="Add an action">
        <input class="fs-palette__q" data-palette-q placeholder="Search ${PA.Actions.length} actions…" aria-label="Search actions" autocomplete="off">
        <div class="fs-palette__list" data-palette-list role="listbox">
          ${matches.length ? matches.map((a, i) => `<button type="button" role="option" aria-selected="${i === paletteIndex}"
              class="fs-palette__item ${i === paletteIndex ? 'is-active' : ''}" data-pick="${esc(a.id)}" data-i="${i}">
              <span class="fs-palette__name">${esc(a.label)}</span>
              <span class="fs-palette__group">${esc(groupLabel(a.group))}</span>
              <span class="fs-palette__sum">${esc(a.summary || '')}</span>
            </button>`).join('')
          : '<p class="fs-help fs-palette__none">Nothing matches that.</p>'}
        </div>
        <div class="fs-palette__foot"><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>Enter</kbd> add · <kbd>Esc</kbd> close</div>
      </div>
    </div>`;
  }

  /* ── render ─────────────────────────────────────────────────────────────────────── */
  function render(el) {
    root = el;
    const u = getState({ selected: '', collapsed: [], q: '' });
    const names = PA.resolveNames(plan);
    const issues = PA.validatePlan(plan);
    const errors = PA.errorsOf(issues).length;
    let count = 0;
    PA.walk(plan.steps, () => { count += 1; });
    const mode = PA.planMode(plan);
    const pastes = mode === 'empty' ? 0 : mode === 'sequence' ? plan.steps.length : 1;

    el.innerHTML = `<div class="fs-app">
      <header class="fs-top">
        <div class="fs-top__id">
          <span class="fs-top__eyebrow">Power Automate</span>
          <h1>Flow Studio</h1>
        </div>
        <div class="fs-status" role="status">
          <span><b>${count}</b> action${count === 1 ? '' : 's'}</span>
          <span><b>${pastes}</b> paste${pastes === 1 ? '' : 's'}</span>
          <span class="${errors ? 'is-bad' : 'is-ok'}"><b>${errors}</b> to fix</span>
          <span class="fs-saved" data-saved hidden>saved</span>
        </div>
      </header>
      <div class="fs-body">
        ${renderPlanColumn(names, u.selected)}
        <main class="fs-work">
          <div class="fs-work__scroll" data-editor-slot>${renderEditor(u.selected, names)}</div>
          <div class="fs-work__out" data-output>${renderOutput()}</div>
        </main>
      </div>
      ${renderPalette()}
    </div>`;
    bind(el);
    if (pendingInsert) el.querySelector('[data-palette-q]')?.focus();
  }

  /** Refresh only the live panels. Called while typing, so it must not touch the editor form. */
  function refreshOutput() {
    const slot = root?.querySelector('[data-output]');
    if (!slot) return;
    slot.innerHTML = renderOutput();
    bindOutput(slot);
    const status = root.querySelector('.fs-status');
    if (status) {
      const errs = PA.errorsOf(PA.validatePlan(plan)).length;
      const cell = status.querySelector('span:nth-child(3)');
      if (cell) { cell.innerHTML = `<b>${errs}</b> to fix`; cell.className = errs ? 'is-bad' : 'is-ok'; }
    }
  }

  function flashSaved() {
    const el = root?.querySelector('[data-saved]');
    if (!el) return;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.hidden = true; }, 1400);
  }

  const rerender = () => render(root);

  /* ── binding ────────────────────────────────────────────────────────────────────── */
  function bindOutput(scope) {
    scope.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
      const frag = PA.buildFragments(plan).fragments[Number(b.dataset.copy)];
      if (!frag) return;
      try {
        await PA.writeClipboard(PA.payloadText(frag));
        // Inline confirmation on the control itself. A toast alone leaves the button looking
        // exactly as it did before the click, which is why the old version felt unresponsive.
        const original = b.textContent;
        b.textContent = 'Copied ✓';
        b.classList.add('is-done');
        setTimeout(() => { b.textContent = original; b.classList.remove('is-done'); }, 1800);
        toast('Copied — in the designer press + then "Paste an action"', 'success');
      } catch (e) { toast(e.message, 'error'); }
    }));
    scope.querySelectorAll('[data-toggle-json]').forEach(b => b.addEventListener('click', () => {
      const ta = scope.querySelector(`[data-json="${b.dataset.toggleJson}"]`);
      if (!ta) return;
      ta.hidden = !ta.hidden;
      b.classList.toggle('is-on', !ta.hidden);
    }));
    scope.querySelector('[data-copy-definition]')?.addEventListener('click', async b => {
      try {
        await PA.writeClipboard(PA.definitionText(plan, plan.trigger));
        toast(plan.trigger ? `Definition copied, trigger "${plan.trigger.name}" included` : 'Definition copied', 'success');
      } catch (e) { toast(e.message, 'error'); }
    });
  }

  /** Save text as a file. Same in both surfaces, so it is not injected. */
  function download(filename, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function pickFile(accept, onText) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = accept;
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (file) onText(await file.text());
    });
    input.click();
  }

  /** Wire the "infer this schema from a sample" boxes inside a form. */
  function bindSamplers(form, write) {
    form.querySelectorAll('[data-infer]').forEach(b => b.addEventListener('click', () => {
      const field = b.dataset.infer;
      const sample = form.querySelector(`[data-sample="${field}"]`)?.value || '';
      try {
        const schemaText = PA.schemaTextFromSample(sample);
        write(field, schemaText);
        const target = form.querySelector(`textarea[data-field="${field}"]`);
        if (target) target.value = schemaText;
        toast('Schema inferred', 'success');
      } catch (e) { toast(e.message, 'error'); }
    }));
  }

  function openPalette(listKey, index) {
    pendingInsert = { listKey, index };
    paletteIndex = 0;
    setState({ q: '' });
    rerender();
  }
  function closePalette() {
    if (!pendingInsert) return;
    pendingInsert = null;
    rerender();
  }

  function bind(el) {
    const u = getState({ selected: '', collapsed: [], q: '' });

    /* ---- palette ---- */
    if (pendingInsert) {
      const q = el.querySelector('[data-palette-q]');
      const list = el.querySelector('[data-palette-list]');
      q.value = u.q || '';
      const pick = id => {
        const step = addStep(id, pendingInsert.listKey, pendingInsert.index);
        pendingInsert = null;
        if (step) setState({ selected: step.id });
        rerender();
      };
      q.addEventListener('input', e => {
        setState({ q: e.target.value });
        paletteIndex = 0;
        const matches = paletteMatches();
        const groupLabel = gid => PA.ActionGroups.find(g => g.id === gid)?.label || '';
        list.innerHTML = matches.length ? matches.map((a, i) => `<button type="button" role="option" aria-selected="${i === 0}"
            class="fs-palette__item ${i === 0 ? 'is-active' : ''}" data-pick="${esc(a.id)}" data-i="${i}">
            <span class="fs-palette__name">${esc(a.label)}</span>
            <span class="fs-palette__group">${esc(groupLabel(a.group))}</span>
            <span class="fs-palette__sum">${esc(a.summary || '')}</span>
          </button>`).join('') : '<p class="fs-help fs-palette__none">Nothing matches that.</p>';
        list.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => pick(b.dataset.pick)));
      });
      q.addEventListener('keydown', e => {
        const items = [...list.querySelectorAll('[data-pick]')];
        if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
        else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (!items.length) return;
          paletteIndex = (paletteIndex + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
          items.forEach((b, i) => { b.classList.toggle('is-active', i === paletteIndex); b.setAttribute('aria-selected', i === paletteIndex); });
          items[paletteIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (items[paletteIndex]) pick(items[paletteIndex].dataset.pick);
        }
      });
      list.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => pick(b.dataset.pick)));
      el.querySelector('[data-palette-wrap]')?.addEventListener('mousedown', e => {
        if (e.target === e.currentTarget) closePalette();
      });
    }

    el.querySelectorAll('[data-insert]').forEach(b => b.addEventListener('click', () =>
      openPalette(b.dataset.insert, Number(b.dataset.at))));

    /* ---- plan toolbar ---- */
    const planName = el.querySelector('[data-plan-name]');
    planName?.addEventListener('focus', beginFieldEdit);
    planName?.addEventListener('change', commitFieldEdit);
    planName?.addEventListener('input', e => { plan.name = e.target.value; save(); refreshOutput(); });
    el.querySelector('[data-undo]')?.addEventListener('click', () => { if (undo()) rerender(); });
    el.querySelector('[data-redo]')?.addEventListener('click', () => { if (redo()) rerender(); });
    el.querySelector('[data-export-plan]')?.addEventListener('click', () => {
      download(`${(plan.name || 'flow-plan').replace(/[^\w.-]+/g, '-').toLowerCase()}.plan.json`, JSON.stringify(plan, null, 2));
      toast('Plan saved', 'success');
    });
    el.querySelector('[data-import-plan]')?.addEventListener('click', () => pickFile('.json,application/json', text => {
      try {
        const parsed = JSON.parse(text);
        if (!parsed || !Array.isArray(parsed.steps)) throw new Error('That file does not contain a plan (no steps array).');
        mutate(() => { plan = { ...blankPlan(), ...parsed }; });
        setState({ selected: plan.steps[0]?.id || '' });
        toast('Plan opened', 'success');
        rerender();
      } catch (e) { toast(e.message, 'error'); }
    }));
    el.querySelector('[data-clear]')?.addEventListener('click', async () => {
      if (!await confirm({ title: 'Clear the plan', body: '<p>Every action is removed. Undo brings them back.</p>', confirmText: 'Clear', cancelText: 'Cancel' })) return;
      mutate(() => { plan = blankPlan(); });
      setState({ selected: '' }); rerender();
    });

    const bp = el.querySelector('[data-blueprint]');
    bp?.addEventListener('change', async e => {
      const id = e.target.value;
      if (!id) return;
      e.target.value = '';
      if (plan.steps.length && !await confirm({
        title: 'Replace the current plan',
        body: `<p>Loading this blueprint discards the ${plan.steps.length} action(s) already here. Undo brings them back.</p>`,
        confirmText: 'Replace', cancelText: 'Keep what I have'
      })) return;
      const endpointKey = el.querySelector('[data-endpoint]')?.value || PA.endpointOptions()[0]?.key;
      try {
        const built = PA.blueprintById(id).build({
          endpointKey,
          routeKey: PA.endpointOptions().find(x => x.key === endpointKey)?.routeKeys?.[0]
        });
        mutate(() => { plan = { ...blankPlan(), name: built.name, steps: built.steps, trigger: built.trigger || null, notes: built.notes || [] }; });
        setState({ selected: plan.steps[0]?.id || '' });
        toast(`${PA.blueprintById(id).label} loaded`, 'success');
        rerender();
      } catch (err) { toast(err.message, 'error'); }
    });

    /* ---- tree: selection, collapse, tools, drag ---- */
    el.querySelectorAll('[data-panel]').forEach(node => {
      const open = () => { setState({ selected: node.dataset.panel }); rerender(); };
      node.addEventListener('click', open);
      node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    el.querySelectorAll('[data-panel-open]').forEach(b => b.addEventListener('click', () => {
      setState({ selected: b.dataset.panelOpen }); rerender();
    }));

    el.querySelectorAll('[data-step]').forEach(node => {
      const id = node.dataset.step;
      const open = () => { setState({ selected: id }); rerender(); };
      node.addEventListener('click', e => { if (!e.target.closest('button')) open(); });
      node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });

      // Drag to reorder, including between branches. The ↑/↓ buttons stay as the keyboard and
      // assistive path — drag is an addition, never the only way to move something.
      node.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
        node.classList.add('is-dragging');
      });
      node.addEventListener('dragend', () => {
        node.classList.remove('is-dragging');
        el.querySelectorAll('.is-dropbefore,.is-dropafter').forEach(n => n.classList.remove('is-dropbefore', 'is-dropafter'));
      });
      node.addEventListener('dragover', e => {
        const dragged = el.querySelector('.is-dragging')?.dataset.step;
        if (!dragged || dragged === id || contains(dragged, id)) return;   // never into your own subtree
        e.preventDefault();
        const before = e.offsetY < node.offsetHeight / 2;
        node.classList.toggle('is-dropbefore', before);
        node.classList.toggle('is-dropafter', !before);
      });
      node.addEventListener('dragleave', () => node.classList.remove('is-dropbefore', 'is-dropafter'));
      node.addEventListener('drop', e => {
        e.preventDefault();
        const dragged = e.dataTransfer.getData('text/plain');
        const before = node.classList.contains('is-dropbefore');
        node.classList.remove('is-dropbefore', 'is-dropafter');
        if (!dragged || dragged === id || contains(dragged, id)) return;
        const target = locate(id);
        if (!target) return;
        relocate(dragged, keyOfList(id), target.index + (before ? 0 : 1));
        setState({ selected: dragged });
        rerender();
      });
    });

    el.querySelectorAll('[data-collapse]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.collapse;
      const collapsed = getState({ collapsed: [] }).collapsed || [];
      setState({ collapsed: collapsed.includes(id) ? collapsed.filter(x => x !== id) : [...collapsed, id] });
      rerender();
    }));
    el.querySelectorAll('[data-move]').forEach(b => b.addEventListener('click', () => { moveStep(b.dataset.move, Number(b.dataset.delta)); rerender(); }));
    el.querySelectorAll('[data-duplicate]').forEach(b => b.addEventListener('click', () => {
      const copy = duplicateStep(b.dataset.duplicate);
      if (copy) setState({ selected: copy.id });
      rerender();
    }));
    el.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
      removeStep(b.dataset.remove);
      if (u.selected === b.dataset.remove) setState({ selected: '' });
      rerender();
    }));

    /* ---- trigger panel ---- */
    const triggerForm = el.querySelector('[data-trigger-form]');
    if (triggerForm) {
      const rebuild = () => {
        const spec = plan.triggerSpec;
        const t = spec && PA.triggerById(spec.id);
        plan.trigger = t ? t.build(spec.values || {}) : null;
      };
      const writeTrigger = (name, value) => {
        if (!plan.triggerSpec) return;
        plan.triggerSpec.values[name] = value;
        rebuild(); save(); refreshOutput();
      };
      el.querySelector('[data-trigger]')?.addEventListener('change', e => {
        const t = PA.triggerById(e.target.value);
        mutate(() => {
          plan.triggerSpec = t ? { id: t.id, values: PA.defaultTriggerValues(t) } : null;
          rebuild();
        });
        rerender();
      });
      triggerForm.querySelectorAll('[data-field]').forEach(input => {
        const evt = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
        input.addEventListener(evt, e => writeTrigger(input.dataset.field, input.type === 'checkbox' ? e.target.checked : e.target.value));
      });
      bindSamplers(triggerForm, writeTrigger);
    }

    /* ---- import panel ---- */
    el.querySelector('[data-import-add]')?.addEventListener('click', () => {
      const text = el.querySelector('[data-import]')?.value || '';
      try {
        const { name, definition, from } = PA.importDefinition(text);
        const step = addStep('raw', 'root', plan.steps.length);
        mutate(() => {
          step.name = name;
          step.values.definition = JSON.stringify(definition, null, 2);
        });
        setState({ selected: step.id });
        toast(`Imported from ${from}: ${PA.describeDefinition(definition)}`, 'success');
        rerender();
      } catch (e) { toast(e.message, 'error'); }
    });

    /* ---- payload self-check ---- */
    el.querySelector('[data-check-run]')?.addEventListener('click', () => {
      const out = el.querySelector('[data-check-out]');
      const text = el.querySelector('[data-check]')?.value || '';
      out.innerHTML = renderCheckResult(compareWithRealCopy(text));
    });

    /* ---- the editor ---- */
    const form = el.querySelector('[data-editor]');
    if (form) {
      const step = locate(form.dataset.editor)?.step;
      const write = (name, value) => {
        if (!step) return;
        if (name === '__name') step.name = value; else step.values[name] = value;
        save(); refreshOutput();
      };

      // The token chips follow the caret: they move under whichever field has focus, and stay
      // hidden until one does. The old version parked them at the top of the form and told you
      // off for pressing them before clicking a field — a mode error dressed as a hint.
      const tokens = el.querySelector('[data-tokens]');
      form.addEventListener('focusin', e => {
        if (!e.target.matches('input[data-field], textarea[data-field], input[data-cell]')) return;
        beginFieldEdit();
        lastField = e.target;
        if (!tokens) return;
        const holder = e.target.closest('.fs-field, .fs-row') || e.target.parentElement;
        holder.after(tokens);
        tokens.hidden = false;
      });
      el.querySelectorAll('[data-token]').forEach(b => b.addEventListener('mousedown', e => {
        e.preventDefault();                       // keep focus in the field
        if (!lastField || !form.contains(lastField)) return;
        const token = b.dataset.token;
        const start = lastField.selectionStart ?? lastField.value.length;
        const end = lastField.selectionEnd ?? start;
        lastField.value = lastField.value.slice(0, start) + token + lastField.value.slice(end);
        lastField.setSelectionRange(start + token.length, start + token.length);
        lastField.dispatchEvent(new Event('input', { bubbles: true }));
      }));

      form.querySelector('[data-order="ref"]')?.addEventListener('change', e => {
        if (!step) return;
        mutate(() => { step.runAfterRef = e.target.value || undefined; });
        refreshOutput();
      });
      form.querySelectorAll('[data-order="status"]').forEach(box => box.addEventListener('change', () => {
        if (!step) return;
        const picked = [...form.querySelectorAll('[data-order="status"]')].filter(b => b.checked).map(b => b.value);
        // An edge with no status never runs. Refuse the empty set rather than generating one.
        mutate(() => { step.runAfterStatuses = picked.length ? picked : ['Succeeded']; });
        if (!picked.length) box.checked = box.value === 'Succeeded';
        refreshOutput();
      }));

      form.querySelectorAll('[data-field]').forEach(input => {
        if (input.closest('[data-repeat]')) return;
        const evt = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
        input.addEventListener(evt, e => {
          write(input.dataset.field, input.type === 'checkbox' ? e.target.checked : e.target.value);
          // The name shows in the tree, and a variable's TYPE changes how its value is read.
          if (input.dataset.field === '__name') refreshTreeLabel(step);
          if (input.tagName === 'SELECT' && input.dataset.field === 'type') rerender();
        });
        // `change` fires on blur, and only when the value moved — one undo step per edit.
        if (evt === 'input') input.addEventListener('change', commitFieldEdit);
        else input.addEventListener('change', () => { beginFieldEdit(); commitFieldEdit(); });
      });

      bindSamplers(form, write);

      form.querySelectorAll('[data-repeat]').forEach(rep => {
        const fieldName = rep.dataset.repeat;
        rep.querySelectorAll('[data-row]').forEach(row => {
          row.querySelectorAll('[data-cell]').forEach(cell => {
            const evt = cell.tagName === 'SELECT' ? 'change' : 'input';
            cell.addEventListener('focus', beginFieldEdit);
            cell.addEventListener('change', commitFieldEdit);
            cell.addEventListener(evt, () => {
              const list = rowsOf(step, fieldName);
              list[Number(row.dataset.row)] = { ...list[Number(row.dataset.row)], [cell.dataset.cell]: cell.value };
              step.values[fieldName] = list;
              save();
              // A case row renames a branch, so the tree has to follow it.
              if (fieldName === 'cases' && cell.dataset.cell === 'name') rerender(); else refreshOutput();
            });
          });
          row.querySelector('[data-row-remove]')?.addEventListener('click', () => mutate(() => {
            const list = rowsOf(step, fieldName);
            list.splice(Number(row.dataset.row), 1);
            step.values[fieldName] = list;
            rerender();
          }));
        });
        rep.querySelector('[data-row-add]')?.addEventListener('click', () => mutate(() => {
          step.values[fieldName] = [...rowsOf(step, fieldName), fieldName === 'conditions' ? { left: '', operator: 'equals', right: '' } : { name: '', value: '' }];
          rerender();
        }));
      });
    }

    bindOutput(el.querySelector('[data-output]') || el);
  }

  /** Retitle one tree row in place, so renaming does not cost a full re-render. */
  function refreshTreeLabel(step) {
    if (!step) return;
    const node = root?.querySelector(`[data-step="${step.id}"] .fs-item__name`);
    if (node) node.textContent = step.name || PA.actionById(step.actionId)?.label || 'Action';
  }

  /* ── the self-check ─────────────────────────────────────────────────────────────── */
  /**
   * Compare a real clipboard copy from the operator's designer with what this tool emits.
   *
   * The envelope here was read out of the designer's source, but source is not the build
   * running in a given tenant. This turns "the format looks wrong" into a specific list of
   * differences that either confirms the format or names exactly what to change.
   */
  function compareWithRealCopy(text) {
    let real;
    try { real = JSON.parse(text); }
    catch (e) { return { fatal: `That is not valid JSON — ${e.message}` }; }
    if (!real || typeof real !== 'object') return { fatal: 'Expected a JSON object from the clipboard.' };

    const ours = PA.toPayload({ name: 'Sample', definition: { type: 'Scope', actions: {} } });
    const findings = [];
    const ok = [];

    for (const key of Object.keys(ours)) {
      if (!(key in real)) findings.push(`Your designer's copy has no "${key}". This tool sends one.`);
      else ok.push(key);
    }
    for (const key of Object.keys(real)) {
      if (!(key in ours)) findings.push(`Your designer's copy carries an extra "${key}" that this tool does not send.`);
    }
    if ('mslaNode' in real && real.mslaNode !== true) {
      findings.push(`"mslaNode" is ${JSON.stringify(real.mslaNode)} in your copy, not true — that is the key the designer gates on.`);
    }
    if ('isScopeNode' in real && real.isScopeNode !== true) {
      findings.push('Your copy has isScopeNode:false, which means a single action was copied rather than a Scope. Copy a Scope to compare like with like.');
    }
    if (real.serializedOperation && typeof real.serializedOperation.type !== 'string') {
      findings.push('serializedOperation has no "type" — that is the action definition this tool generates.');
    }
    return { fatal: null, matched: ok, findings, sameShape: findings.length === 0, gate: DesignerClipboard.mslaNodeFlag };
  }

  function renderCheckResult(r) {
    if (r.fatal) return `<div class="fs-find fs-find--error"><ul><li>${esc(r.fatal)}</li></ul></div>`;
    if (r.sameShape) {
      return `<div class="fs-find fs-find--ok" open>
        <ul><li><b>The envelope matches.</b> Your designer produced the same keys this tool generates
        (${esc(r.matched.join(', '))}), and <code>mslaNode</code> is true. If a paste still fails,
        the problem is in an action definition rather than the envelope — send me the action and I will look at it.</li></ul>
      </div>`;
    }
    return `<div class="fs-find fs-find--warn" open>
      <summary>Differences found <span class="fs-count">${r.findings.length}</span></summary>
      <ul>${r.findings.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
    </div>`;
  }

  /* ── keyboard ───────────────────────────────────────────────────────────────────── */
  function onKeydown(e) {
    if (!root?.isConnected) return;
    if (e.key === 'Escape' && pendingInsert) { e.preventDefault(); closePalette(); return; }
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    // Inside a text field the browser already owns Ctrl+Z. Running plan-level undo as well
    // meant one keystroke both cleared what you had typed AND reverted an unrelated earlier
    // change — two edits lost from one press. The field's own undo is the right behaviour
    // there; plan-level undo applies when focus is not in one.
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    const key = e.key.toLowerCase();
    if (key === 'z' && !e.shiftKey) { if (undo()) { e.preventDefault(); rerender(); } }
    else if ((key === 'z' && e.shiftKey) || key === 'y') { if (redo()) { e.preventDefault(); rerender(); } }
  }

  return {
    mount(el) {
      installStudioStyles(el.ownerDocument || document);
      // The layout is a full-height two-column app, so the host element has to pass its
      // height through. Both surfaces give it one; this just stops a stray default
      // (height:auto on a plain div) collapsing the panes to their content.
      el.style.height = '100%';
      el.style.minHeight = '0';
      plan = load() || blankPlan();
      history.past.length = 0; history.future.length = 0;
      pendingInsert = null;
      document.removeEventListener('keydown', onKeydown);
      document.addEventListener('keydown', onKeydown);
      render(el);
    },
    getPlan: () => plan,
    setPlan: next => { mutate(() => { plan = { ...blankPlan(), ...next }; }); if (root) rerender(); }
  };
}
