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
