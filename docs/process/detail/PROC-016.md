# PROC-016 — Reports

> Generated from `docs/reference/process-inventory.json`. Do not edit.
> Back to the [master inventory](../07-MASTER-PROCESS-INVENTORY.md) · [process detail index](../09-PROCESS-DETAIL.md).

## 5.1 Identity and purpose

| Attribute | Value |
| --- | --- |
| Identifier | PROC-016 |
| Name | Reports |
| Alternative or legacy name | Route 'reports' |
| Category | User-initiated · operational |
| Description | Generate and export operational reports drawn from tracking and management views. |
| Description declared in the artifact itself | — |
| Business objective | Generate and export operational reports drawn from tracking and management views. |
| Operational objective | Boundary role 'report-export-authority'. Owns generate-report, print, export, email-report, evidence-report; must not own live-monitoring, archive-execution. |
| Process owner | The reports module, per the per-action governance table. |
| Criticality | Not evidenced. No supplied artifact grades a workspace by criticality. |
| Business area / group | CONTROL |
| Related modules | modules/reports.js |
| Related features | generate-report<br>print<br>export<br>email-report<br>evidence-report |
| Evidence classification | Confirmed |
| Evidence note | Declared in the workspace configuration, implemented by a module of the same route name, and bounded by the module boundary charter. |
| Documentation status | Documented in part; named attributes outstanding |
| Validation status | No external validation required |
| Sources | `SRC-036` config/workflow-clarity.config.js<br>`SRC-027` modules/reports.js<br>`SRC-005` config/module-boundaries.config.js |

## 5.2 Participants and responsibilities

| Attribute | Value |
| --- | --- |
| Initiating actor | An operator holding a role with access to this route. |
| Participating roles | systemAdmin<br>executive<br>director<br>viewer |
| Accountable owner | The reports module, per the per-action governance table. |
| Supporting systems | DGO Internal Platform<br>Microsoft Power Automate |
| Approval authority | Not evidenced for this process. |
| Escalation authority | Not evidenced for this process. |
| Segregation of duties | Not evidenced. No supplied artifact declares a separation requirement. |

## 5.3 Initiation and preconditions

| Attribute | Value |
| --- | --- |
| Starting event | An operator opens the route from the sidebar, or another workspace hands them the record. |
| Trigger type | User-initiated · operational |
| Entry criteria | canAccess() admits the role to this route. |
| Required roles and permissions | systemAdmin<br>executive<br>director<br>viewer |
| Required configuration | modules/reports.js |
| Required system availability | DGO Internal Platform<br>Microsoft Power Automate |
| Scheduling conditions | None: this process is not scheduled. |

## 5.4 Inputs

_No step-level inputs are evidenced for this process._

## 5.5 Stages and activities

_No steps are readable for this process from the supplied inputs. See the gap register._

## 5.6 Decisions and branches

_No decision point is evidenced in this process._

## 5.7 Business rules and controls

### Controls

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CTRL-045 | Confirmation control | Operator confirmation — Send this report by email | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |

## 5.8 Outputs and completion

| Attribute | Value |
| --- | --- |
| Primary output | An updated record and an audit entry. |
| Completion criteria | The operator completes one of its governed writes: generate-report. |
| Successful end state | The operator completes one of its governed writes: generate-report. |
| Alternative end states | Not evidenced. |
| Failed end states | Not evidenced. |
| Cancellation outcome | Not evidenced. |
| Residual obligations | Not evidenced. |
| Records created or updated | — |
| Notifications issued | NOTIF-106 There is nothing to print — no record falls inside the dates chosen<br>NOTIF-107 There is nothing to download — no record falls inside the dates chosen<br>NOTIF-108 Report sent by email<br>NOTIF-109 The report could not be sent right now — it is queued and will go out when the connection is back |
| Downstream handoffs | — |

## 5.9 Exceptions, failures and recovery

_No exception path is evidenced in this process. Where the process is a request-triggered workflow, that absence is itself recorded in the gap register._

## 5.10 Monitoring, audit and performance

_No monitoring control, metric, service-level expectation or audit event is evidenced for this process._

## Relationships

### Subprocesses

| ID | Name | Category | Activation |
| --- | --- | --- | --- |
| SUBPROC-027 | Produce the report | Reusable governed write | An operator activates the control bound to this action. |

### Dependencies

| ID | Supporting | Kind | Type | Direction | Mandatory | Impact if unavailable |
| --- | --- | --- | --- | --- | --- | --- |
| DEP-025 | Endpoint alias EMAIL | Integration | Runtime integration call | Outbound - the workspace calls the endpoint | Not determinable from the call site alone; the governance table states per action whether the backend is required or optional. | The call fails. Whether the operator write survives depends on whether the action declares the backend required or optional. |
| DEP-042 | Endpoint EMAIL | Integration | Direct HTTP call to a Power Automate flow | Outbound | Declared in the endpoint registry as a named alias. Whether a given call is mandatory is stated per action in the governance table, not here. | Every call routed through this alias fails. |

## Operational status

_No run record for this process is held among the supplied inputs. Nothing is claimed about whether it executes._
