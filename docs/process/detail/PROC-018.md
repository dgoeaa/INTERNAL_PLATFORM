# PROC-018 — DGCEO Correspondence & Decision Hub

> Generated from `docs/reference/process-inventory.json`. Do not edit.
> Back to the [master inventory](../07-MASTER-PROCESS-INVENTORY.md) · [process detail index](../09-PROCESS-DETAIL.md).

## 5.1 Identity and purpose

| Attribute | Value |
| --- | --- |
| Identifier | PROC-018 |
| Name | DGCEO Correspondence & Decision Hub |
| Alternative or legacy name | Route 'executive' |
| Category | User-initiated · operational |
| Description | Executive review and decision surface for DG/CEO correspondence and exceptions. |
| Description declared in the artifact itself | — |
| Business objective | Executive review and decision surface for DG/CEO correspondence and exceptions. |
| Operational objective | Boundary role 'executive-exception-authority'. Owns executive-approve, executive-return, executive-escalate, request-clarification; must not own routine-approval-queue, task-execution. |
| Process owner | The executive module, per the per-action governance table. |
| Criticality | Not evidenced. No supplied artifact grades a workspace by criticality. |
| Business area / group | CONTROL |
| Related modules | modules/executive.js |
| Related features | executive-approve<br>executive-return<br>executive-escalate<br>request-clarification |
| Evidence classification | Confirmed |
| Evidence note | Declared in the workspace configuration, implemented by a module of the same route name, and bounded by the module boundary charter. |
| Documentation status | Documented in part; named attributes outstanding |
| Validation status | No external validation required |
| Sources | `SRC-036` config/workflow-clarity.config.js<br>`SRC-018` modules/executive.js<br>`SRC-005` config/module-boundaries.config.js |

## 5.2 Participants and responsibilities

| Attribute | Value |
| --- | --- |
| Initiating actor | An operator holding a role with access to this route. |
| Participating roles | systemAdmin<br>executive |
| Accountable owner | The executive module, per the per-action governance table. |
| Supporting systems | DGO Internal Platform<br>Microsoft Power Automate |
| Approval authority | Not evidenced for this process. |
| Escalation authority | Not evidenced for this process. |
| Segregation of duties | Not evidenced. No supplied artifact declares a separation requirement. |

### Responsible actor per step

| Step | Name | Responsible | Kind |
| --- | --- | --- | --- |
| STEP-0029 | Add the minute | executive workspace | Manual — operator-initiated |
| STEP-0030 | Route the task | single-assignment workspace | Manual — operator-initiated |
| STEP-0031 | Record the executive approval | executive workspace | Manual — operator-initiated |
| STEP-0032 | Return the item to the sender | executive workspace | Manual — operator-initiated |
| STEP-0033 | Delegate the item | executive workspace | Manual — operator-initiated |

## 5.3 Initiation and preconditions

| Attribute | Value |
| --- | --- |
| Starting event | An operator opens the route from the sidebar, or another workspace hands them the record. |
| Trigger type | User-initiated · operational |
| Entry criteria | canAccess() admits the role to this route. |
| Required roles and permissions | systemAdmin<br>executive |
| Required configuration | modules/executive.js |
| Required system availability | DGO Internal Platform<br>Microsoft Power Automate |
| Scheduling conditions | None: this process is not scheduled. |

## 5.4 Inputs

| Step | Required inputs |
| --- | --- |
| STEP-0029 | The record the operator has selected, and any values captured by the form attached to the control. |
| STEP-0030 | The record the operator has selected, and any values captured by the form attached to the control. |
| STEP-0031 | The record the operator has selected, and any values captured by the form attached to the control. |
| STEP-0032 | The record the operator has selected, and any values captured by the form attached to the control. |
| STEP-0033 | The record the operator has selected, and any values captured by the form attached to the control. |

## 5.5 Stages and activities

5 step(s).

| Step | Seq | Name | Container | Responsible | Trigger | Preconditions | Inputs | Action performed | Rules | System response | Output | Resulting status | Next step | Alternative next | Dependencies | Controls | Exceptions | Audit event | Evidence | Validation | Sources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STEP-0029 | 1 | Add the minute | modules/executive.js | executive workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls State.patch. | Ownership: executive.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:executive-minute | Confirmed | No external validation required | SRC-018 SRC-035 |
| STEP-0030 | 2 | Route the task | modules/executive.js | single-assignment workspace | An operator activates the control that raises this action. | executive is a declared allowed invoker; ownership of the action rests with single-assignment.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls createTask. | Ownership: single-assignment; allowed invokers executive.<br>Backend: SINGLE_ASSIGNMENT. | Not evidenced for this action. | An updated record in application state. | — | — | — | SINGLE_ASSIGNMENT | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:task-routed | Confirmed | No external validation required | SRC-018 SRC-035 |
| STEP-0031 | 3 | Record the executive approval | modules/executive.js | executive workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls governedTransition. | Ownership: executive.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:executive-approved | Inferred | No external validation required | SRC-018 SRC-035 |
| STEP-0032 | 4 | Return the item to the sender | modules/executive.js | executive workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls governedTransition. | Ownership: executive.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:executive-returned | Inferred | No external validation required | SRC-018 SRC-035 |
| STEP-0033 | 5 | Delegate the item | modules/executive.js | executive workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls governedTransition. | Ownership: executive.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:executive-escalated | Inferred | No external validation required | SRC-018 SRC-035 |

## 5.6 Decisions and branches

_No decision point is evidenced in this process._

## 5.7 Business rules and controls

### Controls

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CTRL-031 | Confirmation control | Operator confirmation — Append quick minute | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |
| CTRL-032 | Confirmation control | Operator confirmation — Route to Assignment | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |
| CTRL-033 | Confirmation control | Operator confirmation — Refresh correspondence | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |

## 5.8 Outputs and completion

| Attribute | Value |
| --- | --- |
| Primary output | An updated record and an audit entry. |
| Completion criteria | The operator completes one of its governed writes: executive-approve, executive-return, executive-escalate, append-minute. |
| Successful end state | The operator completes one of its governed writes: executive-approve, executive-return, executive-escalate, append-minute. |
| Alternative end states | Not evidenced. |
| Failed end states | Not evidenced. |
| Cancellation outcome | Not evidenced. |
| Residual obligations | Not evidenced. |
| Records created or updated | — |
| Notifications issued | NOTIF-059 Select a correspondence item first<br>NOTIF-060 Classification requested — the suggestion appears on this record when it comes back<br>NOTIF-061 The classification service could not be reached. Nothing on this record has changed.<br>NOTIF-062 Enter a quick minute first<br>NOTIF-063 Minute saved locally; sync queued<br>NOTIF-064 Minute appended<br>NOTIF-065 Select an assignee<br>NOTIF-066 Opened Assignment workflow<br>NOTIF-067 Refreshing from the registry<br>NOTIF-068 The registry is unavailable — showing the records already loaded |
| Downstream handoffs | Workspace settings<br>Workspace single-assignment |

## 5.9 Exceptions, failures and recovery

_No exception path is evidenced in this process. Where the process is a request-triggered workflow, that absence is itself recorded in the gap register._

## 5.10 Monitoring, audit and performance

| ID | Kind | Name | Description | Threshold | Escalation threshold | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| MON-028 | Audit event | Audit event audit:executive-minute | The governance table binds action 'append-minute' to the audit vocabulary 'audit:executive-minute'. | — | — | Confirmed |
| MON-029 | Audit event | Audit event audit:task-routed | The governance table binds action 'route-task' to the audit vocabulary 'audit:task-routed'. | — | — | Confirmed |
| MON-030 | Audit event | Audit event audit:executive-approved | The governance table binds action 'executive-approve' to the audit vocabulary 'audit:executive-approved'. | — | — | Confirmed |
| MON-031 | Audit event | Audit event audit:executive-returned | The governance table binds action 'executive-return' to the audit vocabulary 'audit:executive-returned'. | — | — | Confirmed |
| MON-032 | Audit event | Audit event audit:executive-escalated | The governance table binds action 'executive-escalate' to the audit vocabulary 'audit:executive-escalated'. | — | — | Confirmed |

### Audit events written by this process

| Step | Audit event |
| --- | --- |
| STEP-0029 Add the minute | audit:executive-minute |
| STEP-0030 Route the task | audit:task-routed |
| STEP-0031 Record the executive approval | audit:executive-approved |
| STEP-0032 Return the item to the sender | audit:executive-returned |
| STEP-0033 Delegate the item | audit:executive-escalated |

## Relationships

### Subprocesses

| ID | Name | Category | Activation |
| --- | --- | --- | --- |
| SUBPROC-024 | Record the executive approval | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-040 | Return the item to the sender | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-041 | Delegate the item | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-042 | Add the minute | Reusable governed write | An operator activates the control bound to this action. |

### Variants

| ID | Name | Kind | Differs from the primary path | Activation |
| --- | --- | --- | --- | --- |
| VAR-009 | Executive decision hub — as DGCEO | Role-specific variant | The same workspace, with a different set of decision panels shown. The rendered root carries class role-DGCEO, and the stylesheet hides the panels the other roles own. | role(profile.email) resolves to 'DGCEO'. It is derived from substrings of the email address, not from the role model. |
| VAR-010 | Executive decision hub — as Officer | Role-specific variant | The same workspace, with a different set of decision panels shown. The rendered root carries class role-Officer, and the stylesheet hides the panels the other roles own. | role(profile.email) resolves to 'Officer'. It is derived from substrings of the email address, not from the role model. |
| VAR-011 | Executive decision hub — as EA | Role-specific variant | The same workspace, with a different set of decision panels shown. The rendered root carries class role-EA, and the stylesheet hides the panels the other roles own. | role(profile.email) resolves to 'EA'. It is derived from substrings of the email address, not from the role model. |

### Dependencies

| ID | Supporting | Kind | Type | Direction | Mandatory | Impact if unavailable |
| --- | --- | --- | --- | --- | --- | --- |
| DEP-014 | Endpoint alias DYNAMIC_ACTIONS | Integration | Runtime integration call | Outbound - the workspace calls the endpoint | Not determinable from the call site alone; the governance table states per action whether the backend is required or optional. | The call fails. Whether the operator write survives depends on whether the action declares the backend required or optional. |
| DEP-015 | Workspace settings | Process | Process handoff | Downstream - this workspace sends the operator and the selected record on | Optional: the handoff is taken only on the path that navigates. | The operator cannot complete the onward step from here; the record stays in its current state. |
| DEP-016 | Workspace single-assignment | Process | Process handoff | Downstream - this workspace sends the operator and the selected record on | Optional: the handoff is taken only on the path that navigates. | The operator cannot complete the onward step from here; the record stays in its current state. |
| DEP-041 | Endpoint DYNAMIC_ACTIONS | Integration | Direct HTTP call to a Power Automate flow | Outbound | Declared in the endpoint registry as a named alias. Whether a given call is mandatory is stated per action in the governance table, not here. | Every call routed through this alias fails. |

## Operational status

_No run record for this process is held among the supplied inputs. Nothing is claimed about whether it executes._
