// Flow Studio — generate Power Automate actions and paste them into the modern designer.
//
// The screen is a thin shell over core/power-automate/. It owns the plan being edited, the
// selection, and the DOM; every decision about what a valid action looks like lives in the
// library, so the two cannot drift.
//
// Editing does not re-render the whole screen. A full re-render on every keystroke throws
// away focus and caret position in the middle of typing an expression, which is exactly when
// it hurts most. Typing updates the plan and refreshes only the output and findings panels;
// the structure re-renders only when the structure actually changes.

import { hydrateGovernance } from '../core/governed-actions.js';
import { head, kpis, esc, toast, confirmAction, emptyState } from '../core/ui.js';
import { UIState } from '../core/ui-state.js';
import { ActionNamePolicy, DesignerBrowserSupport } from '../config/power-automate.config.js';
import * as PA from '../core/power-automate/index.js';

const STORE_KEY = 'dgo.flow-studio.plan';
const blankPlan = () => ({ name: 'Generated actions', steps: [], trigger: null, notes: [] });

let plan = blankPlan();
let host = null;

/* ── plan persistence ─────────────────────────────────────────────────────────────── */
// The plan is the operator's work, not view state, so it outlives a reload. It is entirely
// local — nothing here is sent anywhere, and there is nothing in a plan worth syncing.
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && Array.isArray(parsed.steps) ? parsed : null;
  } catch { return null; }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(plan)); } catch { /* quota or private mode — the plan just does not persist */ }
}

/* ── plan navigation ──────────────────────────────────────────────────────────────── */
let uid = 0;
const newId = () => `s${Date.now().toString(36)}${(uid += 1).toString(36)}`;

/** Locate a step and the list it belongs to, so it can be moved or removed in place. */
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

/** Every list a new step could be added to, labelled by its path through the plan. */
function insertTargets() {
  const targets = [{ key: 'root', label: 'Top level of the flow' }];
  const visit = (steps, prefix) => {
    for (const step of steps) {
      const action = PA.actionById(step.actionId);
      if (!action) continue;
      const name = step.name || action.label;
      const branches = [...(action.branches || [])];
      if (action.dynamicCases) {
        for (const c of step.values?.cases || []) {
          const label = c?.name || c?.value || 'Case';
          branches.unshift({ key: `case:${c?.name ?? c?.value}`, label: `case ${label}` });
        }
      }
      for (const b of branches) {
        targets.push({ key: `${step.id}|${b.key}`, label: `${prefix}${name} → ${b.label}` });
        visit(step.branches?.[b.key] || [], `${prefix}${name} → ${b.label} → `);
      }
    }
  };
  visit(plan.steps, '');
  return targets;
}

function listForTarget(key) {
  if (key === 'root') return plan.steps;
  const [stepId, branchKey] = String(key).split('|');
  const found = locate(stepId);
  if (!found) return plan.steps;
  found.step.branches = found.step.branches || {};
  found.step.branches[branchKey] = found.step.branches[branchKey] || [];
  return found.step.branches[branchKey];
}

/* ── mutations ────────────────────────────────────────────────────────────────────── */
function addStep(actionId, targetKey) {
  const action = PA.actionById(actionId);
  if (!action) return null;
  const step = { id: newId(), actionId, name: '', values: PA.defaultValues(action), branches: {} };
  listForTarget(targetKey).push(step);
  save();
  return step;
}

function removeStep(id) {
  const found = locate(id);
  if (!found) return;
  found.list.splice(found.index, 1);
  save();
}

function moveStep(id, delta) {
  const found = locate(id);
  if (!found) return;
  const next = found.index + delta;
  if (next < 0 || next >= found.list.length) return;
  const [item] = found.list.splice(found.index, 1);
  found.list.splice(next, 0, item);
  save();
}

/* ── field rendering ──────────────────────────────────────────────────────────────── */
const rowsOf = (step, name) => Array.isArray(step.values?.[name]) ? step.values[name] : [];

function repeatRows(step, fd, columns) {
  const rows = rowsOf(step, fd.name);
  const body = rows.map((row, i) => `<div class="form-row" data-row="${i}" data-field="${esc(fd.name)}">${
    columns.map(col => col.kind === 'select'
      ? `<select data-cell="${esc(col.key)}" aria-label="${esc(col.label)}">${col.options.map(([v, l]) =>
          `<option value="${esc(v)}" ${String(row?.[col.key] ?? '') === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`
      : `<input data-cell="${esc(col.key)}" value="${esc(row?.[col.key] ?? '')}" placeholder="${esc(col.label)}" aria-label="${esc(col.label)}">`
    ).join('')
  }<button type="button" class="btn ghost" data-row-remove aria-label="Remove row">Remove</button></div>`).join('');
  return `<div class="repeat" data-repeat="${esc(fd.name)}">${body || '<p class="meta">No rows yet.</p>'}
    <button type="button" class="btn ghost" data-row-add="${esc(fd.name)}">Add row</button></div>`;
}

function renderField(step, fd) {
  const v = step.values?.[fd.name];
  const help = fd.help ? `<small class="meta">${esc(fd.help)}</small>` : '';
  const label = `${esc(fd.label)}${fd.required ? ' <span aria-hidden="true">*</span>' : ''}`;
  const attrs = `data-field="${esc(fd.name)}"${fd.placeholder ? ` placeholder="${esc(fd.placeholder)}"` : ''}`;

  switch (fd.kind) {
    case 'textarea':
    case 'json':
      return `<label class="wide">${label}<textarea rows="${fd.rows || 4}" ${attrs} spellcheck="false">${esc(v ?? '')}</textarea>${help}</label>`;
    case 'select':
      return `<label>${label}<select ${attrs}>${(fd.options || []).map(([val, lab]) =>
        `<option value="${esc(val)}" ${String(v ?? '') === val ? 'selected' : ''}>${esc(lab)}</option>`).join('')}</select>${help}</label>`;
    case 'boolean':
      return `<label class="check-inline"><input type="checkbox" ${attrs} ${v === true || v === 'true' ? 'checked' : ''}> ${label}${help}</label>`;
    case 'keyvalue':
      return `<div class="wide"><div class="dgo-field__label">${label}</div>${help}
        ${repeatRows(step, fd, [{ key: 'name', label: 'Name' }, { key: 'value', label: 'Value' }])}</div>`;
    case 'fieldmap':
      return `<div class="wide"><div class="dgo-field__label">${label}</div>${help}
        ${repeatRows(step, fd, [{ key: 'name', label: 'Column internal name' }, { key: 'value', label: 'Value' }])}</div>`;
    case 'cases':
      return `<div class="wide"><div class="dgo-field__label">${label}</div>${help}
        ${repeatRows(step, fd, [{ key: 'name', label: 'Branch label' }, { key: 'value', label: 'Matches value' }])}</div>`;
    case 'conditions':
      return `<div class="wide"><div class="dgo-field__label">${label}</div>${help}
        ${repeatRows(step, fd, [
          { key: 'left', label: 'Value' },
          { key: 'operator', label: 'Operator', kind: 'select', options: PA.ConditionOperators.map(o => [o.id, o.label]) },
          { key: 'right', label: 'Compare with' }
        ])}</div>`;
    default:
      return `<label>${label}<input ${attrs} value="${esc(v ?? '')}" spellcheck="false">${help}</label>`;
  }
}

/* ── panels ───────────────────────────────────────────────────────────────────────── */
function renderTree(steps, depth = 0, selected = '') {
  return steps.map(step => {
    const action = PA.actionById(step.actionId);
    if (!action) return '';
    const name = step.name || action.label;
    const branches = [...(action.branches || [])];
    if (action.dynamicCases) {
      for (const c of step.values?.cases || []) {
        branches.unshift({ key: `case:${c?.name ?? c?.value}`, label: `case ${c?.name || c?.value || ''}` });
      }
    }
    const children = branches.map(b => {
      const list = step.branches?.[b.key] || [];
      return `<div class="fs-branch"><div class="fs-branch__label meta">${esc(b.label)}</div>${
        list.length ? renderTree(list, depth + 1, selected) : '<p class="meta fs-branch__empty">Empty</p>'}</div>`;
    }).join('');
    return `<div class="fs-node" style="--fs-depth:${depth}">
      <div class="list-item ${step.id === selected ? 'active' : ''}" data-step="${esc(step.id)}" tabindex="0" role="button">
        <h4>${esc(name)}</h4>
        <div class="meta">${esc(action.label)}${action.connector ? ' · connector' : ''}</div>
        <div class="form-row fs-node__ctl">
          <button type="button" class="btn ghost" data-move="${esc(step.id)}" data-delta="-1" aria-label="Move ${esc(name)} up">↑</button>
          <button type="button" class="btn ghost" data-move="${esc(step.id)}" data-delta="1" aria-label="Move ${esc(name)} down">↓</button>
          <button type="button" class="btn ghost" data-remove="${esc(step.id)}" aria-label="Remove ${esc(name)}">Remove</button>
        </div>
      </div>${children}</div>`;
  }).join('');
}

function renderEditor(selected) {
  const found = selected ? locate(selected) : null;
  if (!found) {
    return `<section class="panel">${emptyState('No action selected',
      'Choose an action on the left to edit it, or add one from the catalog above.')}</section>`;
  }
  const step = found.step;
  const action = PA.actionById(step.actionId);
  const earlier = found.list.slice(0, found.index);
  const statuses = step.runAfterStatuses?.length ? step.runAfterStatuses : ['Succeeded'];
  // Ordering controls only mean something once there is something to run after. The first
  // action in a list always starts its branch, so showing it a "run after" would be a lie.
  const ordering = found.index === 0 ? '' : `
      <label>Run after
        <select data-order="ref">
          <option value="">${esc(found.list[found.index - 1].name || PA.actionById(found.list[found.index - 1].actionId)?.label || 'the action before this one')} (the action before this one)</option>
          ${earlier.slice(0, -1).map(s => `<option value="${esc(s.id)}" ${step.runAfterRef === s.id ? 'selected' : ''}>${esc(s.name || PA.actionById(s.actionId)?.label || 'Action')}</option>`).join('')}
        </select>
        <small class="meta">Pick an earlier action to fork off it instead of continuing the chain. That is how a failure branch is made — two actions running after the same one, on opposite statuses.</small>
      </label>
      <div class="wide"><div class="dgo-field__label">Only when it finished as</div>
        <div class="form-row">${PA.RunAfterStatuses.map(st =>
          `<label class="check-inline"><input type="checkbox" data-order="status" value="${esc(st)}" ${statuses.includes(st) ? 'checked' : ''}> ${esc(st)}</label>`).join('')}</div>
        <small class="meta">Succeeded is the default. A failure branch waits on Failed and TimedOut.</small>
      </div>`;
  return `<section class="panel">
    <div class="eyebrow panel-eyebrow">${esc(action.label)}</div>
    <h2>${esc(step.name || action.label)}</h2>
    <p class="meta">${esc(action.summary || '')}</p>
    <form class="grid" data-editor="${esc(step.id)}">
      <label class="wide">Action name
        <input data-field="__name" value="${esc(step.name || '')}" placeholder="${esc(action.label)}" spellcheck="false">
        <small class="meta">Becomes the action's name in the designer. Blank uses "${esc(action.label)}". Underscores show as spaces; ${esc(ActionNamePolicy.forbidden.join(' '))} are rejected.</small>
      </label>
      ${ordering}
      ${(action.fields || []).map(fd => renderField(step, fd)).join('')}
    </form>
  </section>`;
}

function renderFindings(issues) {
  const group = (sev, title, tone) => {
    const xs = issues.filter(i => i.severity === sev);
    if (!xs.length) return '';
    return `<div class="fs-findings fs-findings--${tone}"><h3>${esc(title)} (${xs.length})</h3><ul>${
      xs.map(i => `<li>${i.where ? `<b>${esc(i.where)}</b> — ` : ''}${esc(i.message)}</li>`).join('')}</ul></div>`;
  };
  return `${group('error', 'Must be fixed before generating', 'error')}
    ${group('warning', 'Worth checking', 'warn')}
    ${group('note', 'Before you paste', 'note')}`;
}

function renderOutput() {
  const issues = PA.validatePlan(plan);
  const blocked = !PA.canGenerate(issues);
  const support = PA.browserSupport();
  const built = blocked ? { mode: PA.planMode(plan), fragments: [], errors: [] } : PA.buildFragments(plan);

  const banner = support.ok ? '' :
    `<div class="alert" role="alert"><b>${esc(support.name)} cannot paste into the designer.</b> ${esc(support.reason)}</div>`;

  const modeLine = {
    empty: 'Add an action to generate something.',
    single: 'One action — pastes as itself, with no wrapper.',
    scope: 'Several actions — they paste as one Scope, because a single paste carries one root action.',
    sequence: 'Several actions, one of which cannot be nested — paste each part below in order.'
  }[built.mode] || '';

  const fragments = built.fragments.map((frag, i) => {
    const text = PA.payloadText(frag);
    return `<article class="panel fs-fragment">
      <div class="eyebrow panel-eyebrow">${built.fragments.length > 1 ? `Paste ${i + 1} of ${built.fragments.length}` : 'Paste this'}</div>
      <h3>${esc(frag.name)}</h3>
      <p class="meta">${esc(frag.root === 'scope' ? 'A Scope wrapping every action in the plan.' : 'A single root action.')} · ${text.length.toLocaleString()} characters</p>
      <div class="form-row">
        <button type="button" class="btn" data-copy="${i}">Copy for the designer</button>
        <button type="button" class="btn ghost" data-toggle-json="${i}">Show JSON</button>
      </div>
      <textarea class="fs-json" data-json="${i}" rows="12" readonly hidden spellcheck="false">${esc(text)}</textarea>
    </article>`;
  }).join('');

  return `${banner}
    <section class="panel">
      <div class="eyebrow panel-eyebrow">Output</div>
      <h2>Paste into the designer</h2>
      <p class="meta">${esc(modeLine)}</p>
      <ol class="fs-howto meta">
        <li>Copy below.</li>
        <li>In the Power Automate designer, click the <b>+</b> where the actions should go.</li>
        <li>Choose <b>Paste an action</b>.</li>
      </ol>
      <div class="form-row">
        <button type="button" class="btn ghost" data-copy-definition>Copy workflow definition (code view)</button>
        ${plan.trigger ? '<span class="chip">includes trigger</span>' : ''}
      </div>
      ${renderFindings(issues)}
    </section>
    ${blocked ? `<section class="panel">${emptyState('Not generating yet', 'Fix the blocking issues above and the payload appears here.')}</section>` : fragments}`;
}

function renderLeft(tab, selected) {
  if (tab === 'blueprints') {
    const endpoints = PA.endpointOptions();
    const u = UIState.get('flow-studio', {});
    return `<section class="panel">
      <h2>Start from a DGO blueprint</h2>
      <p class="meta">Scaffolds built from this platform's own endpoint contracts — the request shape core/data-client.js sends and the response envelope core/contracts.js accepts.</p>
      <label class="wide">Endpoint
        <select data-endpoint>${endpoints.map(e =>
          `<option value="${esc(e.key)}" ${u.endpointKey === e.key ? 'selected' : ''}>${esc(e.key)} — ${esc(e.action)}${e.write ? ' (write)' : ''} · ${e.routeKeys.length} action${e.routeKeys.length === 1 ? '' : 's'}</option>`).join('')}</select>
      </label>
      <label class="wide">Request shape
        <select data-shape>
          <option value="nested" ${u.shape !== 'flat' ? 'selected' : ''}>Nested — { action, payload, requestId, timestamp }</option>
          <option value="flat" ${u.shape === 'flat' ? 'selected' : ''}>Flat — { action, …payload, correlationId }</option>
        </select>
      </label>
      ${PA.Blueprints.map(b => `<div class="action-row">
        <span><b>${esc(b.label)}</b><small>${esc(b.summary)}</small></span>
        <button type="button" class="btn" data-blueprint="${esc(b.id)}">Load</button>
      </div>`).join('')}
      <p class="meta">Loading a blueprint replaces the current plan.</p>
    </section>`;
  }

  if (tab === 'import') {
    return `<section class="panel">
      <h2>Import from the designer</h2>
      <p class="meta">Use <b>Peek code</b> on any action in Power Automate and paste what it shows. Connector operation names change over time; importing a real action from your own tenant is how you get the exact shape rather than the catalog's best guess.</p>
      <label class="wide">Pasted JSON
        <textarea data-import rows="12" spellcheck="false" placeholder='{ "Get_items": { "type": "OpenApiConnection", "inputs": { … } } }'></textarea>
      </label>
      <div class="form-row">
        <button type="button" class="btn" data-import-add>Add as an action</button>
      </div>
      <p class="meta">A copied Scope works too. A single copied action does not — it carries the designer's internal model rather than the definition.</p>
    </section>`;
  }

  const targets = insertTargets();
  const u = UIState.get('flow-studio', {});
  return `<section class="panel">
    <h2>Add an action</h2>
    <div class="form-row">
      <select data-group aria-label="Action group">${PA.ActionGroups.map(g =>
        `<option value="${esc(g.id)}" ${u.group === g.id ? 'selected' : ''}>${esc(g.label)}</option>`).join('')}</select>
      <select data-action aria-label="Action">${PA.actionsInGroup(u.group || 'control').map(a =>
        `<option value="${esc(a.id)}">${esc(a.label)}</option>`).join('')}</select>
    </div>
    <label class="wide">Add to
      <select data-target>${targets.map(t => `<option value="${esc(t.key)}">${esc(t.label)}</option>`).join('')}</select>
    </label>
    <div class="form-row"><button type="button" class="btn" data-add>Add action</button></div>
  </section>
  <section class="panel">
    <div class="form-row fs-planhead">
      <label class="wide">Plan name<input data-plan-name value="${esc(plan.name || '')}" spellcheck="false">
        <small class="meta">Used as the Scope's name when several actions paste together.</small></label>
    </div>
    <h3>Actions</h3>
    ${plan.steps.length ? renderTree(plan.steps, 0, selected) : emptyState('No actions yet', 'Add one above, or load a blueprint.')}
    ${plan.steps.length ? '<div class="form-row"><button type="button" class="btn ghost" data-clear>Clear the plan</button></div>' : ''}
  </section>`;
}

/* ── render + bind ────────────────────────────────────────────────────────────────── */
function render(el) {
  host = el;
  const u = UIState.get('flow-studio', { tab: 'blueprints', selected: '', group: 'control' });
  const issues = PA.validatePlan(plan);
  let count = 0;
  PA.walk(plan.steps, () => { count += 1; });
  const mode = PA.planMode(plan);
  const pastes = mode === 'empty' ? 0 : mode === 'sequence' ? plan.steps.length : 1;

  el.innerHTML = `<div class="workspace fs-workspace">
    ${head('Flow Studio', 'Build a set of Power Automate actions here, copy them, and paste them straight into the modern designer.', 'Power Automate')}
    ${kpis([
      ['Actions', count],
      ['Pastes', pastes],
      ['Blocking issues', PA.errorsOf(issues).length],
      ['Worth checking', PA.warningsOf(issues).length]
    ])}
    <div class="cc-tabs" role="tablist">
      ${[['blueprints', 'Blueprints'], ['builder', 'Builder'], ['import', 'Import']].map(([id, label]) =>
        `<button type="button" class="cc-tab ${u.tab === id ? 'active' : ''}" role="tab" aria-selected="${u.tab === id}" data-tab="${id}">${label}</button>`).join('')}
    </div>
    <div class="split fs-split">
      <div class="fs-left panel-stack">${renderLeft(u.tab, u.selected)}</div>
      <div class="detail-col panel-stack">
        ${u.tab === 'builder' ? renderEditor(u.selected) : ''}
        <div data-output>${renderOutput()}</div>
      </div>
    </div>
  </div>`;
  bind(el);
}

/** Refresh only the live panels. Called while typing, so it must not touch the editor form. */
function refreshOutput() {
  if (!host) return;
  const slot = host.querySelector('[data-output]');
  if (!slot) return;
  slot.innerHTML = renderOutput();
  bindOutput(slot);
}

function bindOutput(root) {
  root.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const built = PA.buildFragments(plan);
    const frag = built.fragments[Number(b.dataset.copy)];
    if (!frag) return;
    try {
      await PA.writeClipboard(PA.payloadText(frag));
      toast('Copied — in the designer choose + then "Paste an action"', 'success');
    } catch (e) { toast(e.message, 'error'); }
  }));
  root.querySelectorAll('[data-toggle-json]').forEach(b => b.addEventListener('click', () => {
    const ta = root.querySelector(`[data-json="${b.dataset.toggleJson}"]`);
    if (!ta) return;
    ta.hidden = !ta.hidden;
    b.textContent = ta.hidden ? 'Show JSON' : 'Hide JSON';
  }));
  root.querySelector('[data-copy-definition]')?.addEventListener('click', async () => {
    try {
      await PA.writeClipboard(PA.definitionText(plan, plan.trigger));
      toast(plan.trigger
        ? 'Workflow definition copied, trigger included — paste it into code view'
        : 'Workflow definition copied — paste it into code view', 'success');
    } catch (e) { toast(e.message, 'error'); }
  });
}

function bind(el) {
  const u = UIState.get('flow-studio', { tab: 'blueprints', selected: '', group: 'control' });
  const rerender = () => render(el);

  el.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
    UIState.set('flow-studio', { tab: b.dataset.tab }); rerender();
  }));

  // ── blueprints ────────────────────────────────────────────────────────────────────
  el.querySelector('[data-endpoint]')?.addEventListener('change', e => UIState.set('flow-studio', { endpointKey: e.target.value }));
  el.querySelector('[data-shape]')?.addEventListener('change', e => UIState.set('flow-studio', { shape: e.target.value }));
  el.querySelectorAll('[data-blueprint]').forEach(b => b.addEventListener('click', async () => {
    if (plan.steps.length && !await confirmAction({
      title: 'Replace the current plan',
      body: `<p>Loading this blueprint discards the ${plan.steps.length} action(s) already in the plan.</p>`,
      confirmText: 'Replace', cancelText: 'Keep what I have'
    })) return;
    const state = UIState.get('flow-studio', {});
    const bp = PA.blueprintById(b.dataset.blueprint);
    try {
      const built = bp.build({
        endpointKey: state.endpointKey || PA.endpointOptions()[0]?.key,
        shape: state.shape || 'nested',
        routeKey: state.endpointKey ? PA.endpointOptions().find(x => x.key === state.endpointKey)?.routeKeys?.[0] : undefined
      });
      plan = { name: built.name, steps: built.steps, trigger: built.trigger || null, notes: built.notes || [] };
      save();
      UIState.set('flow-studio', { tab: 'builder', selected: plan.steps[0]?.id || '' });
      toast(`${bp.label} loaded`, 'success');
      rerender();
    } catch (e) { toast(e.message, 'error'); }
  }));

  // ── import ────────────────────────────────────────────────────────────────────────
  el.querySelector('[data-import-add]')?.addEventListener('click', () => {
    const text = el.querySelector('[data-import]')?.value || '';
    try {
      const { name, definition, from } = PA.importDefinition(text);
      const step = addStep('raw', 'root');
      step.name = name;
      step.values.definition = JSON.stringify(definition, null, 2);
      save();
      UIState.set('flow-studio', { tab: 'builder', selected: step.id });
      toast(`Imported from ${from}: ${PA.describeDefinition(definition)}`, 'success');
      rerender();
    } catch (e) { toast(e.message, 'error'); }
  });

  // ── builder: catalog picker ───────────────────────────────────────────────────────
  el.querySelector('[data-group]')?.addEventListener('change', e => {
    UIState.set('flow-studio', { group: e.target.value }); rerender();
  });
  el.querySelector('[data-add]')?.addEventListener('click', () => {
    const actionId = el.querySelector('[data-action]')?.value;
    const target = el.querySelector('[data-target]')?.value || 'root';
    const step = addStep(actionId, target);
    if (step) { UIState.set('flow-studio', { selected: step.id }); rerender(); }
  });
  el.querySelector('[data-plan-name]')?.addEventListener('input', e => { plan.name = e.target.value; save(); refreshOutput(); });
  el.querySelector('[data-clear]')?.addEventListener('click', async () => {
    if (!await confirmAction({ title: 'Clear the plan', body: '<p>Every action in the plan is removed. This cannot be undone.</p>', confirmText: 'Clear', cancelText: 'Cancel' })) return;
    plan = blankPlan(); save(); UIState.set('flow-studio', { selected: '' }); rerender();
  });

  // ── builder: tree ─────────────────────────────────────────────────────────────────
  el.querySelectorAll('[data-step]').forEach(node => {
    const open = () => { UIState.set('flow-studio', { selected: node.dataset.step }); rerender(); };
    node.addEventListener('click', e => { if (!e.target.closest('button')) open(); });
    node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  el.querySelectorAll('[data-move]').forEach(b => b.addEventListener('click', () => { moveStep(b.dataset.move, Number(b.dataset.delta)); rerender(); }));
  el.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
    removeStep(b.dataset.remove);
    if (u.selected === b.dataset.remove) UIState.set('flow-studio', { selected: '' });
    rerender();
  }));

  // ── builder: the editor form ──────────────────────────────────────────────────────
  const form = el.querySelector('[data-editor]');
  if (form) {
    const found = locate(form.dataset.editor);
    const step = found?.step;
    const write = (name, value) => {
      if (!step) return;
      if (name === '__name') step.name = value;
      else step.values[name] = value;
      save();
      refreshOutput();
    };
    // Ordering controls. They change the runAfter graph rather than any field value, so they
    // are read straight off the form rather than routed through write().
    form.querySelector('[data-order="ref"]')?.addEventListener('change', e => {
      if (!step) return;
      step.runAfterRef = e.target.value || undefined;
      save(); refreshOutput();
    });
    form.querySelectorAll('[data-order="status"]').forEach(box => box.addEventListener('change', () => {
      if (!step) return;
      const picked = [...form.querySelectorAll('[data-order="status"]')].filter(b => b.checked).map(b => b.value);
      // An edge with no status never runs. Refuse the empty set rather than generating one.
      step.runAfterStatuses = picked.length ? picked : ['Succeeded'];
      if (!picked.length) box.checked = box.value === 'Succeeded';
      save(); refreshOutput();
    }));
    // Direct fields. `input` keeps the output live; `change` re-renders only for the fields
    // whose value changes the STRUCTURE — a switch's cases add branches to the tree.
    form.querySelectorAll('[data-field]').forEach(input => {
      if (input.closest('[data-repeat]')) return;
      const evt = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(evt, e => {
        write(input.dataset.field, input.type === 'checkbox' ? e.target.checked : e.target.value);
        if (input.tagName === 'SELECT' && input.dataset.field === 'type') rerender();
      });
    });
    // Repeating rows.
    form.querySelectorAll('[data-repeat]').forEach(rep => {
      const fieldName = rep.dataset.repeat;
      rep.querySelectorAll('[data-row]').forEach(row => {
        row.querySelectorAll('[data-cell]').forEach(cell => {
          const evt = cell.tagName === 'SELECT' ? 'change' : 'input';
          cell.addEventListener(evt, () => {
            const list = rowsOf(step, fieldName);
            list[Number(row.dataset.row)] = { ...list[Number(row.dataset.row)], [cell.dataset.cell]: cell.value };
            step.values[fieldName] = list;
            save();
            // A case row renames a branch, so the tree and the "Add to" list must follow it.
            if (fieldName === 'cases' && cell.dataset.cell === 'name') rerender(); else refreshOutput();
          });
        });
        row.querySelector('[data-row-remove]')?.addEventListener('click', () => {
          const list = rowsOf(step, fieldName);
          list.splice(Number(row.dataset.row), 1);
          step.values[fieldName] = list;
          save(); rerender();
        });
      });
      rep.querySelector('[data-row-add]')?.addEventListener('click', () => {
        step.values[fieldName] = [...rowsOf(step, fieldName), fieldName === 'conditions' ? { left: '', operator: 'equals', right: '' } : { name: '', value: '' }];
        save(); rerender();
      });
    });
  }

  bindOutput(el.querySelector('[data-output]') || el);
}

export async function mount(el) {
  hydrateGovernance();
  plan = load() || blankPlan();
  render(el);
}
