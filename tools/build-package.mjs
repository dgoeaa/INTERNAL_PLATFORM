// Build the distributable package.
//
//     node tools/build-package.mjs        ->  dist/
//
// Produces everything someone needs to use Flow Studio without a repository, a server or a
// build step, and zips it so it can be handed over as one file:
//
//     flow-studio.html              the tool. Open it in Chrome or Edge. Nothing to install.
//     flow-studio-handbook.html     how to use it
//     flow-studio-handbook.pdf      the same, for circulation and printing
//     examples/*.plan.json          starter plans, opened with the tool's "Open plan"
//     README.txt                    what each file is
//     flow-studio-package.zip       all of the above
//
// ON FONTS
// The handbook's display faces come from Google Fonts over the network. Inlining them was
// measured and rejected: the latin subsets alone are 394 KB raw and 527 KB base64-encoded,
// against 19 KB of actual document — a file twenty-seven times larger than its content, for
// typography. The fallback stacks (Georgia, the system sans, ui-monospace) are declared and
// the design holds on them, so offline the handbook loses some character and nothing else.
//
// The PDF is fully offline — a PDF embeds whatever it rendered with — but it does NOT
// reproduce the HTML's typography. Headless Chromium cannot reach Google Fonts from inside
// this build environment (TLS to the outbound proxy fails), so it lays the document out in
// the metric-compatible fallbacks: Liberation Serif and Sans, DejaVu Sans Mono. That is a
// perfectly professional result and the layout is unaffected, but it is a substitution, and
// buildPdf() prints which faces it actually embedded rather than letting it pass silently.
// Build on a machine that can reach fonts.googleapis.com and the design faces come through.

import { readFile, writeFile, mkdir, rm, copyFile, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const DIST = path.join(repo, 'dist');
const EXAMPLES = path.join(DIST, 'examples');

const kb = n => `${(n / 1024).toFixed(1)} KB`;

/** Chromium, wherever this machine keeps it. Absent is not fatal — the PDF is skipped. */
function findChromium() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return c;
  try {
    const dirs = execFileSync('ls', ['/opt/pw-browsers'], { encoding: 'utf8' }).split('\n');
    const hit = dirs.find(d => /^chromium-\d+$/.test(d.trim()));
    if (hit) {
      const p = `/opt/pw-browsers/${hit.trim()}/chrome-linux/chrome`;
      if (existsSync(p)) return p;
    }
  } catch { /* not here */ }
  return null;
}

/**
 * Render the handbook to PDF with headless Chromium.
 *
 * Chromium loads the webfonts and embeds them in the PDF, which is what makes the PDF the
 * offline-faithful copy the HTML cannot cheaply be. Uses --no-sandbox because this runs in
 * containers as root; the input is a local file this repository generated.
 */
async function buildPdf(htmlPath, pdfPath) {
  const chrome = findChromium();
  if (!chrome) {
    console.log('skip  flow-studio-handbook.pdf  (no Chromium found — set CHROMIUM_PATH to build it)');
    return false;
  }
  const tmp = path.join(DIST, '.chrome-profile');
  try {
    execFileSync(chrome, [
      '--headless', '--disable-gpu', '--no-sandbox', '--no-pdf-header-footer',
      // Without a virtual time budget the print fires before the webfonts arrive and the PDF
      // embeds the fallback faces instead — a silent substitution that only shows up if you
      // read the PDF's own font table. This waits for the network to settle first.
      '--virtual-time-budget=20000', '--run-all-compositor-stages-before-draw',
      `--user-data-dir=${tmp}`,
      `--print-to-pdf=${pdfPath}`,
      `file://${htmlPath}`
    ], { stdio: ['ignore', 'ignore', 'pipe'], timeout: 120_000 });
    if (!existsSync(pdfPath)) return false;
    // Say which faces actually got embedded rather than assuming the intended ones did.
    const raw = await readFile(pdfPath);
    const faces = [...new Set([...raw.toString('latin1').matchAll(/\/BaseFont\s*\/([A-Za-z0-9+#-]+)/g)]
      .map(m => m[1].replace(/^[A-Z]{6}\+/, '')))];
    const gotWebfonts = faces.some(f => /PublicSans|SourceSerif|JetBrainsMono/i.test(f));
    console.log(`      fonts embedded: ${faces.join(', ') || 'none'}${gotWebfonts ? '' : '  (fallback faces — the design fonts did not load)'}`);
    return true;
  } catch (e) {
    console.log(`skip  flow-studio-handbook.pdf  (${String(e.message).split('\n')[0]})`);
    return false;
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

/** Starter plans, generated from the blueprints so they cannot fall out of step with them. */
async function buildExamples() {
  const PA = await import('../core/power-automate/index.js');
  await mkdir(EXAMPLES, { recursive: true });
  const wanted = [
    ['dgo-endpoint-handler', 'endpoint-scaffold', { endpointKey: 'DYNAMIC_ACTIONS' }],
    ['guarded-write', 'guarded-write', {}],
    ['acknowledgement-email', 'ack-email', {}]
  ];
  const written = [];
  for (const [file, id, opts] of wanted) {
    const bp = PA.blueprintById(id);
    const built = bp.build({ endpointKey: 'DYNAMIC_ACTIONS', shape: 'nested', ...opts });
    const plan = { name: built.name, steps: built.steps, trigger: built.trigger || null, triggerSpec: null, notes: built.notes || [] };
    // A plan that would not generate is not a starter, it is a bug report.
    const issues = PA.validatePlan(plan);
    if (!PA.canGenerate(issues)) throw new Error(`${file}: ${PA.errorsOf(issues).map(i => i.message).join('; ')}`);
    const out = path.join(EXAMPLES, `${file}.plan.json`);
    await writeFile(out, JSON.stringify(plan, null, 2));
    written.push({ file: `${file}.plan.json`, actions: PA.resolveNames(plan).size, bytes: (await stat(out)).size });
  }
  return written;
}

const README = examples => `FLOW STUDIO
Generate Power Automate actions and paste them into the modern designer.
DGO Digital Operations — National Information Technology Development Agency


WHAT IS IN HERE

  flow-studio.html            The tool. Double-click it. Chrome or Edge.
                              No server, no install, no network.

  flow-studio-handbook.html   How to use it. Opens in any browser.
  flow-studio-handbook.pdf    The same, for circulation and printing. Needs
                              no network at all; set in standard document
                              faces rather than the web page's own.

  examples/                   Starter plans. Open one with the tool's
                              "Open plan" button (the up-arrow, top left).
${examples.map(e => `                                ${e.file}  (${e.actions} actions)`).join('\n')}


START HERE

  1. Open flow-studio.html in Chrome or Edge.
  2. Top left, choose "Start from a blueprint..." and pick an endpoint.
  3. Press "Copy for the designer" along the bottom.
  4. In Power Automate, click the + where the actions belong and choose
     "Paste an action".


THINGS WORTH KNOWING BEFORE YOU START

  Firefox cannot receive the paste. Firefox does not give web pages
  clipboard read access, so the Power Automate designer cannot read what
  this tool copied. Use Chrome or Edge.

  Several actions arrive wrapped in a Scope. One paste carries exactly one
  root action. Delete the Scope afterwards if you do not want it — the
  designer keeps its contents.

  Connector actions paste without a connection. This tool has no access to
  your tenant's connections. Pick one on each connector action after
  pasting. That is expected, not a fault.

  Triggers cannot be pasted at all. The designer's paste path creates
  actions only. Add the trigger in the designer yourself.

  If you doubt the output, press "Check payload". Copy a real Scope from
  your own designer, paste it in, and the tool will name every difference
  between what your designer produced and what it generates.


PRIVACY

  Nothing here talks to a network. Plans are kept in your browser's local
  storage and go nowhere else. The handbook HTML loads display fonts from
  Google when online and falls back to system fonts when not. The PDF
  needs no network at any point.


REBUILDING

  From the repository:

      node tools/build-standalone.mjs    the tool
      node tools/build-package.mjs       everything in this folder

  Do not edit flow-studio.html by hand — it is generated. Edit the sources
  under core/power-automate/ and rebuild.
`;

async function zipDist(files) {
  // -r or the examples/ directory argument is silently dropped and the archive ships without
  // the starter plans the README tells people to open. -X keeps it deterministic.
  execFileSync('zip', ['-q', '-r', '-X', 'flow-studio-package.zip', ...files], { cwd: DIST });
  const listing = execFileSync('unzip', ['-Z1', 'flow-studio-package.zip'], { cwd: DIST, encoding: 'utf8' })
    .split('\n').filter(Boolean);
  const missing = ['flow-studio.html', 'README.txt'].filter(f => !listing.includes(f));
  if (!listing.some(f => f.startsWith('examples/') && f.endsWith('.plan.json'))) missing.push('examples/*.plan.json');
  if (missing.length) throw new Error(`the archive is missing: ${missing.join(', ')}`);
  return { bytes: (await stat(path.join(DIST, 'flow-studio-package.zip'))).size, entries: listing.length };
}

async function main() {
  await mkdir(DIST, { recursive: true });

  // The tool. Built by its own script so there is one definition of how it is made.
  execFileSync('node', [path.join(here, 'build-standalone.mjs')], { cwd: repo, stdio: 'inherit' });

  const handbookSrc = path.join(repo, 'docs', 'flow-studio-handbook.html');
  const handbookOut = path.join(DIST, 'flow-studio-handbook.html');
  await copyFile(handbookSrc, handbookOut);
  console.log(`dist/flow-studio-handbook.html  ${kb((await stat(handbookOut)).size)}`);

  const pdfOut = path.join(DIST, 'flow-studio-handbook.pdf');
  await rm(pdfOut, { force: true });
  const madePdf = await buildPdf(handbookOut, pdfOut);
  if (madePdf) console.log(`dist/flow-studio-handbook.pdf   ${kb((await stat(pdfOut)).size)}`);

  const examples = await buildExamples();
  for (const e of examples) console.log(`dist/examples/${e.file.padEnd(30)} ${kb(e.bytes)}  ${e.actions} actions`);

  await writeFile(path.join(DIST, 'README.txt'), README(examples));

  await rm(path.join(DIST, 'flow-studio-package.zip'), { force: true });
  const members = ['README.txt', 'flow-studio.html', 'flow-studio-handbook.html',
    ...(madePdf ? ['flow-studio-handbook.pdf'] : []), 'examples'];
  const zipped = await zipDist(members);
  console.log(`dist/flow-studio-package.zip    ${kb(zipped.bytes)}  (${zipped.entries} entries)`);

  const listing = await readdir(DIST);
  console.log(`\npackage complete — ${listing.filter(f => !f.startsWith('.')).length} items in dist/`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
