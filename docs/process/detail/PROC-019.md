# PROC-019 — Dispatch

> Generated from `docs/reference/process-inventory.json`. Do not edit.
> Back to the [master inventory](../07-MASTER-PROCESS-INVENTORY.md) · [process detail index](../09-PROCESS-DETAIL.md).

## 5.1 Identity and purpose

| Attribute | Value |
| --- | --- |
| Identifier | PROC-019 |
| Name | Dispatch |
| Alternative or legacy name | Route 'dispatch' |
| Category | User-initiated · operational |
| Description | Prepare dispatch, send/no-dispatch, capture receipt, close and hand off to archive. |
| Description declared in the artifact itself | — |
| Business objective | Prepare dispatch, send/no-dispatch, capture receipt, close and hand off to archive. |
| Operational objective | Boundary role 'dispatch-execution'. Owns prepare-dispatch, send-dispatch, retry-dispatch, no-dispatch, capture-receipt, closure-check; must not own approval-decision, archive-execution. |
| Process owner | The dispatch module, per the per-action governance table. |
| Criticality | Not evidenced. No supplied artifact grades a workspace by criticality. |
| Business area / group | CLOSURE |
| Related modules | modules/dispatch.js |
| Related features | prepare-dispatch<br>send-dispatch<br>retry-dispatch<br>no-dispatch<br>capture-receipt<br>closure-check |
| Evidence classification | Confirmed |
| Evidence note | Declared in the workspace configuration, implemented by a module of the same route name, and bounded by the module boundary charter. |
| Documentation status | Documented in part; named attributes outstanding |
| Validation status | No external validation required |
| Sources | `SRC-036` config/workflow-clarity.config.js<br>`SRC-016` modules/dispatch.js<br>`SRC-005` config/module-boundaries.config.js |

## 5.2 Participants and responsibilities

| Attribute | Value |
| --- | --- |
| Initiating actor | An operator holding a role with access to this route. |
| Participating roles | systemAdmin<br>director<br>operator |
| Accountable owner | The dispatch module, per the per-action governance table. |
| Supporting systems | DGO Internal Platform<br>Microsoft Power Automate |
| Approval authority | Not evidenced for this process. |
| Escalation authority | Not evidenced for this process. |
| Segregation of duties | Not evidenced. No supplied artifact declares a separation requirement. |

### Responsible actor per step

| Step | Name | Responsible | Kind |
| --- | --- | --- | --- |
| STEP-0025 | Send the dispatch | dispatch workspace | Manual — operator-initiated |
| STEP-0026 | Record that nothing will be dispatched | dispatch workspace | Manual — operator-initiated |
| STEP-0027 | Send the dispatch again | dispatch workspace | Manual — operator-initiated |
| STEP-0028 | Close the dispatch | dispatch workspace | Manual — operator-initiated |

## 5.3 Initiation and preconditions

| Attribute | Value |
| --- | --- |
| Starting event | An operator opens the route from the sidebar, or another workspace hands them the record. |
| Trigger type | User-initiated · operational |
| Entry criteria | canAccess() admits the role to this route. |
| Required roles and permissions | systemAdmin<br>director<br>operator |
| Required configuration | modules/dispatch.js |
| Required system availability | DGO Internal Platform<br>Microsoft Power Automate |
| Scheduling conditions | None: this process is not scheduled. |

## 5.4 Inputs

| Step | Required inputs |
| --- | --- |
| STEP-0025 | The record the operator has selected, and any values captured by the form attached to the control. |
| STEP-0026 | The record the operator has selected, and any values captured by the form attached to the control. |
| STEP-0027 | The record the operator has selected, and any values captured by the form attached to the control. |
| STEP-0028 | The record the operator has selected, and any values captured by the form attached to the control. |

## 5.5 Stages and activities

4 step(s).

| Step | Seq | Name | Container | Responsible | Trigger | Preconditions | Inputs | Action performed | Rules | System response | Output | Resulting status | Next step | Alternative next | Dependencies | Controls | Exceptions | Audit event | Evidence | Validation | Sources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STEP-0025 | 1 | Send the dispatch | modules/dispatch.js | dispatch workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls DispatchService.dispatchOutbound. | Ownership: dispatch.<br>Backend: DISPATCH_OUTBOUND. | Not evidenced for this action. | An updated record in application state. | — | — | — | DISPATCH_OUTBOUND | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:dispatch-started | Confirmed | No external validation required | SRC-016 SRC-035 |
| STEP-0026 | 2 | Record that nothing will be dispatched | modules/dispatch.js | dispatch workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls State.patch. | Ownership: dispatch.<br>Backend: none. | Not evidenced for this action. | An updated record in application state. | — | — | — | none | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:no-dispatch | Confirmed | No external validation required | SRC-016 SRC-035 |
| STEP-0027 | 3 | Send the dispatch again | modules/dispatch.js | dispatch workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls WriteManager.backend. | Ownership: dispatch.<br>Backend: DYNAMIC_ACTIONS. | Not evidenced for this action. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:dispatch-retried | Confirmed | No external validation required | SRC-016 SRC-035 |
| STEP-0028 | 4 | Close the dispatch | modules/dispatch.js | dispatch workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls State.patch. | Ownership: dispatch.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:dispatch-closed | Confirmed | No external validation required | SRC-016 SRC-035 |

## 5.6 Decisions and branches

_No decision point is evidenced in this process._

## 5.7 Business rules and controls

### Controls

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CTRL-028 | Confirmation control | Operator confirmation — Send this record out | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |
| CTRL-029 | Confirmation control | Operator confirmation — Record that nothing needs to be sent | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |
| CTRL-030 | Confirmation control | Operator confirmation — Close this record | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |

## 5.8 Outputs and completion

| Attribute | Value |
| --- | --- |
| Primary output | An updated record and an audit entry. |
| Completion criteria | The operator completes one of its governed writes: send-dispatch, no-dispatch, retry-dispatch, close-dispatch. |
| Successful end state | The operator completes one of its governed writes: send-dispatch, no-dispatch, retry-dispatch, close-dispatch. |
| Alternative end states | Not evidenced. |
| Failed end states | Not evidenced. |
| Cancellation outcome | Not evidenced. |
| Residual obligations | Not evidenced. |
| Records created or updated | — |
| Notifications issued | NOTIF-052 Enter who this is going to before sending<br>NOTIF-053 Dispatch recorded on this device — it has not reached the registry yet. Use Send now to try again.<br>NOTIF-054 A reason is required to mark no-dispatch<br>NOTIF-055 Recorded — nothing needs to be sent for this task<br>NOTIF-056 The registry has confirmed this dispatch<br>NOTIF-057 The registry is still unreachable — this dispatch is still waiting to be sent<br>NOTIF-058 Record closed — its dispatch lifecycle is complete |
| Downstream handoffs | — |

## 5.9 Exceptions, failures and recovery

_No exception path is evidenced in this process. Where the process is a request-triggered workflow, that absence is itself recorded in the gap register._

## 5.10 Monitoring, audit and performance

| ID | Kind | Name | Description | Threshold | Escalation threshold | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| MON-024 | Audit event | Audit event audit:dispatch-started | The governance table binds action 'send-dispatch' to the audit vocabulary 'audit:dispatch-started'. | — | — | Confirmed |
| MON-025 | Audit event | Audit event audit:no-dispatch | The governance table binds action 'no-dispatch' to the audit vocabulary 'audit:no-dispatch'. | — | — | Confirmed |
| MON-026 | Audit event | Audit event audit:dispatch-retried | The governance table binds action 'retry-dispatch' to the audit vocabulary 'audit:dispatch-retried'. | — | — | Confirmed |
| MON-027 | Audit event | Audit event audit:dispatch-closed | The governance table binds action 'close-dispatch' to the audit vocabulary 'audit:dispatch-closed'. | — | — | Confirmed |

### Audit events written by this process

| Step | Audit event |
| --- | --- |
| STEP-0025 Send the dispatch | audit:dispatch-started |
| STEP-0026 Record that nothing will be dispatched | audit:no-dispatch |
| STEP-0027 Send the dispatch again | audit:dispatch-retried |
| STEP-0028 Close the dispatch | audit:dispatch-closed |

## Relationships

### Subprocesses

| ID | Name | Category | Activation |
| --- | --- | --- | --- |
| SUBPROC-004 | Archive Evidence | Sub-view of a primary workspace | — |
| SUBPROC-025 | Send the dispatch | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-053 | Record that nothing will be dispatched | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-054 | Send the dispatch again | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-055 | Close the dispatch | Reusable governed write | An operator activates the control bound to this action. |

## Operational status

_No run record for this process is held among the supplied inputs. Nothing is claimed about whether it executes._
