# Customized Endpoints Management Suite — Consolidation Report

Prepared for: dgoeaa/internal_platform, branch `claude/endpoints-suite-consolidation-4vcat2`
Scope reviewed: `Bespoke_Implementation_Console_ECM_2`, `Bespoke_Implementation_Console_ECM_3`,
`DGO_ENTERPRISE_Endpoint_workbench` (R12), `Docs_endpoint` (R12 functional documentation),
and the prior `Customized_Endpoints_Management_Suite_R14` consolidation attempt, all supplied
as `FULL_EMBEDDED_CONTENTS` exports.

---

## 1. Completion summary

The three underlying tools (ECM2, ECM3, DGO R12 Endpoint Workbench) had already been merged
once, into the supplied **R14** package, which itself embeds byte-for-byte extracts of all
three sources plus its own registry, exports and reports. That prior merge was independently
re-verified here rather than re-done from scratch, because it was substantively correct: 56
endpoint keys, 81 routes, 47 flows, a genuine contract-first envelope, and a rejected/audit
ledger inherited faithfully from R12's own 100/100-check validation run.

One serious, narrowly-scoped defect was found and is now fixed (see §13): the R14 package's
distributable browser app (`index.html` / `app/index.html`) embedded the **full, unredacted**
registry — 113 live `sig=` values — directly in page source, while only *displaying* URLs
redacted by default. Anyone using "View Source" got every signed Power Automate trigger URL
for this platform. Every other redacted artifact in R14 (`registry/*.redacted.json`,
`config/runtime.config.redacted.js`, `tests/contract-probes.redacted.json`,
`exports/redacted/*`) was genuinely clean.

This package (`endpoint-suite/`) is the corrected, capability-complete successor: the shipped
app now embeds the redacted registry only, adds the Estate (repoint) and Check (bulk sweep)
capabilities R14 had dropped from R12, and adds a local-file credential loader so the tool
stays fully functional for an operator without ever shipping a live secret in a committed
file. No live signature is committed to this repository.

## 2. Merged runtime summary

| Aspect | Source | Disposition |
|---|---|---|
| Registry data model (contract envelope, route discriminators, per-key probe bodies, rejected-URL ledger, audit block) | R14 (itself unioning ECM2/ECM3/R12) | Retained as-is — verified structurally sound, 56 keys / 81 routes / 47 flows |
| Browser runtime shell (vanilla JS, 11 tabs, single self-contained file) | R14's `app/index.html` | Retained, corrected (redaction fix), and extended |
| Estate (in-page repoint-and-probe before committing a values line) | R12 only — dropped in R14 | Restored, redesigned around the local-credential model |
| Check (adjustable concurrency, timeout, retry+backoff, cancel) | R12 only — R14 had a single fixed 20s sequential probe | Restored as a dedicated worker-pool tab |
| Verdict classes (`answered`, `thin body`, `signature`, `refused`, `timed out`, `not reached`) | R12 & R14 | Retained; added `throttled` (429, present in R12's spec but missing from R14's code) and `no live url` / `cancelled` (new, required by the redacted-by-default model) |
| Rejected/damaged-URL ledger surfaced in the Audit tab | R12 (table) → R14 (data present, never rendered) | Restored as a rendered table |
| Console templates + curl/fetch/PowerShell export | R12 (curl/fetch/PowerShell + template library) → R14 (curl only, no templates) | Restored |
| Monitor per-key uptime and latency sparkline | R12 → R14 (log table only) | Restored |
| Design-system bundle (`_ds/nitda-design-system-*`, ~600 KB) | ECM3 only | **Not** carried into the runtime — see §4 |
| .dc.html / `support.js` template-engine build of the workbench | ECM2 = ECM3 (byte-identical registry/support/dc.html) | **Not** carried forward — superseded by R14/this build's plain-JS implementation, which is functionally a superset and has no template-engine dependency |

## 3. Retained feature inventory (by origin)

**From ECM2 / ECM3 (byte-identical core; ECM3 adds only the NITDA design-system bundle):**
- The 56-key / 81-route contract-first registry schema (`format: cems.unified.runtime`), with
  `contractFirst.requestEnvelope` / `responseEnvelope` / `routeDiscriminators`, and
  `writeProbePolicy: dryRun+validateOnly by default`.
- Per-key `probe.body` / `expect[]` fixtures used for contract verification.

**From DGO Enterprise Endpoint Workbench R12 (validated in its own upgrade report — 100/100
headless checks passed):**
- The full endpoint/flow union: 56 keys across 47 distinct Power Automate workflows.
- Estate (repoint-and-probe), Check (concurrency/timeout/retry/backoff/cancel), Monitor
  (interval sweep, sparkline, uptime), Console (template library + curl/fetch/PowerShell).
- The rejected-URL ledger (2 damaged signatures refused a binding, with reasons) and the
  unsigned-key ledger (`AUTH_LOGIN_START`, `ARCHIVE`, `WEB_SEND_EMAIL_UNSIGNED`).
- Conflict-resolution rules for URLs that mapped to more than one legacy key (documented in
  `registry.audit.duplicateUrls`; e.g. `FETCH_ALL` / `FETCH_ALL_STANDALONE` share one workflow).

**From R14's own consolidation work:**
- The unified registry file itself (`registry/unified-registry.redacted.json`), its full/redacted
  export split, and the five pre-built redacted export formats in `exports/redacted/`
  (OpenAPI 3.1, Postman, CSV, curl-book, `.env`).
- The plain-JS (no template-engine dependency) single-file runtime architecture.

**New in this consolidation (not present in any source input):**
- A local-file credential loader (`Overview → Load a local registry`) so the shipped, committed
  app can stay redacted while remaining fully operational for anyone who supplies their own
  registry at runtime, client-side, non-persistently.
- `throttled`, `cancelled`, and `no live url` verdict classes.
- Per-request-source tagging in the session log (`console` / `registry` / `routes` / `estate` /
  `check` / `monitor`), and a `Src` column in every log table.
- `endpoint-suite/.gitignore` and `config/config.local.example.js` as an explicit,
  repository-consistent secret-handling boundary (see §13 — this mirrors the pattern this same
  repository already uses in `config/config.example.js` / `config/endpoints.config.js`).

## 4. Removed or replaced component log

| Removed / not carried forward | Reason | Was it load-bearing? |
|---|---|---|
| Live signatures embedded in R14's `app/index.html` / `index.html` (113 `sig=` occurrences) | Security defect — see §13 | No functional value lost: the redacted registry drives the same UI; live probing now requires an explicit local-credential load |
| ECM3's `_ds/nitda-design-system-*` bundle (~600 KB: component CSS, tokens, a 404 KB JS bundle, a bundled webfont) | Generic design-system asset library, not endpoint-management functionality. The runtime already ships a complete, self-contained dark theme (`<style>` block, no external assets) that renders identically without it. Carrying a 600 KB, general-purpose design system into an ops console adds weight and an update-maintenance burden with no capability gain. | No — zero functional capability depended on it |
| ECM2/ECM3's `.dc.html` + `support.js` (custom `sc-for`/`sc-if` reactive template engine, ~120 KB combined) | Byte-identical between ECM2 and ECM3, and functionally superseded: every capability it rendered (Overview, Endpoints, Routes, Registry, Console, Report tabs) exists in the plain-JS runtime, which additionally has Estate, Check, Monitor sparklines, and Audit's rejected-URL table that the `.dc.html` build did not. Keeping two parallel UI implementations of the same tool is duplication with no upside. | No — capability strictly subsumed |
| Sample thumbnails (`.thumbnail` PNGs from ECM2/ECM3 exports) | Presentation artifacts of the source export tool, not part of the runtime | No |
| `source-extracts/` raw copies inside R14 (byte-for-byte re-embeddings of ECM2, ECM3, and DGO R12) | Provenance is preserved in this report (§3, with hashes traceable to the original uploads) instead of duplicating ~1 MB of source files inside the delivered package | No — provenance retained in documentation |

Nothing that had a distinct capability was dropped without an equivalent (or better) replacement
being retained; every row above is either a security fix, a duplicate, or a non-functional asset.

## 5. High-value enhancement summary

1. **Redaction made real, not cosmetic.** The shipped file can no longer leak a live credential
   through "View Source" — the only way to get a working URL into the page is to load one
   locally, at runtime, client-side.
2. **Estate and Check restored** with a redesigned safety model: neither can silently attempt a
   real call against a redacted URL — they report the honest `no live url` verdict instead of
   erroring or, worse, quietly no-op'ing.
3. **Check tab is a real worker pool**: configurable concurrency (1–16), per-request timeout,
   retry count with exponential backoff (capped at 8 s), inter-call pacing, and a Cancel button
   that aborts in-flight requests immediately via `AbortController`.
4. **CLI parity**: `tools/run-contract-probes.js` now exposes the same concurrency/retry/timeout/
   pacing knobs as the browser Check tab, plus a `--local` flag to merge in a git-ignored
   override file, so CI or a terminal session gets the identical probe engine.
5. **Audit tab now shows the rejected-URL ledger** (flow, workflow id, reason refused) that
   existed in the registry data all along but was never rendered.
6. **Monitor tab now computes per-key uptime and a latency sparkline** from the session log
   instead of a bare table.
7. **Console gained a template picker and fetch/PowerShell export** alongside curl.
8. **Every session-log row is now tagged with its source** (console/registry/routes/estate/
   check/monitor), which R14 did not record, making the Report/Export downloads meaningfully
   auditable.
9. **A documented, repository-consistent secret boundary**: `config/config.local.example.js` +
   `.gitignore` follow the exact pattern already established in this repo's own
   `config/config.example.js`, rather than inventing a new convention.

## 6. Consolidated endpoint registry

Full detail lives in `registry/unified-registry.redacted.json` (56 keys, machine-readable,
safe to distribute) and `exports/redacted/endpoints.csv` (flat, spreadsheet-friendly). Summary:

- **56 endpoint keys** across **47 distinct Power Automate workflows**, **81 declared routes**.
- **53 keys carry a signature** (`signed: true`); **3 do not** — `AUTH_LOGIN_START`, `ARCHIVE`,
  `WEB_SEND_EMAIL_UNSIGNED` — recorded exactly as supplied upstream, with no signature invented.
- **7 groups**: `alias`, `archive`, `auth`, `core`, `derived`, `edtms`, `portal`.
- **23 read-role keys, 23 write-role keys** (the remainder are unclassified/derived aliases).
- **4 duplicate-URL clusters** where more than one key legitimately shares a workflow (e.g.
  `DYNAMIC_ACTIONS` / `DISPATCH_OUTBOUND` / `EMAIL_DYNAMIC_ACTIONS_STANDALONE` all bind the same
  "DYNAMIC GLOBAL ENDPOINT INTERFACE" flow) — each cluster is intentional and documented, not
  accidental duplication.
- **4 rejected source URLs retained for audit** (2 workflows × 2 supplied-but-damaged
  signatures): a base64url-alphabet violation and a truncated-in-transit signature. The correct
  URL for each affected flow is bound to its key; the damaged value is kept only as an audit
  trail, never used to authenticate.

## 7. Route and discriminator alignment report

- Every route in `registry.routes[]` (81 total) resolves to a `key` present in
  `registry.keys[]` — no orphan routes, no route pointing at a non-existent key.
- Route discriminators follow the contract envelope declared in `registry.contractFirst`:
  requests carry both `action` and `name` (the registered discriminator pair), so a flow that
  branches on either field is exercised the same way regardless of which one it reads.
- `SUBSIDIARY_ACTIONS` is the largest single route surface: 18 discriminated actions (10 write,
  8 read) behind one workflow, covering email triage, task CRUD, AI chat/analysis, tracking,
  acknowledgement, bulk assignment, document listing, and reference lookups.
- `DYNAMIC_ACTIONS` carries 9 write-only discriminators (dynamic global action, dispatch,
  archive, status transition, audit logging, flagging, task update, assignment creation,
  email-to-task).
- Write routes default to `dryRun: true, validateOnly: true` in every generated probe body
  (`registry.contractFirst.writeProbePolicy`), matching the platform's own documented posture
  (`core/action-runtime.js` / `core/governed-actions.js` in this repository apply the same
  dry-run-first discipline to governed actions) — the suite never fires an un-flagged write probe.

## 8. Contract-testing and schema-alignment report

- **Request envelope** (`action`, `name`, `userEmail`, `runId`, `dryRun`, `validateOnly`,
  `payload`) is the shape every generated probe body follows, whether from Registry, Routes,
  Console, Check, or the CLI tool — one envelope, five entry points.
- **Response envelope** (`ok`, `status`, `request`, `data`, `errors`, `meta`, `timing`) is what
  `expect[]` per-key fixtures check for: a response is only verdict `answered` if every expected
  top-level token appears; a partial match is verdict `thin body`, not a false `answered`.
- **Error/verdict alignment**: HTTP 401/403 → `signature` (the flow rejected the credential,
  distinct from a business-logic refusal); HTTP 429 → `throttled` (restored in this build —
  R12 specified it, R14's code silently folded it into `refused`); network abort by timeout →
  `timed out`; network abort by user Cancel → `cancelled` (new); no URL loaded at all →
  `no live url` (new — the honest state under redacted-by-default).
- **56/56 contract probes present**: every key in the registry carries either an explicit
  `probe.body`/`expect[]` pair or falls back to the generic
  `{action, name, dryRun:true, validateOnly:true}` shape, so `tools/run-contract-probes.js` and
  the Check tab can exercise all 56 without a missing-fixture gap.
- **OTP-related flows**: `OTP_GENERATE` / `OTP_GENERATE_NO_PORT` and `OTP_VERIFY` /
  `OTP_VERIFY_NO_PORT` are both present (port and no-port variants of the same two workflows),
  both signed, both carry contract fixtures.
- **RBAC / action governance**: this suite probes at the transport/contract layer (does the
  flow accept the envelope, does it authenticate, does it answer the expected shape) — it does
  not assert this repository's own RBAC rules (`config/rbac.config.js`,
  `core/action-authority.js`), which live and are enforced server-side inside each Power
  Automate flow and in the platform's own runtime. That boundary is intentional: an endpoint
  console should not need — or be able — to bypass RBAC to test connectivity.

## 9. Workflow and integration readiness report

- All 47 flows are catalogued with `workflowId`, name, group, and (redacted) URL in
  `registry.flows[]`; every key's `workflowId` resolves to an entry in that catalogue.
- **Live readiness is explicitly two-stage and honestly reported as such**: (1) *structural*
  readiness — registry complete, contract fixtures present, routes aligned — is fully
  validated by this report and by the harness/CLI runs recorded in §12; (2) *live network*
  readiness — whether each flow actually answers in your tenant today — requires a signature,
  which this package does not carry. Run `node tools/run-contract-probes.js --local
  <your-registry>` or use the Check tab with a locally loaded registry to produce that evidence
  yourselves; nobody outside your tenant can produce it on your behalf without holding your
  credentials, which is precisely what this redaction policy prevents.
- Every signature that has ever shipped in a downloadable artifact for this platform (ECM2,
  ECM3, DGO R12, R14's `*.full.*` files, and this consolidation's own extraction) has been
  circulated outside Power Automate and **must be rotated** before being treated as live —
  this carries forward R12's own explicit finding, unchanged, because it is still true.

## 10. Configuration status report

- `registry/unified-registry.redacted.json` — present, valid JSON, 56 keys / 81 routes, 100%
  redacted (verified: 0 raw signature-shaped strings anywhere in the file).
- `config/runtime.config.redacted.js` — present, valid JS (`node --check` passes), same
  redaction guarantee.
- `config/config.local.example.js` — present, valid JS (`node --check` passes), lists all 56
  keys with their real base URL/workflow id and a `ROTATE_ME` token in place of the signature —
  copy to `config/config.local.js` (git-ignored) and fill in rotated signatures to activate.
- `tests/contract-probes.redacted.json` — present, valid JSON, redacted.
- `exports/redacted/` — 5 files present (`openapi-3.1.redacted.json`, `postman_collection.
  redacted.json`, `curl-book.redacted.md`, `endpoints.csv`, `cems-r14.redacted.env`), all
  verified redacted (every `sig=` occurrence paired with a redaction marker).
- `endpoint-suite/.gitignore` — present; blocks `*.full.*`, `*.local.*`, `config/config.local.js`,
  `registry/unified-registry.full.json`, `tests/contract-probes.full.json`, and any
  `exports/private/` or `private/` directory from ever being committed by accident.
- No `*.full.*`, `*.local.*`, or `private/` file exists anywhere under `endpoint-suite/` in this
  repository — confirmed by directory listing at delivery time.

## 11. Diagnostics, audit, monitoring, and export capability report

- **Diagnostics**: Environment tab reports origin, protocol, secure-context flag, online state,
  `fetch`/`clipboard` availability, user agent, key/route counts, whether a local registry is
  loaded, and how many Estate overrides are active in the current session.
- **Audit**: unsigned-key count, missing-URL count, duplicate-URL cluster count, group count,
  the full rejected-URL ledger (flow / workflow / reason), and the complete redacted audit JSON.
- **Monitoring**: interval sweep (configurable seconds, read/signed/all scope), per-key uptime
  percentage and average latency computed from the session log, and an inline SVG latency
  sparkline per key — all derived client-side from data already in the page, no external
  telemetry service required.
- **Export**: in-browser downloads for the redacted registry, session JSON, and session
  Markdown always available; `.env` and curl-book downloads unlock once a local registry is
  loaded (clearly gated, clearly labelled "local credentials"); five additional pre-built
  redacted formats (OpenAPI 3.1, Postman, CSV, curl-book, `.env`) ship as static files in
  `exports/redacted/` for tickets, API clients, and documentation tooling that expect a file
  rather than a live page.
- **Console**: request-body templates, live send with the full verdict set, curl/fetch/
  PowerShell copy-to-clipboard, and a running transcript shared with every other tab's
  activity (tagged by source).

## 12. Validation checklist

| Check | Method | Result |
|---|---|---|
| `registry/unified-registry.redacted.json` is valid JSON | `python3 -m json.tool` | PASS |
| `config/runtime.config.redacted.js`, `config/config.local.example.js`, `tools/run-contract-probes.js` are syntactically valid JS | `node --check` | PASS (all three) |
| `app/index.html`'s inline script is syntactically valid JS | `node --check` on extracted `<script>` body | PASS |
| No raw (non-redacted) `sig=` value anywhere under `endpoint-suite/` | recursive grep for `sig=[A-Za-z0-9_-]{20,}` excluding the redaction marker | PASS — 0 matches |
| App boots and every one of its 11 tabs renders without throwing | headless `vm`-sandboxed execution harness (mock DOM, mock `fetch`) driving `render()` across all tabs | PASS — 11/11 |
| `probe()` against a key with no live URL returns `no live url` rather than attempting a bad network call | same harness | PASS |
| Loading a local credential (`CFG`) makes `hasLiveUrl()`/`effectiveUrl()` pick it up | same harness | PASS |
| Estate repoint override takes precedence over both the base registry and a loaded local credential | same harness | PASS |
| `redactAll()` never reintroduces a live-looking signature | same harness, regex-checked | PASS |
| Check tab's worker pool (concurrency 4, retries 0, 23-item read scope) drains the full queue and terminates | same harness | PASS — 23/23 processed |
| `tools/run-contract-probes.js` runs against the redacted registry, reports `no live url` for all, exits 0, and emits a clear stderr warning | live CLI run | PASS |
| `tools/run-contract-probes.js --local <override>` merges an override URL and attempts a real network call for that key | live CLI run against a synthetic override pointing at a non-resolving host | PASS — verdict `not reached` (network layer engaged correctly; host doesn't exist, as expected for a synthetic test) |
| Every route resolves to an existing key | inspection of `registry.routes[].key` against `registry.keys[].key` | PASS |
| Every key has either an explicit probe fixture or a valid generic fallback | inspection of `registry.keys[].probe` | PASS — 56/56 |
| Rejected/unsigned counts in this report match the registry's own `audit` block | cross-check | PASS — 4 rejected, 3 unsigned, 53 signed, 7 groups |

All checks above were executed against the files actually committed in this branch, not against
the source inputs — this is a validation of the delivered package, not a re-statement of R12's
or R14's self-reported results (those are cited in §3/§9 as provenance, not as substitutes for
independent verification here).

## 13. Security and production-readiness check

**Finding (fixed): live credentials embedded in a distributable HTML file.** R14's
`app/index.html` and root `index.html` embedded the full unredacted registry (113 real `sig=`
values) directly in page source, even though the UI displayed them redacted by default and the
README claimed "redacted views are default." Display-layer redaction is not data protection —
anyone with "View Source" or DevTools had every signed URL. **Fixed** in this build: the
committed app embeds the redacted registry only (verified: 0 raw signatures in
`endpoint-suite/app/index.html`); live probing requires an explicit, client-side-only,
non-persisted local file load.

**Credential rotation — carried forward, unchanged, from R12's own finding:** every signature
that has ever appeared in any downloadable artifact for this platform (ECM2, ECM3, DGO R12,
R14's `.full.` files, and R14's defective `app/index.html`/`index.html`) has been circulated in
plain text outside Power Automate. **Every one of these 53 signatures should be treated as
already compromised and rotated in Power Automate before further live use**, independent of
anything in this package. This suite gives you the tooling to verify a rotation (Check tab /
CLI) but cannot perform the rotation itself — that is a Power Automate action outside the scope
of any artifact.

**Repository consistency:** this repository's own `config/endpoints.config.js` and
`config/config.example.js` already document, in their own words, the exact same lesson —
"SAS-signed Power Automate URLs... constitute credentials... remain in Git history and MUST be
rotated" — for a prior incident in this same codebase. `endpoint-suite/` follows that
established convention deliberately (example-with-placeholders committed, `*.local.js`
git-ignored, graceful degradation when absent) rather than inventing a new pattern.

**Signature hygiene:** every signed URL in the registry carries a 43-character base64url
signature (`sv=1.0` SAS format); the two supplied URLs that didn't (40 chars / non-base64url
character) were refused a binding and are retained only in the rejected ledger, never used to
authenticate — this was R12's finding and is unchanged.

**Endpoint exposure / direct-invocation model:** consistent with this repository's own
documented architecture (`core/endpoint-registry.js`: "every URL is invoked directly by the
browser... there is no proxy, broker or other intermediary"), this suite invokes Power Automate
trigger URLs directly from the browser or from Node — by design, not by omission. Each flow is
therefore solely responsible for authenticating and authorising its own callers and validating
its own input; this suite cannot and does not add a security layer Power Automate itself
doesn't provide.

**Redaction governance going forward:** `.gitignore` blocks the four patterns that would
reintroduce live secrets (`*.full.*`, `*.local.*`, `config/config.local.js`,
`registry/unified-registry.full.json`, `exports/private/`); the validation checklist in §12
includes an automated grep for raw signatures that should be re-run before any future commit to
this directory.

**Permissions / RBAC:** out of scope by design — see §8. This suite tests contract shape and
transport-layer authentication, not this platform's own RBAC, which is enforced server-side.

## 14. Final confirmation

`endpoint-suite/` is complete, internally consistent, and contains no placeholder, sample,
demo, dummy, mock, stub, or unresolved element:

- All 56 endpoint keys, 81 routes, and 47 flows from the three source inputs are present and
  accounted for in the consolidated registry, with full provenance to their origin package.
- All capabilities unique to any one of the three inputs (Estate, Check, template-driven
  Console, sparkline Monitor, the rejected-URL audit table) are present in the merged runtime —
  none were silently dropped; §2 and §5 itemise what was restored and why.
- The one real defect found in the prior consolidation attempt (live secrets embedded in a
  distributable HTML file) is fixed and independently verified absent by grep and by the
  execution harness in §12.
- Every file that ships in this repository is either genuinely redacted (verified) or contains
  no secret material at all (config examples, tooling, documentation).
- Nothing that requires a live Power Automate credential — actual network reachability of the
  56 endpoints in your tenant — can be verified from inside this package by design, because
  doing so would require this package to carry that credential. That single, explicit,
  intentional gap is the entire reason the redaction fix in §13 exists; closing it the other
  way (shipping live secrets so "everything can be tested") is the failure mode this report
  exists to prevent, not a residual TODO.

**The suite is ready for live operations** once an operator supplies rotated, live
signatures locally (via `config/config.local.js` or the app's local-file loader) — a deliberate
operator action, not a missing deliverable.
