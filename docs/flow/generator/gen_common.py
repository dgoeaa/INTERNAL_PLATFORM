import json, collections

SP_CONN = {
    "api": {"id": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline"},
    "connection": {"id": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline/connections/3f1943c5955a4cb8b301e8f22f2b590d"},
    "connectionName": "3f1943c5955a4cb8b301e8f22f2b590d",
}
O365_CONN = {
    "api": {"id": "/providers/Microsoft.PowerApps/apis/shared_office365"},
    "connection": {"id": "/providers/Microsoft.PowerApps/apis/shared_office365/connections/c0b9e7a5b0854c39a435fd8ce92f48ad"},
    "connectionName": "c0b9e7a5b0854c39a435fd8ce92f48ad",
}
RETRY = {"retryPolicy": {"type": "exponential", "count": 4, "interval": "PT10S",
                         "minimumInterval": "PT5S", "maximumInterval": "PT1H"}}
SEQ = {"concurrency": {"repetitions": 1}}

JSON_HDRS = {"Accept": "application/json;odata=nometadata",
             "Content-Type": "application/json;odata=nometadata"}

SP_HOST = {"apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
           "connection": "shared_sharepointonline", "operationId": "HttpRequest"}
O365_HOST = {"apiId": "/providers/Microsoft.PowerApps/apis/shared_office365",
             "connection": "shared_office365", "operationId": "SendEmailV2"}


def sp(dataset, uri, method="GET", body=None, headers=None, run_after=None):
    """SharePoint 'Send an HTTP request' action with an explicit retry policy (H1)."""
    params = collections.OrderedDict()
    params["dataset"] = dataset
    params["parameters/method"] = method
    params["parameters/uri"] = uri
    params["parameters/headers"] = headers or JSON_HDRS
    if body is not None:
        params["parameters/body"] = body
    act = collections.OrderedDict()
    act["type"] = "OpenApiConnection"
    act["inputs"] = {"parameters": params, "host": SP_HOST}
    act["runtimeConfiguration"] = RETRY
    if run_after is not None:
        act["runAfter"] = run_after
    return act


def compose(value, run_after=None):
    a = collections.OrderedDict([("type", "Compose"), ("inputs", value)])
    if run_after is not None:
        a["runAfter"] = run_after
    return a


def setvar(name, value, run_after=None):
    a = collections.OrderedDict([("type", "SetVariable"),
                                 ("inputs", {"name": name, "value": value})])
    if run_after is not None:
        a["runAfter"] = run_after
    return a


def appendarr(name, value, run_after=None):
    a = collections.OrderedDict([("type", "AppendToArrayVariable"),
                                 ("inputs", {"name": name, "value": value})])
    if run_after is not None:
        a["runAfter"] = run_after
    return a


def select(frm, sel, run_after=None):
    a = collections.OrderedDict([("type", "Select"),
                                 ("inputs", {"from": frm, "select": sel})])
    if run_after is not None:
        a["runAfter"] = run_after
    return a


def query(frm, where, run_after=None):
    a = collections.OrderedDict([("type", "Query"),
                                 ("inputs", {"from": frm, "where": where})])
    if run_after is not None:
        a["runAfter"] = run_after
    return a


def foreach(items, actions, run_after=None, sequential=True):
    a = collections.OrderedDict([("type", "Foreach"), ("foreach", items), ("actions", actions)])
    if run_after is not None:
        a["runAfter"] = run_after
    if sequential:
        a["runtimeConfiguration"] = SEQ          # B2 - no unbounded concurrency
    return a


def until(expr, actions, run_after=None, count=500, timeout="PT2H"):
    a = collections.OrderedDict([("type", "Until"), ("expression", expr),
                                 ("limit", {"count": count, "timeout": timeout}),
                                 ("actions", actions)])
    if run_after is not None:
        a["runAfter"] = run_after
    return a


def cond(expression, actions, else_actions=None, run_after=None):
    a = collections.OrderedDict([("type", "If"), ("expression", expression),
                                 ("actions", actions),
                                 ("else", {"actions": else_actions or {}})])
    if run_after is not None:
        a["runAfter"] = run_after
    return a


def after(*names, states=("Succeeded",)):
    return {n: list(states) for n in names}


OK_ANY = ("Succeeded", "Failed", "Skipped", "TimedOut")
OK_DONE = ("Succeeded", "Skipped")


def scope_blob(node_id, actions, run_after, sp_actions=(), o365_actions=()):
    conn = collections.OrderedDict()
    for n in sp_actions:
        conn[n] = {"connectionReference": SP_CONN, "referenceKey": "shared_sharepointonline"}
    for n in o365_actions:
        conn[n] = {"connectionReference": O365_CONN, "referenceKey": "shared_office365"}
    return collections.OrderedDict([
        ("nodeId", node_id),
        ("serializedValue", collections.OrderedDict([
            ("type", "Scope"), ("actions", actions), ("runAfter", run_after)])),
        ("allConnectionData", conn),
        ("staticResults", {}),
        ("isScopeNode", True),
        ("mslaNode", True),
    ])


def action_blob(node_id, action):
    return collections.OrderedDict([
        ("nodeId", node_id),
        ("serializedValue", action),
        ("allConnectionData", {}),
        ("staticResults", {}),
        ("isScopeNode", False),
        ("mslaNode", True),
    ])




# ---------------------------------------------------------------------------
# SELF-REVIEW FIX 1
# "@concat(variables('X'), <src>)" relies on concat() accepting arrays. concat()
# is documented as a STRING function; array support is idiomatic but not
# contractual. Every array accumulator write is rewritten into a sequential
# Foreach + AppendToArrayVariable, whose array semantics are guaranteed. The
# rewritten node keeps the original action name and runAfter, so no sibling
# rewiring is needed.
# ---------------------------------------------------------------------------
import re as _re
_ACC = _re.compile(r"^@concat\(variables\('([^']+)'\),\s*(.+)\)$")

def _rewrite(actions):
    out = collections.OrderedDict()
    for name, a in actions.items():
        if isinstance(a, dict):
            for key in ("actions",):
                if key in a and isinstance(a[key], dict):
                    a[key] = _rewrite(a[key])
            if "else" in a and isinstance(a.get("else"), dict) and isinstance(a["else"].get("actions"), dict):
                a["else"]["actions"] = _rewrite(a["else"]["actions"])
        if (isinstance(a, dict) and a.get("type") == "SetVariable"
                and isinstance(a.get("inputs", {}).get("value"), str)):
            m = _ACC.match(a["inputs"]["value"].strip())
            if m and m.group(1) == a["inputs"]["name"]:
                target, source = m.group(1), m.group(2).strip()
                inner = collections.OrderedDict([
                    ("Append_%s" % name, collections.OrderedDict([
                        ("type", "AppendToArrayVariable"),
                        ("inputs", {"name": target, "value": "@item()"})]))])
                fe = collections.OrderedDict([
                    ("type", "Foreach"), ("foreach", "@" + source), ("actions", inner)])
                if "runAfter" in a:
                    fe["runAfter"] = a["runAfter"]
                fe["runtimeConfiguration"] = SEQ
                out[name] = fe
                continue
        out[name] = a
    return out


def apply_self_review_fixes(blob):
    sv = blob.get("serializedValue", {})
    if sv.get("type") == "Scope" and isinstance(sv.get("actions"), dict):
        sv["actions"] = _rewrite(sv["actions"])
    return blob


def write(path, blobs, header_lines):
    blobs = [apply_self_review_fixes(b) for b in blobs]
    out = []
    out.extend(header_lines)
    for b in blobs:
        out.append("")
        out.append(json.dumps(b, indent=2))
    txt = "\n".join(out) + "\n"
    with open(path, "w") as f:
        f.write(txt)
    # validate every blob round-trips
    for b in blobs:
        json.loads(json.dumps(b))
    return len(txt)
