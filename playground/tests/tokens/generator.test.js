import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clampGenerator, generateTokens } from '@thoughtfox/toolkit/tokens/generate-tokens.js';

const viewports = { min: 330, mid: 700, max: 1350 };
const body = { name: 'Body', min: 18, max: 20 };

test('existing tokens retain two-decimal output', () => {
  assert.equal(clampGenerator([body], viewports)[0].value,
    'clamp(1.125rem, 1.08rem + 0.20vw, 1.25rem)');
});

test('named viewport and four-decimal precision meet the body size endpoints', () => {
  const [{ value }] = clampGenerator([{ ...body, maxViewport: 'mid' }], viewports, { precision: 4 });
  const [, intercept, slope] = value.match(/, ([\d.]+)rem \+ ([\d.]+)vw/);
  for (const [width, expected] of [[330, 18], [515, 19], [700, 20]]) {
    assert.ok(Math.abs(Number(intercept) * 16 + Number(slope) * width / 100 - expected) < 0.001);
  }
});

test('constant tokens do not require a viewport range', () => {
  assert.equal(clampGenerator([{ name: 'Fixed', min: 16, max: 16 }], {})[0].value, '1rem');
});

test('invalid viewport ranges fail with the token name instead of emitting NaN or Infinity', () => {
  for (const mid of [undefined, 330, 200, Infinity]) {
    assert.throws(() => clampGenerator([{ ...body, maxViewport: 'mid' }], { ...viewports, mid }), /Body.*mid/);
  }
});

test('precision is bounded', () => {
  for (const precision of [-1, 11, 1.5, NaN]) {
    assert.throws(() => clampGenerator([body], viewports, { precision }), /precision/);
  }
});

test('Brick House tokens generate exactly the existing CSS with precision 4', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'toolkit-tokens-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const fixture = new URL('./fixtures/brickhouse/', import.meta.url);
  const output = join(directory, 'tokens.css');
  generateTokens({
    tokensDir: fileURLToPath(fixture), output,
    spacingOutput: false, typographyOutput: false, contrastOutput: false,
    checkVars: false, clampPrecision: 4
  });
  assert.equal(readFileSync(output, 'utf8'),
    readFileSync(new URL('expected.css', fixture), 'utf8'));
});
