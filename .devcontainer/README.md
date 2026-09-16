# Codespace

## Opening one

This configuration is in the branch; creating the Codespace is a step you take, because
nothing in this repository can create one for you.

- **GitHub UI** — Code ▸ Codespaces ▸ *Create codespace on
  `claude/coverage-scope-comparison-x5vnev`*
- **CLI** — `gh codespace create -R dgoeaa/INTERNAL_PLATFORM -b claude/coverage-scope-comparison-x5vnev`

`onCreateCommand` runs `.devcontainer/setup.sh`, which checks Node, warms the static
server, installs `openpyxl`, and runs the full verification gate. If the gate fails the
Codespace is not ready, and that is deliberate.

## What is runnable in this branch

**One platform, not several.** `index.html` at the root is the internal operator platform —
DGO Digital OPS, a static ES-module browser application with no build step and no server of
its own. The repository *is* the deployment: what is committed is what is served.

The estate register names a second platform, `portal`, whose 8 endpoint keys are declared in
`document-portal/config.example.js`. **That directory does not exist in this branch** —
there is exactly one HTML file here. The portal is a separate application, and no Codespace
built from this branch can run it.

Alongside the platform, `docs/endpoint-estate/tools` is a Python pipeline that builds and
checks the endpoint-estate workbook. The container installs Python for it.

## Commands

| Command | What it does |
| --- | --- |
| `npm start` | Serves the platform on port 8080, forwarded and opened automatically |
| `npm test` | The full verification gate — the same one CI runs |
| `npm run test:secrets` | Credential scan on its own |
| `npm run test:imports` / `:entry` / `:syntax` | The other gates individually |
| `npm run config:local` | Writes `config/config.local.js` from the example — placeholders only |
| `npm run estate:report` | Duplication and cross-source report on the workbook |
| `npm run estate:verify` | Verifies the workbook against its four sources (see below) |

The same commands are VS Code tasks. *Serve the platform* runs on folder open, and the
`Open the platform in a browser` launch configuration starts it and attaches a browser.

## Two things the Codespace deliberately does not have

**Endpoint credentials.** `config/config.local.js` is git-ignored and is not created for
you. A signed Power Automate URL is a bearer credential; possession alone authorises
invoking the flow. The platform boots without the file — `tests/verify.mjs` asserts exactly
that — and every endpoint call fails until you supply your own rotated URLs.
`npm run config:local` writes the placeholder shape, never real values.

**The four source workbooks.** They are not committed, because one of them carries a live
signature. `npm run estate:report` needs only the committed workbook and works out of the
box. `npm run estate:verify` and `npm run estate:audit` compare against the sources, so
point them at a local copy first:

```sh
export ESTATE_SOURCE_DIR=/path/to/the/four/source/workbooks
npm run estate:verify
```
