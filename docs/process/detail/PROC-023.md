# PROC-023 — Administration

> Generated from `docs/reference/process-inventory.json`. Do not edit.
> Back to the [master inventory](../07-MASTER-PROCESS-INVENTORY.md) · [process detail index](../09-PROCESS-DETAIL.md).

## 5.1 Identity and purpose

| Attribute | Value |
| --- | --- |
| Identifier | PROC-023 |
| Name | Administration |
| Alternative or legacy name | Route 'settings' |
| Category | User-initiated · operational |
| Description | Manage profile, settings and users. Restricted to IT — see the System · Restricted group. |
| Description declared in the artifact itself | — |
| Business objective | Manage profile, settings and users. Restricted to IT — see the System · Restricted group. |
| Operational objective | Boundary role 'configuration'. Owns profile, theme, density, endpoint-restore, state-import-export; must not own runtime-certification, live-monitoring. |
| Process owner | The settings module, per the per-action governance table. |
| Criticality | Not evidenced. No supplied artifact grades a workspace by criticality. |
| Business area / group | SYSTEM |
| Related modules | modules/settings.js |
| Related features | profile<br>theme<br>density<br>endpoint-restore<br>state-import-export |
| Evidence classification | Confirmed |
| Evidence note | Declared in the workspace configuration, implemented by a module of the same route name, and bounded by the module boundary charter. |
| Documentation status | Documented in part; named attributes outstanding |
| Validation status | No external validation required |
| Sources | `SRC-036` config/workflow-clarity.config.js<br>`SRC-030` modules/settings.js<br>`SRC-005` config/module-boundaries.config.js |

## 5.2 Participants and responsibilities

| Attribute | Value |
| --- | --- |
| Initiating actor | An operator holding a role with access to this route. |
| Participating roles | systemAdmin<br>userAdmin |
| Accountable owner | The settings module, per the per-action governance table. |
| Supporting systems | DGO Internal Platform<br>Microsoft Power Automate |
| Approval authority | Not evidenced for this process. |
| Escalation authority | Not evidenced for this process. |
| Segregation of duties | Not evidenced. No supplied artifact declares a separation requirement. |

### Responsible actor per step

| Step | Name | Responsible | Kind |
| --- | --- | --- | --- |
| STEP-0053 | Import that file | settings workspace | Manual — operator-initiated |

## 5.3 Initiation and preconditions

| Attribute | Value |
| --- | --- |
| Starting event | An operator opens the route from the sidebar, or another workspace hands them the record. |
| Trigger type | User-initiated · operational |
| Entry criteria | canAccess() admits the role to this route. |
| Required roles and permissions | systemAdmin<br>userAdmin |
| Required configuration | modules/settings.js |
| Required system availability | DGO Internal Platform<br>Microsoft Power Automate |
| Scheduling conditions | None: this process is not scheduled. |

## 5.4 Inputs

| Step | Required inputs |
| --- | --- |
| STEP-0053 | The record the operator has selected, and any values captured by the form attached to the control. |

## 5.5 Stages and activities

1 step(s).

| Step | Seq | Name | Container | Responsible | Trigger | Preconditions | Inputs | Action performed | Rules | System response | Output | Resulting status | Next step | Alternative next | Dependencies | Controls | Exceptions | Audit event | Evidence | Validation | Sources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STEP-0053 | 1 | Import that file | modules/settings.js | settings workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Calls DataReconciler.apply. | Ownership: settings.<br>Backend: none. | Not evidenced for this action. | An updated record in application state. | — | — | — | none | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | audit:state-imported | Confirmed | No external validation required | SRC-030 SRC-035 |

## 5.6 Decisions and branches

_No decision point is evidenced in this process._

## 5.7 Business rules and controls

### Controls

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CTRL-049 | Confirmation control | Operator confirmation — Confirm settings update | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |
| CTRL-050 | Confirmation control | Operator confirmation — Use the installed addresses | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |
| CTRL-051 | Confirmation control | Operator confirmation — Empty every connection address | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |
| CTRL-052 | Confirmation control | Operator confirmation — Clear this device’s saved data | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |

## 5.8 Outputs and completion

| Attribute | Value |
| --- | --- |
| Primary output | An updated record and an audit entry. |
| Completion criteria | The operator completes one of its governed writes: profile, import-state. |
| Successful end state | The operator completes one of its governed writes: profile, import-state. |
| Alternative end states | Not evidenced. |
| Failed end states | Not evidenced. |
| Cancellation outcome | Not evidenced. |
| Residual obligations | Not evidenced. |
| Records created or updated | — |
| Notifications issued | NOTIF-115 Settings saved<br>NOTIF-116 Connection report copied. Signatures are removed, so it is safe to paste to IT support.<br>NOTIF-117 Could not copy. Open System Health (IT only) to read the same report on screen.<br>NOTIF-118 Boxes emptied. Press Review and save to apply it.<br>NOTIF-119 Every connection address is now empty. Nothing has changed yet — press Review and save to apply it.<br>NOTIF-120 This device’s saved data was cleared. Reloading… |
| Downstream handoffs | — |

## 5.9 Exceptions, failures and recovery

_No exception path is evidenced in this process. Where the process is a request-triggered workflow, that absence is itself recorded in the gap register._

## 5.10 Monitoring, audit and performance

| ID | Kind | Name | Description | Threshold | Escalation threshold | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| MON-049 | Audit event | Audit event audit:state-imported | The governance table binds action 'import-state' to the audit vocabulary 'audit:state-imported'. | — | — | Confirmed |

### Audit events written by this process

| Step | Audit event |
| --- | --- |
| STEP-0053 Import that file | audit:state-imported |

## Relationships

### Subprocesses

| ID | Name | Category | Activation |
| --- | --- | --- | --- |
| SUBPROC-005 | User Administration | Sub-view of a primary workspace | — |
| SUBPROC-033 | Save your profile | Reusable governed write | An operator activates the control bound to this action. |
| SUBPROC-066 | Import that file | Reusable governed write | An operator activates the control bound to this action. |

## Operational status

_No run record for this process is held among the supplied inputs. Nothing is claimed about whether it executes._
