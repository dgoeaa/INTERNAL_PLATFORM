# PROC-007 — Registry

> Generated from `docs/reference/process-inventory.json`. Do not edit.
> Back to the [master inventory](../07-MASTER-PROCESS-INVENTORY.md) · [process detail index](../09-PROCESS-DETAIL.md).

## 5.1 Identity and purpose

| Attribute | Value |
| --- | --- |
| Identifier | PROC-007 |
| Name | Registry |
| Alternative or legacy name | Route 'registry' |
| Category | User-initiated · operational |
| Description | Official file control and registry search across every intake channel. |
| Business objective | Official file control and registry search across every intake channel. |
| Operational objective | Boundary role 'official-file-control'. Owns registry-file, file-jacket, custody, movement, minutes, registry-closure-candidate; must not own triage-master, search-retrieval, report-export. |
| Process owner | The registry module, per the per-action governance table. |
| Criticality | Not evidenced. No supplied artifact grades a workspace by criticality. |
| Business area / group | OPERATIONS |
| Related modules | modules/registry.js |
| Related features | registry-file<br>file-jacket<br>custody<br>movement<br>minutes<br>registry-closure-candidate |
| Evidence classification | Confirmed |
| Evidence note | Declared in the workspace configuration, implemented by a module of the same route name, and bounded by the module boundary charter. |
| Documentation status | Documented in part; named attributes outstanding |
| Validation status | No external validation required |
| Sources | `SRC-036` config/workflow-clarity.config.js<br>`SRC-026` modules/registry.js<br>`SRC-005` config/module-boundaries.config.js |

## 5.2 Participants and responsibilities

| Attribute | Value |
| --- | --- |
| Initiating actor | An operator holding a role with access to this route. |
| Participating roles | systemAdmin<br>operator |
| Accountable owner | The registry module, per the per-action governance table. |
| Supporting systems | DGO Internal Platform<br>Microsoft Power Automate |
| Approval authority | Not evidenced for this process. |
| Escalation authority | Not evidenced for this process. |
| Segregation of duties | Not evidenced. No supplied artifact declares a separation requirement. |

### Responsible actor per step

| Step | Name | Responsible | Kind |
| --- | --- | --- | --- |
| STEP-0035 | Register the file | registry workspace | Manual — operator-initiated |
| STEP-0036 | Route the file | registry workspace | Manual — operator-initiated |
| STEP-0037 | Record receipt of the file | registry workspace | Manual — operator-initiated |
| STEP-0038 | Close the file | registry workspace | Manual — operator-initiated |

## 5.3 Initiation and preconditions

| Attribute | Value |
| --- | --- |
| Starting event | An operator opens the route from the sidebar, or another workspace hands them the record. |
| Trigger type | User-initiated · operational |
| Entry criteria | canAccess() admits the role to this route. |
| Required roles and permissions | systemAdmin<br>operator |
| Required configuration | modules/registry.js |
| Required system availability | DGO Internal Platform<br>Microsoft Power Automate |
| Scheduling conditions | None: this process is not scheduled. |

## 5.4 Inputs

| Step | Required inputs |
| --- | --- |
| STEP-0035 | The record the operator has selected, and any values captured by the form attached to the control. |
| STEP-0036 | The record the operator has selected, and any values captured by the form attached to the control. |
| STEP-0037 | The record the operator has selected, and any values captured by the form attached to the control. |
| STEP-0038 | The record the operator has selected, and any values captured by the form attached to the control. |

## 5.5 Stages and activities

4 step(s).

| Step | Seq | Name | Container | Responsible | Trigger | Preconditions | Inputs | Action performed | Rules | System response | Output | Resulting status | Next step | Alternative next | Dependencies | Controls | Exceptions | Audit event | Evidence | Validation | Sources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STEP-0035 | 1 | Register the file | modules/registry.js | registry workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls createRegistryFile. | Ownership: registry.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:file-registered | Confirmed | No external validation required | SRC-026 SRC-035 |
| STEP-0036 | 2 | Route the file | modules/registry.js | registry workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls createMovement. | Ownership: registry.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:file-routed | Confirmed | No external validation required | SRC-026 SRC-035 |
| STEP-0037 | 3 | Record receipt of the file | modules/registry.js | registry workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls State.patch. | Ownership: registry.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:custody-received | Confirmed | No external validation required | SRC-026 SRC-035 |
| STEP-0038 | 4 | Close the file | modules/registry.js | registry workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls State.patch. | Ownership: registry.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:file-closed | Confirmed | No external validation required | SRC-026 SRC-035 |

## 5.6 Decisions and branches

_No decision point is evidenced in this process._

## 5.7 Business rules and controls

### Controls

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CTRL-043 | Confirmation control | Operator confirmation — Record this minute and send the file on | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |
| CTRL-044 | Confirmation control | Operator confirmation — Record receipt of this file | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |

## 5.8 Outputs and completion

| Attribute | Value |
| --- | --- |
| Primary output | An updated record and an audit entry. |
| Completion criteria | The operator completes one of its governed writes: register-file, route-file, receive-file, close-file. |
| Successful end state | The operator completes one of its governed writes: register-file, route-file, receive-file, close-file. |
| Alternative end states | Not evidenced. |
| Failed end states | Not evidenced. |
| Cancellation outcome | Not evidenced. |
| Residual obligations | Not evidenced. |
| Records created or updated | — |
| Notifications issued | NOTIF-098 Registry files reloaded<br>NOTIF-099 The registry could not be reached — nothing was reloaded<br>NOTIF-100 Official file registered<br>NOTIF-101 Recorded locally; synchronization queued<br>NOTIF-102 Minute recorded and file routed<br>NOTIF-103 Receipt and custody recorded<br>NOTIF-104 Handed to Archive Evidence<br>NOTIF-105 File closed |
| Downstream handoffs | Workspace archive |

## 5.9 Exceptions, failures and recovery

_No exception path is evidenced in this process. Where the process is a request-triggered workflow, that absence is itself recorded in the gap register._

## 5.10 Monitoring, audit and performance

| ID | Kind | Name | Description | Threshold | Escalation threshold | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| MON-034 | Audit event | Audit event audit:file-registered | The governance table binds action 'register-file' to the audit vocabulary 'audit:file-registered'. | — | — | Confirmed |
| MON-035 | Audit event | Audit event audit:file-routed | The governance table binds action 'route-file' to the audit vocabulary 'audit:file-routed'. | — | — | Confirmed |
| MON-036 | Audit event | Audit event audit:custody-received | The governance table binds action 'receive-file' to the audit vocabulary 'audit:custody-received'. | — | — | Confirmed |
| MON-037 | Audit event | Audit event audit:file-closed | The governance table binds action 'close-file' to the audit vocabulary 'audit:file-closed'. | — | — | Confirmed |

### Audit events written by this process

| Step | Audit event |
| --- | --- |
| STEP-0035 Register the file | audit:file-registered |
| STEP-0036 Route the file | audit:file-routed |
| STEP-0037 Record receipt of the file | audit:custody-received |
| STEP-0038 Close the file | audit:file-closed |

## Relationships

### Subprocesses

| ID | Name | Category | Activation |
| --- | --- | --- | --- |
| SUBPROC-003 | Registry Scan Intake | Sub-view of a primary workspace | — |
| SUBPROC-046 | Register the file | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-047 | Route the file | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-048 | Record receipt of the file | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-049 | Close the file | Reusable governed write | An operator activates the control bound to this action. |

### Dependencies

| ID | Supporting | Kind | Type | Direction | Mandatory | Impact if unavailable |
| --- | --- | --- | --- | --- | --- | --- |
| DEP-023 | Endpoint alias DYNAMIC_ACTIONS | Integration | Runtime integration call | Outbound - the workspace calls the endpoint | Not determinable from the call site alone; the governance table states per action whether the backend is required or optional. | The call fails. Whether the operator write survives depends on whether the action declares the backend required or optional. |
| DEP-024 | Workspace archive | Process | Process handoff | Downstream - this workspace sends the operator and the selected record on | Optional: the handoff is taken only on the path that navigates. | The operator cannot complete the onward step from here; the record stays in its current state. |
| DEP-041 | Endpoint DYNAMIC_ACTIONS | Integration | Direct HTTP call to a Power Automate flow | Outbound | Declared in the endpoint registry as a named alias. Whether a given call is mandatory is stated per action in the governance table, not here. | Every call routed through this alias fails. |

## Operational status

_No run record for this process is held among the supplied inputs. Nothing is claimed about whether it executes._
