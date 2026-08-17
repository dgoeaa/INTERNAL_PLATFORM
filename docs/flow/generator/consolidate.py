"""Build the single-upload artefacts from the nine packages."""
import json, glob, collections, hashlib, copy

DIR = '/home/user/INTERNAL_PLATFORM/docs/flow'
ORDER = ['00_initialize_variables.json','01_scope_prep_run_context.json',
         '02_scope_site_and_web_intelligence.json','03_scope_list_deep_capture.json',
         '04_scope_registers_reports_csv.json','05_scope_archive_package.json',
         '06_scope_review_register_upsert.json','07_scope_delivery.json',
         '08_scope_run_outcome.json']

def blobs_of(f):
    txt = open(DIR + '/' + f).read()
    body = "\n".join(l for l in txt.splitlines() if not l.startswith('#'))
    dec, i, out = json.JSONDecoder(), 0, []
    while i < len(body):
        while i < len(body) and body[i] in ' \t\r\n': i += 1
        if i >= len(body): break
        o, i = dec.raw_decode(body, i); out.append(o)
    return out

ALL = []
for f in ORDER: ALL.extend(blobs_of(f))

# ---------------------------------------------------------------- 1. clipboard
# Exactly the format of the original paste: JSON objects concatenated in order.
out = "\n".join(json.dumps(b, separators=(',', ':')) for b in ALL)
open(DIR + '/FLOW_COMPLETE_CLIPBOARD.json', 'w').write(out + "\n")
print("FLOW_COMPLETE_CLIPBOARD.json  %d blobs  %d bytes" % (len(ALL), len(out)))

# ---------------------------------------------------------------- 2. definition
HOSTMAP = {'shared_sharepointonline': '/providers/Microsoft.PowerApps/apis/shared_sharepointonline',
           'shared_office365': '/providers/Microsoft.PowerApps/apis/shared_office365'}

def to_definition_host(a):
    """Clipboard host uses 'connection'; the workflow definition uses 'connectionName'."""
    if isinstance(a, dict):
        if a.get('type') == 'OpenApiConnection' and 'host' in a.get('inputs', {}):
            h = a['inputs']['host']
            if 'connection' in h:
                a['inputs']['host'] = collections.OrderedDict([
                    ('connectionName', h['connection']),
                    ('operationId', h['operationId']),
                    ('apiId', h.get('apiId', HOSTMAP.get(h['connection'], ''))),
                ])
        for k in ('actions',):
            if isinstance(a.get(k), dict):
                for v in a[k].values(): to_definition_host(v)
        if isinstance(a.get('else'), dict) and isinstance(a['else'].get('actions'), dict):
            for v in a['else']['actions'].values(): to_definition_host(v)
    return a

actions = collections.OrderedDict()
# the site URL arrives on the HTTP trigger, matching this platform's existing
# Power Automate HTTP-trigger integration pattern (config/config.example.js)
actions['Initialize_Sharepoint_Site_url'] = collections.OrderedDict([
    ('type', 'InitializeVariable'),
    ('inputs', {'variables': [{'name': 'Sharepoint_Site_url', 'type': 'string',
                               'value': "@triggerBody()?['siteUrl']"}]}),
    ('runAfter', {}),
])
prev = 'Initialize_Sharepoint_Site_url'
for b in ALL:
    sv = copy.deepcopy(b['serializedValue'])
    name = b['nodeId']
    to_definition_host(sv)
    sv['runAfter'] = {prev: ['Succeeded']}
    actions[name] = sv
    prev = name

definition = collections.OrderedDict([
    ('$schema', 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#'),
    ('contentVersion', '1.0.0.0'),
    ('parameters', collections.OrderedDict([
        ('$connections', {'defaultValue': {}, 'type': 'Object'}),
        ('$authentication', {'defaultValue': {}, 'type': 'SecureObject'}),
    ])),
    ('triggers', collections.OrderedDict([
        ('manual', collections.OrderedDict([
            ('type', 'Request'), ('kind', 'Http'),
            ('inputs', {'schema': {
                'type': 'object',
                'properties': {'siteUrl': {'type': 'string',
                    'title': 'SharePoint site URL',
                    'description': 'Absolute https URL of the root site to inventory, e.g. https://contoso.sharepoint.com/sites/Registry'}},
                'required': ['siteUrl']}}),
        ])),
    ])),
    ('actions', actions),
    ('outputs', {}),
])
txt = json.dumps(definition, indent=2)
open(DIR + '/FLOW_COMPLETE_DEFINITION.json', 'w').write(txt + "\n")
print("FLOW_COMPLETE_DEFINITION.json  %d top-level actions  %d bytes" % (len(actions), len(txt)))

# ---------------------------------------------------------------- verification
re_all = open(DIR + '/FLOW_COMPLETE_CLIPBOARD.json').read()
back = []
dec, i = json.JSONDecoder(), 0
while i < len(re_all):
    while i < len(re_all) and re_all[i] in ' \t\r\n': i += 1
    if i >= len(re_all): break
    o, i = dec.raw_decode(re_all, i); back.append(o)
assert len(back) == len(ALL), "blob count mismatch"
assert all(json.dumps(a, sort_keys=True) == json.dumps(b, sort_keys=True) for a, b in zip(ALL, back)), "round-trip mismatch"
print("round-trip: %d/%d blobs byte-identical after re-parse" % (len(back), len(ALL)))

d2 = json.loads(open(DIR + '/FLOW_COMPLETE_DEFINITION.json').read())
def count(a):
    n = 0
    for k, v in a.items():
        n += 1
        if isinstance(v.get('actions'), dict): n += count(v['actions'])
        if isinstance(v.get('else'), dict) and isinstance(v['else'].get('actions'), dict):
            n += count(v['else']['actions'])
    return n
print("definition total actions (incl. nested): %d" % count(d2['actions']))
for f in ('FLOW_COMPLETE_CLIPBOARD.json', 'FLOW_COMPLETE_DEFINITION.json'):
    raw = open(DIR + '/' + f, 'rb').read()
    print("   %-32s sha256 %s  %d bytes" % (f, hashlib.sha256(raw).hexdigest()[:40], len(raw)))
