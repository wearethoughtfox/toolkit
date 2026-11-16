import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadTokenConfig,
  loadTokenOptions,
  parseTokenArgs
} from '@thoughtfox/toolkit/tokens/cli-options.js';

const fixture = fileURLToPath(new URL('./fixtures/brickhouse/', import.meta.url));
const expected = readFileSync(join(fixture, 'expected.css'), 'utf8');
const entries = ['tokens/generate-tokens.js', 'scripts/generate-tokens.js'].map((path) =>
  fileURLToPath(new URL(`../../../${path}`, import.meta.url))
);
// Only the main output, so the run needs nothing but the token files.
const quiet = 'spacingOutput: false, typographyOutput: false, contrastOutput: false, checkVars: false';

function tempDir(t) {
  const directory = mkdtempSync(join(tmpdir(), 'toolkit-cli-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

/** A site root holding Brick House's token files and, optionally, a config. */
function site(t, config) {
  const root = tempDir(t);
  const tokensDir = join(root, 'src/lib/design-tokens');
  mkdirSync(tokensDir, { recursive: true });
  cpSync(fixture, tokensDir, { recursive: true });
  rmSync(join(tokensDir, 'expected.css'));
  mkdirSync(join(root, 'src/lib/css/global'), { recursive: true });
  writeFileSync(join(root, 'package.json'), '{ "type": "module" }');
  if (config) writeFileSync(join(root, 'tokens.config.js'), config);
  return root;
}

const run = (entry, root, args = []) =>
  execFileSync(process.execPath, [entry, ...args], { cwd: root, stdio: 'pipe' });
const output = (root) => readFileSync(join(root, 'src/lib/css/global/_tokens.generated.css'), 'utf8');

test('flags: both spellings of --clamp-precision', () => {
  assert.deepEqual(parseTokenArgs([]), {});
  assert.deepEqual(parseTokenArgs(['--clamp-precision=4']), { clampPrecision: 4 });
  assert.deepEqual(parseTokenArgs(['--clamp-precision', '4']), { clampPrecision: 4 });
});

test('flags: a typo or a missing number fails instead of running at the default', () => {
  for (const argv of [['--clampPrecision=4'], ['--precision', '4'], ['4']]) {
    assert.throws(() => parseTokenArgs(argv), /Unknown option/);
  }
  for (const argv of [['--clamp-precision'], ['--clamp-precision='], ['--clamp-precision=four'], ['--clamp-precision=1.5']]) {
    assert.throws(() => parseTokenArgs(argv), /whole number/);
  }
});

test('config: default export, named tokenOptions export, or no file', async (t) => {
  const withDefault = tempDir(t);
  writeFileSync(join(withDefault, 'tokens.config.mjs'), 'export default { clampPrecision: 4 };');
  assert.deepEqual(await loadTokenConfig(withDefault), { clampPrecision: 4 });

  const withNamed = tempDir(t);
  writeFileSync(join(withNamed, 'tokens.config.mjs'), 'export const tokenOptions = { clampPrecision: 3 };');
  assert.deepEqual(await loadTokenConfig(withNamed), { clampPrecision: 3 });

  assert.deepEqual(await loadTokenConfig(tempDir(t)), {});
});

test('config: a file that exports no options is an error, not a silent default', async (t) => {
  const root = tempDir(t);
  writeFileSync(join(root, 'tokens.config.mjs'), 'export const options = { clampPrecision: 4 };');
  await assert.rejects(loadTokenConfig(root), /must export the options object/);
});

test('a flag wins over the config file', async (t) => {
  const root = tempDir(t);
  writeFileSync(join(root, 'tokens.config.mjs'), 'export default { clampPrecision: 4, checkVars: false };');
  assert.deepEqual(await loadTokenOptions({ root, argv: ['--clamp-precision=6'] }), {
    clampPrecision: 6,
    checkVars: false
  });
});

for (const entry of entries) {
  const name = entry.includes('/scripts/') ? 'scripts/ (v0.1.0 path)' : 'tokens/';

  test(`${name}: the command reads tokens.config.js, so Brick House's CSS comes out exactly`, (t) => {
    const root = site(t, `export const tokenOptions = { clampPrecision: 4, ${quiet} };`);
    run(entry, root);
    assert.equal(output(root), expected);
  });

  test(`${name}: the flag alone does the same`, (t) => {
    const root = site(t, `export default { ${quiet} };`);
    run(entry, root, ['--clamp-precision=4']);
    assert.equal(output(root), expected);
  });

  test(`${name}: with no precision set anywhere the default of 2 still applies`, (t) => {
    const root = site(t, `export default { ${quiet} };`);
    run(entry, root);
    assert.notEqual(output(root), expected);
    assert.doesNotMatch(output(root), /\+ \d+\.\d{3,}vw/);
  });

  test(`${name}: a mistyped flag stops the run and writes nothing`, (t) => {
    const root = site(t, `export default { ${quiet} };`);
    assert.throws(() => run(entry, root, ['--clamp-precison=4']), /Unknown option/);
    assert.throws(() => output(root), /ENOENT/);
  });
}
