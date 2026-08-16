# Revised SharePoint Metadata Inventory Flow — paste guide

Complete rebuild of the Power Automate flow reviewed in
`docs/POWER-AUTOMATE-SHAREPOINT-METADATA-FLOW-REVIEW.md`. All 40 findings are applied.
**205 actions, 37 variables, 9 paste files.** Every file is in the same designer clipboard
format as the original (`nodeId` / `serializedValue` / `allConnectionData` / `staticResults` /
`isScopeNode` / `mslaNode`) and pastes directly into the Power Automate designer.

Both existing connections are reused unchanged:
`3f1943c5955a4cb8b301e8f22f2b590d` (SharePoint) and `c0b9e7a5b0854c39a435fd8ce92f48ad` (Office 365).
The stray second SharePoint connection is gone (L1).

---

## Paste order

| # | File | What to paste | Where |
|---|------|---------------|-------|
| 0 | `00_initialize_variables.json` | 37 individual `Initialize variable` actions | **Root level**, in file order, immediately after your existing `Sharepoint_Site_url` initialiser |
| 1 | `01_scope_prep_run_context.json` | `Scope_PREP_01_Run_Context` | after the initialisers |
| 2 | `02_scope_site_and_web_intelligence.json` | `Scope_GET_02_Site_And_Web_Intelligence` | after scope 01 |
| 3 | `03_scope_list_deep_capture.json` | `Scope_GET_03_List_And_Library_Deep_Capture` | after scope 02 |
| 4 | `04_scope_registers_reports_csv.json` | `Scope_BUILD_04_Registers_Reports_And_Csv` | after scope 03 |
| 5 | `05_scope_archive_package.json` | `Scope_SAVE_05_Archive_Package` | after scope 04 |
| 6 | `06_scope_review_register_upsert.json` | `Scope_SAVE_06_Review_Register_Upsert` | after scope 05 |
| 7 | `07_scope_delivery.json` | `Scope_DELIVER_07_Notification` | after scope 06 |
| 8 | `08_scope_run_outcome.json` | `Scope_FINALIZE_08_Run_Outcome` | last |

**Why the initialisers paste separately:** Power Automate only permits `Initialize variable`
at the root of a flow, never inside a Scope. They are 37 root-level siblings, not a scope.

**The one thing to delete from the old flow:** the variable `var_SharePoint_Metadata_Report`
and its initialiser. Nothing reads it, and `Set_varHumanReviewHtmlRows_Empty` (which wrote
`"Xxd"` into it) no longer exists.

`varRootSiteUrl` seeds itself from your existing `Sharepoint_Site_url`, so the trigger wiring
is untouched. Everything downstream uses `varRootSiteUrl`.

---

## Findings traceability

Every finding from the review, and exactly where it is resolved.

### Blockers

| ID | Fix | Location |
|----|-----|----------|
| B1 | All three `outputs('Select_Normalized_Fields_For_Current_List')` are now `body(...)`. A static check across all 205 actions confirms `outputs()` never targets a Select, Query or Table, and `body()` never targets a Compose. | Scope 03 |
| B2 | `Apply_to_each_List_Or_Library`, `Apply_to_each_List_Collection`, `Apply_to_each_Web_Collection`, `Apply_to_each_Review_Register_Field`, `Apply_to_each_Object_For_Review_Register` all carry `concurrency.repetitions = 1`. No `Foreach` in the flow lacks it. | Scopes 02, 03, 06 |
| B3 | Action deleted. HTML rows are built by `Select` + `join`, so there is no string accumulator to reset and no `var_SharePoint_Metadata_Report`. | Scope 04 |

### High

| ID | Fix | Location |
|----|-----|----------|
| H1 | Every one of the HTTP actions carries an explicit `exponential / count 4 / PT10S → PT1H` retry policy, and calls run sequentially instead of four-at-once × 20 iterations. | all scopes |
| H2 | `SchemaXml` is switchable via `varIncludeSchemaXml`; the human review register links to the archived raw file instead of re-embedding `rawLists`, `rawFieldRecords`, `rawContentTypeRecords`, `rawViewRecords` and `rawPermissionRecords` a second time; email attaches only the CSV, the HTML report and the findings JSON. | Scopes 03, 05, 07 |
| H3 | `ContentBytes` is `base64(...)` on every attachment, each declares a `ContentType`, and no object is ever passed to a byte parameter. | Scope 07 |
| H4 | Scope order is capture → build → archive → register → deliver → finalise. Delivery is last and its `runAfter` tolerates upstream failure, so it can never gate artefact production. | scope ordering |
| H5 | `contains(title,'app')` is deleted. Classification uses a 47-entry `BaseTemplate` catalog plus `IsCatalog`, `IsApplicationList`, `IsSystemList` and `Hidden`. A regression check asserts the substring test is absent. | Scope 03 |
| H6 | `HasUniqueRoleAssignments` arrives with the full list payload and is recorded on every object as `settings.permissionInheritance`. `RoleAssignments` is requested **only** when inheritance is broken. Group membership is resolvable by joining `Member.Id` to the `siteGroups` capture (`$expand=Users`). A `BROKEN_PERMISSION_INHERITANCE` finding is raised. | Scopes 02, 03 |
| H7 | The archive moves out of `Shared Documents` into a dedicated library. On first provision the flow breaks role inheritance (`copyRoleAssignments=true`, so the running identity cannot lock itself out), removes the site's default Members and Visitors groups, and grants Full Control to the site Owners group and the run identity. Group ids come from the Scope 02 associated-groups capture. | Scope 05 |
| H8 | CSV cells are quoted, embedded quotes doubled, CR/LF stripped, and values starting `=` `+` `-` `@` prefixed with an apostrophe. The file opens with a UTF-8 BOM. Built with `join()`, not the `Table` action. | Scope 04 |
| H9 | One catalog, one classifier, one relevance scale. `businessRelevance` and `reviewPriority` are the same computed value. Scope 06 and the reports read `varNormalizedObjects`; nothing re-derives from raw. Templates 107 and 119 are both covered, along with 45 others. | Scopes 03, 04, 06 |
| H10 | See the coverage table below. | Scopes 02, 03 |

### Medium

| ID | Fix |
|----|-----|
| M1 | One delivery action, its status captured once into `varDeliveryStatus` and read from there. No cross-referenced wrong action. |
| M2 | Errors coalesce `error.message` → `message` → `string(body)`, and record `outputs(...).statusCode`, so 403 / 429 / 404 are distinguishable. |
| M3 | One HTML report, carrying run KPIs, a web inventory table, a severity-ordered findings table, the full list/library table, and warning and error tables. The counts-only report is gone. |
| M4 | All `runAfter` statuses use canonical casing (`Succeeded`, `Failed`, `Skipped`, `TimedOut`). |
| M5 | Every file body is wrapped in `string()`. |
| M6 | `AppendToStringVariable` loop deleted; HTML rows come from scalar `Select` + `join`. |
| M7 | One email. Recipient from `varNotificationRecipients`. Subject carries object, finding and error counts; importance escalates to High when anything failed. |
| M8 | `Filter_Lists_For_Deep_Capture` honours `varIncludeHiddenLists` before the per-list loop. |
| M9 | `AddUsingPath` / `GetFolderByServerRelativePath` throughout. No `replace(' ','%20')`. No JSON built by string interpolation — bodies are objects. Apostrophes doubled for OData string literals. |
| M10 | The nine file writes chain on `Succeeded, Failed, Skipped, TimedOut`; the manifest records per-file status, URL and error message. |
| M11 | `Scope_FINALIZE_08_Run_Outcome` terminates the run as Failed on fatal capture, zero objects captured, or errors above `varMaxErrorsBeforeFail`. Scope 01 terminates on an unusable site URL. |
| M12 | `varInventoryWarnings` carries real signal: inherited permissions, permission retrieval failure, workflow retrieval failure, SchemaXml disabled, traversal cap reached. It is archived as file 05 and shown in the report. |
| M13 | One identifier. `varRunId = workflow().run.name`, used by every artefact and the run folder name. |
| M14 | Email body is an inline-styled fragment; the standalone document stays a file. |
| M15 | `Scope_SAVE_06` provisions a SharePoint list keyed on an indexed `ObjectId` and upserts each object. The six reviewer-owned columns are created once and never written by the flow, so decisions survive every subsequent run. |
| M16 | `Until_Web_Collection_Paged` and `Until_List_Collection_Paged` follow `odata.nextLink` to exhaustion. |

### Low

| ID | Fix |
|----|-----|
| L1 | One SharePoint connection reference; `shared_sharepointonline-2` removed. |
| L2 | Every action has a unique name; no duplicated `operationMetadataId` values are emitted. |
| L3 | `Compose_Tenant_Root_Url` now computes the tenant root from the site URL instead of echoing a variable; `htmlBusinessVisibility` is gone. |
| L4 | All variables use the `var*` convention. `Sharepoint_Site_url` is read once to seed `varRootSiteUrl` and never referenced again. |
| L5 | `entityTypeName` and `listItemEntityTypeFullName` are surfaced on every normalized object. |
| L6 | Trailing slash normalised in Scope 01, so composed web URLs never double up. |
| L7 | Run folder is `<timestamp>_<runId>` under a short library root, shortening the archive path. |
| L8 | Library name comes from `varArchiveLibraryTitle`, and the real `RootFolder/ServerRelativeUrl` is read back rather than assumed. |
| L9 | Content types are requested without `$select`, so `StringId` arrives without the redundant complex `Id`. |
| L10 | Numeric coercion is consistently `string(...)` inside `concat`. |
| L11 | `ItemCount` is documented as including folders, in the report legend and this guide. |

---

## H10 coverage — what is captured now

**Site collection:** `_api/site`, `_api/site/usage`.

**Every web** (breadth-first over `_api/web/webs`, previously never traversed at all):
`_api/web` full payload, `AllProperties`, `RegionalSettings` + `TimeZone`, associated
Owner/Member/Visitor groups, `Navigation` (QuickLaunch + TopNavigationBar),
`EffectiveBasePermissions`, **site columns** (`_api/web/fields`), **site content types**
(+`FieldLinks`), site users, site groups (+`Users`), role definitions, web role assignments,
features, subsites, lists.

**Every list and library** — queried without `$select` so nothing is missed:
`MajorVersionLimit`, `MajorWithMinorVersionsLimit`, `DraftVersionVisibility`, `ReadSecurity`,
`WriteSecurity`, `IrmEnabled`/`IrmReject`/`IrmExpire`, `HasUniqueRoleAssignments`,
`TemplateFeatureId`, `ListItemEntityTypeFullName`, `ValidationFormula`, `NoCrawl`,
`ExemptFromBlockDownloadOfNonViewableFiles`, plus `RootFolder` with **StorageMetrics**
(total size, file count, stream size) and **retention label**
(`Properties._ip_UnifiedCompliancePolicyProperties`), and **WorkflowAssociations**.

**Fields** — full payload, so `Choices`, `LookupList`, `LookupField`, `LookupWebId`,
`AllowMultipleValues`, `RelationshipDeleteBehavior`, `TermSetId`, `SspId`, `AnchorId`,
`Formula`, `OutputType`, `MaxLength`, `RichText`, `AppendOnly`, `ValidationFormula` and the
rest are captured as parsed properties rather than locked inside opaque `SchemaXml`.

**Views** — `$expand=ViewFields`, no `$select`: `ViewQuery` (the CAML), `ViewFields`,
`Aggregations`, `Scope`, `Paged`, `RowLimit`.

**Content types** — `$expand=FieldLinks`, no `$select`: field links, document template,
`StringId` hierarchy.

**Pagination** — `odata.nextLink` followed to exhaustion on every collection.

---

## Output — 9 files per run

Written to `<Architecture Source of Truth>/<yyyyMMdd_HHmmss>_<runId>/`:

| File | Contents |
|------|----------|
| `01_FULL_RAW_METADATA_*.json` | Everything: webs, objects, inventory rows, findings, warnings, errors |
| `02_NORMALIZED_METADATA_REGISTER_*.json` | Canonical normalized objects |
| `03_METADATA_QUALITY_FINDINGS_*.json` | Findings ordered High → Medium → Low, with warnings and errors |
| `04_CAPTURE_ERROR_LOG_*.json` | Errors with stage, HTTP status and real message |
| `05_CAPTURE_WARNING_LOG_*.json` | Warnings |
| `06_HUMAN_REVIEW_REGISTER_*.csv` | 44-column reviewer worksheet, BOM + fully escaped |
| `07_ARCHITECTURE_REVIEW_REPORT_*.html` | The single report |
| `08_HUMAN_REVIEW_REGISTER_*.json` | Reviewer register, linking to file 01 rather than embedding it |
| `09_RUN_MANIFEST_*.json` | Per-file save status, URLs, counts |

Plus the persistent **SharePoint Metadata Review Register** list, upserted per object.

## Quality rules evaluated per object

14 rules in a single pass: `NO_CUSTOM_METADATA`, `VERSIONING_DISABLED`, `NO_VERSION_LIMIT`,
`CONTENT_TYPES_DISABLED`, `BROKEN_PERMISSION_INHERITANCE`, `ITEM_LEVEL_SECURITY_NON_DEFAULT`,
`EXCLUDED_FROM_SEARCH`, `EXTERNAL_DATA_SOURCE`, `ABOVE_LIST_VIEW_THRESHOLD`,
`NO_RETENTION_LABEL`, `MODERATION_WITHOUT_VERSIONING`, `NO_DESCRIPTION`,
`DETAIL_RETRIEVAL_INCOMPLETE`, `STORAGE_AND_RETENTION_UNAVAILABLE`.

## Operational switches

| Variable | Default | Effect |
|----------|---------|--------|
| `varIncludeHiddenLists` | `true` | Deep-capture hidden/system lists as well as visible ones |
| `varIncludeSchemaXml` | `true` | Retain per-field `SchemaXml` in the archive |
| `varMaxWebs` | `200` | Traversal cap; hitting it raises a warning naming the uncaptured webs |
| `varMaxErrorsBeforeFail` | `25` | Above this the run terminates as Failed |
| `varArchiveLibraryTitle` | `Architecture Source of Truth` | Restricted archive library |
| `varReviewRegisterListTitle` | `SharePoint Metadata Review Register` | Persistent decision register |
| `varNotificationRecipients` | `dgsRegistry@nitda.gov.ng` | Notification recipient |

## First-run notes

- The run identity needs permission to create a list and manage permissions on the root web,
  for the archive library and review register provisioning. Both are one-time; later runs skip
  provisioning entirely.
- Subsite traversal uses the same connection for every web. Webs the connection cannot read are
  recorded as errors rather than failing the run.
- `ItemCount` includes folders.
- Sequential capture trades wall-clock time for correctness. Expect roughly
  *(webs × 15 calls) + (lists × 5–6 calls)* requests per run.
