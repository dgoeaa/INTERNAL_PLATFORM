# EXECUTION DIRECTIVE — Mobile Shell Remediation

**Target runtime:** `dgoeaa/ECM_DOCS_DEV`, branch `main`
**Baseline of record:** commit `73bb471de8504e47f8…` (snapshot `internalplatform.baseline.json`, 2026-08-09T23:02:02Z)
**Source of truth for values:** `Root Platform - DGO Digital Operations.dc.html` (design file, this project)
**Scope:** application shell + narrow-viewport safety. Two files, one new affordance.
**Authority:** this document is closed. Anything not written here is out of scope.

---

## 0. OPERATING RULES — read before editing

1. **Do not improvise.** Every change below is an exact insertion or an exact find/replace. If a FIND string does not match in the working tree, **stop and report**. Do not fuzzy-match, do not reformat, do not fix unrelated things while in the file.
2. **Two files only:** `styles/app.css` and `shared/shell.js`. A diff touching a third file is a regression — revert it.
3. **`styles/dgo-design-system/**` is frozen.** If a rule seems to belong there, it still goes in `app.css` for this change set.
4. **No token invention.** Use only `--dgo-*` names that already resolve at the baseline commit. New custom properties are permitted only in D-1 and must use the `--bar-*` / `--tb-*` prefix.
5. **Additive CSS.** Do not delete, reorder or re-specify any existing rule in `app.css`.
6. **Desktop is a regression surface.** Every change is a no-op at ≥621px except D-3, which is an explicit desktop bug fix. Verify at 1440px *before* 390px.
7. **One commit per directive**, in order, message `fix(shell): <id> <one line>`. Do not squash.
8. **Halt if:** a FIND fails; a gate in §3 fails; `--topbar` is not defined in `:root`; a named class matches nothing in the runtime.

---

## 1. DEFECT REGISTER

| ID | Observed on mobile | Root cause |
|---|---|---|
| F-1 | Ministry line clipped mid-word | fixed `height:26px` + `white-space:nowrap` + `overflow:hidden` |
| F-2 | Route title ellipsised to "Intake & Assig…" | `nowrap` on a shrink-to-fit flex column |
| F-3 | Guide and Sync controls vanish in portrait | fixed-height topbar, no wrap, no overflow affordance |
| F-4 | KPI chip row cut mid-word | `repeat(n,1fr)` grid narrower than its content |
| F-5 | Toolbar collapses into ragged rows | no `flex-wrap` at control-group level |
| F-6 | Long task titles clip at display size | no `overflow-wrap` on heading elements |
| F-7 | Search field renders ~340px tall | stretching flex parent, field has no height ceiling |

F-2 also manifests at desktop width with ~330px of free space beside the title. That is a live bug in the baseline, not a mobile-tier side effect.

**Explicitly out of scope**, deferred to a later directive: Administration empty-card layout, chip colour contrast, per-screen layouts for My Work and the ERP–ECM charter.

---

## 2. DIRECTIVES

### D-1 — `styles/app.css` — declare the shell tier

**1a.** Locate the `:root` block that defines `--topbar`. Append as the last line before its closing brace. Modify no existing line.

```css
--bar-h:26px; --bar-wrap:nowrap; --bar-pad:0 14px;
--tb-h:var(--topbar); --tb-ctl:inline-flex; --tb-more:none;
```

**1b.** Locate the existing `@media(max-width:760px)` rule that redefines `--kpi`. Append **immediately after it** — cascade order is load-bearing, the 620px tier must be able to override the 760px tier:

```css
/* Mobile shell tier — the ministry line wraps instead of clipping, the route title takes two
   lines, and the controls that no longer fit collapse into one overflow menu. */
@media(max-width:620px){:root{--bar-h:auto;--bar-wrap:normal;--bar-pad:5px 12px;--tb-h:auto;--tb-ctl:none;--tb-more:inline-flex}}
[data-tb-title]{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* Narrow-viewport safety. Fields keep their own height inside a stretching column, toolbars
   wrap as whole controls, and no card shears its content. */
.dgo-input__field,.dgo-select__field,input,select{min-height:36px;max-height:44px}
textarea{min-height:76px}
.dgo-field,.dgo-input{align-self:stretch}
@media(max-width:620px){
.dgo-row,.dgo-cluster{flex-wrap:wrap}
.dgo-btn{min-height:40px}
[data-strip]{flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding-bottom:2px}
[data-strip]::-webkit-scrollbar{display:none}
[data-strip]>*{flex:0 0 auto}
div[data-strip]{grid-auto-flow:column;grid-template-columns:none;grid-auto-columns:minmax(150px,64%)}
}
@media(max-width:620px){b,strong,h1,h2,h3{overflow-wrap:anywhere}
[data-tb-title]{white-space:normal;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;text-overflow:clip}}
```

**1c. Selector audit — perform before committing.** These class names are taken from the design file: `.dgo-input__field`, `.dgo-select__field`, `.dgo-field`, `.dgo-input`, `.dgo-row`, `.dgo-cluster`, `.dgo-btn`. Confirm each exists in `styles/dgo-design-system/components.css` at the baseline commit. For any that does not, substitute the class the runtime actually emits for that role. **Do not ship a rule whose selector matches nothing, and do not invent a class.**

**1d.** The `64%` in `grid-auto-columns` is deliberate: it leaves the next card partly visible so the horizontal-scroll affordance is discoverable. Do not round it to 100%.

---

### D-2 — `shared/shell.js` — ministry bar (fixes F-1)

Locate the element containing the flag device and the string `Federal Ministry of Communications, Innovation & Digital Economy`. Apply five changes to its inline style:

| Find | Replace |
|---|---|
| `height:26px` | `min-height:var(--bar-h)` |
| `padding:0 14px` | `padding:var(--bar-pad)` |
| `white-space:nowrap` | `white-space:var(--bar-wrap)` |
| `overflow:hidden` | *(delete)* |
| `10px/1 Outfit` | `10px/1.35 Outfit` |

On the **ministry-name span** inside it, replace `overflow:hidden;text-overflow:ellipsis` with `min-width:0`.

Do not touch the flag device's `flex:0 0 auto`.

---

### D-3 — `shared/shell.js` — topbar geometry (fixes F-2, incl. the desktop bug)

**3a. The `<header>`:**

| Find | Replace |
|---|---|
| `height:var(--topbar)` | `min-height:var(--topbar);height:var(--tb-h)` |
| `display:flex;align-items:center` | `display:flex;flex-wrap:wrap;align-items:center` |
| `padding:0 12px 0 10px` | `padding:5px 12px 5px 10px` |

**3b. The title column** — the div holding the eyebrow `<small>` and the route-title element. Prepend `flex:1 1 auto;` to its style. **Retain `min-width:0`.** This single declaration is the desktop fix: the column is currently shrink-to-fit, which is why the title ellipsises with free space beside it.

**3c. The route-title element:** add a bare `data-tb-title` attribute. **Remove** its inline `white-space`, `overflow` and `text-overflow` declarations so D-1's rule governs them.

Do not attempt to express the line clamp inline. `-webkit-line-clamp` must vary by media query and cannot be driven from a custom property.

---

### D-4 — `shared/shell.js` — KPI strips (fixes F-4)

Add a bare `data-strip` attribute to each element whose inline style is `display:grid;grid-template-columns:var(--kpi)`.

The design file has exactly **two**. Enumerate the true count in the runtime first and record it in the commit body. Mark no other grid — `data-strip` changes flow direction and will break a grid that was not meant to scroll.

---

### D-5 — `shared/shell.js` — control visibility (part of F-3)

Add `style="display:var(--tb-ctl)"` to exactly two controls: the **workspace-guide** button and the **synchronise** button.

Do **not** apply it to search, notifications, persona, or the nav toggle. Those must remain visible at every width.

---

### D-6 — `shared/shell.js` — overflow menu (completes F-3)

The only directive that adds new code rather than adjusting existing markup. The baseline has no equivalent, so there is nothing to find/replace — build it to this specification exactly.

**6a. Trigger.** Insert a button immediately after the synchronise button, inside the same control cluster:

```html
<button type="button" class="dgo-btn dgo-btn--ghost dgo-btn--sm dgo-btn--icon"
        style="display:var(--tb-more)"
        aria-label="More controls" aria-haspopup="menu" aria-expanded="false"
        title="More controls" data-more-open>
  <svg class="icon-sm" aria-hidden="true"><use href="#i-more"></use></svg>
</button>
```

Confirm `i-more` exists in `assets/icons/sprite.svg`. If the sprite names it differently, use the runtime's name — do not add a symbol.

**6b. State.** One boolean on shell state, `more`, default `false`. It is **mutually exclusive** with the existing `notifs`, `persona` and `guide` flags: opening any one closes the other three. Wire all four ways, not just the new one — a menu left open behind a notification panel is a defect.

**6c. Panel.** Rendered only when `more` is true:

```
position:fixed; top:calc(var(--topbar) + 30px); right:12px;
width:min(268px, calc(100vw - 24px)); z-index:80;
background:var(--dgo-color-surface-raised);
border:1px solid var(--dgo-color-border-default);
border-radius:12px; box-shadow:<existing popover shadow token>; overflow:hidden;
```

Use whatever popover shadow the notification and persona panels already use. Do not introduce a new shadow value. `z-index:80` must sit below the command palette and above the shell — confirm against the runtime's existing layer order and adjust if 80 collides.

**6d. Items.** `role="menu"` on the panel, `role="menuitem"` on each row. Four rows, in this order, each `min-height:44px`:

| Row | Icon | Label | Trailing value | Action |
|---|---|---|---|---|
| 1 | `i-help` | Workspace guide | — | close menu, open guide |
| 2 | `i-refresh` | Synchronise data | `Working` while syncing, else blank | close menu, run the existing sync routine |
| 3 | `i-filter` | Density | current density | close menu, toggle comfortable/compact, persist, toast |
| 4 | `i-eye` | Theme | current theme | close menu, cycle light → dark → hc, persist, toast |

Rows 2–4 must **call the runtime's existing handlers**, not reimplement them. Density and theme already persist and already apply to the document root; duplicating that logic will desynchronise the two paths. If a handler is not reachable from where the menu renders, lift it — do not copy it.

**6e. Trailing value styling:** `font:600 10px/1 Outfit,sans-serif; letter-spacing:.08em; text-transform:uppercase; color:var(--dgo-color-fg-muted); white-space:nowrap`.

**6f. Dismissal.** Escape closes it. A click outside closes it. Focus returns to the trigger on close. `aria-expanded` tracks state.

---

## 3. VERIFICATION GATES

Do not proceed past a failing gate. Do not mark the change set complete until all six pass.

**G-1 — desktop no-op (1440 × 900).** Screenshot every route before and after the full change set. The only permitted pixel difference is the route title in the topbar, which stops ellipsising (D-3b). Any other delta fails the gate.

**G-2 — breakpoint boundary.** At exactly 621px the shell renders as it does at 1440px. At exactly 620px the mobile tier is fully active. No layout state exists between them.

**G-3 — ministry bar (390 × 844).** The full ministry string is readable. No character is clipped at the right edge. The bar has grown in height rather than scrolled.

**G-4 — topbar (390 × 844, portrait and landscape).** Route title shows on up to two lines with no ellipsis on the longest label (`My Work / Departmental Work`). All six controls are reachable: four in the bar, two in the overflow menu. Nothing has silently disappeared.

**G-5 — content integrity.** On Command Center, Intake, My Work, Tracking, ERP–ECM Charter and Administration at 390px: no card shears its content, no chip row cuts mid-word, no search field exceeds 44px in height, no heading clips. KPI rows scroll horizontally with the next card partly visible.

**G-6 — accessibility.** Every control in the overflow menu is ≥40px tall and has an accessible name. Keyboard: Tab reaches the trigger, Enter opens, Escape closes, focus returns. `aria-expanded` is accurate in both states. Contrast of menu label text against `--dgo-color-surface-raised` is ≥4.5:1 in all three themes.

---

## 4. REGRESSION WATCHLIST

Check these specifically — each is a plausible way this change set breaks something that currently works.

1. **`max-height:44px` on `input, select` is broad.** It will hit every input in the runtime, including any inside a table cell, filter row or modal that legitimately renders taller. Audit all forms; scope the selector down if anything is now clipped.
2. **`textarea{min-height:76px}`** may force a taller compose box than the current design intends. Verify Log New Memo and any comment field.
3. **`overflow-wrap:anywhere` on `b, strong`** applies to every bold run at ≤620px, not just titles. Check that no inline bold text inside a paragraph now breaks mid-word unattractively.
4. **`flex-wrap:wrap` on the topbar** allows it to grow unbounded if a route label is very long. Confirm the tallest case is two lines, not three.
5. **`data-strip` on the wrong grid** silently converts it to a horizontal scroller. Verify the count from D-4.
6. **`.dgo-row{flex-wrap:wrap}`** is a broad selector. If `.dgo-row` is used for table rows anywhere, wrapping will corrupt them. Confirm its usage before shipping.
7. **Mutual exclusion (D-6b)** — verify all four popovers, not just the new one. Regression here is easy to miss because it only shows when two are opened in sequence.

---

## 5. WHAT THIS DIRECTIVE DOES NOT AUTHORISE

Listed because each was considered and deliberately excluded:

- Any change to the information architecture. The runtime shows 24 sidebar routes; the design file shows 9. **That disagreement is unresolved and is not settled by this directive.** Do not reduce the sidebar.
- Any change to the status vocabulary, priority scale, or RBAC grants.
- Adding the 19 sprite symbols the design file lacks, or repointing workspace icons.
- Refreshing `styles/dgo-design-system/` from any source.
- The deferred F-items: Administration empty-card layout, chip contrast, per-screen mobile layouts.

---

## 6. REPORTING

On completion, report: the diff of both files; the true `data-strip` count from D-4; any selector substituted under D-1c; any gate that required a second attempt; every item on §4 checked, with its result. If any halt condition fired, report the exact FIND string that failed and stop — do not work around it.
