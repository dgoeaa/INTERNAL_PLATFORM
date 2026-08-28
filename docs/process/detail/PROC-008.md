# PROC-008 — Comments

> Generated from `docs/reference/process-inventory.json`. Do not edit.
> Back to the [master inventory](../07-MASTER-PROCESS-INVENTORY.md) · [process detail index](../09-PROCESS-DETAIL.md).

## 5.1 Identity and purpose

| Attribute | Value |
| --- | --- |
| Identifier | PROC-008 |
| Name | Comments |
| Alternative or legacy name | Route 'comments' |
| Category | User-initiated · operational |
| Description | Threaded collaboration on correspondence and tasks, visible to everyone on the record. |
| Description declared in the artifact itself | — |
| Business objective | Threaded collaboration on correspondence and tasks, visible to everyone on the record. |
| Operational objective | Boundary role 'collaboration-thread'. Owns comment, review-note, return-reason, dispatch-note; must not own status-transition, archive-mutation. |
| Process owner | The comments module, per the per-action governance table. |
| Criticality | Not evidenced. No supplied artifact grades a workspace by criticality. |
| Business area / group | OPERATIONS |
| Related modules | modules/comments.js |
| Related features | comment<br>review-note<br>return-reason<br>dispatch-note |
| Evidence classification | Confirmed |
| Evidence note | Declared in the workspace configuration, implemented by a module of the same route name, and bounded by the module boundary charter. |
| Documentation status | Documented in part; named attributes outstanding |
| Validation status | No external validation required |
| Sources | `SRC-036` config/workflow-clarity.config.js<br>`SRC-012` modules/comments.js<br>`SRC-005` config/module-boundaries.config.js |

## 5.2 Participants and responsibilities

| Attribute | Value |
| --- | --- |
| Initiating actor | An operator holding a role with access to this route. |
| Participating roles | systemAdmin<br>operator |
| Accountable owner | The comments module, per the per-action governance table. |
| Supporting systems | DGO Internal Platform<br>Microsoft Power Automate |
| Approval authority | Not evidenced for this process. |
| Escalation authority | Not evidenced for this process. |
| Segregation of duties | Not evidenced. No supplied artifact declares a separation requirement. |

### Responsible actor per step

| Step | Name | Responsible | Kind |
| --- | --- | --- | --- |
| STEP-0017 | Add the comment | comments workspace | Manual — operator-initiated |

## 5.3 Initiation and preconditions

| Attribute | Value |
| --- | --- |
| Starting event | An operator opens the route from the sidebar, or another workspace hands them the record. |
| Trigger type | User-initiated · operational |
| Entry criteria | canAccess() admits the role to this route. |
| Required roles and permissions | systemAdmin<br>operator |
| Required configuration | modules/comments.js |
| Required system availability | DGO Internal Platform<br>Microsoft Power Automate |
| Scheduling conditions | None: this process is not scheduled. |

## 5.4 Inputs

| Step | Required inputs |
| --- | --- |
| STEP-0017 | The record the operator has selected, and any values captured by the form attached to the control. |

## 5.5 Stages and activities

1 step(s).

| Step | Seq | Name | Container | Responsible | Trigger | Preconditions | Inputs | Action performed | Rules | System response | Output | Resulting status | Next step | Alternative next | Dependencies | Controls | Exceptions | Audit event | Evidence | Validation | Sources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STEP-0017 | 1 | Add the comment | modules/comments.js | comments workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls State.patch. | Ownership: comments.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:comment-added | Confirmed | No external validation required | SRC-012 SRC-035 |

## 5.6 Decisions and branches

_No decision point is evidenced in this process._

## 5.7 Business rules and controls

### Rules

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Owner | Evidence | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RULE-016 | Routing rule | Support routing — Clarification Required | Support requests of category 'Clarification Required' are routed to comments. | A support request is raised. | category = 'clarification' | Route to comments at severity normal. | The request appears in the receiving workspace. | Not evidenced for a category the table does not carry. | — | Confirmed | — |

### Controls

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CTRL-022 | Confirmation control | Operator confirmation — Post this comment | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |

## 5.8 Outputs and completion

| Attribute | Value |
| --- | --- |
| Primary output | An updated record and an audit entry. |
| Completion criteria | The operator completes one of its governed writes: add-comment. |
| Successful end state | The operator completes one of its governed writes: add-comment. |
| Alternative end states | Not evidenced. |
| Failed end states | Not evidenced. |
| Cancellation outcome | Not evidenced. |
| Residual obligations | Not evidenced. |
| Records created or updated | — |
| Notifications issued | NOTIF-028 Comments reloaded from the registry<br>NOTIF-029 The registry could not be reached — nothing was reloaded<br>NOTIF-030 Comment posted |
| Downstream handoffs | — |

## 5.9 Exceptions, failures and recovery

_No exception path is evidenced in this process. Where the process is a request-triggered workflow, that absence is itself recorded in the gap register._

## 5.10 Monitoring, audit and performance

| ID | Kind | Name | Description | Threshold | Escalation threshold | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| MON-016 | Audit event | Audit event audit:comment-added | The governance table binds action 'add-comment' to the audit vocabulary 'audit:comment-added'. | — | — | Confirmed |

### Audit events written by this process

| Step | Audit event |
| --- | --- |
| STEP-0017 Add the comment | audit:comment-added |

## Relationships

### Subprocesses

| ID | Name | Category | Activation |
| --- | --- | --- | --- |
| SUBPROC-044 | Add the comment | Reusable governed write | An operator activates the control bound to this action. |

### Variants

| ID | Name | Kind | Differs from the primary path | Activation |
| --- | --- | --- | --- | --- |
| VAR-015 | Support request — Clarification Required | Conditional variant selected by the reported category | A support request of category 'Clarification Required' is routed to the comments workspace at severity normal, rather than into a single support queue. | The requester selects category 'clarification'. |

## Operational status

_No run record for this process is held among the supplied inputs. Nothing is claimed about whether it executes._
