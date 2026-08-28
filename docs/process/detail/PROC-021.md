# PROC-021 — Assistant

> Generated from `docs/reference/process-inventory.json`. Do not edit.
> Back to the [master inventory](../07-MASTER-PROCESS-INVENTORY.md) · [process detail index](../09-PROCESS-DETAIL.md).

## 5.1 Identity and purpose

| Attribute | Value |
| --- | --- |
| Identifier | PROC-021 |
| Name | Assistant |
| Alternative or legacy name | Route 'assistant' |
| Category | User-initiated · operational |
| Description | Contextual guidance for the DGO operating model — not a module of record. |
| Business objective | Contextual guidance for the DGO operating model — not a module of record. |
| Operational objective | Boundary role 'governed-ai-assist'. Owns ask, summarize, suggest-next-action; must not own raw-state-access, unauthorized-action. |
| Process owner | — |
| Criticality | Not evidenced. No supplied artifact grades a workspace by criticality. |
| Business area / group | SYSTEM |
| Related modules | modules/assistant.js |
| Related features | ask<br>summarize<br>suggest-next-action |
| Evidence classification | Confirmed |
| Evidence note | Declared in the workspace configuration, implemented by a module of the same route name, and bounded by the module boundary charter. |
| Documentation status | Documented in part; named attributes outstanding |
| Validation status | No external validation required |
| Sources | `SRC-036` config/workflow-clarity.config.js<br>`SRC-009` modules/assistant.js<br>`SRC-005` config/module-boundaries.config.js |

## 5.2 Participants and responsibilities

| Attribute | Value |
| --- | --- |
| Initiating actor | An operator holding a role with access to this route. |
| Participating roles | systemAdmin<br>executive<br>director<br>operator |
| Accountable owner | Not evidenced — recorded as an ownership gap. |
| Supporting systems | DGO Internal Platform |
| Approval authority | Not evidenced for this process. |
| Escalation authority | Not evidenced for this process. |
| Segregation of duties | Not evidenced. No supplied artifact declares a separation requirement. |

### Responsible actor per step

| Step | Name | Responsible | Kind |
| --- | --- | --- | --- |
| STEP-0007 | ask | assistant workspace | Manual — operator-initiated |

## 5.3 Initiation and preconditions

| Attribute | Value |
| --- | --- |
| Starting event | An operator opens the route from the sidebar, or another workspace hands them the record. |
| Trigger type | User-initiated · operational |
| Entry criteria | canAccess() admits the role to this route. |
| Required roles and permissions | systemAdmin<br>executive<br>director<br>operator |
| Required configuration | modules/assistant.js |
| Required system availability | DGO Internal Platform |
| Scheduling conditions | None: this process is not scheduled. |

## 5.4 Inputs

| Step | Required inputs |
| --- | --- |
| STEP-0007 | The record the operator has selected, and any values captured by the form attached to the control. |

## 5.5 Stages and activities

1 step(s).

| Step | Seq | Name | Container | Responsible | Trigger | Preconditions | Inputs | Action performed | Rules | System response | Output | Resulting status | Next step | Alternative next | Dependencies | Controls | Exceptions | Audit event | Evidence | Validation | Sources |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| STEP-0007 | 1 | ask | modules/assistant.js | assistant workspace | An operator activates the control that raises this action. | The action is owned by this workspace.<br>The operator reaches the route, which canAccess() gates on their role. | The record the operator has selected, and any values captured by the form attached to the control. | Performs the governed write declared for this action. | — | Not evidenced for this action. | An updated record in application state. | — | — | — | — | Governed through executeOwnedAction(), which refuses an action a module does not own and is not an allowed invoker of. | — | — | Partially evidenced | No external validation required | SRC-009 |

## 5.6 Decisions and branches

_No decision point is evidenced in this process._

## 5.7 Business rules and controls

### Rules

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Owner | Evidence | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RULE-013 | Routing rule | Support routing — Access Error | Support requests of category 'Access Error' are routed to assistant. | A support request is raised. | category = 'access-error' | Route to assistant at severity high. | The request appears in the receiving workspace. | Not evidenced for a category the table does not carry. | — | Confirmed | — |

### Controls

| ID | Type | Name | Description | Trigger | Condition | Expected behaviour | Outcome | Exception | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CTRL-018 | Confirmation control | Operator confirmation — Send this to the support team | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |
| CTRL-019 | Confirmation control | Operator confirmation — Send this question to the assistant | The operator is shown what is about to happen and must confirm before the write is attempted. | The operator activates the control this dialog guards. | Confirmation is given. | The governed write proceeds. | Declining returns to the workspace with nothing written. | Not evidenced beyond the decline path. | Confirmed |

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
| Notifications issued | NOTIF-014 Write what you need help with first<br>NOTIF-015 Support request sent<br>NOTIF-016 Your support request could not be sent — try again in a moment<br>NOTIF-017 Answer received<br>NOTIF-018 The assistant could not answer |
| Downstream handoffs | — |

## 5.9 Exceptions, failures and recovery

_No exception path is evidenced in this process. Where the process is a request-triggered workflow, that absence is itself recorded in the gap register._

## 5.10 Monitoring, audit and performance

_No monitoring control, metric, service-level expectation or audit event is evidenced for this process._

## Relationships

### Variants

| ID | Name | Kind | Differs from the primary path | Activation |
| --- | --- | --- | --- | --- |
| VAR-009 | Support request — Access Error | Conditional variant selected by the reported category | A support request of category 'Access Error' is routed to the assistant workspace at severity high, rather than into a single support queue. | The requester selects category 'access-error'. |

## Operational status

_No run record for this process is held among the supplied inputs. Nothing is claimed about whether it executes._
