#!/usr/bin/env node
// CEMS contract-probe CLI. Mirrors the browser Check tab's probe engine so a
// CI job or terminal session can run the same sweep headlessly.
//
// Usage:
//   node tools/run-contract-probes.js [registryPath] [scope] [--local overridePath] [--concurrency N] [--retries N] [--timeout ms] [--pace ms]
//
// registryPath defaults to ../registry/unified-registry.redacted.json, which
// ships with every signature replaced by the literal string "«redacted»" and
// therefore cannot authenticate against Power Automate. Pass your own
// git-ignored full/local registry (or --local) to probe live endpoints; see
// config/config.local.example.js and reports/CONSOLIDATION_REPORT.md
// section 13 for how to obtain and rotate those signatures safely.
'use strict';
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = { registryPath: null, scope: 'read', local: null, concurrency: 4, retries: 1, timeoutMs: 20000, paceMs: 0 };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--local') out.local = argv[++i];
    else if (a === '--concurrency') out.concurrency = Number(argv[++i]);
    else if (a === '--retries') out.retries = Number(argv[++i]);
    else if (a === '--timeout') out.timeoutMs = Number(argv[++i]);
    else if (a === '--pace') out.paceMs = Number(argv[++i]);
    else positional.push(a);
  }
  out.registryPath = positional[0] || path.join(__dirname, '..', 'registry', 'unified-registry.redacted.json');
  out.scope = positional[1] || out.scope;
  return out;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function withTimeout(url, opts, ms) {
  const ctrl = new AbortController();
  const tm = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(tm));
}

async function probeOnce(k, timeoutMs) {
  const started = Date.now();
  if (!k.url || k.url.includes('«redacted»')) {
    return { key: k.key, status: 0, ok: false, ms: 0, verdict: 'no live url' };
  }
  const body = (k.probe && k.probe.body) || { action: String(k.key).toLowerCase(), name: String(k.key).toLowerCase(), dryRun: true, validateOnly: true };
  try {
    const res = await withTimeout(k.url, { method: (k.probe && k.probe.method) || 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }, timeoutMs);
    const text = await res.text();
    let data = null; try { data = JSON.parse(text); } catch { /* non-JSON body is still a valid response */ }
    const expect = k.expect || [];
    const present = data && typeof data === 'object' ? expect.filter((e) => JSON.stringify(data).includes(e)) : [];
    const verdict = res.ok
      ? (expect.length && present.length < expect.length ? 'thin body' : 'answered')
      : (res.status === 401 || res.status === 403 ? 'signature' : (res.status === 429 ? 'throttled' : 'refused'));
    return { key: k.key, status: res.status, ok: res.ok, ms: Date.now() - started, expected: expect, present, verdict };
  } catch (e) {
    const verdict = String(e.message || e).toLowerCase().includes('abort') ? 'timed out' : 'not reached';
    return { key: k.key, status: 0, ok: false, ms: Date.now() - started, verdict, error: e.message };
  }
}

async function runQueue(list, { concurrency, retries, timeoutMs, paceMs }) {
  const out = [];
  let idx = 0;
  async function worker() {
    while (idx < list.length) {
      const k = list[idx++];
      let attempt = 0, rec;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        rec = await probeOnce(k, timeoutMs);
        if (rec.ok || rec.verdict === 'no live url' || attempt >= retries) break;
        attempt++;
        await sleep(Math.min(8000, 400 * 2 ** attempt));
      }
      out.push(rec);
      if (paceMs) await sleep(paceMs);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(16, concurrency)) }, worker));
  return out;
}

function mergeLocal(reg, localPath) {
  if (!localPath) return reg;
  const local = JSON.parse(fs.readFileSync(localPath, 'utf8'));
  const list = Array.isArray(local.keys) ? local.keys : Array.isArray(local) ? local : [];
  const byKey = new Map(list.filter((k) => k && k.key && k.url).map((k) => [k.key, k.url]));
  const merged = { ...reg, keys: reg.keys.map((k) => (byKey.has(k.key) ? { ...k, url: byKey.get(k.key) } : k)) };
  return merged;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let reg = JSON.parse(fs.readFileSync(args.registryPath, 'utf8'));
  reg = mergeLocal(reg, args.local);

  const list = reg.keys.filter((k) => k.url && (args.scope === 'all' || k.role === args.scope || (args.scope === 'signed' && k.signed)));
  const liveCount = list.filter((k) => !k.url.includes('«redacted»')).length;
  if (liveCount === 0) {
    console.error(`[cems] Warning: ${args.registryPath} carries no live signatures (redacted mode). Every result below will read 'no live url'. Pass --local <path-to-your-gitignored-full-registry> to probe for real.`);
  }

  const results = await runQueue(list, args);
  console.log(JSON.stringify({
    release: reg.release,
    at: new Date().toISOString(),
    scope: args.scope,
    concurrency: args.concurrency,
    retries: args.retries,
    timeoutMs: args.timeoutMs,
    count: results.length,
    ok: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
