// DGO R11.6 — Power Automate designer interop contract.
//
// This file encodes the two facts the generator depends on, both verified against the
// designer's own source (Azure/LogicAppsUX, the codebase behind the Power Automate modern
// designer and the Logic Apps designer) rather than inferred from behaviour:
//
//   1. WHAT THE DESIGNER ACCEPTS ON PASTE.
//      libs/designer/src/lib/core/utils/clipboard.ts — retrieveClipboardData():
//
//          const clipboardData = await navigator.clipboard.readText();
//          const parsedData = JSON.parse(clipboardData);
//          if (parsedData.mslaNode) { return parsedData; }
//
//      That is the whole gate. Any JSON text on the system clipboard carrying a truthy
//      `mslaNode` is handed to the paste thunk. The clipboard does not have to have been
//      written by a real copy — which is what makes generating it possible at all.
//
//   2. WHICH OF THE TWO PASTE SHAPES TO GENERATE.
//      EdgeContextualMenu.handlePasteClicked() branches on `isScopeNode`:
//
//        isScopeNode:false -> pasteOperation({ nodeData, nodeTokenData, operationInfo, … })
//              `nodeData` is the designer's INTERNAL per-node model — deserialised parameter
//              groups, token references, resolved operation metadata. It is a projection of
//              designer state, not a workflow document, and reproducing it by hand is both
//              undocumented and version-fragile. We never generate this shape.
//
//        isScopeNode:true  -> pasteScopeOperation({ serializedValue: serializedOperation, … })
//              `serializedOperation` is a PLAIN LOGIC APPS ACTION DEFINITION — exactly what
//              code view shows. It is fed to buildGraphFromActions(), the same BJS
//              deserialiser that parses a saved workflow. Everything the designer can open,
//              this shape can carry.
//
//      So the generator always emits the isScopeNode:true shape. Despite the name it is not
//      restricted to Scope actions: pasteScopeInWorkflow() takes whatever node
//      buildGraphFromActions() produced and splices it into the graph, so a bare Compose
//      pastes through it just as well as a nested Condition. The name is historical.
//
// WHAT THIS BUYS, AND WHAT IT DOES NOT
// It buys: arbitrary nested action sets, generated offline, pasted in one gesture.
// It does not buy: triggers. The paste path creates actions only, so a generated
// "When an HTTP request is received" cannot be pasted — it has to be created in the
// designer or imported through code view. Blueprints that need a trigger say so and emit
// it separately (see core/power-automate/blueprints.js).

/**
 * The clipboard envelope. `serializedOperation` and `nodeId` are filled per generation;
 * the rest is fixed by the contract above.
 *
 * allConnectionData is deliberately left empty. On a real copy it carries the source
 * tenant's connection references (connection ids, api ids). We have no business inventing
 * those, and the designer handles their absence correctly: a pasted connector action lands
 * unbound and prompts for a connection, which is the right outcome for generated content.
 */
export const DesignerClipboard = Object.freeze({
  mslaNodeFlag: true,
  isScopeNode: true,
  /** localStorage key the designer falls back to when navigator.clipboard.readText is absent. */
  localStorageKey: 'msla-clipboard',
  emptyConnectionData: Object.freeze({}),
  emptyStaticResults: Object.freeze({})
});

/**
 * Browsers that can receive a generated paste.
 *
 * retrieveClipboardData() only reads the system clipboard when
 * `navigator.clipboard.readText` is a function. Firefox does not expose readText() to web
 * content, so there the designer reads window.localStorage['msla-clipboard'] on its OWN
 * origin instead — which nothing outside make.powerautomate.com can write. Generated JSON
 * therefore cannot reach the designer in Firefox by copying alone; the studio says so
 * rather than letting the paste silently do nothing.
 */
export const DesignerBrowserSupport = Object.freeze({
  supported: ['Chrome', 'Edge'],
  unsupported: ['Firefox'],
  unsupportedReason:
    'Firefox does not expose navigator.clipboard.readText() to web pages, so the Power Automate ' +
    'designer cannot read a generated payload from the clipboard. Use Chrome or Edge, or paste ' +
    'the payload into localStorage["msla-clipboard"] from the designer tab’s dev console.'
});

/**
 * Action-name policy. The JSON key of an action IS its name; the designer renders it with
 * underscores shown as spaces. Names that break these rules are rejected by the service on
 * save, which surfaces as a save failure long after the paste — so the studio blocks them
 * at generation time instead.
 */
export const ActionNamePolicy = Object.freeze({
  maxLength: 80,
  /** Characters the workflow service rejects inside an action name. */
  forbidden: ['\\', '/', ':', '*', '?', '"', '<', '>', '|', '@', '#'],
  forbiddenPattern: /[\\/:*?"<>|@#]/,
  /** The designer displays underscores as spaces; this is how a typed label becomes a key. */
  toKey: label => String(label || '')
    .trim()
    .replace(/[\\/:*?"<>|@#]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80),
  fromKey: key => String(key || '').replace(/_/g, ' ')
});

/**
 * Connector registry.
 *
 * Power Automate cloud flows express connector actions as `OpenApiConnection` — host carries
 * {connectionName, operationId, apiId} and the operation's inputs live flattened under
 * `parameters`. (Logic Apps Consumption uses the older `ApiConnection` with a method/path
 * pair; that is a different product surface and is not what the modern designer pastes.)
 *
 * `connectionName` is a CONNECTION REFERENCE name, not a connection id. When a flow already
 * holds one connection for a connector the reference is the bare connector name; a second
 * connection to the same connector gets a `_1` suffix. Generated actions use the bare name
 * and the designer rebinds on paste, so this only matters for flows with two connections to
 * the same connector — the studio surfaces the reference so it can be overridden.
 */
export const Connectors = Object.freeze({
  sharepoint: Object.freeze({
    id: 'sharepoint',
    label: 'SharePoint',
    connectionName: 'shared_sharepointonline',
    apiId: '/providers/Microsoft.PowerApps/apis/shared_sharepointonline'
  }),
  office365: Object.freeze({
    id: 'office365',
    label: 'Office 365 Outlook',
    connectionName: 'shared_office365',
    apiId: '/providers/Microsoft.PowerApps/apis/shared_office365'
  })
});

/** Authentication expression every OpenApiConnection action carries in a cloud flow. */
export const ConnectionAuthentication = "@parameters('$authentication')";

export const connector = id => Connectors[id] || null;
