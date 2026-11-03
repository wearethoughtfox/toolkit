import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// The manifest and CSS live in the package (motion/transitions/)
const manifestPath = fileURLToPath(
  import.meta.resolve('@thoughtfox/toolkit/motion/transitions/transitions.json')
);
const folder = dirname(manifestPath);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const cssOf = (entry) => readFileSync(join(folder, entry.css.replace('css/transitions/', '')), 'utf8');

// '--segue-duration: 0.8s' or 'animation: segue-hold 1.01s'
const seconds = (css, name) => {
  const match = css.match(new RegExp(`${name}:?\\s+([\\d.]+)s`));
  return match ? Number(match[1]) : null;
};

describe('transitions manifest: duration and easing', () => {
  test('lists all 46 transitions, each with a unique slug', () => {
    assert.equal(manifest.length, 46);
    assert.equal(new Set(manifest.map((t) => t.slug)).size, 46);
  });

  for (const entry of manifest) {
    test(`${entry.name}: durationMs matches the CSS`, () => {
      const css = cssOf(entry);
      const duration = seconds(css, '--segue-duration');
      const gap = seconds(css, '--segue-gap');
      let expected;
      if (duration !== null && gap !== null) expected = duration + 2 * gap; // three layers
      else if (duration !== null) expected = duration;
      else expected = seconds(css, 'segue-hold'); // cells and paint: fixed timing
      assert.ok(expected, 'no timing found in the CSS');
      assert.equal(entry.durationMs, Math.round(expected * 1000));
      assert.equal(typeof entry.timing, 'string');
    });

    test(`${entry.name}: every easing listed is in the CSS`, () => {
      const css = cssOf(entry);
      assert.ok(entry.easing.length > 0);
      for (const value of entry.easing) {
        const curve = value.match(/cubic-bezier\([^)]*\)/)?.[0] ?? value.split(' ')[0];
        assert.ok(css.includes(curve), `${curve} is not in ${entry.css}`);
      }
    });
  }
});
