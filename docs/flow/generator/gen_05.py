import sys, collections
sys.path.insert(0, '.')
from gen_common import *
REPO = "/home/user/INTERNAL_PLATFORM/docs/flow"

def spq(expr):   # double apostrophes for an OData string literal
    return "replace(%s, '''', '''''')" % expr
def st(a):  return "@actions('%s')?['status']" % a
def msg(a): return ("@coalesce(body('%s')?['error']?['message'], body('%s')?['message'], string(coalesce(body('%s'), '')), '')" % (a,a,a))
def code(a):return "@coalesce(outputs('%s')?['statusCode'], 0)" % a
def surl(a): return "@string(coalesce(body('%s')?['ServerRelativeUrl'], ''))" % a

ROOT = "@variables('varRootSiteUrl')"
VERBOSE = {"Accept": "application/json;odata=nometadata",
           "Content-Type": "application/json;odata=verbose"}
FOLDER = "variables('varArchiveFolderServerRelativeUrl')"
OWNERGRP = "first(variables('varWebsCaptured'))?['associatedGroups']?['AssociatedOwnerGroup']?['Id']"
MEMBGRP  = "first(variables('varWebsCaptured'))?['associatedGroups']?['AssociatedMemberGroup']?['Id']"
VISITGRP = "first(variables('varWebsCaptured'))?['associatedGroups']?['AssociatedVisitorGroup']?['Id']"

A = collections.OrderedDict()
A["GET_Current_User"] = sp(ROOT, "_api/web/currentuser?$select=Id,Title,LoginName,Email")
A["Compose_Current_User_Safe"] = compose(
    "@if(equals(actions('GET_Current_User')?['status'], 'Succeeded'), coalesce(body('GET_Current_User'), json('{}')), json('{}'))",
    after("GET_Current_User", states=OK_ANY))

A["GET_Archive_Library"] = sp(ROOT,
    "@concat('_api/web/lists/getbytitle(''', %s, ''')?$expand=RootFolder&$select=Id,Title,RootFolder/ServerRelativeUrl'"
    ")" % spq("variables('varArchiveLibraryTitle')"),
    run_after=after("Compose_Current_User_Safe"))

# H7 - a dedicated library, not Shared Documents, with inheritance broken on creation
PROV = collections.OrderedDict()
PROV["CREATE_Archive_Library"] = sp(ROOT, "_api/web/lists", "POST", headers=VERBOSE,
    body=("{\"__metadata\":{\"type\":\"SP.List\"},\"BaseTemplate\":101,"
          "\"Title\":\"@{variables('varArchiveLibraryTitle')}\","
          "\"Description\":\"Restricted archive of SharePoint metadata inventory runs. "
          "Contains permission and identity data; access is intentionally not inherited from the site.\","
          "\"EnableVersioning\":true,\"MajorVersionLimit\":50,\"ContentTypesEnabled\":false,\"NoCrawl\":true}"))
PROV["Set_varArchiveLibraryProvisioned"] = setvar("varArchiveLibraryProvisioned", True,
    after("CREATE_Archive_Library"))
# copyRoleAssignments=true first so the running identity can never lock itself out mid-provision
PROV["BREAK_Archive_Library_Inheritance"] = sp(ROOT,
    "@concat('_api/web/lists/getbytitle(''', %s, ''')/breakroleinheritance(copyRoleAssignments=true,clearSubscopes=true)')" % spq("variables('varArchiveLibraryTitle')"),
    "POST", run_after=after("Set_varArchiveLibraryProvisioned"))
PROV["Condition_Remove_Members_Group"] = cond(
    {"not": {"equals": ["@string(coalesce(%s, ''))" % MEMBGRP, ""]}},
    {"REMOVE_Members_Group_From_Archive": sp(ROOT,
        "@concat('_api/web/lists/getbytitle(''', %s, ''')/roleassignments/getbyprincipalid(', string(%s), ')')" % (
            spq("variables('varArchiveLibraryTitle')"), MEMBGRP),
        "DELETE")},
    run_after=after("BREAK_Archive_Library_Inheritance", states=OK_ANY))
PROV["Condition_Remove_Visitors_Group"] = cond(
    {"not": {"equals": ["@string(coalesce(%s, ''))" % VISITGRP, ""]}},
    {"REMOVE_Visitors_Group_From_Archive": sp(ROOT,
        "@concat('_api/web/lists/getbytitle(''', %s, ''')/roleassignments/getbyprincipalid(', string(%s), ')')" % (
            spq("variables('varArchiveLibraryTitle')"), VISITGRP),
        "DELETE")},
    run_after=after("Condition_Remove_Members_Group", states=OK_DONE))
PROV["Condition_Grant_Owner_Group_Full_Control"] = cond(
    {"not": {"equals": ["@string(coalesce(%s, ''))" % OWNERGRP, ""]}},
    {"GRANT_Owner_Group_Full_Control": sp(ROOT,
        "@concat('_api/web/lists/getbytitle(''', %s, ''')/roleassignments/addroleassignment(principalid=', string(%s), ',roledefid=1073741829)')" % (
            spq("variables('varArchiveLibraryTitle')"), OWNERGRP),
        "POST")},
    run_after=after("Condition_Remove_Visitors_Group", states=OK_DONE))
PROV["Condition_Grant_Run_Identity_Full_Control"] = cond(
    {"not": {"equals": ["@string(coalesce(outputs('Compose_Current_User_Safe')?['Id'], ''))", ""]}},
    {"GRANT_Run_Identity_Full_Control": sp(ROOT,
        "@concat('_api/web/lists/getbytitle(''', %s, ''')/roleassignments/addroleassignment(principalid=', string(outputs('Compose_Current_User_Safe')?['Id']), ',roledefid=1073741829)')" % spq("variables('varArchiveLibraryTitle')"),
        "POST")},
    run_after=after("Condition_Grant_Owner_Group_Full_Control", states=OK_DONE))
PROV["GET_Archive_Library_After_Create"] = sp(ROOT,
    "@concat('_api/web/lists/getbytitle(''', %s, ''')?$expand=RootFolder&$select=Id,Title,RootFolder/ServerRelativeUrl')" % spq("variables('varArchiveLibraryTitle')"),
    run_after=after("Condition_Grant_Run_Identity_Full_Control", states=OK_DONE))

A["Condition_Provision_Archive_Library"] = cond(
    {"not": {"equals": [st("GET_Archive_Library"), "Succeeded"]}}, PROV,
    run_after=after("GET_Archive_Library", states=OK_ANY))

A["Set_varArchiveLibraryServerRelativeUrl"] = setvar("varArchiveLibraryServerRelativeUrl",
    "@if(equals(actions('GET_Archive_Library')?['status'], 'Succeeded'), "
    "string(coalesce(body('GET_Archive_Library')?['RootFolder']?['ServerRelativeUrl'], '')), "
    "string(coalesce(body('GET_Archive_Library_After_Create')?['RootFolder']?['ServerRelativeUrl'], '')))",
    after("Condition_Provision_Archive_Library", states=OK_DONE))

A["Condition_Archive_Library_Unavailable"] = cond(
    {"equals": ["@empty(variables('varArchiveLibraryServerRelativeUrl'))", True]},
    collections.OrderedDict([
        ("Append_Error_Archive_Library_Unavailable", appendarr("varSPInventoryErrors", collections.OrderedDict([
            ("runId", "@variables('varRunId')"), ("capturedAtUtc", "@utcNow()"),
            ("severity", "Fatal"), ("stage", "Provision_Archive_Library"),
            ("siteUrl", ROOT), ("httpStatus", code("GET_Archive_Library")),
            ("message", "@concat('The archive library could not be found or provisioned. ', "
                        "coalesce(body('CREATE_Archive_Library')?['error']?['message'], body('CREATE_Archive_Library')?['message'], body('GET_Archive_Library')?['message'], 'No further detail was returned.'))")]))),
        ("Set_varFatalCapture_Archive", setvar("varFatalCapture", True,
            after("Append_Error_Archive_Library_Unavailable"))),
    ]),
    run_after=after("Set_varArchiveLibraryServerRelativeUrl"))

A["Compose_Archive_Run_Folder_ServerRelativeUrl"] = compose(
    "@concat(variables('varArchiveLibraryServerRelativeUrl'), '/', variables('varArchiveTimestamp'), '_', variables('varRunId'))",
    after("Condition_Archive_Library_Unavailable", states=OK_DONE))
# M9 - AddUsingPath / GetFolderByServerRelativePath, no hand-rolled %20 encoding, no JSON string body
A["CREATE_Archive_Run_Folder"] = sp(ROOT,
    "@concat('_api/web/folders/addUsingPath(DecodedUrl=''', %s, ''')')" % spq("outputs('Compose_Archive_Run_Folder_ServerRelativeUrl')"),
    "POST", run_after=after("Compose_Archive_Run_Folder_ServerRelativeUrl"))
A["Set_varArchiveFolderServerRelativeUrl"] = setvar("varArchiveFolderServerRelativeUrl",
    "@outputs('Compose_Archive_Run_Folder_ServerRelativeUrl')",
    after("CREATE_Archive_Run_Folder", states=OK_ANY))
A["Set_varArchiveFolderWebUrl"] = setvar("varArchiveFolderWebUrl",
    "@concat(variables('varTenantRootUrl'), variables('varArchiveFolderServerRelativeUrl'))",
    after("Set_varArchiveFolderServerRelativeUrl"))
# SELF-REVIEW FIX 4 - the run folder is timestamp+runId so it cannot pre-exist;
# a creation failure therefore dooms all nine file writes and is genuinely fatal.
A["Condition_Archive_Folder_Unavailable"] = cond(
    {"not": {"equals": [st("CREATE_Archive_Run_Folder"), "Succeeded"]}},
    collections.OrderedDict([
        ("Append_Error_Archive_Folder", appendarr("varSPInventoryErrors", collections.OrderedDict([
            ("runId", "@variables(%svarRunId%s)" % (chr(39), chr(39))),
            ("capturedAtUtc", "@utcNow()"), ("severity", "Fatal"),
            ("stage", "CREATE_Archive_Run_Folder"),
            ("endpoint", "@variables(%svarArchiveFolderServerRelativeUrl%s)" % (chr(39), chr(39))),
            ("status", st("CREATE_Archive_Run_Folder")),
            ("httpStatus", code("CREATE_Archive_Run_Folder")),
            ("message", msg("CREATE_Archive_Run_Folder"))]))),
        ("Set_varFatalCapture_Folder", setvar("varFatalCapture", True,
            after("Append_Error_Archive_Folder"))),
    ]),
    run_after=after("Set_varArchiveFolderWebUrl"))

FILES = [
    ("01", "FULL_RAW_METADATA", "json", "@string(outputs('Compose_Full_Raw_Metadata'))", "application/json; charset=utf-8"),
    ("02", "NORMALIZED_METADATA_REGISTER", "json", "@string(outputs('Compose_Normalized_Register'))", "application/json; charset=utf-8"),
    ("03", "METADATA_QUALITY_FINDINGS", "json", "@string(outputs('Compose_Quality_Findings_Payload'))", "application/json; charset=utf-8"),
    ("04", "CAPTURE_ERROR_LOG", "json", "@string(variables('varSPInventoryErrors'))", "application/json; charset=utf-8"),
    ("05", "CAPTURE_WARNING_LOG", "json", "@string(variables('varInventoryWarnings'))", "application/json; charset=utf-8"),
    ("06", "HUMAN_REVIEW_REGISTER", "csv", "@variables('varHumanReviewCsv')", "text/csv; charset=utf-8"),
    ("07", "ARCHITECTURE_REVIEW_REPORT", "html", "@outputs('Compose_Architecture_Review_Report_Html')", "text/html; charset=utf-8"),
]
prev = "Condition_Archive_Folder_Unavailable"
for num, name, ext, body, ctype in FILES:
    nm = "Compose_File_Name_%s" % name
    A[nm] = compose("@concat('%s_%s_', variables('varArchiveTimestamp'), '.%s')" % (num, name, ext),
                    after(prev))
    act = "CREATE_File_%s_%s" % (num, name)
    A[act] = sp(ROOT,
        "@concat('_api/web/GetFolderByServerRelativePath(decodedurl=''', %s, ''')/Files/AddUsingPath(decodedurl=''', %s, ''',overwrite=true)')"
        % (spq(FOLDER), spq("outputs('%s')" % nm)),
        "POST", body=body,
        headers={"Accept": "application/json;odata=nometadata", "Content-Type": ctype},
        run_after=after(nm))
    prev = act

# H2 - the human review register links to the archived raw file, it does not re-embed it
A["Compose_Human_Review_Register_Json"] = compose(collections.OrderedDict([
    ("schemaVersion", "3.0"),
    ("outputType", "SharePointHumanReviewRegister"),
    ("purpose", "Reviewer-facing register of every SharePoint list and library captured in this run, with governance settings, quality findings and the sign-off columns held in the companion SharePoint list."),
    ("summary", "@outputs('Compose_Run_Summary')"),
    ("reviewGuidance", collections.OrderedDict([
        ("howToUse", [
            "Start with objects whose businessRelevance is High, then Medium.",
            "Confirm owner, business purpose, metadata adequacy, versioning, content types, retention and security for each.",
            "Every object with hasUniqueRoleAssignments true needs an explicit decision on whether the broken inheritance is intentional.",
            "Record decisions in the SharePoint list named in reviewRegisterListTitle. Decisions entered there are preserved across runs; this JSON file and the CSV are regenerated every run.",
        ]),
        ("recommendedDecisions", [
            "Approved", "Approved with actions", "Needs metadata improvement",
            "Needs ownership assignment", "Needs security review", "Needs retention review",
            "Archive or decommission", "Exclude from business review",
        ]),
    ])),
    ("reviewRegisterListTitle", "SharePoint Metadata Review Register"),
    ("archive", collections.OrderedDict([
        ("folderServerRelativeUrl", "@variables('varArchiveFolderServerRelativeUrl')"),
        ("folderWebUrl", "@variables('varArchiveFolderWebUrl')"),
        ("fullRawMetadataUrl", "@concat(variables('varTenantRootUrl'), %s)" % surl("CREATE_File_01_FULL_RAW_METADATA")[1:]),
        ("normalizedRegisterUrl", "@concat(variables('varTenantRootUrl'), %s)" % surl("CREATE_File_02_NORMALIZED_METADATA_REGISTER")[1:]),
        ("qualityFindingsUrl", "@concat(variables('varTenantRootUrl'), %s)" % surl("CREATE_File_03_METADATA_QUALITY_FINDINGS")[1:]),
        ("csvRegisterUrl", "@concat(variables('varTenantRootUrl'), %s)" % surl("CREATE_File_06_HUMAN_REVIEW_REGISTER")[1:]),
        ("htmlReportUrl", "@concat(variables('varTenantRootUrl'), %s)" % surl("CREATE_File_07_ARCHITECTURE_REVIEW_REPORT")[1:]),
    ])),
    ("objects", "@variables('varNormalizedObjects')"),
    ("qualityFindings", "@outputs('Compose_Findings_Ordered')"),
    ("warnings", "@variables('varInventoryWarnings')"),
    ("errors", "@variables('varSPInventoryErrors')"),
]), after(prev, states=OK_ANY))
A["Compose_File_Name_HUMAN_REVIEW_REGISTER_JSON"] = compose(
    "@concat('08_HUMAN_REVIEW_REGISTER_', variables('varArchiveTimestamp'), '.json')",
    after("Compose_Human_Review_Register_Json"))
A["CREATE_File_08_HUMAN_REVIEW_REGISTER_JSON"] = sp(ROOT,
    "@concat('_api/web/GetFolderByServerRelativePath(decodedurl=''', %s, ''')/Files/AddUsingPath(decodedurl=''', %s, ''',overwrite=true)')"
    % (spq(FOLDER), spq("outputs('Compose_File_Name_HUMAN_REVIEW_REGISTER_JSON')")),
    "POST", body="@string(outputs('Compose_Human_Review_Register_Json'))",
    run_after=after("Compose_File_Name_HUMAN_REVIEW_REGISTER_JSON"))

A["Compose_Run_Manifest"] = compose(collections.OrderedDict([
    ("manifestType", "SharePointMetadataInventoryArchitectureSourceOfTruth"),
    ("schemaVersion", "3.0"),
    ("runId", "@variables('varRunId')"),
    ("rootSiteUrl", ROOT),
    ("capturedAtUtc", "@variables('varCapturedAtUtc')"),
    ("archiveFolderServerRelativeUrl", "@variables('varArchiveFolderServerRelativeUrl')"),
    ("archiveFolderWebUrl", "@variables('varArchiveFolderWebUrl')"),
    ("archiveLibraryTitle", "@variables('varArchiveLibraryTitle')"),
    ("archiveLibraryProvisionedThisRun", "@variables('varArchiveLibraryProvisioned')"),
    ("counts", "@outputs('Compose_Run_Summary')"),
    ("files", [collections.OrderedDict([
        ("name", "@outputs('Compose_File_Name_%s')" % n),
        ("status", st("CREATE_File_%s_%s" % (num, n))),
        ("serverRelativeUrl", surl("CREATE_File_%s_%s" % (num, n))),
        ("message", msg("CREATE_File_%s_%s" % (num, n))),
    ]) for num, n, _, _, _ in FILES] + [collections.OrderedDict([
        ("name", "@outputs('Compose_File_Name_HUMAN_REVIEW_REGISTER_JSON')"),
        ("status", st("CREATE_File_08_HUMAN_REVIEW_REGISTER_JSON")),
        ("serverRelativeUrl", surl("CREATE_File_08_HUMAN_REVIEW_REGISTER_JSON")),
        ("message", msg("CREATE_File_08_HUMAN_REVIEW_REGISTER_JSON")),
    ])]),
]), after("CREATE_File_08_HUMAN_REVIEW_REGISTER_JSON", states=OK_ANY))
A["Compose_File_Name_RUN_MANIFEST"] = compose(
    "@concat('09_RUN_MANIFEST_', variables('varArchiveTimestamp'), '.json')", after("Compose_Run_Manifest"))
A["CREATE_File_09_RUN_MANIFEST"] = sp(ROOT,
    "@concat('_api/web/GetFolderByServerRelativePath(decodedurl=''', %s, ''')/Files/AddUsingPath(decodedurl=''', %s, ''',overwrite=true)')"
    % (spq(FOLDER), spq("outputs('Compose_File_Name_RUN_MANIFEST')")),
    "POST", body="@string(outputs('Compose_Run_Manifest'))",
    run_after=after("Compose_File_Name_RUN_MANIFEST"))
A["Set_varArchivedFiles"] = setvar("varArchivedFiles", "@outputs('Compose_Run_Manifest')?['files']",
    after("CREATE_File_09_RUN_MANIFEST", states=OK_ANY))

spn = (["GET_Current_User", "GET_Archive_Library", "CREATE_Archive_Library",
        "BREAK_Archive_Library_Inheritance", "REMOVE_Members_Group_From_Archive",
        "REMOVE_Visitors_Group_From_Archive", "GRANT_Owner_Group_Full_Control",
        "GRANT_Run_Identity_Full_Control", "GET_Archive_Library_After_Create",
        "CREATE_Archive_Run_Folder"]
       + ["CREATE_File_%s_%s" % (n, m) for n, m, _, _, _ in FILES]
       + ["CREATE_File_08_HUMAN_REVIEW_REGISTER_JSON", "CREATE_File_09_RUN_MANIFEST"])
blob = scope_blob("Scope_SAVE_05_Archive_Package", A,
                  after("Scope_BUILD_04_Registers_Reports_And_Csv"), sp_actions=spn)
hdr = [
    "# 05 - Scope_SAVE_05_Archive_Package",
    "#",
    "# H7  The archive no longer lands in Shared Documents where every site member can read",
    "#     permission maps and login names. On first run the flow provisions a dedicated",
    "#     library, breaks role inheritance with copyRoleAssignments=true (so the running",
    "#     identity can never lock itself out mid-provision), then removes the site's default",
    "#     Members and Visitors groups and grants Full Control to the site Owners group and",
    "#     the run identity. Group ids come from the associated-groups capture in Scope 02,",
    "#     so nothing is hardcoded. Existing libraries are left untouched.",
    "# M9  AddUsingPath / GetFolderByServerRelativePath throughout - no replace(' ','%20'),",
    "#     no JSON built by string interpolation. Apostrophes in any path segment are",
    "#     doubled for the OData string literal.",
    "# M5  Every file body is wrapped in string().",
    "# M10 The nine file writes are chained on Succeeded, Failed, Skipped and TimedOut, so",
    "#     one failure never skips the rest, and the manifest records per-file status,",
    "#     server-relative URL and the real error message.",
    "# M11 A missing, unprovisionable archive library sets varFatalCapture for Scope 08.",
    "# L1  One SharePoint connection reference. The second connection is gone.",
]
n = write(REPO + "/05_scope_archive_package.json", [blob], hdr)
print("05 written:", n, "bytes")
