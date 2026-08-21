// DGO endpoint blueprints.
//
// This is the part of the studio that is not generic. Every endpoint in
// config/endpoints.config.js is a Power Automate request flow, and core/data-client.js and
// core/contracts.js already fix both halves of the wire contract:
//
//   REQUEST (data-client.js request())
//     { action, payload, userEmail?, requestId, timestamp }        default
//     { action, …payload, userEmail?, correlationId }              options.flatPayload
//     headers: Content-Type: application/json, X-Correlation-Id, Authorization when enforced
//
//   RESPONSE (contracts.js assertEnvelope())
//     ok:false, or status.http >= 400, is a failure — the client throws.
//     errors[].message is what it shows the operator; status.message is the fallback.
//     data is unwrapped and handed to the caller; the rest is metadata.
//
// A scaffold generated from the wrong envelope fails inside assertEnvelope() as "Flow
// reported failure" with no further detail, which is a miserable thing to debug. So the
// envelope is built here, once, from the contract the client actually enforces — rather
// than retyped into each flow by hand.

import { EndpointContracts } from '../../config/endpoints.config.js';
import { ActionNamePolicy } from '../../config/power-automate.config.js';

let seq = 0;
const sid = () => `bp-${Date.now().toString(36)}-${(seq += 1).toString(36)}`;
const step = (actionId, name, values, extra = {}) => ({ id: sid(), actionId, name, values, ...extra });

/** The request body the platform sends, as a JSON Schema for Parse JSON. */
export function requestSchema(shape = 'nested') {
  const base = {
    type: 'object',
    properties: {
      action: { type: 'string' },
      userEmail: { type: 'string' }
    },
    required: ['action']
  };
  if (shape === 'flat') {
    base.properties.correlationId = { type: 'string' };
    base.description = 'Flat shape: the caller spreads its payload into the body alongside action.';
  } else {
    base.properties.payload = { type: 'object' };
    base.properties.requestId = { type: 'string' };
    base.properties.timestamp = { type: 'string' };
  }
  return base;
}

/**
 * The success envelope contracts.js will accept, as a JSON string ready for a Response body.
 * `dataExpression` is a whole-value expression so the payload keeps its type — a string
 * there would hand the client a quoted object.
 */
export function successEnvelope(dataExpression, { receivedAtFrom = "@{outputs('Received_at')}", contractVersion = '1.0' } = {}) {
  return {
    ok: true,
    status: { http: 200, message: 'OK' },
    request: {
      action: "@{triggerBody()?['action']}",
      requestId: "@{coalesce(triggerBody()?['requestId'], triggerBody()?['correlationId'], '')}",
      trackingId: "@{workflow()?['run']?['name']}"
    },
    timing: { receivedAtUtc: receivedAtFrom, completedAtUtc: '@{utcNow()}' },
    meta: { runId: "@{workflow()?['run']?['name']}", flowName: "@{workflow()?['name']}", contractVersion },
    data: dataExpression
  };
}

/** The failure envelope. status.http >= 400 is what makes the client throw. */
export function failureEnvelope(http, code, message) {
  return {
    ok: false,
    status: { http, message },
    request: {
      action: "@{triggerBody()?['action']}",
      requestId: "@{coalesce(triggerBody()?['requestId'], triggerBody()?['correlationId'], '')}",
      trackingId: "@{workflow()?['run']?['name']}"
    },
    timing: { receivedAtUtc: "@{outputs('Received_at')}", completedAtUtc: '@{utcNow()}' },
    meta: { runId: "@{workflow()?['run']?['name']}", flowName: "@{workflow()?['name']}", contractVersion: '1.0' },
    errors: [{ code, message }],
    data: {}
  };
}

const json = v => JSON.stringify(v, null, 2);

/**
 * The trigger for a request endpoint.
 *
 * Returned separately and never as part of a paste payload: the designer's paste path
 * creates actions only, so a trigger has to be added in the designer or brought in through
 * code view. Saying that plainly beats generating something that silently will not land.
 */
export function requestTrigger(shape = 'nested') {
  return {
    name: 'manual',
    definition: {
      type: 'Request',
      kind: 'Http',
      inputs: { schema: requestSchema(shape), method: 'POST' }
    }
  };
}

/** The action names a scaffold uses for a route key, kept in one place so they stay in step. */
const caseNames = routeKey => {
  const safe = ActionNamePolicy.toKey(String(routeKey).replace(/[^A-Za-z0-9]+/g, '_')).replace(/^_+|_+$/g, '') || 'Action';
  return { case: safe, result: `Result_${safe}`.slice(0, 80), respond: `Respond_${safe}`.slice(0, 80) };
};

/**
 * Full scaffold for one DGO endpoint: timestamp, typed request, switch over the endpoint's
 * declared actions, an enveloped response per branch, and a 400 for anything unrecognised.
 *
 * Every branch's real work is a labelled Compose placeholder. That is deliberate — the
 * scaffold is the part that is identical across endpoints and tedious to retype; what each
 * action actually does is the part a person has to decide.
 */
export function endpointScaffold(endpointKey, { shape = 'nested', routeKeys } = {}) {
  const contract = EndpointContracts[endpointKey];
  if (!contract) throw new Error(`Unknown endpoint "${endpointKey}".`);
  const keys = routeKeys?.length ? routeKeys : (contract.routeKeys?.length ? contract.routeKeys : [contract.action]);

  const cases = keys.map(k => ({ name: caseNames(k).case, value: k }));
  const branches = { default: [
    step('response', 'Respond_unknown_action', {
      statusCode: 400,
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      body: json(failureEnvelope(400, 'UNKNOWN_ACTION', "No branch handles action '@{triggerBody()?[\'action\']}'."))
    })
  ] };

  for (const k of keys) {
    const n = caseNames(k);
    branches[`case:${n.case}`] = [
      step('compose', n.result, {
        inputs: json({
          note: `Replace this Compose with the work for "${k}", then point the response below at its output.`,
          receivedPayload: shape === 'flat' ? '@triggerBody()' : "@triggerBody()?['payload']"
        })
      }),
      step('response', n.respond, {
        statusCode: 200,
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        body: json(successEnvelope(`@outputs('${n.result}')`))
      })
    ];
  }

  return {
    name: `${endpointKey} request handler`,
    trigger: requestTrigger(shape),
    notes: [
      `Envelope matches core/contracts.js assertEnvelope(): ok, status.http, request, timing, meta, data.`,
      `Client sends ${shape === 'flat' ? '{ action, …payload, userEmail?, correlationId }' : '{ action, payload, userEmail?, requestId, timestamp }'}.`,
      contract.write
        ? 'This endpoint is declared write:true — the client queues and retries it on failure, so the flow must be idempotent on requestId.'
        : 'This endpoint is declared read-only.',
      'The trigger is listed separately: pasting creates actions only, so add "When an HTTP request is received" in the designer and paste these under it.'
    ],
    steps: [
      step('compose', 'Received_at', { inputs: '"@{utcNow()}"' }),
      step('parseJson', 'Parse_request', { content: '@triggerBody()', schema: json(requestSchema(shape)) }),
      step('switch', 'Route_action', { on: "@{triggerBody()?['action']}", cases }, { branches })
    ]
  };
}

/** One switch branch, for adding an action to an endpoint flow that already exists. */
export function actionCase(routeKey, { shape = 'nested' } = {}) {
  const n = caseNames(routeKey);
  return {
    name: `${routeKey} branch`,
    notes: [
      `Paste these two actions inside the "${routeKey}" case of the flow's existing Switch.`,
      'They reference Received_at from the surrounding flow — the scaffold creates it.'
    ],
    steps: [
      step('compose', n.result, {
        inputs: json({ note: `Work for "${routeKey}".`, receivedPayload: shape === 'flat' ? '@triggerBody()' : "@triggerBody()?['payload']" })
      }),
      step('response', n.respond, {
        statusCode: 200,
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        body: json(successEnvelope(`@outputs('${n.result}')`))
      })
    ]
  };
}

/** Guarded write: run the work, and answer with the right envelope either way. */
export function guardedWrite({ label = 'Write' } = {}) {
  return {
    name: `${label} with envelope`,
    notes: [
      'The Scope isolates the work so a failure inside it does not fail the run before the response is sent.',
      'Both responses run after the Scope, on opposite statuses — a fork, not a chain. Chaining the ' +
        'failure response to the success one would never fire it: a failed Scope leaves the success ' +
        'response Skipped, and Skipped is not Failed.'
    ],
    steps: [
      step('scope', 'Do_the_work', {}, { id: 'bp-guarded-scope',
        branches: { actions: [step('compose', 'Work_placeholder', { inputs: json({ note: 'Replace with the write — SharePoint, HTTP, whatever this endpoint does.' }) })] }
      }),
      step('response', 'Respond_success', {
        statusCode: 200,
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        body: json(successEnvelope("@outputs('Work_placeholder')"))
      }),
      step('response', 'Respond_failure', {
        statusCode: 500,
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        body: json(failureEnvelope(500, 'WRITE_FAILED', "@{result('Do_the_work')[0]?['error']?['message']}"))
      }, { runAfterRef: 'bp-guarded-scope', runAfterStatuses: ['Failed', 'TimedOut'] })
    ]
  };
}

/** Acknowledgement email against a correspondence reference. */
export function acknowledgementEmail() {
  return {
    name: 'Acknowledgement email',
    notes: ['Pick the Office 365 Outlook connection on the email action after pasting.'],
    steps: [
      step('compose', 'Acknowledgement_reference', { inputs: "\"@{coalesce(triggerBody()?['payload']?['reference'], triggerBody()?['reference'], '')}\"" }),
      step('condition', 'Reference_present', {
        rows: [{ left: "@{outputs('Acknowledgement_reference')}", operator: 'isNotEmpty', right: '' }], join: 'and'
      }, {
        branches: {
          actions: [step('o365.sendEmail', 'Send_acknowledgement', {
            to: "@{triggerBody()?['payload']?['senderEmail']}",
            subject: "Acknowledgement — @{outputs('Acknowledgement_reference')}",
            body: '<p>Your correspondence has been received and registered.</p>'
              + "<p>Reference: <b>@{outputs('Acknowledgement_reference')}</b></p>"
              + '<p>You will be contacted when it has been assigned.</p>',
            importance: 'Normal'
          })],
          else: [step('terminate', 'No_reference_supplied', { runStatus: 'Failed', code: 'NO_REFERENCE', message: 'Acknowledgement requested without a reference.' })]
        }
      })
    ]
  };
}

/** Everything the studio offers, in the order it presents them. */
export const Blueprints = Object.freeze([
  {
    id: 'endpoint-scaffold',
    label: 'DGO endpoint request handler',
    summary: 'Timestamp, typed request, switch over the endpoint’s declared actions, enveloped response per branch, 400 for anything else.',
    needsEndpoint: true,
    build: opts => endpointScaffold(opts.endpointKey, opts)
  },
  {
    id: 'action-case',
    label: 'One action branch',
    summary: 'The two actions that make up a single switch branch, for an endpoint flow that already exists.',
    needsRouteKey: true,
    build: opts => actionCase(opts.routeKey || 'newAction', opts)
  },
  {
    id: 'guarded-write',
    label: 'Guarded write with success and failure responses',
    summary: 'A Scope around the work, a 200 on success and a 500 carrying the real error on failure.',
    build: opts => guardedWrite(opts)
  },
  {
    id: 'ack-email',
    label: 'Acknowledgement email',
    summary: 'Resolves the reference, emails the sender, fails loudly when no reference was supplied.',
    build: () => acknowledgementEmail()
  }
]);

export const blueprintById = id => Blueprints.find(b => b.id === id) || null;
/** Endpoint keys a scaffold can be generated for, with the actions each one declares. */
export const endpointOptions = () => Object.entries(EndpointContracts).map(([key, c]) => ({
  key, action: c.action, write: !!c.write, readOnly: !!c.readOnly,
  routeKeys: c.routeKeys?.length ? c.routeKeys : [c.action]
}));
