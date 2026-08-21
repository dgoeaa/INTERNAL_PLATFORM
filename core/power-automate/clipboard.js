// The clipboard envelope, and getting it onto the clipboard.
//
// The envelope is fixed by the designer's paste path (see config/power-automate.config.js
// for the source references). Everything variable is `nodeId` and `serializedOperation`.

import { DesignerClipboard, DesignerBrowserSupport } from '../../config/power-automate.config.js';

/**
 * Wrap an action definition in the envelope the designer accepts.
 *
 * `nodeId` becomes the pasted action's name. The designer runs it through
 * getNonDuplicateNodeId(), so pasting twice yields "Send_an_email" and "Send_an_email_1"
 * rather than a collision — the name here is a request, not a guarantee.
 *
 * `runAfter` is stripped from the root: pasteScopeInWorkflow() clears it and rebuilds the
 * edges from where the operator dropped the action, so shipping one is noise that only
 * invites the reader to think placement is being controlled from here.
 */
export function toPayload(fragment) {
  const { runAfter, ...definition } = fragment?.definition || {};
  return {
    nodeId: fragment?.name || 'Generated_action',
    serializedOperation: definition,
    allConnectionData: { ...DesignerClipboard.emptyConnectionData },
    staticResults: { ...DesignerClipboard.emptyStaticResults },
    isScopeNode: DesignerClipboard.isScopeNode,
    mslaNode: DesignerClipboard.mslaNodeFlag
  };
}

/** The exact text to place on the clipboard. Indented: JSON.parse is indifferent, readers are not. */
export const payloadText = fragment => JSON.stringify(toPayload(fragment), null, 2);

/**
 * Put text on the system clipboard.
 *
 * Two paths, and both of them get used in practice:
 *
 *   navigator.clipboard.writeText needs a secure context — https, localhost, or a file://
 *   page. The platform is served over plain http on some internal deployments, so on those
 *   this is unavailable from the start.
 *
 *   Even in a secure context the call can still be REFUSED: the permission may be denied by
 *   enterprise policy, or the document may not hold focus at the moment of the call. So the
 *   fallback is attached to the failure, not only to the missing capability — an earlier
 *   version keyed it solely on isSecureContext and would have thrown, with nothing else
 *   tried, exactly when a copy was refused rather than unsupported.
 *
 * Returns how it succeeded, or throws, so the caller can tell the operator something true.
 */
export async function writeClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return 'clipboard-api';
    } catch { /* refused rather than unsupported — fall through and try the older path */ }
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand('copy'); } finally { ta.remove(); }
  if (!ok) throw new Error('The browser refused the copy. Select the JSON below and copy it manually.');
  return 'exec-command';
}

/** Whether this browser can hand a generated payload to the designer at all. */
export function browserSupport() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isFirefox = /firefox/i.test(ua);
  return {
    ok: !isFirefox,
    name: isFirefox ? 'Firefox' : /edg\//i.test(ua) ? 'Edge' : /chrome/i.test(ua) ? 'Chrome' : 'this browser',
    reason: isFirefox ? DesignerBrowserSupport.unsupportedReason : ''
  };
}

/**
 * Read a definition out of something the operator pasted in from the designer.
 *
 * Three things are worth accepting, because all three are one copy away in the designer:
 *   • a full clipboard payload (they copied a Scope — carries serializedOperation)
 *   • what Peek code shows for one action: { "Action_name": { type: …, inputs: … } }
 *   • a bare action definition: { type: …, inputs: … }
 *
 * This is what keeps the catalog honest. Connector operation ids and parameter names are
 * Microsoft's to change; rather than pretend this file is the last word on them, an
 * operator can copy the real action out of their own tenant and generate from that.
 */
export function importDefinition(text) {
  let parsed;
  try { parsed = typeof text === 'string' ? JSON.parse(text) : text; }
  catch (e) { throw new Error(`That is not valid JSON — ${e.message}`); }
  if (!parsed || typeof parsed !== 'object') throw new Error('Expected a JSON object.');

  if (parsed.mslaNode && parsed.serializedOperation) {
    return { name: parsed.nodeId || 'Imported_action', definition: parsed.serializedOperation, from: 'clipboard payload' };
  }
  if (parsed.mslaNode && parsed.nodeData) {
    throw new Error(
      'That is a single copied action, which carries the designer’s internal model rather than the ' +
      'action definition. Use Peek code on the action and paste what it shows, or put the action in ' +
      'a Scope and copy the Scope.'
    );
  }
  if (typeof parsed.type === 'string') {
    return { name: 'Imported_action', definition: parsed, from: 'action definition' };
  }
  const keys = Object.keys(parsed);
  if (keys.length === 1 && parsed[keys[0]] && typeof parsed[keys[0]].type === 'string') {
    return { name: keys[0], definition: parsed[keys[0]], from: 'Peek code' };
  }
  throw new Error('Could not find an action definition in there. Expected Peek code output, or a copied Scope.');
}

/** Short human description of an imported definition, for the confirmation line. */
export function describeDefinition(definition) {
  const type = definition?.type || 'unknown';
  const host = definition?.inputs?.host;
  if (host?.operationId) return `${type} · ${host.connectionName || 'connector'} · ${host.operationId}`;
  const nested = definition?.actions ? Object.keys(definition.actions).length : 0;
  return nested ? `${type} · ${nested} nested action${nested === 1 ? '' : 's'}` : type;
}
