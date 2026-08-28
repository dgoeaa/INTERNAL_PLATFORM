# PROC-024 — System Health

> Generated from `docs/reference/process-inventory.json`. Do not edit.
> Back to the [master inventory](../07-MASTER-PROCESS-INVENTORY.md) · [process detail index](../09-PROCESS-DETAIL.md).

## 5.1 Identity and purpose

| Attribute | Value |
| --- | --- |
| Identifier | PROC-024 |
| Name | System Health |
| Alternative or legacy name | Route 'diagnostics' |
| Category | User-initiated · operational |
| Description | System health, connectivity and configuration checks. Restricted to IT. |
| Description declared in the artifact itself | — |
| Business objective | System health, connectivity and configuration checks. Restricted to IT. |
| Operational objective | Boundary role 'certification-health'. Owns run-checks, contract-health, route-health, governance-health, release-blockers; must not own configuration-edit, business-action. |
| Process owner | The diagnostics module, per the per-action governance table. |
| Criticality | Not evidenced. No supplied artifact grades a workspace by criticality. |
| Business area / group | SYSTEM |
| Related modules | modules/diagnostics.js |
| Related features | run-checks<br>contract-health<br>route-health<br>governance-health<br>release-blockers |
| Evidence classification | Confirmed |
| Evidence note | Declared in the workspace configuration, implemented by a module of the same route name, and bounded by the module boundary charter. |
| Documentation status | Documented in part; named attributes outstanding |
| Validation status | No external validation required |
| Sources | `SRC-036` config/workflow-clarity.config.js<br>`SRC-015` modules/diagnostics.js<br>`SRC-005` config/module-boundaries.config.js |

## 5.2 Participants and responsibilities

| Attribute | Value |
| --- | --- |
| Initiating actor | An operator holding a role with access to this route. |
| Participating roles | systemAdmin<br>userAdmin |
| Accountable owner | The diagnostics module, per the per-action governance table. |
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
| Required roles and permissions | systemAdmin<br>userAdmin |
| Required configuration | modules/diagnostics.js |
| Required system availability | DGO Internal Platform<br>Microsoft Power Automate |
| Scheduling conditions | None: this process is not scheduled. |

## 5.4 Inputs

_No step-level inputs are evidenced for this process._

## 5.5 Stages and activities

_No steps are readable for this process from the supplied inputs. See the gap register._

## 5.6 Decisions and branches

_No decision point is evidenced in this process._

## 5.7 Business rules and controls

### Rules

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Owner | Evidence | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RULE-017 | Routing rule | Support routing — Offline / Queue Issue | Support requests of category 'Offline / Queue Issue' are routed to diagnostics. | A support request is raised. | category = 'offline-queue' | Route to diagnostics at severity high. | The request appears in the receiving workspace. | Not evidenced for a category the table does not carry. | — | Confirmed | — |

## 5.8 Outputs and completion

| Attribute | Value |
| --- | --- |
| Primary output | An updated record and an audit entry. |
| Completion criteria | The operator completes one of its governed writes: run-checks. |
| Successful end state | The operator completes one of its governed writes: run-checks. |
| Alternative end states | Not evidenced. |
| Failed end states | Not evidenced. |
| Cancellation outcome | Not evidenced. |
| Residual obligations | Not evidenced. |
| Records created or updated | — |
| Notifications issued | NOTIF-051 Receipt ledger cleared |
| Downstream handoffs | — |

## 5.9 Exceptions, failures and recovery

_No exception path is evidenced in this process. Where the process is a request-triggered workflow, that absence is itself recorded in the gap register._

## 5.10 Monitoring, audit and performance

_No monitoring control, metric, service-level expectation or audit event is evidenced for this process._

## Relationships

### Subprocesses

| ID | Name | Category | Activation |
| --- | --- | --- | --- |
| SUBPROC-028 | Run the system checks | Reusable governed write | An operator activates the control bound to this action. |

### Variants

| ID | Name | Kind | Differs from the primary path | Activation |
| --- | --- | --- | --- | --- |
| VAR-016 | Support request — Offline / Queue Issue | Conditional variant selected by the reported category | A support request of category 'Offline / Queue Issue' is routed to the diagnostics workspace at severity high, rather than into a single support queue. | The requester selects category 'offline-queue'. |

## Operational status

_No run record for this process is held among the supplied inputs. Nothing is claimed about whether it executes._
