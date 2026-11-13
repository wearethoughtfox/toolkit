import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokensPlugin } from '@thoughtfox/toolkit/tokens/vite-plugin.js';
import { generateTokens, writeIfChanged } from '@thoughtfox/toolkit/tokens/generate-tokens.js';

const root = '/site';
const tokensDir = '/site/src/lib/design-tokens';

/** The parts of Vite's dev server the plugin touches. */
function fakeServer() {
  const watcher = new EventEmitter();
  watcher.watched = [];
  watcher.add = (path) => watcher.watched.push(path);
  const logs = [];
  const sent = [];
  return {
    watcher, logs, sent,
    config: { logger: { error: (m) => logs.push(['error', m]), info: (m) => logs.push(['info', m]) } },
    ws: { send: (payload) => sent.push(payload) }
  };
}

function setup(generate, options = {}) {
  mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const plugin = tokensPlugin({
    generate: (o) => { calls.push(o); return generate?.(o); },
    debounce: 50,
    ...options
  });
  plugin.configResolved({ root });
  const server = fakeServer();
  plugin.configureServer(server);
  return { plugin, server, calls };
}

test.afterEach(() => mock.timers.reset());

test('generates once at build start, with the resolved root', () => {
  const calls = [];
  const plugin = tokensPlugin({ generate: (o) => calls.push(o), clampPrecision: 4 });
  plugin.configResolved({ root });
  plugin.buildStart();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].root, root);
  assert.equal(calls[0].clampPrecision, 4);
});

test('a failure at build start stops the build', () => {
  const plugin = tokensPlugin({ generate: () => { throw new Error('bad json'); } });
  plugin.configResolved({ root });
  assert.throws(() => plugin.buildStart(), /bad json/);
});

test('watches the token folder and nothing else', () => {
  const { server } = setup();
  assert.deepEqual(server.watcher.watched, [tokensDir]);
});

test('a change, an addition and a deletion each regenerate', () => {
  const { server, calls } = setup();
  for (const event of ['change', 'add', 'unlink']) {
    server.watcher.emit(event, `${tokensDir}/colors.json`);
    mock.timers.tick(50);
  }
  assert.equal(calls.length, 3);
});

test('a burst of saves regenerates once', () => {
  const { server, calls } = setup();
  server.watcher.emit('change', `${tokensDir}/colors.json`);
  mock.timers.tick(30);
  server.watcher.emit('change', `${tokensDir}/spacing.json`);
  mock.timers.tick(30);
  server.watcher.emit('add', `${tokensDir}/typography.json`);
  assert.equal(calls.length, 0);
  mock.timers.tick(50);
  assert.equal(calls.length, 1);
});

test('files outside the token inputs are ignored', () => {
  const { server, calls } = setup();
  for (const file of [
    '/site/src/lib/css/global/_tokens.generated.css',
    '/site/src/lib/palette/contrast.generated.json',
    '/site/src/lib/design-tokens-old/colors.json',
    '/site/src/lib/design-tokens/README.md',
    '/site/src/lib/design-tokens/contrast.generated.json',
    '/site/package.json',
    '/elsewhere/src/lib/design-tokens/colors.json'
  ]) {
    server.watcher.emit('change', file);
  }
  mock.timers.tick(500);
  assert.equal(calls.length, 0);
});

test('a configured output inside the token folder is not an input', () => {
  const { server, calls } = setup(null, { contrastOutput: 'src/lib/design-tokens/contrast.json' });
  server.watcher.emit('change', `${tokensDir}/contrast.json`);
  mock.timers.tick(500);
  assert.equal(calls.length, 0);
});

test('nested token files count; the folder itself does not', () => {
  const { server, calls } = setup();
  server.watcher.emit('change', tokensDir);
  mock.timers.tick(50);
  assert.equal(calls.length, 0);
  server.watcher.emit('change', `${tokensDir}/themes/dark.json`);
  mock.timers.tick(50);
  assert.equal(calls.length, 1);
});

test('a failing regeneration is reported and the server keeps going', () => {
  let broken = true;
  const { server, calls } = setup(() => { if (broken) throw new Error('colors.json has 1 problem(s)'); });
  server.watcher.emit('change', `${tokensDir}/colors.json`);
  assert.doesNotThrow(() => mock.timers.tick(50));

  assert.equal(server.logs.length, 1);
  assert.equal(server.logs[0][0], 'error');
  assert.match(server.logs[0][1], /Token generation failed: colors\.json has 1 problem/);
  assert.equal(server.sent.length, 1);
  assert.equal(server.sent[0].type, 'error');
  assert.match(server.sent[0].err.message, /colors\.json has 1 problem/);
  assert.equal(server.sent[0].err.plugin, 'thoughtfox-tokens');

  // Fixing the file recovers, and the overlay is cleared by a reload.
  broken = false;
  server.watcher.emit('change', `${tokensDir}/colors.json`);
  mock.timers.tick(50);
  assert.equal(calls.length, 2);
  assert.deepEqual(server.sent[1], { type: 'full-reload' });
  assert.equal(server.logs[1][0], 'info');

  // Ordinary successes after that stay quiet.
  server.watcher.emit('change', `${tokensDir}/colors.json`);
  mock.timers.tick(50);
  assert.equal(server.sent.length, 2);
});

test('a still-failing file reports again each time it is saved', () => {
  const { server } = setup(() => { throw new Error('nope'); });
  for (let i = 0; i < 2; i++) {
    server.watcher.emit('change', `${tokensDir}/colors.json`);
    mock.timers.tick(50);
  }
  assert.equal(server.logs.length, 2);
  assert.equal(server.sent.length, 2);
});

test('closing stops pending work and detaches the listeners', () => {
  const { plugin, server, calls } = setup();
  server.watcher.emit('change', `${tokensDir}/colors.json`);
  plugin.closeBundle();
  mock.timers.tick(500);
  assert.equal(calls.length, 0);
  server.watcher.emit('change', `${tokensDir}/colors.json`);
  mock.timers.tick(500);
  assert.equal(calls.length, 0);
  assert.equal(server.watcher.listenerCount('change'), 0);
});

// Against the real generator, on disk.

function workspace(t) {
  const directory = mkdtempSync(join(tmpdir(), 'toolkit-watch-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const dir = join(directory, 'src/lib/design-tokens');
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(directory, 'src/lib/css/global'), { recursive: true });
  cpSync(fileURLToPath(new URL('./fixtures/brickhouse/', import.meta.url)), dir, {
    recursive: true,
    filter: (source) => !source.endsWith('expected.css')
  });
  return directory;
}

const quiet = { spacingOutput: false, typographyOutput: false, contrastOutput: false, checkVars: false };

test('writeIfChanged leaves an identical file untouched', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'toolkit-write-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, 'out.css');
  assert.equal(writeIfChanged(file, 'a\n'), true);
  const past = new Date(Date.now() - 60_000);
  utimesSync(file, past, past);
  assert.equal(writeIfChanged(file, 'a\n'), false);
  assert.ok(Math.abs(statSync(file).mtimeMs - past.getTime()) < 1000);
  assert.equal(writeIfChanged(file, 'b\n'), true);
  assert.equal(readFileSync(file, 'utf8'), 'b\n');
});

test('regenerating unchanged tokens does not rewrite the output', (t) => {
  const directory = workspace(t);
  const output = join(directory, 'src/lib/css/global/_tokens.generated.css');
  generateTokens({ root: directory, ...quiet });
  const past = new Date(Date.now() - 60_000);
  utimesSync(output, past, past);
  generateTokens({ root: directory, ...quiet });
  assert.ok(Math.abs(statSync(output).mtimeMs - past.getTime()) < 1000);
});

test('generateTokens resolves its default paths from root, not the working directory', (t) => {
  const directory = workspace(t);
  generateTokens({ root: directory, ...quiet });
  assert.match(readFileSync(join(directory, 'src/lib/css/global/_tokens.generated.css'), 'utf8'), /^\/\* AUTO-GENERATED/);
});

test('deleting a required token file is reported, then restoring it recovers', (t) => {
  const directory = workspace(t);
  const plugin = tokensPlugin({ debounce: 50, ...quiet });
  plugin.configResolved({ root: directory });
  plugin.buildStart();
  mock.timers.enable({ apis: ['setTimeout'] });
  const server = fakeServer();
  plugin.configureServer(server);

  const file = join(directory, 'src/lib/design-tokens/fonts.json');
  const saved = readFileSync(file);
  rmSync(file);
  server.watcher.emit('unlink', file);
  mock.timers.tick(50);
  assert.equal(server.sent[0].type, 'error');
  assert.match(server.sent[0].err.message, /fonts\.json/);

  writeFileSync(file, saved);
  server.watcher.emit('add', file);
  mock.timers.tick(50);
  assert.deepEqual(server.sent[1], { type: 'full-reload' });
});

test('invalid JSON is reported with the file name rather than thrown', (t) => {
  const directory = workspace(t);
  const plugin = tokensPlugin({ debounce: 50, ...quiet });
  plugin.configResolved({ root: directory });
  mock.timers.enable({ apis: ['setTimeout'] });
  const server = fakeServer();
  plugin.configureServer(server);

  const file = join(directory, 'src/lib/design-tokens/spacing.json');
  writeFileSync(file, '{ "items": [');
  server.watcher.emit('change', file);
  assert.doesNotThrow(() => mock.timers.tick(50));
  assert.equal(server.logs[0][0], 'error');
  assert.match(server.logs[0][1], /JSON/);
});
