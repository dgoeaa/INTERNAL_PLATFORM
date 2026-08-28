# PROC-022 — Operator HUD

> Generated from `docs/reference/process-inventory.json`. Do not edit.
> Back to the [master inventory](../07-MASTER-PROCESS-INVENTORY.md) · [process detail index](../09-PROCESS-DETAIL.md).

## 5.1 Identity and purpose

| Attribute | Value |
| --- | --- |
| Identifier | PROC-022 |
| Name | Operator HUD |
| Alternative or legacy name | Route 'operator-hud' |
| Category | User-initiated · operational |
| Description | Runtime and integration health at a glance while operating the platform. |
| Description declared in the artifact itself | — |
| Business objective | Runtime and integration health at a glance while operating the platform. |
| Operational objective | Boundary role 'runtime-monitoring'. Owns sync-status, pending-queue, runtime-load, operator-alerts; must not own configuration-edit, release-certification. |
| Process owner | — |
| Criticality | Not evidenced. No supplied artifact grades a workspace by criticality. |
| Business area / group | SYSTEM |
| Related modules | modules/operator-hud.js |
| Related features | sync-status<br>pending-queue<br>runtime-load<br>operator-alerts |
| Evidence classification | Confirmed |
| Evidence note | Declared in the workspace configuration, implemented by a module of the same route name, and bounded by the module boundary charter. |
| Documentation status | Documented in part; named attributes outstanding |
| Validation status | No external validation required |
| Sources | `SRC-036` config/workflow-clarity.config.js<br>`SRC-023` modules/operator-hud.js<br>`SRC-005` config/module-boundaries.config.js |

## 5.2 Participants and responsibilities

| Attribute | Value |
| --- | --- |
| Initiating actor | An operator holding a role with access to this route. |
| Participating roles | systemAdmin<br>userAdmin |
| Accountable owner | Not evidenced — recorded as an ownership gap. |
| Supporting systems | DGO Internal Platform |
| Approval authority | Not evidenced for this process. |
| Escalation authority | Not evidenced for this process. |
| Segregation of duties | Not evidenced. No supplied artifact declares a separation requirement. |

## 5.3 Initiation and preconditions

| Attribute | Value |
| --- | --- |
| Starting event | An operator opens the route from the sidebar, or another workspace hands them the record. |
| Trigger type | User-initiated · operational |
| Entry criteria | canAccess() admits the role to this route. |
| Required roles and permissions | systemAdmin<br>userAdmin |
| Required configuration | modules/operator-hud.js |
| Required system availability | DGO Internal Platform |
| Scheduling conditions | None: this process is not scheduled. |

## 5.4 Inputs

_No step-level inputs are evidenced for this process._

## 5.5 Stages and activities

_No steps are readable for this process from the supplied inputs. See the gap register._

## 5.6 Decisions and branches

_No decision point is evidenced in this process._

## 5.7 Business rules and controls

_No rule or control is bound to this process in the supplied inputs._

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
| Notifications issued | NOTIF-085 Synchronization completed |
| Downstream handoffs | — |

## 5.9 Exceptions, failures and recovery

_No exception path is evidenced in this process. Where the process is a request-triggered workflow, that absence is itself recorded in the gap register._

## 5.10 Monitoring, audit and performance

_No monitoring control, metric, service-level expectation or audit event is evidenced for this process._

## Relationships

_No subprocess, variant or dependency is recorded against this process._

## Operational status

_No run record for this process is held among the supplied inputs. Nothing is claimed about whether it executes._
