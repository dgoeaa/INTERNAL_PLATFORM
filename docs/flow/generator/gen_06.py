import sys, collections
sys.path.insert(0, '.')
from gen_common import *
REPO = "/home/user/INTERNAL_PLATFORM/docs/flow"

def spq(e): return "replace(%s, '''', '''''')" % e
def st(a):  return "@actions('%s')?['status']" % a
def msg(a): return ("@coalesce(body('%s')?['error']?['message'], body('%s')?['message'], string(coalesce(body('%s'), '')), '')" % (a,a,a))
ROOT = "@variables('varRootSiteUrl')"
VERBOSE = {"Accept": "application/json;odata=nometadata", "Content-Type": "application/json;odata=verbose"}
NOMETA  = {"Accept": "application/json;odata=nometadata", "Content-Type": "application/json;odata=nometadata"}
MERGE   = {"Accept": "application/json;odata=nometadata", "Content-Type": "application/json;odata=nometadata", "IF-MATCH": "*"}
REG = "variables('varReviewRegisterListTitle')"
IO  = "items('Apply_to_each_Object_For_Review_Register')"
DQ  = "decodeUriComponent('%22')"
SQ  = "decodeUriComponent('%27')"
def hesc(e):
    v = "string(coalesce(%s, ''))" % e
    return ("replace(replace(replace(replace(replace(%s, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), %s, '&quot;'), %s, '&#39;')" % (v, DQ, SQ))

# =============================== Scope 06 - review register upsert (M15) =====
FIELDS = [
    ("ObjectId", 2, "SP.FieldText"), ("WebUrl", 2, "SP.FieldText"),
    ("ObjectKind", 2, "SP.FieldText"), ("ArchitectureClassification", 2, "SP.FieldText"),
    ("BusinessRelevance", 2, "SP.FieldText"), ("ServerRelativeUrl", 2, "SP.FieldText"),
    ("ItemCount", 9, "SP.FieldNumber"), ("TotalSizeBytes", 9, "SP.FieldNumber"),
    ("CustomFieldCount", 9, "SP.FieldNumber"),
    ("HasUniquePermissions", 8, "SP.Field"), ("HasRetentionLabel", 8, "SP.Field"),
    ("VersioningEnabled", 8, "SP.Field"), ("ContentTypesEnabled", 8, "SP.Field"),
    ("ReviewReason", 3, "SP.FieldMultiLineText"), ("RecommendedAction", 3, "SP.FieldMultiLineText"),
    ("LastCapturedRunId", 2, "SP.FieldText"), ("LastCapturedUtc", 4, "SP.FieldDateTime"),
    # reviewer-owned columns - created once, never written by the flow again (M15)
    ("Reviewer", 2, "SP.FieldText"), ("ReviewDecision", 2, "SP.FieldText"),
    ("ReviewOwner", 2, "SP.FieldText"), ("ActionRequired", 3, "SP.FieldMultiLineText"),
    ("DueDate", 4, "SP.FieldDateTime"), ("ReviewerNotes", 3, "SP.FieldMultiLineText"),
]
A6 = collections.OrderedDict()
A6["GET_Review_Register_List"] = sp(ROOT,
    "@concat('_api/web/lists/getbytitle(''', %s, ''')?$select=Id,Title')" % spq(REG))

PR = collections.OrderedDict()
PR["CREATE_Review_Register_List"] = sp(ROOT, "_api/web/lists", "POST", headers=VERBOSE,
    body=("{\"__metadata\":{\"type\":\"SP.List\"},\"BaseTemplate\":100,"
          "\"Title\":\"@{variables('varReviewRegisterListTitle')}\","
          "\"Description\":\"Persistent review register for the SharePoint metadata inventory. "
          "Capture columns are refreshed by the flow on every run; Reviewer, ReviewDecision, "
          "ReviewOwner, ActionRequired, DueDate and ReviewerNotes are owned by reviewers and are "
          "never overwritten.\",\"EnableVersioning\":true,\"MajorVersionLimit\":100}"))
FLD = collections.OrderedDict()
FLD["CREATE_Review_Register_Field"] = sp(ROOT,
    "@concat('_api/web/lists/getbytitle(''', %s, ''')/fields')" % spq(REG), "POST", headers=VERBOSE,
    body=("{\"__metadata\":{\"type\":\"@{items('Apply_to_each_Review_Register_Field')?['metaType']}\"},"
          "\"Title\":\"@{items('Apply_to_each_Review_Register_Field')?['name']}\","
          "\"FieldTypeKind\":@{items('Apply_to_each_Review_Register_Field')?['kind']}}"))
FLD["ADD_Field_To_Default_View"] = sp(ROOT,
    "@concat('_api/web/lists/getbytitle(''', %s, ''')/views/getbytitle(''All Items'')/viewfields/addviewfield(''', %s, ''')')"
    % (spq(REG), spq("items('Apply_to_each_Review_Register_Field')?['name']")),
    "POST", run_after=after("CREATE_Review_Register_Field", states=OK_ANY))
A6["Condition_Provision_Review_Register"] = cond(
    {"not": {"equals": [st("GET_Review_Register_List"), "Succeeded"]}}, PR,
    run_after=after("GET_Review_Register_List", states=OK_ANY))

# SELF-REVIEW FIX 2 - field creation runs on EVERY run, outside the provisioning
# condition, so a register list that exists but has lost a column self-heals. Each
# CREATE tolerates the "column already exists" failure, the normal steady state.
A6["Compose_Review_Register_Field_Plan_Ensure"] = compose(
    [{"name": n, "kind": k, "metaType": m} for n, k, m in FIELDS],
    after("Condition_Provision_Review_Register", states=OK_DONE))
A6["Apply_to_each_Review_Register_Field"] = foreach(
    "@outputs('Compose_Review_Register_Field_Plan_Ensure')", FLD, after("Compose_Review_Register_Field_Plan_Ensure"))
# index the lookup key so the register stays queryable past the list view threshold
A6["INDEX_ObjectId_Field"] = sp(ROOT,
    "@concat('_api/web/lists/getbytitle(''', %s, ''')/fields/getbyinternalnameortitle(''ObjectId'')')" % spq(REG),
    "PATCH", headers=MERGE, body={"Indexed": True},
    run_after=after("Apply_to_each_Review_Register_Field", states=OK_ANY))

UP = collections.OrderedDict()
UP["GET_Existing_Review_Register_Item"] = sp(ROOT,
    "@concat('_api/web/lists/getbytitle(''', %s, ''')/items?$select=Id&$top=1&$filter=ObjectId eq ''', %s, '''')"
    % (spq(REG), spq("%s?['objectId']" % IO)))
UP["Compose_Existing_Review_Item_Id"] = compose(
    "@if(equals(actions('GET_Existing_Review_Register_Item')?['status'], 'Succeeded'), "
    "string(coalesce(first(coalesce(body('GET_Existing_Review_Register_Item')?['value'], createArray()))?['Id'], '')), '')",
    after("GET_Existing_Review_Register_Item", states=OK_ANY))
# capture-owned columns only - reviewer columns are deliberately absent from this payload
UP["Compose_Review_Register_Item_Body"] = compose(collections.OrderedDict([
    ("Title", "@%s?['title']" % IO),
    ("ObjectId", "@%s?['objectId']" % IO),
    ("WebUrl", "@%s?['webUrl']" % IO),
    ("ObjectKind", "@%s?['objectKind']" % IO),
    ("ArchitectureClassification", "@%s?['architectureClassification']" % IO),
    ("BusinessRelevance", "@%s?['businessRelevance']" % IO),
    ("ServerRelativeUrl", "@%s?['serverRelativeUrl']" % IO),
    ("ItemCount", "@%s?['itemCount']" % IO),
    ("TotalSizeBytes", "@%s?['storage']?['totalSizeBytes']" % IO),
    ("CustomFieldCount", "@%s?['metrics']?['customFields']" % IO),
    ("HasUniquePermissions", "@%s?['settings']?['hasUniqueRoleAssignments']" % IO),
    ("HasRetentionLabel", "@%s?['hasRetentionLabel']" % IO),
    ("VersioningEnabled", "@%s?['settings']?['enableVersioning']" % IO),
    ("ContentTypesEnabled", "@%s?['settings']?['contentTypesEnabled']" % IO),
    ("ReviewReason", "@%s?['reviewReason']" % IO),
    ("RecommendedAction", "@%s?['recommendedAction']" % IO),
    ("LastCapturedRunId", "@variables('varRunId')"),
    ("LastCapturedUtc", "@variables('varCapturedAtUtc')"),
]), after("Compose_Existing_Review_Item_Id"))
UP["Condition_Upsert_Review_Register_Item"] = cond(
    {"not": {"equals": ["@outputs('Compose_Existing_Review_Item_Id')", ""]}},
    {"PATCH_Review_Register_Item": sp(ROOT,
        "@concat('_api/web/lists/getbytitle(''', %s, ''')/items(', outputs('Compose_Existing_Review_Item_Id'), ')')" % spq(REG),
        "PATCH", headers=MERGE, body="@outputs('Compose_Review_Register_Item_Body')")},
    {"POST_Review_Register_Item": sp(ROOT,
        "@concat('_api/web/lists/getbytitle(''', %s, ''')/items')" % spq(REG),
        "POST", headers=NOMETA, body="@outputs('Compose_Review_Register_Item_Body')")},
    run_after=after("Compose_Review_Register_Item_Body"))
UP["Condition_Log_Review_Register_Upsert_Error"] = cond(
    {"and": [{"not": {"equals": [st("PATCH_Review_Register_Item"), "Succeeded"]}},
             {"not": {"equals": [st("POST_Review_Register_Item"), "Succeeded"]}}]},
    {"Append_Error_Review_Register_Upsert": appendarr("varSPInventoryErrors", collections.OrderedDict([
        ("runId", "@variables('varRunId')"), ("capturedAtUtc", "@utcNow()"),
        ("severity", "Medium"), ("stage", "Upsert_Review_Register_Item"),
        ("objectId", "@%s?['objectId']" % IO), ("objectTitle", "@%s?['title']" % IO),
        ("message", "@concat('Review register upsert failed. PATCH: ', "
                    "coalesce(body('PATCH_Review_Register_Item')?['error']?['message'], ''), ' POST: ', "
                    "coalesce(body('POST_Review_Register_Item')?['error']?['message'], ''))")]))},
    run_after=after("Condition_Upsert_Review_Register_Item", states=OK_ANY))
A6["Apply_to_each_Object_For_Review_Register"] = foreach(
    "@variables('varNormalizedObjects')", UP,
    after("INDEX_ObjectId_Field", states=OK_ANY))

blob6 = scope_blob("Scope_SAVE_06_Review_Register_Upsert", A6,
    after("Scope_SAVE_05_Archive_Package"),
    sp_actions=["GET_Review_Register_List", "CREATE_Review_Register_List",
                "CREATE_Review_Register_Field", "ADD_Field_To_Default_View", "INDEX_ObjectId_Field",
                "GET_Existing_Review_Register_Item", "PATCH_Review_Register_Item",
                "POST_Review_Register_Item"])

# =============================== Scope 07 - delivery ========================
A7 = collections.OrderedDict()
A7["Filter_Findings_High_For_Email"] = query("@outputs('Compose_Findings_Ordered')",
    "@equals(item()?['severity'], 'High')")
A7["Select_Email_Finding_Rows"] = select("@take(body('Filter_Findings_High_For_Email'), 20)",
    ("@concat('<tr><td style=\"padding:6px;border:1px solid #d9e2dc\">', %s, "
     "'</td><td style=\"padding:6px;border:1px solid #d9e2dc\">', %s, "
     "'</td><td style=\"padding:6px;border:1px solid #d9e2dc\">', %s, '</td></tr>')")
    % (hesc("item()?['objectTitle']"), hesc("item()?['findingCode']"), hesc("item()?['message']")),
    after("Filter_Findings_High_For_Email"))
# M14 - an inline-styled fragment, not a whole HTML document
A7["Compose_Email_Body_Html"] = compose(
    "@concat('<div style=\"font-family:Segoe UI,Arial,sans-serif;color:#1f2933\">"
    "<h2 style=\"color:#00583a;margin:0 0 4px\">SharePoint metadata inventory complete</h2>"
    "<p style=\"margin:0 0 14px;color:#47554e\">Architecture Source of Truth run ', "
    + hesc("variables('varRunId')") + ", ' for ', " + hesc("variables('varRootSiteUrl')") + ", '</p>"
    "<table style=\"border-collapse:collapse;margin-bottom:16px\"><tr>"
    "<td style=\"padding:8px 16px 8px 0\"><b style=\"font-size:20px;color:#00583a\">', string(length(variables('varWebsCaptured'))), "
    "'</b><br>Webs</td>"
    "<td style=\"padding:8px 16px\"><b style=\"font-size:20px;color:#00583a\">', string(length(variables('varNormalizedObjects'))), "
    "'</b><br>Lists &amp; libraries</td>"
    "<td style=\"padding:8px 16px\"><b style=\"font-size:20px;color:#00583a\">', string(length(variables('varQualityFindings'))), "
    "'</b><br>Findings</td>"
    "<td style=\"padding:8px 16px\"><b style=\"font-size:20px;color:#b4670e\">', string(length(variables('varInventoryWarnings'))), "
    "'</b><br>Warnings</td>"
    "<td style=\"padding:8px 16px\"><b style=\"font-size:20px;color:#a32013\">', string(length(variables('varSPInventoryErrors'))), "
    "'</b><br>Errors</td></tr></table>', "
    "if(equals(length(body('Select_Email_Finding_Rows')), 0), "
    "'<p>No high severity findings were raised.</p>', "
    "concat('<h3 style=\"color:#00583a;margin:0 0 6px\">High severity findings</h3>"
    "<table style=\"border-collapse:collapse;font-size:13px\"><thead><tr>"
    "<th style=\"background:#00583a;color:#fff;padding:6px;text-align:left\">Object</th>"
    "<th style=\"background:#00583a;color:#fff;padding:6px;text-align:left\">Code</th>"
    "<th style=\"background:#00583a;color:#fff;padding:6px;text-align:left\">Finding</th></tr></thead><tbody>', "
    "join(body('Select_Email_Finding_Rows'), ''), '</tbody></table>', "
    "if(greater(length(body('Filter_Findings_High_For_Email')), 20), "
    "concat('<p style=\"color:#47554e\">Showing 20 of ', string(length(body('Filter_Findings_High_For_Email'))), "
    "' high severity findings. The full set is in the attached report.</p>'), ''))), "
    "'<h3 style=\"color:#00583a;margin:16px 0 6px\">Archive</h3><ul>"
    "<li><a href=\"', variables('varArchiveFolderWebUrl'), '\">Run archive folder</a> (9 files)</li>"
    "<li>Review register list: <b>', " + hesc("variables('varReviewRegisterListTitle')") + ", '</b> "
    "&mdash; decisions recorded there are preserved across runs</li></ul>"
    "<p style=\"color:#6b7a72;font-size:12px\">The CSV register, the full HTML report and the quality "
    "findings are attached. The complete raw metadata capture is in the archive folder rather than "
    "attached, to keep this message within mailbox attachment limits.</p></div>')",
    after("Select_Email_Finding_Rows"))
# H3 - explicit base64, and only the small artefacts are attached (H2)
A7["Compose_Email_Attachments"] = compose([
    collections.OrderedDict([("Name", "@outputs('Compose_File_Name_HUMAN_REVIEW_REGISTER')"),
                             ("ContentBytes", "@base64(variables('varHumanReviewCsv'))"),
                             ("ContentType", "text/csv")]),
    collections.OrderedDict([("Name", "@outputs('Compose_File_Name_ARCHITECTURE_REVIEW_REPORT')"),
                             ("ContentBytes", "@base64(outputs('Compose_Architecture_Review_Report_Html'))"),
                             ("ContentType", "text/html")]),
    collections.OrderedDict([("Name", "@outputs('Compose_File_Name_METADATA_QUALITY_FINDINGS')"),
                             ("ContentBytes", "@base64(string(outputs('Compose_Quality_Findings_Payload')))"),
                             ("ContentType", "application/json")]),
], after("Compose_Email_Body_Html"))
A7["Send_Metadata_Inventory_Notification"] = collections.OrderedDict([
    ("type", "OpenApiConnection"),
    ("inputs", {"parameters": collections.OrderedDict([
        ("emailMessage/To", "@variables('varNotificationRecipients')"),
        ("emailMessage/Subject",
         "@concat('SharePoint metadata inventory - ', variables('varArchiveTimestamp'), ' - ', "
         "string(length(variables('varNormalizedObjects'))), ' objects, ', "
         "string(length(variables('varQualityFindings'))), ' findings, ', "
         "string(length(variables('varSPInventoryErrors'))), ' errors')"),
        ("emailMessage/Body", "@outputs('Compose_Email_Body_Html')"),
        ("emailMessage/Attachments", "@outputs('Compose_Email_Attachments')"),
        ("emailMessage/Importance",
         "@if(greater(length(variables('varSPInventoryErrors')), 0), 'High', 'Normal')"),
    ]), "host": O365_HOST}),
    ("runtimeConfiguration", RETRY),
    ("runAfter", after("Compose_Email_Attachments")),
])
A7["Set_varDeliveryStatus"] = setvar("varDeliveryStatus",
    st("Send_Metadata_Inventory_Notification"),
    after("Send_Metadata_Inventory_Notification", states=OK_ANY))
A7["Condition_Log_Delivery_Failure"] = cond(
    {"not": {"equals": ["@variables('varDeliveryStatus')", "Succeeded"]}},
    {"Append_Error_Delivery": appendarr("varSPInventoryErrors", collections.OrderedDict([
        ("runId", "@variables('varRunId')"), ("capturedAtUtc", "@utcNow()"),
        ("severity", "Medium"), ("stage", "Send_Metadata_Inventory_Notification"),
        ("status", "@variables('varDeliveryStatus')"),
        ("message", msg("Send_Metadata_Inventory_Notification"))]))},
    run_after=after("Set_varDeliveryStatus"))

blob7 = scope_blob("Scope_DELIVER_07_Notification", A7,
    after("Scope_SAVE_06_Review_Register_Upsert", states=OK_ANY),
    o365_actions=["Send_Metadata_Inventory_Notification"])

# =============================== Scope 08 - run outcome (M11) ===============
A8 = collections.OrderedDict()
A8["Compose_Run_Outcome"] = compose(collections.OrderedDict([
    ("runId", "@variables('varRunId')"),
    ("rootSiteUrl", ROOT),
    ("completedAtUtc", "@utcNow()"),
    ("websCaptured", "@length(variables('varWebsCaptured'))"),
    ("websLeftUncaptured", "@length(variables('varWebQueue'))"),
    ("listsDiscovered", "@length(variables('varAllListsRaw'))"),
    ("listsDeepCaptured", "@length(variables('varNormalizedObjects'))"),
    ("qualityFindings", "@length(variables('varQualityFindings'))"),
    ("warningsLogged", "@length(variables('varInventoryWarnings'))"),
    ("errorsLogged", "@length(variables('varSPInventoryErrors'))"),
    ("errorThreshold", "@variables('varMaxErrorsBeforeFail')"),
    ("archiveFolderWebUrl", "@variables('varArchiveFolderWebUrl')"),
    ("archivedFiles", "@variables('varArchivedFiles')"),
    ("emailDeliveryStatus", "@variables('varDeliveryStatus')"),
    ("fatalCapture", "@variables('varFatalCapture')"),
]))
A8["Condition_Fail_Run_On_Unusable_Capture"] = cond(
    {"or": [
        {"equals": ["@variables('varFatalCapture')", True]},
        {"equals": ["@length(variables('varNormalizedObjects'))", 0]},
        {"greater": ["@length(variables('varSPInventoryErrors'))", "@variables('varMaxErrorsBeforeFail')"]},
    ]},
    {"Terminate_Run_As_Failed": collections.OrderedDict([
        ("type", "Terminate"),
        ("inputs", {"runStatus": "Failed", "runError": {
            "code": "MetadataCaptureIncomplete",
            "message": "@concat('The capture is not trustworthy and the run is being failed deliberately. Objects captured: ', "
                       "string(length(variables('varNormalizedObjects'))), '. Errors logged: ', "
                       "string(length(variables('varSPInventoryErrors'))), ' (threshold ', "
                       "string(variables('varMaxErrorsBeforeFail')), '). Fatal capture flag: ', "
                       "string(variables('varFatalCapture')), '. Archive: ', variables('varArchiveFolderWebUrl'))"}}),
    ])},
    run_after=after("Compose_Run_Outcome"))

blob8 = scope_blob("Scope_FINALIZE_08_Run_Outcome", A8,
                   after("Scope_DELIVER_07_Notification", states=OK_ANY))

for path, blobs, hdr in [
    (REPO + "/06_scope_review_register_upsert.json", [blob6], [
        "# 06 - Scope_SAVE_06_Review_Register_Upsert",
        "#",
        "# M15 Reviewer decisions previously died at the next run, because the register was",
        "#     regenerated from scratch every time. This scope provisions (once) a SharePoint",
        "#     list keyed on ObjectId and upserts each captured object into it.",
        "#",
        "#     Capture-owned columns are refreshed every run. The six reviewer-owned columns -",
        "#     Reviewer, ReviewDecision, ReviewOwner, ActionRequired, DueDate, ReviewerNotes -",
        "#     are created once and never appear in the update payload, so what a reviewer",
        "#     enters survives every subsequent capture.",
        "#",
        "#     ObjectId is indexed so the register stays queryable past the 5000 item list",
        "#     view threshold. Provisioning is skipped entirely when the list already exists.",
        "#",
        "# Requires one extra top-level initialiser (see 00_initialize_variables.json):",
        "#   varReviewRegisterListTitle = 'SharePoint Metadata Review Register'",
    ]),
    (REPO + "/07_scope_delivery.json", [blob7], [
        "# 07 - Scope_DELIVER_07_Notification",
        "#",
        "# M7  ONE email replaces the four near-identical messages, and the recipient comes",
        "#     from varNotificationRecipients rather than being hardcoded in four places.",
        "#     The subject carries object, finding and error counts, and importance escalates",
        "#     to High whenever anything failed.",
        "# H3  ContentBytes is explicitly base64-encoded and each attachment declares its",
        "#     ContentType. No object is ever passed to a byte-format parameter.",
        "# H2  Only the CSV register, the HTML report and the quality findings are attached.",
        "#     The full raw metadata stays in the archive and is linked, so the message can",
        "#     no longer breach mailbox attachment limits.",
        "# H4  This scope runs AFTER every artefact has been produced and archived, and its",
        "#     runAfter tolerates a failed upstream scope, so delivery can never gate the",
        "#     production of the review package.",
        "# M14 The body is an inline-styled fragment, not a full HTML document with a <style>",
        "#     block that Outlook strips.",
        "# M1  Delivery status is captured once, into varDeliveryStatus, and read from there.",
    ]),
    (REPO + "/08_scope_run_outcome.json", [blob8], [
        "# 08 - Scope_FINALIZE_08_Run_Outcome",
        "#",
        "# M11 The flow can now fail. Previously every path degraded to an empty array, so a",
        "#     run whose very first call returned 403 still reported Succeeded, still emailed",
        "#     a clean-looking report and still archived an empty source of truth.",
        "#",
        "#     The run is terminated as Failed when the archive library could not be",
        "#     provisioned, when zero objects were captured, or when the error count exceeds",
        "#     varMaxErrorsBeforeFail. The notification has already gone out by this point,",
        "#     so operators get both the detail and an unambiguous red run.",
    ]),
]:
    print(path.split('/')[-1], write(path, blobs, hdr), "bytes")
