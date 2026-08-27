#!/usr/bin/env node
// Regenerates a runtime HTML's embedded registry from a registry JSON file.
// Run this after adding, editing, or removing an endpoint:
//
//   node sync-registry.js
//
// With no arguments: reads unified-registry.redacted.json, writes index.html
// (the default pairing). Pass a different registry and/or output name to
// build a scoped standalone tool instead - e.g. to turn
// unified-registry.portal.redacted.json into its own portal.html:
//
//   node sync-registry.js unified-registry.portal.redacted.json portal.html
//
// index.html is always read as the UI shell (CSS/JS), regardless of the
// output name, so a scoped build stays a full copy of the same tool with a
// smaller REG - never hand-edit a generated file like portal.html directly;
// re-run this script instead so it keeps picking up index.html's own fixes.
'use strict';
const fs = require('fs');
const path = require('path');

const registryArg = process.argv[2] || 'unified-registry.redacted.json';
const outArg = process.argv[3] || 'index.html';
const jsonPath = path.join(__dirname, registryArg);
const shellPath = path.join(__dirname, 'index.html');
const outPath = path.join(__dirname, outArg);

const reg = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Refuse to embed a live signature. This is the same guard the app applies to
// its own downloads (redactAll()) — belt-and-braces so a real sig= pasted
// into the JSON file can never make it into the committed HTML.
const compact = JSON.stringify(reg);
const liveSig = /sig=(?!«redacted»)[A-Za-z0-9_-]{10,}/;
if (liveSig.test(compact)) {
  console.error(`[sync-registry] Refusing to embed: ${registryArg} contains what looks like a live signature.`);
  console.error('[sync-registry] Every sig= value must be the literal string «redacted» in this file — real credentials belong only in your own git-ignored local registry, loaded at runtime via the Overview tab or run-contract-probes.js --local.');
  process.exit(1);
}

const html = fs.readFileSync(shellPath, 'utf8');
const lines = html.split('\n');
const idx = lines.findIndex((l) => l.startsWith('const REG='));
if (idx === -1) {
  console.error('[sync-registry] Could not find a line starting with "const REG=" in index.html — aborting rather than guessing.');
  process.exit(1);
}
lines[idx] = `const REG=${compact};`;
fs.writeFileSync(outPath, lines.join('\n'));

console.log(`[sync-registry] ${outArg} written from ${registryArg}: ${reg.keys.length} keys, ${reg.routes.length} routes.`);
