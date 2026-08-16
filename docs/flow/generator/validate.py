import json, re, glob, sys, collections

files = sorted(glob.glob('/home/user/INTERNAL_PLATFORM/docs/flow/*.json'))
blobs = []
for f in files:
    txt = open(f).read()
    # strip leading '#' comment lines, then split concatenated JSON objects
    body = "\n".join(l for l in txt.splitlines() if not l.startswith('#'))
    dec, idx = json.JSONDecoder(), 0
    while idx < len(body):
        while idx < len(body) and body[idx] in ' \t\r\n': idx += 1
        if idx >= len(body): break
        obj, idx = dec.raw_decode(body, idx)
        blobs.append((f.split('/')[-1], obj))
print("files: %d   blobs: %d   all JSON valid" % (len(files), len(blobs)))

ACTION_TYPES = {}
def walk(actions, path=""):
    for name, a in actions.items():
        ACTION_TYPES[name] = a.get("type")
        for key in ("actions",):
            if key in a: walk(a[key], path + "/" + name)
        if "else" in a and "actions" in a["else"]: walk(a["else"]["actions"], path + "/" + name)

vars_declared = set()
for fn, b in blobs:
    sv = b["serializedValue"]
    if sv.get("type") == "InitializeVariable":
        for v in sv["inputs"]["variables"]: vars_declared.add(v["name"])
    elif sv.get("type") == "Scope":
        ACTION_TYPES[b["nodeId"]] = "Scope"
        walk(sv["actions"])
    for name, a in ({b["nodeId"]: sv}).items():
        pass
print("actions defined: %d   variables initialised: %d" % (len(ACTION_TYPES), len(vars_declared)))

blob_text = "\n".join(json.dumps(b) for _, b in blobs)

# --- 1. B1 regression guard: outputs() must never target a Select/Query/Table
SELECTISH = {n for n, t in ACTION_TYPES.items() if t in ("Select", "Query", "Table")}
bad = sorted({m for m in re.findall(r"outputs\('([^']+)'\)", blob_text) if m in SELECTISH})
print("\n[B1] outputs() used on Select/Query/Table :", bad if bad else "NONE  (pass)")
bodyish = sorted({m for m in re.findall(r"\bbody\('([^']+)'\)", blob_text)
                  if ACTION_TYPES.get(m) == "Compose"})
print("[B1] body() used on Compose               :", bodyish if bodyish else "NONE  (pass)")

# --- 2. every action reference resolves
refs = set(re.findall(r"(?:outputs|body|actions)\('([^']+)'\)", blob_text))
missing = sorted(r for r in refs if r not in ACTION_TYPES)
print("[REF] unresolved action references        :", missing if missing else "NONE  (pass)")

# --- 3. every variable reference is initialised
vrefs = set(re.findall(r"variables\('([^']+)'\)", blob_text))
setrefs = set()
for _, b in blobs:
    for m in re.finditer(r'"type": "(?:SetVariable|AppendToArrayVariable|AppendToStringVariable)", "inputs": \{"name": "([^"]+)"', json.dumps(b)):
        setrefs.add(m.group(1))
undeclared = sorted(v for v in (vrefs | setrefs) if v not in vars_declared)
print("[VAR] referenced but not initialised      :", undeclared if undeclared else "NONE  (pass)")
unused = sorted(v for v in vars_declared if v not in vrefs and v not in setrefs)
print("[VAR] initialised but never used          :", unused if unused else "NONE  (pass)")

# --- 4. runAfter integrity inside each scope
def check_runafter(actions, scope, errs):
    names = set(actions.keys())
    for n, a in actions.items():
        for dep in (a.get("runAfter") or {}):
            if dep not in names:
                errs.append("%s: %s -> %s" % (scope, n, dep))
        if "actions" in a: check_runafter(a["actions"], scope + "/" + n, errs)
        if "else" in a and a["else"].get("actions"): check_runafter(a["else"]["actions"], scope + "/" + n, errs)
errs = []
for fn, b in blobs:
    if b["serializedValue"].get("type") == "Scope":
        check_runafter(b["serializedValue"]["actions"], b["nodeId"], errs)
print("[RA]  runAfter targets outside sibling set:", errs if errs else "NONE  (pass)")

# --- 5. every loop is explicitly sequential (B2)
par = []
def check_conc(actions, scope):
    for n, a in actions.items():
        if a.get("type") == "Foreach":
            rc = (a.get("runtimeConfiguration") or {}).get("concurrency", {}).get("repetitions")
            if rc != 1: par.append("%s/%s (repetitions=%r)" % (scope, n, rc))
        if "actions" in a: check_conc(a["actions"], scope + "/" + n)
        if "else" in a and a["else"].get("actions"): check_conc(a["else"]["actions"], scope + "/" + n)
for fn, b in blobs:
    if b["serializedValue"].get("type") == "Scope":
        check_conc(b["serializedValue"]["actions"], b["nodeId"])
print("[B2]  Foreach without repetitions=1       :", par if par else "NONE  (pass)")

# --- 6. every HTTP action carries a retry policy (H1)
norety = []
def check_retry(actions, scope):
    for n, a in actions.items():
        if a.get("type") == "OpenApiConnection":
            if not (a.get("runtimeConfiguration") or {}).get("retryPolicy"):
                norety.append("%s/%s" % (scope, n))
        if "actions" in a: check_retry(a["actions"], scope + "/" + n)
        if "else" in a and a["else"].get("actions"): check_retry(a["else"]["actions"], scope + "/" + n)
for fn, b in blobs:
    if b["serializedValue"].get("type") == "Scope":
        check_retry(b["serializedValue"]["actions"], b["nodeId"])
print("[H1]  HTTP actions without retryPolicy    :", norety if norety else "NONE  (pass)")

# --- 7. H5 regression guard
print("[H5]  contains(title,'app') substring test:",
      "PRESENT (fail)" if re.search(r"contains\(toLower\([^)]*[Tt]itle[^)]*\), 'app'\)", blob_text) else "NONE  (pass)")
# --- 8. connection references
conns = set(re.findall(r'"connectionName": "([^"]+)"', blob_text))
print("[L1]  distinct connections used           :", sorted(conns))
# --- 9. action count vs the 500 per-flow limit
print("\ntotal actions (incl. nested):", len(ACTION_TYPES))
