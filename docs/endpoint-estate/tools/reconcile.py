#!/usr/bin/env python3
"""Add '20 Reconciliation' to the merged workbook.

One row per distinct flow ID. Every identity claim the four sources make about
that flow, side by side, with a resolved value and the basis for resolving it.
"""
from collections import defaultdict
from datetime import datetime, timezone
import os
import pathlib
import signal
signal.signal(signal.SIGPIPE, signal.SIG_DFL)  # writing into `| head` is not an error
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment

WB = os.environ.get('ESTATE_WORKBOOK',
    str(pathlib.Path(__file__).resolve().parent.parent / 'DGO_Unified_Endpoint_Estate_Merged.xlsx'))
NULLS = {'null', '(not declared)', 'not available', 'none', '', 'nan'}

wb = openpyxl.load_workbook(WB, data_only=True)          # values for reading
wbf = openpyxl.load_workbook(WB, data_only=False)        # formulas, for writing back

def tab(sheet, hdr):
    rows = list(wb[sheet].iter_rows(values_only=True))
    head = [str(h).strip() if h is not None else '' for h in rows[hdr - 1]]
    data = [r for r in rows[hdr:] if any(v not in (None, '') for v in r)]
    return head, data

def g(head, row, name, default=''):
    if name not in head:
        return default
    v = row[head.index(name)]
    return default if v is None else str(v).strip()

def real(v):
    return v is not None and str(v).strip().lower() not in NULLS

# ---- sources -----------------------------------------------------------
h_mr, d_mr = tab('03 Flows', 4)
h_er, d_er = tab('02 Endpoint Register', 4)
h_hc, d_hc = tab('HC 02 Flows', 4)
h_he, d_he = tab('HC 08 Errors', 4)
h_fi, d_fi = tab('FI FlowIds Database', 1)
h_fa, d_fa = tab('FA Record Exceptions', 4)

mr = defaultdict(list)
for r in d_mr:
    mr[g(h_mr, r, 'Flow ID (maker portal)').lower()].append(r)

er = defaultdict(list)
for r in d_er:
    fid = g(h_er, r, 'Flow ID (maker portal)').lower()
    if fid:
        er[fid].append(r)

hc = defaultdict(list)
for r in d_hc:
    hc[g(h_hc, r, 'FlowName').lower()].append(r)

hc_err = defaultdict(int)
for r in d_he:
    hc_err[g(h_he, r, 'FlowName').lower()] += 1

fi = defaultdict(list)
for r in d_fi:
    fi[g(h_fi, r, 'Flow ID (maker portal)').lower()].append(r)

fa_by_wid = {}
for r in d_fa:
    wid = g(h_fa, r, 'Application workflow ID').lower()
    if real(wid):
        fa_by_wid.setdefault(wid, r)

# how many distinct flows each master workflow ID is stretched across
mr_wid_span = defaultdict(set)
for r in d_mr:
    w = g(h_mr, r, 'Workflow ID (trigger URL)').lower()
    if real(w):
        mr_wid_span[w].add(g(h_mr, r, 'Flow ID (maker portal)').lower())

flow_ids = sorted(set(mr) | set(hc) | set(fi) - {''})
flow_ids = [f for f in flow_ids if f]

HDR = ['Flow ID (maker portal)', 'Resolved display name', 'Names seen across sources',
       'Alias count', 'Endpoint key(s) — 02 Endpoint Register', 'In 03 Flows', 'In HC 02 Flows',
       'In FI FlowIds', 'Sources carrying this flow', 'Workflow ID — 03 Flows',
       'Workflow ID source — 03 Flows', 'Workflow ID in package (MR)', 'Scope of master value',
       'Master ID shared across N flows', 'Workflow ID — FI FlowIds',
       'Workflow ID — FA audit', 'Workflow ID — RECONCILED', 'Reconciliation basis', 'Status',
       'Is endpoint (MR)', 'Estate (MR)', 'Action count (MR)', 'Connection count (MR)',
       'HC rows (all runs)', 'HC latest collection (UTC)', 'HC state', 'HC last modified',
       'HC detail rows captured', 'HC error rows', 'Audit record matched', 'Audit validation status',
       'Audit exceptions', 'Maker URL (constructed)']

rows_out, stats = [], defaultdict(int)
for fid in flow_ids:
    m = mr[fid][0] if mr.get(fid) else None
    f = fi[fid][0] if fi.get(fid) else None
    hrows = sorted(hc.get(fid, []), key=lambda r: g(h_hc, r, 'CollectedUtc'))
    h = hrows[-1] if hrows else None

    names = []
    for src, head, row in (('mr', h_mr, m), ('fi', h_fi, f), ('hc', h_hc, h)):
        if row is not None:
            n = g(head, row, 'Display name' if src != 'hc' else 'DisplayName')
            if n and n not in names:
                names.append(n)
    for r in mr.get(fid, [])[1:] + fi.get(fid, [])[1:]:
        pass
    for r in mr.get(fid, []):
        n = g(h_mr, r, 'Display name')
        if n and n not in names:
            names.append(n)
    for r in fi.get(fid, []):
        n = g(h_fi, r, 'Display name')
        if n and n not in names:
            names.append(n)

    mw = g(h_mr, m, 'Workflow ID (trigger URL)') if m is not None else ''
    fw = g(h_fi, f, 'Workflow ID (trigger URL)') if f is not None else ''
    span = len(mr_wid_span.get(mw.lower(), ())) if real(mw) else 0

    fa = fa_by_wid.get(fw.lower()) or fa_by_wid.get(mw.lower())
    faw = g(h_fa, fa, 'Application workflow ID') if fa is not None else ''

    in_pkg = g(h_mr, m, 'Workflow ID in package') if m is not None else ''
    mw_scope = ('endpoint-key (register lookup: %s)' % g(h_mr, m, 'Workflow ID source')
                if real(mw) else '')

    if real(mw) and real(fw) and mw.lower() == fw.lower():
        resolved, status = fw, 'AGREE'
        basis = 'Per-flow value and endpoint-key register value are the same string'
    elif real(mw) and real(fw):
        resolved, status = fw, 'CONFLICT — different scopes, FlowIds wins'
        shared = (f'; the same register value is attached to {span} flows, so at most one '
                  f'can own it' if span > 1 else '')
        corrob = (f'; ECM audit record "{g(h_fa, fa, "Endpoint key")}" carries the register value, '
                  f'which is endpoint-key scoped too' if fa is not None and real(faw)
                  and faw.lower() == mw.lower() else
                  (f'; ECM audit record "{g(h_fa, fa, "Endpoint key")}" carries the FlowIds value'
                   if fa is not None and real(faw) and faw.lower() == fw.lower() else ''))
        basis = (f'Master value is not in the flow package (Workflow ID in package = {in_pkg or "FALSE"}); '
                 f'it is a lookup from {g(h_mr, m, "Workflow ID source")} keyed by endpoint key. '
                 f'FlowIds reads the maker portal per flow{shared}{corrob}')
    elif real(fw):
        resolved, status = fw, 'MASTER NOT DECLARED'
        basis = f'Master Reference records "{mw or "(blank)"}"; FlowIds supplies the per-flow value'
    elif real(mw):
        resolved, status = '', 'ENDPOINT-KEY VALUE ONLY'
        basis = (f'FlowIds records "{fw or "(blank)"}". The only value available is the '
                 f'endpoint-key register lookup ({g(h_mr, m, "Workflow ID source")}), which is '
                 f'not evidence of this flow\'s own trigger URL')
    else:
        resolved, status = '', 'NO WORKFLOW ID IN ANY SOURCE'
        basis = 'Neither source declares a workflow ID for this flow'
    stats[status] += 1

    keys = sorted({g(h_er, r, 'Endpoint key') for r in er.get(fid, []) if g(h_er, r, 'Endpoint key')})
    rows_out.append([
        fid,
        names[0] if names else '',
        ' | '.join(names),
        len(names),
        ', '.join(keys),
        'YES' if mr.get(fid) else 'no',
        'YES' if hc.get(fid) else 'no',
        'YES' if fi.get(fid) else 'no',
        sum(1 for x in (mr.get(fid), hc.get(fid), fi.get(fid)) if x),
        mw, g(h_mr, m, 'Workflow ID source') if m is not None else '',
        in_pkg, mw_scope,
        span if span > 1 else '',
        fw, faw, resolved, basis, status,
        g(h_mr, m, 'Is endpoint') if m is not None else '',
        g(h_mr, m, 'Estate') if m is not None else '',
        g(h_mr, m, 'Action count') if m is not None else '',
        g(h_mr, m, 'Connection count') if m is not None else '',
        len(hc.get(fid, [])),
        g(h_hc, h, 'CollectedUtc') if h is not None else '',
        g(h_hc, h, 'State') if h is not None else '',
        g(h_hc, h, 'LastModifiedTime') if h is not None else '',
        0,
        hc_err.get(fid, 0),
        g(h_fa, fa, 'Endpoint key') if fa is not None else '(no audit record)',
        g(h_fa, fa, 'Validation status') if fa is not None else '',
        g(h_fa, fa, 'Audit exceptions') if fa is not None else '',
        g(h_mr, m, 'Maker URL (constructed)') if m is not None else (g(h_fi, f, 'Maker URL (constructed)') if f is not None else ''),
    ])

# ---- write -------------------------------------------------------------
if '20 Reconciliation' in wbf.sheetnames:
    del wbf['20 Reconciliation']
ws = wbf.create_sheet('20 Reconciliation', wbf.sheetnames.index('19 Glossary') + 1)
ws.sheet_view.showGridLines = False

TEAL, INK, MUTE = '0E5A5E', '0E1319', '5C6675'
ws['A1'] = 'Reconciliation — one row per flow, every source side by side'
ws['A1'].font = Font(bold=True, size=13, color=TEAL)
summary = '  '.join(f'{k}: {v}' for k, v in sorted(stats.items(), key=lambda kv: -kv[1]))
ws['A2'] = ('Built from 03 Flows, 02 Endpoint Register, HC 02 Flows (latest run per flow), '
            'FI FlowIds Database and FA Record Exceptions. The audit joins on its '
            f'Application workflow ID. {len(rows_out)} flows — {summary}.')
ws['A2'].font = Font(size=11, color=MUTE)
ws['A2'].alignment = Alignment(wrap_text=True, vertical='top')
ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=12)
ws.row_dimensions[2].height = 34

for j, h in enumerate(HDR, 1):
    c = ws.cell(row=4, column=j, value=h)
    c.font = Font(bold=True, size=10, color='FFFFFF')
    c.fill = PatternFill('solid', fgColor=TEAL)
    c.alignment = Alignment(wrap_text=True, vertical='center')
ws.row_dimensions[4].height = 34

AMBER = PatternFill('solid', fgColor='FFF3CD')
for i, r in enumerate(rows_out, 5):
    for j, v in enumerate(r, 1):
        c = ws.cell(row=i, column=j, value=v)
        c.font = Font(size=9.5, color=INK)
        c.alignment = Alignment(vertical='top', wrap_text=False)
    if rows_out[i - 5][HDR.index('Status')].startswith('CONFLICT'):
        for j in (10, 15, 16, 17, 18, 19):
            ws.cell(row=i, column=j).fill = AMBER

widths = [40, 40, 52, 11, 34, 11, 13, 12, 13, 34, 44, 18, 46, 15, 34, 34, 34, 86, 36,
          12, 11, 13, 15, 13, 26, 10, 26, 14, 12, 30, 26, 60, 58]
for j, w in enumerate(widths, 1):
    ws.column_dimensions[openpyxl.utils.get_column_letter(j)].width = w
ws.freeze_panes = 'C5'
ws.auto_filter.ref = f'A4:{openpyxl.utils.get_column_letter(len(HDR))}{4 + len(rows_out)}'

# Register this derived sheet on the index, so the index describes the whole file.
idx = wbf['00 Merge Index']
note = '   |   plus 1 derived sheet: 20 Reconciliation'
if isinstance(idx['A5'].value, str) and note not in idx['A5'].value:
    idx['A5'] = idx['A5'].value + note
row = next((r for r in range(8, idx.max_row + 2)
            if idx.cell(row=r, column=4).value in (None, '', '20 Reconciliation')), idx.max_row + 1)
for j, v in enumerate(['(derived in this workbook)', '—', '(built from all four sources)',
                       '20 Reconciliation', ws.max_row, len(HDR), len(rows_out) * len(HDR), ''], 1):
    cell = idx.cell(row=row, column=j, value=v)
    cell.font = Font(italic=True)
idx.auto_filter.ref = f'A7:H{row}'

wbf.save(WB)
print(f'20 Reconciliation written: {len(rows_out)} flows x {len(HDR)} columns')
for k, v in sorted(stats.items(), key=lambda kv: -kv[1]):
    print(f'  {k:46s} {v}')
