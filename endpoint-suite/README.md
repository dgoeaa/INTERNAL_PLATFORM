# Customized Endpoints Management Suite

A single-file browser console for the DGO/NITDA platform's 56 Power Automate–backed endpoints:
inventory, route/discriminator probing, a request console, audit, interval monitoring, in-page
repointing (Estate), a bulk concurrent sweep (Check), and export to OpenAPI/Postman/CSV/curl/env.

This package is the consolidated, security-corrected successor to three prior tools —
Bespoke Implementation Console ECM2, ECM3, and the DGO Enterprise Endpoint Workbench (R12) —
merged via the R14 package and re-verified/repaired here. Full detail, including what changed
and why, is in [`reports/CONSOLIDATION_REPORT.md`](reports/CONSOLIDATION_REPORT.md).

## Quick start

**Just browsing / structural checks (no live credentials needed):**

```
open app/index.html      # or double-click it — no server, no build step
```

Every tab works immediately. Probes will report `no live url` because the shipped registry has
every signature redacted — that's intentional (see Security, below).

**Probing your tenant for real:**

1. In Power Automate, open each flow's HTTP trigger → "Get callback URL" → copy the rotated
   `sig=` value. (Every signature that has ever shipped in any export of this tool — including
   this one's own redacted files — has been circulated in plain text and must be rotated first;
   see report §13.)
2. Either:
   - Copy `config/config.local.example.js` → `config/config.local.js`, fill in the rotated
     signatures, and open it as a local reference while you fill in the app's file loader; or
   - Build a JSON file shaped `{"keys":[{"key":"FETCH_ALL","url":"https://...&sig=...","signed":true}, ...]}`
     from your rotated URLs.
3. In `app/index.html`, go to **Overview → Load a local registry**, pick that JSON file. It's
   read with `FileReader` only — nothing is uploaded, nothing is written back into this
   repository, and it's cleared the moment you refresh the page.
4. Every other tab now shows a "live" pill for keys you loaded, and Console/Check/Monitor/Estate
   will call the real endpoint.

**From the command line / CI:**

```
node tools/run-contract-probes.js registry/unified-registry.redacted.json read \
  --local /path/to/your/gitignored-local-registry.json \
  --concurrency 4 --retries 1 --timeout 20000
```

Omit `--local` to run structurally against the redacted registry (every result will read
`no live url` — useful for confirming the tool itself still runs in CI without ever needing a
secret in the pipeline).

## Layout

```
app/index.html                  the runtime — open this
registry/unified-registry.redacted.json   56 keys / 81 routes / 47 flows, fully redacted
config/runtime.config.redacted.js         same data, as a loadable JS config
config/config.local.example.js            template for your own rotated signatures (copy, don't edit in place)
tools/run-contract-probes.js              CLI probe engine (concurrency/retry/timeout/pacing)
tests/contract-probes.redacted.json       fixture set for the contract-testing story
exports/redacted/                         pre-built OpenAPI 3.1 / Postman / CSV / curl-book / .env
reports/CONSOLIDATION_REPORT.md           the full 14-section consolidation & readiness report
.gitignore                                blocks *.full.*, *.local.*, and any private/ dir from ever being committed
```

## Security

Every Power Automate trigger URL's `sig=` parameter is a bearer credential — holding it is
sufficient to invoke the flow. Nothing in this directory, as committed, carries a live one
(verified — see report §12/§13). `config/config.local.js` and any `*.full.*` / `*.local.*` /
`private/` file are git-ignored by design; never remove those `.gitignore` entries, and never
paste a filled-in `config.local.js` or a live registry export into a chat, ticket, or commit.
