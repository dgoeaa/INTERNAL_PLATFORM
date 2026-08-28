# Process documentation package

> **Generated.** `npm run process:discover` builds `docs/reference/process-inventory.json` from the
> artifacts in this repository; `npm run process:docs` renders these documents from it. Do not edit
> any file in this directory: edit the artifact, or the script that reads it, and regenerate.
> `npm test` fails if the committed inventory has drifted from what the sources say.

Inventory generated 2026-08-28. Standard `dgo-process-documentation/v2`.

| # | Document | What it carries |
| --- | --- | --- |
| 1 | [Executive summary](01-EXECUTIVE-SUMMARY.md) | What was found, how strongly it is evidenced, and the four findings that matter most. |
| 2 | [Scope and assessment boundaries](02-SCOPE-AND-BOUNDARIES.md) | What was reviewed, what was excluded and why, and what could not be reached. |
| 3 | [Source inventory](03-SOURCE-INVENTORY.md) | All 60 artifacts read. |
| 4 | [Review methodology](04-METHODOLOGY.md) | How each kind of artifact was read, and the rule applied when evidence ran out. |
| 5 | [Evidence-classification framework](05-EVIDENCE-FRAMEWORK.md) | The seven classifications, the validation statuses and the ownership types. |
| 6 | [Enterprise process architecture](06-PROCESS-ARCHITECTURE.md) | 2 systems, 29 modules, and the estate context diagram. |
| 7 | [Master process inventory](07-MASTER-PROCESS-INVENTORY.md) | 24 processes with their twenty-two attributes. |
| 8 | [Process hierarchy](08-PROCESS-HIERARCHY.md) | Parentage for every process and subprocess. |
| 9 | [Detailed process documentation](09-PROCESS-DETAIL.md) | One file per process, ten sections each. |
| 10 | [Subprocess and variant catalogue](10-SUBPROCESS-AND-VARIANT-CATALOGUE.md) | 66 subprocesses, 18 variants. |
| 11 | [Process-step catalogue](11-PROCESS-STEP-CATALOGUE.md) | 58 steps. |
| 12 | [Business-rule and control catalogue](12-RULE-AND-CONTROL-CATALOGUE.md) | 19 rules, 58 controls. |
| 13 | [Roles and responsibility matrix](13-ROLES-AND-RESPONSIBILITY-MATRIX.md) | 10 roles and personas, and the access matrix. |
| 14 | [Status and transition catalogue](14-STATUS-AND-TRANSITION-CATALOGUE.md) | 43 states, 56 transitions, across two models. |
| 15 | [Integration-supported process catalogue](15-INTEGRATION-CATALOGUE.md) | 0 published contracts and the connectors in use. |
| 16 | [Process relationship and dependency map](16-DEPENDENCY-MAP.md) | 52 dependencies and the handoff map. |
| 17 | [Exception, failure and recovery catalogue](17-EXCEPTION-AND-RECOVERY-CATALOGUE.md) | 0 recovery paths. |
| 18 | [Notification and escalation catalogue](18-NOTIFICATION-AND-ESCALATION-CATALOGUE.md) | 139 notification points. |
| 19 | [Monitoring, audit and performance catalogue](19-MONITORING-AUDIT-AND-PERFORMANCE.md) | 60 monitoring records and every audit event. |
| 20 | [End-to-end process diagrams](20-PROCESS-DIAGRAMS.md) | Eight diagrams drawn, four named and not drawn, with the reason. |
| 21 | [Traceability matrix](21-TRACEABILITY-MATRIX.md) | 58 chains from source evidence to exception path. |
| 22 | [Gap, conflict and validation register](22-GAP-CONFLICT-AND-VALIDATION-REGISTER.md) | 28 gaps with fifteen attributes each. |
| 23 | [Coverage and reconciliation matrix](23-COVERAGE-AND-RECONCILIATION.md) | Every source accounted for, every process reconciled. |
| 24 | [Completeness and consistency review](24-COMPLETENESS-AND-CONSISTENCY-REVIEW.md) | The twenty-five required checks, executed. |
| 25 | [Prioritized recommendations](25-RECOMMENDATIONS.md) | What to do next, with the owner each item needs. |
| 26 | [Final status and confidence statement](26-STATUS-AND-CONFIDENCE.md) | What this package may and may not be relied on for. |
| 27 | [Source register and evidence index](27-SOURCE-REGISTER.md) | Every record resting on every source. |
| 28 | [Terminology and cross-reference index](28-TERMINOLOGY-AND-INDEX.md) | Vocabulary and the identifier scheme. |

## Scope of this copy

This is the **internal platform** copy of the process documentation package. It is generated in
`dgoeaa/INTERNAL_PLATFORM`, the deployed operator frontend, and it covers exactly what this
repository holds: the twenty-four workspaces and their modules, the governed action model, the
correspondence lifecycle, the role and access model, the routing and retention rules, and the
endpoint aliases the client calls.

It does **not** hold the flow estate exports, the published integration contracts, the captured
run records, the system-of-record inventory or the architecture pack. So the coverage register
below records those classes as absent — and absent here means absent *from this repository*, not
undocumented. The same scripts run in `dgoeaa/ecm_docs_dev`, which holds all of them, and the
estate-wide package generated there catalogues the flow estate action by action, the contracts
field by field, and the run records outcome by outcome.

The `config/`, `core/` and `modules/` trees are byte-identical between the two repositories, so
the workspace, lifecycle, rule and role records in this copy and in that one agree by
construction rather than by maintenance. Where the two disagree on anything else, the
estate-wide copy is authoritative: it is generated from strictly more evidence.

**Regenerating.** Neither script has a dependency outside Node's standard library:

```
node scripts/process-discovery.mjs        # rebuild docs/reference/process-inventory.json
node scripts/process-docs.mjs             # render this package from it
node tests/process-docs.test.mjs          # staleness, identifiers, references, the 25 checks
```

## Where to start

- **Deciding whether to rely on this** — document 26, then 24.
- **Understanding the estate** — document 6, then 8, then 7.
- **Working on one process** — document 9, which links to that process's own file.
- **Fixing what is missing** — document 22, then 25.
