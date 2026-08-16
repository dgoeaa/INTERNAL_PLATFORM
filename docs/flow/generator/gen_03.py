import sys, collections
sys.path.insert(0, '.')
from gen_common import *
REPO = "/home/user/INTERNAL_PLATFORM/docs/flow"

def msg(a): return ("@coalesce(body('%s')?['error']?['message'], body('%s')?['message'], string(coalesce(body('%s'), '')), '')" % (a,a,a))
def code(a): return "@coalesce(outputs('%s')?['statusCode'], 0)" % a
def st(a): return "@actions('%s')?['status']" % a

IT = "items('Apply_to_each_List_Or_Library')"
DS = "@%s?['__webUrl']" % IT
LC = "variables('varListCollections')"
def coll(k): return "@coalesce(%s?['%s'], createArray())" % (LC, k)
def rstat(k): return "@string(coalesce(variables('varListRetrievalStatus')?['%s'], 'NotAttempted'))" % k

# one catalog, one classifier - the Scope 02/07 drift is structurally impossible now (H9)
CATALOG = [
    (100,"Custom List","List"),(101,"Document Library","Library"),(102,"Survey","List"),
    (103,"Links List","List"),(104,"Announcements List","List"),(105,"Contacts List","List"),
    (106,"Calendar","List"),(107,"Tasks List","List"),(108,"Discussion Board","List"),
    (109,"Picture Library","Library"),(110,"Data Sources Library","System"),
    (111,"Site Template Gallery","System"),(112,"User Information List","System"),
    (113,"Web Part Gallery","System"),(114,"List Template Gallery","System"),
    (115,"Form Library","Library"),(116,"Master Page Gallery","System"),
    (117,"No-Code Workflow Library","System"),(118,"Workflow Process List","System"),
    (119,"Site Pages Library","Library"),(120,"Custom Grid List","List"),
    (121,"Solution Catalog","System"),(122,"No-Code Public Workflow Library","System"),
    (123,"Theme Catalog","System"),(124,"Design Catalog","System"),
    (125,"Apps for SharePoint Catalog","System"),(130,"Data Connection Library","Library"),
    (140,"Workflow History List","System"),(150,"Project Tasks List","List"),
    (170,"Promoted Links List","List"),(171,"Tasks List","List"),
    (175,"Microfeed List","System"),(200,"Meeting Series List","List"),
    (301,"Blog Posts List","List"),(302,"Blog Comments List","List"),
    (303,"Blog Categories List","List"),(402,"Workflow Tasks List","System"),
    (403,"User Information List","System"),(404,"Workflow Tasks List","System"),
    (600,"External List","List"),(700,"Health Rules List","System"),
    (701,"Health Reports List","System"),(850,"Publishing Pages Library","Library"),
    (851,"Asset Library","Library"),(1100,"Issue Tracking List","List"),
    (10102,"Pages Library","Library"),
]

A = collections.OrderedDict()
A["Compose_Base_Template_Catalog"] = compose(
    [{"template": t, "kind": k, "category": c} for t, k, c in CATALOG])
A["Compose_List_Collection_Plan_Template"] = compose([
    {"key": "fields",               "suffix": "/fields?$top=5000"},
    {"key": "contentTypes",         "suffix": "/ContentTypes?$expand=FieldLinks&$top=5000"},
    {"key": "views",                "suffix": "/Views?$expand=ViewFields&$top=5000"},
    {"key": "workflowAssociations", "suffix": "/WorkflowAssociations?$top=5000"},
    {"key": "rootFolder",           "suffix": "/RootFolder?$expand=StorageMetrics,Properties"},
    {"key": "roleAssignments",      "suffix": "/RoleAssignments?$expand=Member,RoleDefinitionBindings&$top=5000"},
], after("Compose_Base_Template_Catalog"))

# M8 - hidden/system lists stay in the raw inventory but deep capture is switchable
A["Filter_Lists_For_Deep_Capture"] = query("@variables('varAllListsRaw')",
    "@or(equals(variables('varIncludeHiddenLists'), true), not(equals(item()?['Hidden'], true)))",
    after("Compose_List_Collection_Plan_Template"))

L = collections.OrderedDict()
L["Set_varListCollections_Reset"] = setvar("varListCollections", "@json('{}')")
L["Set_varListRetrievalStatus_Reset"] = setvar("varListRetrievalStatus", "@json('{}')",
    after("Set_varListCollections_Reset"))
# H6 - only spend a call on RoleAssignments when the list actually breaks inheritance
L["Filter_List_Collection_Plan"] = query("@outputs('Compose_List_Collection_Plan_Template')",
    "@or(not(equals(item()?['key'], 'roleAssignments')), equals(%s?['HasUniqueRoleAssignments'], true))" % IT,
    after("Set_varListRetrievalStatus_Reset"))
L["Select_List_Collection_Plan"] = select("@body('Filter_List_Collection_Plan')",
    collections.OrderedDict([
        ("key", "@item()?['key']"),
        ("uri", "@concat('_api/web/lists(guid''', %s?['Id'], ''')', item()?['suffix'])" % IT)]),
    after("Filter_List_Collection_Plan"))

PG = collections.OrderedDict()
PG["GET_List_Collection_Page"] = sp(DS, "@variables('varCollectionNextUri')")
PG["Compose_List_Collection_Page_Items"] = compose(
    "@if(equals(actions('GET_List_Collection_Page')?['status'], 'Succeeded'), "
    "coalesce(body('GET_List_Collection_Page')?['value'], createArray(body('GET_List_Collection_Page'))), createArray())",
    after("GET_List_Collection_Page", states=OK_ANY))
PG["Set_varCollectionAccumulator_Append_List"] = setvar("varCollectionAccumulator",
    "@concat(variables('varCollectionAccumulator'), outputs('Compose_List_Collection_Page_Items'))",
    after("Compose_List_Collection_Page_Items"))
PG["Compose_List_Collection_Next_Link"] = compose(
    "@if(equals(actions('GET_List_Collection_Page')?['status'], 'Succeeded'), "
    "string(coalesce(body('GET_List_Collection_Page')?['odata.nextLink'], '')), '')",
    after("Set_varCollectionAccumulator_Append_List"))
PG["Set_varCollectionNextUri_Next_List"] = setvar("varCollectionNextUri",
    "@if(contains(outputs('Compose_List_Collection_Next_Link'), '/_api/'), "
    "concat('_api/', last(split(outputs('Compose_List_Collection_Next_Link'), '/_api/'))), '')",
    after("Compose_List_Collection_Next_Link"))
PG["Set_varCollectionPagingDone_List"] = setvar("varCollectionPagingDone",
    "@empty(variables('varCollectionNextUri'))", after("Set_varCollectionNextUri_Next_List"))

C = collections.OrderedDict()
C["Set_varCollectionAccumulator_Reset_List"] = setvar("varCollectionAccumulator", [])
C["Set_varCollectionNextUri_Seed_List"] = setvar("varCollectionNextUri",
    "@items('Apply_to_each_List_Collection')?['uri']", after("Set_varCollectionAccumulator_Reset_List"))
C["Set_varCollectionPagingDone_Reset_List"] = setvar("varCollectionPagingDone", False,
    after("Set_varCollectionNextUri_Seed_List"))
C["Until_List_Collection_Paged"] = until("@equals(variables('varCollectionPagingDone'), true)", PG,
    after("Set_varCollectionPagingDone_Reset_List"), count=500, timeout="PT1H")
C["Set_varListCollections_Store"] = setvar("varListCollections",
    "@setProperty(variables('varListCollections'), items('Apply_to_each_List_Collection')?['key'], variables('varCollectionAccumulator'))",
    after("Until_List_Collection_Paged"))
C["Set_varListRetrievalStatus_Store"] = setvar("varListRetrievalStatus",
    "@setProperty(variables('varListRetrievalStatus'), items('Apply_to_each_List_Collection')?['key'], string(actions('GET_List_Collection_Page')?['status']))",
    after("Set_varListCollections_Store"))
C["Condition_Log_List_Collection_Error"] = cond(
    {"not": {"equals": [st("GET_List_Collection_Page"), "Succeeded"]}},
    {"Append_Error_List_Collection": appendarr("varSPInventoryErrors", collections.OrderedDict([
        ("runId", "@variables('varRunId')"), ("capturedAtUtc", "@utcNow()"),
        ("severity", "High"), ("stage", "GET_List_Collection"),
        ("collection", "@items('Apply_to_each_List_Collection')?['key']"),
        ("siteUrl", DS), ("listId", "@%s?['Id']" % IT), ("listTitle", "@%s?['Title']" % IT),
        ("endpoint", "@items('Apply_to_each_List_Collection')?['uri']"),
        ("status", st("GET_List_Collection_Page")), ("httpStatus", code("GET_List_Collection_Page")),
        ("message", msg("GET_List_Collection_Page")),
    ]))},
    run_after=after("Set_varListRetrievalStatus_Store"))

L["Apply_to_each_List_Collection"] = foreach("@body('Select_List_Collection_Plan')", C,
                                             after("Select_List_Collection_Plan"))

# ---------------- field normalisation (B1: body() from here on) --------------
L["Select_Normalized_Fields_For_Current_List"] = select(coll("fields"), collections.OrderedDict([
    ("fieldId", "@item()?['Id']"), ("title", "@item()?['Title']"),
    ("internalName", "@item()?['InternalName']"), ("staticName", "@item()?['StaticName']"),
    ("entityPropertyName", "@item()?['EntityPropertyName']"),
    ("typeAsString", "@item()?['TypeAsString']"), ("typeDisplayName", "@item()?['TypeDisplayName']"),
    ("fieldTypeKind", "@item()?['FieldTypeKind']"), ("description", "@item()?['Description']"),
    ("group", "@item()?['Group']"), ("defaultValue", "@item()?['DefaultValue']"),
    ("required", "@equals(item()?['Required'], true)"),
    ("hidden", "@equals(item()?['Hidden'], true)"),
    ("readOnly", "@equals(item()?['ReadOnlyField'], true)"),
    ("sealed", "@equals(item()?['Sealed'], true)"),
    ("canBeDeleted", "@equals(item()?['CanBeDeleted'], true)"),
    ("fromBaseType", "@equals(item()?['FromBaseType'], true)"),
    ("indexed", "@equals(item()?['Indexed'], true)"),
    ("enforceUniqueValues", "@equals(item()?['EnforceUniqueValues'], true)"),
    ("sortable", "@equals(item()?['Sortable'], true)"),
    ("filterable", "@equals(item()?['Filterable'], true)"),
    # H10 - choice / lookup / taxonomy / calculated detail, previously locked inside SchemaXml
    ("choices", "@coalesce(item()?['Choices'], createArray())"),
    ("lookupListId", "@string(coalesce(item()?['LookupList'], ''))"),
    ("lookupField", "@string(coalesce(item()?['LookupField'], ''))"),
    ("lookupWebId", "@string(coalesce(item()?['LookupWebId'], ''))"),
    ("allowMultipleValues", "@equals(item()?['AllowMultipleValues'], true)"),
    ("relationshipDeleteBehavior", "@item()?['RelationshipDeleteBehavior']"),
    ("termSetId", "@string(coalesce(item()?['TermSetId'], ''))"),
    ("termStoreId", "@string(coalesce(item()?['SspId'], ''))"),
    ("anchorId", "@string(coalesce(item()?['AnchorId'], ''))"),
    ("isPathRendered", "@equals(item()?['IsPathRendered'], true)"),
    ("isKeyword", "@equals(item()?['IsKeyword'], true)"),
    ("openTermCreation", "@equals(item()?['Open'], true)"),
    ("formula", "@string(coalesce(item()?['Formula'], ''))"),
    ("outputType", "@item()?['OutputType']"),
    ("maxLength", "@item()?['MaxLength']"), ("numberOfLines", "@item()?['NumberOfLines']"),
    ("richText", "@equals(item()?['RichText'], true)"),
    ("appendOnly", "@equals(item()?['AppendOnly'], true)"),
    ("displayFormat", "@item()?['DisplayFormat']"),
    ("dateTimeCalendarType", "@item()?['DateTimeCalendarType']"),
    ("minimumValue", "@item()?['MinimumValue']"), ("maximumValue", "@item()?['MaximumValue']"),
    ("currencyLocaleId", "@item()?['CurrencyLocaleId']"),
    ("validationFormula", "@string(coalesce(item()?['ValidationFormula'], ''))"),
    ("validationMessage", "@string(coalesce(item()?['ValidationMessage'], ''))"),
    # H2 - the exhaustive XML is retained for the archive but switchable
    ("schemaXml", "@if(equals(variables('varIncludeSchemaXml'), true), string(coalesce(item()?['SchemaXml'], '')), '')"),
    ("isCustomBusinessMetadata", "@and(not(equals(item()?['FromBaseType'], true)), equals(item()?['CanBeDeleted'], true), not(equals(item()?['Hidden'], true)))"),
    ("isSystemField", "@or(equals(item()?['Hidden'], true), equals(item()?['ReadOnlyField'], true), equals(item()?['Sealed'], true), equals(item()?['FromBaseType'], true))"),
    ("isGovernanceRelevant", "@or(equals(item()?['Required'], true), equals(item()?['EnforceUniqueValues'], true), equals(item()?['Indexed'], true), contains(createArray('TaxonomyFieldType','TaxonomyFieldTypeMulti','User','UserMulti','Lookup','LookupMulti','DateTime'), string(item()?['TypeAsString'])))"),
    ("fieldClassification", "@if(equals(item()?['Hidden'], true), 'Hidden Field', if(equals(item()?['Sealed'], true), 'Sealed/System Field', if(equals(item()?['ReadOnlyField'], true), 'Read-only Field', if(contains(createArray('TaxonomyFieldType','TaxonomyFieldTypeMulti'), string(item()?['TypeAsString'])), 'Managed Metadata Field', if(contains(createArray('User','UserMulti'), string(item()?['TypeAsString'])), 'Person/Group Field', if(contains(createArray('Lookup','LookupMulti'), string(item()?['TypeAsString'])), 'Lookup/Relationship Field', if(equals(item()?['TypeAsString'], 'DateTime'), 'Date/Retention Field', if(and(not(equals(item()?['FromBaseType'], true)), equals(item()?['CanBeDeleted'], true)), 'Custom Business Metadata', 'Default SharePoint Field'))))))))"),
]), after("Apply_to_each_List_Collection"))

L["Filter_Custom_Metadata_Fields"] = query("@body('Select_Normalized_Fields_For_Current_List')",
    "@equals(item()?['isCustomBusinessMetadata'], true)", after("Select_Normalized_Fields_For_Current_List"))
L["Filter_Hidden_Fields"] = query("@body('Select_Normalized_Fields_For_Current_List')",
    "@equals(item()?['hidden'], true)", after("Filter_Custom_Metadata_Fields"))
L["Filter_Required_Fields"] = query("@body('Select_Normalized_Fields_For_Current_List')",
    "@equals(item()?['required'], true)", after("Filter_Hidden_Fields"))
L["Filter_Governance_Fields"] = query("@body('Select_Normalized_Fields_For_Current_List')",
    "@equals(item()?['isGovernanceRelevant'], true)", after("Filter_Required_Fields"))

# ---------------- structural classification (H5) -----------------------------
L["Filter_Base_Template_Match"] = query("@outputs('Compose_Base_Template_Catalog')",
    "@equals(item()?['template'], int(coalesce(%s?['BaseTemplate'], 0)))" % IT,
    after("Filter_Governance_Fields"))
L["Compose_Object_Kind"] = compose(
    "@string(coalesce(first(body('Filter_Base_Template_Match'))?['kind'], concat('Other SharePoint Object (template ', string(coalesce(%s?['BaseTemplate'], 0)), ')')))" % IT,
    after("Filter_Base_Template_Match"))
L["Compose_Object_Category"] = compose(
    "@string(coalesce(first(body('Filter_Base_Template_Match'))?['category'], 'Unknown'))",
    after("Compose_Object_Kind"))
L["Compose_Architecture_Classification"] = compose(
    ("@if(or(equals({I}?['IsCatalog'], true), equals({I}?['IsApplicationList'], true)), 'System/Internal Catalog', "
     "if(equals({I}?['IsSystemList'], true), 'System List', "
     "if(equals({I}?['Hidden'], true), 'Hidden/System Object', "
     "if(equals(outputs('Compose_Object_Category'), 'System'), 'System/Internal List', "
     "if(equals(outputs('Compose_Object_Category'), 'Library'), 'Business Document Library', "
     "if(equals(outputs('Compose_Object_Category'), 'List'), 'Business List', "
     "'Unclassified SharePoint Object'))))))").format(I=IT),
    after("Compose_Object_Category"))
L["Compose_Is_Business_Object"] = compose(
    "@and(not(equals(%s?['Hidden'], true)), not(equals(%s?['IsCatalog'], true)), not(equals(%s?['IsApplicationList'], true)), not(equals(%s?['IsSystemList'], true)), contains(createArray('Library','List'), outputs('Compose_Object_Category')))" % (IT, IT, IT, IT),
    after("Compose_Architecture_Classification"))
# H9 - ONE scale. businessRelevance and reviewPriority are the same computed value.
L["Compose_Business_Relevance"] = compose(
    "@if(not(equals(outputs('Compose_Is_Business_Object'), true)), 'System', "
    "if(or(greater(int(coalesce(%s?['ItemCount'], 0)), 100), equals(%s?['HasUniqueRoleAssignments'], true)), 'High', "
    "if(or(greater(length(body('Filter_Custom_Metadata_Fields')), 0), greater(int(coalesce(%s?['ItemCount'], 0)), 0)), 'Medium', 'Low')))" % (IT, IT, IT),
    after("Compose_Is_Business_Object"))

L["Compose_List_Root_Folder"] = compose(
    "@coalesce(first(%s?['rootFolder']), json('{}'))" % LC, after("Compose_Business_Relevance"))
L["Compose_Retention_Label"] = compose(
    "@string(coalesce(outputs('Compose_List_Root_Folder')?['Properties']?['_ip_UnifiedCompliancePolicyProperties'], ''))",
    after("Compose_List_Root_Folder"))
L["Compose_Storage_Metrics"] = compose(collections.OrderedDict([
    ("totalSizeBytes", "@int(coalesce(outputs('Compose_List_Root_Folder')?['StorageMetrics']?['TotalSize'], 0))"),
    ("totalFileCount", "@int(coalesce(outputs('Compose_List_Root_Folder')?['StorageMetrics']?['TotalFileCount'], 0))"),
    ("totalFileStreamSizeBytes", "@int(coalesce(outputs('Compose_List_Root_Folder')?['StorageMetrics']?['TotalFileStreamSize'], 0))"),
    ("lastModified", "@string(coalesce(outputs('Compose_List_Root_Folder')?['StorageMetrics']?['LastModified'], ''))"),
]), after("Compose_Retention_Label"))
L["Compose_Review_Reason"] = compose(
    "@if(not(equals(outputs('Compose_Is_Business_Object'), true)), 'Hidden, catalog or system object. Review only where architecture or security impact is expected.', "
    "if(equals(%s?['HasUniqueRoleAssignments'], true), 'Permission inheritance is broken on this object. Confirm the unique permissions are intentional and correctly scoped.', "
    "if(greater(int(coalesce(%s?['ItemCount'], 0)), 100), 'High item count or operational importance. Prioritise governance review.', "
    "if(equals(outputs('Compose_Object_Category'), 'Library'), 'Visible document library. Review document governance, metadata, versioning, content types, retention and ownership.', "
    "'Visible business list. Review metadata, ownership, data purpose and retention.'))))" % (IT, IT),
    after("Compose_Storage_Metrics"))
L["Compose_Recommended_Action"] = compose(
    "@if(and(equals(outputs('Compose_Is_Business_Object'), true), equals(%s?['EnableVersioning'], false)), 'Enable versioning for this object before it is used for business records.', "
    "if(and(equals(outputs('Compose_Is_Business_Object'), true), greater(length(body('Filter_Custom_Metadata_Fields')), 0), equals(%s?['ContentTypesEnabled'], false)), 'Enable content types so the custom metadata on this object is standardised.', "
    "if(and(equals(outputs('Compose_Is_Business_Object'), true), equals(length(body('Filter_Custom_Metadata_Fields')), 0)), 'Add business metadata, ownership, classification or retention columns, or confirm none are required.', "
    "'Review and confirm classification, ownership, retention and security requirements.')))" % (IT, IT),
    after("Compose_Review_Reason"))

# ---------------- canonical normalised object --------------------------------
L["Append_Normalized_Object"] = appendarr("varNormalizedObjects", collections.OrderedDict([
    ("runId", "@variables('varRunId')"),
    ("capturedAtUtc", "@variables('varCapturedAtUtc')"),
    ("webUrl", DS),
    ("webServerRelativeUrl", "@%s?['__webServerRelativeUrl']" % IT),
    ("objectId", "@%s?['Id']" % IT),
    ("title", "@%s?['Title']" % IT),
    ("description", "@string(coalesce(%s?['Description'], ''))" % IT),
    ("serverRelativeUrl", "@string(coalesce(%s?['RootFolder']?['ServerRelativeUrl'], ''))" % IT),
    ("defaultViewUrl", "@string(coalesce(%s?['DefaultViewUrl'], ''))" % IT),
    ("entityTypeName", "@string(coalesce(%s?['EntityTypeName'], ''))" % IT),
    ("listItemEntityTypeFullName", "@string(coalesce(%s?['ListItemEntityTypeFullName'], ''))" % IT),
    ("baseTemplate", "@int(coalesce(%s?['BaseTemplate'], 0))" % IT),
    ("baseType", "@%s?['BaseType']" % IT),
    ("templateFeatureId", "@string(coalesce(%s?['TemplateFeatureId'], ''))" % IT),
    ("objectKind", "@outputs('Compose_Object_Kind')"),
    ("objectCategory", "@outputs('Compose_Object_Category')"),
    ("architectureClassification", "@outputs('Compose_Architecture_Classification')"),
    ("isBusinessObject", "@outputs('Compose_Is_Business_Object')"),
    ("businessRelevance", "@outputs('Compose_Business_Relevance')"),
    ("reviewPriority", "@outputs('Compose_Business_Relevance')"),
    ("reviewReason", "@outputs('Compose_Review_Reason')"),
    ("recommendedAction", "@outputs('Compose_Recommended_Action')"),
    ("itemCount", "@int(coalesce(%s?['ItemCount'], 0))" % IT),
    ("created", "@string(coalesce(%s?['Created'], ''))" % IT),
    ("lastModified", "@string(coalesce(%s?['LastItemModifiedDate'], ''))" % IT),
    ("lastItemUserModifiedDate", "@string(coalesce(%s?['LastItemUserModifiedDate'], ''))" % IT),
    ("settings", collections.OrderedDict([
        ("hidden", "@equals(%s?['Hidden'], true)" % IT),
        ("isSystemList", "@equals(%s?['IsSystemList'], true)" % IT),
        ("isCatalog", "@equals(%s?['IsCatalog'], true)" % IT),
        ("isApplicationList", "@equals(%s?['IsApplicationList'], true)" % IT),
        ("isPrivate", "@equals(%s?['IsPrivate'], true)" % IT),
        ("onQuickLaunch", "@equals(%s?['OnQuickLaunch'], true)" % IT),
        ("enableVersioning", "@equals(%s?['EnableVersioning'], true)" % IT),
        ("enableMinorVersions", "@equals(%s?['EnableMinorVersions'], true)" % IT),
        ("majorVersionLimit", "@int(coalesce(%s?['MajorVersionLimit'], 0))" % IT),
        ("majorWithMinorVersionsLimit", "@int(coalesce(%s?['MajorWithMinorVersionsLimit'], 0))" % IT),
        ("draftVersionVisibility", "@%s?['DraftVersionVisibility']" % IT),
        ("enableModeration", "@equals(%s?['EnableModeration'], true)" % IT),
        ("forceCheckout", "@equals(%s?['ForceCheckout'], true)" % IT),
        ("enableAttachments", "@equals(%s?['EnableAttachments'], true)" % IT),
        ("enableFolderCreation", "@equals(%s?['EnableFolderCreation'], true)" % IT),
        ("contentTypesEnabled", "@equals(%s?['ContentTypesEnabled'], true)" % IT),
        ("allowContentTypes", "@equals(%s?['AllowContentTypes'], true)" % IT),
        ("allowDeletion", "@equals(%s?['AllowDeletion'], true)" % IT),
        ("noCrawl", "@equals(%s?['NoCrawl'], true)" % IT),
        ("crawlNonDefaultViews", "@equals(%s?['CrawlNonDefaultViews'], true)" % IT),
        ("hasExternalDataSource", "@equals(%s?['HasExternalDataSource'], true)" % IT),
        ("readSecurity", "@int(coalesce(%s?['ReadSecurity'], 0))" % IT),
        ("writeSecurity", "@int(coalesce(%s?['WriteSecurity'], 0))" % IT),
        ("irmEnabled", "@equals(%s?['IrmEnabled'], true)" % IT),
        ("irmExpire", "@equals(%s?['IrmExpire'], true)" % IT),
        ("irmReject", "@equals(%s?['IrmReject'], true)" % IT),
        ("exemptFromBlockDownloadOfNonViewableFiles", "@equals(%s?['ExemptFromBlockDownloadOfNonViewableFiles'], true)" % IT),
        ("validationFormula", "@string(coalesce(%s?['ValidationFormula'], ''))" % IT),
        ("validationMessage", "@string(coalesce(%s?['ValidationMessage'], ''))" % IT),
        ("documentTemplateUrl", "@string(coalesce(%s?['DocumentTemplateUrl'], ''))" % IT),
        ("hasUniqueRoleAssignments", "@equals(%s?['HasUniqueRoleAssignments'], true)" % IT),
        ("permissionInheritance", "@if(equals(%s?['HasUniqueRoleAssignments'], true), 'Broken - unique permissions on this object', 'Inherited from parent web')" % IT),
    ])),
    ("retentionLabelRaw", "@outputs('Compose_Retention_Label')"),
    ("hasRetentionLabel", "@not(empty(outputs('Compose_Retention_Label')))"),
    ("storage", "@outputs('Compose_Storage_Metrics')"),
    ("metrics", collections.OrderedDict([
        ("totalFields", "@length(body('Select_Normalized_Fields_For_Current_List'))"),
        ("customFields", "@length(body('Filter_Custom_Metadata_Fields'))"),
        ("hiddenFields", "@length(body('Filter_Hidden_Fields'))"),
        ("requiredFields", "@length(body('Filter_Required_Fields'))"),
        ("governanceRelevantFields", "@length(body('Filter_Governance_Fields'))"),
        ("contentTypes", "@length(%s)" % coll("contentTypes")[1:]),
        ("views", "@length(%s)" % coll("views")[1:]),
        ("workflowAssociations", "@length(%s)" % coll("workflowAssociations")[1:]),
        ("permissionAssignments", "@length(%s)" % coll("roleAssignments")[1:]),
    ])),
    ("retrievalStatus", collections.OrderedDict([
        ("fields", rstat("fields")), ("contentTypes", rstat("contentTypes")),
        ("views", rstat("views")), ("workflowAssociations", rstat("workflowAssociations")),
        ("rootFolder", rstat("rootFolder")), ("roleAssignments", rstat("roleAssignments")),
    ])),
    ("fields", "@body('Select_Normalized_Fields_For_Current_List')"),
    ("contentTypes", coll("contentTypes")),
    ("views", coll("views")),
    ("workflowAssociations", coll("workflowAssociations")),
    ("permissions", coll("roleAssignments")),
    ("rootFolder", "@outputs('Compose_List_Root_Folder')"),
    ("rawList", "@%s" % IT),
]), after("Compose_Recommended_Action"))

L["Append_Inventory_Row"] = appendarr("varSPInventoryRows", collections.OrderedDict([
    ("runId", "@variables('varRunId')"), ("capturedAtUtc", "@variables('varCapturedAtUtc')"),
    ("webUrl", DS), ("listId", "@%s?['Id']" % IT), ("title", "@%s?['Title']" % IT),
    ("objectKind", "@outputs('Compose_Object_Kind')"),
    ("architectureClassification", "@outputs('Compose_Architecture_Classification')"),
    ("businessRelevance", "@outputs('Compose_Business_Relevance')"),
    ("baseTemplate", "@int(coalesce(%s?['BaseTemplate'], 0))" % IT),
    ("hidden", "@equals(%s?['Hidden'], true)" % IT),
    ("itemCount", "@int(coalesce(%s?['ItemCount'], 0))" % IT),
    ("totalSizeBytes", "@outputs('Compose_Storage_Metrics')?['totalSizeBytes']"),
    ("fieldCount", "@length(body('Select_Normalized_Fields_For_Current_List'))"),
    ("customFieldCount", "@length(body('Filter_Custom_Metadata_Fields'))"),
    ("contentTypeCount", "@length(%s)" % coll("contentTypes")[1:]),
    ("viewCount", "@length(%s)" % coll("views")[1:]),
    ("hasUniqueRoleAssignments", "@equals(%s?['HasUniqueRoleAssignments'], true)" % IT),
    ("hasRetentionLabel", "@not(empty(outputs('Compose_Retention_Label')))"),
    ("serverRelativeUrl", "@string(coalesce(%s?['RootFolder']?['ServerRelativeUrl'], ''))" % IT),
]), after("Append_Normalized_Object"))

# ---------------- quality findings, evaluated in one pass ---------------------
def finding(sev, cat, codeid, applies, message, rec):
    return collections.OrderedDict([
        ("runId", "@variables('varRunId')"), ("capturedAtUtc", "@utcNow()"),
        ("severity", sev), ("category", cat), ("findingCode", codeid),
        ("webUrl", DS), ("objectId", "@%s?['Id']" % IT), ("objectTitle", "@%s?['Title']" % IT),
        ("objectKind", "@outputs('Compose_Object_Kind')"),
        ("message", message), ("recommendation", rec), ("applies", applies)])

BIZ = "equals(outputs('Compose_Is_Business_Object'), true)"
L["Compose_Quality_Candidates"] = compose([
 finding("High","Metadata Governance","NO_CUSTOM_METADATA",
   "@and(%s, equals(length(body('Filter_Custom_Metadata_Fields')), 0))" % BIZ,
   "Visible business object has no custom business metadata fields.",
   "Review whether this object requires business metadata, ownership, classification, retention or process tracking columns."),
 finding("Medium","Information Management","VERSIONING_DISABLED",
   "@and(%s, equals(%s?['EnableVersioning'], false))" % (BIZ, IT),
   "Visible business object has versioning disabled.",
   "Enable versioning for auditability, document history and recovery."),
 finding("Medium","Information Management","NO_VERSION_LIMIT",
   "@and(equals(%s?['EnableVersioning'], true), equals(int(coalesce(%s?['MajorVersionLimit'], 0)), 0))" % (IT, IT),
   "Versioning is enabled but no major version limit is set, so versions accumulate without bound.",
   "Set MajorVersionLimit to a retention-appropriate number of versions."),
 finding("Medium","Metadata Architecture","CONTENT_TYPES_DISABLED",
   "@and(greater(length(body('Filter_Custom_Metadata_Fields')), 0), equals(%s?['ContentTypesEnabled'], false))" % IT,
   "Custom metadata exists but content types are not enabled.",
   "Enable content types to standardise metadata and document classification."),
 finding("High","Security","BROKEN_PERMISSION_INHERITANCE",
   "@equals(%s?['HasUniqueRoleAssignments'], true)" % IT,
   "Permission inheritance is broken on this object; it carries its own access control list.",
   "Confirm the unique permissions are intentional, documented and correctly scoped, and record the owner."),
 finding("Medium","Security","ITEM_LEVEL_SECURITY_NON_DEFAULT",
   "@or(greater(int(coalesce(%s?['ReadSecurity'], 1)), 1), greater(int(coalesce(%s?['WriteSecurity'], 1)), 1))" % (IT, IT),
   "Item-level read or write security is set to a non-default restriction.",
   "Confirm the item-level restriction is intentional and documented."),
 finding("Medium","Discoverability","EXCLUDED_FROM_SEARCH",
   "@and(%s, equals(%s?['NoCrawl'], true))" % (BIZ, IT),
   "Visible business object is excluded from search indexing.",
   "Confirm the search exclusion is intentional; otherwise re-enable crawling so content is discoverable."),
 finding("Medium","Integration","EXTERNAL_DATA_SOURCE",
   "@equals(%s?['HasExternalDataSource'], true)" % IT,
   "Object is backed by an external data source.",
   "Record the upstream system, its owner and the refresh/authentication model."),
 finding("Medium","Scalability","ABOVE_LIST_VIEW_THRESHOLD",
   "@greater(int(coalesce(%s?['ItemCount'], 0)), 5000)" % IT,
   "Object holds more than 5000 items and is above the SharePoint list view threshold.",
   "Add indexed columns, filtered views or a folder/archive strategy to keep views performant."),
 finding("Medium","Retention","NO_RETENTION_LABEL",
   "@and(%s, empty(outputs('Compose_Retention_Label')))" % BIZ,
   "Visible business object has no default retention or compliance label applied.",
   "Apply a retention label appropriate to the records held, or record why none is required."),
 finding("Medium","Information Management","MODERATION_WITHOUT_VERSIONING",
   "@and(equals(%s?['EnableModeration'], true), equals(%s?['EnableVersioning'], false))" % (IT, IT),
   "Content approval is enabled but versioning is disabled, so approved and draft states cannot be reconstructed.",
   "Enable versioning wherever content approval is in use."),
 finding("Low","Documentation","NO_DESCRIPTION",
   "@and(%s, empty(trim(string(coalesce(%s?['Description'], '')))))" % (BIZ, IT),
   "Visible business object has no description.",
   "Add a short description stating the object's business purpose and owner."),
 finding("High","Capture Integrity","DETAIL_RETRIEVAL_INCOMPLETE",
   "@not(and(equals(%s, 'Succeeded'), equals(%s, 'Succeeded'), equals(%s, 'Succeeded')))" % (
       rstat("fields")[1:], rstat("contentTypes")[1:], rstat("views")[1:]),
   "One or more detail calls for this object did not succeed, so its captured detail is incomplete.",
   "Re-run the capture for this object. Do not treat its field, content type or view counts as authoritative."),
 finding("Medium","Capture Integrity","STORAGE_AND_RETENTION_UNAVAILABLE",
   "@not(equals(%s, 'Succeeded'))" % rstat("rootFolder")[1:],
   "Root folder detail could not be retrieved, so storage metrics and retention label are unknown for this object.",
   "Re-run the capture, or confirm the connection identity can read the object's root folder."),
], after("Append_Inventory_Row"))
L["Filter_Quality_Findings_Applicable"] = query("@outputs('Compose_Quality_Candidates')",
    "@equals(item()?['applies'], true)", after("Compose_Quality_Candidates"))
L["Select_Quality_Findings_Clean"] = select("@body('Filter_Quality_Findings_Applicable')",
    collections.OrderedDict([(k, "@item()?['%s']" % k) for k in
        ["runId","capturedAtUtc","severity","category","findingCode","webUrl",
         "objectId","objectTitle","objectKind","message","recommendation"]]),
    after("Filter_Quality_Findings_Applicable"))
L["Set_varQualityFindings_Append"] = setvar("varQualityFindings",
    "@concat(variables('varQualityFindings'), body('Select_Quality_Findings_Clean'))",
    after("Select_Quality_Findings_Clean"))

# ---------------- warnings (M12 - the register is no longer dead) -------------
def warn(sev, codeid, applies, message):
    return collections.OrderedDict([
        ("runId", "@variables('varRunId')"), ("capturedAtUtc", "@utcNow()"),
        ("severity", sev), ("warningCode", codeid), ("webUrl", DS),
        ("objectId", "@%s?['Id']" % IT), ("objectTitle", "@%s?['Title']" % IT),
        ("message", message), ("applies", applies)])

L["Compose_List_Warning_Candidates"] = compose([
 warn("Low","PERMISSIONS_INHERITED", "@not(equals(%s?['HasUniqueRoleAssignments'], true))" % IT,
   "Object inherits permissions from its parent web, so no object-level role assignments were requested. Web-level assignments in the web capture record are authoritative for this object."),
 warn("Medium","PERMISSIONS_RETRIEVAL_FAILED",
   "@and(equals(%s?['HasUniqueRoleAssignments'], true), not(equals(%s, 'Succeeded')))" % (IT, rstat("roleAssignments")[1:]),
   "Object has unique permissions but the role assignment call did not succeed, so its access control list is unknown."),
 warn("Low","WORKFLOW_RETRIEVAL_FAILED", "@not(equals(%s, 'Succeeded'))" % rstat("workflowAssociations")[1:],
   "Workflow associations could not be retrieved for this object."),
 warn("Low","SCHEMA_XML_CAPTURE_DISABLED", "@equals(variables('varIncludeSchemaXml'), false)",
   "Field SchemaXml capture is switched off for this run, so archived field definitions carry the parsed properties only."),
], after("Set_varQualityFindings_Append"))
L["Filter_List_Warnings_Applicable"] = query("@outputs('Compose_List_Warning_Candidates')",
    "@equals(item()?['applies'], true)", after("Compose_List_Warning_Candidates"))
L["Select_List_Warnings_Clean"] = select("@body('Filter_List_Warnings_Applicable')",
    collections.OrderedDict([(k, "@item()?['%s']" % k) for k in
        ["runId","capturedAtUtc","severity","warningCode","webUrl","objectId","objectTitle","message"]]),
    after("Filter_List_Warnings_Applicable"))
L["Set_varInventoryWarnings_Append"] = setvar("varInventoryWarnings",
    "@concat(variables('varInventoryWarnings'), body('Select_List_Warnings_Clean'))",
    after("Select_List_Warnings_Clean"))

A["Apply_to_each_List_Or_Library"] = foreach("@body('Filter_Lists_For_Deep_Capture')", L,
                                             after("Filter_Lists_For_Deep_Capture"))
A["Compose_Deep_Capture_Checkpoint"] = compose(collections.OrderedDict([
    ("listsDiscovered", "@length(variables('varAllListsRaw'))"),
    ("listsDeepCaptured", "@length(variables('varNormalizedObjects'))"),
    ("inventoryRows", "@length(variables('varSPInventoryRows'))"),
    ("qualityFindings", "@length(variables('varQualityFindings'))"),
    ("warnings", "@length(variables('varInventoryWarnings'))"),
    ("errors", "@length(variables('varSPInventoryErrors'))"),
]), after("Apply_to_each_List_Or_Library", states=OK_ANY))

blob = scope_blob("Scope_GET_03_List_And_Library_Deep_Capture", A,
                  after("Scope_GET_02_Site_And_Web_Intelligence"),
                  sp_actions=["GET_List_Collection_Page"])
hdr = [
    "# 03 - Scope_GET_03_List_And_Library_Deep_Capture",
    "#",
    "# B1  Every Select/Query/Table output is read with body(). outputs() is never used on a",
    "#     Select again, so Filter_Custom_Metadata_Fields receives a real array.",
    "# B2  Apply_to_each_List_Or_Library and Apply_to_each_List_Collection both run at",
    "#     concurrency 1, so no array variable is ever mutated by parallel iterations.",
    "# H1  One HTTP action, sequential, with an explicit exponential retry policy - the four",
    "#     simultaneous unretried calls per iteration are gone.",
    "# H5  Classification is structural: a 47-entry BaseTemplate catalog plus IsCatalog,",
    "#     IsApplicationList, IsSystemList and Hidden. The contains(title,'app') substring",
    "#     test is deleted, so Approvals-style libraries are no longer filed as system lists.",
    "# H6  RoleAssignments is requested only when HasUniqueRoleAssignments is true, and the",
    "#     inheritance state is recorded explicitly on every object.",
    "# H9  One catalog, one classifier, one relevance scale. businessRelevance and",
    "#     reviewPriority are the same computed value, so they cannot drift.",
    "# H10 Fields, views and content types are fetched without $select, so choices, lookup",
    "#     targets, taxonomy term set ids, calculated formulas, view CAML, view fields and",
    "#     content type field links all arrive. Root folder adds StorageMetrics and the",
    "#     retention label. WorkflowAssociations are captured.",
    "# M16 Until_List_Collection_Paged follows odata.nextLink to exhaustion.",
    "# M12 varInventoryWarnings carries real per-object signal.",
    "#",
    "# 14 quality rules and 4 warning rules are evaluated in a single pass per object",
    "# instead of one condition per rule.",
]
n = write(REPO + "/03_scope_list_deep_capture.json", [blob], hdr)
print("03 written:", n, "bytes")
