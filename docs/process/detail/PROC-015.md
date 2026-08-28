# PROC-015 — Projects

> Generated from `docs/reference/process-inventory.json`. Do not edit.
> Back to the [master inventory](../07-MASTER-PROCESS-INVENTORY.md) · [process detail index](../09-PROCESS-DETAIL.md).

## 5.1 Identity and purpose

| Attribute | Value |
| --- | --- |
| Identifier | PROC-015 |
| Name | Projects |
| Alternative or legacy name | Route 'projects' |
| Category | User-initiated · operational |
| Description | A register of projects and the measures they are tracked against. |
| Description declared in the artifact itself | — |
| Business objective | A register of projects and the measures they are tracked against. |
| Operational objective | Boundary role 'project-register'. Owns create-project, update-project; must not own intake-master, registry-custody, task-execution, archive-execution. |
| Process owner | The projects module, per the per-action governance table. |
| Criticality | Not evidenced. No supplied artifact grades a workspace by criticality. |
| Business area / group | CONTROL |
| Related modules | modules/projects.js |
| Related features | create-project<br>update-project |
| Evidence classification | Confirmed |
| Evidence note | Declared in the workspace configuration, implemented by a module of the same route name, and bounded by the module boundary charter. |
| Documentation status | Documented in part; named attributes outstanding |
| Validation status | No external validation required |
| Sources | `SRC-036` config/workflow-clarity.config.js<br>`SRC-025` modules/projects.js<br>`SRC-005` config/module-boundaries.config.js |

## 5.2 Participants and responsibilities

| Attribute | Value |
| --- | --- |
| Initiating actor | An operator holding a role with access to this route. |
| Participating roles | systemAdmin<br>executive<br>director<br>operator |
| Accountable owner | The projects module, per the per-action governance table. |
| Supporting systems | DGO Internal Platform<br>Microsoft Power Automate |
| Approval authority | Not evidenced for this process. |
| Escalation authority | Not evidenced for this process. |
| Segregation of duties | Not evidenced. No supplied artifact declares a separation requirement. |

### Responsible actor per step

| Step | Name | Responsible | Kind |
| --- | --- | --- | --- |
| STEP-0046 | Create the project | projects workspace | Manual — operator-initiated |
| STEP-0047 | Update the project | projects workspace | Manual — operator-initiated |

## 5.3 Initiation and preconditions

| Attribute | Value |
| --- | --- |
| Starting event | An operator opens the route from the sidebar, or another workspace hands them the record. |
| Trigger type | User-initiated · operational |
| Entry criteria | canAccess() admits the role to this route. |
| Required roles and permissions | systemAdmin<br>executive<br>director<br>operator |
| Required configuration | modules/projects.js |
| Required system availability | DGO Internal Platform<br>Microsoft Power Automate |
| Scheduling conditions | None: this process is not scheduled. |

## 5.4 Inputs

| Step | Required inputs |
| --- | --- |
| STEP-0046 | The record the operator has selected, and any values captured by the form attached to the control. |
| STEP-0047 | The record the operator has selected, and any values captured by the form attached to the control. |

## 5.5 Stages and activities

2 step(s).

| Step | Seq | Name | Container | Responsible | Trigger | Preconditions | Inputs | Action performed | Rules | System response | Output | Resulting status | Next step | Alternative next | Dependencies | Controls | Exceptions | Audit event | Evidence | Validation | Sources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STEP-0046 | 1 | Create the project | modules/projects.js | projects workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls Projects.create. | Ownership: projects.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:project-created | Confirmed | No external validation required | SRC-025 SRC-035 |
| STEP-0047 | 2 | Update the project | modules/projects.js | projects workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls Projects.update. | Ownership: projects.<br>Backend: DYNAMIC_ACTIONS.optional. | A backend call on DYNAMIC_ACTIONS is attempted; the local record stands when it fails and synchronisation is queued. | An updated record in application state. | — | — | — | DYNAMIC_ACTIONS | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:project-updated | Confirmed | No external validation required | SRC-025 SRC-035 |

## 5.6 Decisions and branches

_No decision point is evidenced in this process._

## 5.7 Business rules and controls

### Controls

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CTRL-041 | Confirmation control | Operator confirmation — Add this project to the register | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |
| CTRL-042 | Confirmation control | Operator confirmation — Save these changes to the project | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |

## 5.8 Outputs and completion

| Attribute | Value |
| --- | --- |
| Primary output | An updated record and an audit entry. |
| Completion criteria | The operator completes one of its governed writes: create-project, update-project. |
| Successful end state | The operator completes one of its governed writes: create-project, update-project. |
| Alternative end states | Not evidenced. |
| Failed end states | Not evidenced. |
| Cancellation outcome | Not evidenced. |
| Residual obligations | Not evidenced. |
| Records created or updated | — |
| Notifications issued | NOTIF-092 Projects reloaded from the registry<br>NOTIF-093 The registry could not be reached — nothing was reloaded<br>NOTIF-094 Saved locally; synchronization queued<br>NOTIF-095 Project added<br>NOTIF-096 Updated locally; synchronization queued<br>NOTIF-097 Project updated |
| Downstream handoffs | — |

## 5.9 Exceptions, failures and recovery

_No exception path is evidenced in this process. Where the process is a request-triggered workflow, that absence is itself recorded in the gap register._

## 5.10 Monitoring, audit and performance

| ID | Kind | Name | Description | Threshold | Escalation threshold | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| MON-042 | Audit event | Audit event audit:project-created | The governance table binds action 'create-project' to the audit vocabulary 'audit:project-created'. | — | — | Confirmed |
| MON-043 | Audit event | Audit event audit:project-updated | The governance table binds action 'update-project' to the audit vocabulary 'audit:project-updated'. | — | — | Confirmed |

### Audit events written by this process

| Step | Audit event |
| --- | --- |
| STEP-0046 Create the project | audit:project-created |
| STEP-0047 Update the project | audit:project-updated |

## Relationships

### Subprocesses

| ID | Name | Category | Activation |
| --- | --- | --- | --- |
| SUBPROC-013 | Create the project | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-014 | Update the project | Reusable governed write | An operator activates the control bound to this action. |

### Dependencies

| ID | Supporting | Kind | Type | Direction | Mandatory | Impact if unavailable |
| --- | --- | --- | --- | --- | --- | --- |
| DEP-022 | Endpoint alias DYNAMIC_ACTIONS | Integration | Runtime integration call | Outbound - the workspace calls the endpoint | Not determinable from the call site alone; the governance table states per action whether the backend is required or optional. | The call fails. Whether the operator write survives depends on whether the action declares the backend required or optional. |
| DEP-041 | Endpoint DYNAMIC_ACTIONS | Integration | Direct HTTP call to a Power Automate flow | Outbound | Declared in the endpoint registry as a named alias. Whether a given call is mandatory is stated per action in the governance table, not here. | Every call routed through this alias fails. |

## Operational status

_No run record for this process is held among the supplied inputs. Nothing is claimed about whether it executes._
