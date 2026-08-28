# PROC-005 — My Work

> Generated from `docs/reference/process-inventory.json`. Do not edit.
> Back to the [master inventory](../07-MASTER-PROCESS-INVENTORY.md) · [process detail index](../09-PROCESS-DETAIL.md).

## 5.1 Identity and purpose

| Attribute | Value |
| --- | --- |
| Identifier | PROC-005 |
| Name | My Work |
| Alternative or legacy name | Route 'orchestrator' |
| Category | User-initiated · operational |
| Description | Acknowledge, start, update, comment on and complete assigned work. |
| Description declared in the artifact itself | — |
| Business objective | Acknowledge, start, update, comment on and complete assigned work. |
| Operational objective | Boundary role 'task-execution-workbench'. Owns start-work, progress, block, resume, complete-action, submit-review, update-task; must not own assignment-creation, review-decision. |
| Process owner | The orchestrator module, per the per-action governance table. |
| Criticality | Not evidenced. No supplied artifact grades a workspace by criticality. |
| Business area / group | OPERATIONS |
| Related modules | modules/orchestrator.js |
| Related features | start-work<br>progress<br>block<br>resume<br>complete-action<br>submit-review<br>update-task |
| Evidence classification | Confirmed |
| Evidence note | Declared in the workspace configuration, implemented by a module of the same route name, and bounded by the module boundary charter. |
| Documentation status | Documented in part; named attributes outstanding |
| Validation status | No external validation required |
| Sources | `SRC-036` config/workflow-clarity.config.js<br>`SRC-024` modules/orchestrator.js<br>`SRC-005` config/module-boundaries.config.js |

## 5.2 Participants and responsibilities

| Attribute | Value |
| --- | --- |
| Initiating actor | An operator holding a role with access to this route. |
| Participating roles | systemAdmin<br>director<br>operator |
| Accountable owner | The orchestrator module, per the per-action governance table. |
| Supporting systems | DGO Internal Platform<br>Microsoft Power Automate |
| Approval authority | Not evidenced for this process. |
| Escalation authority | Not evidenced for this process. |
| Segregation of duties | Not evidenced. No supplied artifact declares a separation requirement. |

### Responsible actor per step

| Step | Name | Responsible | Kind |
| --- | --- | --- | --- |
| STEP-0044 | Mark that work complete | orchestrator workspace | Manual — operator-initiated |
| STEP-0045 | Set the reminder | orchestrator workspace | Manual — operator-initiated |

## 5.3 Initiation and preconditions

| Attribute | Value |
| --- | --- |
| Starting event | An operator opens the route from the sidebar, or another workspace hands them the record. |
| Trigger type | User-initiated · operational |
| Entry criteria | canAccess() admits the role to this route. |
| Required roles and permissions | systemAdmin<br>director<br>operator |
| Required configuration | modules/orchestrator.js |
| Required system availability | DGO Internal Platform<br>Microsoft Power Automate |
| Scheduling conditions | None: this process is not scheduled. |

## 5.4 Inputs

| Step | Required inputs |
| --- | --- |
| STEP-0044 | The record the operator has selected, and any values captured by the form attached to the control. |
| STEP-0045 | The record the operator has selected, and any values captured by the form attached to the control. |

## 5.5 Stages and activities

2 step(s).

| Step | Seq | Name | Container | Responsible | Trigger | Preconditions | Inputs | Action performed | Rules | System response | Output | Resulting status | Next step | Alternative next | Dependencies | Controls | Exceptions | Audit event | Evidence | Validation | Sources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STEP-0044 | 1 | Mark that work complete | modules/orchestrator.js | orchestrator workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls governedTransition. | Ownership: orchestrator.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:action-complete | Confirmed | No external validation required | SRC-024 SRC-035 |
| STEP-0045 | 2 | Set the reminder | modules/orchestrator.js | orchestrator workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls State.patch. | Ownership: orchestrator.<br>Backend: DYNAMIC_ACTIONS. | Not evidenced for this action. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:reminder-set | Confirmed | No external validation required | SRC-024 SRC-035 |

## 5.6 Decisions and branches

_No decision point is evidenced in this process._

## 5.7 Business rules and controls

### Rules

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Owner | Evidence | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RULE-015 | Routing rule | Support routing — Timeline / Due Date Issue | Support requests of category 'Timeline / Due Date Issue' are routed to orchestrator. | A support request is raised. | category = 'timeline' | Route to orchestrator at severity medium. | The request appears in the receiving workspace. | Not evidenced for a category the table does not carry. | — | Confirmed | — |

### Controls

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CTRL-039 | Confirmation control | Operator confirmation — Mark this task completed | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |
| CTRL-040 | Confirmation control | Operator confirmation — Set a reminder for this task | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |

## 5.8 Outputs and completion

| Attribute | Value |
| --- | --- |
| Primary output | An updated record and an audit entry. |
| Completion criteria | The operator completes one of its governed writes: start-work, complete-action, set-reminder, update-task. |
| Successful end state | The operator completes one of its governed writes: start-work, complete-action, set-reminder, update-task. |
| Alternative end states | Not evidenced. |
| Failed end states | Not evidenced. |
| Cancellation outcome | Not evidenced. |
| Residual obligations | Not evidenced. |
| Records created or updated | — |
| Notifications issued | NOTIF-086 There is nothing in this list to export<br>NOTIF-087 Tasks refreshed from the registry<br>NOTIF-088 The registry could not be reached — nothing was refreshed<br>NOTIF-089 Task marked completed<br>NOTIF-090 A reminder date is required<br>NOTIF-091 Reminder saved on this device — it will reach the registry when the connection returns |
| Downstream handoffs | Workspace single-assignment<br>Workspace comments |

## 5.9 Exceptions, failures and recovery

_No exception path is evidenced in this process. Where the process is a request-triggered workflow, that absence is itself recorded in the gap register._

## 5.10 Monitoring, audit and performance

| ID | Kind | Name | Description | Threshold | Escalation threshold | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| MON-040 | Audit event | Audit event audit:action-complete | The governance table binds action 'complete-action' to the audit vocabulary 'audit:action-complete'. | — | — | Confirmed |
| MON-041 | Audit event | Audit event audit:reminder-set | The governance table binds action 'set-reminder' to the audit vocabulary 'audit:reminder-set'. | — | — | Confirmed |

### Audit events written by this process

| Step | Audit event |
| --- | --- |
| STEP-0044 Mark that work complete | audit:action-complete |
| STEP-0045 Set the reminder | audit:reminder-set |

## Relationships

### Subprocesses

| ID | Name | Category | Activation |
| --- | --- | --- | --- |
| SUBPROC-021 | Start work on that task | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-022 | Mark that work complete | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-052 | Set the reminder | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-057 | Update the task | Reusable governed write | An operator activates the control bound to this action. |

### Variants

| ID | Name | Kind | Differs from the primary path | Activation |
| --- | --- | --- | --- | --- |
| VAR-006 | update the task — raised from lookup | Channel-specific variant | The same governed action, raised from lookup instead of from its owner orchestrator. | An operator working in lookup takes the action. |
| VAR-014 | Support request — Timeline / Due Date Issue | Conditional variant selected by the reported category | A support request of category 'Timeline / Due Date Issue' is routed to the orchestrator workspace at severity medium, rather than into a single support queue. | The requester selects category 'timeline'. |

### Dependencies

| ID | Supporting | Kind | Type | Direction | Mandatory | Impact if unavailable |
| --- | --- | --- | --- | --- | --- | --- |
| DEP-019 | Endpoint alias DYNAMIC_ACTIONS | Integration | Runtime integration call | Outbound - the workspace calls the endpoint | Not determinable from the call site alone; the governance table states per action whether the backend is required or optional. | The call fails. Whether the operator write survives depends on whether the action declares the backend required or optional. |
| DEP-020 | Workspace single-assignment | Process | Process handoff | Downstream - this workspace sends the operator and the selected record on | Optional: the handoff is taken only on the path that navigates. | The operator cannot complete the onward step from here; the record stays in its current state. |
| DEP-021 | Workspace comments | Process | Process handoff | Downstream - this workspace sends the operator and the selected record on | Optional: the handoff is taken only on the path that navigates. | The operator cannot complete the onward step from here; the record stays in its current state. |
| DEP-041 | Endpoint DYNAMIC_ACTIONS | Integration | Direct HTTP call to a Power Automate flow | Outbound | Declared in the endpoint registry as a named alias. Whether a given call is mandatory is stated per action in the governance table, not here. | Every call routed through this alias fails. |

## Operational status

_No run record for this process is held among the supplied inputs. Nothing is claimed about whether it executes._
