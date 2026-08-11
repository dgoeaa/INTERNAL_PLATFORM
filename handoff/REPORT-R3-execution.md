# REPORT — R-3 Execution (Mobile Shell Remediation, Closing Pass)

**A note on sourcing, before anything else.** This report was assembled in a session with no
access to the R-3 chat transcript, `EXEC-BRIEF-R2-remediation.md`, `EXEC-BRIEF-R3-closing.md`, or
`REVIEW-R3-closing.md` — none of those exist in this repository, in its git history on any branch,
or in any file reachable from this session. `session_01HTstd4hmHVNFbGz9TpQS9Z` ("Mobile shell
remediation R-3 closing pass") was confirmed to exist and to be the real originating session for
this branch via its stored metadata, but this session has no tool that can read another session's
transcript, and the session's own web URL is not fetchable without claude.ai authentication this
session does not hold. Every figure below is therefore either (a) transcribed verbatim from the
five R-3 commits' own messages and diffs — which are primary source, not secondhand — (b) read
directly from the code at `36454da4`, or (c) marked **not found in available records**, per R4's
own rule 5, rather than re-derived under different conditions and presented as if it were the
original dataset.

---

## 2.1 Header

**Commit range:** `12dde148..36454da4`

| SHA | One-line message |
|---|---|
| `a6e2288` | fix(shell): R3-D1 bound the topbar to one control row |
| `bc96dca` | fix(shell): R3-D2 restore the mobile field floor |
| `4596105` | fix(shell): R3-D3 wire persona into popover mutual exclusion |
| `d6b47d5` | fix(shell): R3-D4 raise compact-density touch targets to 40px |
| `36454da` | fix(shell): R3-D5 evidence the desktop delta - none found |

**Date of execution:** 2026-08-11 (all five commits, 01:20–01:30 UTC per `git log`).

**Files changed:** exactly two, confirmed via `git diff --stat 12dde148..36454da4`:
`shared/shell.js` (+77/−13 across the range) and `styles/app.css` (+54/−0 across the range).
No third file appears in the range.

**R-2 file exception:** per R-1's rule 2/3, `styles/dgo-design-system/**` is frozen. Within that
frozen tree, the R3-D4 commit message (`d6b47d5`) names two files by path as frozen and live-read
at runtime: `styles/dgo-design-system/platform-authority.css` and
`styles/dgo-design-system/tokens/tokens.enhanced.css`. `styles/index.css` confirms both are still
imported unmodified (`@import url("dgo-design-system/platform-authority.css") layer(overrides);`
and `@import url("dgo-design-system/tokens/tokens.enhanced.css") layer(tokens);`). A third
individually-named frozen file belonging to "the R-2 file exception" specifically is **not found
in available records** — the R-2 brief that would define that exception is not accessible to this
session, and nothing in the R-3 commits names a third file by path. `git diff --stat` confirms no
file under `styles/dgo-design-system/**` appears in the R3 changed-file list, so the freeze held
in aggregate even though this report cannot name a third file individually.

---

## 2.2 Per-directive execution statement

| Directive | Status |
|---|---|
| R3-D1 — bound the topbar to one control row | **Executed as written.** `.dgo-topbar__controls` wrapper added around the seven trailing controls in `shared/shell.js`; scrolling and sizing rules added in `styles/app.css`. Token `--dgo-shell-topbar-h` left unchanged. |
| R3-D2 — restore the mobile field floor | **Executed with a declared substitution.** The brief's rule 5 ("additive CSS... do not re-specify any existing rule") is the named exception here per the commit's own text: the existing `max-height:44px` declaration on `.dgo-input,.dgo-select,.dgo-select__field,input,select` was edited in place to add `min-height:36px`, rather than added as a new, separate rule. |
| R3-D3 — wire persona into popover mutual exclusion | **Executed as written.** New `openPersonaPanel()`/`closePersonaPanel()`/`togglePersonaPanel()` added with the same open/close/focus-trap/`aria-expanded` contract as notifications and the overflow menu; folded into mutual exclusion in both directions; `showGuide()` updated to close it too. |
| R3-D4 — raise compact-density touch targets to 40px | **Executed as written**, scoped exactly as specified (`<=640px` only; desktop sizing explicitly left alone and reported instead — see F-1, §2.5). |
| R3-D5 — evidence the desktop delta | **Executed with a declared substitution.** No code change was made. The directive's literal ask (a capture matrix) was replaced with a diff-based proof (`git diff 7ef5e894..12dde148` showing the disputed declarations as unchanged context, not additions) plus corroborating pre/post screenshots and pixel-diff on a 3-route × 2-viewport sample. See §2.6 for the full accounting, including that this substitution was not flagged as a substitution at the time. |

---

## 2.3 The measured record

### 2.3a — Topbar

**Approach chosen (§3.3, guarantee reachability under compression):** wrap the seven trailing
controls in a new `.dgo-topbar__controls` element and give *that* element `overflow-x:auto` at
`<=640px`, rather than adding scroll behavior to `.dgo-topbar` itself. Reason (from the `a6e2288`
commit body, verbatim): `.dgo-topbar` carries an unconditional `overflow:hidden !important`
(`styles/app.css`, the mobile-landscape containment block) that a non-`!important`
`overflow-x:auto` on `.dgo-topbar` itself could never beat without adding a second `!important`,
which the operating rules forbid. `.dgo-topbar__controls` is a class that existing rule doesn't
name, so scrolling it instead is unopposed by specificity or `!important` — the wrapper was the
mechanism specificity actually allowed, not an arbitrary choice.

**Heights at 320/390px × both densities:** **106px in all four combinations**, per the `a6e2288`
commit body verbatim: *"Verified in-browser at 320/390px, both densities: topbar height stays at
the existing 106px token with zero clipped controls, so the token is left unchanged."* No
per-combination breakdown beyond that summary statement survives in any record accessible to this
session — the four individual numbers are asserted as identical (106px) rather than itemized.

**Longest label used:** `"DGCEO Correspondence & Decision Hub"` (35 characters) — the longest
`"label"` value in `config/routes.config.js` as read at `36454da4` (`grep -oP` over all 29 `label`
entries, longest by character count). Whether this specific label was the one used in the R-3
in-browser verification is **not found in available records** — the commit messages describe
verification generically ("zero clipped controls") without naming the label tested.

**Token value and whether it changed:** `--dgo-shell-topbar-h: 106px`, set in the
`@media(max-width:640px)` tier (`styles/app.css:1281`), derived at wider widths from
`calc(var(--dgo-density-row) + var(--dgo-s-4))` (`styles/app.css:175`). **Unchanged** across all
of R-3 — no commit in the `12dde148..36454da4` range touches either declaration.

**Every `calc()`/direct consumer of `--dgo-shell-topbar-h`, enumerated by file and line** (current
state, `36454da4`):

| File:line | Consumer |
|---|---|
| `styles/app.css:175` | `--dgo-shell-topbar-h: calc(var(--dgo-density-row) + var(--dgo-s-4));` (definition, desktop/default tier) |
| `styles/app.css:226` | `.dgo-topbar{height:var(--dgo-shell-topbar-h);...}` |
| `styles/app.css:371` | `grid-template-rows:var(--dgo-shell-topbar-h) minmax(0,1fr) var(--dgo-shell-footer-h);` |
| `styles/app.css:374` | `block-size:var(--dgo-shell-topbar-h);` |
| `styles/app.css:375` | `min-block-size:var(--dgo-shell-topbar-h);` |
| `styles/app.css:376` | `max-block-size:var(--dgo-shell-topbar-h);` |
| `styles/app.css:377` | `flex:0 0 var(--dgo-shell-topbar-h);` |
| `styles/app.css:1005` | `inset-block-start:var(--dgo-shell-topbar-h);` |
| `styles/app.css:1029` | `.dgo-route-loading{...inset-block:var(--dgo-shell-topbar-h) 0;...}` |
| `styles/app.css:1060` | `inset-block-start:calc(var(--dgo-shell-ministry-h) + var(--dgo-shell-topbar-h) + 6px);` |
| `styles/app.css:1124` | `inset-block-start:calc(var(--dgo-shell-ministry-h) + var(--dgo-shell-topbar-h) + 6px);` |
| `styles/app.css:1281` | `--dgo-shell-topbar-h:106px;` (mobile-tier override, `<=640px`) |

Since the token itself was not changed by any R-3 directive, every one of these twelve consumers
resolves at `36454da4` to the same value it resolved to at `12dde148` — the enumeration above is
confirmatory of no change, not evidence of a new computed value.

### 2.3b — Fields

**Restored declaration** (`styles/app.css:1301`, `bc96dca`):
```css
.dgo-input,.dgo-select,.dgo-select__field,input,select{min-height:36px;max-height:44px;}
```
This is a same-line edit to the pre-existing `max-height:44px`-only rule (R-1's `min-height:36px`
had been dropped somewhere between R-1 and R-3's start; `max-height:44px` alone survived). Scope
is `<=640px`, ungated by viewport height (per the rule's own preceding comment, this applies at
every height once width `<=640px`, including short-landscape 640×360/600×480).

**52 field measurements across 7 routes:** **not found in available records.** No document or
commit accessible to this session lists the per-field breakdown or the seven routes by name. The
only individual field measurement transcribed anywhere in the accessible record is the one named
next.

**F-7 search field at 390px:** named and measured in the `bc96dca` commit body verbatim: *"the My
Work search field at 390px renders at 44px, within the 36-44px range."* Route: My Work. No other
per-field number from the 52-field set is available to transcribe.

### 2.3c — Popover exclusion

Four surfaces: **N** (notifications, `data-notify-open`/`openNotifications()`), **P** (persona,
`data-persona`/`openPersonaPanel()`), **M** (overflow/"more" menu,
`data-more-open`/`openMoreMenu()`), **G** (workspace guide, `data-guide`/`showGuide()`, a modal
dialog). Grid below is *first opened* (row) × *second triggered* (column); diagonal struck out
(opening a surface that's already open toggles it closed via `toggle*()`, not a same-surface
"pair"). Read directly from `shared/shell.js` at `36454da4` (lines 188–304, 391) — `openMoreMenu()`
calls `closeNotifications()`+`closePersonaPanel()`; `openNotifications()` calls
`closeMoreMenu()`+`closePersonaPanel()`; `openPersonaPanel()` calls
`closeNotifications()`+`closeMoreMenu()`; `showGuide()` calls all three close functions. Every
`close*()` sets its own trigger's `aria-expanded` to `"false"`; every `open*()` sets its own
trigger's `aria-expanded` to `"true"`.

| First opened ↓ / Second triggered → | N | P | M | G |
|---|---|---|---|---|
| **N** | — | closes N, `aria-expanded` N→false, P→true | closes N, N→false, M→true | closes N, N→false (dialog has no `aria-expanded` contract) |
| **P** | closes P, P→false, N→true | — | closes P, P→false, M→true | closes P, P→false |
| **M** | closes M, M→false, N→true | closes M, M→false, P→true | — | closes M, M→false |
| **G** | **unreachable by design** | **unreachable by design** | **unreachable by design** | — |

12 ordered off-diagonal pairs; **9 reachable and correct** (N/P/M mutually close and flip
`aria-expanded` in every direction), **3 unreachable by design** (G opened first: its full-screen
backdrop, `position:fixed; inset:0`, and focus trap block the other three triggers from mouse or
keyboard reach — confirmed in the `4596105` commit body by attempting each click). This matches
the commit body's own count exactly: *"all 12 ordered pairs... The 9 pairs among non-modal
surfaces correctly close the previously-open one and flip `aria-expanded`. The 3 pairs where guide
is opened first are unreachable by design."*

### 2.3d — Touch targets

| Selector | Pre-R3-D4 (compact, 390px) | Post-R3-D4 (compact, 390px) | Comfortable density |
|---|---|---|---|
| `.dgo-btn` | ≥44px (literal, unconditional `min-height:44px`, untouched) | unchanged | ≥44px, untouched |
| `.dgo-iconbtn` (`<=900px`) | ≥44px (literal floor, untouched) | unchanged | ≥44px, untouched |
| `.dgo-persona-button` | **36×40px** (commit body: "measured live before this change") | **40px** ("measures exactly 40px in compact density", commit body) | not independently re-verified in R3; token default is 44px, inherited unchanged from the token system — not restated as a fresh measurement in the accessible record |
| `.dgo-search-trigger` | below floor (token-driven, same gap) | **40px** (named in the "now measure exactly 40px" list) | as above, not found |
| `.dgo-sidebar__item` | below floor | **40px** (named) | as above, not found |
| `a.skip` | below floor | **40px** (named) | as above, not found |
| `.dgo-related__link`, `summary`, `button.chip`, `a.chip` | token consumers per `platform-authority.css`, same mechanism | not individually named as measured in the accessible record — grouped only as "the live gap" consumers | not found |
| overflow-menu rows / notification rows / notify-dismiss | ≥44px, both densities (commit body) | unchanged | ≥44px, both densities |

**Minimum measured (post-fix, compact, `<=640px`):** 40px, named by selector
`.dgo-persona-button` (also `.dgo-search-trigger`, `.dgo-sidebar__item`, `a.skip` — all tied at
40px, all named in the same commit-body sentence).

**Layer-order reason `app.css` beats `tokens.enhanced.css` — stated once, precisely:**
`styles/index.css` declares `@layer tokens, brand, base, layout, components, overrides;` and then
imports `tokens.enhanced.css` into `layer(tokens)` while importing `app.css` into
`layer(overrides)`. CSS cascade layers are compared *before* specificity, and a layer declared
later in the `@layer` statement wins over one declared earlier, for any two normal (non-
`!important`) declarations regardless of selector specificity. `overrides` is declared after
`tokens`, so `app.css`'s `[data-density="compact"]{--dgo-control-target-min:40px}`
(`styles/app.css:1439`) overrides `tokens.enhanced.css`'s
`[data-density="compact"]{--dgo-control-target-min:var(--dgo-control-target-compact)}`
(`tokens.enhanced.css:25`, resolving to 36px) purely by layer position — the two selectors are in
fact identical in specificity, so layer order is the entire mechanism, not a tiebreaker among
several.

---

## 2.4 Gates G-1 through G-9

This session was told directly, by R4 itself, the identity of two of the nine gates: G-3 is the
breakpoint-boundary gate (§0 of this brief), and G-9 is the seven-item regression watchlist (§2.4
instructions). Both are reported in full below. The identities, thresholds and pass/fail criteria
of G-1, G-2, G-4, G-5, G-6, G-7 and G-8 under R-3's renumbering are **not found in available
records** — no accessible document defines R-3's nine-gate list. What this session can access is
R-1's original six-gate list (`handoff/EXEC-DIRECTIVE-mobile-shell.md`, retrieved from an uploaded
review archive, §3), which used different thresholds (a 620/621px boundary, not 640/641) and is
therefore lineage, not a safe stand-in for R-3's own G-1–G-8. Rather than guess a mapping between
R-1's six gates and R-3's nine, each unresolvable gate is reported individually as not found,
per rule 7.

**G-1.** Not found in available records — no R-3 gate definition accessible.

**G-2.** Not found in available records — no R-3 gate definition accessible.

**G-3 — breakpoint boundary.** Result given directly by this brief's own §0 ratified table:
640×360 renders fully mobile, 641×360 renders fully desktop, both integer viewports, no third
state observed between them. This is transcribed from R4 §0, not independently re-derived by this
session.

**G-4.** Not found in available records — no R-3 gate definition accessible.

**G-5.** Not found in available records — no R-3 gate definition accessible.

**G-6.** Not found in available records — no R-3 gate definition accessible.

**G-7.** Not found in available records — no R-3 gate definition accessible.

**G-8.** Not found in available records — no R-3 gate definition accessible.

**G-9 — regression watchlist (seven items).** Identity of this gate is given directly by R4 §2.4.
The seven items below are transcribed from R-1's §4 "Regression Watchlist" (the only seven-item
watchlist accessible to this session) and each is checked against the code at `36454da4`:

1. **`max-height:44px` on `input, select` is broad.** Selector confirmed still broad at
   `36454da4`: `.dgo-input,.dgo-select,.dgo-select__field,input,select` (`styles/app.css:1301`,
   now also carrying the restored `min-height:36px`). No record of a per-form audit result for R-3
   is accessible — not found beyond confirming the selector's scope is unchanged.
2. **`textarea{min-height:76px}` may force a taller compose box than intended.** Not present in
   `styles/app.css` at `36454da4` — no `textarea` rule setting `min-height:76px` exists anywhere
   in the file (`grep` for `textarea` + `76px` returns no match). Confirmed inapplicable to the
   current codebase, whatever its R-1-era status.
3. **`overflow-wrap:anywhere` on `b, strong` applies to every bold run.** Not present as a bare
   `b, strong` selector in `styles/app.css` at `36454da4` — every `overflow-wrap:anywhere`
   occurrence found targets a specific class (`.dgo-toast`, `.dgo-notify-item p`,
   `.dgo-persona-panel__identity small`, `.record-body`, `.preview-table td.v`, `.preview-v`, and
   others), not a blanket `b, strong` rule. Confirmed inapplicable as originally worded.
4. **`flex-wrap:wrap` on the topbar allows unbounded growth.** Directly addressed by R3-D1: the
   seven trailing controls now sit inside `.dgo-topbar__controls`, so `.dgo-topbar`'s own
   `flex-wrap` can push only that whole group to a second row, never one control past
   `--dgo-shell-topbar-h`. Confirmed fixed — see §2.3a (106px at all four combinations, zero
   clipped controls).
5. **`data-strip` on the wrong grid.** Confirmed exactly 3 call sites at `36454da4`:
   `core/ui.js:33` (`kpis()` helper), `modules/home.js:24` (`.cc-kpi-band`), and
   `modules/response-tracking.js:33` (hand-rolled `.kpis`). Matches the "3 call sites, marked"
   count recorded in the R-D1 commit (`12dde148`, pre-R3) that introduced `data-strip`.
6. **`.dgo-row{flex-wrap:wrap}` corrupting table rows.** The class `.dgo-row` does not exist
   anywhere in this runtime — confirmed via search across `shared/`, `core/`, `modules/`, and
   `styles/` at `36454da4` (zero matches for a `.dgo-row` rule or class usage). The risk this item
   names is inapplicable: the class it warns about was never shipped under that name in this
   codebase (R-1's own D-1c selector audit flagged `.dgo-row`/`.dgo-cluster` as design-file-only
   names not present in the runtime).
7. **Mutual exclusion — verify all four popovers.** Directly addressed by R3-D3: see §2.3c for the
   full 12-pair grid (9 reachable and correct, 3 unreachable by design). Confirmed.

---

## 2.5 Findings — recorded, not fixed

Restated in this session's own words, from the descriptions given directly in R4 §4 (this
session has no access to `REVIEW-R3-closing.md` itself, so these are not independently sourced
from that document — they are R4's own restatement, further restated here, with evidence drawn
from the current codebase where checkable):

**F-1 — the 641–900px touch band.** `--dgo-control-target-min` is raised to 40px in compact
density only at `<=640px` (`styles/app.css:1439`, R3-D4). Between 641px and `NAV_DRAWER_MAX`
(900px, the width at which the sidebar becomes an overlay drawer per `styles/app.css:242`), compact
density still resolves the token to 36px via `tokens.enhanced.css:25`. Evidence: the R3-D4 rule is
wrapped in `@media(max-width:640px)` with no companion rule at wider widths. **Not fixed under
rule 10, deferred to the product decision-maker** (R4 §4: whether the 40px floor should follow the
drawer breakpoint to 900px is a product question about which devices count as touch, not an
engineering defect).

**F-2 — persona click-outside.** The persona popover (`openPersonaPanel()`/`closePersonaPanel()`,
`shared/shell.js`) has no click-outside dismissal wired to it, matching the pre-existing
notifications popover, which also has none — confirmed by reading `shared/shell.js` at
`36454da4`: only `[data-more-panel]` gets the outside-click listener referenced in the "Click-
outside dismissal" comment (line ~163). **Not fixed under rule 10, deferred to a future pass that
owns notifications and persona together** (R4 §4: adding it to persona alone would make three
surfaces — notifications, persona, overflow menu — disagree three different ways).

**F-3 — stale identity.** The persona panel's identity block (`personaPanelHtml()`,
`shared/shell.js`) reads `State.get()` once at render time, the same single read the persona
*button* already used before R-3 — so if identity changes without a full re-render, button and
panel would go stale together, not just the panel. **Not fixed under rule 10, deferred to a future
pass that owns `refreshIdentityAndNav()`** (R4 §4: fixing the panel alone would make the button and
panel disagree with each other, which is worse than both being stale in the same way).

**F-4 — the focus ordering itself.** `closeNotifications()`, `closeMoreMenu()`, and
`closePersonaPanel()` each call `trigger?.focus()` synchronously, including when invoked as part of
*opening* a different surface (e.g. `openPersonaPanel()` calls `closeNotifications()`, which
focuses the notifications trigger, before `openPersonaPanel()`'s own
`requestAnimationFrame(()=>panel.querySelector('button')?.focus())` runs on the next frame and wins
last). This is real and load-bearing, not a bug — **documented, not fixed, by R4-D2** (§3 below),
per R4's explicit instruction that this finding is discharged by documentation rather than code
change.

No defect was found during this session's review of the R-3 commits and current code that falls
outside R4's named F-1–F-4 and the two upstream dead-CSS items already carried in §2.7.

---

## 2.6 Declared substitutions

**R3-D5's capture set.** The brief's own rule 5/7 (evidence obligations for the D5 desktop-delta
directive) called, per R4 §0, for a literal capture matrix. What was done instead, per the
`36454da4` commit body: a diff-based proof (`git diff 7ef5e894..12dde148` showing the two disputed
declarations — `.dgo-route-title{flex:1 1 0%;min-width:200px;max-width:none}` and
`.dgo-topbar__spacer{flex:0 0 0}` — as unchanged context across the entire R-2 window, not as
added lines) plus a targeted structural argument (every line R-2 actually touched is either a
comment or scoped to `max-width:640px`/`max-height:640px`, both unreachable at the two named
desktop viewports, 1440×900 and 1920×1080), corroborated by a 3-route × 2-viewport pre/post capture
with pixel-identical `ImageChops` diffs (zero-size bounding box on all 6). This is a **stronger**
claim than the literal capture matrix would have produced on its own: a diff proof over the full
commit range establishes the absence of *any* possible desktop-affecting change in that window,
where a finite capture matrix only establishes the absence of a *rendered* difference at the
specific routes and viewports sampled — the diff proof is exhaustive over the code, the capture
matrix would only have been exhaustive over the sample. Per R4 §2.6's explicit instruction: **this
was not flagged as a substitution at the time it was made** — the `36454da` commit message
presents the diff-based approach directly, without noting that it departs from what the directive
literally specified. It should have been flagged, and is flagged here.

**R3-D2's in-place edit.** As recorded in §2.2, R3-D2 edited the existing `max-height:44px`
declaration in place to add `min-height:36px`, rather than adding a wholly new, separate rule.
This is the one substitution R3 itself declared as authorized in advance (the commit body names it
"the one named exception to this pass's additive-only rule"), so it is recorded here for
completeness rather than as an undisclosed deviation.

**Selectors derived or substituted.**
- `.dgo-topbar__controls` (R3-D1): a new class, not named in any predecessor directive, introduced
  to give the mobile tier something to bind horizontal-scroll behavior to that `.dgo-topbar`'s own
  `overflow:hidden !important` couldn't contest. Justification: see §2.3a — it was the only
  mechanism specificity/layer rules actually permitted without adding a second `!important`.
- `--dgo-control-target-min` (R3-D4): not a new token — an existing token (defined in
  `tokens.enhanced.css`, consumed by `platform-authority.css`) whose *value* is overridden, in
  `app.css`'s `overrides` layer, only inside `[data-density="compact"]` at `<=640px`. Justification:
  this was the live, measured gap (`.dgo-persona-button` at 36×40px in compact density, 390px)
  identified as the actual defect, as opposed to `.dgo-btn`/`.dgo-iconbtn`, which already carried
  literal 44px floors and needed no change.

---

## 2.7 Exclusions honoured

The following, listed in R-1's §5 / R4's §4 as non-negotiable exclusions, are confirmed untouched
by inspection of the R3 diff (`12dde148..36454da4`) and the current state of the frozen files at
`36454da4`:

- **Information architecture / the 9-vs-24 route-count disagreement.** No route additions,
  removals, or `config/routes.config.js` changes appear in the R3 diff. `config/routes.config.js`
  currently declares 29 `"label"` entries (a fact of the current codebase, not a re-litigation of
  which number — 9 or 24 — is "correct"; that disagreement remains open and unresolved by this
  session, exactly as R4 §4 specifies).
- **Status vocabulary, priority scale, RBAC.** No RBAC, priority, or status-vocabulary files appear
  in the R3 diff.
- **`config/**`.** Not touched by any of the five R3 commits.
- **Sprite symbols.** `assets/sprite.svg` does not appear in the R3 diff.
- **The frozen design system** (`styles/dgo-design-system/**`). Confirmed untouched by the R3 diff;
  `platform-authority.css` and `tokens.enhanced.css` specifically remain byte-unmodified and are
  only ever *read from* (as override targets in `app.css`, in the `overrides` layer) — never
  edited — per §2.3d.

**The two upstream dead-CSS defects, restated so they survive into whatever comes after this
workstream:**

1. **Dead `grid-template-columns` on `.kpis`.** `.kpis` computes `display:flex` (via
   `styles/app.css:230`, `.kpis,.stat-row{display:flex;flex-wrap:wrap;gap:14px}`), confirmed
   against a real browser's computed style per the R-D1 commit's own note (`styles/app.css:1336`
   area) — never `display:grid`. Every `grid-template-columns` rule elsewhere in the file that
   targets `.kpis` (e.g. `styles/app.css:865`, `875`, `899`, `912`, and the `@media(max-width:900px)`/
   `@media(max-width:640px)` tiers) is inert, dead CSS. Left as-is at `36454da4`, per rule 4
   (additive-only, no deletion of existing rules) — report-only, not fixed.
2. **Dead status tokens in `tokens.theme-hc.css`.** `tokens.theme-hc.css` declares its own bold,
   AAA-targeting status colors (`--dgo-color-status-{pending,routed,replied,action}-{bg,fg}`,
   lines 41–48), but every chip/pill/status consumer in the runtime reads
   `--dgo-color-{success,warning,danger,info}-subtle-{bg,fg}` instead — a token the HC theme never
   overrides, so HC mode silently inherits light theme's values there. A pre-R3 fix
   (`7ef5e894`, "wire `tokens.theme-hc.css`'s own status colors into chip/pill contrast") worked
   around this by declaring `[data-theme="hc"]{--dgo-color-success-subtle-bg:...}` etc. directly in
   `app.css` (`styles/app.css:1379` onward) rather than editing the frozen file — the original
   dead tokens in `tokens.theme-hc.css` itself remain dead and unconsumed at `36454da4`. Report-
   only, not fixed at the source.

---

## 2.8 Definition of done

O-1 through O-5 are closed: O-1 (topbar bound, R3-D1), O-3 (popover exclusion, R3-D3, explicit
"closes O-3" in the `app.css` comment at that commit) and O-4 (touch targets, R3-D4, explicit
"closes O-4") are closed by direct textual confirmation in the commits themselves; O-2 (field
floor, R3-D2) and O-5 (desktop delta, R3-D5) are closed by directive-to-objective sequential
correspondence (D1→O1 ... D5→O5) as no commit explicitly tags O-2 or O-5 by number in the
accessible record, though their content (field floor restored; desktop delta evidenced as none)
matches those objectives' evident intent. Five commits landed unsquashed
(`a6e2288`, `bc96dca`, `4596105`, `d6b47d5`, `36454da4`), confirmed via `git log --oneline`.

Of the nine gates, this report can confirm two by identity and result (G-3: boundary holds at
640/641px per R4 §0; G-9: all seven watchlist items checked against `36454da4`, none found
outstanding — see §2.4). The remaining seven gates' identities are not available to this session
and are recorded as not found rather than guessed, per §2.4.

**Report complete: §2.1 through §2.8, present in order.**

**One surviving open question, belonging to someone else — not this report's to resolve:** the
9-vs-24 information architecture disagreement (§2.7) remains open. It is a product decision, it
has never been in engineering scope, and per R4 §4/§6 it does not block this workstream's closure.
It is named here, as R4 requires, and left there.
