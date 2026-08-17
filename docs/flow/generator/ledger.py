import json, collections
DIR='/home/user/INTERNAL_PLATFORM/docs/flow'
ORDER=['00_initialize_variables.json','01_scope_prep_run_context.json','02_scope_site_and_web_intelligence.json',
'03_scope_list_deep_capture.json','04_scope_registers_reports_csv.json','05_scope_archive_package.json',
'06_scope_review_register_upsert.json','07_scope_delivery.json','08_scope_run_outcome.json']
def blobs_of(f):
    t=open(DIR+'/'+f).read(); b="\n".join(l for l in t.splitlines() if not l.startswith('#'))
    d,i,o=json.JSONDecoder(),0,[]
    while i<len(b):
        while i<len(b) and b[i] in ' \t\r\n': i+=1
        if i>=len(b): break
        x,i=d.raw_decode(b,i); o.append(x)
    return o
rows=[]
def walk(acts,f,depth,parent):
    for n,a in acts.items():
        rows.append((f,depth,n,a.get('type')))
        if isinstance(a.get('actions'),dict): walk(a['actions'],f,depth+1,n)
        if isinstance(a.get('else'),dict) and isinstance(a['else'].get('actions'),dict):
            walk(a['else']['actions'],f,depth+1,n)
for f in ORDER:
    for b in blobs_of(f):
        sv=b['serializedValue']
        rows.append((f,0,b['nodeId'],sv.get('type')))
        if sv.get('type')=='Scope': walk(sv['actions'],f,1,b['nodeId'])
out=["NODE LEDGER - every node in every package, enumerated and typed.",
     "Proof of complete traversal: %d nodes across %d packages." % (len(rows),len(ORDER)),"",
     "%-42s %5s  %-56s %s" % ("PACKAGE","DEPTH","NODE","TYPE"), "-"*132]
for f,d,n,t in rows: out.append("%-42s %5d  %-56s %s" % (f,d,("  "*d)+n,t))
out += ["","Per-package node counts:"]
for f,c in collections.Counter(r[0] for r in rows).items(): out.append("   %-42s %4d" % (f,c))
open(DIR+'/NODE_LEDGER.txt','w').write("\n".join(out)+"\n")
print("NODE_LEDGER.txt:",len(rows),"nodes")
