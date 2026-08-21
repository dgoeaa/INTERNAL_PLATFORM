// Turning a plan into a workflow definition.
//
// A plan is what the studio screen edits:
//
//   Step = { id, actionId, name?, values, runAfterStatuses?, branches?: { key: Step[] } }
//
// This module owns the two things that are properties of the PLAN rather than of any single
// action — the name each action gets, and the `runAfter` graph that orders them. The catalog
// deliberately knows neither.
//
// Two constraints drive the shape of what comes out:
//
//   NAMES ARE GLOBALLY UNIQUE. An action's name is its JSON key, and the workflow service
//   requires uniqueness across the WHOLE definition, not per branch. A "Compose" inside the
//   yes-branch and another inside the no-branch collide, so naming runs through one registry
//   for the entire fragment.
//
//   ORDER IS NOT ALWAYS A CHAIN. Sibling steps chain by default, but error handling needs a
//   fork: the success response and the failure response both run after the same action, on
//   different statuses. `runAfterRef` names an earlier sibling to run after instead of the
//   previous one, which is how a step becomes a parallel branch rather than a link.
//
//   INITIALIZE VARIABLE CANNOT BE NESTED. The service rejects an InitializeVariable that is
//   not at the root of the workflow. That matters here because pasting more than one action
//   at once requires wrapping them in a Scope — which would nest them. So a plan that mixes
//   variable declarations with other steps cannot be a single paste, and planMode() says so
//   instead of emitting a definition that fails on save.

import { actionById, isContainer } from './catalog.js';
import { ActionNamePolicy } from '../../config/power-automate.config.js';

/** Sanitise a label into a legal, unique action name, registering it as taken. */
function uniqueName(preferred, taken) {
  let base = ActionNamePolicy.toKey(preferred) || 'Action';
  if (!base) base = 'Action';
  let name = base, n = 1;
  while (taken.has(name)) {
    n += 1;
    const suffix = `_${n}`;
    name = base.slice(0, ActionNamePolicy.maxLength - suffix.length) + suffix;
  }
  taken.add(name);
  return name;
}

/** The name a step will carry: its own if given, otherwise its action's label. */
function nameFor(step, taken) {
  const action = actionById(step.actionId);
  return uniqueName(step.name || action?.label || 'Action', taken);
}

/**
 * Assemble one sibling list into an `actions` map.
 *
 * `runAfter` chains each step to the one before it. The first has `{}` — inside a branch
 * that means "run first in this branch"; at the root of a pasted fragment the designer
 * overwrites it anyway when it splices the node into the graph.
 */
function assembleSiblings(steps, taken, errors, depth) {
  const actions = {};
  let previous = null;
  for (const step of steps || []) {
    const action = actionById(step.actionId);
    if (!action) { errors.push(`Unknown action "${step.actionId}".`); continue; }

    const name = step.__name || nameFor(step, taken);
    step.__name = name;

    const ctx = {
      branch: key => assembleSiblings(step.branches?.[key] || [], taken, errors, depth + 1),
      cases: () => {
        const out = {};
        for (const c of step.values?.cases || []) {
          const caseName = ActionNamePolicy.toKey(c?.name || c?.value || 'Case');
          if (!caseName) continue;
          out[caseName] = {
            case: c?.value ?? c?.name ?? '',
            actions: assembleSiblings(step.branches?.[`case:${c?.name ?? c?.value}`] || [], taken, errors, depth + 1)
          };
        }
        return out;
      }
    };

    let definition;
    try {
      definition = action.build(step.values || {}, ctx);
    } catch (e) {
      errors.push(`${name}: ${e.message}`);
      continue;
    }

    // An explicit ref forks off an earlier sibling; otherwise this step links to the one
    // before it. A ref that names a later step, or one outside this list, is ignored rather
    // than emitted — a runAfter pointing at an action the service cannot see fails the save.
    const refName = step.runAfterRef
      ? (steps.slice(0, steps.indexOf(step)).find(s => s.id === step.runAfterRef) || {}).__name
      : null;
    const after = refName || previous;
    definition.runAfter = after
      ? { [after]: (step.runAfterStatuses?.length ? step.runAfterStatuses : ['Succeeded']) }
      : {};
    if (step.description) definition.description = String(step.description);

    actions[name] = definition;
    // A forked step is a branch off the main line, so the next sibling continues from where
    // the fork left, not from the fork.
    if (!refName) previous = name;
  }
  return actions;
}

/** The statuses a runAfter edge can wait on, in the order the designer lists them. */
export const RunAfterStatuses = Object.freeze(['Succeeded', 'Failed', 'Skipped', 'TimedOut']);

/** Walk a plan's steps depth-first, yielding {step, action, depth}. */
export function walk(steps, visit, depth = 0) {
  for (const step of steps || []) {
    visit(step, actionById(step.actionId), depth);
    const action = actionById(step.actionId);
    if (isContainer(action) || action?.dynamicCases) {
      for (const list of Object.values(step.branches || {})) walk(list, visit, depth + 1);
    }
  }
}

/**
 * How this plan has to be delivered.
 *
 *   'single'   — one top-level step. Pastes as itself, no wrapper.
 *   'scope'    — several steps, wrapped in a Scope so one paste carries them all.
 *   'sequence' — several steps, at least one of which cannot be nested (Initialize
 *                variable). Delivered as one payload per top-level step, pasted in order.
 *   'empty'    — nothing to generate.
 */
export function planMode(plan) {
  const steps = plan?.steps || [];
  if (!steps.length) return 'empty';
  if (steps.length === 1) return 'single';
  const blocksNesting = steps.some(s => actionById(s.actionId)?.topLevelOnly);
  return blocksNesting ? 'sequence' : 'scope';
}

/**
 * Build the definition(s) for a plan.
 *
 * Returns one entry per paste the operator will perform. Each carries the root action name
 * and the action definition to hand the designer. `mode` explains why there is one entry or
 * several, so the screen can say it out loud rather than silently producing three buttons.
 */
export function buildFragments(plan) {
  const errors = [];
  const mode = planMode(plan);
  const steps = plan?.steps || [];
  if (mode === 'empty') return { mode, fragments: [], errors, names: [] };

  const taken = new Set();
  // Name every step up front, in document order, so names stay stable regardless of which
  // fragment a step lands in and so nested steps cannot claim a top-level step's name.
  walk(steps, step => { step.__name = nameFor(step, taken); });

  if (mode === 'sequence') {
    const fragments = steps.map(step => {
      const built = assembleSiblings([step], taken, errors, 0);
      const name = step.__name;
      return { name, definition: built[name], root: 'action' };
    }).filter(x => x.definition);
    return { mode, fragments, errors, names: [...taken] };
  }

  if (mode === 'single') {
    const built = assembleSiblings(steps, taken, errors, 0);
    const name = steps[0].__name;
    return { mode, fragments: built[name] ? [{ name, definition: built[name], root: 'action' }] : [], errors, names: [...taken] };
  }

  // 'scope' — wrap the whole set so the designer receives it in one paste.
  const scopeName = uniqueName(plan.name || 'Generated actions', taken);
  const built = assembleSiblings(steps, taken, errors, 1);
  return {
    mode,
    fragments: [{ name: scopeName, definition: { type: 'Scope', actions: built, runAfter: {} }, root: 'scope' }],
    errors,
    names: [...taken]
  };
}

/**
 * The full `actions` object as it would appear in a workflow definition — what code view
 * shows. This is the second output the studio offers: not everything can be pasted (a
 * trigger cannot), and for those cases the definition JSON is the delivery route.
 */
export function buildActionsMap(plan) {
  const errors = [];
  const steps = plan?.steps || [];
  const taken = new Set();
  walk(steps, step => { step.__name = nameFor(step, taken); });
  const actions = assembleSiblings(steps, taken, errors, 0);
  return { actions, errors, names: [...taken] };
}
