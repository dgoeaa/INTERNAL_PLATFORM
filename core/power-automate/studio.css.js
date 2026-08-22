// The studio's stylesheet, shipped with the module that renders it.
//
// It lives here rather than in each surface's stylesheet for the same reason the markup does:
// two copies drift, and a drifted copy shows up as a control that is unreachable in one
// place and fine in the other. modules/flow-studio.js and tools/flow-studio.html each style
// only their own chrome — the shell, the toast, the dialog — and this styles the studio.
//
// Colours are taken from the host's tokens with fallbacks, so the platform's light/dark/
// high-contrast themes drive it for free, and the standalone page's own tokens drive it
// there. Nothing here hard-codes a colour that only works on one ground.

export const STUDIO_CSS = `
.fs-app{
  --fs-bg:var(--bg,#f4f7f5);
  --fs-surface:var(--s,#fff);
  --fs-sunken:var(--sunken,#eef2ef);
  --fs-fg:var(--fg,#25302b);
  --fs-strong:var(--strong,#0d1f18);
  --fs-mut:var(--mut,#66736c);
  --fs-bd:var(--bd,#dde7e1);
  --fs-accent:var(--a,#17B255);
  --fs-primary:var(--p,#05583B);
  --fs-danger:var(--danger,#a5122c);
  --fs-warn:var(--warn,#8a6100);
  --fs-info:var(--info,#054871);
  --fs-mono:var(--dgo-family-mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);

  display:flex;flex-direction:column;height:100%;min-height:32rem;min-width:0;
  background:var(--fs-bg);color:var(--fs-fg);
  font-size:13px;line-height:1.5;
}
.fs-app *{box-sizing:border-box}
.fs-app button{font:inherit;color:inherit;cursor:pointer}
.fs-app input,.fs-app select,.fs-app textarea{
  width:100%;font:inherit;color:var(--fs-fg);background:var(--fs-surface);
  border:1px solid var(--fs-bd);border-radius:5px;padding:6px 8px;min-width:0;
}
.fs-app textarea{font-family:var(--fs-mono);font-size:11.5px;line-height:1.55;resize:vertical}
.fs-app :focus-visible{outline:2px solid var(--fs-accent);outline-offset:1px}
.fs-app code{font-family:var(--fs-mono);font-size:.92em}

/* ── header ─────────────────────────────────────────────────────────────────────── */
.fs-top{
  display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;
  padding:10px 14px;border-bottom:1px solid var(--fs-bd);background:var(--fs-surface);flex:0 0 auto;
}
.fs-top__eyebrow{font:700 9px/1 var(--sans,inherit);letter-spacing:.14em;text-transform:uppercase;color:var(--fs-accent)}
.fs-top h1{margin:2px 0 0;font-size:17px;line-height:1.1;color:var(--fs-strong)}
.fs-status{display:flex;align-items:center;gap:14px;font-size:11px;color:var(--fs-mut)}
.fs-status b{color:var(--fs-strong);font-size:13px;font-variant-numeric:tabular-nums}
.fs-status .is-bad b{color:var(--fs-danger)}
.fs-status .is-ok b{color:var(--fs-accent)}
.fs-saved{color:var(--fs-accent);font-weight:700}
.fs-saved[hidden]{display:none}

/* ── body: plan column + working column ─────────────────────────────────────────── */
.fs-body{display:grid;grid-template-columns:20rem minmax(0,1fr);flex:1 1 auto;min-height:0}
@media(max-width:900px){.fs-body{grid-template-columns:1fr;overflow:auto}}

.fs-plan{
  display:flex;flex-direction:column;min-height:0;min-width:0;
  border-right:1px solid var(--fs-bd);background:var(--fs-surface);
}
.fs-plan__bar{display:flex;gap:6px;align-items:center;padding:8px 10px;border-bottom:1px solid var(--fs-bd)}
.fs-planname{font-weight:700}
.fs-plan__tools{display:flex;gap:2px;flex:0 0 auto}
/* Stacked, not side by side: two selects sharing a 20rem column truncated both labels,
   and an endpoint key is exactly the kind of string you must be able to read in full. */
.fs-plan__blueprint{display:grid;gap:5px;padding:8px 10px;border-bottom:1px solid var(--fs-bd)}
.fs-plan__blueprint select{text-overflow:ellipsis}
.fs-tree{flex:1 1 auto;overflow-y:auto;padding:6px 8px 14px;min-height:0}
.fs-plan__foot{
  display:flex;flex-wrap:wrap;gap:5px;padding:8px 10px;border-top:1px solid var(--fs-bd);flex:0 0 auto;
}

/* ── tree rows ──────────────────────────────────────────────────────────────────── */
.fs-item{
  display:flex;align-items:flex-start;justify-content:space-between;gap:6px;
  border:1px solid transparent;border-radius:6px;padding:5px 6px;cursor:pointer;
  background:transparent;
}
.fs-item:hover{background:var(--fs-sunken)}
.fs-item.is-selected{background:var(--fs-sunken);border-color:var(--fs-accent);box-shadow:inset 3px 0 0 var(--fs-accent)}
.fs-item.is-dragging{opacity:.4}
.fs-item.is-dropbefore{box-shadow:0 -2px 0 var(--fs-accent)}
.fs-item.is-dropafter{box-shadow:0 2px 0 var(--fs-accent)}
.fs-item--trigger{border-style:dashed;border-color:var(--fs-bd);margin-bottom:4px}
.fs-item__main{display:flex;align-items:flex-start;gap:4px;min-width:0;flex:1 1 auto}
.fs-item__text{display:flex;flex-direction:column;min-width:0}
.fs-item__name{font-weight:700;color:var(--fs-strong);overflow-wrap:anywhere}
.fs-item__meta{font-size:10.5px;color:var(--fs-mut);overflow-wrap:anywhere}
.fs-item__tools{display:flex;gap:1px;opacity:0;flex:0 0 auto;transition:opacity .12s}
.fs-item:hover .fs-item__tools,.fs-item:focus-within .fs-item__tools,.fs-item.is-selected .fs-item__tools{opacity:1}
@media(hover:none){.fs-item__tools{opacity:1}}

.fs-twist{
  background:none;border:0;padding:0;width:14px;height:18px;line-height:18px;
  color:var(--fs-mut);transition:transform .12s;flex:0 0 auto;text-align:center;
}
.fs-twist.is-open{transform:rotate(90deg)}
.fs-twist--none{visibility:hidden}

.fs-x{
  background:none;border:1px solid transparent;border-radius:4px;
  width:22px;height:22px;line-height:1;padding:0;color:var(--fs-mut);font-size:12px;
}
.fs-x:hover{background:var(--fs-surface);border-color:var(--fs-bd);color:var(--fs-strong)}
.fs-x:disabled{opacity:.3;cursor:not-allowed}
.fs-x--danger:hover{color:var(--fs-danger);border-color:var(--fs-danger)}

/* The insertion point. Every one of these knows exactly which list and index it targets,
   which is what removes the old "set a target in a dropdown, then press Add" mode error. */
.fs-insert{
  display:block;width:100%;height:14px;padding:0;margin:1px 0;
  background:none;border:0;border-radius:3px;color:transparent;line-height:1;
  position:relative;
}
.fs-insert::before{
  content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:var(--fs-bd);opacity:0;transition:opacity .12s;
}
.fs-insert span{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:16px;height:16px;border-radius:50%;line-height:15px;font-size:12px;
  background:var(--fs-accent);color:var(--fs-surface);opacity:0;transition:opacity .12s;
}
.fs-insert:hover::before,.fs-insert:focus-visible::before,
.fs-insert:hover span,.fs-insert:focus-visible span{opacity:1}
@media(hover:none){.fs-insert::before,.fs-insert span{opacity:.55}}

.fs-branch{margin:2px 0 2px 12px;padding-left:8px;border-left:2px solid var(--fs-bd)}
.fs-branch__label{
  font:700 9.5px/1.6 var(--sans,inherit);letter-spacing:.09em;text-transform:uppercase;color:var(--fs-mut);
}
.fs-branch__empty{font-size:10.5px;color:var(--fs-mut);font-style:italic;padding:1px 0}
.fs-blank{text-align:center;padding:18px 8px;color:var(--fs-mut)}
.fs-blank p{margin:0 0 6px}

/* ── working column ─────────────────────────────────────────────────────────────── */
.fs-work{display:grid;grid-template-rows:minmax(0,1fr) auto;min-height:0;min-width:0}
.fs-work__scroll{overflow-y:auto;min-height:0;padding:14px}
.fs-work__out{border-top:1px solid var(--fs-bd);background:var(--fs-surface);flex:0 0 auto}

.fs-pane{max-width:52rem}
.fs-pane__head{margin-bottom:12px}
.fs-pane__kicker{font:700 9.5px/1 var(--sans,inherit);letter-spacing:.12em;text-transform:uppercase;color:var(--fs-accent)}
.fs-pane h2{margin:4px 0 3px;font-size:17px;color:var(--fs-strong);overflow-wrap:anywhere}
.fs-help{display:block;font-size:11px;color:var(--fs-mut);line-height:1.45}

.fs-form{display:flex;flex-direction:column;gap:11px}
.fs-field{display:flex;flex-direction:column;gap:4px;min-width:0}
.fs-label{display:flex;align-items:baseline;gap:6px;font-weight:700;font-size:11.5px;color:var(--fs-strong)}
.fs-req{font:700 8.5px/1 var(--sans,inherit);letter-spacing:.08em;text-transform:uppercase;color:var(--fs-danger)}
.fs-check{display:flex;align-items:center;gap:6px;font-weight:600;font-size:12px}
.fs-check input{width:auto}
.fs-statuses{display:flex;flex-wrap:wrap;gap:10px}

.fs-repeat{display:flex;flex-direction:column;gap:4px}
.fs-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,9rem),1fr)) auto;gap:4px;align-items:center}
.fs-addrow{
  align-self:flex-start;background:none;border:1px dashed var(--fs-bd);border-radius:5px;
  padding:4px 9px;font-size:11px;color:var(--fs-mut);
}
.fs-addrow:hover{border-color:var(--fs-accent);color:var(--fs-accent)}

.fs-ordering{border:1px solid var(--fs-bd);border-radius:6px;padding:7px 9px;background:var(--fs-sunken)}
.fs-ordering summary{cursor:pointer;font-size:11.5px;color:var(--fs-mut)}
.fs-ordering summary b{color:var(--fs-strong)}
.fs-ordering>*+*{margin-top:9px}

.fs-sampler{border:1px solid var(--fs-bd);border-radius:5px;padding:7px 9px;background:var(--fs-sunken)}
.fs-sampler summary{cursor:pointer;font-weight:700;font-size:11px}
.fs-sampler textarea{margin:6px 0}

/* Token chips travel to whichever field has focus rather than sitting in one fixed place. */
.fs-tokens{display:flex;flex-wrap:wrap;gap:4px;margin:2px 0 4px}
.fs-tokens[hidden]{display:none}
.fs-token{
  background:var(--fs-sunken);border:1px solid var(--fs-bd);border-radius:99px;
  padding:2px 9px;font-size:10.5px;color:var(--fs-fg);
}
.fs-token:hover{border-color:var(--fs-accent);color:var(--fs-accent)}

/* ── buttons ────────────────────────────────────────────────────────────────────── */
.fs-btn{
  border:1px solid var(--fs-bd);background:var(--fs-surface);color:var(--fs-fg);
  border-radius:5px;padding:6px 12px;font-weight:700;font-size:11.5px;white-space:nowrap;
}
.fs-btn:hover{border-color:var(--fs-accent)}
.fs-btn--primary{background:var(--fs-primary);border-color:var(--fs-primary);color:#fff}
.fs-btn--primary:hover{filter:brightness(1.12)}
.fs-btn--primary.is-done{background:var(--fs-accent);border-color:var(--fs-accent)}
.fs-btn--ghost{background:transparent}
.fs-btn.is-on{border-color:var(--fs-accent);color:var(--fs-accent)}

/* ── output, pinned so Copy is never below the fold ─────────────────────────────── */
.fs-out{padding:10px 14px 12px;display:flex;flex-direction:column;gap:8px;max-height:46vh;overflow-y:auto}
.fs-out__head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.fs-out__title{font:700 9.5px/1 var(--sans,inherit);letter-spacing:.12em;text-transform:uppercase;color:var(--fs-accent)}
.fs-out__mode{font-size:11px;color:var(--fs-mut)}
.fs-out__blocked{margin:0;font-size:12px;color:var(--fs-mut)}
.fs-part{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.fs-part__name{font-family:var(--fs-mono);font-size:10.5px;color:var(--fs-mut);overflow-wrap:anywhere}
.fs-out__second{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-top:2px}
.fs-out__second .fs-help{max-width:34rem}
.fs-json{width:100%;white-space:pre;overflow:auto;background:var(--fs-sunken)}
.fs-json[hidden]{display:none}

.fs-alert{
  border:1px solid var(--fs-danger);border-left-width:3px;border-radius:5px;
  padding:7px 10px;font-size:11.5px;background:var(--fs-sunken);
}

.fs-find{border:1px solid var(--fs-bd);border-left-width:3px;border-radius:5px;padding:6px 10px;background:var(--fs-sunken)}
.fs-find summary{cursor:pointer;font-weight:700;font-size:11.5px;color:var(--fs-strong)}
.fs-find ul{margin:5px 0 0;padding-left:17px}
.fs-find li{font-size:11.5px;line-height:1.5;margin-bottom:3px}
.fs-find--error{border-left-color:var(--fs-danger)}
.fs-find--warning,.fs-find--warn{border-left-color:var(--fs-warn)}
.fs-find--note{border-left-color:var(--fs-info)}
.fs-find--ok{border-left-color:var(--fs-accent)}
.fs-count{
  display:inline-block;min-width:1.15rem;text-align:center;border-radius:99px;
  background:var(--fs-bd);color:var(--fs-strong);font-size:10px;padding:0 5px;font-variant-numeric:tabular-nums;
}

/* ── the palette: the catalog, anchored to the + you pressed ────────────────────── */
.fs-palette-wrap{
  position:fixed;inset:0;z-index:120;background:#0b1a1455;
  display:flex;align-items:flex-start;justify-content:center;padding:8vh 1rem 1rem;
}
.fs-palette{
  width:min(34rem,100%);max-height:70vh;display:flex;flex-direction:column;
  background:var(--fs-surface);border:1px solid var(--fs-bd);border-radius:9px;
  box-shadow:0 24px 64px #0b1a1440;overflow:hidden;
}
.fs-palette__q{border:0;border-bottom:1px solid var(--fs-bd);border-radius:0;padding:11px 13px;font-size:14px}
.fs-palette__q:focus-visible{outline-offset:-2px}
.fs-palette__list{overflow-y:auto;padding:4px}
.fs-palette__item{
  display:grid;grid-template-columns:1fr auto;gap:1px 8px;width:100%;text-align:left;
  background:none;border:0;border-radius:6px;padding:7px 9px;
}
.fs-palette__item.is-active{background:var(--fs-sunken);box-shadow:inset 2px 0 0 var(--fs-accent)}
.fs-palette__name{font-weight:700;color:var(--fs-strong)}
.fs-palette__group{font-size:10px;color:var(--fs-mut);justify-self:end;white-space:nowrap}
.fs-palette__sum{grid-column:1/-1;font-size:11px;color:var(--fs-mut)}
.fs-palette__none{padding:14px}
.fs-palette__foot{
  border-top:1px solid var(--fs-bd);padding:6px 12px;font-size:10.5px;color:var(--fs-mut);
  display:flex;gap:5px;align-items:center;flex-wrap:wrap;
}
.fs-palette__foot kbd{
  font-family:var(--fs-mono);font-size:9.5px;border:1px solid var(--fs-bd);border-radius:3px;
  padding:0 4px;background:var(--fs-sunken);
}

@media (prefers-reduced-motion:reduce){.fs-app *{transition:none!important}}
`;

/** Inject once per document. Idempotent, so a remount does not stack copies. */
export function installStudioStyles(doc = document) {
  if (doc.getElementById('fs-studio-styles')) return;
  const style = doc.createElement('style');
  style.id = 'fs-studio-styles';
  style.textContent = STUDIO_CSS;
  doc.head.appendChild(style);
}
