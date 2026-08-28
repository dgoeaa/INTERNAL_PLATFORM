# PROC-014 — Meetings

> Generated from `docs/reference/process-inventory.json`. Do not edit.
> Back to the [master inventory](../07-MASTER-PROCESS-INVENTORY.md) · [process detail index](../09-PROCESS-DETAIL.md).

## 5.1 Identity and purpose

| Attribute | Value |
| --- | --- |
| Identifier | PROC-014 |
| Name | Meetings |
| Alternative or legacy name | Route 'meetings' |
| Category | User-initiated · operational |
| Description | Request, schedule and record the outcomes of meetings; agreed actions become tasks. |
| Business objective | Request, schedule and record the outcomes of meetings; agreed actions become tasks. |
| Operational objective | Boundary role 'engagement-schedule'. Owns request-meeting, decide-meeting, meeting-actions-to-tasks; must not own intake-master, registry-custody, approval-decision, archive-execution. |
| Process owner | The meetings module, per the per-action governance table. |
| Criticality | Not evidenced. No supplied artifact grades a workspace by criticality. |
| Business area / group | CONTROL |
| Related modules | modules/meetings.js |
| Related features | request-meeting<br>decide-meeting<br>meeting-actions-to-tasks |
| Evidence classification | Confirmed |
| Evidence note | Declared in the workspace configuration, implemented by a module of the same route name, and bounded by the module boundary charter. |
| Documentation status | Documented in part; named attributes outstanding |
| Validation status | No external validation required |
| Sources | `SRC-036` config/workflow-clarity.config.js<br>`SRC-022` modules/meetings.js<br>`SRC-005` config/module-boundaries.config.js |

## 5.2 Participants and responsibilities

| Attribute | Value |
| --- | --- |
| Initiating actor | An operator holding a role with access to this route. |
| Participating roles | systemAdmin<br>executive<br>director<br>operator |
| Accountable owner | The meetings module, per the per-action governance table. |
| Supporting systems | DGO Internal Platform<br>Microsoft Power Automate |
| Approval authority | Not evidenced for this process. |
| Escalation authority | Not evidenced for this process. |
| Segregation of duties | Not evidenced. No supplied artifact declares a separation requirement. |

### Responsible actor per step

| Step | Name | Responsible | Kind |
| --- | --- | --- | --- |
| STEP-0028 | Request the meeting | meetings workspace | Manual — operator-initiated |
| STEP-0029 | Record the decision on the meeting | meetings workspace | Manual — operator-initiated |
| STEP-0030 | Turn the meeting actions into tasks | meetings workspace | Manual — operator-initiated |

## 5.3 Initiation and preconditions

| Attribute | Value |
| --- | --- |
| Starting event | An operator opens the route from the sidebar, or another workspace hands them the record. |
| Trigger type | User-initiated · operational |
| Entry criteria | canAccess() admits the role to this route. |
| Required roles and permissions | systemAdmin<br>executive<br>director<br>operator |
| Required configuration | modules/meetings.js |
| Required system availability | DGO Internal Platform<br>Microsoft Power Automate |
| Scheduling conditions | None: this process is not scheduled. |

## 5.4 Inputs

| Step | Required inputs |
| --- | --- |
| STEP-0028 | The record the operator has selected, and any values captured by the form attached to the control. |
| STEP-0029 | The record the operator has selected, and any values captured by the form attached to the control. |
| STEP-0030 | The record the operator has selected, and any values captured by the form attached to the control. |

## 5.5 Stages and activities

3 step(s).

| Step | Seq | Name | Container | Responsible | Trigger | Preconditions | Inputs | Action performed | Rules | System response | Output | Resulting status | Next step | Alternative next | Dependencies | Controls | Exceptions | Audit event | Evidence | Validation | Sources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STEP-0028 | 1 | Request the meeting | modules/meetings.js | meetings workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls Meetings.create. | Ownership: meetings.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:meeting-requested | Confirmed | No external validation required | SRC-022 SRC-035 |
| STEP-0029 | 2 | Record the decision on the meeting | modules/meetings.js | meetings workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls Meetings.transition. | Ownership: meetings.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:meeting-decided | Confirmed | No external validation required | SRC-022 SRC-035 |
| STEP-0030 | 3 | Turn the meeting actions into tasks | modules/meetings.js | meetings workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls Meetings.actionsToTasks. | Ownership: meetings.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:meeting-actions-converted | Confirmed | No external validation required | SRC-022 SRC-035 |

## 5.6 Decisions and branches

_No decision point is evidenced in this process._

## 5.7 Business rules and controls

### Controls

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CTRL-038 | Confirmation control | Operator confirmation — Log this meeting request | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |

## 5.8 Outputs and completion

| Attribute | Value |
| --- | --- |
| Primary output | An updated record and an audit entry. |
| Completion criteria | The operator completes one of its governed writes: request-meeting, decide-meeting, meeting-actions-to-tasks. |
| Successful end state | The operator completes one of its governed writes: request-meeting, decide-meeting, meeting-actions-to-tasks. |
| Alternative end states | Not evidenced. |
| Failed end states | Not evidenced. |
| Cancellation outcome | Not evidenced. |
| Residual obligations | Not evidenced. |
| Records created or updated | — |
| Notifications issued | NOTIF-079 Meetings reloaded from the registry<br>NOTIF-080 The registry could not be reached — nothing was reloaded<br>NOTIF-081 Saved locally; synchronization queued<br>NOTIF-082 Meeting request logged<br>NOTIF-083 Recorded locally; synchronization queued<br>NOTIF-084 Created locally; synchronization queued |
| Downstream handoffs | — |

## 5.9 Exceptions, failures and recovery

_No exception path is evidenced in this process. Where the process is a request-triggered workflow, that absence is itself recorded in the gap register._

## 5.10 Monitoring, audit and performance

| ID | Kind | Name | Description | Threshold | Escalation threshold | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| MON-027 | Audit event | Audit event audit:meeting-requested | The governance table binds action 'request-meeting' to the audit vocabulary 'audit:meeting-requested'. | — | — | Confirmed |
| MON-028 | Audit event | Audit event audit:meeting-decided | The governance table binds action 'decide-meeting' to the audit vocabulary 'audit:meeting-decided'. | — | — | Confirmed |
| MON-029 | Audit event | Audit event audit:meeting-actions-converted | The governance table binds action 'meeting-actions-to-tasks' to the audit vocabulary 'audit:meeting-actions-converted'. | — | — | Confirmed |

### Audit events written by this process

| Step | Audit event |
| --- | --- |
| STEP-0028 Request the meeting | audit:meeting-requested |
| STEP-0029 Record the decision on the meeting | audit:meeting-decided |
| STEP-0030 Turn the meeting actions into tasks | audit:meeting-actions-converted |

## Relationships

### Subprocesses

| ID | Name | Category | Activation |
| --- | --- | --- | --- |
| SUBPROC-010 | Request the meeting | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-011 | Record the decision on the meeting | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-012 | Turn the meeting actions into tasks | Reusable governed write | An operator activates the control bound to this action. |

### Dependencies

| ID | Supporting | Kind | Type | Direction | Mandatory | Impact if unavailable |
| --- | --- | --- | --- | --- | --- | --- |
| DEP-018 | Endpoint alias DYNAMIC_ACTIONS | Integration | Runtime integration call | Outbound - the workspace calls the endpoint | Not determinable from the call site alone; the governance table states per action whether the backend is required or optional. | The call fails. Whether the operator write survives depends on whether the action declares the backend required or optional. |
| DEP-041 | Endpoint DYNAMIC_ACTIONS | Integration | Direct HTTP call to a Power Automate flow | Outbound | Declared in the endpoint registry as a named alias. Whether a given call is mandatory is stated per action in the governance table, not here. | Every call routed through this alias fails. |

## Operational status

_No run record for this process is held among the supplied inputs. Nothing is claimed about whether it executes._
