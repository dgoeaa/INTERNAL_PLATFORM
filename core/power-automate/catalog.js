// The action catalog.
//
// Each entry knows three things: what to ask the operator for (`fields`), and how to turn
// those answers into the action definition the designer deserialises (`build`). Nothing
// here touches the DOM or the clipboard — the catalog is a pure description, which is what
// lets the same definitions drive the studio screen, the blueprints and the tests.
//
// `build(values, ctx)` returns the action WITHOUT its name or `runAfter`; assemble.js owns
// both, because ordering is a property of the plan rather than of any single action.
//
// A NOTE ON CONNECTOR OPERATION NAMES
// The `operationId` and `parameters` keys of a connector action come from that connector's
// published OpenAPI definition, and Microsoft revises them (that is why "Send an email"
// is SendEmailV2 and "Get emails" is GetEmailsV3). The entries below are the current
// operations for the SharePoint and Office 365 Outlook connectors. Where a tenant differs,
// the studio's "Learn from a copied action" path reads the real shape straight out of an
// action copied in the designer, so the catalog never has to be the last word.

import { Connectors, ConnectionAuthentication } from '../../config/power-automate.config.js';
import { coerce, buildCondition } from './expressions.js';

/** Drop keys whose value came back undefined so the JSON carries no empty parameters. */
const compact = obj => {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v;
  return out;
};

/** Turn a [{name,value}] list into an object, skipping rows with no name. */
const pairs = (rows, kind = 'text') => {
  const out = {};
  for (const r of rows || []) {
    const name = String(r?.name ?? '').trim();
    if (!name) continue;
    out[name] = coerce(r.value, kind) ?? '';
  }
  return out;
};

/** SharePoint writes item columns flattened as `item/InternalName`. */
const itemFields = rows => {
  const out = {};
  for (const r of rows || []) {
    const name = String(r?.name ?? '').trim();
    if (!name) continue;
    out[`item/${name}`] = coerce(r.value, 'text') ?? '';
  }
  return out;
};

/** Build the OpenApiConnection envelope a Power Automate cloud flow uses for a connector. */
const openApi = (connectorId, operationId, parameters) => {
  const c = Connectors[connectorId];
  return {
    type: 'OpenApiConnection',
    inputs: {
      host: { connectionName: c.connectionName, operationId, apiId: c.apiId },
      parameters: compact(parameters),
      authentication: ConnectionAuthentication
    }
  };
};

const f = (name, label, kind = 'text', extra = {}) => ({ name, label, kind, ...extra });

export const ActionGroups = Object.freeze([
  { id: 'control', label: 'Control' },
  { id: 'data', label: 'Data operations' },
  { id: 'variables', label: 'Variables' },
  { id: 'http', label: 'HTTP & Request' },
  { id: 'sharepoint', label: 'SharePoint' },
  { id: 'outlook', label: 'Office 365 Outlook' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'teams', label: 'Microsoft Teams' },
  { id: 'advanced', label: 'Advanced' }
]);

export const Actions = Object.freeze([
  // ── Control ──────────────────────────────────────────────────────────────────────
  {
    id: 'scope',
    label: 'Scope',
    group: 'control',
    type: 'Scope',
    summary: 'Groups actions so they run and fail as a unit.',
    branches: [{ key: 'actions', label: 'Actions' }],
    fields: [],
    build: (_v, ctx) => ({ type: 'Scope', actions: ctx.branch('actions') })
  },
  {
    id: 'condition',
    label: 'Condition',
    group: 'control',
    type: 'If',
    summary: 'Runs one branch or the other depending on a test.',
    branches: [{ key: 'actions', label: 'If yes' }, { key: 'else', label: 'If no' }],
    fields: [
      f('rows', 'Conditions', 'conditions', { required: true }),
      f('join', 'Match', 'select', { options: [['and', 'All conditions (AND)'], ['or', 'Any condition (OR)']], default: 'and' }),
      f('raw', 'Raw expression override', 'json', {
        help: 'Optional. Supply the condition object yourself, e.g. {"and":[{"equals":["@{x}","y"]}]}. Takes precedence over the rows above.'
      })
    ],
    build: (v, ctx) => ({
      type: 'If',
      expression: v.raw ? coerce(v.raw, 'json') : buildCondition(v.rows, v.join),
      actions: ctx.branch('actions'),
      else: { actions: ctx.branch('else') }
    })
  },
  {
    id: 'switch',
    label: 'Switch',
    group: 'control',
    type: 'Switch',
    summary: 'Routes to one case out of many by matching a value. The shape every DGO request flow uses.',
    dynamicCases: true,
    branches: [{ key: 'default', label: 'Default' }],
    fields: [
      f('on', 'Switch on', 'text', { required: true, placeholder: "@{triggerBody()?['action']}", help: 'The value each case is compared against.' }),
      f('cases', 'Cases', 'cases', { required: true, help: 'One branch per value. The case name becomes the label in the designer.' })
    ],
    build: (v, ctx) => ({
      type: 'Switch',
      expression: coerce(v.on, 'text'),
      cases: ctx.cases(),
      default: { actions: ctx.branch('default') }
    })
  },
  {
    id: 'foreach',
    label: 'Apply to each',
    group: 'control',
    type: 'Foreach',
    summary: 'Repeats its actions once per item in an array.',
    branches: [{ key: 'actions', label: 'Do' }],
    fields: [
      f('from', 'Select an output from previous steps', 'text', { required: true, wholeValue: true, placeholder: "@body('Get_items')?['value']" }),
      f('concurrency', 'Concurrency (parallel repetitions)', 'number', {
        help: 'Leave blank for the default sequential behaviour. 1–50 when set.'
      })
    ],
    build: (v, ctx) => {
      const a = { type: 'Foreach', foreach: coerce(v.from, 'text'), actions: ctx.branch('actions') };
      const n = coerce(v.concurrency, 'number');
      if (typeof n === 'number') a.runtimeConfiguration = { concurrency: { repetitions: n } };
      return a;
    }
  },
  {
    id: 'until',
    label: 'Do until',
    group: 'control',
    type: 'Until',
    summary: 'Repeats its actions until a test passes, or the limits are hit.',
    branches: [{ key: 'actions', label: 'Do' }],
    fields: [
      f('expression', 'Until this is true', 'text', { required: true, placeholder: "@equals(variables('done'), true)" }),
      f('count', 'Count limit', 'number', { default: 60 }),
      f('timeout', 'Timeout (ISO 8601 duration)', 'text', { default: 'PT1H', help: 'PT1H is one hour, P1D is one day.' })
    ],
    build: (v, ctx) => ({
      type: 'Until',
      expression: coerce(v.expression, 'text'),
      limit: compact({ count: coerce(v.count, 'number'), timeout: coerce(v.timeout, 'text') }),
      actions: ctx.branch('actions')
    })
  },
  {
    id: 'terminate',
    label: 'Terminate',
    group: 'control',
    type: 'Terminate',
    summary: 'Stops the run and sets its final status.',
    fields: [
      f('runStatus', 'Status', 'select', { required: true, default: 'Succeeded', options: [['Succeeded', 'Succeeded'], ['Failed', 'Failed'], ['Cancelled', 'Cancelled']] }),
      f('code', 'Error code', 'text', { help: 'Failed runs only.' }),
      f('message', 'Error message', 'textarea', { help: 'Failed runs only.' })
    ],
    build: v => {
      const inputs = { runStatus: coerce(v.runStatus, 'text') || 'Succeeded' };
      if (inputs.runStatus === 'Failed') {
        const err = compact({ code: coerce(v.code, 'text'), message: coerce(v.message, 'text') });
        if (Object.keys(err).length) inputs.runError = err;
      }
      return { type: 'Terminate', inputs };
    }
  },
  {
    id: 'delay',
    label: 'Delay',
    group: 'control',
    type: 'Wait',
    summary: 'Waits before continuing.',
    fields: [
      f('count', 'Count', 'number', { required: true, default: 1 }),
      f('unit', 'Unit', 'select', { required: true, default: 'Minute', options: [['Second', 'Second'], ['Minute', 'Minute'], ['Hour', 'Hour'], ['Day', 'Day'], ['Week', 'Week']] })
    ],
    build: v => ({ type: 'Wait', inputs: { interval: compact({ count: coerce(v.count, 'number'), unit: coerce(v.unit, 'text') }) } })
  },

  // ── Data operations ──────────────────────────────────────────────────────────────
  {
    id: 'compose',
    label: 'Compose',
    group: 'data',
    type: 'Compose',
    summary: 'Holds a value so later actions can reference it once instead of recomputing it.',
    fields: [f('inputs', 'Inputs', 'json', { required: true, rows: 6, help: 'JSON, or a single expression such as @{triggerBody()}.' })],
    build: v => ({ type: 'Compose', inputs: coerce(v.inputs, 'json') })
  },
  {
    id: 'parseJson',
    label: 'Parse JSON',
    group: 'data',
    type: 'ParseJson',
    summary: 'Types a JSON payload so its fields become pickable tokens downstream.',
    fields: [
      f('content', 'Content', 'text', { required: true, wholeValue: true, placeholder: '@triggerBody()' }),
      f('schema', 'Schema', 'json', { required: true, rows: 10, inferFromSample: true, help: 'A JSON Schema. Paste a sample payload below and the studio infers it.' })
    ],
    build: v => ({ type: 'ParseJson', inputs: compact({ content: coerce(v.content, 'text'), schema: coerce(v.schema, 'json') }) })
  },
  {
    id: 'filterArray',
    label: 'Filter array',
    group: 'data',
    type: 'Query',
    summary: 'Keeps only the array items that pass a test.',
    fields: [
      f('from', 'From', 'text', { required: true, wholeValue: true, placeholder: "@body('Get_items')?['value']" }),
      f('rows', 'Conditions', 'conditions', { required: true }),
      f('join', 'Match', 'select', { options: [['and', 'All conditions (AND)'], ['or', 'Any condition (OR)']], default: 'and' })
    ],
    build: v => ({ type: 'Query', inputs: { from: coerce(v.from, 'text'), where: buildCondition(v.rows, v.join) } })
  },
  {
    id: 'select',
    label: 'Select',
    group: 'data',
    type: 'Select',
    summary: 'Reshapes every item of an array into a new shape.',
    fields: [
      f('from', 'From', 'text', { required: true, wholeValue: true, placeholder: "@body('Get_items')?['value']" }),
      f('map', 'Map', 'keyvalue', { required: true, help: "Property name on the left, expression on the right — e.g. Reference / @item()?['Ref']" })
    ],
    build: v => ({ type: 'Select', inputs: { from: coerce(v.from, 'text'), select: pairs(v.map) } })
  },
  {
    id: 'join',
    label: 'Join',
    group: 'data',
    type: 'Join',
    summary: 'Joins an array into a single delimited string.',
    fields: [
      f('from', 'From', 'text', { required: true, wholeValue: true }),
      f('joinWith', 'Join with', 'text', { required: true, default: ', ' })
    ],
    build: v => ({ type: 'Join', inputs: { from: coerce(v.from, 'text'), joinWith: coerce(v.joinWith, 'text') ?? ', ' } })
  },
  {
    id: 'createTable',
    label: 'Create HTML or CSV table',
    group: 'data',
    type: 'Table',
    summary: 'Renders an array as a table — the usual body of a summary email.',
    fields: [
      f('from', 'From', 'text', { required: true, wholeValue: true }),
      f('format', 'Format', 'select', { required: true, default: 'HTML', options: [['HTML', 'HTML'], ['CSV', 'CSV']] })
    ],
    build: v => ({ type: 'Table', inputs: { from: coerce(v.from, 'text'), format: coerce(v.format, 'text') || 'HTML' } })
  },

  // ── Variables ────────────────────────────────────────────────────────────────────
  {
    id: 'initVariable',
    label: 'Initialize variable',
    group: 'variables',
    type: 'InitializeVariable',
    summary: 'Declares a variable. Must sit at the top level of the flow, never inside a scope or loop.',
    topLevelOnly: true,
    fields: [
      f('name', 'Name', 'text', { required: true }),
      f('type', 'Type', 'select', { required: true, default: 'string', options: [['string', 'String'], ['integer', 'Integer'], ['float', 'Float'], ['boolean', 'Boolean'], ['array', 'Array'], ['object', 'Object']] }),
      f('value', 'Value', 'json', { help: 'Optional initial value, typed to match.' })
    ],
    build: v => {
      const type = coerce(v.type, 'text') || 'string';
      const kind = type === 'array' || type === 'object' ? 'json'
        : type === 'boolean' ? 'boolean'
        : type === 'integer' || type === 'float' ? 'number' : 'text';
      return { type: 'InitializeVariable', inputs: { variables: [compact({ name: coerce(v.name, 'text'), type, value: coerce(v.value, kind) })] } };
    }
  },
  {
    id: 'setVariable',
    label: 'Set variable',
    group: 'variables',
    type: 'SetVariable',
    summary: 'Replaces the value of an already-initialised variable.',
    fields: [f('name', 'Name', 'text', { required: true }), f('value', 'Value', 'json', { required: true })],
    build: v => ({ type: 'SetVariable', inputs: { name: coerce(v.name, 'text'), value: coerce(v.value, 'json') } })
  },
  {
    id: 'incrementVariable',
    label: 'Increment variable',
    group: 'variables',
    type: 'IncrementVariable',
    summary: 'Adds to a numeric variable.',
    fields: [f('name', 'Name', 'text', { required: true }), f('value', 'Increment by', 'number', { default: 1 })],
    build: v => ({ type: 'IncrementVariable', inputs: compact({ name: coerce(v.name, 'text'), value: coerce(v.value, 'number') }) })
  },
  {
    id: 'appendArray',
    label: 'Append to array variable',
    group: 'variables',
    type: 'AppendToArrayVariable',
    summary: 'Adds one item to an array variable — how a loop accumulates results.',
    fields: [f('name', 'Name', 'text', { required: true }), f('value', 'Value', 'json', { required: true })],
    build: v => ({ type: 'AppendToArrayVariable', inputs: { name: coerce(v.name, 'text'), value: coerce(v.value, 'json') } })
  },
  {
    id: 'appendString',
    label: 'Append to string variable',
    group: 'variables',
    type: 'AppendToStringVariable',
    summary: 'Adds text to a string variable.',
    fields: [f('name', 'Name', 'text', { required: true }), f('value', 'Value', 'textarea', { required: true })],
    build: v => ({ type: 'AppendToStringVariable', inputs: { name: coerce(v.name, 'text'), value: coerce(v.value, 'text') } })
  },

  // ── HTTP & Request ───────────────────────────────────────────────────────────────
  {
    id: 'http',
    label: 'HTTP',
    group: 'http',
    type: 'Http',
    summary: 'Calls an external endpoint.',
    fields: [
      f('method', 'Method', 'select', { required: true, default: 'POST', options: [['GET', 'GET'], ['POST', 'POST'], ['PUT', 'PUT'], ['PATCH', 'PATCH'], ['DELETE', 'DELETE']] }),
      f('uri', 'URI', 'text', { required: true }),
      f('headers', 'Headers', 'keyvalue'),
      f('queries', 'Queries', 'keyvalue'),
      f('body', 'Body', 'json', { rows: 6 })
    ],
    build: v => ({
      type: 'Http',
      inputs: compact({
        method: coerce(v.method, 'text'),
        uri: coerce(v.uri, 'text'),
        headers: (v.headers || []).length ? pairs(v.headers) : undefined,
        queries: (v.queries || []).length ? pairs(v.queries) : undefined,
        body: coerce(v.body, 'json')
      })
    })
  },
  {
    id: 'response',
    label: 'Response',
    group: 'http',
    type: 'Response',
    summary: 'Replies to the caller of a request-triggered flow. Every DGO endpoint ends in one.',
    fields: [
      f('statusCode', 'Status code', 'number', { required: true, default: 200 }),
      f('headers', 'Headers', 'keyvalue'),
      f('body', 'Body', 'json', { rows: 6 })
    ],
    build: v => ({
      type: 'Response',
      kind: 'Http',
      inputs: compact({
        statusCode: coerce(v.statusCode, 'number') ?? 200,
        headers: (v.headers || []).length ? pairs(v.headers) : undefined,
        body: coerce(v.body, 'json')
      })
    })
  },

  // ── SharePoint ───────────────────────────────────────────────────────────────────
  {
    id: 'sp.getItems',
    label: 'Get items',
    group: 'sharepoint',
    connector: 'sharepoint',
    type: 'OpenApiConnection',
    summary: 'Reads list items, optionally filtered.',
    fields: [
      f('dataset', 'Site address', 'text', { required: true, placeholder: 'https://contoso.sharepoint.com/sites/DGO' }),
      f('table', 'List name or GUID', 'text', { required: true }),
      f('filter', 'Filter query', 'text', { placeholder: "Status eq 'Open'" }),
      f('orderby', 'Order by', 'text'),
      f('top', 'Top count', 'number'),
      f('select', 'Limit columns by view / $select', 'text')
    ],
    build: v => openApi('sharepoint', 'GetItems', {
      dataset: coerce(v.dataset, 'text'),
      table: coerce(v.table, 'text'),
      $filter: coerce(v.filter, 'text'),
      $orderby: coerce(v.orderby, 'text'),
      $top: coerce(v.top, 'number'),
      $select: coerce(v.select, 'text')
    })
  },
  {
    id: 'sp.getItem',
    label: 'Get item',
    group: 'sharepoint',
    connector: 'sharepoint',
    type: 'OpenApiConnection',
    summary: 'Reads one list item by id.',
    fields: [
      f('dataset', 'Site address', 'text', { required: true }),
      f('table', 'List name or GUID', 'text', { required: true }),
      f('id', 'Id', 'text', { required: true })
    ],
    build: v => openApi('sharepoint', 'GetItem', { dataset: coerce(v.dataset, 'text'), table: coerce(v.table, 'text'), id: coerce(v.id, 'text') })
  },
  {
    id: 'sp.createItem',
    label: 'Create item',
    group: 'sharepoint',
    connector: 'sharepoint',
    type: 'OpenApiConnection',
    summary: 'Adds a list item.',
    fields: [
      f('dataset', 'Site address', 'text', { required: true }),
      f('table', 'List name or GUID', 'text', { required: true }),
      f('item', 'Columns', 'fieldmap', { required: true, help: 'Column INTERNAL name on the left (Title, DGO_Reference), value on the right.' })
    ],
    build: v => openApi('sharepoint', 'PostItem', { dataset: coerce(v.dataset, 'text'), table: coerce(v.table, 'text'), ...itemFields(v.item) })
  },
  {
    id: 'sp.updateItem',
    label: 'Update item',
    group: 'sharepoint',
    connector: 'sharepoint',
    type: 'OpenApiConnection',
    summary: 'Updates a list item by id.',
    fields: [
      f('dataset', 'Site address', 'text', { required: true }),
      f('table', 'List name or GUID', 'text', { required: true }),
      f('id', 'Id', 'text', { required: true }),
      f('item', 'Columns', 'fieldmap', { required: true })
    ],
    build: v => openApi('sharepoint', 'PatchItem', { dataset: coerce(v.dataset, 'text'), table: coerce(v.table, 'text'), id: coerce(v.id, 'text'), ...itemFields(v.item) })
  },
  {
    id: 'sp.deleteItem',
    label: 'Delete item',
    group: 'sharepoint',
    connector: 'sharepoint',
    type: 'OpenApiConnection',
    summary: 'Deletes a list item by id.',
    fields: [
      f('dataset', 'Site address', 'text', { required: true }),
      f('table', 'List name or GUID', 'text', { required: true }),
      f('id', 'Id', 'text', { required: true })
    ],
    build: v => openApi('sharepoint', 'DeleteItem', { dataset: coerce(v.dataset, 'text'), table: coerce(v.table, 'text'), id: coerce(v.id, 'text') })
  },
  {
    id: 'sp.getAttachments',
    label: 'Get attachments',
    group: 'sharepoint',
    connector: 'sharepoint',
    type: 'OpenApiConnection',
    summary: 'Lists the attachments on a list item.',
    fields: [
      f('dataset', 'Site address', 'text', { required: true }),
      f('table', 'List name or GUID', 'text', { required: true }),
      f('id', 'Id', 'text', { required: true })
    ],
    build: v => openApi('sharepoint', 'GetAttachments', { dataset: coerce(v.dataset, 'text'), table: coerce(v.table, 'text'), id: coerce(v.id, 'text') })
  },
  {
    id: 'sp.createFile',
    label: 'Create file',
    group: 'sharepoint',
    connector: 'sharepoint',
    type: 'OpenApiConnection',
    summary: 'Writes a file into a document library.',
    fields: [
      f('dataset', 'Site address', 'text', { required: true }),
      f('folderPath', 'Folder path', 'text', { required: true, placeholder: '/Shared Documents/Correspondence' }),
      f('name', 'File name', 'text', { required: true }),
      f('body', 'File content', 'text', { required: true, placeholder: "@base64ToBinary(triggerBody()?['content'])" })
    ],
    build: v => openApi('sharepoint', 'CreateFile', {
      dataset: coerce(v.dataset, 'text'),
      folderPath: coerce(v.folderPath, 'text'),
      name: coerce(v.name, 'text'),
      body: coerce(v.body, 'text')
    })
  },
  {
    id: 'sp.httpRequest',
    label: 'Send an HTTP request to SharePoint',
    group: 'sharepoint',
    connector: 'sharepoint',
    type: 'OpenApiConnection',
    summary: 'Calls the SharePoint REST API directly — the escape hatch when no connector action fits.',
    fields: [
      f('dataset', 'Site address', 'text', { required: true }),
      f('method', 'Method', 'select', { required: true, default: 'GET', options: [['GET', 'GET'], ['POST', 'POST'], ['PATCH', 'PATCH'], ['DELETE', 'DELETE']] }),
      f('uri', 'Uri', 'text', { required: true, placeholder: "_api/web/lists/getbytitle('Correspondence')/items" }),
      f('headers', 'Headers', 'keyvalue'),
      f('body', 'Body', 'json', { rows: 5 })
    ],
    build: v => openApi('sharepoint', 'HttpRequest', {
      dataset: coerce(v.dataset, 'text'),
      'parameters/method': coerce(v.method, 'text'),
      'parameters/uri': coerce(v.uri, 'text'),
      'parameters/headers': (v.headers || []).length ? pairs(v.headers) : undefined,
      'parameters/body': coerce(v.body, 'json')
    })
  },

  // ── Office 365 Outlook ───────────────────────────────────────────────────────────
  {
    id: 'o365.sendEmail',
    label: 'Send an email (V2)',
    group: 'outlook',
    connector: 'office365',
    type: 'OpenApiConnection',
    summary: 'Sends mail from the connected mailbox.',
    fields: [
      f('to', 'To', 'text', { required: true, help: 'Semicolon-separated.' }),
      f('subject', 'Subject', 'text', { required: true }),
      f('body', 'Body', 'textarea', { required: true, rows: 8, help: 'HTML is accepted.' }),
      f('cc', 'CC', 'text'),
      f('bcc', 'BCC', 'text'),
      f('replyTo', 'Reply to', 'text'),
      f('importance', 'Importance', 'select', { default: 'Normal', options: [['Low', 'Low'], ['Normal', 'Normal'], ['High', 'High']] }),
      f('attachments', 'Attachments', 'json', { help: "Array of {Name, ContentBytes}, or an expression producing one." })
    ],
    build: v => openApi('office365', 'SendEmailV2', {
      'emailMessage/To': coerce(v.to, 'text'),
      'emailMessage/Subject': coerce(v.subject, 'text'),
      'emailMessage/Body': coerce(v.body, 'text'),
      'emailMessage/Cc': coerce(v.cc, 'text'),
      'emailMessage/Bcc': coerce(v.bcc, 'text'),
      'emailMessage/ReplyTo': coerce(v.replyTo, 'text'),
      'emailMessage/Importance': coerce(v.importance, 'text'),
      'emailMessage/Attachments': coerce(v.attachments, 'json')
    })
  },
  {
    id: 'decrementVariable',
    label: 'Decrement variable',
    group: 'variables',
    type: 'DecrementVariable',
    summary: 'Subtracts from a numeric variable.',
    fields: [f('name', 'Name', 'text', { required: true }), f('value', 'Decrement by', 'number', { default: 1 })],
    build: v => ({ type: 'DecrementVariable', inputs: compact({ name: coerce(v.name, 'text'), value: coerce(v.value, 'number') }) })
  },
  {
    id: 'delayUntil',
    label: 'Delay until',
    group: 'control',
    type: 'Wait',
    summary: 'Waits until a specific moment rather than for a duration.',
    fields: [f('timestamp', 'Timestamp', 'text', { required: true, placeholder: '@{addDays(utcNow(), 1)}', help: 'An ISO 8601 UTC timestamp.' })],
    build: v => ({ type: 'Wait', inputs: { until: { timestamp: coerce(v.timestamp, 'text') } } })
  },

  // ── SharePoint files ─────────────────────────────────────────────────────────────
  {
    id: 'sp.getFileContent',
    label: 'Get file content',
    group: 'sharepoint',
    connector: 'sharepoint',
    type: 'OpenApiConnection',
    summary: 'Reads a file’s bytes by its identifier.',
    fields: [
      f('dataset', 'Site address', 'text', { required: true }),
      f('id', 'File identifier', 'text', { required: true }),
      f('inferContentType', 'Infer content type', 'boolean', { default: true })
    ],
    build: v => openApi('sharepoint', 'GetFileContent', {
      dataset: coerce(v.dataset, 'text'), id: coerce(v.id, 'text'), inferContentType: coerce(v.inferContentType, 'boolean')
    })
  },
  {
    id: 'sp.getFileContentByPath',
    label: 'Get file content using path',
    group: 'sharepoint',
    connector: 'sharepoint',
    type: 'OpenApiConnection',
    summary: 'Reads a file’s bytes by its server-relative path.',
    fields: [
      f('dataset', 'Site address', 'text', { required: true }),
      f('path', 'File path', 'text', { required: true, placeholder: '/Shared Documents/Correspondence/letter.pdf' }),
      f('inferContentType', 'Infer content type', 'boolean', { default: true })
    ],
    build: v => openApi('sharepoint', 'GetFileContentByPath', {
      dataset: coerce(v.dataset, 'text'), path: coerce(v.path, 'text'), inferContentType: coerce(v.inferContentType, 'boolean')
    })
  },
  {
    id: 'sp.getFileMetadata',
    label: 'Get file metadata',
    group: 'sharepoint',
    connector: 'sharepoint',
    type: 'OpenApiConnection',
    summary: 'Reads a file’s name, size, path and timestamps without its bytes.',
    fields: [
      f('dataset', 'Site address', 'text', { required: true }),
      f('id', 'File identifier', 'text', { required: true })
    ],
    build: v => openApi('sharepoint', 'GetFileMetadata', { dataset: coerce(v.dataset, 'text'), id: coerce(v.id, 'text') })
  },
  {
    id: 'sp.updateFile',
    label: 'Update file',
    group: 'sharepoint',
    connector: 'sharepoint',
    type: 'OpenApiConnection',
    summary: 'Replaces the contents of an existing file.',
    fields: [
      f('dataset', 'Site address', 'text', { required: true }),
      f('id', 'File identifier', 'text', { required: true }),
      f('body', 'File content', 'text', { required: true })
    ],
    build: v => openApi('sharepoint', 'UpdateFile', { dataset: coerce(v.dataset, 'text'), id: coerce(v.id, 'text'), body: coerce(v.body, 'text') })
  },
  {
    id: 'sp.addAttachment',
    label: 'Add attachment',
    group: 'sharepoint',
    connector: 'sharepoint',
    type: 'OpenApiConnection',
    summary: 'Attaches a file to a list item — how scanned evidence lands on a correspondence record.',
    fields: [
      f('dataset', 'Site address', 'text', { required: true }),
      f('table', 'List name or GUID', 'text', { required: true }),
      f('id', 'Item id', 'text', { required: true }),
      f('name', 'File name', 'text', { required: true }),
      f('content', 'File content', 'text', { required: true })
    ],
    build: v => openApi('sharepoint', 'AddAttachment', {
      dataset: coerce(v.dataset, 'text'), table: coerce(v.table, 'text'), id: coerce(v.id, 'text'),
      'body/Name': coerce(v.name, 'text'), 'body/ContentBytes': coerce(v.content, 'text')
    })
  },

  // ── Outlook, beyond sending ──────────────────────────────────────────────────────
  {
    id: 'o365.reply',
    label: 'Reply to email (V3)',
    group: 'outlook',
    connector: 'office365',
    type: 'OpenApiConnection',
    summary: 'Replies in-thread, which is what keeps a correspondence exchange together in the recipient’s mailbox.',
    fields: [
      f('messageId', 'Message id', 'text', { required: true, placeholder: "@{triggerOutputs()?['body/id']}" }),
      f('body', 'Body', 'textarea', { required: true, rows: 6 }),
      f('replyAll', 'Reply all', 'boolean', { default: false }),
      f('to', 'To (override)', 'text'),
      f('subject', 'Subject (override)', 'text')
    ],
    build: v => openApi('office365', 'ReplyToV3', {
      messageId: coerce(v.messageId, 'text'),
      'body/Body': coerce(v.body, 'text'),
      'body/ReplyAll': coerce(v.replyAll, 'boolean'),
      'body/To': coerce(v.to, 'text'),
      'body/Subject': coerce(v.subject, 'text')
    })
  },
  {
    id: 'o365.markAsRead',
    label: 'Mark as read or unread (V3)',
    group: 'outlook',
    connector: 'office365',
    type: 'OpenApiConnection',
    summary: 'Stops an intake flow reprocessing the same message.',
    fields: [
      f('messageId', 'Message id', 'text', { required: true }),
      f('isRead', 'Mark as read', 'boolean', { default: true })
    ],
    build: v => openApi('office365', 'MarkAsReadV3', { messageId: coerce(v.messageId, 'text'), isRead: coerce(v.isRead, 'boolean') })
  },
  {
    id: 'o365.moveEmail',
    label: 'Move email (V2)',
    group: 'outlook',
    connector: 'office365',
    type: 'OpenApiConnection',
    summary: 'Files a processed message out of the inbox.',
    fields: [
      f('messageId', 'Message id', 'text', { required: true }),
      f('folderPath', 'Destination folder', 'text', { required: true, placeholder: 'Processed' })
    ],
    build: v => openApi('office365', 'MoveEmailV2', { messageId: coerce(v.messageId, 'text'), folderPath: coerce(v.folderPath, 'text') })
  },
  {
    id: 'o365.sendApproval',
    label: 'Send approval email',
    group: 'outlook',
    connector: 'office365',
    type: 'OpenApiConnection',
    summary: 'An email carrying response buttons. Lighter than the Approvals connector — no approval record is kept.',
    fields: [
      f('to', 'To', 'text', { required: true }),
      f('subject', 'Subject', 'text', { required: true }),
      f('options', 'Options', 'text', { required: true, default: 'Approve, Reject', help: 'Comma-separated. Each becomes a button.' }),
      f('body', 'Body', 'textarea', { rows: 6 }),
      f('headerText', 'Header text', 'text'),
      f('importance', 'Importance', 'select', { default: 'Normal', options: [['Low', 'Low'], ['Normal', 'Normal'], ['High', 'High']] })
    ],
    build: v => openApi('office365', 'SendApprovalMail', {
      'emailMessage/To': coerce(v.to, 'text'),
      'emailMessage/Subject': coerce(v.subject, 'text'),
      'emailMessage/Options': coerce(v.options, 'text'),
      'emailMessage/Body': coerce(v.body, 'text'),
      'emailMessage/HeaderText': coerce(v.headerText, 'text'),
      'emailMessage/Importance': coerce(v.importance, 'text')
    })
  },

  // ── Approvals ────────────────────────────────────────────────────────────────────
  {
    id: 'approvals.startAndWait',
    label: 'Start and wait for an approval',
    group: 'approvals',
    connector: 'approvals',
    type: 'OpenApiConnection',
    summary: 'Creates a tracked approval and pauses the run until it is answered. The flow half of Review & Approval.',
    fields: [
      f('approvalType', 'Approval type', 'select', {
        required: true, default: 'Basic',
        options: [['Basic', 'Approve/Reject — first to respond'], ['BasicAwaitAll', 'Approve/Reject — everyone must approve'],
                  ['CustomResponses', 'Custom responses — wait for one'], ['CustomResponsesAwaitAll', 'Custom responses — wait for all']]
      }),
      f('title', 'Title', 'text', { required: true }),
      f('assignedTo', 'Assigned to', 'text', { required: true, help: 'Semicolon-separated addresses.' }),
      f('details', 'Details', 'textarea', { rows: 5 }),
      f('itemLink', 'Item link', 'text'),
      f('itemLinkDescription', 'Item link description', 'text'),
      f('requestor', 'Requestor', 'text'),
      f('enableNotifications', 'Send notifications', 'boolean', { default: true }),
      f('enableReassignment', 'Allow reassignment', 'boolean', { default: true })
    ],
    build: v => openApi('approvals', 'StartAndWaitForAnApproval', {
      approvalType: coerce(v.approvalType, 'text'),
      'ApprovalCreationInput/title': coerce(v.title, 'text'),
      'ApprovalCreationInput/assignedTo': coerce(v.assignedTo, 'text'),
      'ApprovalCreationInput/details': coerce(v.details, 'text'),
      'ApprovalCreationInput/itemLink': coerce(v.itemLink, 'text'),
      'ApprovalCreationInput/itemLinkDescription': coerce(v.itemLinkDescription, 'text'),
      'ApprovalCreationInput/requestor': coerce(v.requestor, 'text'),
      'ApprovalCreationInput/enableNotifications': coerce(v.enableNotifications, 'boolean'),
      'ApprovalCreationInput/enableReassignment': coerce(v.enableReassignment, 'boolean')
    })
  },
  {
    id: 'approvals.start',
    label: 'Create an approval (do not wait)',
    group: 'approvals',
    connector: 'approvals',
    type: 'OpenApiConnection',
    summary: 'Creates the approval and carries on — for when the response is handled by a separate flow.',
    fields: [
      f('approvalType', 'Approval type', 'select', {
        required: true, default: 'Basic',
        options: [['Basic', 'Approve/Reject — first to respond'], ['BasicAwaitAll', 'Approve/Reject — everyone must approve'],
                  ['CustomResponses', 'Custom responses — wait for one'], ['CustomResponsesAwaitAll', 'Custom responses — wait for all']]
      }),
      f('title', 'Title', 'text', { required: true }),
      f('assignedTo', 'Assigned to', 'text', { required: true }),
      f('details', 'Details', 'textarea', { rows: 5 }),
      f('itemLink', 'Item link', 'text'),
      f('requestor', 'Requestor', 'text')
    ],
    build: v => openApi('approvals', 'StartAnApproval', {
      approvalType: coerce(v.approvalType, 'text'),
      'ApprovalCreationInput/title': coerce(v.title, 'text'),
      'ApprovalCreationInput/assignedTo': coerce(v.assignedTo, 'text'),
      'ApprovalCreationInput/details': coerce(v.details, 'text'),
      'ApprovalCreationInput/itemLink': coerce(v.itemLink, 'text'),
      'ApprovalCreationInput/requestor': coerce(v.requestor, 'text')
    })
  },

  // ── Teams ────────────────────────────────────────────────────────────────────────
  {
    id: 'teams.postMessage',
    label: 'Post message in a chat or channel',
    group: 'teams',
    connector: 'teams',
    type: 'OpenApiConnection',
    summary: 'Notifies a directorate channel without an email.',
    fields: [
      f('poster', 'Post as', 'select', { required: true, default: 'Flow bot', options: [['Flow bot', 'Flow bot'], ['User', 'User']] }),
      f('location', 'Post in', 'select', { required: true, default: 'Channel', options: [['Channel', 'Channel'], ['Group chat', 'Group chat'], ['Chat with Flow bot', 'Chat with Flow bot']] }),
      f('groupId', 'Team', 'text', { required: true, help: 'Team id. For a group chat, the conversation id.' }),
      f('channelId', 'Channel', 'text', { help: 'Channel id. Leave blank for a group chat.' }),
      f('message', 'Message', 'textarea', { required: true, rows: 5, help: 'HTML is accepted.' })
    ],
    build: v => openApi('teams', 'PostMessageToConversation', {
      poster: coerce(v.poster, 'text'),
      location: coerce(v.location, 'text'),
      'body/recipient/groupId': coerce(v.groupId, 'text'),
      'body/recipient/channelId': coerce(v.channelId, 'text'),
      'body/messageBody': coerce(v.message, 'text')
    })
  },

  // ── Advanced ─────────────────────────────────────────────────────────────────────
  {
    id: 'raw',
    label: 'Raw action definition',
    group: 'advanced',
    type: 'Raw',
    summary: 'Any action, supplied as its own definition JSON — the answer when the catalog does not cover it.',
    fields: [
      f('definition', 'Action definition', 'json', {
        required: true, rows: 12,
        help: 'Paste what Peek code shows for the action in the designer, without the outer name. runAfter is ignored — ordering comes from this plan.'
      })
    ],
    build: v => {
      const d = coerce(v.definition, 'json');
      if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('Action definition must be a JSON object.');
      if (typeof d.type !== 'string') throw new Error('Action definition needs a "type" property (Compose, OpenApiConnection, …).');
      const { runAfter, ...rest } = d;
      return rest;
    }
  },
  {
    id: 'o365.getEmails',
    label: 'Get emails (V3)',
    group: 'outlook',
    connector: 'office365',
    type: 'OpenApiConnection',
    summary: 'Reads mail from a folder — the intake side of the correspondence email desk.',
    fields: [
      f('folderPath', 'Folder', 'text', { required: true, default: 'Inbox' }),
      f('fetchOnlyUnread', 'Only unread', 'boolean', { default: true }),
      f('includeAttachments', 'Include attachments', 'boolean', { default: false }),
      f('subjectFilter', 'Subject filter', 'text'),
      f('from', 'From', 'text'),
      f('top', 'Top', 'number', { default: 25 })
    ],
    build: v => openApi('office365', 'GetEmailsV3', {
      folderPath: coerce(v.folderPath, 'text'),
      fetchOnlyUnread: coerce(v.fetchOnlyUnread, 'boolean'),
      includeAttachments: coerce(v.includeAttachments, 'boolean'),
      subjectFilter: coerce(v.subjectFilter, 'text'),
      from: coerce(v.from, 'text'),
      top: coerce(v.top, 'number')
    })
  }
]);

export const actionById = id => Actions.find(a => a.id === id) || null;
export const actionsInGroup = groupId => Actions.filter(a => a.group === groupId);
export const isContainer = action => Array.isArray(action?.branches) && action.branches.length > 0;
/** Default values for a newly added step, taken from the field declarations. */
export const defaultValues = action => {
  const out = {};
  for (const fd of action?.fields || []) {
    if (fd.default !== undefined) out[fd.name] = fd.default;
    else if (fd.kind === 'keyvalue' || fd.kind === 'fieldmap' || fd.kind === 'conditions' || fd.kind === 'cases') out[fd.name] = [];
  }
  return out;
};
