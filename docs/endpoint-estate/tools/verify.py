#!/usr/bin/env python3
"""Read the merged workbook back and assert nothing was dropped or altered."""
from pathlib import Path
import os
import pathlib
import signal
signal.signal(signal.SIGPIPE, signal.SIG_DFL)  # writing into `| head` is not an error
import openpyxl

SRC = Path(os.environ.get('ESTATE_SOURCE_DIR', '.'))
OUT = Path(os.environ.get('ESTATE_WORKBOOK',
    str(pathlib.Path(__file__).resolve().parent.parent / 'DGO_Unified_Endpoint_Estate_Merged.xlsx')))
SOURCES = [
    ('1373e67d-DGO_Endpoint_Estate_Master_Reference.xlsx', ''),
    ('2a81b2c0-DGO_Flow_Harvest_Collector.xlsx', 'HC '),
    ('1d9b38f4-ECM_Simplified_Forensic_Audit.xlsx', 'FA '),
    ('70fd9e59-FlowIds_Endpoint_Database.xlsx', 'FI '),
]
RENAME = {'Sheet1': 'FI FlowIds Database'}

merged = openpyxl.load_workbook(OUT, data_only=False)
checked = chars = 0
fails = []
for fname, prefix in SOURCES:
    wb = openpyxl.load_workbook(SRC / fname, data_only=False)
    for ws in wb.worksheets:
        tname = RENAME.get(ws.title, f'{prefix}{ws.title}') if prefix == 'FI ' else f'{prefix}{ws.title}'
        if tname not in merged.sheetnames:
            fails.append(f'MISSING SHEET {tname}'); continue
        tws = merged[tname]
        if (ws.max_row, ws.max_column) != (tws.max_row, tws.max_column):
            fails.append(f'{tname}: dims {ws.max_row}x{ws.max_column} != {tws.max_row}x{tws.max_column}')
        for row in ws.iter_rows():
            for c in row:
                if c.value is None:
                    continue
                t = tws.cell(row=c.row, column=c.column).value
                if t != c.value:
                    fails.append(f'{tname}!{c.coordinate}: value mismatch')
                else:
                    checked += 1; chars += len(str(c.value))
        if {str(r) for r in ws.merged_cells.ranges} != {str(r) for r in tws.merged_cells.ranges}:
            fails.append(f'{tname}: merged ranges differ')
        if ws.freeze_panes != tws.freeze_panes:
            fails.append(f'{tname}: freeze panes differ')
        if set(ws.tables) != set(tws.tables):
            fails.append(f'{tname}: tables differ {set(ws.tables)} vs {set(tws.tables)}')
        for name in ws.tables:
            if name in tws.tables and ws.tables[name].ref != tws.tables[name].ref:
                fails.append(f'{tname}: table {name} ref differs')
    wb.close()

print(f'sheets in merged file : {len(merged.sheetnames)}')
print(f'cells verified identical: {checked:,}')
print(f'characters verified     : {chars:,}')
print(f'formulas preserved      : '
      f'{sum(1 for ws in merged for r in ws.iter_rows() for c in r if isinstance(c.value, str) and c.value.startswith("="))}')
print(f'named tables preserved  : {sum(len(ws.tables) for ws in merged)}')
print('RESULT:', 'PASS — nothing dropped, nothing altered' if not fails else f'FAIL ({len(fails)})')
for f in fails[:20]:
    print('  ', f)
