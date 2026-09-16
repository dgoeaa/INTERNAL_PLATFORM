#!/usr/bin/env python3
"""Merge all four DGO/ECM workbooks into one file, losing nothing.

Master Reference sheets keep their original names so their live cross-sheet
formulas still resolve. The other three workbooks are prefixed by source.
"""
import hashlib, shutil
from copy import copy
from datetime import datetime, timezone
from pathlib import Path

import os
import pathlib
import signal
signal.signal(signal.SIGPIPE, signal.SIG_DFL)  # writing into `| head` is not an error
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo

SRC = Path(os.environ.get('ESTATE_SOURCE_DIR', '.'))
OUT = Path(os.environ.get('ESTATE_WORKBOOK',
    str(pathlib.Path(__file__).resolve().parent.parent / 'DGO_Unified_Endpoint_Estate_Merged.xlsx')))

SOURCES = [
    ('1373e67d-DGO_Endpoint_Estate_Master_Reference.xlsx', 'DGO_Endpoint_Estate_Master_Reference.xlsx', 'MR', ''),
    ('2a81b2c0-DGO_Flow_Harvest_Collector.xlsx',           'DGO_Flow_Harvest_Collector.xlsx',           'HC', 'HC '),
    ('1d9b38f4-ECM_Simplified_Forensic_Audit.xlsx',        'ECM_Simplified_Forensic_Audit.xlsx',        'FA', 'FA '),
    ('70fd9e59-FlowIds_Endpoint_Database.xlsx',            'FlowIds_Endpoint_Database.xlsx',            'FI', 'FI '),
]
RENAME = {('FI', 'Sheet1'): 'FI FlowIds Database'}

def sha256(p):
    h = hashlib.sha256()
    with open(p, 'rb') as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()

def copy_sheet(src_ws, tgt_ws):
    """Copy every cell (formula or value) with its formatting and layout."""
    cells = 0
    for row in src_ws.iter_rows():
        for c in row:
            if c.value is None and not c.has_style:
                continue
            t = tgt_ws.cell(row=c.row, column=c.column)
            t.value = c.value
            if c.has_style:
                t.font = copy(c.font)
                t.fill = copy(c.fill)
                t.border = copy(c.border)
                t.alignment = copy(c.alignment)
                t.number_format = c.number_format
                t.protection = copy(c.protection)
            if c.hyperlink is not None:
                t.hyperlink = copy(c.hyperlink)
            if c.comment is not None:
                t.comment = copy(c.comment)
            if c.value is not None:
                cells += 1

    for rng in src_ws.merged_cells.ranges:
        tgt_ws.merge_cells(str(rng))

    for key, dim in src_ws.column_dimensions.items():
        d = tgt_ws.column_dimensions[key]
        d.width, d.hidden, d.bestFit = dim.width, dim.hidden, dim.bestFit
    for key, dim in src_ws.row_dimensions.items():
        r = tgt_ws.row_dimensions[key]
        r.height, r.hidden = dim.height, dim.hidden

    tgt_ws.freeze_panes = src_ws.freeze_panes
    if src_ws.auto_filter.ref:
        tgt_ws.auto_filter.ref = src_ws.auto_filter.ref
    tgt_ws.sheet_view.showGridLines = src_ws.sheet_view.showGridLines
    tgt_ws.sheet_view.zoomScale = src_ws.sheet_view.zoomScale
    if src_ws.sheet_properties.tabColor:
        tgt_ws.sheet_properties.tabColor = src_ws.sheet_properties.tabColor
    tgt_ws.sheet_format.defaultRowHeight = src_ws.sheet_format.defaultRowHeight
    tgt_ws.page_setup.orientation = src_ws.page_setup.orientation

    for dv in src_ws.data_validations.dataValidation:
        tgt_ws.add_data_validation(copy(dv))

    for rng, rules in src_ws.conditional_formatting._cf_rules.items():
        for rule in rules:
            tgt_ws.conditional_formatting.add(str(rng.sqref), copy(rule))

    tables = []
    for name in list(src_ws.tables):
        tbl = src_ws.tables[name]
        new = Table(displayName=name, ref=tbl.ref)
        if tbl.tableStyleInfo is not None:
            si = tbl.tableStyleInfo
            new.tableStyleInfo = TableStyleInfo(
                name=si.name, showFirstColumn=si.showFirstColumn,
                showLastColumn=si.showLastColumn, showRowStripes=si.showRowStripes,
                showColumnStripes=si.showColumnStripes)
        tgt_ws.add_table(new)
        tables.append(name)
    return cells, tables

out = openpyxl.Workbook()
out.remove(out.active)
index = out.create_sheet('00 Merge Index')
manifest, name_map = [], {}

for fname, real, tag, prefix in SOURCES:
    path = SRC / fname
    digest = sha256(path)
    wb = openpyxl.load_workbook(path, data_only=False)  # keep formulas
    for ws in wb.worksheets:
        target_name = RENAME.get((tag, ws.title), f'{prefix}{ws.title}')
        assert len(target_name) <= 31, target_name
        assert target_name not in name_map, f'sheet name collision: {target_name}'
        tgt = out.create_sheet(target_name)
        cells, tables = copy_sheet(ws, tgt)
        name_map[target_name] = (real, ws.title)
        manifest.append(dict(source=real, sha=digest, orig=ws.title, merged=target_name,
                             rows=ws.max_row, cols=ws.max_column, cells=cells,
                             tables=', '.join(tables)))
        print(f'  {real[:34]:36s} {ws.title:26s} -> {target_name:26s} {cells:7d} cells')
    wb.close()

# ---- index sheet -------------------------------------------------------
H1 = Font(bold=True, size=16)
HDR = Font(bold=True, color='FFFFFF')
FILL = PatternFill('solid', fgColor='1F3864')
index.sheet_view.showGridLines = False
index['A1'] = 'DGO Unified Endpoint Estate — Merged Workbook'
index['A1'].font = H1
index['A2'] = ('Every sheet, row, column and cell of all four source workbooks, merged without '
               'exception. Master Reference sheets keep their original names so their live '
               'cross-sheet formulas still resolve; the other three are prefixed by source.')
index['A2'].alignment = Alignment(wrap_text=True, vertical='top')
index.merge_cells('A2:H2')
index.row_dimensions[2].height = 42
index['A4'] = f'Merged (UTC): {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")}'
index['A5'] = f'Sheets merged: {len(manifest)}   Total populated cells: {sum(m["cells"] for m in manifest):,}'

hdr = ['Source workbook', 'Source SHA-256', 'Original sheet', 'Sheet in this workbook',
       'Rows', 'Columns', 'Populated cells', 'Named tables']
for j, h in enumerate(hdr, 1):
    c = index.cell(row=7, column=j, value=h)
    c.font, c.fill = HDR, FILL
    c.alignment = Alignment(vertical='center')
for i, m in enumerate(manifest, 8):
    for j, v in enumerate([m['source'], m['sha'], m['orig'], m['merged'], m['rows'],
                           m['cols'], m['cells'], m['tables']], 1):
        index.cell(row=i, column=j, value=v)
for col, w in zip('ABCDEFGH', [46, 26, 30, 30, 9, 10, 16, 34]):
    index.column_dimensions[col].width = w
index.freeze_panes = 'A8'
index.auto_filter.ref = f'A7:H{7 + len(manifest)}'

out.save(OUT)
print(f'\nWrote {OUT}  ({OUT.stat().st_size:,} bytes, {len(out.sheetnames)} sheets)')
