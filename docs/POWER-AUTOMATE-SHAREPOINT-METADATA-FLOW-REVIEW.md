# Review — SharePoint Metadata Inventory Flow (Power Automate)

**Subject:** `Scope_GET_NORMALIZE_02_Canonical_SharePoint_Metadata_Intelligence` and downstream
scopes (`Scope_SAVE_05...`, `Scope`, `Scope_SAVE_07_Human_Review_Package_CANONICAL`, `Scope_Delivery`)

**Stated goal:** extract full details of SharePoint sites and exhaustive details of all lists and libraries.

**Reviewed:** 2026-08-15

---

## 1. Verdict

The flow is well structured in its *intent* — fail-safe `Compose_*_Safe` wrappers, per-stage error
records, separation of raw capture / normalisation / quality findings / archive / delivery — and the
REST `$select` projections are valid SharePoint OData. That part is solid.

However, **as written the flow will fail on its first iteration**, and three further defects would
silently corrupt output even after that failure is fixed. Separately, the capture is **not
"exhaustive" and does not cover "sites" (plural)** — it inventories lists and libraries of a single
web, which is a subset of the stated goal.

Findings are ordered by severity. Every finding is tied to a specific action name.

| Severity | Count | Meaning |
|---|---|---|
| Blocker | 3 | Flow fails, or produces wrong data every run |
| High | 10 | Data loss, throttling, privacy, or goal not met |
| Medium | 16 | Correctness/robustness/maintainability |
| Low | 11 | Hygiene |

---

## 2. Blockers

### B1 — `outputs()` used on a `Select` action; must be `body()`

`Select_Normalized_Fields_For_Current_List` is a `Select` action. Its runtime output shape is
`{ "body": [ ... ] }`, so `body('Select_...')` yields the array and `outputs('Select_...')` yields
the **wrapper object**.

It is referenced with `outputs()` in three places:

| Action | Expression | Consequence |
|---|---|---|
| `Filter_Custom_Metadata_Fields` | `"from": "@outputs('Select_Normalized_Fields_For_Current_List')"` | `InvalidTemplate` — the `from` property of a Query action must be an array. **First loop iteration fails.** |
| `Append_Normalized_Object` | `"totalFields": "@length(outputs(...))"` and `"fields": "@outputs(...)"` | `length()` on an object throws; `fields` would embed `{body:[...]}` |
| `Append_Inventory_Row` | `"fieldCount": "@length(outputs(...))"` | same |

This is an isolated slip, not a house convention — every other `Select`/`Query`/`Table` in the flow
(`Select_Human_Review_Objects`, `Select_Human_Review_CSV_Rows`, `Filter_*`,
`Create_CSV_Table_Human_Review_Register`) is correctly referenced with `body()`. 9 correct, 3 wrong.

**Fix:** replace all three `outputs('Select_Normalized_Fields_For_Current_List')` with
`body('Select_Normalized_Fields_For_Current_List')`.

### B2 — Array variables appended inside an unbounded-concurrency `Apply_to_each`

`Apply_to_each_List_Or_Library` has **no** `runtimeConfiguration.concurrency`, so it defaults to a
degree of parallelism of 20. Inside it, six `AppendToArrayVariable` actions mutate shared state:

`varSPInventoryFieldsRaw`, `varSPInventoryContentTypesRaw`, `varSPInventoryViewsRaw`,
`varSPInventoryPermissionsRaw`, `varNormalizedObjects`, `varSPInventoryRows`,
plus `varQualityFindings` and `varSPInventoryErrors` in the nested conditions.

Power Automate variables are **not** concurrency-safe. Parallel iterations perform read-modify-write
on the same variable and lose updates. The symptom is the one that makes this hard to catch in
testing: the flow reports **Succeeded** while `varNormalizedObjects` silently contains fewer objects
than there are lists, and the counts in the manifest, the HTML report, and the register disagree with
reality — in a document whose entire purpose is to be an "Architecture Source of Truth".

The author already knows this pattern: `Apply_to_each_Human_Review_Object_HTML_Row` **does** set
`"runtimeConfiguration": {"concurrency": {"repetitions": 1}}`. The main loop just never got it.

**Fix (minimum):** add to `Apply_to_each_List_Or_Library`:

```json
"runtimeConfiguration": { "concurrency": { "repetitions": 1 } }
```

**Fix (preferred):** keep parallelism but stop appending to variables — have the loop emit a single
`Compose` per iteration and aggregate afterwards, or restructure so the per-list detail calls happen
in a child flow that returns its result. Sequential + 4 REST calls per list is slow but correct;
correctness first.

> Note the interaction with B3/H1: setting concurrency to 1 also removes most of the throttling risk
> in H1, so these should be fixed together.

### B3 — `Set_varHumanReviewHtmlRows_Empty` resets the wrong variable to a junk literal

```json
"Set_varHumanReviewHtmlRows_Empty": {
  "type": "SetVariable",
  "inputs": { "name": "var_SharePoint_Metadata_Report", "value": "Xxd" }
}
```

The action is named for `varHumanReviewHtmlRows` and is the designated reset before
`Apply_to_each_Human_Review_Object_HTML_Row` appends rows to it. Instead it writes the string `"Xxd"`
into an unrelated variable, `var_SharePoint_Metadata_Report`. Two consequences:

1. `varHumanReviewHtmlRows` is never reset. It happens to work today only because each flow run
   starts from a fresh variable state — the safety net the action was written to provide does not
   exist, and the moment this scope is ever re-entered (retry, loop, refactor into a child flow) the
   table silently doubles.
2. `var_SharePoint_Metadata_Report` is polluted with debug text.

**Fix:** `{"name": "varHumanReviewHtmlRows", "value": ""}`. Delete `var_SharePoint_Metadata_Report`
entirely if nothing else reads it — nothing in the supplied scopes does.

---

## 3. High severity

### H1 — Up to 80 concurrent SharePoint REST calls; no explicit retry policy

`GET_List_Fields`, `GET_List_Content_Types`, `GET_List_Views` and `GET_List_Permissions_Optional`
have **no `runAfter`**, so all four fire simultaneously at the start of each iteration. At the default
loop concurrency of 20 that is **80 in-flight REST calls** against one site with one connection.
SharePoint Online will return `429`/`503`. None of the `OpenApiConnection` actions declares a
`retryPolicy`.

Because every call is wrapped in `Compose_*_Safe`, throttled calls degrade to *empty arrays* rather
than failures — so a throttled run produces a confident, complete-looking report describing lists
with zero fields, zero content types and zero views. The error log will show it; the HTML report will
not.

**Fix:** concurrency 1 (B2), chain the four GETs sequentially or cap them, and add an explicit policy:

```json
"runtimeConfiguration": {
  "retryPolicy": { "type": "exponential", "count": 4, "interval": "PT10S", "maximumInterval": "PT1H" }
}
```

Also add a distinct quality finding for *"list detail retrieved as empty because the call did not
succeed"* so a throttled capture cannot be mistaken for a clean one.

### H2 — Payload duplication and `SchemaXml` bloat will hit size limits

Every field's `SchemaXml` is selected in `GET_List_Fields` and retained in `varSPInventoryFieldsRaw`.
`SchemaXml` is typically 1–4 KB per field. A site with 60 lists averaging 80 fields is roughly
5,000 fields → 10–20 MB of XML **before** duplication.

That payload is then held **four times** in the same run:

1. `varSPInventoryFieldsRaw` (raw)
2. `varNormalizedObjects[].fields` (normalised copy, per list)
3. `Compose_Full_Metadata_JSON` → file 01
4. `Compose_Human_Review_Register_JSON` — which re-embeds `rawLists`, `rawFieldRecords`,
   `rawContentTypeRecords`, `rawViewRecords`, `rawPermissionRecords`, `qualityFindings` **and**
   `errors` a second time, on top of `objects`

…and then again as email attachments in two separate scopes.

Consequences: action output size limits, and — certainly — the Office 365 attachment ceiling
(~25–35 MB practical). `Send_an_email_(V2)` attaches all six archive files;
`Send_an_email_(V2)_2` attaches four more.

**Fix:**
- Drop `SchemaXml` from the default `$select`; make it an opt-in parameter for a deep-capture run.
  The normalised projection already extracts what the report actually consumes.
- Make `Compose_Human_Review_Register_JSON` reference file 01 by URL instead of re-embedding the raw
  payload.
- Do not attach large artefacts to email. Link to the archive folder (the manifest already computes
  `archiveFolderWebUrl`). Attach only the CSV register and the HTML report.

### H3 — Objects passed into `ContentBytes`, and no base64 encoding

`Send_an_email_(V2)_1` and `Send_an_email_(V2)_3`:

```json
"ContentBytes": "@outputs('Compose_Archive_Delivery_Result')"
```

`Compose_Archive_Delivery_Result` is an **object**, not a string, being passed to a `format: byte`
parameter. Wrap in `string()` at minimum.

More broadly, `ContentBytes` on `SendEmailV2` expects base64 content. The engine's handling of a raw
string in a byte-format field is inconsistent across connector versions, and the failure mode
(garbled or empty attachments) will not surface as a flow error. Make it explicit and unambiguous:

```json
{ "Name": "@{outputs('Compose_File_Name_Human_Review_Register_CSV')}",
  "ContentBytes": "@{base64(body('Create_CSV_Table_Human_Review_Register'))}" }
```

Also note the two styles used side by side — `Compose_Email_Attachments_Array` uses `"@string(...)"`
while `Compose_Email_Attachments_Array_1` uses `"@{string(...)}"`. Pick one.

### H4 — The human review package is gated on email delivery succeeding

```
Scope_SAVE_07_Human_Review_Package_CANONICAL.runAfter = { "Send_an_email_(V2)_1": ["Succeeded"] }
```

If the notification email fails — over-size attachments (H2), a transient Exchange error, a mailbox
policy — **files 07 through 10 are never generated**, including the CSV register that the whole human
review process depends on. Delivery must never gate artefact production.

**Fix:** reorder so all artefacts are produced and archived first, then deliver:
`Scope_02` → `Scope_05` → `Scope_07` → a single delivery scope. Give the delivery scope a tolerant
`runAfter` (`Succeeded, Failed, Skipped, TimedOut`) so a partial capture is still reported.

### H5 — `contains(title, 'app')` misclassifies real business objects as system lists

In both `Compose_Architecture_Classification` and `Select_Human_Review_Objects`:

```
contains(toLower(Title), 'app')  →  'System/Internal List'
```

This is an unanchored substring test. Verified false positives:

| Title | Classified as |
|---|---|
| Approvals | System/Internal List |
| Application Forms | System/Internal List |
| Appendices | System/Internal List |
| Apparel Register | System/Internal List |
| Happy Hour Photos | System/Internal List |

This is not hypothetical for this tenant — the platform ships an `approvals` module, so an
"Approvals" library on the reviewed site is likely, and it would be filed as a system list, dropped
to `reviewPriority: Low`, and excluded from business review. `'workflow'` and `'taxonomy'` have the
same weakness, less severely.

**Fix:** classify from structural signals, not title text — `IsApplicationList`, `IsCatalog`,
`Hidden`, `BaseTemplate`, and the `TemplateFeatureId`. If a title heuristic is genuinely wanted,
match exact known titles (`'appdata'`, `'apppages'`, `'workflow history'`, `'workflow tasks'`,
`'user information list'`, `'taxonomyhiddenlist'`) rather than substrings.

### H6 — Permission capture cannot distinguish inherited from unique permissions

`GET_List_Permissions_Optional` calls `/RoleAssignments?$expand=Member,RoleDefinitionBindings`. When
a list **inherits** permissions, that endpoint returns the *parent web's* role assignments. The output
is recorded as `permissions` on the list object with no marker, so the register reports every
inheriting list as if it carried its own explicit ACL.

For a governance deliverable this inverts the single most important question — *which objects have
broken inheritance?*

**Fix:**
- Add `HasUniqueRoleAssignments` to the `_api/web/lists` `$select` (valid List property, free — no
  extra call), and record it on every object.
- Only call `RoleAssignments` when `HasUniqueRoleAssignments` is true. This also cuts one REST call
  for the large majority of lists, directly helping H1.
- `$expand=Member` does not expand SharePoint group membership. To resolve groups to people you need
  a follow-up call per group; otherwise label the output as group-level, not user-level.
- Raise a quality finding for broken inheritance — currently there is none.

### H7 — Identity and permission data is written to a broadly readable location and emailed

The archive path is `<site>/Shared Documents/Architecture Source of Truth/...`. Folders created under
`Shared Documents` **inherit that library's permissions**, so every member of the site can read them.
Those files contain the full role-assignment map including `Member` (login names / email addresses)
for every list, plus the complete site structure. The same content is then emailed as attachments to
a shared mailbox (`dgsRegistry@nitda.gov.ng`) — four times per run.

This is a security-relevant inventory being stored and distributed at a lower classification than its
contents warrant.

**Fix:** archive to a dedicated library with broken inheritance, restricted to the governance team;
keep permission detail out of the email attachments (link instead); and treat the mailbox as a
distribution point for the summary only. Confirm retention/DLP handling with whoever owns the tenant
before the first production run.

### H8 — CSV register: no comma/quote escaping and no UTF-8 BOM

`Create_CSV_Table_Human_Review_Register` uses the built-in `Table` action with `"format": "CSV"`.

The `Select_Human_Review_CSV_Rows` step correctly strips `CR`/`LF` from `Title`, `Description`,
`Review Reason` and `Recommended Action` — so newlines were considered — but **commas and double
quotes are not handled**. The built-in CSV table does not reliably quote them. A library titled
`Contracts, Legal` shifts every subsequent column on that row. With 34 columns and free-text
`Description` sourced from arbitrary site content, this will happen.

Separately, `Content-Type: text/csv; charset=utf-8` does not make Excel read the file as UTF-8. Excel
needs a byte-order mark, or diacritics in Nigerian names and titles will render as mojibake.

**Fix:**
- Escape properly: wrap each value in `"` and double any embedded `"` — i.e.
  `concat('"', replace(string(coalesce(v,'')), '"', '""'), '"')` — and build the CSV with
  `join()` rather than the `Table` action, or apply the same escaping inside the `Select` map.
- Prefix the file body with a BOM: `concat(decodeUriComponent('%EF%BB%BF'), body('Create_CSV_Table_...'))`.
- Guard against CSV formula injection: a title beginning `=`, `+`, `-` or `@` executes on open in
  Excel. Prefix such values with `'`.

### H9 — Classification logic is duplicated across scopes and has already drifted

`Compose_Object_Kind` / `Compose_Architecture_Classification` (Scope 02) and
`Select_Human_Review_Objects` (Scope 07) independently re-derive the same classifications from the
same source. They already disagree:

| BaseTemplate | Scope 02 `Compose_Object_Kind` | Scope 07 `objectKind` |
|---|---|---|
| 100 | Custom List | Custom List |
| 101 | Document Library | Document Library |
| 106 | Calendar | Calendar |
| **107** | **Tasks** | *missing* → "Other SharePoint Object" |
| **119** | *missing* → "Other SharePoint List/Library" | **Site Pages Library** |
| 850 | Page Library | Page Library |
| 851 | Asset Library | Asset Library |

`Compose_Business_Relevance` (`System`/`High`/`Medium`/`Low`) and `reviewPriority`
(`Low`/`High`/`Medium`) are likewise two different scales computed from different inputs, both
presented to the same reader.

The register (file 02) and the human review report (file 08) therefore describe the same site
differently — and a reviewer has no way to know which is authoritative.

**Fix:** Scope 07 should read `varNormalizedObjects`, not re-derive from `varSPInventoryListsRaw`.
One classifier, one priority scale, computed once.

### H10 — Coverage does not meet "full details of sites" or "exhaustive"

The flow inventories lists and libraries of **one web**. Against the stated goal, these are missing:

**Site / web level — entirely absent**
- `_api/web` — Title, Description, Created, Language, WebTemplate, Configuration, `AllProperties`
- `_api/site` — Id, Owner, storage quota and usage
- `_api/web/webs` — **subsites are never traversed**, so "sites" (plural) is not met at all
- `_api/web/siteusers`, `/sitegroups`, `/associatedOwnerGroup|MemberGroup|VisitorGroup`
- `_api/web/features` — activated features
- `_api/web/fields` — **site columns** and `_api/web/ContentTypes` — **site content types**.
  For a metadata-architecture source of truth these are arguably more important than the per-list
  copies, since they define the intended model that lists inherit from.
- `_api/web/RegionalSettings`, `_api/web/RoleDefinitions`

**List level — captured but incomplete**
- Versioning *depth*: `MajorVersionLimit`, `MajorWithMinorVersionsLimit`, `DraftVersionVisibility`.
  The report says versioning is on but not how many versions are kept — the governance-relevant part.
- Item-level security: `ReadSecurity`, `WriteSecurity`
- IRM: `IrmEnabled`, `IrmReject`, `IrmExpire`
- `HasUniqueRoleAssignments` (see H6)
- Storage: `RootFolder/StorageMetrics` — no size anywhere, so "largest libraries" cannot be reported
- `WorkflowAssociations`, `TemplateFeatureId`, `ListItemEntityTypeFullName`
- Retention labels / compliance tags

**Field level**
- `Choices` for choice fields, `LookupList` + `LookupField` for lookups, `TermSetId`/`SspId` for
  taxonomy, `Formula` for calculated fields. `SchemaXml` is captured (H2) but never parsed, so this
  detail is present as opaque XML and absent from every report.

**View level**
- `ViewQuery` (the CAML), `ViewFields`, `Aggregations`, `Scope`, `Paged` — a view inventory without
  its query and columns is a list of names.

**Content type level**
- `Fields` / `FieldLinks` per content type, `DocumentTemplate`, parent hierarchy

Also: **no `@odata.nextLink` handling** anywhere. `$top=5000` is a ceiling, not pagination. It is
sufficient for lists/fields/views today, but it is an undeclared assumption in a flow that claims
exhaustiveness.

---

## 4. Medium severity

**M1 — Wrong action referenced in `Compose_Archive_Delivery_Result_1`.** In `Scope_Delivery` it reads
`actions('Send_an_email_(V2)')?['status']` — the email from the *first* delivery scope — instead of
`Send_an_email_(V2)_2`. Its `primaryReportUrl`, `normalizedRegisterUrl` and `manifestUrl` also point
at the Scope 05 files, not the human-review files the scope just created. Copy-paste from
`Compose_Archive_Delivery_Result`; the second delivery confirmation reports on the wrong delivery.

**M2 — Error extraction loses the actual error text.** All error records use
`coalesce(body('X')?['error']?['message'], '<generic>')`. A failed SharePoint connector action
usually returns `{"status":403,"message":"...","source":"..."}`, so `?['error']?['message']` is null
and every entry falls back to the generic string. Use
`coalesce(body('X')?['error']?['message'], body('X')?['message'], string(body('X')), '<generic>')`
and record `body('X')?['status']` — an error log that cannot distinguish 403 from 429 from 404 is not
actionable.

**M3 — File 03 duplicates file 08 and carries no detail.** `Compose_Branded_SharePoint_Metadata_Report`
emits counts and a static scope list — no per-object table. File 08 has the actual table. Two HTML
reports, one of which answers nothing. Merge them.

**M4 — `runAfter` status casing.** `Send_an_email_(V2)`, `Compose_Archive_Delivery_Result` and
`Send_an_email_(V2)_1` use `["SUCCEEDED"]`; the rest of the flow uses `["Succeeded"]`. Normalise —
it survives the current runtime but is a schema-validation hazard on import/export.

**M5 — File bodies passed as objects.** `CREATE_File_01`, `_02` and `_04` pass
`@outputs('Compose_...')` (an object) as the request body, while `_05` and `_06` correctly use
`@string(...)`. Wrap all of them in `string()` so the archived bytes are deterministic.

**M6 — `AppendToStringVariable` in a sequential loop is O(n²).** `Apply_to_each_Human_Review_Object_HTML_Row`
runs at concurrency 1 and re-copies a growing string on every append. For a few hundred lists this is
minutes of runtime for a value that can be produced in one action:

```
join(body('Select_Human_Review_HTML_Rows'), '')
```

where the `Select` maps each object straight to its `<tr>…</tr>` string. Delete the loop and the
variable.

**M7 — Hardcoded recipient, four emails per run.** `dgsRegistry@nitda.gov.ng` appears four times.
Move to a variable/environment variable, and consolidate to **one** email — Scope `Scope` and
`Scope_Delivery` send near-identical messages, and `Send_an_email_(V2)_2` reuses the exact subject of
`Send_an_email_(V2)` (`SharePoint Metadata Inventory Archived - <ts>`), so two messages arrive
indistinguishable in the inbox.

**M8 — No pre-filter before the expensive per-list loop.** Every hidden system list (typically
30–50 per site) costs 4 REST calls. Add a `Filter array` on `varSPInventoryListsRaw` driven by a
parameter (`includeHiddenLists`) before `Apply_to_each_List_Or_Library`. Keeps hidden lists in the raw
inventory while skipping deep capture for them.

**M9 — Deprecated folder API, manual encoding, and JSON string interpolation.**
`GetFolderByServerRelativeUrl` with hand-rolled `replace(' ', '%20')` breaks on `&`, `#`, `%`, `+` and
apostrophes in the site path. Prefer `GetFolderByServerRelativePath(decodedurl='<raw path>')`.
Separately, the folder-creation bodies interpolate into a JSON string literal:
`"{ \"ServerRelativeUrl\": \"@{outputs('...')}\" }"` — a `"` or `\` in the path breaks the JSON. Build
the body as an object (`json(...)` / `setProperty`) instead.

**M10 — Scope 07 file writes are not fail-safe.** `CREATE_File_07` → `08` → `09` → `10` are chained on
`Succeeded` only. One failure skips the rest and fails the scope — which then skips `Scope_Delivery`
entirely. Inconsistent with Scope 05, which deliberately tolerates per-file failure via
`Compose_Run_Manifest_Object`. Apply the Scope 05 pattern.

**M11 — The flow cannot fail.** Every capture path degrades to an empty array and every stage is
tolerant, so a run where `GET_All_Lists_And_Libraries` returned 403 still ends **Succeeded**, still
emails a clean-looking report, and still archives an empty "source of truth". Add a terminal check —
e.g. `Terminate` with `Failed` when `length(varSPInventoryListsRaw)` is 0, or when
`length(varSPInventoryErrors)` exceeds a threshold — and put the error count in the email subject.

**M12 — Dead variables.** `varInventoryWarnings` is read by `Compose_Metadata_Quality_Findings`
(`warningsLogged`, `warnings`) but never appended to anywhere in the supplied scopes — it always
reports 0. `var_SharePoint_Metadata_Report` is only ever written (B3) and never read. Remove both or
populate them.

**M13 — Two different run identifiers.** `Compose_Run_Manifest_Object` sets
`"runId": "@workflow()?['run']?['name']"` while every other artefact uses `varRunId`. If they are not
the same value, cross-referencing the manifest to the register breaks. The run folder name uses
`workflow()?['run']?['name']` too. Pick one and use it everywhere.

**M14 — A full HTML document as an email body.** `Send_an_email_(V2)_2` passes
`outputs('Compose_Human_Review_Report_HTML')` — `<!DOCTYPE html><html><head><style>…` — as the message
body. Outlook strips `<style>` blocks in several clients, so the table loses all formatting. Compose a
separate inline-styled body fragment for email; keep the standalone document for the file.

**M15 — Reviewer decisions have no way home.** `Select_Human_Review_Objects` emits empty `reviewer`,
`reviewDecision`, `owner`, `actionRequired`, `dueDate`, `reviewerNotes` placeholders, and the register
is regenerated from scratch every run. There is no read-back, so any decision a reviewer records in
the CSV is lost at the next execution. For a recurring governance process, write the register to a
**SharePoint list** keyed on `objectId` and update rather than replace — that also makes it reportable
in Power BI without parsing JSON.

**M16 — No pagination.** See H10; `$top=5000` is not `@odata.nextLink` handling.

---

## 5. Low severity

- **L1** — `CREATE_Parent_Archive_Folder` is the only action using connection reference
  `shared_sharepointonline-2` (`shared-sharepointonl-32e8a53c-…`); everything else uses
  `shared_sharepointonline`. If those are different identities, parent-folder creation may succeed or
  fail independently of the rest, and the folder's Created By will differ. Almost certainly
  unintentional — consolidate.
- **L2** — Duplicate `operationMetadataId` values: `…000120` on five `Compose_File_Name_*` actions,
  and `…000132` / `…000133` reused across `Scope` and `Scope_Delivery`. These are meant to be unique
  and can confuse the designer.
- **L3** — `Compose_Tenant_Root_Url` only re-emits `varTenantRootUrl`. Redundant.
- **L4** — `htmlBusinessVisibility` is identical to `businessVisibility` (no escaping applied,
  fixed vocabulary). Drop it.
- **L5** — `Sharepoint_Site_url` breaks the `var*` naming convention used by every other variable.
- **L6** — `EntityTypeName` is selected and archived but never used or surfaced.
- **L7** — `concat(outputs('Compose_Tenant_Root_Url'), <serverRelativeUrl>)` will produce `//` if
  `varTenantRootUrl` ends in `/`. Normalise once at initialisation.
- **L8** — Archive path length: site path + `/Shared Documents/Architecture Source of Truth/SharePoint
  Metadata Inventory/<yyyyMMdd_HHmmss>_<run GUID>/<50-char filename>` runs ~200 characters before the
  site path. Fine for most sites; tight against SharePoint's 400-character limit for deeply nested
  ones. Consider shortening the run-folder suffix.
- **L9** — `Shared Documents` is hardcoded. Stable as a URL segment in most tenants, but it assumes
  the default library exists on the target site.
- **L10** — `ContentTypes?$select=Id,StringId` — `Id` is a complex type and returns
  `{"StringValue":"0x0101…"}`; `StringId` already gives the flat value. Redundant.
- **L11** — `Compose_Branded_SharePoint_Metadata_Report` passes integers to `concat()` without
  `string()`, while `Compose_Human_Review_Report_HTML` wraps them. Works either way; be consistent.
- **L12** — `ItemCount` includes folders as items. Worth stating in the report legend, since
  `reviewPriority: High` is driven by `ItemCount > 100`.

---

## 6. What is done well

Worth preserving through any refactor:

- The `Compose_*_Safe` + `Condition_Log_Error_*` pattern is a genuinely good fail-safe idiom, applied
  consistently across all five capture calls, with per-stage `runId`/`siteUrl`/`listId` context in
  every error record.
- `retrievalStatus` embedded per object in `Append_Normalized_Object` means a consumer can tell which
  parts of a record are trustworthy. That is better than most inventory flows manage.
- The OData `$select` projections are valid and well chosen — `$expand=RootFolder` with
  `RootFolder/ServerRelativeUrl` is correct, and the `guid'…'` escaping in the concatenated URIs
  (`'…(guid''', Id, ''')/fields'`) is right.
- HTML escaping in `Select_Human_Review_Objects` (`htmlTitle`, `htmlServerRelativeUrl`,
  `htmlRecommendedAction`) correctly handles `&`, `<`, `>`, `"`, `'` — and does `&` first, which is
  the ordering people usually get wrong.
- Stripping `CR`/`LF` before the CSV projection shows the newline hazard was considered (it just
  stopped short of commas and quotes — H8).
- The archive layout — timestamped run folder, numbered artefacts, manifest with per-file save status
  — is a sound, auditable structure.

---

## 7. Suggested order of work

1. **B1, B2, B3** — three edits; without them the flow does not run correctly at all.
2. **H1 + H6** — add `HasUniqueRoleAssignments`, make the permissions call conditional, add retry
   policy. Fixes throttling and the biggest governance gap together.
3. **H4** — reorder scopes so delivery cannot gate artefacts.
4. **H8, H3** — make the CSV and the attachments correct; they are the reviewer-facing outputs.
5. **H5, H9** — one classifier, structural signals, consumed by both scopes.
6. **H2, H7** — payload diet and archive permissions before the first production run.
7. **H10** — extend coverage to web/site properties, site columns, site content types and subsites.
   This is the largest piece of new work and is what moves the flow from "list inventory" to the
   stated "full details of SharePoint sites".
8. Medium and Low as capacity allows; **M11** (make the flow able to fail) is the highest-value item
   in that tier.
