#!/usr/bin/env node
/**
 * The verification this repository did not have.
 *
 * WHY THIS EXISTS
 * This repository IS the deployed operator platform. There is no build, no bundler and no
 * server: the browser loads `index.html`, which loads `core/boot.js` as an ES module, which
 * imports the rest by relative path. What is committed here is, byte for byte, what is served
 * at https://activityweb.page.gd.
 *
 * That has one consequence worth stating plainly. **A mistake here is live the moment it is
 * pushed.** A renamed file that one import still points at is not a failing build — it is a
 * blank page for an officer at their desk, with a module-resolution error in a console nobody
 * has open. A signed trigger URL committed by accident is not a warning — it is a bearer
 * credential published on the public internet.
 *
 * Nothing checked either. The independent review brief records this repository as having "no
 * package.json, no build, no tests", and that was accurate.
 *
 * WHAT IT CHECKS, AND WHY THESE FOUR
 * Each one is a failure this layout can actually have, and that nothing else would catch.
 *
 *   1. Credentials. No tracked file may carry a Power Automate SAS signature — and archives are
 *      opened, because that is exactly how the last one hid. `Platform frontend review.zip` sat
 *      at the root of this repository carrying three complete trigger URLs inside
 *      `_ds/…/_ds_bundle.js`. Every text search over the tracked files found nothing.
 *   2. Imports. Every relative import must resolve to a tracked file. With no bundler, an
 *      unresolved import is discovered by a user.
 *   3. Entry points. Every `src` and `href` in `index.html` must resolve to a tracked file, with
 *      one deliberate exception: `config/config.local.js` carries the endpoint URLs, is
 *      git-ignored, and its `<script>` tag already carries `onerror="void 0"` so the platform
 *      degrades to demo mode rather than failing. That exception is asserted, not assumed.
 *   4. Syntax. Every JavaScript file must parse. A syntax error in a module the router loads
 *      late is invisible until someone navigates there.
 *
 * WHAT IT DOES NOT CHECK. It does not run the application, assert behaviour, or test the flows.
 * It is the floor, not the ceiling: it establishes that what is committed can load. Saying so
 * matters, because a green result here must not be read as "the platform works".
 *
 *   node tests/verify.mjs            # all checks
 *   node tests/verify.mjs --only=secrets|imports|entry|syntax
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1] || '';

let pass = 0;
const failures = [];
const ok = (cond, label, detail = '') => {
  if (cond) { pass++; console.log(`  ✅ ${label}`); }
  else { failures.push(`${label}${detail ? ` — ${detail}` : ''}`); console.log(`  ❌ ${label}${detail ? `\n       ${detail}` : ''}`); }
};

/* Tracked files only. What git carries is what is deployed; an untracked file on someone's disk
   is not part of the site and must not make a check pass or fail. */
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 })
  .toString('utf8').split('\0').filter(Boolean);
const trackedSet = new Set(tracked);
const isFile = (rel) => {
  try { return statSync(join(ROOT, rel)).isFile(); } catch { return false; }
};

const section = (name) => { console.log(`\n${name}\n`); };
const run = (key) => !only || only === key;

/* ── 1. credentials ───────────────────────────────────────────────────────────────────── */
if (run('secrets')) {
  section('No credential is committed');

  /* Detection is `{20,}` so a truncated or mangled copy is still found; the identity used for
     COUNTING is the 43 characters that are the signature, because this corpus is known to glue
     prose onto the end of URLs and one credential must not be reported as several. */
  const SIG = /sig=[A-Za-z0-9_-]{20,}/g;
  const normalise = (s) => s.slice(0, 'sig='.length + 43);
  const ARCHIVE = /\.(zip|7z|rar|tar|tgz|tar\.gz)$/i;
  const OPAQUE = /\.(png|jpe?g|gif|ico|svg|woff2?|ttf|eot|pdf|mp4|webm)$/i;

  const carrying = [];
  const unreadable = [];
  const distinct = new Set();

  for (const f of tracked) {
    const abs = join(ROOT, f);
    if (ARCHIVE.test(f)) {
      /* An archive is text in a container, not an opaque blob. Skipping it is how three live
         signatures sat in this repository unnoticed. If `unzip` is missing the archive is
         reported as unreadable rather than passed — a check that cannot run must not report
         green. */
      let members;
      try {
        members = execFileSync('unzip', ['-Z1', abs], { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })
          .toString('utf8').split('\n').filter(Boolean);
      } catch { unreadable.push(f); continue; }
      const found = [];
      for (const m of members) {
        if (m.endsWith('/') || OPAQUE.test(m) || ARCHIVE.test(m)) continue;
        try {
          const raw = execFileSync('unzip', ['-p', abs, m], { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
          if (raw.includes(0)) continue;
          for (const s of raw.toString('utf8').match(SIG) || []) found.push(`${m}: ${normalise(s)}`);
        } catch { /* unreadable member; the listing above is the record */ }
      }
      if (found.length) { carrying.push(`${f} (archive)`); found.forEach((s) => distinct.add(s.split(': ')[1])); }
      continue;
    }
    if (OPAQUE.test(f)) continue;
    let buf;
    try { buf = readFileSync(abs); } catch { continue; }
    if (buf.includes(0)) continue;
    const found = buf.toString('utf8').match(SIG);
    if (!found) continue;
    carrying.push(f);
    found.forEach((s) => distinct.add(normalise(s)));
  }

  ok(carrying.length === 0,
    'no tracked file carries a Power Automate trigger signature',
    carrying.length ? `${distinct.size} distinct signature(s) in: ${carrying.join(', ')}` : '');
  ok(unreadable.length === 0,
    'every archive could be opened and read',
    unreadable.length ? `unzip unavailable, so these were NOT scanned: ${unreadable.join(', ')}` : '');
  ok(!trackedSet.has('config/config.local.js') && !trackedSet.has('config.local.js'),
    'the local endpoint configuration is not tracked');

  /* The rule must be able to fire. A scanner that has stopped scanning passes silently. */
  ok(SIG.test('?sv=2016&sig=' + 'A'.repeat(43)), 'the signature rule still matches a signature');
}

/* ── 2. imports ───────────────────────────────────────────────────────────────────────── */
if (run('imports')) {
  section('Every module import resolves');

  const JS = tracked.filter((f) => f.endsWith('.js'));
  /* Static `import ... from '...'`, side-effect `import '...'`, `export ... from '...'`, and
     dynamic `import('...')`. Bare specifiers are skipped: there is no bundler and no import map,
     so any that appear would be a separate finding, asserted below rather than resolved here. */
  const SPEC = /(?:^|[\s;])(?:import|export)\s[^'"`]*?from\s*['"]([^'"]+)['"]|(?:^|[\s;])import\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  const broken = [];
  const bare = [];
  let counted = 0;
  for (const f of JS) {
    const src = readFileSync(join(ROOT, f), 'utf8');
    for (const m of src.matchAll(SPEC)) {
      const spec = m[1] || m[2] || m[3];
      if (!spec) continue;
      if (/^(https?:)?\/\//.test(spec) || spec.startsWith('data:')) continue;
      if (!spec.startsWith('.') && !spec.startsWith('/')) { bare.push(`${f} -> ${spec}`); continue; }
      counted++;
      const target = spec.startsWith('/')
        ? spec.slice(1)
        : relative(ROOT, resolve(join(ROOT, dirname(f)), spec)).split('\\').join('/');
      if (!trackedSet.has(target) || !isFile(target)) broken.push(`${f} -> ${spec}`);
    }
  }

  ok(counted > 0, 'imports were actually found and resolved', `${counted} relative import(s) checked`);
  ok(broken.length === 0, 'every relative import resolves to a tracked file',
    broken.length ? `${broken.length}: ${broken.slice(0, 8).join('; ')}${broken.length > 8 ? ' …' : ''}` : '');
  ok(bare.length === 0,
    'no module imports a bare specifier, which the browser cannot resolve without an import map',
    bare.length ? bare.slice(0, 8).join('; ') : '');
}

/* ── 3. entry points ──────────────────────────────────────────────────────────────────── */
if (run('entry')) {
  section('index.html reaches everything it names');

  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  /* The one file allowed to be absent, and the reason it is allowed. It carries the signed
     endpoint URLs, so it is git-ignored by design; its script tag carries onerror="void 0" and
     the platform degrades to demo mode without it. That tolerance is asserted rather than
     assumed, because losing it turns a missing config into a blank page. */
  const OPTIONAL = 'config/config.local.js';

  const refs = [...html.matchAll(/\b(?:src|href)\s*=\s*"([^"]+)"/g)].map((m) => m[1])
    .filter((r) => !/^(https?:)?\/\//.test(r) && !r.startsWith('#') && !r.startsWith('data:') && !r.startsWith('mailto:'));
  const missing = refs.filter((r) => r !== OPTIONAL && !(trackedSet.has(r) && isFile(r)));

  ok(refs.length > 0, 'the entry point was parsed', `${refs.length} local reference(s)`);
  ok(missing.length === 0, 'every local reference in index.html is a tracked file',
    missing.join(', '));
  ok(!trackedSet.has(OPTIONAL), `${OPTIONAL} is deliberately absent — it carries credentials`);
  ok(new RegExp(`src="${OPTIONAL}"[^>]*onerror=`).test(html),
    'the configuration script tolerates its own absence, so a fresh clone still boots');
}

/* ── 4. syntax ────────────────────────────────────────────────────────────────────────── */
if (run('syntax')) {
  section('Every JavaScript file parses');

  const JS = tracked.filter((f) => f.endsWith('.js'));
  const bad = [];
  for (const f of JS) {
    /* Parsed as a module, which is how the browser loads them. `--check` reports the file and
       line, so the failure names itself. */
    try {
      execFileSync(process.execPath, ['--input-type=module', '--check'], {
        input: readFileSync(join(ROOT, f)), stdio: ['pipe', 'ignore', 'pipe'],
      });
    } catch (e) {
      bad.push(`${f}: ${String(e.stderr || '').split('\n').find((l) => l.includes('Error')) || 'parse failed'}`);
    }
  }
  ok(JS.length > 0, 'JavaScript files were found to parse', `${JS.length} file(s)`);
  ok(bad.length === 0, 'every JavaScript file parses as a module',
    bad.slice(0, 5).join(' | '));
}

console.log(`\n${failures.length ? '❌' : '✅'} ${pass} passed, ${failures.length} failed\n`);
if (failures.length) for (const f of failures) console.log(`   ${f}`);
process.exit(failures.length ? 1 : 0);
