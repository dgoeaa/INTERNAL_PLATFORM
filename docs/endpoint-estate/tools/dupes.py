#!/usr/bin/env python3
"""Duplication analysis of the merged workbook."""
from collections import Counter, defaultdict
import os
import pathlib
import signal
signal.signal(signal.SIGPIPE, signal.SIG_DFL)  # writing into `| head` is not an error
import openpyxl

OUT = os.environ.get('ESTATE_WORKBOOK',
    str(pathlib.Path(__file__).resolve().parent.parent / 'DGO_Unified_Endpoint_Estate_Merged.xlsx'))
wb = openpyxl.load_workbook(OUT, data_only=True)

def table(sheet, hdr):
    ws = wb[sheet]
    rows = list(ws.iter_rows(values_only=True))
    head = [str(h).strip() if h is not None else '' for h in rows[hdr - 1]]
    data = [r for r in rows[hdr:] if any(v not in (None, '') for v in r)]
    return head, data

def col(head, data, name):
    j = head.index(name)
    return [r[j] for r in data]

print('--- 1. repeated column NAMES across sheets (join keys) ---')
names = defaultdict(list)
for ws in wb.worksheets:
    if ws.title == '00 Merge Index':
        continue
    rows = list(ws.iter_rows(max_row=6, values_only=True))
    best = max(rows, key=lambda r: sum(1 for v in r if v not in (None, '')))
    for v in best:
        if v not in (None, ''):
            names[str(v).strip()].append(ws.title)
for n, sheets in sorted(names.items(), key=lambda kv: -len(kv[1]))[:8]:
    print(f'  {n:34s} in {len(sheets):2d} sheets')
print(f'  distinct column names overall: {len(names)}   total column slots: {sum(len(v) for v in names.values())}')

print('\n--- 2. exact duplicate data rows within a sheet ---')
for sheet, hdr in [('03 Flows', 4), ('HC 02 Flows', 4), ('HC 08 Errors', 4),
                   ('FI FlowIds Database', 1), ('02 Endpoint Register', 4),
                   ('15 Action Register', 4), ('FA Record Exceptions', 4)]:
    head, data = table(sheet, hdr)
    c = Counter(tuple(str(v) for v in r) for r in data)
    dup = sum(v - 1 for v in c.values() if v > 1)
    print(f'  {sheet:22s} rows={len(data):5d} distinct={len(c):5d} duplicate_rows={dup}')

print('\n--- 3. same flow, repeated across sheets ---')
h3, d3 = table('03 Flows', 4)
hc, dc = table('HC 02 Flows', 4)
hf, df = table('FI FlowIds Database', 1)
mr_ids = [str(v).lower() for v in col(h3, d3, 'Flow ID (maker portal)') if v]
hc_ids = [str(v).lower() for v in col(hc, dc, 'FlowName') if v]
fi_ids = [str(v).lower() for v in col(hf, df, 'Flow ID (maker portal)') if v]
print(f"  03 Flows             rows={len(d3):4d}  distinct flow IDs={len(set(mr_ids))}")
print(f"  HC 02 Flows          rows={len(dc):4d}  distinct flow IDs={len(set(hc_ids))}  runs={len(set(col(hc,dc,'RunId')))}")
print(f"  FI FlowIds Database  rows={len(df):4d}  distinct flow IDs={len(set(fi_ids))}")
print(f'  flow IDs present in all three: {len(set(mr_ids) & set(hc_ids) & set(fi_ids))}')
print(f'  unique to any one sheet: {len((set(mr_ids) ^ set(hc_ids)) | (set(mr_ids) ^ set(fi_ids)))}')

print('\n  flow IDs carrying more than one row:')
for label, ids in [('03 Flows', mr_ids), ('HC 02 Flows', hc_ids), ('FI FlowIds', fi_ids)]:
    rep = {k: v for k, v in Counter(ids).items() if v > 1}
    print(f'    {label:12s} {len(rep)} id(s) repeated -> {list(rep.items())[:3]}')

print('\n--- 4. FI vs 03 Flows: same columns, do the values agree? ---')
mr = {}
for r in d3:
    fid = str(r[h3.index('Flow ID (maker portal)')]).lower()
    mr.setdefault(fid, []).append(r)
agree = conflict = 0
conflicts = []
for r in df:
    fid = str(r[hf.index('Flow ID (maker portal)')]).lower()
    wid = str(r[hf.index('Workflow ID (trigger URL)')]).strip()
    name = str(r[hf.index('Display name')]).strip()
    for m in mr.get(fid, []):
        mwid = str(m[h3.index('Workflow ID (trigger URL)')]).strip()
        if wid == mwid or wid in ('Not available', 'None') or mwid in ('null', '(not declared)'):
            agree += 1
        else:
            conflict += 1
            conflicts.append((name, fid[:8], wid[:12], mwid[:12]))
print(f'  workflow ID agrees/benign: {agree}   conflicting: {conflict}')
for c in conflicts[:12]:
    print(f'    {c[0][:40]:42s} flow {c[1]}  FI={c[2]}…  MR={c[3]}…')
