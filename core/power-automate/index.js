// Public surface of the Power Automate generator.
//
// Nothing under core/power-automate/ touches the DOM except clipboard.js, and that only in
// writeClipboard(). The rest is pure: give it a plan, it gives you definitions, payloads and
// findings. That is what lets modules/flow-studio.js, the blueprints and the tests all drive
// the same code rather than three near-copies of it.

export { Actions, ActionGroups, actionById, actionsInGroup, isContainer, defaultValues } from './catalog.js';
export { buildFragments, buildActionsMap, planMode, walk, resolveNames, RunAfterStatuses } from './assemble.js';
export { validatePlan, errorsOf, warningsOf, notesOf, canGenerate } from './validate.js';
export { toPayload, payloadText, writeClipboard, browserSupport, importDefinition, describeDefinition } from './clipboard.js';
export { Blueprints, blueprintById, endpointOptions, requestTrigger, requestSchema, successEnvelope, failureEnvelope } from './blueprints.js';
export { coerce, buildCondition, ConditionOperators, conditionOperator, interpolationErrors } from './expressions.js';
export { inferSchema, schemaFromSample, schemaTextFromSample } from './schema.js';
export { Triggers, triggerById, defaultTriggerValues } from './triggers.js';

import { buildActionsMap } from './assemble.js';

/**
 * The whole thing as a workflow definition — what code view shows, and the only route for
 * anything the paste path cannot carry.
 *
 * A cloud flow's definition declares $connections and $authentication as parameters; the
 * OpenApiConnection actions the catalog emits reference $authentication, so a definition
 * without them will not import.
 */
export function buildWorkflowDefinition(plan, trigger = null) {
  const { actions, errors, names } = buildActionsMap(plan);
  const definition = {
    $schema: 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#',
    contentVersion: '1.0.0.0',
    parameters: {
      $connections: { defaultValue: {}, type: 'Object' },
      $authentication: { defaultValue: {}, type: 'SecureObject' }
    },
    triggers: trigger ? { [trigger.name]: { ...trigger.definition } } : {},
    actions,
    outputs: {}
  };
  return { definition, errors, names };
}

export const definitionText = (plan, trigger = null) =>
  JSON.stringify(buildWorkflowDefinition(plan, trigger).definition, null, 2);
