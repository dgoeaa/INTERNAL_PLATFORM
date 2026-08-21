// Contract tests for the Power Automate generator.
//
// The first group is the one that matters most. Everything the studio does rests on a gate
// in someone else's codebase — retrieveClipboardData() in the Power Automate designer accepts
// clipboard JSON if and only if `mslaNode` is truthy, and routes on `isScopeNode`. If an edit
// here ever drops or renames one of those keys, nothing in this repository breaks; the paste
// just silently stops working in a browser none of our tooling opens. So they are asserted
// by name, and the assertion is the documentation.
//
//   node --test tests/power-automate.test.mjs

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import * as PA from '../core/power-automate/index.js';
import { endpointScaffold, acknowledgementEmail, guardedWrite } from '../core/power-automate/blueprints.js';
import { coerce, escapeLiteral, isWholeExpression, interpolationErrors, buildCondition } from '../core/power-automate/expressions.js';
import { actionById, Actions, defaultValues } from '../core/power-automate/catalog.js';
import { inferSchema, schemaFromSample } from '../core/power-automate/schema.js';
import { Triggers, triggerById, defaultTriggerValues } from '../core/power-automate/triggers.js';

const plan = steps => ({ name: 'Test plan', steps });
const step = (actionId, values = {}, extra = {}) => ({ id: Math.random().toString(36).slice(2), actionId, values, branches: {}, ...extra });

describe('the designer paste contract', () => {
  test('payload carries the exact keys the designer reads', () => {
    const built = PA.buildFragments(plan([step('compose', { inputs: '{"a":1}' })]));
    const payload = PA.toPayload(built.fragments[0]);
    // retrieveClipboardData() gate.
    assert.equal(payload.mslaNode, true);
    // handlePasteClicked() branch selector — true routes to pasteScopeOperation.
    assert.equal(payload.isScopeNode, true);
    // pasteScopeOperation() argument names.
    assert.ok('nodeId' in payload);
    assert.ok('serializedOperation' in payload);
    assert.ok('allConnectionData' in payload);
    assert.ok('staticResults' in payload);
  });

  test('payload is parseable by JSON.parse, which is all the designer does to it', () => {
    const built = PA.buildFragments(plan([step('compose', { inputs: '{"a":1}' })]));
    const reparsed = JSON.parse(PA.payloadText(built.fragments[0]));
    assert.equal(reparsed.mslaNode, true);
    assert.equal(reparsed.serializedOperation.type, 'Compose');
  });

  test('the root carries no runAfter — pasteScopeInWorkflow clears it and rebuilds the edges', () => {
    const built = PA.buildFragments(plan([step('compose', { inputs: '1' }), step('compose', { inputs: '2' })]));
    assert.equal('runAfter' in PA.toPayload(built.fragments[0]).serializedOperation, false);
  });

  test('connection data is empty — generated actions bind their connection in the designer', () => {
    const built = PA.buildFragments(plan([step('sp.getItems', { dataset: 'https://x', table: 'Y' })]));
    assert.deepEqual(PA.toPayload(built.fragments[0]).allConnectionData, {});
  });
});

describe('expressions', () => {
  test('a literal leading @ is doubled, an expression is not', () => {
    assert.equal(coerce('@hello', 'text'), '@@hello');
    assert.equal(coerce('@triggerBody()', 'text'), '@triggerBody()');
    assert.equal(coerce('Ref @{triggerBody()}', 'text'), 'Ref @{triggerBody()}');
  });

  test('an @ inside a string is left alone — email addresses must survive', () => {
    assert.equal(coerce('registry@nitda.gov.ng', 'text'), 'registry@nitda.gov.ng');
    assert.equal(escapeLiteral('a@b.com'), 'a@b.com');
  });

  test('an already-escaped value is not escaped twice', () => {
    assert.equal(coerce('@@hello', 'text'), '@@hello');
  });

  test('a whole-value expression is a function call, not merely a leading @', () => {
    assert.equal(isWholeExpression('@variables(\'v\')'), true);
    assert.equal(isWholeExpression('@here'), false);
    assert.equal(isWholeExpression('@{x}'), false);
  });

  test('unbalanced interpolation is caught; braces inside a string literal are not counted', () => {
    assert.equal(interpolationErrors('@{concat(\'{\', x)}').length, 0);
    assert.equal(interpolationErrors('@{concat(x').length, 1);
  });

  test('conditions build the designer’s own and/or/not shape', () => {
    assert.deepEqual(buildCondition([{ left: '@{x}', operator: 'equals', right: 'y' }]), { and: [{ equals: ['@{x}', 'y'] }] });
    assert.deepEqual(buildCondition([{ left: '@{x}', operator: 'notEquals', right: 'y' }]), { and: [{ not: { equals: ['@{x}', 'y'] } }] });
    assert.deepEqual(buildCondition([{ left: '@{x}', operator: 'isEmpty' }], 'or'), { or: [{ empty: ['@{x}'] }] });
  });
});

describe('assembly', () => {
  test('names are unique across the whole fragment, including across sibling branches', () => {
    const built = PA.buildFragments(plan([step('condition', { rows: [{ left: '@{x}', operator: 'equals', right: 'y' }] }, {
      branches: { actions: [step('compose', { inputs: '1' })], else: [step('compose', { inputs: '2' })] }
    })]));
    assert.equal(new Set(built.names).size, built.names.length);
  });

  test('siblings chain with runAfter; the first in a list has none', () => {
    const { actions } = PA.buildActionsMap(plan([
      step('compose', { inputs: '1' }, { name: 'First' }),
      step('compose', { inputs: '2' }, { name: 'Second' })
    ]));
    assert.deepEqual(actions.First.runAfter, {});
    assert.deepEqual(actions.Second.runAfter, { First: ['Succeeded'] });
  });

  test('a failure handler can run after a failure', () => {
    const { actions } = PA.buildActionsMap(plan([
      step('scope', {}, { name: 'Work', branches: { actions: [step('compose', { inputs: '1' })] } }),
      step('compose', { inputs: '2' }, { name: 'Recover', runAfterStatuses: ['Failed', 'TimedOut'] })
    ]));
    assert.deepEqual(actions.Recover.runAfter, { Work: ['Failed', 'TimedOut'] });
  });

  test('one action pastes bare; several are wrapped in a Scope', () => {
    assert.equal(PA.planMode(plan([step('compose', { inputs: '1' })])), 'single');
    assert.equal(PA.planMode(plan([step('compose', { inputs: '1' }), step('compose', { inputs: '2' })])), 'scope');
  });

  test('Initialize variable forces a sequence — it cannot be nested inside the Scope wrapper', () => {
    const p = plan([step('initVariable', { name: 'v', type: 'string' }), step('compose', { inputs: '1' })]);
    assert.equal(PA.planMode(p), 'sequence');
    assert.equal(PA.buildFragments(p).fragments.length, 2);
  });
});

describe('the catalog', () => {
  test('every action builds from its own declared defaults', () => {
    const ctx = { branch: () => ({}), cases: () => ({}) };
    for (const action of Actions) {
      if (action.id === 'raw') continue; // raw legitimately requires a definition to be supplied
      const built = action.build(defaultValues(action), ctx);
      assert.equal(typeof built.type, 'string', `${action.id} produced no type`);
    }
  });

  test('connector actions emit the OpenApiConnection shape a cloud flow uses', () => {
    const a = actionById('sp.createItem').build(
      { dataset: 'https://x', table: 'L', item: [{ name: 'Title', value: 'v' }] }, {}
    );
    assert.equal(a.type, 'OpenApiConnection');
    assert.equal(a.inputs.host.operationId, 'PostItem');
    assert.equal(a.inputs.host.connectionName, 'shared_sharepointonline');
    assert.equal(a.inputs.authentication, "@parameters('$authentication')");
    // SharePoint columns are flattened, not nested under an `item` object.
    assert.equal(a.inputs.parameters['item/Title'], 'v');
  });

  test('empty optional parameters are dropped rather than sent as empty strings', () => {
    const a = actionById('sp.getItems').build({ dataset: 'https://x', table: 'L' }, {});
    assert.equal('$filter' in a.inputs.parameters, false);
  });
});

describe('validation', () => {
  const errs = p => PA.errorsOf(PA.validatePlan(p)).map(i => i.message);

  test('a required field that is empty blocks generation', () => {
    assert.ok(errs(plan([step('parseJson', { content: '' })])).some(m => /required/.test(m)));
  });

  test('a name with a forbidden character blocks generation', () => {
    assert.ok(errs(plan([step('compose', { inputs: '1' }, { name: 'bad@name' })])).some(m => /rejects/.test(m)));
  });

  test('malformed JSON in a JSON field blocks generation', () => {
    assert.ok(errs(plan([step('compose', { inputs: '{oops' })])).some(m => /not valid JSON/.test(m)));
  });

  test('two switch cases matching the same value block generation', () => {
    assert.ok(errs(plan([step('switch', { on: '@{x}', cases: [{ name: 'A', value: 'v' }, { name: 'B', value: 'v' }] })]))
      .some(m => /distinct/.test(m)));
  });

  test('a variable used but never initialised warns rather than blocks', () => {
    const p = plan([step('setVariable', { name: 'v', value: '"@{variables(\'ghost\')}"' })]);
    assert.equal(PA.canGenerate(PA.validatePlan(p)), true);
    assert.ok(PA.warningsOf(PA.validatePlan(p)).some(i => /ghost/.test(i.message)));
  });

  test('a connector action always produces a note about binding the connection', () => {
    const p = plan([step('sp.getItems', { dataset: 'https://x', table: 'L' })]);
    assert.ok(PA.notesOf(PA.validatePlan(p)).some(i => /connection/i.test(i.message)));
  });
});

describe('DGO blueprints', () => {
  test('every blueprint generates without a blocking issue', () => {
    for (const bp of PA.Blueprints) {
      const built = bp.build({ endpointKey: 'DYNAMIC_ACTIONS', routeKey: 'transitionStatus', shape: 'nested' });
      const p = { name: built.name, steps: built.steps };
      assert.equal(PA.canGenerate(PA.validatePlan(p)), true, `${bp.id}: ${PA.errorsOf(PA.validatePlan(p)).map(i => i.message).join('; ')}`);
      assert.ok(PA.buildFragments(p).fragments.length >= 1, `${bp.id} produced nothing`);
    }
  });

  test('the endpoint scaffold switches on the action discriminator data-client.js sends', () => {
    const built = PA.buildFragments({ steps: endpointScaffold('SUBSIDIARY_ACTIONS').steps });
    const sw = built.fragments[0].definition.actions.Route_action;
    assert.equal(sw.type, 'Switch');
    assert.equal(sw.expression, "@{triggerBody()?['action']}");
    // One branch per action the endpoint contract declares, plus a default.
    assert.equal(Object.keys(sw.cases).length, 18);
    assert.ok(sw.default.actions);
  });

  test('the success envelope is the one core/contracts.js accepts', () => {
    const env = PA.successEnvelope("@outputs('X')");
    assert.equal(env.ok, true);
    assert.equal(env.status.http, 200);         // assertEnvelope() throws at >= 400
    assert.equal(env.data, "@outputs('X')");    // whole-value expression, so the payload keeps its type
    assert.ok(env.request.action && env.timing.completedAtUtc && env.meta.runId);
  });

  test('the failure envelope makes the client throw with a readable message', () => {
    const env = PA.failureEnvelope(500, 'WRITE_FAILED', 'disk on fire');
    assert.equal(env.ok, false);
    assert.equal(env.status.http, 500);
    assert.equal(env.errors[0].message, 'disk on fire');
  });

  test('the trigger is offered separately, because paste creates actions only', () => {
    const scaffold = endpointScaffold('DYNAMIC_ACTIONS');
    assert.equal(scaffold.trigger.definition.type, 'Request');
    // Nothing of the trigger leaks into the pasteable payload.
    const payload = PA.toPayload(PA.buildFragments({ steps: scaffold.steps }).fragments[0]);
    assert.equal(JSON.stringify(payload).includes('"Request"'), false);
  });

  test('the workflow definition export carries the parameters a cloud flow needs', () => {
    const scaffold = endpointScaffold('DYNAMIC_ACTIONS');
    const { definition } = PA.buildWorkflowDefinition({ steps: scaffold.steps }, scaffold.trigger);
    assert.ok(definition.parameters.$connections);
    assert.ok(definition.parameters.$authentication);
    assert.equal(definition.triggers.manual.type, 'Request');
  });

  test('the guarded write forks both responses off the Scope, so the 500 is reachable', () => {
    const { actions } = PA.buildActionsMap({ steps: guardedWrite().steps });
    // Both wait on the SAME action. Chaining the failure response to the success one would
    // never fire: a failed Scope leaves the success response Skipped, and Skipped is not Failed.
    assert.deepEqual(actions.Respond_success.runAfter, { Do_the_work: ['Succeeded'] });
    assert.deepEqual(actions.Respond_failure.runAfter, { Do_the_work: ['Failed', 'TimedOut'] });
  });

  test('a forked step does not become the link for the next sibling', () => {
    const { actions } = PA.buildActionsMap({ steps: [
      { id: 'a', actionId: 'compose', name: 'A', values: { inputs: '1' } },
      { id: 'b', actionId: 'compose', name: 'B', values: { inputs: '2' } },
      { id: 'c', actionId: 'compose', name: 'C', values: { inputs: '3' }, runAfterRef: 'a', runAfterStatuses: ['Failed'] },
      { id: 'd', actionId: 'compose', name: 'D', values: { inputs: '4' } }
    ] });
    assert.deepEqual(actions.C.runAfter, { A: ['Failed'] });
    assert.deepEqual(actions.D.runAfter, { B: ['Succeeded'] });
  });

  test('a runAfterRef naming a later step is ignored rather than emitted', () => {
    const { actions } = PA.buildActionsMap({ steps: [
      { id: 'a', actionId: 'compose', name: 'A', values: { inputs: '1' } },
      { id: 'b', actionId: 'compose', name: 'B', values: { inputs: '2' }, runAfterRef: 'zzz' }
    ] });
    assert.deepEqual(actions.B.runAfter, { A: ['Succeeded'] });
  });

  test('the acknowledgement email nests correctly under its condition', () => {
    const built = PA.buildFragments({ name: 'Ack', steps: acknowledgementEmail().steps });
    const cond = built.fragments[0].definition.actions.Reference_present;
    assert.equal(cond.type, 'If');
    assert.ok(cond.actions.Send_acknowledgement);
    assert.ok(cond.else.actions.No_reference_supplied);
  });
});

describe('importing from the designer', () => {
  test('Peek code output is recognised', () => {
    const r = PA.importDefinition('{"Get_items":{"type":"OpenApiConnection","inputs":{}}}');
    assert.equal(r.name, 'Get_items');
    assert.equal(r.from, 'Peek code');
  });

  test('a copied Scope is recognised', () => {
    const r = PA.importDefinition(JSON.stringify({ mslaNode: true, nodeId: 'S', serializedOperation: { type: 'Scope', actions: {} } }));
    assert.equal(r.definition.type, 'Scope');
  });

  test('a single copied action is refused with the reason and the way round it', () => {
    assert.throws(() => PA.importDefinition('{"mslaNode":true,"nodeData":{}}'), /Peek code|Scope/);
  });
});


describe('schema inference', () => {
  test('scalars, arrays and nesting are described', () => {
    assert.deepEqual(inferSchema({ a: 'x', b: 1, c: 1.5, d: true, e: ['x'] }), {
      type: 'object',
      properties: {
        a: { type: 'string' }, b: { type: 'integer' }, c: { type: 'number' },
        d: { type: 'boolean' }, e: { type: 'array', items: { type: 'string' } }
      }
    });
  });

  test('array items are merged, so a field missing from the first item still appears', () => {
    // Taking the first element would hide `b` from the token picker for every later item.
    assert.deepEqual(inferSchema([{ a: 1 }, { a: 1, b: 'x' }]).items.properties,
      { a: { type: 'integer' }, b: { type: 'string' } });
  });

  test('integer and number seen for one field widen to number', () => {
    assert.deepEqual(inferSchema([{ n: 1 }, { n: 1.5 }]).items.properties.n, { type: 'number' });
  });

  test('no required[] is emitted', () => {
    // A sample is one observation. Asserting it would fail a later payload that omits an
    // optional field, at run time, with an error caused by the schema rather than the data.
    assert.equal(JSON.stringify(inferSchema({ a: 1, b: null })).includes('required'), false);
  });

  test('null becomes an unconstrained field rather than a wrong type', () => {
    assert.deepEqual(inferSchema({ a: null }).properties.a, {});
  });

  test('a bad sample reports why', () => {
    assert.throws(() => schemaFromSample('{nope'), /not valid JSON/);
  });
});

describe('triggers', () => {
  test('every trigger builds a named definition', () => {
    for (const t of Triggers) {
      const built = t.build({ ...defaultTriggerValues(t), dataset: 'https://x', table: 'L' });
      assert.ok(built.name, `${t.id} produced no name`);
      assert.equal(typeof built.definition.type, 'string');
    }
  });

  test('polling connector triggers carry a recurrence, which the service requires', () => {
    for (const id of ['sp.itemCreated', 'sp.itemCreatedOrModified', 'o365.newEmail']) {
      const t = triggerById(id);
      const built = t.build({ ...defaultTriggerValues(t), dataset: 'https://x', table: 'L' });
      assert.equal(built.definition.type, 'OpenApiConnection');
      assert.ok(built.definition.recurrence?.frequency, `${id} has no recurrence`);
    }
  });

  test('a trigger reaches a flow only through the definition, never through a paste', () => {
    const t = triggerById('recurrence');
    const trigger = t.build(defaultTriggerValues(t));
    const plan = { name: 'p', steps: [step('compose', { inputs: '1' })], trigger };
    // It is in the definition export …
    const { definition } = PA.buildWorkflowDefinition(plan, trigger);
    assert.equal(definition.triggers.Recurrence.type, 'Recurrence');
    // … and nowhere in the payload the designer pastes.
    const payload = PA.toPayload(PA.buildFragments(plan).fragments[0]);
    assert.equal(JSON.stringify(payload).includes('Recurrence'), false);
  });
});

describe('the enhanced catalog', () => {
  test('the new connectors are declared with a PowerApps api id', () => {
    for (const id of ['approvals.startAndWait', 'teams.postMessage', 'o365.reply', 'sp.addAttachment']) {
      const a = actionById(id);
      const built = a.build(defaultValues(a), {});
      assert.equal(built.type, 'OpenApiConnection', id);
      assert.match(built.inputs.host.apiId, /^\/providers\/Microsoft\.PowerApps\/apis\/shared_/, id);
      assert.equal(built.inputs.authentication, "@parameters('$authentication')", id);
    }
  });

  test('approval inputs are flattened the way the connector expects', () => {
    const a = actionById('approvals.startAndWait');
    const built = a.build({ approvalType: 'Basic', title: 'Approve DGO/1', assignedTo: 'a@b.gov.ng' }, {});
    assert.equal(built.inputs.parameters.approvalType, 'Basic');
    assert.equal(built.inputs.parameters['ApprovalCreationInput/title'], 'Approve DGO/1');
  });
});

describe('name resolution', () => {
  test('duplicates are numbered, and the plan is not mutated to find out', () => {
    const plan = { steps: [step('compose', { inputs: '1' }), step('compose', { inputs: '2' })] };
    plan.steps[0].id = 'a'; plan.steps[1].id = 'b';
    const names = PA.resolveNames(plan);
    assert.deepEqual([names.get('a'), names.get('b')], ['Compose', 'Compose_2']);
    assert.equal('__name' in plan.steps[0], false);
  });

  test('resolution matches what generation actually emits', () => {
    const plan = { steps: [step('compose', { inputs: '1' }), step('compose', { inputs: '2' })] };
    plan.steps[0].id = 'a'; plan.steps[1].id = 'b';
    const names = PA.resolveNames(plan);
    const { actions } = PA.buildActionsMap(plan);
    assert.deepEqual(Object.keys(actions), [names.get('a'), names.get('b')]);
  });
});

describe('the new validation rules', () => {
  const warns = p => PA.warningsOf(PA.validatePlan(p)).map(i => i.message);
  const errs = p => PA.errorsOf(PA.validatePlan(p)).map(i => i.message);

  test('an interpolated array source is flagged — @{} stringifies the value', () => {
    const bad = { steps: [step('foreach', { from: "@{body('X')?['value']}" }, { branches: { actions: [step('compose', { inputs: '1' })] } })] };
    assert.ok(warns(bad).some(m => /drop the braces/.test(m)));
  });

  test('a correct whole-value source is not flagged', () => {
    const good = { steps: [step('foreach', { from: "@body('X')?['value']" }, { branches: { actions: [step('compose', { inputs: '1' })] } })] };
    assert.equal(warns(good).some(m => /drop the braces/.test(m)), false);
  });

  test('a Response inside a loop is flagged — a run answers its caller once', () => {
    const p = { steps: [step('foreach', { from: "@body('X')" }, { branches: { actions: [step('response', { statusCode: 200 })] } })] };
    assert.ok(warns(p).some(m => /answer its caller only once/.test(m)));
  });

  test('a Response outside a loop is not flagged', () => {
    const p = { steps: [step('response', { statusCode: 200 })] };
    assert.equal(warns(p).some(m => /answer its caller only once/.test(m)), false);
  });

  test('initialising the same variable twice blocks generation', () => {
    const p = { steps: [step('initVariable', { name: 'ref', type: 'string' }), step('initVariable', { name: 'ref', type: 'string' })] };
    assert.ok(errs(p).some(m => /initialised twice/.test(m)));
  });
});
