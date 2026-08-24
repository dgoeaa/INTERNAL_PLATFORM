#!/usr/bin/env node
// Regenerates index.html's embedded registry from unified-registry.redacted.json,
// which is the single source of truth. Run this after adding, editing, or
// removing an endpoint:
//
//   node sync-registry.js
//
// index.html carries its own copy of the registry (one line, `const REG=...;`)
// so the page works by itself with no server and no fetch(). This script is
// the only thing that keeps that copy in sync with the JSON file — hand-edit
// index.html's REG line and the next run of this script will overwrite it.
'use strict';
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'unified-registry.redacted.json');
const htmlPath = path.join(__dirname, 'index.html');

const reg = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Refuse to embed a live signature. This is the same guard the app applies to
// its own downloads (redactAll()) — belt-and-braces so a real sig= pasted
// into the JSON file can never make it into the committed HTML.
const compact = JSON.stringify(reg);
const liveSig = /sig=(?!«redacted»)[A-Za-z0-9_-]{10,}/;
if (liveSig.test(compact)) {
  console.error('[sync-registry] Refusing to embed: unified-registry.redacted.json contains what looks like a live signature.');
  console.error('[sync-registry] Every sig= value must be the literal string «redacted» in this file — real credentials belong only in your own git-ignored local registry, loaded at runtime via the Overview tab or run-contract-probes.js --local.');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const lines = html.split('\n');
const idx = lines.findIndex((l) => l.startsWith('const REG='));
if (idx === -1) {
  console.error('[sync-registry] Could not find a line starting with "const REG=" in index.html — aborting rather than guessing.');
  process.exit(1);
}
lines[idx] = `const REG=${compact};`;
fs.writeFileSync(htmlPath, lines.join('\n'));

console.log(`[sync-registry] index.html updated: ${reg.keys.length} keys, ${reg.routes.length} routes.`);
