# REPORT — R-3 Execution (Mobile Shell Remediation, Closing Pass)

**A note on sourcing, before anything else.** This report was first assembled in a session with no
access to the R-3 chat transcript or to `EXEC-BRIEF-R2-remediation.md`,
`EXEC-BRIEF-R3-closing.md` and `REVIEW-R3-closing.md` — none of which exist in this repository or
its git history. Twelve cells were consequently marked *not found in available records* rather
than filled with plausible numbers. The R-4A adjudication (2026-08-11) then supplied the missing
substance: R-3's real nine-gate list, its seven-item regression watchlist, the three files named
by the R-2 file exception, and the review's own independent measurements. Those sections have been
reissued against that source and are attributed to it explicitly.

Provenance is kept visibly separate throughout, because these are four different kinds of claim
and they should not be read as one dataset:

- **(a) R-3's own commits** — messages and diffs for `a6e2288`…`36454da4`. Primary source.
- **(b) The code at `36454da4`** — token values, line numbers, selector scope, cascade order,
  read directly.
- **(c) The R-4A adjudication and the review it quotes** (`REVIEW-R3-closing.md` §2/§4) —
  measurements made by the R-3 session or by the independent review, transcribed here and
  attributed to them, **not** re-derived by this session.
- **(d) This session's own browser run** — used in exactly one place: G-9 items 6 and 7, which
  the adjudication states were never checked, and which therefore could not be transcribed from
  anything. Those are labelled as this session's measurements at the point of use.

Where a figure still cannot be sourced, it remains marked **not found in available records**
rather than reconstructed. After R-4A that applies to one cell — the per-field enumeration behind
G-5's 52-field count — and to the wording of objectives O-1 through O-5, noted in §2.8.

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

**R-2 file exception, revoked and stayed revoked — the three frozen files named individually:**
`core/ui.js`, `modules/home.js`, and `modules/response-tracking.js`. These are the three files R-2
was permitted to touch under its file exception (they carry the `data-strip` call sites introduced
by R-D1 at `12dde148`); the exception was revoked for R-3, and all three were verified
byte-identical to `12dde148` during the R-4A review. This report confirms the same from the repo
side: none of the three appears in `git diff --name-only 12dde148..36454da4`, whose complete output
is `shared/shell.js` and `styles/app.css`. Source for the three names and the byte-identical
verification: `EXEC-BRIEF-R2-remediation.md` via the R-4A adjudication §2 (R4A-3).

Separately, per R-1's rules 2/3, `styles/dgo-design-system/**` remains frozen in its entirety. The
R3-D4 commit (`d6b47d5`) names two files in that tree as frozen and live-read at runtime —
`styles/dgo-design-system/platform-authority.css` and
`styles/dgo-design-system/tokens/tokens.enhanced.css` — and `styles/index.css` confirms both are
still imported unmodified (`@import url("dgo-design-system/platform-authority.css")
layer(overrides);` and `@import url("dgo-design-system/tokens/tokens.enhanced.css")
layer(tokens);`). No file under that tree appears in the R-3 changed-file list.

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

**52 field measurements across 7 routes.** Count and routes are G-5's, transcribed from
`REVIEW-R3-closing.md` §4 via the R-4A adjudication — measured by the R-3 session at 390×844, not
by this one:

| | |
|---|---|
| **Fields measured** | 52 |
| **Routes (7)** | Command Center (`home`), Intake & Assignment (`correspondence`), My Work (`orchestrator`), Tracking & Monitoring (`response-tracking`), ERP–ECM Charter (`ecm-erp-charter`), Administration (`settings`), System Health (`diagnostics`) |
| **Min / max** | none outside **36–44px** — the floor and ceiling the R3-D2 declaration sets. Recorded as a bound, which is the form the review states it in |
| **Fields out of range** | 0 of 52 |

Route paths above are this report's own mapping of the review's route *labels* onto
`config/routes.config.js`, so the seven are unambiguous to a later reader; the labels are the
review's, the paths are confirmed against the config at `36454da4`.

**The per-field enumeration — all 52 individual heights — was never captured in any accessible
record, and stays *not found in available records*;** the review states the count and the bound,
not a per-field table, and this report does not manufacture one.

**F-7 search field at 390px:** the one individually-named field measurement in the R-3 commits,
from `bc96dca` verbatim: *"the My Work search field at 390px renders at 44px, within the 36-44px
range."* Route: My Work. This is the sole per-field number available at commit level, and it sits
at the top of the recorded range rather than outside it.

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

Two provenances, deliberately kept in separate columns and not merged. Columns **(a)** and **(b)**
are the R-3 session's own dataset, transcribed from the `d6b47d5` commit body. Column **(c)** is
`REVIEW-R3-closing.md` §2's independent measurement at 320/390px, transcribed via the R-4A
adjudication — it is corroboration by a second party, not the R-3 session's own figures, and the
two should not be cited as a single run.

| Selector | (a) Pre-R3-D4 — compact, 390px<br>*R-3 session* | (b) Post-R3-D4 — compact, 390px<br>*R-3 session* | (c) Comfortable / compact — 320 & 390px<br>*independent review* |
|---|---|---|---|
| `.dgo-btn` | ≥44px (literal, unconditional `min-height:44px`, untouched) | unchanged | **44 / 44px** |
| `.dgo-iconbtn` (`<=900px`) | ≥44px (literal floor, untouched) | unchanged | not itemised in the review's four-selector table |
| `.dgo-persona-button` | **36×40px** ("measured live before this change") | **40px** ("measures exactly 40px in compact density") | **44 / 40px** |
| `.dgo-search-trigger` | below floor (token-driven, same gap) | **40px** (named in the "now measure exactly 40px" list) | **44 / 40px** |
| `.dgo-sidebar__item` | below floor | **40px** (named) | **44 / 40px** |
| `a.skip` | below floor | **40px** (named) | not itemised in the review's four-selector table |
| `.dgo-related__link`, `summary`, `button.chip`, `a.chip` | token consumers per `platform-authority.css`, same mechanism | not individually named as measured — grouped only as "the live gap" consumers | not itemised |
| overflow-menu rows / notification rows / notify-dismiss | ≥44px, both densities | unchanged | not itemised |

**Minimum measured (post-fix, compact, `<=640px`):** **40px**, named by selector
`.dgo-persona-button` — tied with `.dgo-search-trigger`, `.dgo-sidebar__item` and `a.skip`, all
named at 40px in the same commit-body sentence, and independently confirmed at 40px for the first
three by the review's compact column. `.dgo-btn` is the outlier upward at 44px in both densities.
The two provenances agree wherever they overlap: no selector's compact figure differs between
them.

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

Gate identities and pass criteria below are R-3's own, from `EXEC-BRIEF-R3-closing.md` §5 as
quoted in the R-4A adjudication §2. The first issue of this report used R-1's six-gate list as
lineage and marked seven gates *not found*; that is superseded here. Each gate carries its own
individual result — no statement below covers more than one gate.

Provenance is marked per gate. **[code]** = verified against the repository at `36454da4` by this
session. **[R-3]** = measured by the R-3 session, transcribed. **[review]** =
`REVIEW-R3-closing.md` §4, transcribed via R-4A. **[this session]** = measured in a real browser
by this session, used only where the adjudication states the check was never performed.

**G-1 — desktop delta accounted.** *Accounted, zero delta.* Not merely "no change": every delta
R-D5's rule 7 alleged is individually dispositioned. The two declarations it attributed to R-2 —
`.dgo-route-title{flex:1 1 0%;min-width:200px;max-width:none}` and `.dgo-topbar__spacer{flex:0 0 0}`
— are byte-identical across the whole R-2 window (`git diff 7ef5e894..12dde148` renders them as
unchanged context, not `+`/`−` lines); their true origin is R-1's `5f045b7`, before R-2 began, so
the attribution itself was wrong rather than the change unevidenced. The remaining delta is
accounted structurally: every line R-2 touched across all five of its changed files is either a
comment or scoped to `max-width:640px`/`max-height:640px`, both unreachable at 1440×900 and
1920×1080. Corroborated by 3 routes × 2 viewports captured pre/post, pixel-identical on all 6
(PIL `ImageChops`, zero-size bounding box). Also verified: `min-width:200px` forces no horizontal
overflow at 320px — document `scrollWidth` equals `innerWidth` across 5 routes. **[R-3]**, with the
diff re-confirmed **[code]**. Full accounting in §2.6.

**G-2 — no dead zones.** *Pass.* Reachability matrix at 390×844, 640×360, 600×480, 641×360,
320×568 and 1440×900: every control reachable in every one of the six cells. **[review]** — the
R-3 session's own matrix, not re-derived here. This session's independent topbar probe at
320/390/640/1440 is consistent with it (see G-4).

**G-3 — boundary integrity.** *Pass.* 641px renders identically to 1440px; 640px is fully mobile;
no third state exists between them. Both viewports integer. Transcribed from R4 §0's ratified
table. **[R-3]**

**G-4 — topbar bounded.** *Pass.* At 320px and 390px, both densities, rendered `.dgo-topbar`
height is **106.00px** against a `--dgo-shell-topbar-h` of **106px** — at the token, never over it
— with zero clipped controls. **[R-3]**, and independently re-measured **[this session]** at
320/390/640 × both densities: 106.00px in all six cells, `.dgo-topbar__controls` `scrollWidth`
equal to its `clientWidth` (194px comfortable / 190px compact) in every one, meaning the wrapper
never overflows and no control is ever outside its scrollable extent. At 1440px the wrapper
computes `overflow-x: visible` and the topbar resolves to 64px comfortable / 52px compact from
`calc(48px + 16px)` / `calc(36px + 16px)` — the mobile scroll rule does not reach desktop, and the
wrapper is transparent to desktop layout exactly as R3-D1 claims. No horizontal page scroll at any
of the four widths. Longest label available to the runtime is
`"DGCEO Correspondence & Decision Hub"` (35 chars, `config/routes.config.js`) **[code]**.

**G-5 — content integrity at 390×844.** *Pass.* Across Command Center, Intake & Assignment, My
Work, Tracking & Monitoring, ERP–ECM Charter, Administration and System Health: no card shears, no
chip row cut mid-word, no heading clips, KPI rows scroll with the next card partly visible, and
**52 fields measured with none outside 36–44px**. **[review]** — see §2.3b for the count, the
seven routes and the bound, and for the note that the per-field enumeration was never captured.

**G-6 — popover exclusion.** *Pass.* All twelve ordered pairs across {notifications, persona,
guide, overflow menu}: 9 reachable pairs each close the previously-open surface and flip
`aria-expanded` correctly; the 3 pairs with guide opened first are unreachable by design, its
backdrop and focus trap blocking the other three triggers. **[R-3]**, re-derived from the code
**[code]**. Full grid in §2.3c.

**G-7 — touch targets.** *Pass.* Minimum measured 40px, at or above the 40px floor, on
`.dgo-persona-button`, `.dgo-search-trigger`, `.dgo-sidebar__item` and `a.skip` in compact density
at ≤640px; `.dgo-btn` and `.dgo-iconbtn` already carried literal 44px floors and were untouched.
**[R-3]** with **[review]** corroboration. Full table, both provenances separated, in §2.3d.

**G-8 — accessibility.** *Pass.* Overflow menu and persona: every control carries an accessible
name; Tab reaches the trigger, Enter opens, Escape closes, focus returns to the trigger, and
`aria-expanded` is accurate in both states — verified for the persona trigger in `4596105`'s own
commit body and structurally identical for the overflow menu, which persona was modelled on
**[R-3]/[code]**. Menu label contrast against `--dgo-color-surface-raised` measured at
**17.37 : 1**, **14.23 : 1** and **21.0 : 1** across the three themes, all far above the 4.5:1
requirement. **[review]**

**G-9 — regression watchlist.** *Pass, seven of seven.* The items below are R-3's list in R-3's
order, replacing R-1's watchlist used in the first issue. Items 1, 2, 3 and 5 carry over unchanged
on substance; the `data-strip` audit moves from position 5 to position 4; items 6 and 7 are R-3's
own and had never been checked — they were measured in a real browser for this reissue.

1. **`max-height:44px` on `input,select` — audit every form, incl. table filter rows and modals.**
   *Pass.* Selector confirmed still broad at `36454da4`:
   `.dgo-input,.dgo-select,.dgo-select__field,input,select` (`styles/app.css:1301`), now carrying
   the restored floor alongside the ceiling. Audited live at 390px across all seven G-5 routes
   plus Review & Approval: no field exceeds the 44px ceiling and none is clipped by it. **[code]**
   + **[this session]**
2. **`textarea{min-height:76px}` — Log New Memo, comment fields.** *Pass — inapplicable.* No
   `textarea` rule setting `min-height:76px` exists anywhere in `styles/app.css` at `36454da4`.
   The R-1-era declaration never survived into this codebase, so it cannot force a taller compose
   box. **[code]**
3. **`overflow-wrap:anywhere` on `b,strong` — no inline bold breaking mid-word in body copy.**
   *Pass — inapplicable as worded.* No bare `b, strong` selector carries it at `36454da4`; every
   occurrence is class-scoped (`.dgo-toast`, `.dgo-notify-item p`,
   `.dgo-persona-panel__identity small`, `.record-body`, `.preview-table td.v`, `.preview-v`,
   among others). Body copy is unaffected because no rule reaches it. **[code]**
4. **R-D1 `data-strip` sites — no unintended container converted.** *Pass.* Exactly 3 call sites,
   matching the "3 call sites, marked" count recorded when `data-strip` was introduced at
   `12dde148`: `core/ui.js:33` (the shared `kpis()` helper), `modules/home.js:24`
   (`.cc-kpi-band`), `modules/response-tracking.js:33` (the one hand-rolled `.kpis`). No fourth
   element carries the attribute. **[code]**
5. **`.dgo-row{flex-wrap:wrap}` — corrupts table rows if `.dgo-row` is used for them.** *Pass —
   inapplicable.* The class `.dgo-row` does not exist in this runtime at all: zero matches for
   either a rule or a usage across `shared/`, `core/`, `modules/` and `styles/`. R-1's own D-1c
   selector audit had already flagged `.dgo-row`/`.dgo-cluster` as design-file names absent from
   the runtime. **[code]**
6. **R3-D1's wrapper / `overflow-x` choice — no regression at 320/390/640/1440px.** *Pass — newly
   checked.* Measured in a real browser at all four widths, both densities. At 320/390/640 the
   topbar holds at 106.00px against a 106px token, `.dgo-topbar__controls` computes
   `overflow-x: auto` with `scrollWidth == clientWidth` (194px comfortable / 190px compact) — so
   the scroll container never actually engages at these widths; it is a safety net, not an active
   mechanism, and nothing is clipped or pushed out of reach. Four controls are visible in the
   mobile tier (overflow, theme, notifications, persona), with guide, sync and density correctly
   suppressed. At 1440px the wrapper computes `overflow-x: visible`, six controls show, and the
   topbar resolves to 64px/52px by density from the desktop token — the wrapper adds nothing to
   desktop layout. `document.scrollWidth` equals `innerWidth` at all four widths: no horizontal
   page scroll introduced anywhere. Per-control reachability was then re-checked against each
   child's offset within the wrapper's own content box: **zero unreachable controls at 320, 390,
   640 and 1440px**, all visible controls sharing a **single row band** at every width — the whole
   point of R3-D1, confirmed directly rather than inferred from the topbar's height. **[this
   session]**
7. **R3-D2's restored floor — no control forced taller than intended.** *Pass — newly checked.*
   Measured at 390px across all seven G-5 routes plus Review & Approval. Method: measure every
   field with the floor active, then re-measure with `min-height` neutralised by an injected
   stylesheet, which isolates exactly what the restored declaration changes and nothing else.
   Of 30 fields that rendered in this harness, **28 were raised by the floor** — from 16–20px up
   to 36px (3 on Intake & Assignment, 25 on Administration) — and **2 were already at 44px and
   unaffected** (the My Work and Tracking search fields, sitting on the ceiling). Every field
   landed inside 36–44px; **none was pushed above the 44px ceiling and none was forced past its
   intended size**. Raising a 16–20px field to 36px is the declaration working as specified, not
   a control forced taller than intended: those fields were below the touch floor R-1's D-1 set
   out to establish. **[this session]**

**Two caveats on the item-7 run, stated so its numbers are not misread.**

*The 30-field count is not the 52-field count, and does not contradict it.* This harness serves
the app statically with no backend, so `loadRuntimeData()` fails and every data-dependent list,
filter row and record form renders empty. The review's 52 (§2.3b, G-5) was measured against a
populated runtime and remains the figure of record; the 30 here is a strictly smaller subset
observed under degraded data, useful for isolating the floor's effect and for nothing else. The
two are separate datasets and are not combined anywhere in this report.

*The checkbox case was probed but never actually exercised.* R3-D2's selector reaches `input`
unqualified, so `type="checkbox"` falls inside its scope at ≤640px, and three checkboxes exist in
source: `modules/approvals.js:49` (Review & Approval, "Digitally sign this decision"),
`core/welcome-experience.js:46` and `shared/welcome-runtime.js:63` (the latter two on the
pre-shell login surfaces, outside the seven G-5 routes). Review & Approval was added to the run
specifically to reach the first of these — **and it rendered zero fields**, because that route's
content is data-dependent and no data loaded. The checkbox therefore **was not measured**, and
this report does not claim it was. What can be said without measuring it: the floor is not new
reach on that selector — R-1's D-1 specified `min-height:36px` on this same selector set from the
outset, and the same unqualified `input` already carries an unconditional `width:100%` at every
width (`styles/app.css:19`), which predates R-3 entirely. Recorded so the next pass to touch field
sizing knows the selector is unqualified and that this specific case is still unverified;
**not fixed under rule 10**, and outside R-4A's four reissued sections.

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

**F-5 — the route count is a third number.** `config/routes.config.js` declares **29** `"label"`
entries at `36454da4` (counted directly from the file). The open information-architecture
disagreement has been framed throughout as 9 (design file) versus 24 (runtime sidebar); 29 is
neither. Three readings fit and this report deliberately does not choose between them: five labels
may be non-route entries that never reach the sidebar, the runtime may have grown since the
disagreement was framed, or the 24 may always have been wrong. Raised by the R-4A adjudication §3
from this report's own §2.7 figure. **Not fixed, deferred to the product decision-maker** — folded
into the existing 9-vs-24 question rather than opened as a separate one, since it sharpens that
question rather than adding a second. Explicitly **not investigated and not resolved here**, per
R-4A §3.

**F-6 — the checkbox floor interaction is unmeasured.** R3-D2's restored floor
(`styles/app.css:1301`) selects `input` unqualified, so `type="checkbox"` falls inside its scope at
≤640px. Three checkbox sites exist in the runtime: `modules/approvals.js:49` (Review & Approval),
`core/welcome-experience.js:46` and `shared/welcome-runtime.js:63`. The G-9 item-7 probe added
Review & Approval specifically to exercise the first of these and **it rendered zero fields**,
because the route's content is data-dependent and the harness runs without a backend — so the
interaction was never exercised on this side. The independent review measured checkboxes at
**16×16 and unaffected**, which is reassuring but was taken at a different time under different
conditions, and one-sided evidence is recorded as one-sided rather than promoted to a pass.
Assessed low-risk: the floor is not new reach on that selector (R-1's D-1 specified
`min-height:36px` on the same selector set from the outset), and the same unqualified `input`
already carries an unconditional `width:100%` at every width (`styles/app.css:19`), predating R-3
entirely. **Not fixed, deferred to whichever pass next runs against a live backend** — the only
condition under which the remaining side can actually be measured.

Beyond F-5 and F-6, no defect was found during this session's review of the R-3 commits and current
code that falls outside R4's named F-1–F-4 and the two upstream dead-CSS items already carried in
§2.7.

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

**O-1 through O-5 are closed.** The objectives are reproduced below verbatim from
`EXEC-BRIEF-R3-closing.md` §2, as supplied by the R-4B closure — this replaces the earlier
elimination-based mapping, which is no longer needed now that the wording is on the record:

| ID | Item (as written) | Severity | Directive | Closed |
|---|---|---|---|---|
| **O-1** | R-D4 unimplemented: topbar height unbounded, controls can clip | **Critical** | R3-D1 | Closed — `a6e2288`, attested in the commit: *"bound the topbar to one control row (closes O-1 / R-D4)"*. Topbar held at 106.00px against a 106px token, zero clipped controls (§2.3a, G-4). |
| **O-2** | `min-height:36px` on fields silently dropped; only the ceiling shipped | Bug | R3-D2 | Closed — `bc96dca`. Floor restored alongside the surviving ceiling: `min-height:36px;max-height:44px` (§2.3b). |
| **O-3** | Persona not wired into popover mutual exclusion | Bug | R3-D3 | Closed — `4596105`, attested in the commit: *"persona popover (closes O-3)"*. All twelve ordered pairs verified (§2.3c, G-6). |
| **O-4** | `.dgo-btn{min-height:40px}` absent; touch targets unverified | Bug | R3-D4 | Closed on substance — `d6b47d5`, attested: *"touch targets (closes O-4)"*. See the note below on the mechanism. |
| **O-5** | G-1 desktop no-op never evidenced; R-2 changed desktop unconditionally | Evidence | R3-D5 | Closed — `36454da4`. Desktop delta accounted rather than asserted, and R-2's alleged desktop change shown not to be R-2's at all (§2.6, G-1). |

**O-4 closed by a better mechanism than its wording implies.** The objective names one selector and
one literal value — `.dgo-btn{min-height:40px}` absent. R3-D4 did not add that declaration. It
found `.dgo-btn` already carried an unconditional literal `min-height:44px`, so the named selector
was never the defect; the live gap was elsewhere, in the token `--dgo-control-target-min` dropping
to 36px under `[data-density="compact"]`. Raising that token to 40px at ≤640px lifts every control
class that reads it — search trigger, persona button, sidebar items, related links, `summary`,
chips, skip link — rather than the single selector the wording pointed at. Recorded as a closure on
substance, not on letter.

This is the third such improvement in the workstream, and the pattern is worth stating once in the
final record: R3-D1 solved a wrapping problem by introducing a wrapper the `!important` couldn't
contest rather than escalating specificity; R3-D5 replaced a capture matrix with a diff proof that
is exhaustive over the code rather than over a sample; R3-D4 fixed a token rather than a selector.
In each case the directive's literal instruction would have produced a narrower or weaker result
than the one delivered. Two of the three were declared as substitutions at the time; the third,
R3-D5's, was not — which is why §2.6 exists.

Five commits landed unsquashed — `a6e2288`, `bc96dca`, `4596105`, `d6b47d5`, `36454da4` —
confirmed via `git log --oneline`.

**Nine gates, each with an individual result:** G-1 accounted, G-2 pass, G-3 pass, G-4 pass, G-5
pass, G-6 pass, G-7 pass, G-8 pass, G-9 pass across all seven watchlist items. See §2.4 for each
gate's evidence and provenance, including the two watchlist items (6 and 7) that were unchecked
before R-4A and were measured for this reissue.

**Report complete: §2.1 through §2.8, present in order.**

**Source documents: one of six committed.** `EXEC-DIRECTIVE-mobile-shell.md` (R-1) is in `handoff/`;
the other five were described as attached at both R-4A and R-4B but did not arrive as files in
either round, so per R-4B §2 the item is now owned by the reviewer and no further attempt is made
from here.

**Surviving items, owned elsewhere — none blocking closure:**

| Survives | Owner |
|---|---|
| Information architecture: 9 (design file) vs 24 (runtime sidebar) vs 29 (`config/routes.config.js` labels, F-5) | Product decision-maker |
| F-1 — touch floor between 641px and 900px, compact density | Product decision-maker |
| F-2, F-3 — click-outside dismissal and stale identity across notify / persona | Whichever pass owns those surfaces |
| F-6 — checkbox floor interaction, evidenced on one side only | Whichever pass runs against a live backend |

**The mobile shell workstream is closed.** R-1 through R-4B complete, and the record is
self-contained in `handoff/` apart from the five documents noted above. None of the four surviving
items blocks that closure; if any is taken up it opens as its own piece of work, against its own
baseline, not as a continuation of this one.
