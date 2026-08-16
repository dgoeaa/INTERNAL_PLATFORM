import sys, collections
sys.path.insert(0, '.')
from gen_common import *

REPO = "/home/user/INTERNAL_PLATFORM/docs/flow"

# ---------------------------------------------------------------- initializers
VARS = [
    ("varRootSiteUrl", "string", "@trim(coalesce(variables('Sharepoint_Site_url'), ''))"),
    ("varRunId", "string", "@workflow()?['run']?['name']"),
    ("varCapturedAtUtc", "string", "@utcNow()"),
    ("varTenantRootUrl", "string", ""),
    ("varSiteServerRelativeUrl", "string", ""),
    ("varArchiveLibraryTitle", "string", "Architecture Source of Truth"),
    ("varReviewRegisterListTitle", "string", "SharePoint Metadata Review Register"),
    ("varNotificationRecipients", "string", "dgsRegistry@nitda.gov.ng"),
    ("varIncludeHiddenLists", "boolean", True),
    ("varIncludeSchemaXml", "boolean", True),
    ("varMaxWebs", "integer", 200),
    ("varMaxErrorsBeforeFail", "integer", 25),
    ("varWebQueue", "array", []),
    ("varWebsCaptured", "array", []),
    ("varWebTraversalDone", "boolean", False),
    ("varCurrentWebUrl", "string", ""),
    ("varWebCollections", "object", {}),
    ("varListCollections", "object", {}),
    ("varListRetrievalStatus", "object", {}),
    ("varCollectionAccumulator", "array", []),
    ("varCollectionNextUri", "string", ""),
    ("varCollectionPagingDone", "boolean", False),
    ("varAllListsRaw", "array", []),
    ("varNormalizedObjects", "array", []),
    ("varSPInventoryRows", "array", []),
    ("varSPInventoryErrors", "array", []),
    ("varInventoryWarnings", "array", []),
    ("varQualityFindings", "array", []),
    ("varArchiveTimestamp", "string", ""),
    ("varArchiveLibraryServerRelativeUrl", "string", ""),
    ("varArchiveLibraryProvisioned", "boolean", False),
    ("varArchiveFolderServerRelativeUrl", "string", ""),
    ("varArchiveFolderWebUrl", "string", ""),
    ("varArchivedFiles", "array", []),
    ("varHumanReviewCsv", "string", ""),
    ("varDeliveryStatus", "string", ""),
    ("varFatalCapture", "boolean", False),
]

init_blobs = []
for n, t, v in VARS:
    act = collections.OrderedDict([
        ("type", "InitializeVariable"),
        ("inputs", {"variables": [{"name": n, "type": t, "value": v}]}),
        ("runAfter", {}),
    ])
    init_blobs.append(action_blob("Initialize_%s" % n, act))

hdr = [
    "# 00 - TOP-LEVEL VARIABLE INITIALISERS",
    "#",
    "# Power Automate only permits 'Initialize variable' at the ROOT of a flow (never",
    "# inside a Scope), so these 35 actions paste as root-level siblings, in the order",
    "# below, immediately AFTER the existing 'Sharepoint_Site_url' initialiser and",
    "# BEFORE Scope_PREP_01_Run_Context.",
    "#",
    "# varRootSiteUrl seeds itself from the flow's existing Sharepoint_Site_url variable,",
    "# so the trigger wiring is untouched while every downstream reference now uses the",
    "# var* convention (L4).",
    "# varRunId is the single run identifier used by every artefact (M13).",
    "# varInventoryWarnings is populated by Scope 02/03 and is no longer dead (M12).",
    "# var_SharePoint_Metadata_Report is deleted outright (B3).",
]
n = write(REPO + "/00_initialize_variables.json", init_blobs, hdr)
print("00_initialize_variables.json", n, "bytes,", len(init_blobs), "blobs")

# ------------------------------------------------------- Scope_PREP_01
A = collections.OrderedDict()

A["Set_varRootSiteUrl_Normalized"] = setvar(
    "varRootSiteUrl",
    "@if(endsWith(trim(variables('varRootSiteUrl')), '/'), substring(trim(variables('varRootSiteUrl')), 0, sub(length(trim(variables('varRootSiteUrl'))), 1)), trim(variables('varRootSiteUrl')))")

A["Set_varTenantRootUrl"] = setvar(
    "varTenantRootUrl",
    "@concat(first(split(variables('varRootSiteUrl'), '/')), '//', last(take(split(variables('varRootSiteUrl'), '/'), 3)))",
    after("Set_varRootSiteUrl_Normalized"))

A["Set_varSiteServerRelativeUrl"] = setvar(
    "varSiteServerRelativeUrl",
    "@if(lessOrEquals(length(split(variables('varRootSiteUrl'), '/')), 3), '', concat('/', join(skip(split(variables('varRootSiteUrl'), '/'), 3), '/')))",
    after("Set_varTenantRootUrl"))

A["Set_varArchiveTimestamp"] = setvar(
    "varArchiveTimestamp", "@formatDateTime(variables('varCapturedAtUtc'), 'yyyyMMdd_HHmmss')",
    after("Set_varSiteServerRelativeUrl"))

A["Compose_Run_Context"] = compose(collections.OrderedDict([
    ("schemaVersion", "3.0"),
    ("runId", "@variables('varRunId')"),
    ("flowName", "@workflow()?['name']"),
    ("rootSiteUrl", "@variables('varRootSiteUrl')"),
    ("tenantRootUrl", "@variables('varTenantRootUrl')"),
    ("siteServerRelativeUrl", "@variables('varSiteServerRelativeUrl')"),
    ("capturedAtUtc", "@variables('varCapturedAtUtc')"),
    ("archiveTimestamp", "@variables('varArchiveTimestamp')"),
    ("options", collections.OrderedDict([
        ("includeHiddenLists", "@variables('varIncludeHiddenLists')"),
        ("includeSchemaXml", "@variables('varIncludeSchemaXml')"),
        ("maxWebs", "@variables('varMaxWebs')"),
        ("maxErrorsBeforeFail", "@variables('varMaxErrorsBeforeFail')"),
    ])),
]), after("Set_varArchiveTimestamp"))

# Fail fast on an unusable site URL - the flow must be able to fail (M11)
A["Condition_Validate_Root_Site_Url"] = cond(
    {"or": [{"equals": ["@empty(variables('varRootSiteUrl'))", True]},
            {"not": {"startsWith": ["@toLower(variables('varRootSiteUrl'))", "https://"]}}]},
    collections.OrderedDict([
        ("Append_Fatal_Invalid_Site_Url", appendarr("varSPInventoryErrors", collections.OrderedDict([
            ("runId", "@variables('varRunId')"),
            ("capturedAtUtc", "@utcNow()"),
            ("severity", "Fatal"),
            ("stage", "Validate_Root_Site_Url"),
            ("siteUrl", "@variables('varRootSiteUrl')"),
            ("httpStatus", 0),
            ("message", "Root site URL is empty or is not an absolute https URL. Nothing can be captured."),
        ]))),
        ("Terminate_Invalid_Site_Url", collections.OrderedDict([
            ("type", "Terminate"),
            ("inputs", {"runStatus": "Failed",
                        "runError": {"code": "InvalidRootSiteUrl",
                                     "message": "@concat('Root site URL is not usable: ''', variables('varRootSiteUrl'), '''. Set Sharepoint_Site_url to an absolute https site URL.')"}}),
            ("runAfter", after("Append_Fatal_Invalid_Site_Url")),
        ])),
    ]),
    run_after=after("Compose_Run_Context"))

A["Set_varWebQueue_Seed"] = setvar(
    "varWebQueue", "@createArray(variables('varRootSiteUrl'))",
    after("Condition_Validate_Root_Site_Url", states=OK_DONE))

blob = scope_blob("Scope_PREP_01_Run_Context", A, {})
hdr = [
    "# 01 - Scope_PREP_01_Run_Context",
    "#",
    "# Derives tenant root and site-server-relative URL from the site URL (no hardcoding),",
    "# normalises the trailing slash so composed web URLs never double up (L6), stamps one",
    "# run identifier and one capture timestamp for every artefact (M13), and terminates",
    "# the run outright when the site URL cannot be used (M11).",
    "#",
    "# Paste position: first scope, directly after the top-level initialisers.",
]
n = write(REPO + "/01_scope_prep_run_context.json", [blob], hdr)
print("01_scope_prep_run_context.json", n, "bytes")
