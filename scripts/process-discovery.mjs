#!/usr/bin/env node
/**
 * Process discovery — build the master process inventory from evidence, not from memory.
 *
 *   node scripts/process-discovery.mjs             # write docs/reference/process-inventory.json
 *   node scripts/process-discovery.mjs --check     # fail if the written file is stale
 *
 * Every entry carries the artifact it was read from (SRC-nnn) and one of the seven evidence
 * classes. A statement is CONFIRMED only when an artifact states it directly. Anything
 * derived by reasoning across two artifacts is INFERRED and says so. Where this standard
 * asks for a field no supplied artifact carries, the field is left out of the record and the
 * absence is raised in the gap register rather than filled with a plausible-sounding value.
 *
 * This script records what the evidence shows EXISTS and how it is wired. It does not decide
 * whether a process WORKS: operational status comes from run records and is carried in a
 * separate field so the two are never confused.
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { EV, AUTOMATION, DOCSTATUS, VALIDATION, COV, OWNERSHIP_TYPES, EV_DEFINITIONS, minter, compact, internPhrases } from './process/lib.mjs';
import { makeContext, discoverSystems, discoverModules, discoverRoles } from './process/discover-core.mjs';
import { discoverFlowSteps } from './process/discover-flows.mjs';
import { discoverModuleSteps } from './process/discover-modules.mjs';

const ROOT = process.cwd();
const X = makeContext(ROOT);
const { out, SRC, R, J, has, ls } = X;
const ID = minter({ STEP: 4, TRC: 4 });

out.evidenceFramework = EV_DEFINITIONS.map(([name, definition, confidence]) => ({ name, definition, confidence }));
out.coverageStatuses = Object.values(COV);
out.ownershipTypes = OWNERSHIP_TYPES;

/* Gap records carry the full fifteen-field structure the standard asks for. */
const gap = (o) => out.gaps.push(compact({
  id: ID('GAP'),
  affectedSystem: o.system || 'Both platforms',
  affectedModule: o.module,
  affectedProcess: o.process,
  affectedStep: o.step,
  subject: o.subject,
  missingInformation: o.missing,
  availableEvidence: o.available,
  evidence: o.evidence || EV.UNAVAILABLE,
  reasonRequired: o.reason,
  impactOfAbsence: o.impact,
  operationalRisk: o.risk,
  requiredAuthoritativeSource: o.authority,
  requiredOwner: o.owner,
  ownershipTypeMissing: o.ownershipType,
  validationPriority: o.priority || 'Medium',
  resolutionCriteria: o.resolution,
  currentStatus: o.status || 'Open',
  source: o.source || [],
}));

const coverage = (area, status, note, srcs, procs) => out.coverage.push(compact({
  id: ID('COV'), area, status, note, processesIdentified: procs, source: srcs,
}));

/* ═════════════ 1. Systems, modules, roles ═════════════ */
discoverSystems(X, ID);
discoverModules(X, ID);
discoverRoles(X, ID);

/* ═════════════ 2. Per-action governance — the ownership table ═════════════ */
const ownership = {};
{
  const p = 'config/action-ownership.config.js';
  if (has(p)) {
    const s = SRC(p), t = R(p);
    const blk = (t.match(/ActionOwnership\s*=\s*Object\.freeze\(\{([\s\S]*)\n\}\);/) || [])[1] || t;
    for (const m of blk.matchAll(/(?:^|\n)\s*'?([a-zA-Z][a-zA-Z0-9-]*)'?\s*:\s*\{([^}]*)\}/g)) {
      const body = m[2];
      const f = k => (body.match(new RegExp(`\\b${k}:\\s*'([^']*)'`)) || [])[1];
      const arr = k => ((body.match(new RegExp(`\\b${k}:\\s*\\[([^\\]]*)\\]`)) || [])[1] || '').match(/'([^']+)'/g)?.map(x => x.slice(1, -1)) || [];
      const owner = f('owner');
      if (!owner) continue;
      ownership[m[1]] = {
        action: m[1], owner, label: f('label'), service: f('service'),
        audit: f('audit'), backend: f('backend'), allowedInvokers: arr('allowedInvokers'), srcId: s,
      };
    }
  }
}

/* ═════════════ 3. Workspace processes ═════════════ */
const procByKey = {};
{
  const p = 'config/workflow-clarity.config.js', s = SRC(p), t = R(p);
  for (const b of t.match(/\{\s*"id".*?\n {2}\}/gs) || []) {
    const f = k => (b.match(new RegExp(`"${k}":\\s*"((?:[^"\\\\]|\\\\.)*)"`)) || [])[1];
    const arr = k => { const m = b.match(new RegExp(`"${k}":\\s*\\[([^\\]]*)\\]`, 's')); return m ? (m[1].match(/"([^"]+)"/g) || []).map(x => x.slice(1, -1)) : []; };
    const key = f('id');
    if (!key) continue;
    const route = f('route'), modPath = `modules/${route}.js`;
    const mod = out.modules.find(x => x.route === route);
    const acts = Object.values(ownership).filter(a => a.owner === route);
    const invokerOf = Object.values(ownership).filter(a => (a.allowedInvokers || []).includes(route));
    const rolesWithAccess = out.roles
      .filter(r => r.type === 'Role' && (r.routeAccess?.includes('all routes') || r.routeAccess?.includes(route)))
      .map(r => r.name);
    const id = ID('PROC');
    procByKey[route] = id;
    /* HiddenTechnicalRoutes names its parent by the workspace LABEL, not by the route, so the
       label has to be resolvable too or every hidden route ends up an orphan subprocess. */
    procByKey[f('label')] = id;
    out.processes.push(compact({
      id, key, name: f('label'),
      altName: `Route '${route}'`,
      category: 'User-initiated · operational',
      description: f('purpose'),
      businessPurpose: f('purpose'),
      operationalPurpose: mod?.boundaryRole
        ? `Boundary role '${mod.boundaryRole}'. Owns ${(mod.features || []).join(', ') || 'no declared feature'}; must not own ${(mod.mustNotOwn || []).join(', ') || 'nothing declared'}.`
        : undefined,
      parentProcess: 'None. This is a primary workspace reached from the sidebar.',
      relatedSubprocesses: acts.map(a => a.action),
      owner: acts.length ? `The ${route} module, per the per-action governance table.` : undefined,
      participatingRoles: rolesWithAccess,
      supportingSystems: ['DGO Internal Platform', ...(acts.some(a => a.backend) ? ['Microsoft Power Automate'] : [])],
      relatedModules: [modPath],
      relatedFeatures: mod?.features,
      group: f('group'), route,
      owns: arr('owns'), handoffs: arr('handoffs'),
      initiatingEvent: 'An operator opens the route from the sidebar, or another workspace hands them the record.',
      completionEvent: acts.length
        ? `The operator completes one of its governed writes: ${acts.map(a => a.action).join(', ')}.`
        : 'Not evidenced. This workspace declares no governed write of its own, so it has no completion event beyond leaving it.',
      primaryOutput: acts.length ? 'An updated record and an audit entry.' : 'A view over records already held.',
      automationLevel: acts.some(a => a.backend) ? AUTOMATION.PARTIAL : AUTOMATION.MANUAL,
      criticality: 'Not evidenced. No supplied artifact grades a workspace by criticality.',
      evidence: has(modPath) && mod?.boundaryRole ? EV.CONFIRMED : has(modPath) ? EV.PARTIAL : EV.UNVERIFIABLE,
      evidenceNote: has(modPath) && mod?.boundaryRole
        ? 'Declared in the workspace configuration, implemented by a module of the same route name, and bounded by the module boundary charter.'
        : has(modPath)
          ? 'Declared in the workspace configuration and implemented by a module of the same route name. No boundary charter entry, so its owned features are not established.'
          : 'Declared in the workspace configuration; no module file of that route name exists, so its steps are not readable from code.',
      documentationStatus: has(modPath) ? DOCSTATUS.PARTIAL : DOCSTATUS.MINIMAL,
      validationStatus: VALIDATION.NONE,
      allowedInvokerOf: invokerOf.map(a => a.action),
      source: [s, ...(has(modPath) ? [SRC(modPath)] : []), ...(mod?.boundaryRole ? [SRC('config/module-boundaries.config.js')] : [])],
    }));
  }

  /* Hidden technical routes are sub-views of a named parent workspace. */
  const hi = t.indexOf('export const HiddenTechnicalRoutes');
  if (hi > -1) {
    const blk = t.slice(hi, t.indexOf('});', hi));
    for (const m of blk.matchAll(/"([a-z-]+)":\s*\{\s*"visibleThrough":\s*"([^"]+)",\s*"reason":\s*"([^"]+)"/g)) {
      const route = m[1], modPath = `modules/${route}.js`;
      const acts = Object.values(ownership).filter(a => a.owner === route);
      const id = ID('SUBPROC');
      procByKey[route] = id;
      out.subprocesses.push(compact({
        id, key: route, name: out.modules.find(x => x.route === route)?.name || route,
        category: 'Sub-view of a primary workspace',
        type: 'Reusable subprocess — a view the parent workspace hands the operator into',
        parentProcess: procByKey[m[2]] || `Workspace '${m[2]}'`,
        parentRoute: m[2],
        rationale: m[3],
        governedActions: acts.map(a => a.action),
        differsFromParent: 'It is not reachable from the sidebar; the parent workspace is the only declared way in.',
        implementation: has(modPath) ? modPath : undefined,
        evidence: has(modPath) ? EV.CONFIRMED : EV.PARTIAL,
        evidenceNote: 'Declared a hidden technical route with a named parent workspace and a stated reason.',
        documentationStatus: DOCSTATUS.PARTIAL,
        validationStatus: VALIDATION.NONE,
        source: [s, ...(has(modPath) ? [SRC(modPath)] : [])],
      }));
    }
  }
}

/* ═════════════ 4. Governed actions as reusable subprocesses ═════════════ */
for (const a of Object.values(ownership)) {
  const parent = procByKey[a.owner];
  out.subprocesses.push(compact({
    id: ID('SUBPROC'), key: a.action,
    name: a.label ? `${a.label.charAt(0).toUpperCase()}${a.label.slice(1)}` : a.action,
    category: 'Reusable governed write',
    type: 'Reusable process component invoked from one or more workspaces',
    parentProcess: parent || `Workspace '${a.owner}' — not a declared workspace`,
    parentRoute: a.owner,
    owner: `The ${a.owner} module.`,
    service: a.service,
    auditVocabulary: a.audit,
    backendRequirement: a.backend,
    allowedInvokers: a.allowedInvokers,
    differsFromParent: a.allowedInvokers?.length
      ? `Invocable from ${a.allowedInvokers.join(', ')} as well as from its owner: one owner, one audit event, whichever channel raises it.`
      : 'Invocable only from its owning workspace.',
    activationCondition: 'An operator activates the control bound to this action.',
    completionCondition: a.backend?.endsWith('.required')
      ? 'The backend call succeeds. A failure is not written locally.'
      : a.backend?.endsWith('.optional')
        ? 'The local record is written; the backend call is attempted and queued for retry when it fails.'
        : 'Not evidenced.',
    evidence: EV.CONFIRMED,
    evidenceNote: 'Owner, service, audit vocabulary, backend requirement and allowed invokers are all stated by the per-action governance table.',
    documentationStatus: DOCSTATUS.COMPLETE,
    validationStatus: VALIDATION.NONE,
    source: [a.srcId],
  }));
  if (!parent) {
    gap({
      system: 'DGO Internal Platform', module: `modules/${a.owner}.js`,
      subject: `Governed action '${a.action}' names an owner route that is not a declared workspace`,
      missing: 'A workspace or hidden-route declaration for the owner route.',
      available: 'The governance table names the owner; the workspace configuration does not list that route.',
      evidence: EV.CONFLICTING,
      reason: 'A subprocess with no parent process cannot be placed in the process hierarchy.',
      impact: 'The action is documented but unplaced; its position in the estate is unestablished.',
      risk: 'An action nobody can reach through the declared navigation may be unreachable in practice, or reachable through a path the navigation model does not describe.',
      authority: 'config/workflow-clarity.config.js or config/action-ownership.config.js, whichever is corrected.',
      ownershipType: 'Product owner',
      resolution: 'The two configurations agree on the owner route.',
      source: [a.srcId],
    });
  }
}

/* ═════════════ 5. Module steps, controls, notifications, handoffs ═════════════ */
for (const mod of out.modules) {
  const ownerProc = procByKey[mod.route] || mod.id;
  discoverModuleSteps(X, ID, {
    route: mod.route, path: `modules/${mod.route}.js`,
    srcId: SRC(`modules/${mod.route}.js`), ownerProc, ownership,
  });
}

/* ═════════════ 6. Published integration contracts ═════════════ */
{
  const p = 'docs/deployment/sharepoint/portal-data-contract.json';
  if (has(p)) {
    const s = SRC(p), c = J(p);
    for (const k of c.contracts) {
      out.integrations.push(compact({
        id: ID('INT'), key: k.key, method: k.method, transport: k.transport,
        purpose: k.purpose,
        category: 'Integration-supported · system process',
        requestFields: (k.request || []).length,
        responseFields: (k.response || []).length,
        requiredRequestFields: (k.request || []).filter(f => f.required).map(f => f.field),
        persistenceTargets: [...new Set((k.request || []).map(f => f.persistence).filter(Boolean))],
        evidence: EV.CONFIRMED,
        evidenceNote: `Declared in the ${c.status} data contract v${c.contractVersion}, whose own precedence note states that where a flow disagrees with it, the flow is wrong.`,
        validationStatus: VALIDATION.NONE,
        source: [s],
      }));
    }
    coverage('Published integration contracts', COV.FULL,
      `All ${c.contracts.length} contracts read field by field from the ${c.status} contract v${c.contractVersion}.`, [s], c.contracts.length);
  }
}

/* ═════════════ 7. Automated processes — the flow estate ═════════════ */
const flowByName = {};
{
  const dir = 'docs/reference/flow-contracts/deployed';
  const pasteDir = 'docs/deployment/sharepoint/flows/designer-paste/correspondence-gateway';
  const pastes = {};
  for (const f of ls(pasteDir).filter(x => x.endsWith('.json'))) pastes[f.split('.')[0]] = `${pasteDir}/${f}`;

  for (const f of ls(dir).filter(x => x.endsWith('.json')).sort()) {
    const p = `${dir}/${f}`, s = SRC(p);
    let d; try { d = J(p); } catch { continue; }
    const def = d?.definition || d?.properties?.definition || {};
    const name = f.split('__')[0].trim();
    const wfId = f.split('__')[1];
    const trigJson = JSON.stringify(def.triggers || {});
    const kind = trigJson.includes('Recurrence') ? 'Scheduled'
      : trigJson.includes('Request') ? 'System-initiated (HTTP request)'
        : /email/i.test(trigJson) ? 'Event-triggered (mailbox)'
          : Object.keys(def.triggers || {}).length ? 'Event-triggered' : 'Unknown';
    const srcIds = [s];
    if (pastes[name]) srcIds.push(SRC(pastes[name]));

    const id = ID('PROC');
    flowByName[name] = id;
    const walked = discoverFlowSteps(X, ID, { name, definition: def, srcIds, ownerProc: id, packageKind: 'export' });

    out.processes.push(compact({
      id, key: name, name,
      altName: d?.workflow_identity?.tags?.flowDisplayName && d.workflow_identity.tags.flowDisplayName !== name
        ? d.workflow_identity.tags.flowDisplayName : undefined,
      category: `Automated · ${kind}`,
      group: 'Flow estate',
      description: `Power Automate workflow carrying ${walked.actionCount} action(s) under ${walked.triggers.length} trigger(s).`,
      businessPurpose: 'Not evidenced. No supplied artifact states what this workflow is for in business terms; its name and its actions are all the export carries.',
      operationalPurpose: walked.connectors.length
        ? `Reads from and writes to ${walked.connectors.join(', ')}.`
        : 'Performs run-scoped computation only; no connector is called.',
      parentProcess: 'None declared. Flow exports carry no parent relationship.',
      relatedSubprocesses: walked.catchScopes,
      owner: 'Not evidenced.',
      participatingRoles: [],
      supportingSystems: ['Microsoft Power Automate', ...walked.connectors],
      relatedModules: [],
      workflowId: wfId,
      triggers: walked.triggers.map(([tn, tv]) => `${tn.replace(/_/g, ' ')} (${tv.type})`),
      initiatingEvent: walked.triggers.length
        ? walked.triggers.map(([tn, tv]) => `${tn.replace(/_/g, ' ')}: ${tv.type}`).join('; ')
        : 'No trigger is declared in this export.',
      completionEvent: walked.responseCount
        ? `A Response action returns to the caller. ${walked.responseCount} response action(s); status codes ${walked.statusCodes.join(', ') || 'set from expressions rather than literals'}.`
        : 'The last action completes. The export declares no response to a caller.',
      primaryOutput: walked.responseCount ? 'An HTTP response to the caller.'
        : walked.connectors.includes('Microsoft SharePoint Online') ? 'Writes to the system of record.'
          : 'Run-scoped values only.',
      automationLevel: kind === 'Scheduled' ? AUTOMATION.SCHEDULED : AUTOMATION.FULL,
      criticality: 'Not evidenced.',
      stepCount: walked.actionCount,
      catchScopes: walked.catchScopes,
      connectors: walked.connectors,
      exportedAtUtc: d?.exportedAtUtc,
      evidence: EV.PARTIAL,
      evidenceNote: 'Every action, run-after condition, branch and connector call is CONFIRMED from the tenant export and catalogued step by step. What the workflow is FOR, who owns it and how critical it is are NOT evidenced: no supplied artifact states them.',
      documentationStatus: DOCSTATUS.PARTIAL,
      validationStatus: VALIDATION.TENANT,
      source: srcIds,
    }));

    if (!walked.catchScopes.length && kind === 'System-initiated (HTTP request)') {
      gap({
        system: 'Microsoft Power Automate', process: id,
        subject: `Request-triggered workflow '${name}' declares no catch scope`,
        missing: 'A declared exception path for the request-triggered run.',
        available: `The export carries ${walked.actionCount} action(s) and no scope whose name marks it a catch or error path.`,
        evidence: EV.CONFIRMED,
        reason: 'A request-triggered flow answers a caller. Without a catch path, an unhandled failure returns the platform default rather than the contracted response.',
        impact: 'A caller receives an uncontracted response shape on failure.',
        risk: 'The calling surface cannot distinguish a business refusal from an infrastructure failure.',
        authority: 'The workflow owner in the tenant.',
        ownershipType: 'Technical owner',
        priority: 'High',
        resolution: 'A catch scope exists and the response on failure matches the published contract.',
        source: srcIds,
      });
    }
  }

  /* Paste packages with no corresponding export are designs, not deployments. */
  for (const [name, path] of Object.entries(pastes)) {
    if (flowByName[name]) continue;
    const s = SRC(path);
    let d; try { d = J(path); } catch { continue; }
    const sv = typeof d.serializedValue === 'string' ? JSON.parse(d.serializedValue) : d.serializedValue;
    const id = ID('PROC');
    flowByName[name] = id;
    const walked = discoverFlowSteps(X, ID, {
      name, definition: { triggers: {}, actions: { [d.nodeId || 'Scope']: sv } },
      srcIds: [s], ownerProc: id, packageKind: 'paste',
    });
    out.processes.push(compact({
      id, key: name, name,
      category: 'Automated · designed; deployment not evidenced among the supplied inputs',
      group: 'Correspondence Gateway',
      description: `Designer paste package carrying ${walked.actionCount} action(s). It is a design artifact: no tenant export of this name is present among the supplied inputs.`,
      businessPurpose: 'Not evidenced.',
      operationalPurpose: walked.connectors.length ? `Reads from and writes to ${walked.connectors.join(', ')}.` : 'Run-scoped computation only.',
      parentProcess: 'None declared.',
      owner: 'Not evidenced.',
      supportingSystems: ['Microsoft Power Automate', ...walked.connectors],
      initiatingEvent: 'Not carried by a paste package: the trigger lives outside the pasted scope.',
      completionEvent: walked.responseCount ? 'A Response action returns to the caller.' : 'The last action in the scope completes.',
      primaryOutput: walked.responseCount ? 'An HTTP response to the caller.' : 'Run-scoped values only.',
      automationLevel: AUTOMATION.FULL,
      criticality: 'Not evidenced.',
      stepCount: walked.actionCount,
      catchScopes: walked.catchScopes,
      connectors: walked.connectors,
      evidence: EV.PARTIAL,
      evidenceNote: 'The action graph is CONFIRMED from the paste package. Whether this design is what runs in the tenant is NOT verifiable from the supplied inputs: no export of this name is present.',
      documentationStatus: DOCSTATUS.PARTIAL,
      validationStatus: VALIDATION.TENANT,
      source: [s],
    }));
    gap({
      system: 'Microsoft Power Automate', process: id,
      subject: `Designed workflow '${name}' has no corresponding tenant export`,
      missing: 'A tenant export confirming the design is what is deployed.',
      available: 'A complete designer paste package carrying the full action graph.',
      evidence: EV.UNVERIFIABLE,
      reason: 'A design and a deployment can differ. Documenting the design as the process would present an unverified claim as fact.',
      impact: 'The documented steps may not be the steps that run.',
      risk: 'Operational decisions taken against this documentation may not match live behaviour.',
      authority: 'A fresh export of the workflow from the tenant.',
      ownershipType: 'Technical owner',
      priority: 'High',
      resolution: 'An export of this workflow is supplied and its action graph matches this package.',
      source: [s],
    });
  }
  if (Object.keys(flowByName).length) {
    coverage('Automated flow estate', COV.PARTIAL,
      'Every action in every supplied export and paste package was walked and catalogued step by step. Business purpose, owner and criticality are unevidenced across the whole estate, so no automated process reaches full documentation from confirmed evidence.',
      [SRC(dir)], Object.keys(flowByName).length);
  }
}

/* ═════════════ 8. Operational status from run records ═════════════ */
{
  const dir = 'docs/deployment/sharepoint/evidence/2026-08-27-endpoint-runs';
  const by = {};
  for (const f of ls(dir).filter(x => x.endsWith('.json'))) {
    const s = SRC(`${dir}/${f}`, { kind: 'Operational run record' });
    let d; try { d = J(`${dir}/${f}`); } catch { continue; }
    const name = f.split('__')[0];
    const o = d.outcome || {}, rr = d.response_record || {};
    (by[name] ||= { runs: [], source: [] }).runs.push({
      outcome: o.flow_outcome, failed: o.failed_action_count,
      sent: rr.status_code_sent, delivered: rr.action_status === 'Succeeded', bodyBytes: rr.body_sent_length,
    });
    by[name].source.push(s);
  }
  for (const [name, v] of Object.entries(by)) {
    const proc = out.processes.find(p => p.key === name || p.name === name);
    const latest = v.runs[v.runs.length - 1];
    const rec = {
      runsObserved: v.runs.length,
      latestOutcome: latest.outcome,
      latestStatusSent: latest.sent,
      deliveryConfirmed: v.runs.some(r => r.delivered && r.bodyBytes > 2),
      operationalEvidence: `${v.runs.length} run record(s) captured 2026-08-27. Records execution outcome only: not availability, not latency, and not business-transaction success.`,
      operationalCaveat: 'No successful business transaction is recorded among these runs. The observed responses are validation, not-found and authorisation rejections.',
    };
    if (proc) {
      Object.assign(proc, rec);
      proc.source = [...new Set([...(proc.source || []), ...v.source])];
    } else {
      const id = ID('PROC');
      out.processes.push(compact({
        id, key: name, name,
        category: 'Automated · system-initiated (HTTP request) — Correspondence Gateway',
        group: 'Correspondence Gateway',
        description: 'Observed only through run records: no export or paste package of this name is present among the supplied inputs.',
        businessPurpose: 'Not evidenced.',
        owner: 'Not evidenced.',
        parentProcess: 'None declared.',
        supportingSystems: ['Microsoft Power Automate'],
        initiatingEvent: 'An HTTP request reaches the endpoint.',
        completionEvent: `A response is returned to the caller; the latest observed was HTTP ${latest.sent}.`,
        primaryOutput: 'An HTTP response to the caller.',
        automationLevel: AUTOMATION.FULL,
        criticality: 'Not evidenced.',
        ...rec,
        evidence: EV.PARTIAL,
        evidenceNote: 'Existence and execution outcome are CONFIRMED from run records. The action graph is not among the supplied inputs, so no step of this process is documented.',
        documentationStatus: DOCSTATUS.MINIMAL,
        validationStatus: VALIDATION.TENANT,
        source: v.source,
      }));
      gap({
        system: 'Microsoft Power Automate', process: id,
        subject: `Workflow '${name}' is evidenced only by run records`,
        missing: 'The workflow definition: its actions, branches, connectors and exception paths.',
        available: `${v.runs.length} run record(s) carrying the outcome and the response status.`,
        evidence: EV.PARTIAL,
        reason: 'A process cannot be documented step by step from an outcome alone.',
        impact: 'Zero steps, decisions, rules or exception paths are documented for a workflow that is demonstrably running.',
        risk: 'A live endpoint with no documented behaviour cannot be supported, changed or audited.',
        authority: 'An export of the workflow from the tenant.',
        ownershipType: 'Technical owner',
        priority: 'High',
        resolution: 'An export is supplied and its action graph is catalogued.',
        source: v.source,
      });
    }
  }
  if (Object.keys(by).length) {
    coverage('Operational execution evidence', COV.PARTIAL,
      'Run records establish that the endpoints execute and what status each returns. They do not establish that any business transaction completed: none of the captured runs carries one.',
      [...new Set(Object.values(by).flatMap(v => v.source))], Object.keys(by).length);
  }
}

/* ═════════════ 9. Lifecycle — the internal state machine ═════════════ */
const statIdByName = {};
{
  const cands = ['core/lifecycle.js', 'dist/dgo-internal-platform/core/lifecycle.js'];
  const p = cands.find(has);
  if (p) {
    const s = SRC(p), t = R(p);
    const blk = (t.match(/LifecycleTransitions\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\);/) || [])[1] || '';
    const map = {};
    for (const m of blk.matchAll(/([a-z_]+)\s*:\s*\[([^\]]*)\]/g)) map[m[1]] = (m[2].match(/'([^']+)'/g) || []).map(x => x.slice(1, -1));
    const all = [...new Set([...Object.keys(map), ...Object.values(map).flat()])].sort();
    const predecessors = {};
    for (const [from, tos] of Object.entries(map)) for (const to of tos) (predecessors[to] ||= []).push(from);

    const gateFn = (t.match(/export function validateGate[\s\S]*?\n\}/) || [])[0] || '';
    const GATES = {
      action_complete: 'Response evidence is required: a response, a summary or a task id.',
      returned: 'A reason is required.',
      approved_with_edit: 'An edit diff is required.',
      no_dispatch: 'A reason is required.',
      closed: 'The closure gate must pass, through the caller-supplied canClose() helper.',
    };
    const EXCEPTION_STATES = new Set(['duplicate', 'rejected', 'on_hold', 'assignment_failed', 'blocked',
      'returned', 'escalated', 'dispatch_failed', 'no_dispatch', 'reassign_requested']);

    for (const st of all) {
      const succ = map[st] || [];
      const id = ID('STAT');
      statIdByName[st] = id;
      const reverse = succ.filter(x => (map[x] || []).includes(st));
      out.statuses.push(compact({
        id, name: st, model: 'Internal correspondence lifecycle',
        kind: EXCEPTION_STATES.has(st) ? 'Exception state' : st === 'reopened_as_new_ref' ? 'Terminal state' : 'Progression state',
        description: `Lifecycle state '${st}'.`,
        entryCondition: predecessors[st]?.length
          ? `Reached from ${predecessors[st].join(', ')} through canTransition().`
          : 'Not the target of any declared transition: this state can only be an origin.',
        permittedActions: succ.length ? succ.map(x => `Transition to '${x}'`) : ['Self-transition only. canTransition() permits nothing else out of this state.'],
        restrictedActions: succ.length
          ? `Any transition to a state other than ${succ.join(', ')}, which canTransition() refuses.`
          : 'Every transition out of this state.',
        responsibleActor: 'Not evidenced. The transition map names states, not the actor permitted to move a record between them.',
        exitCondition: succ.length ? `A caller requests a transition to one of ${succ.join(', ')}.` : 'None declared.',
        entryGate: GATES[st],
        possibleNextStates: succ,
        reversalConditions: reverse.length
          ? `Reversible to ${reverse.join(', ')}: the map declares edges in both directions.`
          : 'No reverse edge is declared in the transition map.',
        timeLimits: 'Not evidenced. The transition map carries no clock; the service-level clocks live in the routing matrix and are not bound to a state here.',
        escalationConditions: succ.includes('escalated')
          ? "Escalation is a declared successor of this state." : 'Not evidenced for this state.',
        relatedNotifications: 'Not evidenced. No notification is bound to a state in the transition map.',
        auditBehaviour: 'Not evidenced in the transition map. Audit vocabulary is bound to governed actions, not to states.',
        isSink: succ.length === 0,
        evidence: EV.CONFIRMED,
        evidenceNote: 'Enumerated in the frozen transition map; its successors are the only transitions the guard permits.',
        validationStatus: VALIDATION.NONE,
        source: [s],
      }));

      if (!succ.length && st !== 'reopened_as_new_ref') {
        gap({
          system: 'DGO Internal Platform', module: 'core/lifecycle.js',
          process: 'Internal correspondence lifecycle',
          subject: `Lifecycle state '${st}' has no declared successor`,
          missing: 'Either an outgoing transition, or a statement that this state is intentionally terminal.',
          available: `'${st}' is the target of a transition from ${(predecessors[st] || []).join(', ') || 'no state'} and declares no outgoing transition.`,
          evidence: EV.CONFIRMED,
          reason: 'A record entering this state cannot lawfully progress or be reopened through the guard.',
          impact: 'Work reaching this state stops there with no evidenced route out.',
          risk: 'Records may be operationally stranded, with no path the software will permit.',
          authority: 'The process owner for the correspondence lifecycle.',
          ownershipType: 'Process owner',
          priority: 'High',
          resolution: 'The transition map declares an outgoing edge, or a written statement records the state as intentionally terminal.',
          source: [s],
        });
      }
    }

    for (const [from, tos] of Object.entries(map)) {
      for (const to of tos) {
        out.transitions.push(compact({
          id: ID('TRAN'), model: 'Internal correspondence lifecycle',
          from, to, fromStatus: statIdByName[from], toStatus: statIdByName[to],
          triggeringAction: 'A caller requests the transition.',
          requiredCondition: GATES[to]
            ? `canTransition('${from}','${to}') permits it AND ${GATES[to]}`
            : `canTransition('${from}','${to}') permits it.`,
          responsible: 'Not evidenced. The guard does not name an actor.',
          systemResponse: GATES[to]
            ? 'The gate is evaluated; a failing gate raises a validation error naming the target status.'
            : 'The transition is permitted and the record moves.',
          exceptionOutcome: GATES[to]
            ? `A missing precondition raises an error and the record stays in '${from}'.`
            : `A transition to any other state is refused by canTransition() and the record stays in '${from}'.`,
          evidence: EV.CONFIRMED,
          evidenceNote: 'Declared edge of the frozen transition map.',
          validationStatus: VALIDATION.NONE,
          source: [s],
        }));
      }
    }

    for (const [st, rule] of Object.entries(GATES)) {
      if (!gateFn.includes(`'${st}'`)) continue;
      out.controls.push(compact({
        id: ID('CTRL'), name: `Entry precondition for '${st}'`, type: 'Status-transition rule',
        description: rule,
        trigger: `A transition into '${st}' is requested.`,
        condition: rule,
        expectedBehaviour: 'The transition completes.',
        outcome: 'A record that satisfies the precondition moves; one that does not, does not.',
        exception: 'A validation error naming the target status is raised and the record stays where it is.',
        affectedProcess: 'Internal correspondence lifecycle',
        affectedStatus: statIdByName[st],
        evidence: EV.CONFIRMED,
        evidenceNote: 'Declared in validateGate(); the transition cannot complete without it.',
        validationStatus: VALIDATION.NONE,
        source: [s],
      }));
    }
    coverage('Correspondence lifecycle state machine', COV.MINOR,
      `All ${all.length} states and every declared transition read from the frozen map. Actor, clock, notification and audit behaviour per state are not carried by the map and are recorded as unevidenced.`,
      [s], 1);
  }
}

/* ═════════════ 10. Public status vocabulary — the second status model ═════════════ */
{
  const p = 'config/status-vocabulary.config.js';
  if (has(p)) {
    const s = SRC(p), t = R(p);
    for (const m of t.matchAll(/\{\s*key:\s*'([^']+)',\s*label:\s*'([^']+)',\s*stage:\s*(\d+),\s*blurb:\s*'([^']+)'/g)) {
      out.statuses.push(compact({
        id: ID('STAT'), name: m[1], label: m[2], model: 'Governed public status vocabulary',
        kind: `Stage ${m[3]} of 4`,
        description: m[4],
        entryCondition: 'Not evidenced in this configuration: the vocabulary declares the states, not the events that enter them.',
        permittedActions: 'Not evidenced.',
        restrictedActions: 'Not evidenced.',
        responsibleActor: 'Not evidenced.',
        exitCondition: 'Not evidenced.',
        possibleNextStates: 'Not declared. This vocabulary is a flat list of seven, not a transition map.',
        reversalConditions: 'Not evidenced.',
        timeLimits: 'Not evidenced.',
        escalationConditions: 'Not evidenced.',
        relatedNotifications: 'Not evidenced.',
        auditBehaviour: 'Not evidenced.',
        evidence: EV.CONFIRMED,
        evidenceNote: 'Key, public label, stage and description read from the governed status vocabulary, which both platforms are declared to share.',
        validationStatus: VALIDATION.NONE,
        source: [s],
      }));
    }
    const mapBlk = (t.match(/InternalStatusToGoverned\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\)/) || [])[1] || '';
    /* The source flags its own disputed edges in the comment above the map, and states the
       alternative reading for each. Both readings belong in the record: the standard forbids
       silently choosing one, and the alternative is evidence, not speculation. */
    const disputeBlk = (t.match(/Two of these edges are readings[\s\S]*?\*\//) || [])[0] || '';
    const flagged = /→\s+\w+/.test(disputeBlk);
    const alternatives = {};
    for (const m of disputeBlk.matchAll(/^\s*\*\s+(\w+) → (\w+)\s+([\s\S]*?)(?=\n\s*\*\s+\w+ → |\n\s*\*\/)/gm)) {
      alternatives[m[1]] = m[3].replace(/\n\s*\*\s+/g, ' ').replace(/\s+/g, ' ').trim();
    }
    for (const m of mapBlk.matchAll(/(\w+):\s*'([^']+)'/g)) {
      const disputed = ['Accepted', 'Archived'].includes(m[1]) && flagged;
      out.transitions.push(compact({
        id: ID('TRAN'), model: 'Internal-to-public status mapping',
        from: `internal '${m[1]}'`, to: `public '${m[2]}'`,
        triggeringAction: 'A public surface renders the status of a record held internally.',
        requiredCondition: 'None. The mapping is total over the five internal values it names.',
        responsible: 'governedStatusLabel(), called by the rendering surface.',
        systemResponse: 'The public label is shown in place of the internal value.',
        exceptionOutcome: 'A status the map does not know is shown verbatim rather than translated.',
        evidence: disputed ? EV.CONFLICTING : EV.CONFIRMED,
        evidenceNote: disputed
          ? 'The mapping is declared, and its own source records this particular edge as a reading rather than a fact, flagged for agency confirmation.'
          : 'Declared edge of the internal-to-public status map.',
        conflictingReading: disputed ? alternatives[m[1]] : undefined,
        conflictAuthorityAssessment: disputed
          ? `Both readings come from the same artifact, so neither is more current than the other and neither can settle the question. The artifact is authoritative for what the software DOES — it is the map the renderer calls — and is explicitly not authoritative for what the status MEANS to the agency, which it defers.`
          : undefined,
        conflictImplementationRelevance: disputed
          ? `Implemented: the declared edge is what governedStatusLabel() returns today. A citizen is already being shown '${m[2]}' for a record the platform holds as '${m[1]}'.`
          : undefined,
        conflictValidationRequired: disputed
          ? 'The registry owner states which reading is intended. If the alternative is intended, the map changes and, for the archived case, a distinct public state is needed.'
          : undefined,
        validationStatus: disputed ? VALIDATION.OWNER : VALIDATION.NONE,
        source: [s],
      }));
      if (disputed) {
        gap({
          system: 'Both platforms', module: 'config/status-vocabulary.config.js',
          process: 'Public status presentation',
          subject: `Internal status '${m[1]}' maps to public '${m[2]}' on a reading, not a decision`,
          missing: 'An agency decision on what this internal status means to a citizen.',
          available: `The mapping is declared, and its own source records the ambiguity and the alternative reading: ${alternatives[m[1]] || 'stated in the source comment above the map'}`,
          evidence: EV.CONFLICTING,
          reason: 'A citizen reading the public label and an officer reading the internal one must be looking at the same thing.',
          impact: 'A citizen may be told a matter is at a stage the agency does not consider it to be at.',
          risk: 'Misinformed applicants, and complaints founded on a label the agency never intended.',
          authority: 'The registry owner. The source itself names docs/audits/DESIGN_AUDIT_BRIEF_ASSESSMENT.md as the point of confirmation.',
          ownershipType: 'Business owner',
          priority: 'High',
          resolution: 'The agency confirms the mapping, or supplies a distinct public state.',
          source: [s],
        });
      }
    }
    gap({
      system: 'Both platforms',
      subject: 'Two status models govern the same records',
      missing: 'A stated relationship between the internal lifecycle states and the seven-state public vocabulary.',
      available: 'Both models are declared in configuration. A mapping exists from five internal values to public ones; the lifecycle states are not among those five.',
      evidence: EV.CONFLICTING,
      reason: 'A record moving through the lifecycle must carry a public status at every point, or the public surface shows a stale one.',
      impact: 'For most lifecycle states there is no evidenced public status.',
      risk: 'A citizen tracking a submission sees a status that does not move while the matter does.',
      authority: 'The registry owner, with the platform technical owner.',
      ownershipType: 'Business owner',
      priority: 'High',
      resolution: 'Every lifecycle state carries a declared public status, or the two models are reconciled into one.',
      source: [s, ...(has('core/lifecycle.js') ? [SRC('core/lifecycle.js')] : [])],
    });
  }
}

/* ═════════════ 11. Routing and service-level rules ═════════════ */
{
  const p = 'config/assignment-cascade.config.js';
  if (has(p)) {
    const s = SRC(p), t = R(p);
    /* These rows live under `fallbackMatrix`, and the same file declares `categoryFieldAliases`
       — a list of the column names the live matrix may arrive under from reference data. So the
       rows below are what the cascade uses when the reference data yields no match; they are not
       the authoritative routing matrix, and must not be documented as though they were. */
    const isFallback = /fallbackMatrix/.test(t);
    const provisional = isFallback || /PROVISIONAL/i.test(t);
    const aliasDriven = /categoryFieldAliases/.test(t);
    let n = 0;
    for (const m of t.matchAll(/\{\s*category:'([^']+)'[^}]*?categoryCode:'([^']+)'[^}]*?subcategory:'([^']+)'[^}]*?dsuKey:'([^']+)'[^}]*?assignedTo:'([^']+)'[^}]*?supportDsuKey:'([^']+)'[^}]*?priority:'([^']+)'[^}]*?ackDays:(\d+)[^}]*?dueDays:(\d+)/g)) {
      n += 1;
      out.rules.push(compact({
        id: ID('RULE'), type: 'Routing and service level',
        name: `${m[1]} · ${m[3]}`,
        matrix: isFallback ? 'Fallback matrix' : 'Declared matrix',
        description: `${isFallback ? 'FALLBACK. ' : ''}Correspondence of category '${m[1]}' (${m[2]}), subcategory '${m[3]}', is handled by ${m[4]} with ${m[6]} supporting.${isFallback ? ' This row is what the cascade falls back to; the live mapping is expected from reference data.' : ''}`,
        trigger: 'A correspondence record is triaged and its category is known.',
        condition: `category = '${m[1]}' AND subcategory = '${m[3]}'`,
        expectedBehaviour: `Assign to ${m[5]} in ${m[4]}, at priority ${m[7]}.`,
        outcome: `Acknowledgement due within ${m[8]} day(s); completion due within ${m[9]} day(s).`,
        exception: 'Not evidenced: the matrix declares the match, not the behaviour when no row matches.',
        category: m[1], code: m[2], subcategory: m[3],
        responsibleUnit: m[4], assignedTo: m[5], supportingUnit: m[6],
        priority: m[7], acknowledgeDays: +m[8], completeDays: +m[9],
        affectedProcess: procByKey.correspondence || 'Intake and assignment',
        owner: provisional ? 'Not settled. The matrix marks itself provisional.' : undefined,
        evidence: provisional ? EV.VALIDATE : EV.CONFIRMED,
        evidenceNote: isFallback
          ? 'Row of the cascade FALLBACK matrix. That the cascade derives unit, assignee, priority and both clocks from the category is confirmed. That these particular values are the agency\'s routing is NOT: the same file declares column aliases for a matrix supplied from reference data, and that reference data is not among the supplied inputs.'
          : provisional
            ? 'Row of the routing matrix. The matrix marks itself provisional: the category-to-directorate mapping is an operating-model decision, not an implementation one.'
            : 'Row of the live routing matrix; the cascade derives unit, priority and both service-level clocks from the category.',
        validationStatus: provisional ? VALIDATION.REGISTRY : VALIDATION.NONE,
        source: [s],
      }));
      out.monitoring.push(compact({
        id: ID('MON'), name: `Service level — ${m[1]} · ${m[3]}`,
        kind: 'Service-level expectation',
        description: `Acknowledgement within ${m[8]} day(s); completion within ${m[9]} day(s), at priority ${m[7]}.`,
        threshold: `acknowledge ${m[8]}d / complete ${m[9]}d`,
        escalationThreshold: 'Not evidenced. The matrix sets the clocks; no supplied artifact states what happens when one expires.',
        alerting: 'Not evidenced.',
        reportingOutput: 'Not evidenced.',
        evidence: EV.PARTIAL,
        evidenceNote: 'The clocks are declared. The escalation and the alert on breach are not.',
        source: [s],
      }));
    }
    if (provisional) {
      gap({
        system: 'DGO Internal Platform', module: 'config/assignment-cascade.config.js',
        process: procByKey.correspondence,
        subject: isFallback
          ? 'The authoritative routing matrix is not among the supplied inputs; only the cascade fallback is'
          : 'The routing matrix category-to-directorate mapping is provisional',
        missing: isFallback
          ? 'The reference data that supplies the live category-to-unit matrix, and confirmation of each mapping, priority and clock in it.'
          : 'Agency confirmation of each category-to-unit assignment, its priority and its two clocks.',
        available: isFallback
          ? `${n} fallback rows, complete and machine-readable, under a key named fallbackMatrix${aliasDriven ? ', beside a declared list of the column names the live matrix may arrive under from reference data' : ''}.`
          : `${n} routing rows, each complete and machine-readable, marked provisional in their own source.`,
        evidence: EV.VALIDATE,
        reason: 'Routing decides which directorate answers a citizen. It is an operating-model decision the software cannot make, and a fallback is by definition not the decision.',
        impact: isFallback
          ? 'Every routing rule documented here is a fallback. What the estate routes on when the reference data does supply a match is not documented at all, because that data is not present.'
          : 'Every routed item is routed on an unconfirmed rule.',
        risk: 'Correspondence reaches the wrong unit and the service-level clock starts against the wrong owner.',
        authority: 'The registry owner, with the SharePoint reference data the cascade reads its matrix from.',
        ownershipType: 'Business owner',
        priority: 'High',
        resolution: isFallback
          ? 'The live matrix is supplied, catalogued row by row, and each mapping confirmed against the agency structure.'
          : 'Each row is confirmed against the agency structure and the provisional marker is removed.',
        source: [s],
      });
      gap({
        system: 'DGO Internal Platform', module: 'config/assignment-cascade.config.js',
        subject: 'No escalation behaviour is bound to the service-level clocks',
        missing: 'What happens when an acknowledgement or completion clock expires: who is told, what changes, what state the record enters.',
        available: `${n} rows carrying acknowledgement and completion day counts.`,
        evidence: EV.UNAVAILABLE,
        reason: 'A clock with no consequence is a measurement, not a control.',
        impact: 'Breach is undetectable from the supplied inputs and no escalation is documented.',
        risk: 'Overdue matters accumulate with no evidenced trigger for intervention.',
        authority: 'The process owner for the correspondence lifecycle.',
        ownershipType: 'Operational owner',
        priority: 'High',
        resolution: 'An escalation rule exists, bound to the clock, naming the recipient and the resulting state.',
        source: [s],
      });
    }
    coverage('Routing and service-level rules', isFallback ? COV.INSUFFICIENT : provisional ? COV.CONFLICT : COV.FULL,
      isFallback
        ? `The cascade mechanism is fully documented: it derives responsible unit, assignee, priority and both clocks from the category. The matrix it applies is not. The ${n} rows catalogued are the declared fallback; the live matrix is expected from reference data that is not among the supplied inputs.`
        : `${n} rows are complete and machine-readable${provisional ? ', and are marked provisional in their own source. They are documented as declared and flagged for agency confirmation.' : '.'}`,
      [s], n);
  }
}

/* ═════════════ 12. Acknowledgement and retention controls ═════════════ */
{
  const p = 'config/acknowledgement-flow.config.js';
  if (has(p)) {
    const s = SRC(p), t = R(p);
    const g = k => (t.match(new RegExp(`${k}:\\s*([^,\\n]+)`)) || [])[1];
    const statuses = (t.match(/statuses:\s*Object\.freeze\(\[([^\]]*)\]/) || [])[1];
    out.controls.push(compact({
      id: ID('CTRL'), name: 'Acknowledgement receipt', type: 'Completion and audit control',
      description: 'Receipt of an assignment is confirmed and recorded before work starts.',
      trigger: 'An assignee acknowledges an assignment.',
      condition: 'The payload carries every required field, including an idempotency key.',
      expectedBehaviour: 'A receipt is written to the ledger with actor, time, source and the idempotency key.',
      outcome: 'A duplicate acknowledgement inside the dedupe window is recognised as the same receipt, not a second one.',
      exception: 'A failed send is retried under the declared retry policy and queued when it cannot be delivered.',
      idempotency: /requiredPayloadFields:[^\]]*idempotencyKey/.test(t) ? 'An idempotency key is required on every payload.' : undefined,
      dedupeWindowMs: g('dedupeWindowMs'),
      retryPolicy: (t.match(/retry:[^}]*\}/) || [])[0],
      statuses: statuses ? (statuses.match(/'([^']+)'/g) || []).map(x => x.slice(1, -1)) : undefined,
      affectedProcess: procByKey.acknowledgment,
      evidence: EV.CONFIRMED,
      evidenceNote: 'Enforcement, retry policy, dedupe window and receipt fields are all declared in configuration.',
      validationStatus: VALIDATION.NONE,
      source: [s],
    }));
  }
  const rp = 'core/retention.js';
  if (has(rp)) {
    const s = SRC(rp), t = R(rp);
    const cls = (t.match(/classes:\{([^}]*)\}/) || [])[1] || '';
    const dflt = (t.match(/defaultYears:(\d+)/) || [])[1];
    for (const m of cls.matchAll(/'?([A-Za-z][A-Za-z ]*)'?\s*:\s*(\d+)/g)) {
      out.rules.push(compact({
        id: ID('RULE'), type: 'Retention and archival rule',
        name: `Retention — ${m[1].trim()}`,
        description: `Records classified '${m[1].trim()}' are retained for ${m[2]} year(s).`,
        trigger: 'A record is archived and its retention is calculated.',
        condition: `retentionClass = '${m[1].trim()}'`,
        expectedBehaviour: `retentionUntil is set to the archive date plus ${m[2]} year(s).`,
        outcome: 'The record carries a retention date and a security class.',
        exception: `A record whose class is not in this table falls to the default of ${dflt || 'the declared default'} year(s).`,
        affectedProcess: procByKey.archive,
        evidence: EV.CONFIRMED,
        evidenceNote: 'Read from the frozen retention policy table.',
        validationStatus: VALIDATION.REGISTRY,
        source: [s],
      }));
    }
    gap({
      system: 'DGO Internal Platform', module: 'core/retention.js',
      subject: 'Retention periods are declared in code and traced to no authority',
      missing: 'The records-management instrument the retention periods derive from.',
      available: 'A frozen table of retention classes with year counts, and a default.',
      evidence: EV.VALIDATE,
      reason: 'Retention is a statutory and records-management obligation, not an implementation choice.',
      impact: 'Records may be disposed of early, or held longer than the schedule allows.',
      risk: 'Non-compliance with the agency records schedule.',
      authority: 'The agency records-management authority or its retention schedule.',
      ownershipType: 'Business owner',
      resolution: 'Each class and period cites the instrument it derives from.',
      source: [s],
    });
  }
}

/* ═════════════ 13. Dependencies — client to endpoint to flow ═════════════ */
{
  const p = 'config/endpoints.config.js';
  if (has(p)) {
    const s = SRC(p), t = R(p);
    const keys = [...new Set((t.match(/^\s+([A-Z_]{3,32}):/gm) || []).map(x => x.trim().replace(':', '')))];
    for (const k of keys) {
      const users = [...new Set(out.dependencies.filter(d => d.supporting === `Endpoint alias ${k}`).map(d => d.dependentProcess))];
      out.dependencies.push(compact({
        id: ID('DEP'),
        dependentProcess: users.length ? users.join(', ') : 'DGO Internal Platform client',
        supporting: `Endpoint ${k}`, supportingKind: 'Integration',
        type: 'Direct HTTP call to a Power Automate flow',
        direction: 'Outbound',
        mandatory: 'Declared in the endpoint registry as a named alias. Whether a given call is mandatory is stated per action in the governance table, not here.',
        activationCondition: 'A module resolves this alias and calls it.',
        operationalPurpose: 'The alias is the only name the client knows; the URL behind it is supplied at runtime.',
        impactIfUnavailable: 'Every call routed through this alias fails.',
        documentedWorkaround: 'None declared at the registry level.',
        owner: 'Not evidenced. The registry names the alias, not who owns the workflow behind it.',
        evidence: EV.CONFIRMED,
        evidenceNote: 'Declared in the endpoint registry. The registry states the URL itself is supplied at runtime from a git-ignored local configuration, never from source.',
        validationStatus: VALIDATION.TENANT,
        source: [s],
      }));
    }
    gap({
      system: 'Both platforms', module: 'config/endpoints.config.js',
      subject: 'Endpoint aliases are not joined to the workflows that answer them',
      missing: 'A confirmed alias-to-workflow binding for every alias.',
      available: `${keys.length} declared aliases, and a partial join covering some of them in docs/reference/portal-endpoint-workflow-ids.json.`,
      evidence: EV.PARTIAL,
      reason: 'Without the binding, a documented client call cannot be traced to the documented workflow that serves it.',
      impact: 'The traceability chain breaks between the client step and the automated process.',
      risk: 'A change to a workflow cannot be assessed against the callers it would affect.',
      authority: 'The tenant, through the runtime configuration that supplies each URL.',
      ownershipType: 'Technical owner',
      priority: 'High',
      resolution: 'Every alias names the workflow id that answers it. Trigger URLs themselves must not be recorded: they carry a bearer token.',
      source: [s],
    });
    coverage('Endpoint registry', COV.PARTIAL,
      `${keys.length} aliases are declared. The workflow behind each is only partly established, and by design the registry carries no URL.`, [s], keys.length);
  }
}

/* ═════════════ 14. Process variants ═════════════ */
{
  for (const a of Object.values(ownership)) {
    for (const inv of a.allowedInvokers || []) {
      out.variants.push(compact({
        id: ID('VAR'), name: `${a.label || a.action} — raised from ${inv}`,
        variantOf: a.action, parentProcess: procByKey[a.owner] || `Workspace '${a.owner}'`,
        kind: 'Channel-specific variant',
        differsFrom: `The same governed action, raised from ${inv} instead of from its owner ${a.owner}.`,
        activationCondition: `An operator working in ${inv} takes the action.`,
        participants: [`${inv} workspace`, `${a.owner} workspace (owner)`],
        stepsChanged: 'None. One owner, one service and one audit event, whichever channel raises it: only the entry point differs.',
        rulesApplied: `executeOwnedAction() admits ${inv} because the governance table lists it as an allowed invoker.`,
        outputs: 'Identical to the primary path.',
        completionCondition: 'Identical to the primary path.',
        currentStatus: 'Current',
        evidence: EV.CONFIRMED,
        evidenceNote: 'The allowed-invoker list is declared per action in the governance table.',
        source: [a.srcId],
      }));
    }
  }
  const sr = 'config/support-routing.config.js';
  if (has(sr)) {
    const s2 = SRC(sr), t = R(sr);
    const alias = (t.match(/endpointAlias:\s*'([^']+)'/) || [])[1];
    const operation = (t.match(/operation:\s*'([^']+)'/) || [])[1];
    for (const m of t.matchAll(/\{\s*id:'([^']+)',\s*label:'([^']+)',\s*route:'([^']+)',\s*severity:'([^']+)'\s*\}/g)) {
      out.variants.push(compact({
        id: ID('VAR'), name: `Support request — ${m[2]}`,
        variantOf: 'Support request handling', parentProcess: procByKey[m[3]] || `Workspace '${m[3]}'`,
        kind: 'Conditional variant selected by the reported category',
        differsFrom: `A support request of category '${m[2]}' is routed to the ${m[3]} workspace at severity ${m[4]}, rather than into a single support queue.`,
        activationCondition: `The requester selects category '${m[1]}'.`,
        participants: [`${m[3]} workspace`],
        stepsChanged: 'The receiving workspace changes; the request itself is unchanged.',
        rulesApplied: `Support routing table: '${m[1]}' routes to ${m[3]} at severity ${m[4]}.`,
        outputs: `A support request carried on the ${alias || 'declared'} contract, operation ${operation || 'declared'}.`,
        completionCondition: 'Not evidenced. The routing table states where a request goes, not when it is done.',
        currentStatus: 'Current',
        evidence: EV.CONFIRMED,
        evidenceNote: 'Row of the frozen support routing table.',
        source: [s2],
      }));
      out.rules.push(compact({
        id: ID('RULE'), type: 'Routing rule', name: `Support routing — ${m[2]}`,
        description: `Support requests of category '${m[2]}' are routed to ${m[3]}.`,
        trigger: 'A support request is raised.',
        condition: `category = '${m[1]}'`,
        expectedBehaviour: `Route to ${m[3]} at severity ${m[4]}.`,
        outcome: 'The request appears in the receiving workspace.',
        exception: 'Not evidenced for a category the table does not carry.',
        affectedProcess: procByKey[m[3]],
        evidence: EV.CONFIRMED,
        evidenceNote: 'Row of the frozen support routing table.',
        source: [s2],
      }));
    }
  }
}

/* ═════════════ 15. Open items already on the delivery register ═════════════ */
{
  const p = 'docs/deployment/sharepoint/OPEN_ITEMS.md';
  if (has(p)) {
    const s = SRC(p), t = R(p);
    for (const m of t.matchAll(/^\| \*\*(\d+)\*\* \| \*\*([^*]{4,160})\*\*/gm)) {
      gap({
        subject: m[2].trim().replace(/\s+/g, ' '),
        missing: 'Closure of the open item.',
        available: `Recorded as open item ${m[1]} on the delivery register.`,
        evidence: EV.CONFIRMED,
        reason: 'Carried forward so this documentation and the delivery register do not disagree about what is outstanding.',
        impact: 'As stated on the register.',
        risk: 'As stated on the register.',
        authority: 'The delivery owner who maintains the register.',
        ownershipType: 'Product owner',
        resolution: 'The item is closed on the register.',
        source: [s],
      });
    }
  }
}

/* ═════════════ 16. Sources reviewed that carry no process ═════════════ */
{
  const noProcess = ['config/priority.config.js', 'config/receipt-ledger.config.js',
    'config/browser-certification.config.js', 'config/performance-budget.config.js'].filter(has);
  for (const f of noProcess) SRC(f, { reference: 'Reviewed. Carries reference data, a scale or a budget, not process behaviour.' });
  if (noProcess.length) {
    coverage('Reference data, scales and budgets', COV.NA,
      `${noProcess.length} artifact(s) reviewed and found to carry vocabulary, scales or budgets rather than process behaviour: ${noProcess.join(', ')}. Recorded so the review is accountable for them.`,
      noProcess.map(f => SRC(f)), 0);
  }
}

/* ═════════════ 17. Remaining coverage statements and estate-level gaps ═════════════ */
{
  const workspaces = out.processes.filter(p => p.category?.startsWith('User-initiated'));
  coverage('Operator workspaces', workspaces.some(p => p.evidence === EV.UNVERIFIABLE) ? COV.PARTIAL : COV.MINOR,
    `${workspaces.length} workspaces declared, each matched to a module file. Their governed writes are catalogued step by step; the rendering, filtering and paging between writes is presentation and is not modelled as process.`,
    [SRC('config/workflow-clarity.config.js')], workspaces.length);
  coverage('Governed action model', COV.FULL,
    `${Object.keys(ownership).length} actions, each with a declared owner, service, audit vocabulary and backend requirement.`,
    [SRC('config/action-ownership.config.js')], Object.keys(ownership).length);
  coverage('Role and access model', COV.MINOR,
    `${out.roles.filter(r => r.type === 'Role').length} roles and ${out.roles.filter(r => r.type === 'Persona').length} personas, each with its route set. Server-side authorisation of the caller is not evidenced and is raised as a gap.`,
    [SRC('config/rbac.config.js')], out.roles.length);
  coverage('Notification and escalation behaviour', COV.PARTIAL,
    `${out.notifications.length} notification points identified: outbound mail sends in the flow estate and operator-facing outcome messages in the modules. No escalation bound to a service-level clock is evidenced anywhere in the supplied inputs.`,
    [SRC('config/assignment-cascade.config.js')], out.notifications.length);
}

gap({
  system: 'DGO Internal Platform', module: 'config/rbac.config.js',
  subject: 'Authorisation is evidenced only on the client',
  missing: 'Evidence of how a caller is authenticated, and how their role is established before it is trusted.',
  available: 'canAccess() gates every route on a role and persona held in the client profile.',
  evidence: EV.VALIDATE,
  reason: 'A control enforced only where the caller controls the code is a usability feature, not a security control.',
  impact: 'The access model documented here describes what the interface offers, not what the estate refuses.',
  risk: 'Direct calls to the endpoints may not be subject to the documented role model.',
  authority: 'The tenant owner, against the flow trigger authentication settings.',
  ownershipType: 'Security or access authority',
  priority: 'High',
  resolution: 'For each endpoint, the trigger authentication type and the server-side role check are stated.',
  source: [SRC('config/rbac.config.js')],
});

if (Object.keys(flowByName).length) gap({
  system: 'Microsoft Power Automate',
  subject: 'No flow export states its business purpose, owner or criticality',
  missing: 'Business purpose, process owner and criticality for every workflow in the estate.',
  available: `${Object.keys(flowByName).length} complete action graphs, walked step by step.`,
  evidence: EV.UNAVAILABLE,
  reason: 'This standard requires purpose, owner and criticality for every process. A workflow export carries none of the three.',
  impact: 'No automated process can reach full documentation from confirmed evidence.',
  risk: 'An unowned workflow cannot be changed safely or retired deliberately.',
  authority: 'The platform owner, from the tenant flow ownership records.',
  ownershipType: 'Technical owner',
  priority: 'High',
  resolution: 'Each workflow names its owner, its purpose in one sentence, and its criticality.',
  source: [SRC('docs/reference/flow-contracts/deployed')],
});

/* ═════════════ 17b. Evidence the standard's scope calls for and this repository does not hold ═════
 *
 * A generator that reads what is present and says nothing about what is not will quietly
 * present a partial estate as a whole one. The standard forbids exactly that: no system area
 * may be silently omitted, and materials that could not be inspected must be registered. So
 * every class of evidence the scope calls for is named here, and the ones that are absent are
 * recorded as absent rather than passed over.
 */
{
  const EXPECTED = [
    { area: 'Automated flow estate', path: 'docs/reference/flow-contracts/deployed',
      establishes: 'Every action, branch, connector call and exception path of every deployed workflow.',
      impact: 'No automated process is documented at all: no step, decision, integration call or recovery path.',
      risk: 'The integration surface — the only path from either platform to the system of record — is undocumented here.',
      authority: 'A tenant export of every workflow in the environment.',
      ownershipType: 'Technical owner', priority: 'High' },
    { area: 'Correspondence Gateway designs', path: 'docs/deployment/sharepoint/flows/designer-paste/correspondence-gateway',
      establishes: 'The designed action graph of each gateway endpoint.',
      impact: 'The designs behind the citizen-facing endpoints are not documented.',
      risk: 'A change to an endpoint cannot be assessed against its design.',
      authority: 'The designer paste packages held with the deployment documentation.',
      ownershipType: 'Technical owner', priority: 'Medium' },
    { area: 'Published integration contracts', path: 'docs/deployment/sharepoint/portal-data-contract.json',
      establishes: 'The request and response contract of every call the citizen portal makes.',
      impact: 'No integration-supported process is documented, and the traceability chain has no contract to anchor a client call to.',
      risk: 'A caller and a workflow can disagree about a payload with nothing to arbitrate between them.',
      authority: 'The published data contract.',
      ownershipType: 'Product owner', priority: 'High' },
    { area: 'Operational execution evidence', path: 'docs/deployment/sharepoint/evidence',
      establishes: 'That an endpoint executed, and what status it returned.',
      impact: 'Nothing is documented about whether any process runs.',
      risk: 'Structure is documented with no evidence of operation, which is easily mistaken for assurance.',
      authority: 'Captured run records from the tenant.',
      ownershipType: 'Operational owner', priority: 'Medium' },
    { area: 'System-of-record inventory', path: 'docs/reference/sharepoint-list-index.json',
      establishes: 'Which lists and libraries exist and which the estate adopted.',
      impact: 'The system of record is named but its contents are not documented.',
      risk: 'A process that writes to a list cannot be traced to the list it writes to.',
      authority: 'A survey of the SharePoint environment.',
      ownershipType: 'Technical owner', priority: 'Medium' },
    { area: 'Delivery register', path: 'docs/deployment/sharepoint/OPEN_ITEMS.md',
      establishes: 'What the delivery team already records as outstanding.',
      impact: 'This register and the delivery register may disagree about what is open.',
      risk: 'An item closed in one place and open in another.',
      authority: 'The delivery owner.',
      ownershipType: 'Product owner', priority: 'Low' },
    { area: 'Architecture and design materials', path: 'docs/reference/platform-architecture-pack/MASTER_BLUEPRINT.md',
      establishes: 'The intended architecture, against which the implemented one can be compared.',
      impact: 'Implementation is documented with no stated intent to compare it against.',
      risk: 'Drift between intent and implementation is undetectable.',
      authority: 'The platform architect.',
      ownershipType: 'Technical owner', priority: 'Medium' },
  ];
  /* Classes of evidence the scope names that NO artifact in any supplied input carries. These
     are absent everywhere, not merely absent here, so they are registered unconditionally. */
  const NEVER_SUPPLIED = [
    ['Standard operating procedures', 'A written procedure for any process.', 'Process owner'],
    ['User guides and training materials', 'How an operator is taught to work a process.', 'Operational owner'],

    ['Support and operational records', 'What actually goes wrong in service, and how it is resolved.', 'Support owner'],
    ['User journey records', 'What a citizen or an officer experiences end to end.', 'Product owner'],
  ];

  for (const e of EXPECTED) {
    if (has(e.path)) continue;
    coverage(e.area, COV.INSUFFICIENT,
      `No artifact of this class is present in this repository. It would establish: ${e.establishes}`, [], 0);
    gap({
      subject: `${e.area}: no artifact of this class is present`,
      missing: e.establishes,
      available: 'Nothing. The expected path carries no artifact in this repository.',
      evidence: EV.UNAVAILABLE,
      reason: 'The documentation scope names this class of evidence. Passing over it silently would present a partial estate as a whole one.',
      impact: e.impact,
      risk: e.risk,
      authority: e.authority,
      ownershipType: e.ownershipType,
      priority: e.priority,
      resolution: `An artifact of this class is supplied at ${e.path} and catalogued.`,
      source: [],
    });
  }

  /* Test cases are a class the scope names and this repository does hold — but what it holds
     asserts implementation invariants, not per-process acceptance criteria, and the difference
     matters enough to state rather than to score either way silently. */
  if (has('tests')) {
    const suite = ls('tests').filter(f => f.endsWith('.mjs') || f.endsWith('.js'));
    const testsSrc = SRC('tests', { kind: 'Automated test suite', reference: 'Reviewed as a whole: the suite asserts implementation invariants.' });
    coverage('Test cases and acceptance criteria', COV.PARTIAL,
      `${suite.length} test files are present and were reviewed. They establish invariants over the implementation — contracts, vocabularies, wiring, encoding, secrets. They do NOT state, per process, what that process is required to do to be accepted, so no process draws its completion criteria from them.`,
      [testsSrc], 0);
    gap({
      subject: 'Test cases assert implementation invariants, not per-process acceptance criteria',
      missing: 'For each process, what it is required to do to be accepted.',
      available: `${suite.length} test files asserting invariants over the implementation.`,
      evidence: EV.PARTIAL,
      reason: 'Without acceptance criteria, the implementation is the only definition of correct behaviour.',
      impact: 'A process cannot be judged correct or incorrect, only present or absent.',
      risk: 'A defect that is consistently implemented, and consistently tested, reads as intended behaviour.',
      authority: 'The product owner, with the process owner for each area.',
      ownershipType: 'Product owner',
      priority: 'Medium',
      resolution: 'Each process names the criteria it must satisfy to be accepted, and a test asserts them.',
      source: [testsSrc],
    });
  }

  for (const [area, establishes, ownershipType] of NEVER_SUPPLIED) {
    coverage(area, COV.INSUFFICIENT,
      `No artifact of this class is among the supplied inputs. It would establish: ${establishes}`, [], 0);
    gap({
      subject: `${area}: no artifact of this class is among the supplied inputs`,
      missing: establishes,
      available: 'Nothing of this class was supplied.',
      evidence: EV.UNAVAILABLE,
      reason: 'The documentation scope names this class of evidence explicitly.',
      impact: `Every process is documented from implementation alone. Nothing states what any of them is supposed to do, how a person is taught to do it, or what it does in service.`,
      risk: 'Implementation behaviour is the only available definition of correctness, so a defect that is consistently implemented reads as intended behaviour.',
      authority: 'The agency, as the owner of the operating model.',
      ownershipType,
      priority: 'Medium',
      resolution: 'An artifact of this class is supplied and its processes are reconciled against the implemented ones.',
      source: [],
    });
  }
}

/* The traceability chain the standard asks for is not stored here: every column of it is
   already carried by the step, process and source records above, and storing a second copy
   would let the two drift apart. It is assembled at render time in scripts/process-docs.mjs,
   which is therefore the only place the chain is written. */

/* ═════════════ 19. Terminology ═════════════ */
out.terminology = [
  ['Action (Power Automate)', 'One node of a workflow definition. Every action names the actions it runs after and the status each must have reached.', 'docs/reference/flow-contracts/deployed'],
  ['Allowed invoker', 'A workspace that may raise a governed action it does not own. Ownership, service and audit vocabulary stay with the owner.', 'config/action-ownership.config.js'],
  ['Cascade', 'The routing matrix that derives responsible unit, assignee, priority and both service-level clocks from a correspondence category.', 'config/assignment-cascade.config.js'],
  ['Catch scope', 'A scope whose run-after condition admits Failed, TimedOut or Skipped, so it runs when the scope before it did not succeed.', 'docs/deployment/sharepoint/flows/designer-paste/correspondence-gateway'],
  ['DSU', 'Departmental or service unit. The key by which the routing matrix names a responsible unit.', 'config/assignment-cascade.config.js'],
  ['Endpoint alias', 'The name a module uses to reach a workflow. The URL behind it is supplied at runtime and never held in source.', 'config/endpoints.config.js'],
  ['Governed action', 'A write that passes through executeOwnedAction(), which refuses it unless the calling module owns it or is a declared allowed invoker.', 'config/action-ownership.config.js'],
  ['Hidden technical route', 'A workspace not on the sidebar, reached only from a named parent workspace.', 'config/workflow-clarity.config.js'],
  ['Lifecycle state', 'One of the values in the frozen internal transition map. Distinct from the public status vocabulary.', 'core/lifecycle.js'],
  ['Public status', 'One of the seven governed values a citizen is shown. Distinct from the internal lifecycle state.', 'config/status-vocabulary.config.js'],
  ['Run-after', 'The condition under which a Power Automate action runs, expressed as the predecessor actions and the statuses each must have reached.', 'docs/reference/flow-contracts/deployed'],
  ['Run record', 'A captured execution of a workflow: its outcome and the response it returned. Evidence of execution, not of business success.', 'docs/deployment/sharepoint/evidence/2026-08-27-endpoint-runs'],
  ['Workspace', 'A primary route on the sidebar, implemented by a module of the same name.', 'config/workflow-clarity.config.js'],
].map(([term, definition, where]) => compact({ id: ID('TERM'), term, definition, source: has(where) ? [SRC(where)] : [] }));

/* ═════════════ 20. Emit ═════════════ */
const target = 'docs/reference/process-inventory.json';
const { phrases, interned } = internPhrases(out);
interned.phrases = phrases;
const text = JSON.stringify(interned, null, 1) + '\n';
if (process.argv.includes('--check')) {
  const cur = existsSync(join(ROOT, target)) ? readFileSync(join(ROOT, target), 'utf8') : '';
  if (cur !== text) { console.error(`❌ ${target} is stale — run: node scripts/process-discovery.mjs`); process.exit(1); }
  console.log(`✅ ${target} matches a fresh discovery run`);
  process.exit(0);
}
writeFileSync(join(ROOT, target), text);
const c = k => out[k].length;
console.log(`wrote ${target}  (${(text.length / 1024).toFixed(0)} KB)`);
console.log(`  SYS ${c('systems')}  MOD ${c('modules')}  PROC ${c('processes')}  SUBPROC ${c('subprocesses')}  VAR ${c('variants')}  STEP ${c('steps')}  DEC ${c('decisions')}`);
console.log(`  ROLE ${c('roles')}  INT ${c('integrations')}  STAT ${c('statuses')}  TRAN ${c('transitions')}  RULE ${c('rules')}  CTRL ${c('controls')}`);
console.log(`  EXC ${c('exceptions')}  NOTIF ${c('notifications')}  MON ${c('monitoring')}  DEP ${c('dependencies')}  GAP ${c('gaps')}  COV ${c('coverage')}  SRC ${c('sources')}`);
console.log(`  ${phrases.length} recurring phrases interned; every record still carries every field it filled.`);
