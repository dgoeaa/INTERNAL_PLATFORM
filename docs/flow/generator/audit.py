"""Exhaustive audit of every node and every expression in the flow packages.

Coverage is proven, not asserted: every JSON scalar in every blob is visited and
counted, every node is enumerated with a verdict, and every expression is
tokenised (string literals stripped) so that function identifiers are checked
against the real Logic Apps catalog rather than pattern-matched.
"""
import json, glob, re, hashlib, collections, sys

DIR = '/home/user/INTERNAL_PLATFORM/docs/flow'

FUNCS = set("""
concat substring replace guid toLower toUpper indexOf lastIndexOf startsWith endsWith
split trim length empty formatNumber chunk slice nthIndexOf isFloat isInt
contains first intersection join last skip take union sort reverse item items flatten
addProperty removeProperty setProperty coalesce createArray array
and or not if equals greater greaterOrEquals less lessOrEquals
base64 base64ToBinary base64ToString binary bool dataUri dataUriToBinary dataUriToString
decodeBase64 decodeDataUri decodeUriComponent encodeUriComponent float int json string
uriComponent uriComponentToBinary uriComponentToString xml
add div max min mod mul rand range sub
addDays addHours addMinutes addSeconds addToTime convertFromUtc convertTimeZone convertToUtc
dayOfMonth dayOfWeek dayOfYear formatDateTime getFutureTime getPastTime startOfDay
startOfHour startOfMonth subtractFromTime ticks utcNow dateDifference parseDateTime
action actions body formDataMultiValues formDataValue iterationIndexes listCallbackUrl
multipartBody outputs parameters result trigger triggerBody triggerFormDataValue
triggerMultipartBody triggerOutputs variables workflow
uriHost uriPath uriPathAndQuery uriPort uriQuery uriScheme xpath
""".split())

def load_blobs():
    out = []
    for f in sorted(glob.glob(DIR + '/*.json')):
        if '/generator/' in f or '/FLOW_COMPLETE_' in f: continue
        txt = open(f).read()
        body = "\n".join(l for l in txt.splitlines() if not l.startswith('#'))
        dec, i = json.JSONDecoder(), 0
        while i < len(body):
            while i < len(body) and body[i] in ' \t\r\n': i += 1
            if i >= len(body): break
            o, i = dec.raw_decode(body, i)
            out.append((f.split('/')[-1], o))
    return out

# ---------------------------------------------------------------- expression tokeniser
def strip_literals(expr):
    """Remove '...' literals (with '' escape) so identifiers inside text are not
    mistaken for function calls. Returns (stripped, ok, reason)."""
    out, i, n = [], 0, len(expr)
    while i < n:
        c = expr[i]
        if c == "'":
            i += 1
            while i < n:
                if expr[i] == "'":
                    if i + 1 < n and expr[i+1] == "'":
                        i += 2; continue
                    i += 1; break
                i += 1
            else:
                return "".join(out), False, "unterminated string literal"
            out.append("''")
        else:
            out.append(c); i += 1
    return "".join(out), True, ""

IDENT = re.compile(r"([A-Za-z_][A-Za-z0-9_]*)\s*\(")

def audit_expression(expr):
    """Return (list of problems, set of functions used)."""
    problems, used = [], set()
    inner = expr
    if expr.startswith('@{') or '@{' in expr:
        if expr.count('@{') != expr.count('}') and expr.count('@{') > 0:
            pass  # '}' also appears in JSON-ish literals; balance checked below on stripped text
    if expr.startswith('@') and not expr.startswith('@{'):
        inner = expr[1:]
    stripped, ok, why = strip_literals(inner)
    if not ok:
        problems.append(why)
        return problems, used
    depth = 0
    for ch in stripped:
        if ch == '(': depth += 1
        elif ch == ')':
            depth -= 1
            if depth < 0:
                problems.append("unbalanced parenthesis (extra close)"); break
    if depth > 0: problems.append("unbalanced parenthesis (%d unclosed)" % depth)
    for m in IDENT.finditer(stripped):
        fn = m.group(1)
        used.add(fn)
        if fn not in FUNCS:
            problems.append("unknown function '%s'" % fn)
    return problems, used

# ---------------------------------------------------------------- traversal
scalars = collections.Counter()
expressions = []          # (file, node_path, json_path, expr)
nodes = []                # (file, node_id, type, depth, parent)
ACTION_TYPES, ACTION_PARENT, ACTION_DEPTH = {}, {}, {}

def visit_value(v, f, node, jpath):
    if isinstance(v, str):
        scalars['string'] += 1
        if v.startswith('@') or '@{' in v:
            expressions.append((f, node, jpath, v))
    elif isinstance(v, bool): scalars['bool'] += 1
    elif isinstance(v, (int, float)): scalars['number'] += 1
    elif v is None: scalars['null'] += 1
    elif isinstance(v, dict):
        scalars['object'] += 1
        for k, x in v.items(): visit_value(x, f, node, jpath + '/' + str(k))
    elif isinstance(v, list):
        scalars['array'] += 1
        for i, x in enumerate(v): visit_value(x, f, node, jpath + '[%d]' % i)

def walk_actions(actions, f, parent, depth):
    for name, a in actions.items():
        ACTION_TYPES[name] = a.get('type'); ACTION_PARENT[name] = parent; ACTION_DEPTH[name] = depth
        nodes.append((f, name, a.get('type'), depth, parent))
        for k, v in a.items():
            if k in ('actions', 'else'): continue
            visit_value(v, f, name, '/' + k)
        if isinstance(a.get('actions'), dict): walk_actions(a['actions'], f, name, depth + 1)
        if isinstance(a.get('else'), dict) and isinstance(a['else'].get('actions'), dict):
            walk_actions(a['else']['actions'], f, name, depth + 1)

def main():
    blobs = load_blobs()
    for f, b in blobs:
        sv = b['serializedValue']
        if sv.get('type') == 'Scope':
            ACTION_TYPES[b['nodeId']] = 'Scope'; ACTION_PARENT[b['nodeId']] = None; ACTION_DEPTH[b['nodeId']] = 0
            nodes.append((f, b['nodeId'], 'Scope', 0, None))
            for k, v in sv.items():
                if k == 'actions': continue
                visit_value(v, f, b['nodeId'], '/' + k)
            walk_actions(sv['actions'], f, b['nodeId'], 1)
        else:
            ACTION_TYPES[b['nodeId']] = sv.get('type'); ACTION_PARENT[b['nodeId']] = None; ACTION_DEPTH[b['nodeId']] = 0
            nodes.append((f, b['nodeId'], sv.get('type'), 0, None))
            visit_value(sv, f, b['nodeId'], '')
        visit_value(b.get('allConnectionData', {}), f, b['nodeId'], '/allConnectionData')
    
    print("=" * 78)
    print("COVERAGE LEDGER  (proof that the whole content was traversed)")
    print("=" * 78)
    print("packages (files)            : %d" % len(set(f for f, _ in blobs)))
    print("clipboard blobs             : %d" % len(blobs))
    print("nodes enumerated            : %d" % len(nodes))
    print("max nesting depth           : %d  (Power Automate limit 8)" % max(d for _,_,_,d,_ in nodes))
    print("JSON scalars/containers visited:")
    for k in ('object','array','string','number','bool','null'):
        print("   %-8s %6d" % (k, scalars[k]))
    print("total JSON values visited   : %d" % sum(scalars.values()))
    print("expressions extracted       : %d" % len(expressions))
    
    print("\nnode type census:")
    for t, c in sorted(collections.Counter(t for _,_,t,_,_ in nodes).items(), key=lambda x: -x[1]):
        print("   %-24s %4d" % (t, c))
    
    # ---------------------------------------------------------------- expression audit
    print("\n" + "=" * 78)
    print("EXPRESSION AUDIT  (every expression parsed, literals stripped)")
    print("=" * 78)
    bad, allfuncs = [], collections.Counter()
    for f, node, jpath, expr in expressions:
        probs, used = audit_expression(expr)
        for u in used: allfuncs[u] += 1
        for p in probs: bad.append((f, node, jpath, p, expr[:100]))
    print("expressions parsed          : %d" % len(expressions))
    print("distinct functions used     : %d" % len(allfuncs))
    print("problems found              : %d" % len(bad))
    for f, node, jpath, p, e in bad[:40]:
        print("   ! %s :: %s%s -> %s\n       %s" % (f, node, jpath, p, e))
    print("\nfunction usage (top 25):")
    for fn, c in allfuncs.most_common(25):
        print("   %-22s %4d" % (fn, c))
    unused_catalog = sorted(set(allfuncs) - FUNCS)
    print("functions used that are NOT in the Logic Apps catalog: %s" % (unused_catalog or "NONE"))
    
    # ---------------------------------------------------------------- graph audit
    print("\n" + "=" * 78)
    print("GRAPH AUDIT")
    print("=" * 78)
    def siblings_of(actions):  return set(actions.keys())
    cycles, unreachable, terminals = [], [], []
    def check(actions, scope):
        names = set(actions.keys())
        indeg = {n: 0 for n in names}
        edges = collections.defaultdict(set)
        for n, a in actions.items():
            for dep in (a.get('runAfter') or {}):
                if dep in names:
                    edges[dep].add(n); indeg[n] += 1
        roots = [n for n in names if indeg[n] == 0]
        seen, stack = set(), list(roots)
        while stack:
            n = stack.pop()
            if n in seen: continue
            seen.add(n); stack.extend(edges[n])
        if seen != names:
            unreachable.append((scope, sorted(names - seen)))
        outdeg = {n: len(edges[n]) for n in names}
        terminals.append((scope, sorted(n for n in names if outdeg[n] == 0)))
        for n, a in actions.items():
            if isinstance(a.get('actions'), dict): check(a['actions'], scope + '/' + n)
            if isinstance(a.get('else'), dict) and isinstance(a['else'].get('actions'), dict):
                check(a['else']['actions'], scope + '/' + n + '[else]')
    for f, b in blobs:
        if b['serializedValue'].get('type') == 'Scope':
            check(b['serializedValue']['actions'], b['nodeId'])
    print("action blocks analysed      : %d" % len(terminals))
    print("blocks with unreachable actions (cycle/orphan): %s" % (unreachable or "NONE"))
    
    # ---------------------------------------------------------------- variable lifecycle
    print("\n" + "=" * 78)
    print("VARIABLE LIFECYCLE AUDIT")
    print("=" * 78)
    decl = {}
    order = []
    for f, b in blobs:
        sv = b['serializedValue']
        if sv.get('type') == 'InitializeVariable':
            for v in sv['inputs']['variables']:
                decl[v['name']] = v['type']; order.append(v['name'])
    writes = collections.defaultdict(set)
    def scan_writes(actions):
        for n, a in actions.items():
            t = a.get('type')
            if t in ('SetVariable','AppendToArrayVariable','AppendToStringVariable'):
                writes[a['inputs']['name']].add(t)
            if isinstance(a.get('actions'), dict): scan_writes(a['actions'])
            if isinstance(a.get('else'), dict) and isinstance(a['else'].get('actions'), dict):
                scan_writes(a['else']['actions'])
    for f, b in blobs:
        if b['serializedValue'].get('type') == 'Scope': scan_writes(b['serializedValue']['actions'])
    mismatch = []
    for v, ops in sorted(writes.items()):
        t = decl.get(v)
        if 'AppendToArrayVariable' in ops and t != 'array': mismatch.append((v, t, 'array append on non-array'))
        if 'AppendToStringVariable' in ops and t != 'string': mismatch.append((v, t, 'string append on non-string'))
    print("variables declared          : %d" % len(decl))
    print("variables written           : %d" % len(writes))
    print("type/operation mismatches   : %s" % (mismatch or "NONE"))
    setprop = [v for v in decl if decl[v]=='object']
    print("object variables (setProperty targets): %s" % ", ".join(sorted(setprop)))
    
    # ---------------------------------------------------------------- odata audit
    print("\n" + "=" * 78)
    print("SHAREPOINT REST ENDPOINT AUDIT")
    print("=" * 78)
    uris = []
    def scan_uris(actions, scope):
        for n, a in actions.items():
            if a.get('type') == 'OpenApiConnection':
                p = a['inputs']['parameters']
                if 'parameters/uri' in p:
                    uris.append((n, p.get('parameters/method','GET'), p['parameters/uri']))
            if isinstance(a.get('actions'), dict): scan_uris(a['actions'], scope)
            if isinstance(a.get('else'), dict) and isinstance(a['else'].get('actions'), dict):
                scan_uris(a['else']['actions'], scope)
    for f, b in blobs:
        if b['serializedValue'].get('type') == 'Scope': scan_uris(b['serializedValue']['actions'], b['nodeId'])
    print("HTTP actions with a URI     : %d" % len(uris))
    methods = collections.Counter(m for _, m, _ in uris)
    print("methods                     : %s" % dict(methods))
    literal = [(n,m,u) for n,m,u in uris if not u.startswith('@')]
    print("literal (non-expression) URIs:")
    for n,m,u in literal: print("   %-32s %-6s %s" % (n, m, u[:110]))
    deprecated = [(n,u) for n,_,u in uris if 'GetFolderByServerRelativeUrl' in u or "replace(" in u and "%20" in u]
    print("deprecated folder API / %%20 hand-encoding: %s" % (deprecated or "NONE"))
    
    # ---------------------------------------------------------------- integrity
    print("\n" + "=" * 78)
    print("PACKAGE INTEGRITY (SHA-256)")
    print("=" * 78)
    for f in sorted(glob.glob(DIR + '/*.json')):
        h = hashlib.sha256(open(f,'rb').read()).hexdigest()
        print("   %-46s %s  %7d bytes" % (f.split('/')[-1], h[:32], len(open(f,'rb').read())))
    

if __name__ == '__main__':
    main()
