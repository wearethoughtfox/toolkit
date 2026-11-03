#!/usr/bin/env node
// Screenshot every page of each site at a few widths, then compare against a saved baseline.
//
//   node snap.js baseline [site ...]   build, serve, crawl, save screenshots as the baseline
//   node snap.js compare  [site ...]   same again into current/, then diff against the baseline
//   node snap.js diff     [site ...]   only re-run the diff and report on what's already saved
//
// Flags: --no-build (serve the existing build), --url=http://localhost:5173 (use a server
// that's already running; one site only). Sites and widths live in sites.json.
//
// The browser is the installed Microsoft Edge. Set SNAP_BROWSER=chromium for
// Playwright's own (after `npx playwright install chromium`), or chrome.

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const outRoot = process.env.SNAP_OUT ? path.resolve(process.env.SNAP_OUT) : path.join(here, 'output');
const config = JSON.parse(await readFile(path.join(here, 'sites.json'), 'utf8'));

const args = process.argv.slice(2);
const mode = args[0];
const flags = Object.fromEntries(
  args.filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.slice(2).split('=');
    return [k, v ?? true];
  })
);
const names = args.slice(1).filter((a) => !a.startsWith('--'));

if (!['baseline', 'compare', 'diff'].includes(mode)) {
  console.log('Usage: node snap.js baseline|compare|diff [site ...] [--no-build] [--url=...]');
  console.log('Sites:', config.sites.map((s) => s.name).join(', '));
  process.exit(1);
}

const unknown = names.filter((n) => !config.sites.some((s) => s.name === n));
if (unknown.length) {
  console.error(`Unknown site: ${unknown.join(', ')}`);
  process.exit(1);
}
const sites = names.length ? config.sites.filter((s) => names.includes(s.name)) : config.sites;
if (flags.url && sites.length !== 1) {
  console.error('--url needs exactly one site name');
  process.exit(1);
}

const SKIP_EXT = /\.(pdf|jpe?g|png|gif|webp|avif|svg|xml|txt|json|zip|mp4|webm|mp3|ics|css|js)$/i;

// '/' → 'home', '/work/some-project' → 'work--some-project'
function slugFor(pathname) {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  return clean ? clean.replace(/\//g, '--') : 'home';
}

function normalise(href, origin) {
  let url;
  try {
    url = new URL(href, origin);
  } catch {
    return null;
  }
  if (url.origin !== origin || SKIP_EXT.test(url.pathname)) return null;
  const p = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
  return p;
}

function run(cmd, cmdArgs, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, { cwd, stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${cmdArgs.join(' ')} exited ${code}`))));
  });
}

async function waitFor(url, ms = 30000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Nothing answered at ${url} after ${ms / 1000}s`);
}

async function serve(site) {
  const dir = path.resolve(here, site.dir);
  if (!flags['no-build']) {
    console.log(`\n▸ ${site.name}: building`);
    await run('npm', ['run', 'build'], dir);
  }
  console.log(`▸ ${site.name}: serving on ${site.port}`);
  const child = spawn('npx', ['vite', 'preview', '--port', String(site.port), '--strictPort', '--host', '127.0.0.1'], {
    cwd: dir,
    stdio: ['ignore', 'ignore', 'inherit'],
    detached: true
  });
  const origin = `http://127.0.0.1:${site.port}`;
  const stop = () => {
    try {
      process.kill(-child.pid);
    } catch {}
  };
  try {
    await waitFor(origin + '/');
  } catch (err) {
    stop();
    throw err;
  }
  return { origin, stop };
}

async function sitemapPaths(origin) {
  try {
    const res = await fetch(origin + '/sitemap.xml');
    if (!res.ok) return [];
    const xml = await res.text();
    // Sitemaps carry the production domain, so keep only the path
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
      try {
        return new URL(m[1]).pathname.replace(/(.)\/+$/, '$1');
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

const FREEZE_CSS = `
*, *::before, *::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
  scroll-behavior: auto !important;
}`;

// Get the page into a still, fully loaded state so two runs produce the same pixels
async function settle(page) {
  await page.addStyleTag({ content: FREEZE_CSS });
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'));
    document.querySelectorAll('video').forEach((v) => {
      v.pause();
      v.currentTime = 0;
    });
    // Scroll through once so anything waiting on IntersectionObserver gets triggered
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
    await Promise.race([
      Promise.all(
        [...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => (i.onload = i.onerror = r)))
      ),
      new Promise((r) => setTimeout(r, 5000))
    ]);
    await document.fonts.ready;
  });
  await page.waitForTimeout(250);
}

async function capture(site, origin, into) {
  const { chromium } = await import('playwright');
  await rm(into, { recursive: true, force: true });
  await mkdir(into, { recursive: true });

  const widths = config.widths;
  const channel = process.env.SNAP_BROWSER || 'msedge';
  const browser = await chromium.launch(channel === 'chromium' ? {} : { channel });
  const contexts = await Promise.all(
    widths.map((width) =>
      browser.newContext({
        viewport: { width, height: 900 },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
        // Phones get touch, so (hover: none) styles show up in the mobile shots
        isMobile: width < 768,
        hasTouch: width < 768
      })
    )
  );

  const queue = ['/', ...(site.paths ?? []), ...(await sitemapPaths(origin))];
  const seen = new Set();
  const failures = [];

  while (queue.length && seen.size < config.maxPages) {
    const p = queue.shift();
    if (seen.has(p)) continue;
    seen.add(p);
    process.stdout.write(`  ${p} `);

    for (let i = widths.length - 1; i >= 0; i--) {
      const page = await contexts[i].newPage();
      try {
        const res = await page.goto(origin + p, { waitUntil: 'networkidle', timeout: 30000 });
        if (res && res.status() >= 400) failures.push(`${p} answered ${res.status()}`);
        await settle(page);
        // Collect links on the widest pass only; they're the same at every width
        if (i === widths.length - 1) {
          const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
          for (const h of hrefs) {
            const n = normalise(h, origin);
            if (n && !seen.has(n)) queue.push(n);
          }
        }
        await page.screenshot({ path: path.join(into, `${slugFor(p)}@${widths[i]}.png`), fullPage: true, animations: 'disabled' });
        process.stdout.write('.');
      } catch (err) {
        failures.push(`${p} at ${widths[i]}px: ${err.message.split('\n')[0]}`);
        process.stdout.write('✗');
      } finally {
        await page.close();
      }
    }
    process.stdout.write('\n');
  }

  await browser.close();
  if (queue.length) console.log(`  Stopped at ${config.maxPages} pages; raise maxPages in sites.json to go further`);
  failures.forEach((f) => console.log(`  ! ${f}`));
  return { pages: seen.size, failures };
}

async function readPng(file) {
  return PNG.sync.read(await readFile(file));
}

// Copy a PNG onto a larger canvas so pages that changed height can still be diffed
function pad(png, width, height) {
  if (png.width === width && png.height === height) return png;
  const out = new PNG({ width, height });
  out.data.fill(0);
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}

async function diffSite(site) {
  const base = path.join(outRoot, site.name, 'baseline');
  const curr = path.join(outRoot, site.name, 'current');
  const diffDir = path.join(outRoot, site.name, 'diff');
  const result = { name: site.name, changed: [], added: [], missing: [], same: 0 };
  if (!existsSync(base) || !existsSync(curr)) {
    result.error = !existsSync(base) ? 'No baseline yet' : 'Nothing captured to compare';
    return result;
  }
  await rm(diffDir, { recursive: true, force: true });
  await mkdir(diffDir, { recursive: true });

  const a = new Set((await readdir(base)).filter((f) => f.endsWith('.png')));
  const b = new Set((await readdir(curr)).filter((f) => f.endsWith('.png')));
  for (const f of [...b].filter((f) => !a.has(f)).sort()) result.added.push(f);
  for (const f of [...a].filter((f) => !b.has(f)).sort()) result.missing.push(f);

  for (const f of [...a].filter((f) => b.has(f)).sort()) {
    const before = await readPng(path.join(base, f));
    const after = await readPng(path.join(curr, f));
    const width = Math.max(before.width, after.width);
    const height = Math.max(before.height, after.height);
    const out = new PNG({ width, height });
    const pixels = pixelmatch(pad(before, width, height).data, pad(after, width, height).data, out.data, width, height, {
      threshold: 0.1
    });
    if (pixels === 0) {
      result.same++;
      continue;
    }
    await writeFile(path.join(diffDir, f), PNG.sync.write(out));
    result.changed.push({
      file: f,
      percent: ((pixels / (width * height)) * 100).toFixed(2),
      heightNote: before.height !== after.height ? `height ${before.height} → ${after.height}px` : ''
    });
  }
  return result;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

async function writeReport(results) {
  const stamp = new Date().toLocaleString('en-GB');
  const sections = results.map((r) => {
    if (r.error) return `<section><h2>${esc(r.name)}</h2><p class="note">${esc(r.error)}</p></section>`;
    const total = r.changed.length + r.added.length + r.missing.length;
    const rows = r.changed.map(
      (c) => `
      <figure>
        <figcaption><strong>${esc(c.file)}</strong> ${c.percent}% of pixels ${c.heightNote ? '· ' + esc(c.heightNote) : ''}</figcaption>
        <div class="trio">
          <a href="${esc(r.name)}/baseline/${esc(c.file)}"><img loading="lazy" src="${esc(r.name)}/baseline/${esc(c.file)}" alt="Before"><span>Before</span></a>
          <a href="${esc(r.name)}/current/${esc(c.file)}"><img loading="lazy" src="${esc(r.name)}/current/${esc(c.file)}" alt="After"><span>After</span></a>
          <a href="${esc(r.name)}/diff/${esc(c.file)}"><img loading="lazy" src="${esc(r.name)}/diff/${esc(c.file)}" alt="Difference"><span>Difference</span></a>
        </div>
      </figure>`
    );
    const list = (label, files) =>
      files.length ? `<p><strong>${label}:</strong> ${files.map(esc).join(', ')}</p>` : '';
    return `
    <section>
      <h2>${esc(r.name)} <small>${total ? `${total} to look at` : 'no changes'} · ${r.same} unchanged</small></h2>
      ${list('New screenshots', r.added)}
      ${list('No longer captured', r.missing)}
      ${rows.join('')}
    </section>`;
  });

  const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Snapshot report</title>
<style>
  :root { color-scheme: light dark; --ink: #1d1d1b; --paper: #fafaf7; --rule: #0002; }
  @media (prefers-color-scheme: dark) { :root { --ink: #ecebe6; --paper: #161615; --rule: #fff3; } }
  body { margin: 0; padding: 1.5rem 1rem 4rem; font: 16px/1.5 system-ui, sans-serif; color: var(--ink); background: var(--paper); }
  h1 { font-size: 1.5rem; margin: 0 0 .25rem; }
  h2 { font-size: 1.25rem; margin: 2.5rem 0 .75rem; padding-top: 1rem; border-top: 1px solid var(--rule); }
  small, .note, figcaption { color: color-mix(in oklch, var(--ink) 65%, transparent); font-weight: 400; }
  figure { margin: 1.5rem 0; }
  .trio { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: .75rem; margin-top: .5rem; }
  .trio a { display: grid; gap: .25rem; color: inherit; text-decoration: none; font-size: .875rem; }
  .trio img { width: 100%; max-height: 32rem; object-fit: cover; object-position: top; outline: 1px solid var(--rule); }
</style>
</head>
<body>
<h1>Snapshot report</h1>
<p class="note">${esc(stamp)}. Red in the difference image marks pixels that changed. Click an image to see it full size.</p>
${sections.join('')}
</body>
</html>`;
  const file = path.join(outRoot, 'report.html');
  await writeFile(file, html);
  return file;
}

const results = [];
let interrupted = false;
const servers = [];
process.on('SIGINT', () => {
  interrupted = true;
  servers.forEach((s) => s.stop());
  process.exit(130);
});

for (const site of sites) {
  if (interrupted) break;
  if (mode !== 'diff') {
    let server;
    try {
      server = flags.url ? { origin: String(flags.url).replace(/\/$/, ''), stop() {} } : await serve(site);
      servers.push(server);
      const into = path.join(outRoot, site.name, mode === 'baseline' ? 'baseline' : 'current');
      console.log(`▸ ${site.name}: capturing`);
      const { pages } = await capture(site, server.origin, into);
      console.log(`  ${pages} pages saved to ${path.relative(here, into)}`);
    } catch (err) {
      console.error(`✗ ${site.name}: ${err.message}`);
      results.push({ name: site.name, error: err.message, changed: [], added: [], missing: [], same: 0 });
      continue;
    } finally {
      server?.stop();
    }
  }
  if (mode !== 'baseline') results.push(await diffSite(site));
}

if (mode !== 'baseline') {
  const file = await writeReport(results);
  const changed = results.some((r) => r.changed.length || r.added.length || r.missing.length);
  console.log(`\n${changed ? 'Changes found' : 'No visual changes'}. Report: ${file}`);
  process.exitCode = changed ? 1 : 0;
}
