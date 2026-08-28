# PROC-006 — Acknowledgment Queue

> Generated from `docs/reference/process-inventory.json`. Do not edit.
> Back to the [master inventory](../07-MASTER-PROCESS-INVENTORY.md) · [process detail index](../09-PROCESS-DETAIL.md).

## 5.1 Identity and purpose

| Attribute | Value |
| --- | --- |
| Identifier | PROC-006 |
| Name | Acknowledgment Queue |
| Alternative or legacy name | Route 'acknowledgment' |
| Category | User-initiated · operational |
| Description | Confirm receipt of assigned work before it starts, with the SLA clock in view. |
| Description declared in the artifact itself | — |
| Business objective | Confirm receipt of assigned work before it starts, with the SLA clock in view. |
| Operational objective | Boundary role 'assignment-receipt-gate'. Owns acknowledge, acknowledge-retry, remind-assignee, escalate-non-ack; must not own task-progress, response-monitoring. |
| Process owner | The acknowledgment module, per the per-action governance table. |
| Criticality | Not evidenced. No supplied artifact grades a workspace by criticality. |
| Business area / group | OPERATIONS |
| Related modules | modules/acknowledgment.js |
| Related features | acknowledge<br>acknowledge-retry<br>remind-assignee<br>escalate-non-ack |
| Evidence classification | Confirmed |
| Evidence note | Declared in the workspace configuration, implemented by a module of the same route name, and bounded by the module boundary charter. |
| Documentation status | Documented in part; named attributes outstanding |
| Validation status | No external validation required |
| Sources | `SRC-036` config/workflow-clarity.config.js<br>`SRC-004` modules/acknowledgment.js<br>`SRC-005` config/module-boundaries.config.js |

## 5.2 Participants and responsibilities

| Attribute | Value |
| --- | --- |
| Initiating actor | An operator holding a role with access to this route. |
| Participating roles | systemAdmin |
| Accountable owner | The acknowledgment module, per the per-action governance table. |
| Supporting systems | DGO Internal Platform<br>Microsoft Power Automate |
| Approval authority | Not evidenced for this process. |
| Escalation authority | Not evidenced for this process. |
| Segregation of duties | Not evidenced. No supplied artifact declares a separation requirement. |

### Responsible actor per step

| Step | Name | Responsible | Kind |
| --- | --- | --- | --- |
| STEP-0001 | Record the acknowledgment | acknowledgment workspace | Manual — operator-initiated |
| STEP-0002 | Send the reminder | acknowledgment workspace | Manual — operator-initiated |

## 5.3 Initiation and preconditions

| Attribute | Value |
| --- | --- |
| Starting event | An operator opens the route from the sidebar, or another workspace hands them the record. |
| Trigger type | User-initiated · operational |
| Entry criteria | canAccess() admits the role to this route. |
| Required roles and permissions | systemAdmin |
| Required configuration | modules/acknowledgment.js |
| Required system availability | DGO Internal Platform<br>Microsoft Power Automate |
| Scheduling conditions | None: this process is not scheduled. |

## 5.4 Inputs

| Step | Required inputs |
| --- | --- |
| STEP-0001 | The record the operator has selected, and any values captured by the form attached to the control. |
| STEP-0002 | The record the operator has selected, and any values captured by the form attached to the control. |

## 5.5 Stages and activities

2 step(s).

| Step | Seq | Name | Container | Responsible | Trigger | Preconditions | Inputs | Action performed | Rules | System response | Output | Resulting status | Next step | Alternative next | Dependencies | Controls | Exceptions | Audit event | Evidence | Validation | Sources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STEP-0001 | 1 | Record the acknowledgment | modules/acknowledgment.js | acknowledgment workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls AcknowledgementService.submit. | Ownership: acknowledgment; allowed invokers orchestrator.<br>Backend: SUBSIDIARY_ACTIONS. | Not evidenced for this action. | An updated record in application state. | — | — | — | SUBSIDIARY_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:acknowledged | Confirmed | No external validation required | SRC-004 SRC-035 |
| STEP-0002 | 2 | Send the reminder | modules/acknowledgment.js | acknowledgment workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls State.patch. | Ownership: acknowledgment.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:ack-reminder | Confirmed | No external validation required | SRC-004 SRC-035 |

## 5.6 Decisions and branches

_No decision point is evidenced in this process._

## 5.7 Business rules and controls

### Rules

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Owner | Evidence | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RULE-019 | Routing rule | Support routing — Already Acknowledged | Support requests of category 'Already Acknowledged' are routed to acknowledgment. | A support request is raised. | category = 'already-acknowledged' | Route to acknowledgment at severity normal. | The request appears in the receiving workspace. | Not evidenced for a category the table does not carry. | — | Confirmed | — |

### Controls

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CTRL-014 | Confirmation control | Operator confirmation — Confirm receipt of this task | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |
| CTRL-015 | Confirmation control | Operator confirmation — Remind the assignee to acknowledge | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |
| CTRL-058 | Completion and audit control | Acknowledgement receipt | Receipt of an assignment is confirmed and recorded before work starts. | An assignee acknowledges an assignment. | The payload carries every required field, including an idempotency key. | A receipt is written to the ledger with actor, time, source and the idempotency key. | A duplicate acknowledgement inside the dedupe window is recognised as the same receipt, not a second one. | A failed send is retried under the declared retry policy and queued when it cannot be delivered. | Confirmed |

## 5.8 Outputs and completion

| Attribute | Value |
| --- | --- |
| Primary output | An updated record and an audit entry. |
| Completion criteria | The operator completes one of its governed writes: acknowledge, acknowledge-retry, remind-assignee. |
| Successful end state | The operator completes one of its governed writes: acknowledge, acknowledge-retry, remind-assignee. |
| Alternative end states | Not evidenced. |
| Failed end states | Not evidenced. |
| Cancellation outcome | Not evidenced. |
| Residual obligations | Not evidenced. |
| Records created or updated | — |
| Notifications issued | NOTIF-001 Records reloaded from the registry<br>NOTIF-002 The registry could not be reached, so nothing was reloaded. Try again, or contact IT support if it keeps failing.<br>NOTIF-003 This task has no attachments |
| Downstream handoffs | Workspace response-tracking<br>Workspace orchestrator<br>Workspace single-assignment |

## 5.9 Exceptions, failures and recovery

_No exception path is evidenced in this process. Where the process is a request-triggered workflow, that absence is itself recorded in the gap register._

## 5.10 Monitoring, audit and performance

| ID | Kind | Name | Description | Threshold | Escalation threshold | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| MON-001 | Audit event | Audit event audit:acknowledged | The governance table binds action 'acknowledge' to the audit vocabulary 'audit:acknowledged'. | — | — | Confirmed |
| MON-002 | Audit event | Audit event audit:ack-reminder | The governance table binds action 'remind-assignee' to the audit vocabulary 'audit:ack-reminder'. | — | — | Confirmed |

### Audit events written by this process

| Step | Audit event |
| --- | --- |
| STEP-0001 Record the acknowledgment | audit:acknowledged |
| STEP-0002 Send the reminder | audit:ack-reminder |

## Relationships

### Subprocesses

| ID | Name | Category | Activation |
| --- | --- | --- | --- |
| SUBPROC-019 | Record the acknowledgment | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-020 | Send the acknowledgments still waiting | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-045 | Send the reminder | Reusable governed write | An operator activates the control bound to this action. |

### Variants

| ID | Name | Kind | Differs from the primary path | Activation |
| --- | --- | --- | --- | --- |
| VAR-002 | record the acknowledgment — raised from orchestrator | Channel-specific variant | The same governed action, raised from orchestrator instead of from its owner acknowledgment. | An operator working in orchestrator takes the action. |
| VAR-018 | Support request — Already Acknowledged | Conditional variant selected by the reported category | A support request of category 'Already Acknowledged' is routed to the acknowledgment workspace at severity normal, rather than into a single support queue. | The requester selects category 'already-acknowledged'. |

### Dependencies

| ID | Supporting | Kind | Type | Direction | Mandatory | Impact if unavailable |
| --- | --- | --- | --- | --- | --- | --- |
| DEP-001 | Workspace response-tracking | Process | Process handoff | Downstream - this workspace sends the operator and the selected record on | Optional: the handoff is taken only on the path that navigates. | The operator cannot complete the onward step from here; the record stays in its current state. |
| DEP-002 | Workspace orchestrator | Process | Process handoff | Downstream - this workspace sends the operator and the selected record on | Optional: the handoff is taken only on the path that navigates. | The operator cannot complete the onward step from here; the record stays in its current state. |
| DEP-003 | Workspace single-assignment | Process | Process handoff | Downstream - this workspace sends the operator and the selected record on | Optional: the handoff is taken only on the path that navigates. | The operator cannot complete the onward step from here; the record stays in its current state. |

## Operational status

_No run record for this process is held among the supplied inputs. Nothing is claimed about whether it executes._
