import sys, collections
sys.path.insert(0, '.')
from gen_common import *
REPO = "/home/user/INTERNAL_PLATFORM/docs/flow"

def msg(a):   # M2 - keep the real connector error text, not a generic fallback
    return ("@coalesce(body('%s')?['error']?['message'], body('%s')?['message'], "
            "string(coalesce(body('%s'), '')), '')" % (a, a, a))
def code(a):
    return "@coalesce(outputs('%s')?['statusCode'], 0)" % a
def st(a):
    return "@actions('%s')?['status']" % a
def safe(a):  # empty array / empty object fallback, never a failed run
    return ("@if(equals(actions('%s')?['status'], 'Succeeded'), coalesce(body('%s'), json('{}')), json('{}'))" % (a, a))

CUR = "@variables('varCurrentWebUrl')"
ROOT = "@variables('varRootSiteUrl')"

A = collections.OrderedDict()

# Static retrieval plan - one Foreach + one Until paginates all nine collections (M16)
A["Compose_Web_Collection_Plan"] = compose([
    {"key": "lists",              "uri": "_api/web/lists?$expand=RootFolder&$top=5000"},
    {"key": "subWebs",            "uri": "_api/web/webs?$select=Id,Title,Url,ServerRelativeUrl,Description,Created,LastItemModifiedDate,WebTemplate,Configuration,Language&$top=5000"},
    {"key": "siteColumns",        "uri": "_api/web/fields?$top=5000"},
    {"key": "siteContentTypes",   "uri": "_api/web/ContentTypes?$expand=FieldLinks&$top=5000"},
    {"key": "siteUsers",          "uri": "_api/web/siteusers?$top=5000"},
    {"key": "siteGroups",         "uri": "_api/web/sitegroups?$expand=Users&$top=5000"},
    {"key": "roleDefinitions",    "uri": "_api/web/roledefinitions?$top=5000"},
    {"key": "webRoleAssignments", "uri": "_api/web/roleassignments?$expand=Member,RoleDefinitionBindings&$top=5000"},
    {"key": "features",           "uri": "_api/web/Features?$top=5000"},
])

# ---- site-collection level (root only) -------------------------------------
A["GET_Site_Properties"] = sp(ROOT, "_api/site", run_after=after("Compose_Web_Collection_Plan"))
A["Compose_Site_Properties_Safe"] = compose(safe("GET_Site_Properties"),
    after("GET_Site_Properties", states=OK_ANY))
A["GET_Site_Usage"] = sp(ROOT, "_api/site/usage", run_after=after("Compose_Site_Properties_Safe"))
A["Compose_Site_Usage_Safe"] = compose(safe("GET_Site_Usage"), after("GET_Site_Usage", states=OK_ANY))

# ---- breadth-first traversal over every web in the site collection ---------
U = collections.OrderedDict()
U["Set_varCurrentWebUrl"] = setvar("varCurrentWebUrl", "@first(variables('varWebQueue'))")
U["Set_varWebQueue_Dequeue"] = setvar("varWebQueue", "@skip(variables('varWebQueue'), 1)",
                                      after("Set_varCurrentWebUrl"))
U["Set_varWebCollections_Reset"] = setvar("varWebCollections", "@json('{}')",
                                          after("Set_varWebQueue_Dequeue"))

singles = [
    ("GET_Web_Properties",            "_api/web"),
    ("GET_Web_All_Properties",        "_api/web/AllProperties"),
    ("GET_Web_Regional_Settings",     "_api/web/RegionalSettings?$expand=TimeZone"),
    ("GET_Web_Associated_Groups",     "_api/web?$expand=AssociatedOwnerGroup,AssociatedMemberGroup,AssociatedVisitorGroup&$select=Id,Title,AssociatedOwnerGroup/Id,AssociatedOwnerGroup/Title,AssociatedOwnerGroup/LoginName,AssociatedMemberGroup/Id,AssociatedMemberGroup/Title,AssociatedMemberGroup/LoginName,AssociatedVisitorGroup/Id,AssociatedVisitorGroup/Title,AssociatedVisitorGroup/LoginName"),
    ("GET_Web_Navigation",            "_api/web/Navigation?$expand=QuickLaunch,TopNavigationBar"),
    ("GET_Web_Effective_Permissions", "_api/web/EffectiveBasePermissions"),
]
prev = "Set_varWebCollections_Reset"
for name, uri in singles:
    U[name] = sp(CUR, uri, run_after=after(prev))
    U["Compose_%s_Safe" % name.replace("GET_", "")] = compose(safe(name), after(name, states=OK_ANY))
    prev = "Compose_%s_Safe" % name.replace("GET_", "")

# ---- one generic paginated retriever for all nine web collections ----------
P = collections.OrderedDict()
P["Set_varCollectionAccumulator_Reset"] = setvar("varCollectionAccumulator", [])
P["Set_varCollectionNextUri_Seed"] = setvar(
    "varCollectionNextUri", "@items('Apply_to_each_Web_Collection')?['uri']",
    after("Set_varCollectionAccumulator_Reset"))
P["Set_varCollectionPagingDone_Reset"] = setvar("varCollectionPagingDone", False,
    after("Set_varCollectionNextUri_Seed"))

PG = collections.OrderedDict()
PG["GET_Web_Collection_Page"] = sp(CUR, "@variables('varCollectionNextUri')")
PG["Compose_Web_Collection_Page_Items"] = compose(
    "@if(equals(actions('GET_Web_Collection_Page')?['status'], 'Succeeded'), "
    "coalesce(body('GET_Web_Collection_Page')?['value'], createArray(body('GET_Web_Collection_Page'))), createArray())",
    after("GET_Web_Collection_Page", states=OK_ANY))
PG["Set_varCollectionAccumulator_Append"] = setvar(
    "varCollectionAccumulator",
    "@concat(variables('varCollectionAccumulator'), outputs('Compose_Web_Collection_Page_Items'))",
    after("Compose_Web_Collection_Page_Items"))
PG["Compose_Web_Collection_Next_Link"] = compose(
    "@if(equals(actions('GET_Web_Collection_Page')?['status'], 'Succeeded'), "
    "string(coalesce(body('GET_Web_Collection_Page')?['odata.nextLink'], '')), '')",
    after("Set_varCollectionAccumulator_Append"))
PG["Set_varCollectionNextUri_Next"] = setvar(
    "varCollectionNextUri",
    "@if(contains(outputs('Compose_Web_Collection_Next_Link'), '/_api/'), "
    "concat('_api/', last(split(outputs('Compose_Web_Collection_Next_Link'), '/_api/'))), '')",
    after("Compose_Web_Collection_Next_Link"))
PG["Set_varCollectionPagingDone"] = setvar(
    "varCollectionPagingDone", "@empty(variables('varCollectionNextUri'))",
    after("Set_varCollectionNextUri_Next"))

P["Until_Web_Collection_Paged"] = until(
    "@equals(variables('varCollectionPagingDone'), true)", PG,
    after("Set_varCollectionPagingDone_Reset"), count=500, timeout="PT1H")
P["Set_varWebCollections_Store"] = setvar(
    "varWebCollections",
    "@setProperty(variables('varWebCollections'), items('Apply_to_each_Web_Collection')?['key'], variables('varCollectionAccumulator'))",
    after("Until_Web_Collection_Paged"))
P["Append_Web_Collection_Error"] = cond(
    {"not": {"equals": [st("GET_Web_Collection_Page"), "Succeeded"]}},
    {"Append_Error_Web_Collection": appendarr("varSPInventoryErrors", collections.OrderedDict([
        ("runId", "@variables('varRunId')"), ("capturedAtUtc", "@utcNow()"),
        ("severity", "High"), ("stage", "GET_Web_Collection"),
        ("collection", "@items('Apply_to_each_Web_Collection')?['key']"),
        ("siteUrl", CUR), ("endpoint", "@items('Apply_to_each_Web_Collection')?['uri']"),
        ("status", st("GET_Web_Collection_Page")), ("httpStatus", code("GET_Web_Collection_Page")),
        ("message", msg("GET_Web_Collection_Page")),
    ]))},
    run_after=after("Set_varWebCollections_Store"))

U["Apply_to_each_Web_Collection"] = foreach(
    "@outputs('Compose_Web_Collection_Plan')", P, after(prev))

# ---- fan lists out to the global register, annotated with their web --------
U["Select_Web_Lists_Annotated"] = select(
    "@coalesce(variables('varWebCollections')?['lists'], createArray())",
    "@addProperty(addProperty(item(), '__webUrl', variables('varCurrentWebUrl')), "
    "'__webServerRelativeUrl', string(coalesce(outputs('Compose_Web_Properties_Safe')?['ServerRelativeUrl'], '')))",
    after("Apply_to_each_Web_Collection"))
U["Set_varAllListsRaw_Append"] = setvar(
    "varAllListsRaw", "@concat(variables('varAllListsRaw'), body('Select_Web_Lists_Annotated'))",
    after("Select_Web_Lists_Annotated"))

U["Select_Sub_Web_Urls"] = select(
    "@coalesce(variables('varWebCollections')?['subWebs'], createArray())",
    "@string(coalesce(item()?['Url'], ''))", after("Set_varAllListsRaw_Append"))
U["Filter_Sub_Web_Urls"] = query("@body('Select_Sub_Web_Urls')",
    "@and(not(empty(item())), startsWith(toLower(item()), 'https://'))",
    after("Select_Sub_Web_Urls"))
U["Set_varWebQueue_Enqueue"] = setvar(
    "varWebQueue", "@concat(variables('varWebQueue'), body('Filter_Sub_Web_Urls'))",
    after("Filter_Sub_Web_Urls"))

U["Append_Web_Capture_Record"] = appendarr("varWebsCaptured", collections.OrderedDict([
    ("runId", "@variables('varRunId')"),
    ("capturedAtUtc", "@variables('varCapturedAtUtc')"),
    ("webUrl", CUR),
    ("isRootWeb", "@equals(variables('varCurrentWebUrl'), variables('varRootSiteUrl'))"),
    ("web", "@outputs('Compose_Web_Properties_Safe')"),
    ("webAllProperties", "@outputs('Compose_Web_All_Properties_Safe')"),
    ("regionalSettings", "@outputs('Compose_Web_Regional_Settings_Safe')"),
    ("associatedGroups", "@outputs('Compose_Web_Associated_Groups_Safe')"),
    ("navigation", "@outputs('Compose_Web_Navigation_Safe')"),
    ("effectiveBasePermissions", "@outputs('Compose_Web_Effective_Permissions_Safe')"),
    ("siteColumns", "@coalesce(variables('varWebCollections')?['siteColumns'], createArray())"),
    ("siteContentTypes", "@coalesce(variables('varWebCollections')?['siteContentTypes'], createArray())"),
    ("siteUsers", "@coalesce(variables('varWebCollections')?['siteUsers'], createArray())"),
    ("siteGroups", "@coalesce(variables('varWebCollections')?['siteGroups'], createArray())"),
    ("roleDefinitions", "@coalesce(variables('varWebCollections')?['roleDefinitions'], createArray())"),
    ("webRoleAssignments", "@coalesce(variables('varWebCollections')?['webRoleAssignments'], createArray())"),
    ("features", "@coalesce(variables('varWebCollections')?['features'], createArray())"),
    ("subWebUrls", "@body('Filter_Sub_Web_Urls')"),
    ("counts", collections.OrderedDict([
        ("lists", "@length(coalesce(variables('varWebCollections')?['lists'], createArray()))"),
        ("siteColumns", "@length(coalesce(variables('varWebCollections')?['siteColumns'], createArray()))"),
        ("siteContentTypes", "@length(coalesce(variables('varWebCollections')?['siteContentTypes'], createArray()))"),
        ("siteUsers", "@length(coalesce(variables('varWebCollections')?['siteUsers'], createArray()))"),
        ("siteGroups", "@length(coalesce(variables('varWebCollections')?['siteGroups'], createArray()))"),
        ("webRoleAssignments", "@length(coalesce(variables('varWebCollections')?['webRoleAssignments'], createArray()))"),
        ("features", "@length(coalesce(variables('varWebCollections')?['features'], createArray()))"),
        ("subWebs", "@length(body('Filter_Sub_Web_Urls'))"),
    ])),
    ("retrievalStatus", collections.OrderedDict([
        ("web", st("GET_Web_Properties")),
        ("allProperties", st("GET_Web_All_Properties")),
        ("regionalSettings", st("GET_Web_Regional_Settings")),
        ("associatedGroups", st("GET_Web_Associated_Groups")),
        ("navigation", st("GET_Web_Navigation")),
        ("effectiveBasePermissions", st("GET_Web_Effective_Permissions")),
    ])),
]), after("Set_varWebQueue_Enqueue"))

# ---- harvest errors for this web in one pass, not one condition per call ----
U["Compose_Web_Stage_Statuses"] = compose([
    collections.OrderedDict([("runId", "@variables('varRunId')"), ("capturedAtUtc", "@utcNow()"),
        ("severity", "High"), ("stage", s), ("siteUrl", CUR),
        ("status", st(s)), ("httpStatus", code(s)), ("message", msg(s))])
    for s, _ in singles
], after("Append_Web_Capture_Record"))
U["Filter_Web_Stage_Errors"] = query("@outputs('Compose_Web_Stage_Statuses')",
    "@not(equals(item()?['status'], 'Succeeded'))", after("Compose_Web_Stage_Statuses"))
U["Set_varSPInventoryErrors_Web"] = setvar("varSPInventoryErrors",
    "@concat(variables('varSPInventoryErrors'), body('Filter_Web_Stage_Errors'))",
    after("Filter_Web_Stage_Errors"))

U["Set_varWebTraversalDone"] = setvar("varWebTraversalDone",
    "@or(empty(variables('varWebQueue')), greaterOrEquals(length(variables('varWebsCaptured')), variables('varMaxWebs')))",
    after("Set_varSPInventoryErrors_Web"))

A["Until_Web_Traversal"] = until("@equals(variables('varWebTraversalDone'), true)", U,
    after("Compose_Site_Usage_Safe"), count=1000, timeout="PT4H")

# M12 - varInventoryWarnings now carries real signal
A["Condition_Warn_Web_Traversal_Cap"] = cond(
    {"and": [{"not": {"equals": ["@length(variables('varWebQueue'))", 0]}}]},
    {"Append_Warning_Traversal_Cap": appendarr("varInventoryWarnings", collections.OrderedDict([
        ("runId", "@variables('varRunId')"), ("capturedAtUtc", "@utcNow()"),
        ("severity", "Medium"), ("stage", "Until_Web_Traversal"),
        ("message", "@concat('Web traversal stopped at the varMaxWebs cap of ', string(variables('varMaxWebs')), ' webs. ', string(length(variables('varWebQueue'))), ' web(s) were left uncaptured.')"),
        ("uncapturedWebUrls", "@variables('varWebQueue')"),
    ]))},
    run_after=after("Until_Web_Traversal"))

A["Compose_Site_And_Web_Checkpoint"] = compose(collections.OrderedDict([
    ("websCaptured", "@length(variables('varWebsCaptured'))"),
    ("listsDiscovered", "@length(variables('varAllListsRaw'))"),
    ("websLeftUncaptured", "@length(variables('varWebQueue'))"),
    ("errorsLogged", "@length(variables('varSPInventoryErrors'))"),
    ("warningsLogged", "@length(variables('varInventoryWarnings'))"),
]), after("Condition_Warn_Web_Traversal_Cap", states=OK_DONE))

sp_actions = ["GET_Site_Properties", "GET_Site_Usage", "GET_Web_Collection_Page"] + [n for n, _ in singles]
blob = scope_blob("Scope_GET_02_Site_And_Web_Intelligence", A,
                  after("Scope_PREP_01_Run_Context"), sp_actions=sp_actions)

hdr = [
    "# 02 - Scope_GET_02_Site_And_Web_Intelligence",
    "#",
    "# Closes the whole site-level half of H10. Breadth-first traversal over every web in",
    "# the site collection (subsites were previously never visited at all), capturing per web:",
    "#   _api/web, AllProperties, RegionalSettings+TimeZone, associated Owner/Member/Visitor",
    "#   groups, Navigation (QuickLaunch + TopNavigationBar), EffectiveBasePermissions,",
    "#   site columns, site content types (+FieldLinks), site users, site groups (+Users),",
    "#   role definitions, web role assignments, features, subsites and lists.",
    "# Site-collection level adds _api/site and _api/site/usage.",
    "#",
    "# Lists are queried WITHOUT $select and with $expand=RootFolder, so every list property",
    "# arrives - MajorVersionLimit, MajorWithMinorVersionsLimit, DraftVersionVisibility,",
    "# ReadSecurity, WriteSecurity, IrmEnabled/IrmReject/IrmExpire, HasUniqueRoleAssignments,",
    "# TemplateFeatureId, ListItemEntityTypeFullName - with no property-name risk (H10, H6).",
    "#",
    "# Apply_to_each_Web_Collection + Until_Web_Collection_Paged is a single generic",
    "# paginator that follows odata.nextLink for all nine collections (M16). Every HTTP",
    "# action carries an explicit exponential retry policy (H1). Errors are harvested once",
    "# per web from a status array rather than one condition per call, and carry the real",
    "# connector message plus the HTTP status code (M2).",
    "#",
    "# Group membership for H6 is resolved by joining webRoleAssignments[].Member.Id to",
    "# siteGroups[].Id (captured with $expand=Users), avoiding the Member/Users expand that",
    "# fails whenever a role assignment principal is a user rather than a group.",
]
n = write(REPO + "/02_scope_site_and_web_intelligence.json", [blob], hdr)
print("02 written:", n, "bytes")
