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
//   getState, setState            view state (tab, selection) — in-memory either way
//   storage                       where the plan is kept between visits
//
// Everything else — the plan model, the tree, the editor, validation display, the output
// panel — is here.
//
// Editing does not re-render the whole screen. A full re-render on every keystroke throws
// away focus and caret position in the middle of typing an expression, which is exactly
// when it hurts most. Typing updates the plan and refreshes only the output and findings;
// the structure re-renders when the structure actually changes.

import * as PA from './index.js';
import { ActionNamePolicy } from '../../config/power-automate.config.js';

const STORE_KEY = 'dgo.flow-studio.plan';
const HISTORY_LIMIT = 50;

const blankPlan = () => ({ name: 'Generated actions', steps: [], trigger: null, triggerSpec: null, notes: [] });

/** Expressions worth one click. These are the ones people mistype, not the ones they forget. */
const TOKENS = [
  ["@{triggerBody()?['field']}", 'trigger field'],
  ['@triggerBody()', 'whole trigger body'],
  ["@{outputs('Action')}", 'action output'],
  ["@body('Action')", 'action body (whole)'],
  ["@{variables('name')}", 'variable'],
  ['@{item()}', 'current loop item'],
  ['@{utcNow()}', 'now'],
  ['@{guid()}', 'new guid'],
  ["@{workflow()?['run']?['name']}", 'run id']
];

export function createStudio(host) {
  const { esc, head, kpis, emptyState, toast, confirm, getState, setState, storage } = host;

  let plan = blankPlan();
  let root = null;
  let lastField = null;                       // for the token inserter
  const history = { past: [], future: [] };

  /* ── persistence ────────────────────────────────────────────────────────────────── */
  // The plan is the operator's work, not view state, so it outlives a reload. It is entirely
  // local — nothing here is sent anywhere, and there is nothing in a plan worth syncing.
  const snapshot = () => JSON.stringify(plan);
  const save = () => { try { storage.set(STORE_KEY, snapshot()); } catch { /* quota or private mode */ } };
  function load() {
    try {
      const parsed = JSON.parse(storage.get(STORE_KEY) || 'null');
      return parsed && Array.isArray(parsed.steps) ? { ...blankPlan(), ...parsed } : null;
    } catch { return null; }
  }

  /** Every change to the plan goes through here, so undo has something to undo. */
  function mutate(fn) {
    history.past.push(snapshot());
    if (history.past.length > HISTORY_LIMIT) history.past.shift();
    history.future.length = 0;
    const result = fn();
    save();
    return result;
  }
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

  /** Branch labels for a step, including a Switch's cases, which are named by the operator. */
  function branchesOf(step, action) {
    const out = [...(action?.branches || [])];
    if (action?.dynamicCases) {
      for (const c of step.values?.cases || []) {
        out.unshift({ key: `case:${c?.name ?? c?.value}`, label: `case ${c?.name || c?.value || ''}` });
      }
    }
    return out;
  }

  /** Every list a new step could be added to, labelled by its path through the plan. */
  function insertTargets() {
    const targets = [{ key: 'root', label: 'Top level of the flow' }];
    const visit = (steps, prefix) => {
      for (const step of steps) {
        const action = PA.actionById(step.actionId);
        if (!action) continue;
        const name = step.name || action.label;
        for (const b of branchesOf(step, action)) {
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

  /* ── mutations ──────────────────────────────────────────────────────────────────── */
  const addStep = (actionId, targetKey) => mutate(() => {
    const action = PA.actionById(actionId);
    if (!action) return null;
    const step = { id: newId(), actionId, name: '', values: PA.defaultValues(action), branches: {} };
    listForTarget(targetKey).push(step);
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

  function renderField(step, fd, values = step.values) {
    const v = values?.[fd.name];
    const help = fd.help ? `<small class="meta">${esc(fd.help)}</small>` : '';
    const label = `${esc(fd.label)}${fd.required ? ' <span aria-hidden="true">*</span>' : ''}`;
    const attrs = `data-field="${esc(fd.name)}"${fd.placeholder ? ` placeholder="${esc(fd.placeholder)}"` : ''}`;
    // Schema fields are the worst thing to write by hand and the easiest to derive, so the
    // sample box sits with the field rather than behind a menu.
    const sampler = fd.inferFromSample ? `<details class="fs-sampler"><summary>Infer this schema from a sample payload</summary>
        <textarea data-sample="${esc(fd.name)}" rows="6" spellcheck="false" placeholder='{ "action": "track", "payload": { "reference": "DGO/2026/001" } }'></textarea>
        <button type="button" class="btn ghost" data-infer="${esc(fd.name)}">Infer schema</button>
        <small class="meta">No <code>required</code> list is generated: a sample is one observation, and asserting it would fail later payloads that omit an optional field.</small>
      </details>` : '';

    switch (fd.kind) {
      case 'textarea':
      case 'json':
        return `<label class="wide">${label}<textarea rows="${fd.rows || 4}" ${attrs} spellcheck="false">${esc(v ?? '')}</textarea>${help}${sampler}</label>`;
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

  /* ── panels ─────────────────────────────────────────────────────────────────────── */
  function renderTree(steps, names, depth = 0, selected = '') {
    return steps.map(step => {
      const action = PA.actionById(step.actionId);
      if (!action) return '';
      const resolved = names.get(step.id) || '';
      const typed = step.name || action.label;
      // The name the action will ACTUALLY carry, once duplicates are resolved. Without it an
      // operator writing outputs('Compose') cannot tell which Compose they mean.
      const renamed = resolved && ActionNamePolicy.toKey(typed) !== resolved;
      const children = branchesOf(step, action).map(b => {
        const list = step.branches?.[b.key] || [];
        return `<div class="fs-branch"><div class="fs-branch__label meta">${esc(b.label)}</div>${
          list.length ? renderTree(list, names, depth + 1, selected) : '<p class="meta fs-branch__empty">Empty</p>'}</div>`;
      }).join('');
      return `<div class="fs-node" style="--fs-depth:${depth}">
        <div class="list-item ${step.id === selected ? 'active' : ''}" data-step="${esc(step.id)}" tabindex="0" role="button">
          <h4>${esc(typed)}</h4>
          <div class="meta">${esc(action.label)}${action.connector ? ' · connector' : ''}
            ${resolved ? `· <code class="fs-resolved${renamed ? ' fs-resolved--changed' : ''}">${esc(resolved)}</code>` : ''}</div>
          <div class="form-row fs-node__ctl">
            <button type="button" class="btn ghost" data-move="${esc(step.id)}" data-delta="-1" aria-label="Move ${esc(typed)} up">↑</button>
            <button type="button" class="btn ghost" data-move="${esc(step.id)}" data-delta="1" aria-label="Move ${esc(typed)} down">↓</button>
            <button type="button" class="btn ghost" data-duplicate="${esc(step.id)}" aria-label="Duplicate ${esc(typed)}">Duplicate</button>
            <button type="button" class="btn ghost" data-remove="${esc(step.id)}" aria-label="Remove ${esc(typed)}">Remove</button>
          </div>
        </div>${children}</div>`;
    }).join('');
  }

  const tokenBar = () => `<div class="fs-tokens"><span class="meta">Insert:</span>${
    TOKENS.map(([t, label]) => `<button type="button" class="chip" data-token="${esc(t)}" title="${esc(t)}">${esc(label)}</button>`).join('')
  }</div>`;

  function renderEditor(selected, names) {
    const found = selected ? locate(selected) : null;
    if (!found) {
      return `<section class="panel">${emptyState('No action selected',
        'Choose an action on the left to edit it, or add one from the catalog above.')}</section>`;
    }
    const step = found.step;
    const action = PA.actionById(step.actionId);
    const resolved = names.get(step.id) || '';
    const earlier = found.list.slice(0, found.index);
    const statuses = step.runAfterStatuses?.length ? step.runAfterStatuses : ['Succeeded'];
    // Ordering controls only mean something once there is something to run after. The first
    // action in a list always starts its branch, so showing it a "run after" would be a lie.
    const previous = found.index > 0 ? found.list[found.index - 1] : null;
    const ordering = !previous ? '' : `
        <label>Run after
          <select data-order="ref">
            <option value="">${esc(previous.name || PA.actionById(previous.actionId)?.label || 'the action before this one')} (the action before this one)</option>
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
      ${tokenBar()}
      <form class="grid" data-editor="${esc(step.id)}">
        <label class="wide">Action name
          <input data-field="__name" value="${esc(step.name || '')}" placeholder="${esc(action.label)}" spellcheck="false">
          <small class="meta">Pastes as <code>${esc(resolved)}</code>. Underscores show as spaces; ${esc(ActionNamePolicy.forbidden.join(' '))} are rejected.</small>
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
    const built = blocked ? { mode: PA.planMode(plan), fragments: [] } : PA.buildFragments(plan);

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
        <textarea class="fs-json" data-json="${i}" rows="12" readonly spellcheck="false" hidden>${esc(text)}</textarea>
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
          ${plan.trigger ? `<span class="chip">trigger: ${esc(plan.trigger.name)}</span>` : '<span class="chip">no trigger</span>'}
        </div>
        ${renderFindings(issues)}
      </section>
      ${blocked ? `<section class="panel">${emptyState('Not generating yet', 'Fix the blocking issues above and the payload appears here.')}</section>` : fragments}`;
  }

  function renderBlueprints() {
    const endpoints = PA.endpointOptions();
    const u = getState({});
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
      <p class="meta">Loading a blueprint replaces the current plan. Undo brings it back.</p>
    </section>`;
  }

  function renderTriggerTab() {
    const spec = plan.triggerSpec || { id: '', values: {} };
    const trigger = PA.triggerById(spec.id);
    return `<section class="panel">
      <h2>Trigger</h2>
      <p class="meta">A trigger cannot be pasted — the designer's paste path creates actions only. Choose one here and it goes into the workflow definition export instead, for code view or import.</p>
      <label class="wide">Trigger
        <select data-trigger>
          <option value="">None — actions only</option>
          ${PA.Triggers.map(t => `<option value="${esc(t.id)}" ${spec.id === t.id ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}
        </select>
      </label>
      ${trigger ? `<p class="meta">${esc(trigger.summary || '')}</p>
        <form class="grid" data-trigger-form>
          ${(trigger.fields || []).map(fd => renderField({ values: spec.values }, fd, spec.values)).join('')}
        </form>
        ${plan.trigger ? `<p class="meta">Exports as <code>${esc(plan.trigger.name)}</code>.</p>` : ''}` : ''}
    </section>`;
  }

  function renderImport() {
    return `<section class="panel">
      <h2>Import from the designer</h2>
      <p class="meta">Use <b>Peek code</b> on any action in Power Automate and paste what it shows. Connector operation names change over time; importing a real action from your own tenant is how you get the exact shape rather than the catalog's best guess.</p>
      <label class="wide">Pasted JSON
        <textarea data-import rows="12" spellcheck="false" placeholder='{ "Get_items": { "type": "OpenApiConnection", "inputs": { … } } }'></textarea>
      </label>
      <div class="form-row"><button type="button" class="btn" data-import-add>Add as an action</button></div>
      <p class="meta">A copied Scope works too. A single copied action does not — it carries the designer's internal model rather than the definition.</p>
    </section>`;
  }

  function renderBuilder(selected, names) {
    const u = getState({ group: '', search: '' });
    const q = String(u.search || '').toLowerCase();
    // One search box beats two dependent selects once the catalog passes about twenty
    // entries, and it matches how people look for an action in the designer itself.
    const matches = PA.Actions.filter(a =>
      (!u.group || a.group === u.group) &&
      (!q || a.label.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || (a.summary || '').toLowerCase().includes(q)));
    const targets = insertTargets();
    return `<section class="panel">
      <h2>Add an action</h2>
      <div class="form-row">
        <input data-search value="${esc(u.search || '')}" placeholder="Search ${PA.Actions.length} actions" aria-label="Search actions">
        <select data-group aria-label="Group">
          <option value="">All groups</option>
          ${PA.ActionGroups.map(g => `<option value="${esc(g.id)}" ${u.group === g.id ? 'selected' : ''}>${esc(g.label)}</option>`).join('')}
        </select>
      </div>
      <label class="wide">Add to
        <select data-target>${targets.map(t => `<option value="${esc(t.key)}">${esc(t.label)}</option>`).join('')}</select>
      </label>
      <div class="fs-catalog">${matches.length ? matches.map(a => `<div class="action-row">
        <span><b>${esc(a.label)}</b><small>${esc(a.summary || '')}</small></span>
        <button type="button" class="btn ghost" data-add="${esc(a.id)}">Add</button>
      </div>`).join('') : '<p class="meta">Nothing matches that search.</p>'}</div>
    </section>
    <section class="panel">
      <label class="wide">Plan name<input data-plan-name value="${esc(plan.name || '')}" spellcheck="false">
        <small class="meta">Used as the Scope's name when several actions paste together.</small></label>
      <div class="form-row fs-planctl">
        <button type="button" class="btn ghost" data-undo ${history.past.length ? '' : 'disabled'}>Undo</button>
        <button type="button" class="btn ghost" data-redo ${history.future.length ? '' : 'disabled'}>Redo</button>
        <button type="button" class="btn ghost" data-export-plan>Save plan</button>
        <button type="button" class="btn ghost" data-import-plan>Open plan</button>
        ${plan.steps.length ? '<button type="button" class="btn ghost" data-clear>Clear</button>' : ''}
      </div>
      <h3>Actions</h3>
      ${plan.steps.length ? renderTree(plan.steps, names, 0, selected) : emptyState('No actions yet', 'Add one above, or load a blueprint.')}
    </section>`;
  }

  /* ── render ─────────────────────────────────────────────────────────────────────── */
  function render(el) {
    root = el;
    const u = getState({ tab: 'blueprints', selected: '', group: '', search: '' });
    const issues = PA.validatePlan(plan);
    const names = PA.resolveNames(plan);
    let count = 0;
    PA.walk(plan.steps, () => { count += 1; });
    const mode = PA.planMode(plan);
    const pastes = mode === 'empty' ? 0 : mode === 'sequence' ? plan.steps.length : 1;

    const left = u.tab === 'blueprints' ? renderBlueprints()
      : u.tab === 'import' ? renderImport()
      : u.tab === 'trigger' ? renderTriggerTab()
      : renderBuilder(u.selected, names);

    el.innerHTML = `<div class="workspace fs-workspace">
      ${head('Flow Studio', 'Build a set of Power Automate actions here, copy them, and paste them straight into the modern designer.', 'Power Automate')}
      ${kpis([
        ['Actions', count],
        ['Pastes', pastes],
        ['Blocking issues', PA.errorsOf(issues).length],
        ['Worth checking', PA.warningsOf(issues).length]
      ])}
      <div class="cc-tabs" role="tablist">
        ${[['blueprints', 'Blueprints'], ['builder', 'Builder'], ['trigger', 'Trigger'], ['import', 'Import']].map(([id, label]) =>
          `<button type="button" class="cc-tab ${u.tab === id ? 'active' : ''}" role="tab" aria-selected="${u.tab === id}" data-tab="${id}">${label}</button>`).join('')}
      </div>
      <div class="split fs-split">
        <div class="fs-left panel-stack">${left}</div>
        <div class="detail-col panel-stack">
          ${u.tab === 'builder' ? renderEditor(u.selected, names) : ''}
          <div data-output>${renderOutput()}</div>
        </div>
      </div>
    </div>`;
    bind(el);
  }

  /** Refresh only the live panels. Called while typing, so it must not touch the editor form. */
  function refreshOutput() {
    const slot = root?.querySelector('[data-output]');
    if (!slot) return;
    slot.innerHTML = renderOutput();
    bindOutput(slot);
  }

  /* ── binding ────────────────────────────────────────────────────────────────────── */
  function bindOutput(scope) {
    scope.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
      const frag = PA.buildFragments(plan).fragments[Number(b.dataset.copy)];
      if (!frag) return;
      try {
        await PA.writeClipboard(PA.payloadText(frag));
        toast('Copied — in the designer choose + then "Paste an action"', 'success');
      } catch (e) { toast(e.message, 'error'); }
    }));
    scope.querySelectorAll('[data-toggle-json]').forEach(b => b.addEventListener('click', () => {
      const ta = scope.querySelector(`[data-json="${b.dataset.toggleJson}"]`);
      if (!ta) return;
      ta.hidden = !ta.hidden;
      b.textContent = ta.hidden ? 'Show JSON' : 'Hide JSON';
    }));
    scope.querySelector('[data-copy-definition]')?.addEventListener('click', async () => {
      try {
        await PA.writeClipboard(PA.definitionText(plan, plan.trigger));
        toast(plan.trigger
          ? `Workflow definition copied, trigger "${plan.trigger.name}" included — paste it into code view`
          : 'Workflow definition copied — paste it into code view', 'success');
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

  /** Ask for a file and hand back its text. */
  function pickFile(accept, onText) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = accept;
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (file) onText(await file.text());
    });
    input.click();
  }

  function rerender() { render(root); }

  /**
   * Wire the "infer this schema from a sample" boxes inside a form.
   *
   * Extracted because two forms carry schema fields — a Parse JSON step and the HTTP request
   * trigger — and binding it only inside the step editor left the trigger's button inert:
   * present, clickable, and doing nothing.
   */
  function bindSamplers(form, write) {
    form.querySelectorAll('[data-infer]').forEach(b => b.addEventListener('click', () => {
      const field = b.dataset.infer;
      const sample = form.querySelector(`[data-sample="${field}"]`)?.value || '';
      try {
        const schemaText = PA.schemaTextFromSample(sample);
        write(field, schemaText);
        const target = form.querySelector(`textarea[data-field="${field}"]`);
        if (target) target.value = schemaText;
        toast('Schema inferred from the sample', 'success');
      } catch (e) { toast(e.message, 'error'); }
    }));
  }

  function bind(el) {
    const u = getState({ tab: 'blueprints', selected: '', group: '', search: '' });

    el.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
      setState({ tab: b.dataset.tab }); rerender();
    }));

    // ── blueprints ────────────────────────────────────────────────────────────────
    el.querySelector('[data-endpoint]')?.addEventListener('change', e => setState({ endpointKey: e.target.value }));
    el.querySelector('[data-shape]')?.addEventListener('change', e => setState({ shape: e.target.value }));
    el.querySelectorAll('[data-blueprint]').forEach(b => b.addEventListener('click', async () => {
      if (plan.steps.length && !await confirm({
        title: 'Replace the current plan',
        body: `<p>Loading this blueprint discards the ${plan.steps.length} action(s) already in the plan. Undo brings them back.</p>`,
        confirmText: 'Replace', cancelText: 'Keep what I have'
      })) return;
      const state = getState({});
      const bp = PA.blueprintById(b.dataset.blueprint);
      try {
        const built = bp.build({
          endpointKey: state.endpointKey || PA.endpointOptions()[0]?.key,
          shape: state.shape || 'nested',
          routeKey: state.endpointKey ? PA.endpointOptions().find(x => x.key === state.endpointKey)?.routeKeys?.[0] : undefined
        });
        mutate(() => {
          plan = { ...blankPlan(), name: built.name, steps: built.steps, trigger: built.trigger || null, notes: built.notes || [] };
        });
        setState({ tab: 'builder', selected: plan.steps[0]?.id || '' });
        toast(`${bp.label} loaded`, 'success');
        rerender();
      } catch (e) { toast(e.message, 'error'); }
    }));

    // ── trigger ───────────────────────────────────────────────────────────────────
    const rebuildTrigger = () => {
      const spec = plan.triggerSpec;
      const trigger = spec && PA.triggerById(spec.id);
      plan.trigger = trigger ? trigger.build(spec.values || {}) : null;
    };
    el.querySelector('[data-trigger]')?.addEventListener('change', e => {
      const trigger = PA.triggerById(e.target.value);
      mutate(() => {
        plan.triggerSpec = trigger ? { id: trigger.id, values: PA.defaultTriggerValues(trigger) } : null;
        rebuildTrigger();
      });
      rerender();
    });
    const triggerForm = el.querySelector('[data-trigger-form]');
    if (triggerForm) {
      const writeTrigger = (name, value) => {
        if (!plan.triggerSpec) return;
        plan.triggerSpec.values[name] = value;
        rebuildTrigger(); save(); refreshOutput();
      };
      triggerForm.querySelectorAll('[data-field]').forEach(input => {
        const evt = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
        input.addEventListener(evt, e => writeTrigger(input.dataset.field, input.type === 'checkbox' ? e.target.checked : e.target.value));
      });
      bindSamplers(triggerForm, writeTrigger);
    }

    // ── import from the designer ──────────────────────────────────────────────────
    el.querySelector('[data-import-add]')?.addEventListener('click', () => {
      const text = el.querySelector('[data-import]')?.value || '';
      try {
        const { name, definition, from } = PA.importDefinition(text);
        const step = addStep('raw', 'root');
        mutate(() => {
          step.name = name;
          step.values.definition = JSON.stringify(definition, null, 2);
        });
        setState({ tab: 'builder', selected: step.id });
        toast(`Imported from ${from}: ${PA.describeDefinition(definition)}`, 'success');
        rerender();
      } catch (e) { toast(e.message, 'error'); }
    });

    // ── builder: catalog ──────────────────────────────────────────────────────────
    const search = el.querySelector('[data-search]');
    if (search) {
      // Re-render on input would steal focus mid-word, so the list is refreshed in place.
      search.addEventListener('input', e => {
        setState({ search: e.target.value });
        const slot = el.querySelector('.fs-catalog');
        if (!slot) return;
        const q = String(e.target.value || '').toLowerCase();
        const group = getState({}).group;
        const matches = PA.Actions.filter(a => (!group || a.group === group) &&
          (!q || a.label.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || (a.summary || '').toLowerCase().includes(q)));
        slot.innerHTML = matches.length ? matches.map(a => `<div class="action-row">
          <span><b>${esc(a.label)}</b><small>${esc(a.summary || '')}</small></span>
          <button type="button" class="btn ghost" data-add="${esc(a.id)}">Add</button>
        </div>`).join('') : '<p class="meta">Nothing matches that search.</p>';
        bindAdd(slot);
      });
    }
    el.querySelector('[data-group]')?.addEventListener('change', e => { setState({ group: e.target.value }); rerender(); });

    const bindAdd = scope => scope.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => {
      const target = el.querySelector('[data-target]')?.value || 'root';
      const step = addStep(b.dataset.add, target);
      if (step) { setState({ selected: step.id }); rerender(); }
    }));
    bindAdd(el);

    el.querySelector('[data-plan-name]')?.addEventListener('input', e => { plan.name = e.target.value; save(); refreshOutput(); });
    el.querySelector('[data-undo]')?.addEventListener('click', () => { if (undo()) rerender(); else toast('Nothing to undo', ''); });
    el.querySelector('[data-redo]')?.addEventListener('click', () => { if (redo()) rerender(); else toast('Nothing to redo', ''); });
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
      if (!await confirm({ title: 'Clear the plan', body: '<p>Every action in the plan is removed. Undo brings them back.</p>', confirmText: 'Clear', cancelText: 'Cancel' })) return;
      mutate(() => { plan = blankPlan(); });
      setState({ selected: '' }); rerender();
    });

    // ── builder: the tree ─────────────────────────────────────────────────────────
    el.querySelectorAll('[data-step]').forEach(node => {
      const open = () => { setState({ selected: node.dataset.step }); rerender(); };
      node.addEventListener('click', e => { if (!e.target.closest('button')) open(); });
      node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
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

    // ── builder: the editor ───────────────────────────────────────────────────────
    const form = el.querySelector('[data-editor]');
    if (form) {
      const step = locate(form.dataset.editor)?.step;
      const write = (name, value) => {
        if (!step) return;
        if (name === '__name') step.name = value; else step.values[name] = value;
        save(); refreshOutput();
      };
      // The token bar inserts at the caret of whichever field was last focused, so it has to
      // remember one — a click on a chip has already moved focus off the field by then.
      form.addEventListener('focusin', e => {
        if (e.target.matches('input[data-field], textarea[data-field], input[data-cell]')) lastField = e.target;
      });
      el.querySelectorAll('[data-token]').forEach(b => b.addEventListener('click', () => {
        if (!lastField || !form.contains(lastField)) { toast('Put the cursor in a field first', ''); return; }
        const token = b.dataset.token;
        const start = lastField.selectionStart ?? lastField.value.length;
        const end = lastField.selectionEnd ?? start;
        lastField.value = lastField.value.slice(0, start) + token + lastField.value.slice(end);
        lastField.focus();
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
          // The variable TYPE changes how its value is read, and a Switch's cases add branches
          // to the tree — both change the structure, so both re-render.
          if (input.tagName === 'SELECT' && input.dataset.field === 'type') rerender();
        });
      });

      bindSamplers(form, write);

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

  /* ── keyboard ───────────────────────────────────────────────────────────────────── */
  function onKeydown(e) {
    if (!root?.isConnected) return;
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    const key = e.key.toLowerCase();
    if (key === 'z' && !e.shiftKey) { if (undo()) { e.preventDefault(); rerender(); } }
    else if ((key === 'z' && e.shiftKey) || key === 'y') { if (redo()) { e.preventDefault(); rerender(); } }
  }

  return {
    mount(el) {
      plan = load() || blankPlan();
      history.past.length = 0; history.future.length = 0;
      document.removeEventListener('keydown', onKeydown);
      document.addEventListener('keydown', onKeydown);
      render(el);
    },
    // Exposed for tests and for a surface that wants to seed a plan.
    getPlan: () => plan,
    setPlan: next => { mutate(() => { plan = { ...blankPlan(), ...next }; }); if (root) rerender(); }
  };
}
