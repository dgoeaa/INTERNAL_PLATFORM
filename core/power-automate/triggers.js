// Trigger catalog.
//
// Triggers exist here on a different footing from actions, and the reason is worth stating:
// the designer's paste path creates ACTIONS ONLY. There is no clipboard shape that adds a
// trigger — pasteScopeOperation splices its node into the action graph, and a workflow's
// trigger is not in that graph. A generated trigger therefore reaches a flow one way only,
// through the definition JSON (code view / import), never through a paste.
//
// So these are offered alongside the definition export and are never folded into a payload.
// The studio says which is which rather than letting someone copy a trigger and wonder why
// nothing appeared.

import { Connectors, ConnectionAuthentication } from '../../config/power-automate.config.js';
import { coerce } from './expressions.js';

const openApiTrigger = (connectorId, operationId, parameters, recurrence) => {
  const c = Connectors[connectorId];
  const t = {
    type: 'OpenApiConnection',
    inputs: {
      host: { connectionName: c.connectionName, operationId, apiId: c.apiId },
      parameters,
      authentication: ConnectionAuthentication
    }
  };
  // A connector trigger that polls carries its own recurrence; the service will not start it
  // without one, and the designer shows the interval on the trigger card.
  if (recurrence) t.recurrence = recurrence;
  return t;
};

const f = (name, label, kind = 'text', extra = {}) => ({ name, label, kind, ...extra });

export const Triggers = Object.freeze([
  {
    id: 'request',
    label: 'When an HTTP request is received',
    summary: 'The trigger behind every DGO endpoint. The blueprints generate this one for you with the platform’s request schema.',
    fields: [
      f('method', 'Method', 'select', { default: 'POST', options: [['POST', 'POST'], ['GET', 'GET'], ['PUT', 'PUT'], ['PATCH', 'PATCH'], ['DELETE', 'DELETE']] }),
      f('schema', 'Request body schema', 'json', { rows: 10, inferFromSample: true, help: 'A JSON Schema. Paste a sample request body below and the studio infers it.' })
    ],
    build: v => ({
      name: 'manual',
      definition: {
        type: 'Request',
        kind: 'Http',
        inputs: { schema: coerce(v.schema, 'json') || {}, method: coerce(v.method, 'text') || 'POST' }
      }
    })
  },
  {
    id: 'recurrence',
    label: 'Recurrence',
    summary: 'Runs on a schedule.',
    fields: [
      f('frequency', 'Frequency', 'select', { default: 'Day', options: [['Minute', 'Minute'], ['Hour', 'Hour'], ['Day', 'Day'], ['Week', 'Week'], ['Month', 'Month']] }),
      f('interval', 'Interval', 'number', { default: 1 }),
      f('timeZone', 'Time zone', 'text', { placeholder: 'W. Central Africa Standard Time' }),
      f('startTime', 'Start time', 'text', { placeholder: '2026-01-01T06:00:00Z' })
    ],
    build: v => {
      const recurrence = { frequency: coerce(v.frequency, 'text') || 'Day', interval: coerce(v.interval, 'number') ?? 1 };
      const tz = coerce(v.timeZone, 'text'); if (tz) recurrence.timeZone = tz;
      const st = coerce(v.startTime, 'text'); if (st) recurrence.startTime = st;
      return { name: 'Recurrence', definition: { type: 'Recurrence', recurrence } };
    }
  },
  {
    id: 'sp.itemCreated',
    label: 'When an item is created (SharePoint)',
    connector: 'sharepoint',
    summary: 'Polls a list for new items.',
    fields: [
      f('dataset', 'Site address', 'text', { required: true }),
      f('table', 'List name or GUID', 'text', { required: true }),
      f('frequency', 'Check every', 'select', { default: 'Minute', options: [['Minute', 'Minute'], ['Hour', 'Hour'], ['Day', 'Day']] }),
      f('interval', 'Interval', 'number', { default: 1 })
    ],
    build: v => ({
      name: 'When_an_item_is_created',
      definition: openApiTrigger('sharepoint', 'GetOnNewItems',
        { dataset: coerce(v.dataset, 'text'), table: coerce(v.table, 'text') },
        { frequency: coerce(v.frequency, 'text') || 'Minute', interval: coerce(v.interval, 'number') ?? 1 })
    })
  },
  {
    id: 'sp.itemCreatedOrModified',
    label: 'When an item is created or modified (SharePoint)',
    connector: 'sharepoint',
    summary: 'Polls a list for new and changed items.',
    fields: [
      f('dataset', 'Site address', 'text', { required: true }),
      f('table', 'List name or GUID', 'text', { required: true }),
      f('frequency', 'Check every', 'select', { default: 'Minute', options: [['Minute', 'Minute'], ['Hour', 'Hour'], ['Day', 'Day']] }),
      f('interval', 'Interval', 'number', { default: 1 })
    ],
    build: v => ({
      name: 'When_an_item_is_created_or_modified',
      definition: openApiTrigger('sharepoint', 'GetOnUpdatedItems',
        { dataset: coerce(v.dataset, 'text'), table: coerce(v.table, 'text') },
        { frequency: coerce(v.frequency, 'text') || 'Minute', interval: coerce(v.interval, 'number') ?? 1 })
    })
  },
  {
    id: 'o365.newEmail',
    label: 'When a new email arrives (V3)',
    connector: 'office365',
    summary: 'The intake side of the correspondence email desk.',
    fields: [
      f('folderPath', 'Folder', 'text', { default: 'Inbox' }),
      f('fetchOnlyUnread', 'Only unread', 'boolean', { default: true }),
      f('includeAttachments', 'Include attachments', 'boolean', { default: false }),
      f('subjectFilter', 'Subject filter', 'text'),
      f('frequency', 'Check every', 'select', { default: 'Minute', options: [['Minute', 'Minute'], ['Hour', 'Hour']] }),
      f('interval', 'Interval', 'number', { default: 3 })
    ],
    build: v => ({
      name: 'When_a_new_email_arrives',
      definition: openApiTrigger('office365', 'OnNewEmailV3', {
        folderPath: coerce(v.folderPath, 'text') || 'Inbox',
        fetchOnlyUnread: coerce(v.fetchOnlyUnread, 'boolean'),
        includeAttachments: coerce(v.includeAttachments, 'boolean'),
        subjectFilter: coerce(v.subjectFilter, 'text')
      }, { frequency: coerce(v.frequency, 'text') || 'Minute', interval: coerce(v.interval, 'number') ?? 3 })
    })
  }
]);

export const triggerById = id => Triggers.find(t => t.id === id) || null;
export const defaultTriggerValues = trigger => {
  const out = {};
  for (const fd of trigger?.fields || []) if (fd.default !== undefined) out[fd.name] = fd.default;
  return out;
};
