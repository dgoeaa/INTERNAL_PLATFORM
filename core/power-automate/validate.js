// Pre-flight validation.
//
// The point of this file is WHERE the failure surfaces. Everything it checks would
// otherwise be caught by the designer or by the workflow service — but late, and with a
// message that names neither the action nor the field. An unclosed `@{`, a reference to an
// action that was renamed, a variable that was never initialised: each of those fails on
// save, after the paste, with the operator holding a flow they now have to unpick.
//
// Three severities. `error` blocks generation. `warning` is very likely wrong but is
// legitimate in some flows — a reference to an action that exists elsewhere in the target
// flow, for instance, is exactly what you want when pasting a fragment into a bigger flow.
// `note` is something true the operator should know before pasting.

import { actionById, isContainer } from './catalog.js';
import { walk, planMode } from './assemble.js';
import { interpolationErrors, hasInterpolation, isWholeExpression } from './expressions.js';
import { ActionNamePolicy, DesignerBrowserSupport } from '../../config/power-automate.config.js';

const issue = (severity, message, where = '') => ({ severity, message, where });

/** Every string value inside a step's answers, flattened for expression scanning. */
function stringValues(values) {
  const out = [];
  const visit = v => {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v === 'object') Object.values(v).forEach(visit);
  };
  visit(values);
  return out;
}

/** Names referenced by outputs('X') / body('X') / actions('X') across the plan. */
function referencedActions(text) {
  const out = new Set();
  for (const m of String(text).matchAll(/\b(?:outputs|body|actions|actionOutputs)\(\s*'([^']+)'\s*\)/g)) out.add(m[1]);
  return out;
}

/** Names referenced by variables('X'). */
function referencedVariables(text) {
  const out = new Set();
  for (const m of String(text).matchAll(/\bvariables\(\s*'([^']+)'\s*\)/g)) out.add(m[1]);
  return out;
}

export function validatePlan(plan) {
  const issues = [];
  const steps = plan?.steps || [];
  if (!steps.length) return [issue('error', 'Nothing to generate — add at least one action.')];

  const declaredNames = new Set();
  const declaredVariables = new Set();
  const usedActions = new Map();   // referenced name -> first place it was referenced
  const usedVariables = new Map();
  const connectorsUsed = new Set();
  let hasTopLevelOnlyNested = false;

  walk(steps, (step, action, depth, ancestors) => {
    const label = step.name || action?.label || step.actionId;
    if (!action) { issues.push(issue('error', `Unknown action type "${step.actionId}".`, label)); return; }

    // ── name legality and uniqueness (only names the operator typed) ────────────────
    if (step.name) {
      if (ActionNamePolicy.forbiddenPattern.test(step.name)) {
        issues.push(issue('error', `Name contains a character the workflow service rejects (${ActionNamePolicy.forbidden.join(' ')}).`, label));
      }
      if (step.name.length > ActionNamePolicy.maxLength) {
        issues.push(issue('error', `Name is longer than ${ActionNamePolicy.maxLength} characters.`, label));
      }
      const key = ActionNamePolicy.toKey(step.name);
      if (declaredNames.has(key)) {
        issues.push(issue('error', 'Two actions have this name. Action names must be unique across the whole flow, including inside branches.', label));
      }
      declaredNames.add(key);
    }

    // ── nesting rules ──────────────────────────────────────────────────────────────
    if (action.topLevelOnly && depth > 0) {
      hasTopLevelOnlyNested = true;
      issues.push(issue('error', `"${action.label}" must sit at the top level of the flow — the workflow service rejects it inside a scope, condition or loop.`, label));
    }

    // ── required fields ────────────────────────────────────────────────────────────
    for (const fd of action.fields || []) {
      const v = step.values?.[fd.name];
      const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
      if (fd.required && empty) {
        // A condition supplied as raw JSON satisfies the rows requirement.
        if (action.id === 'condition' && fd.name === 'rows' && step.values?.raw) continue;
        issues.push(issue('error', `"${fd.label}" is required.`, label));
      }
      if (fd.kind === 'json' && typeof v === 'string' && v.trim() && !/^@/.test(v.trim())) {
        try { JSON.parse(v); }
        catch (e) { issues.push(issue('error', `"${fd.label}" is not valid JSON — ${e.message}`, label)); }
      }
      // A field that consumes an array or an object needs the value ITSELF, which means a
      // whole-value expression. `@{body('X')}` interpolates, and interpolation coerces to
      // string — so the action receives "[object Object]" or a JSON blob and fails at run
      // time with a type error that names neither this field nor the missing @.
      if (fd.wholeValue && typeof v === 'string' && hasInterpolation(v) && !isWholeExpression(v)) {
        issues.push(issue('warning',
          `"${fd.label}" uses @{…}, which turns the value into text. This field needs the value itself — drop the braces: @body('X') rather than @{body('X')}.`, label));
      }
    }

    // ── expression health ──────────────────────────────────────────────────────────
    for (const s of stringValues(step.values)) {
      for (const err of interpolationErrors(s, 'expression')) issues.push(issue('error', err, label));
      referencedActions(s).forEach(n => { if (!usedActions.has(n)) usedActions.set(n, label); });
      referencedVariables(s).forEach(n => { if (!usedVariables.has(n)) usedVariables.set(n, label); });
    }

    // ── per-action rules ───────────────────────────────────────────────────────────
    if (action.id === 'initVariable' && step.values?.name) {
      if (declaredVariables.has(step.values.name)) {
        issues.push(issue('error', `Variable "${step.values.name}" is initialised twice. A workflow may declare each variable once.`, label));
      }
      declaredVariables.add(step.values.name);
    }
    // A run answers its caller once. A Response inside a loop sends on the first iteration
    // and fails on the second — and the failure is attributed to the loop, not to this action.
    if (action.id === 'response' && ancestors.some(a => a?.id === 'foreach' || a?.id === 'until')) {
      issues.push(issue('warning', 'A Response inside a loop runs more than once, but a flow can answer its caller only once — the second iteration fails. Move it after the loop.', label));
    }
    if (action.dynamicCases) {
      const cases = step.values?.cases || [];
      const seen = new Set();
      for (const c of cases) {
        const val = String(c?.value ?? '');
        if (seen.has(val)) issues.push(issue('error', `Two cases both match "${val}". Case values must be distinct.`, label));
        seen.add(val);
        const branch = step.branches?.[`case:${c?.name ?? c?.value}`] || [];
        if (!branch.length) issues.push(issue('warning', `Case "${c?.name || val}" has no actions — it will match and then do nothing.`, label));
      }
    }
    if (isContainer(action) && !action.dynamicCases) {
      const primary = step.branches?.[action.branches[0].key] || [];
      if (!primary.length) issues.push(issue('warning', `"${action.branches[0].label}" is empty.`, label));
    }
    if (action.connector) connectorsUsed.add(action.connector);
  });

  // ── cross-references ─────────────────────────────────────────────────────────────
  // Names the plan itself defines: explicit names plus the auto-derived label keys.
  const known = new Set(declaredNames);
  walk(steps, (step, action) => { known.add(ActionNamePolicy.toKey(step.name || action?.label || '')); });
  for (const [ref, where] of usedActions) {
    if (!known.has(ActionNamePolicy.toKey(ref))) {
      issues.push(issue('warning', `References an action named "${ref}", which is not in this set. That is correct only if the action already exists in the flow you are pasting into.`, where));
    }
  }
  for (const [ref, where] of usedVariables) {
    if (!declaredVariables.has(ref)) {
      issues.push(issue('warning', `Uses variable "${ref}" without initialising it here. The flow must already declare it, or the run fails.`, where));
    }
  }

  // ── delivery notes ───────────────────────────────────────────────────────────────
  const mode = planMode(plan);
  if (mode === 'scope') {
    issues.push(issue('note', 'These actions paste as one Scope, because a single paste can only carry one root action. Delete the Scope afterwards if you do not want the grouping — the designer keeps its contents.'));
  }
  if (mode === 'sequence' && !hasTopLevelOnlyNested) {
    issues.push(issue('note', 'This set pastes in parts. "Initialize variable" cannot live inside a Scope, so the actions cannot be wrapped into one paste — paste each part in the order shown.'));
  }
  if (connectorsUsed.size) {
    issues.push(issue('note', 'Connector actions paste without a connection bound — the generator has no access to your tenant’s connection ids. Pick the connection on each connector action after pasting.'));
  }
  issues.push(issue('note', `Paste works in ${DesignerBrowserSupport.supported.join(' and ')}. ${DesignerBrowserSupport.unsupportedReason}`));

  return issues;
}

export const errorsOf = issues => issues.filter(i => i.severity === 'error');
export const warningsOf = issues => issues.filter(i => i.severity === 'warning');
export const notesOf = issues => issues.filter(i => i.severity === 'note');
export const canGenerate = issues => errorsOf(issues).length === 0;
