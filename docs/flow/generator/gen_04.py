import sys, collections
sys.path.insert(0, '.')
from gen_common import *
REPO = "/home/user/INTERNAL_PLATFORM/docs/flow"

CR   = "decodeUriComponent('%0D')"
LF   = "decodeUriComponent('%0A')"
CRLF = "decodeUriComponent('%0D%0A')"
BOM  = "decodeUriComponent('%EF%BB%BF')"
DQ   = "decodeUriComponent('%22')"
SQ   = "decodeUriComponent('%27')"

def s(expr):                      # safe string
    return "string(coalesce(%s, ''))" % expr

def hesc(expr):                   # HTML escape, ampersand first
    v = s(expr)
    return ("replace(replace(replace(replace(replace(%s, '&', '&amp;'), '<', '&lt;'), "
            "'>', '&gt;'), %s, '&quot;'), %s, '&#39;')" % (v, DQ, SQ))

def csv(expr):                    # H8 - quote, double quotes, strip CR/LF, block formula injection
    v = s(expr)
    guarded = ("if(and(greater(length(%s), 0), contains('=+-@', substring(%s, 0, 1))), "
               "concat('''', %s), %s)" % (v, v, v, v))
    return ("concat('\"', replace(replace(replace(%s, '\"', '\"\"'), %s, ' '), %s, ' '), '\"')"
            % (guarded, CR, LF))

NO = "variables('varNormalizedObjects')"
A = collections.OrderedDict()

# ---------------------------------------------------------------- run summary
A["Compose_Run_Summary"] = compose(collections.OrderedDict([
    ("runId", "@variables('varRunId')"),
    ("rootSiteUrl", "@variables('varRootSiteUrl')"),
    ("tenantRootUrl", "@variables('varTenantRootUrl')"),
    ("capturedAtUtc", "@variables('varCapturedAtUtc')"),
    ("captureCompletedAtUtc", "@utcNow()"),
    ("websCaptured", "@length(variables('varWebsCaptured'))"),
    ("websLeftUncaptured", "@length(variables('varWebQueue'))"),
    ("listsDiscovered", "@length(variables('varAllListsRaw'))"),
    ("listsDeepCaptured", "@length(variables('varNormalizedObjects'))"),
    ("inventoryRows", "@length(variables('varSPInventoryRows'))"),
    ("qualityFindings", "@length(variables('varQualityFindings'))"),
    ("warningsLogged", "@length(variables('varInventoryWarnings'))"),
    ("errorsLogged", "@length(variables('varSPInventoryErrors'))"),
    ("options", collections.OrderedDict([
        ("includeHiddenLists", "@variables('varIncludeHiddenLists')"),
        ("includeSchemaXml", "@variables('varIncludeSchemaXml')"),
        ("maxWebs", "@variables('varMaxWebs')"),
    ])),
]))

A["Compose_Full_Raw_Metadata"] = compose(collections.OrderedDict([
    ("schemaVersion", "3.0"),
    ("outputType", "FullRawSharePointSiteAndListMetadataInventory"),
    ("summary", "@outputs('Compose_Run_Summary')"),
    ("webs", "@variables('varWebsCaptured')"),
    ("objects", "@variables('varNormalizedObjects')"),
    ("inventoryRows", "@variables('varSPInventoryRows')"),
    ("qualityFindings", "@variables('varQualityFindings')"),
    ("warnings", "@variables('varInventoryWarnings')"),
    ("errors", "@variables('varSPInventoryErrors')"),
]), after("Compose_Run_Summary"))

A["Compose_Normalized_Register"] = compose(collections.OrderedDict([
    ("schemaVersion", "3.0"),
    ("outputType", "NormalizedArchitectureMetadataRegister"),
    ("summary", "@outputs('Compose_Run_Summary')"),
    ("objects", "@variables('varNormalizedObjects')"),
]), after("Compose_Full_Raw_Metadata"))

# findings ordered High -> Medium -> Low so the report reads by severity
A["Filter_Findings_High"] = query("@variables('varQualityFindings')",
    "@equals(item()?['severity'], 'High')", after("Compose_Normalized_Register"))
A["Filter_Findings_Medium"] = query("@variables('varQualityFindings')",
    "@equals(item()?['severity'], 'Medium')", after("Filter_Findings_High"))
A["Filter_Findings_Low"] = query("@variables('varQualityFindings')",
    "@equals(item()?['severity'], 'Low')", after("Filter_Findings_Medium"))
A["Compose_Findings_Ordered"] = compose(
    "@concat(body('Filter_Findings_High'), body('Filter_Findings_Medium'), body('Filter_Findings_Low'))",
    after("Filter_Findings_Low"))
A["Compose_Quality_Findings_Payload"] = compose(collections.OrderedDict([
    ("schemaVersion", "3.0"),
    ("outputType", "SharePointMetadataQualityFindings"),
    ("summary", collections.OrderedDict([
        ("totalFindings", "@length(variables('varQualityFindings'))"),
        ("high", "@length(body('Filter_Findings_High'))"),
        ("medium", "@length(body('Filter_Findings_Medium'))"),
        ("low", "@length(body('Filter_Findings_Low'))"),
        ("warningsLogged", "@length(variables('varInventoryWarnings'))"),
        ("errorsLogged", "@length(variables('varSPInventoryErrors'))"),
    ])),
    ("findings", "@outputs('Compose_Findings_Ordered')"),
    ("warnings", "@variables('varInventoryWarnings')"),
    ("errors", "@variables('varSPInventoryErrors')"),
]), after("Compose_Findings_Ordered"))

# ------------------------------------------------------------- HTML fragments
A["Select_Html_Rows_Objects"] = select(NO,
    ("@concat('<tr><td>', %s, '</td><td>', %s, '</td><td>', %s, '</td><td class=\"c\">', %s, "
     "'</td><td class=\"n\">', string(item()?['itemCount']), '</td><td class=\"n\">', "
     "string(div(int(coalesce(item()?['storage']?['totalSizeBytes'], 0)), 1048576)), "
     "'</td><td class=\"c\">', string(item()?['settings']?['enableVersioning']), "
     "'</td><td class=\"c\">', string(item()?['settings']?['contentTypesEnabled']), "
     "'</td><td class=\"c\">', string(item()?['settings']?['hasUniqueRoleAssignments']), "
     "'</td><td class=\"c\">', string(item()?['hasRetentionLabel']), "
     "'</td><td class=\"n\">', string(item()?['metrics']?['totalFields']), "
     "'</td><td class=\"n\">', string(item()?['metrics']?['customFields']), "
     "'</td><td>', %s, '</td><td>', %s, '</td></tr>')") % (
        hesc("item()?['title']"), hesc("item()?['objectKind']"),
        hesc("item()?['architectureClassification']"), hesc("item()?['businessRelevance']"),
        hesc("item()?['serverRelativeUrl']"), hesc("item()?['recommendedAction']")),
    after("Compose_Quality_Findings_Payload"))

A["Select_Html_Rows_Findings"] = select("@outputs('Compose_Findings_Ordered')",
    ("@concat('<tr class=\"sev-', toLower(string(item()?['severity'])), '\"><td>', %s, "
     "'</td><td>', %s, '</td><td>', %s, '</td><td>', %s, '</td><td>', %s, '</td><td>', %s, '</td></tr>')") % (
        hesc("item()?['severity']"), hesc("item()?['findingCode']"), hesc("item()?['category']"),
        hesc("item()?['objectTitle']"), hesc("item()?['message']"), hesc("item()?['recommendation']")),
    after("Select_Html_Rows_Objects"))

A["Select_Html_Rows_Webs"] = select("@variables('varWebsCaptured')",
    ("@concat('<tr><td>', %s, '</td><td>', %s, '</td><td>', %s, '</td><td class=\"n\">', "
     "string(item()?['counts']?['lists']), '</td><td class=\"n\">', string(item()?['counts']?['siteColumns']), "
     "'</td><td class=\"n\">', string(item()?['counts']?['siteContentTypes']), '</td><td class=\"n\">', "
     "string(item()?['counts']?['siteUsers']), '</td><td class=\"n\">', string(item()?['counts']?['siteGroups']), "
     "'</td><td class=\"n\">', string(item()?['counts']?['webRoleAssignments']), '</td><td class=\"n\">', "
     "string(item()?['counts']?['subWebs']), '</td></tr>')") % (
        hesc("item()?['web']?['Title']"), hesc("item()?['webUrl']"), hesc("item()?['web']?['WebTemplate']")),
    after("Select_Html_Rows_Findings"))

A["Select_Html_Rows_Errors"] = select("@variables('varSPInventoryErrors')",
    ("@concat('<tr><td>', %s, '</td><td>', %s, '</td><td>', %s, '</td><td class=\"n\">', "
     "string(coalesce(item()?['httpStatus'], 0)), '</td><td>', %s, '</td></tr>')") % (
        hesc("item()?['stage']"), hesc("item()?['collection']"),
        hesc("item()?['listTitle']"), hesc("item()?['message']")),
    after("Select_Html_Rows_Webs"))

A["Select_Html_Rows_Warnings"] = select("@variables('varInventoryWarnings')",
    ("@concat('<tr><td>', %s, '</td><td>', %s, '</td><td>', %s, '</td><td>', %s, '</td></tr>')") % (
        hesc("item()?['severity']"), hesc("item()?['warningCode']"),
        hesc("item()?['objectTitle']"), hesc("item()?['message']")),
    after("Select_Html_Rows_Errors"))

STYLE = ("body{font-family:Segoe UI,Arial,sans-serif;background:#f5f7f6;color:#1f2933;margin:0}"
         "header{background:#00583a;color:#fff;padding:24px}header h1{margin:0;font-size:24px}"
         "header p{margin:6px 0 0}main{padding:24px}"
         ".card{background:#fff;border:1px solid #d9e2dc;border-radius:8px;padding:18px;margin-bottom:18px}"
         "h2{color:#00583a;margin:0 0 12px;font-size:18px}"
         ".kpis{display:flex;flex-wrap:wrap;gap:16px;margin:0 0 8px;padding:0;list-style:none}"
         ".kpis li{background:#eef3f0;border:1px solid #d9e2dc;border-radius:6px;padding:10px 14px;min-width:120px}"
         ".kpis b{display:block;font-size:22px;color:#00583a}"
         ".tw{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:12.5px;min-width:720px}"
         "th{background:#00583a;color:#fff;text-align:left;padding:7px;position:sticky;top:0}"
         "td{border:1px solid #d9e2dc;padding:6px;vertical-align:top}"
         "td.n{text-align:right;font-variant-numeric:tabular-nums}td.c{text-align:center}"
         "tr:nth-child(even){background:#f8fbf9}"
         "tr.sev-high td:first-child{border-left:4px solid #a32013;font-weight:600}"
         "tr.sev-medium td:first-child{border-left:4px solid #b4670e}"
         "tr.sev-low td:first-child{border-left:4px solid #5e6d66}"
         ".empty{color:#6b7a72;font-style:italic}")

def kpi(label, expr):
    return "'<li><b>', string(%s), '</b>%s</li>', " % (expr, label)

A["Compose_Architecture_Review_Report_Html"] = compose(
    "@concat('<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\">"
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
    "<title>SharePoint Architecture and Metadata Review Report</title><style>" + STYLE + "</style></head><body>"
    "<header><h1>SharePoint Architecture and Metadata Review Report</h1>"
    "<p>Architecture Source of Truth &mdash; full site, list and library metadata inventory</p></header><main>"
    "<section class=\"card\"><h2>Run summary</h2><ul class=\"kpis\">', "
    + kpi("Webs captured", "length(variables('varWebsCaptured'))")
    + kpi("Lists &amp; libraries", "length(variables('varNormalizedObjects'))")
    + kpi("Quality findings", "length(variables('varQualityFindings'))")
    + kpi("Warnings", "length(variables('varInventoryWarnings'))")
    + kpi("Errors", "length(variables('varSPInventoryErrors'))")
    + "'</ul><p><b>Run ID:</b> ', " + hesc("variables('varRunId')") + ", "
    "' &nbsp;<b>Site:</b> ', " + hesc("variables('varRootSiteUrl')") + ", "
    "' &nbsp;<b>Captured (UTC):</b> ', " + hesc("variables('varCapturedAtUtc')") + ", "
    "' &nbsp;<b>Report generated (UTC):</b> ', " + hesc("utcNow()") + ", '</p></section>"
    "<section class=\"card\"><h2>Webs in scope</h2><div class=\"tw\"><table><thead><tr>"
    "<th>Title</th><th>URL</th><th>Template</th><th>Lists</th><th>Site columns</th>"
    "<th>Site CTs</th><th>Users</th><th>Groups</th><th>Role asgn</th><th>Subsites</th>"
    "</tr></thead><tbody>', join(body('Select_Html_Rows_Webs'), ''), '</tbody></table></div></section>"
    "<section class=\"card\"><h2>Quality findings</h2>', "
    "if(equals(length(body('Select_Html_Rows_Findings')), 0), "
    "'<p class=\"empty\">No quality findings were raised for this run.</p>', "
    "concat('<div class=\"tw\"><table><thead><tr><th>Severity</th><th>Code</th><th>Category</th>"
    "<th>Object</th><th>Finding</th><th>Recommendation</th></tr></thead><tbody>', "
    "join(body('Select_Html_Rows_Findings'), ''), '</tbody></table></div>')), "
    "'</section><section class=\"card\"><h2>Lists and libraries</h2><div class=\"tw\"><table><thead><tr>"
    "<th>Title</th><th>Kind</th><th>Classification</th><th>Relevance</th><th>Items</th><th>MB</th>"
    "<th>Ver</th><th>CTs</th><th>Unique perms</th><th>Retention</th><th>Fields</th><th>Custom</th>"
    "<th>URL</th><th>Recommended action</th></tr></thead><tbody>', "
    "join(body('Select_Html_Rows_Objects'), ''), '</tbody></table></div></section>"
    "<section class=\"card\"><h2>Capture warnings</h2>', "
    "if(equals(length(body('Select_Html_Rows_Warnings')), 0), "
    "'<p class=\"empty\">No warnings were logged.</p>', "
    "concat('<div class=\"tw\"><table><thead><tr><th>Severity</th><th>Code</th><th>Object</th>"
    "<th>Detail</th></tr></thead><tbody>', join(body('Select_Html_Rows_Warnings'), ''), "
    "'</tbody></table></div>')), '</section>"
    "<section class=\"card\"><h2>Capture errors</h2>', "
    "if(equals(length(body('Select_Html_Rows_Errors')), 0), "
    "'<p class=\"empty\">No errors were logged. Every retrieval in this run succeeded.</p>', "
    "concat('<div class=\"tw\"><table><thead><tr><th>Stage</th><th>Collection</th><th>Object</th>"
    "<th>HTTP</th><th>Message</th></tr></thead><tbody>', join(body('Select_Html_Rows_Errors'), ''), "
    "'</tbody></table></div>')), '</section></main></body></html>')",
    after("Select_Html_Rows_Warnings"))

# ----------------------------------------------------------------------- CSV
COLS = [
    ("Run ID", "item()?['runId']"), ("Captured At UTC", "item()?['capturedAtUtc']"),
    ("Web URL", "item()?['webUrl']"), ("Object ID", "item()?['objectId']"),
    ("Title", "item()?['title']"), ("Description", "item()?['description']"),
    ("Object Kind", "item()?['objectKind']"), ("Object Category", "item()?['objectCategory']"),
    ("Architecture Classification", "item()?['architectureClassification']"),
    ("Business Object", "item()?['isBusinessObject']"),
    ("Business Relevance", "item()?['businessRelevance']"),
    ("Review Priority", "item()?['reviewPriority']"),
    ("Item Count", "item()?['itemCount']"),
    ("Total Size Bytes", "item()?['storage']?['totalSizeBytes']"),
    ("Total File Count", "item()?['storage']?['totalFileCount']"),
    ("Server Relative URL", "item()?['serverRelativeUrl']"),
    ("Created", "item()?['created']"), ("Last Modified", "item()?['lastModified']"),
    ("Versioning Enabled", "item()?['settings']?['enableVersioning']"),
    ("Major Version Limit", "item()?['settings']?['majorVersionLimit']"),
    ("Minor Versions Enabled", "item()?['settings']?['enableMinorVersions']"),
    ("Content Approval Enabled", "item()?['settings']?['enableModeration']"),
    ("Force Checkout", "item()?['settings']?['forceCheckout']"),
    ("Content Types Enabled", "item()?['settings']?['contentTypesEnabled']"),
    ("Unique Permissions", "item()?['settings']?['hasUniqueRoleAssignments']"),
    ("Permission Inheritance", "item()?['settings']?['permissionInheritance']"),
    ("Retention Label Present", "item()?['hasRetentionLabel']"),
    ("Excluded From Search", "item()?['settings']?['noCrawl']"),
    ("External Data Source", "item()?['settings']?['hasExternalDataSource']"),
    ("Read Security", "item()?['settings']?['readSecurity']"),
    ("Write Security", "item()?['settings']?['writeSecurity']"),
    ("Total Fields", "item()?['metrics']?['totalFields']"),
    ("Custom Fields", "item()?['metrics']?['customFields']"),
    ("Required Fields", "item()?['metrics']?['requiredFields']"),
    ("Content Types", "item()?['metrics']?['contentTypes']"),
    ("Views", "item()?['metrics']?['views']"),
    ("Review Reason", "item()?['reviewReason']"),
    ("Recommended Action", "item()?['recommendedAction']"),
    ("Reviewer", "''"), ("Review Decision", "''"), ("Owner", "''"),
    ("Action Required", "''"), ("Due Date", "''"), ("Reviewer Notes", "''"),
]
A["Select_Human_Review_Csv_Lines"] = select(NO,
    "@join(createArray(%s), ',')" % ", ".join(csv(e) for _, e in COLS),
    after("Compose_Architecture_Review_Report_Html"))
A["Compose_Human_Review_Csv"] = compose(
    "@concat(%s, '%s', %s, join(body('Select_Human_Review_Csv_Lines'), %s), %s)"
    % (BOM, ",".join('"%s"' % c for c, _ in COLS), CRLF, CRLF, CRLF),
    after("Select_Human_Review_Csv_Lines"))
A["Set_varHumanReviewCsv"] = setvar("varHumanReviewCsv", "@outputs('Compose_Human_Review_Csv')",
    after("Compose_Human_Review_Csv"))

blob = scope_blob("Scope_BUILD_04_Registers_Reports_And_Csv", A,
                  after("Scope_GET_03_List_And_Library_Deep_Capture"))
hdr = [
    "# 04 - Scope_BUILD_04_Registers_Reports_And_Csv",
    "#",
    "# M3  ONE HTML report, and it carries real detail: run KPIs, a web inventory table, a",
    "#     severity-ordered findings table, the full list/library table, plus warning and",
    "#     error tables. The old counts-only report 03 is gone.",
    "# M6  HTML rows are produced by scalar Select + join. The O(n-squared) sequential",
    "#     AppendToStringVariable loop and varHumanReviewHtmlRows are deleted.",
    "# H8  CSV cells are quoted, embedded quotes doubled, CR/LF stripped, and any value",
    "#     starting = + - or @ is prefixed with an apostrophe to block formula injection.",
    "#     The file opens with a UTF-8 BOM so Excel renders diacritics correctly.",
    "# H9  Every artefact reads varNormalizedObjects. There is no second classifier.",
    "# H2  Payloads are composed once; the human review register (built in Scope 05) links",
    "#     to the archived raw file instead of re-embedding it.",
    "#",
    "# The six trailing CSV columns - Reviewer, Review Decision, Owner, Action Required,",
    "# Due Date, Reviewer Notes - are intentionally blank input columns for the reviewer.",
    "# Scope 06 persists whatever is entered against them into a SharePoint list keyed on",
    "# Object ID, so decisions survive the next run (M15).",
]
n = write(REPO + "/04_scope_registers_reports_csv.json", [blob], hdr)
print("04 written:", n, "bytes")
