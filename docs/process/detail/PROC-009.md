# PROC-009 — Lookup & Direct Action

> Generated from `docs/reference/process-inventory.json`. Do not edit.
> Back to the [master inventory](../07-MASTER-PROCESS-INVENTORY.md) · [process detail index](../09-PROCESS-DETAIL.md).

## 5.1 Identity and purpose

| Attribute | Value |
| --- | --- |
| Identifier | PROC-009 |
| Name | Lookup & Direct Action |
| Alternative or legacy name | Route 'lookup' |
| Category | User-initiated · operational |
| Description | Search and retrieve any record by reference, sender or subject, and act on it directly. |
| Business objective | Search and retrieve any record by reference, sender or subject, and act on it directly. |
| Operational objective | Boundary role 'search-retrieval'. Owns search, filter, open-active, open-archive; must not own archive-execution, report-generation. |
| Process owner | — |
| Criticality | Not evidenced. No supplied artifact grades a workspace by criticality. |
| Business area / group | OPERATIONS |
| Related modules | modules/lookup.js |
| Related features | search<br>filter<br>open-active<br>open-archive |
| Evidence classification | Confirmed |
| Evidence note | Declared in the workspace configuration, implemented by a module of the same route name, and bounded by the module boundary charter. |
| Documentation status | Documented in part; named attributes outstanding |
| Validation status | No external validation required |
| Sources | `SRC-036` config/workflow-clarity.config.js<br>`SRC-021` modules/lookup.js<br>`SRC-005` config/module-boundaries.config.js |

## 5.2 Participants and responsibilities

| Attribute | Value |
| --- | --- |
| Initiating actor | An operator holding a role with access to this route. |
| Participating roles | systemAdmin<br>executive<br>director<br>operator<br>viewer |
| Accountable owner | Not evidenced — recorded as an ownership gap. |
| Supporting systems | DGO Internal Platform |
| Approval authority | Not evidenced for this process. |
| Escalation authority | Not evidenced for this process. |
| Segregation of duties | Not evidenced. No supplied artifact declares a separation requirement. |

### Responsible actor per step

| Step | Name | Responsible | Kind |
| --- | --- | --- | --- |
| STEP-0025 | Mark the document | activities workspace | Manual — operator-initiated |
| STEP-0026 | Update the task | orchestrator workspace | Manual — operator-initiated |
| STEP-0027 | Raise a task from that email | single-assignment workspace | Manual — operator-initiated |

## 5.3 Initiation and preconditions

| Attribute | Value |
| --- | --- |
| Starting event | An operator opens the route from the sidebar, or another workspace hands them the record. |
| Trigger type | User-initiated · operational |
| Entry criteria | canAccess() admits the role to this route. |
| Required roles and permissions | systemAdmin<br>executive<br>director<br>operator<br>viewer |
| Required configuration | modules/lookup.js |
| Required system availability | DGO Internal Platform |
| Scheduling conditions | None: this process is not scheduled. |

## 5.4 Inputs

| Step | Required inputs |
| --- | --- |
| STEP-0025 | The record the operator has selected, and any values captured by the form attached to the control. |
| STEP-0026 | The record the operator has selected, and any values captured by the form attached to the control. |
| STEP-0027 | The record the operator has selected, and any values captured by the form attached to the control. |

## 5.5 Stages and activities

3 step(s).

| Step | Seq | Name | Container | Responsible | Trigger | Preconditions | Inputs | Action performed | Rules | System response | Output | Resulting status | Next step | Alternative next | Dependencies | Controls | Exceptions | Audit event | Evidence | Validation | Sources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STEP-0025 | 1 | Mark the document | modules/lookup.js | activities workspace | An operator activates the control that raises this action. | lookup is a declared allowed invoker; ownership of the action rests with activities.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls State.patch. | Ownership: activities; allowed invokers lookup.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:document-flagged | Confirmed | No external validation required | SRC-021 SRC-035 |
| STEP-0026 | 2 | Update the task | modules/lookup.js | orchestrator workspace | An operator activates the control that raises this action. | lookup is a declared allowed invoker; ownership of the action rests with orchestrator.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls updateTaskState. | Ownership: orchestrator; allowed invokers lookup.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:task-updated | Confirmed | No external validation required | SRC-021 SRC-035 |
| STEP-0027 | 3 | Raise a task from that email | modules/lookup.js | single-assignment workspace | An operator activates the control that raises this action. | lookup is a declared allowed invoker; ownership of the action rests with single-assignment.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls createTask. | Ownership: single-assignment; allowed invokers lookup, correspondence.<br>Backend: EMAIL_RELATED_TASK. | Not evidenced for this action. | An updated record in application state. | — | — | — | EMAIL_RELATED_TASK | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:email-task-created | Confirmed | No external validation required | SRC-021 SRC-035 |

## 5.6 Decisions and branches

_No decision point is evidenced in this process._

## 5.7 Business rules and controls

### Rules

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Owner | Evidence | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RULE-018 | Routing rule | Support routing — Wrong Task or Reference | Support requests of category 'Wrong Task or Reference' are routed to lookup. | A support request is raised. | category = 'wrong-task' | Route to lookup at severity high. | The request appears in the receiving workspace. | Not evidenced for a category the table does not carry. | — | Confirmed | — |

### Controls

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CTRL-035 | Confirmation control | Operator confirmation — Ask the registry for this record | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |
| CTRL-036 | Confirmation control | Operator confirmation — Update this task | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |
| CTRL-037 | Confirmation control | Operator confirmation — Raise a task from this email | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |

## 5.8 Outputs and completion

| Attribute | Value |
| --- | --- |
| Primary output | A view over records already held. |
| Completion criteria | Not evidenced. This workspace declares no governed write of its own, so it has no completion event beyond leaving it. |
| Successful end state | Not evidenced. This workspace declares no governed write of its own, so it has no completion event beyond leaving it. |
| Alternative end states | Not evidenced. |
| Failed end states | Not evidenced. |
| Cancellation outcome | Not evidenced. |
| Residual obligations | Not evidenced. |
| Records created or updated | — |
| Notifications issued | NOTIF-071 Records reloaded from the registry<br>NOTIF-072 The registry could not be reached — nothing was reloaded<br>NOTIF-073 Enter a number, reference or title first<br>NOTIF-074 The registry has been asked for this record — it joins the results when it comes back<br>NOTIF-075 The registry could not be reached, so only the records already on this device were searched<br>NOTIF-076 The mark is saved here — it goes to the registry when the connection is back<br>NOTIF-077 The update is saved here — it goes to the registry when the connection is back<br>NOTIF-078 The task is saved here — it goes to the registry when the connection is back |
| Downstream handoffs | Workspace single-assignment |

## 5.9 Exceptions, failures and recovery

_No exception path is evidenced in this process. Where the process is a request-triggered workflow, that absence is itself recorded in the gap register._

## 5.10 Monitoring, audit and performance

| ID | Kind | Name | Description | Threshold | Escalation threshold | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| MON-024 | Audit event | Audit event audit:document-flagged | The governance table binds action 'flag-document' to the audit vocabulary 'audit:document-flagged'. | — | — | Confirmed |
| MON-025 | Audit event | Audit event audit:task-updated | The governance table binds action 'update-task' to the audit vocabulary 'audit:task-updated'. | — | — | Confirmed |
| MON-026 | Audit event | Audit event audit:email-task-created | The governance table binds action 'create-task-from-email' to the audit vocabulary 'audit:email-task-created'. | — | — | Confirmed |

### Audit events written by this process

| Step | Audit event |
| --- | --- |
| STEP-0025 Mark the document | audit:document-flagged |
| STEP-0026 Update the task | audit:task-updated |
| STEP-0027 Raise a task from that email | audit:email-task-created |

## Relationships

### Variants

| ID | Name | Kind | Differs from the primary path | Activation |
| --- | --- | --- | --- | --- |
| VAR-014 | Support request — Wrong Task or Reference | Conditional variant selected by the reported category | A support request of category 'Wrong Task or Reference' is routed to the lookup workspace at severity high, rather than into a single support queue. | The requester selects category 'wrong-task'. |

### Dependencies

| ID | Supporting | Kind | Type | Direction | Mandatory | Impact if unavailable |
| --- | --- | --- | --- | --- | --- | --- |
| DEP-017 | Workspace single-assignment | Process | Process handoff | Downstream - this workspace sends the operator and the selected record on | Optional: the handoff is taken only on the path that navigates. | The operator cannot complete the onward step from here; the record stays in its current state. |

## Operational status

_No run record for this process is held among the supplied inputs. Nothing is claimed about whether it executes._
