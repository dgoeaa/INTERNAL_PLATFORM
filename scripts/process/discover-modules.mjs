/* Discovery, part 3 — the operator estate.
 *
 * A workspace module is not a graph the way a flow is, so its steps cannot be walked
 * mechanically end to end. What the source DOES state, unambiguously, is every governed
 * write: the call site names the module, the action, the confirmation the operator is shown,
 * the audit vocabulary written, and whether a backend call is attempted. Those are the
 * steps this module emits. Everything between them — rendering, filtering, paging — is
 * presentation and is recorded as such rather than dressed up as process.
 */
import { EV, VALIDATION, compact } from './lib.mjs';

/* Governed writes: executeOwnedAction(module, action, fn, meta). */
const OWNED = /executeOwnedAction\(\s*'([a-z][a-z-]*)'\s*,\s*'([a-z][a-z0-9-]*)'/g;
/* State writes that declare their module and audit vocabulary. */
const PATCH = /module:\s*'([a-z][a-z-]*)'\s*,\s*action:\s*'([a-zA-Z0-9:._-]+)'/g;
/* Operator confirmations — the human control point before an irreversible write. */
const CONFIRM = /confirmAction\(\{\s*title:\s*'([^']+)'/g;
/* Backend calls by endpoint alias. */
const INVOKE = /invoke\(\s*'([A-Z][A-Z0-9_]*)'/g;
/* Audit vocabulary written into the ledger. */
const AUDIT = /\baudit\(\s*'([^']+)'\s*,\s*'([^']+)'/g;
/* Operator-visible outcome messages. */
const TOAST = /toast\(\s*'([^']{3,120})'\s*(?:,\s*'(success|error|info|warn)')?\s*\)/g;
/* Handoffs to another workspace. */
const HANDOFF = /location\.hash\s*=\s*'#\/([a-z-]+)'/g;

export function discoverModuleSteps(X, ID, { route, path, srcId, ownerProc, ownership }) {
  const { out, R } = X;
  const t = R(path);
  /* Every distinct capture tuple the pattern finds, de-duplicated by value so a control
     bound twice in one module is one step, not two. */
  const grab = (re) => {
    const seen = new Map(); let m;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(t))) {
      const groups = m.slice(1).map(x => (x === undefined ? '' : x));
      const k = JSON.stringify(groups);
      if (!seen.has(k)) seen.set(k, groups);
    }
    return [...seen.values()];
  };

  const owned = grab(OWNED).filter(([mod]) => mod === route);
  const patches = grab(PATCH).filter(([mod]) => mod === route);
  const confirms = grab(CONFIRM).map(x => x[0]);
  const invokes = grab(INVOKE).map(x => x[0]);
  const audits = grab(AUDIT);
  const toasts = grab(TOAST);
  const handoffs = grab(HANDOFF).map(x => x[0]).filter(r => r !== route);

  let seq = 0;
  const ids = [];
  for (const [, action] of owned) {
    const own = ownership[action];
    const id = ID('STEP'); ids.push(id); seq += 1;
    out.steps.push(compact({
      id,
      name: own?.label ? `${own.label.charAt(0).toUpperCase()}${own.label.slice(1)}` : action.replace(/-/g, ' '),
      rawName: action, process: ownerProc, sequence: seq, nesting: 0,
      container: `modules/${route}.js`,
      description: `Governed write '${action}' performed from the ${route} workspace.`,
      responsible: own ? `${own.owner} workspace` : `${route} workspace`,
      responsibleKind: 'Manual — operator-initiated',
      trigger: 'An operator activates the control that raises this action.',
      preconditions: [
        own && own.owner !== route
          ? `${route} is a declared allowed invoker; ownership of the action rests with ${own.owner}.`
          : 'The action is owned by this workspace.',
        'The operator reaches the route, which canAccess() gates on their role.',
      ],
      requiredInputs: ['The record the operator has selected, and any values captured by the form attached to the control.'],
      actionPerformed: own?.service ? `Calls ${own.service}.` : 'Performs the governed write declared for this action.',
      rules: own ? [
        `Ownership: ${own.owner}${own.allowedInvokers?.length ? `; allowed invokers ${own.allowedInvokers.join(', ')}` : ''}.`,
        own.backend ? `Backend: ${own.backend}.` : null,
      ].filter(Boolean) : undefined,
      systemResponse: own?.backend?.endsWith('.required')
        ? `A backend call on ${own.backend.split('.')[0]} must succeed; the write is not simulated locally when it fails.`
        : own?.backend?.endsWith('.optional')
          ? `A backend call on ${own.backend.split('.')[0]} is attempted; the local record stands when it fails and synchronisation is queued.`
          : 'Not evidenced for this action.',
      output: 'An updated record in application state.',
      auditEvent: own?.audit,
      controls: ['Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of.'],
      dependencies: own?.backend ? [own.backend.split('.')[0]] : undefined,
      evidence: own ? EV.CONFIRMED : EV.PARTIAL,
      evidenceNote: own
        ? 'The call site names the module and the action; the governance table states the owner, the service, the audit vocabulary and the backend requirement.'
        : 'The call site names the module and the action, but the governance table carries no record for it, so owner, service and audit vocabulary are unestablished.',
      businessMeaning: own?.label ? `Stated by the governance table as: ${own.label}.` : 'Not evidenced.',
      validationStatus: VALIDATION.NONE,
      source: [srcId, ...(own ? [own.srcId] : [])],
    }));

    if (own?.audit) {
      out.monitoring.push(compact({
        id: ID('MON'), name: `Audit event ${own.audit}`, process: ownerProc, step: id,
        kind: 'Audit event',
        description: `The governance table binds action '${action}' to the audit vocabulary '${own.audit}'.`,
        recordedWhere: 'The in-application audit ledger.',
        evidence: EV.CONFIRMED,
        evidenceNote: 'Read from the per-action governance record.',
        source: [own.srcId],
      }));
    }
  }

  for (const title of confirms) {
    out.controls.push(compact({
      id: ID('CTRL'), name: `Operator confirmation — ${title}`, type: 'Confirmation control',
      process: ownerProc,
      description: 'The operator is shown what is about to happen and must confirm before the write is attempted.',
      trigger: 'The operator activates the control this dialog guards.',
      condition: 'Confirmation is given.',
      expectedBehaviour: 'The governed write proceeds.',
      outcome: 'Declining returns to the workspace with nothing written.',
      exception: 'Not evidenced beyond the decline path.',
      affectedProcess: ownerProc,
      evidence: EV.CONFIRMED,
      evidenceNote: 'The dialog title is a string literal at the call site.',
      source: [srcId],
    }));
  }

  for (const alias of invokes) {
    out.dependencies.push(compact({
      id: ID('DEP'), dependentProcess: ownerProc,
      supporting: `Endpoint alias ${alias}`, supportingKind: 'Integration',
      type: 'Runtime integration call',
      direction: 'Outbound - the workspace calls the endpoint',
      mandatory: 'Not determinable from the call site alone; the governance table states per action whether the backend is required or optional.',
      activationCondition: 'The governed write this call accompanies is performed.',
      operationalPurpose: 'Carries the write through to the system of record.',
      impactIfUnavailable: 'The call fails. Whether the operator write survives depends on whether the action declares the backend required or optional.',
      documentedWorkaround: 'Where the backend is optional, the record is kept locally and synchronisation is queued.',
      evidence: EV.CONFIRMED,
      evidenceNote: 'The endpoint alias is a string literal at the invoke() call site in this module.',
      source: [srcId],
    }));
  }

  for (const [msg, tone] of toasts) {
    if (!tone) continue;
    out.notifications.push(compact({
      id: ID('NOTIF'), name: msg, process: ownerProc,
      channel: 'In-application message to the operator',
      kind: tone === 'error' ? 'Failure notice' : tone === 'success' ? 'Completion notice' : 'Informational notice',
      trigger: 'Raised at the point in the module where the outcome is known.',
      failureBehaviour: 'Not applicable: the notice is rendered in the operator session itself.',
      evidence: EV.CONFIRMED,
      evidenceNote: 'The message text and its tone are string literals at the call site.',
      source: [srcId],
    }));
  }

  for (const to of handoffs) {
    out.dependencies.push(compact({
      id: ID('DEP'), dependentProcess: ownerProc,
      supporting: `Workspace ${to}`, supportingKind: 'Process',
      type: 'Process handoff',
      direction: 'Downstream - this workspace sends the operator and the selected record on',
      mandatory: 'Optional: the handoff is taken only on the path that navigates.',
      activationCondition: 'The operator takes the action that navigates to the other workspace.',
      operationalPurpose: 'The receiving workspace owns the step that follows.',
      impactIfUnavailable: 'The operator cannot complete the onward step from here; the record stays in its current state.',
      evidence: EV.CONFIRMED,
      evidenceNote: 'The destination route is a string literal assigned to location.hash in this module.',
      source: [srcId],
    }));
  }

  return {
    governedActions: owned.map(x => x[1]),
    audits: audits.map(a => a[0]),
    invokes, handoffs,
    confirmCount: confirms.length,
    toastCount: toasts.length,
    patches: patches.map(p => p[1]),
  };
}
