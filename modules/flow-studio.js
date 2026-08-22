// Flow Studio, inside the DGO shell.
//
// The screen itself lives in core/power-automate/studio.js and is shared with the standalone
// page at tools/flow-studio.html. This file exists only to say what "toast", "confirm",
// "view state" and "storage" mean here — everything else would be a second copy of a fiddly
// screen, and a second copy diverges.

import { hydrateGovernance } from '../core/governed-actions.js';
import { esc, toast, confirmAction, emptyState } from '../core/ui.js';
import { UIState } from '../core/ui-state.js';
import { createStudio } from '../core/power-automate/studio.js';

const studio = createStudio({
  esc,
  emptyState,
  toast,
  confirm: confirmAction,
  // UIState is the platform's per-route view state: in memory, cleared with the session.
  getState: defaults => UIState.get('flow-studio', defaults),
  setState: patch => UIState.set('flow-studio', patch),
  // The plan outlives the session, so it goes to localStorage. Nothing in it leaves the
  // browser — a plan is a draft of a flow, not platform data, and has no server side.
  storage: {
    get: key => localStorage.getItem(key),
    set: (key, value) => localStorage.setItem(key, value)
  }
});

export async function mount(el) {
  hydrateGovernance();
  studio.mount(el);
}
