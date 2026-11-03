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

// The block at the end of each file, inside @media (prefers-reduced-motion: reduce)
const reduceBlock = (css) => {
  const start = css.indexOf('@media (prefers-reduced-motion: reduce)');
  return start === -1 ? null : css.slice(start);
};

describe('transitions: reduced motion', () => {
  for (const entry of manifest) {
    test(`${entry.name}: a reduce block that only fades`, () => {
      const css = cssOf(entry);
      const block = reduceBlock(css);
      assert.ok(block, 'no prefers-reduced-motion: reduce block');
      assert.equal(css.match(/prefers-reduced-motion: reduce/g).length, 1);
      assert.match(block, /var\(--segue-fade-duration, 180ms\)/);
      assert.match(block, /::view-transition-group\(root\) \{\s*animation: none;/);
      for (const banned of ['transform', 'clip-path', 'filter', 'mask', 'scale', 'translate', 'rotate']) {
        assert.ok(!block.includes(banned), `reduce block uses ${banned}`);
      }
      assert.equal(typeof entry.reducedMotion, 'string');
    });

    test(`${entry.name}: every other animated rule is no-preference only`, () => {
      const css = cssOf(entry);
      const before = css.slice(0, css.indexOf('@media (prefers-reduced-motion: reduce)'));
      // Outside @media blocks there may be @property, @keyframes, :root and
      // mask styles, but no rule that targets a view-transition pseudo
      let depth = 0;
      let inMotionBlock = false;
      for (const line of before.split('\n')) {
        if (depth === 0 && line.startsWith('@media (prefers-reduced-motion: no-preference)')) inMotionBlock = true;
        if (!inMotionBlock && /::view-transition-|animation:/.test(line) && !line.trim().startsWith('@')) {
          assert.fail(`outside no-preference: ${line.trim()}`);
        }
        depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        if (depth === 0) inMotionBlock = false;
      }
    });
  }
});

describe('transitions: verdicts', () => {
  const verdicts = ['keep', 'tone down', 'drop'];

  for (const entry of manifest) {
    test(`${entry.name}: a verdict, a one-line why, and an override to tone down`, () => {
      assert.ok(verdicts.includes(entry.verdict), entry.verdict);
      assert.ok(entry.why.length > 20 && !entry.why.includes('\n'));
      assert.equal(typeof entry.shortlist, 'boolean');
      if (entry.shortlist) assert.notEqual(entry.verdict, 'drop');
      if (entry.verdict !== 'tone down') {
        assert.equal(entry.override, undefined);
        return;
      }
      const { css, durationMs } = entry.override;
      assert.ok(durationMs < entry.durationMs && durationMs <= 600);
      // An override only sets custom properties the file exposes on :root
      const exposed = cssOf(entry).match(/^:root \{[\s\S]*?^\}/m)[0];
      for (const [, name] of css.matchAll(/(--segue-[a-z-]+):/g)) {
        assert.ok(exposed.includes(`${name}:`), `${name} is not in ${entry.css}'s :root`);
      }
    });
  }

  test('the shortlist is the five in AUDIT.md', () => {
    const shortlist = manifest.filter((t) => t.shortlist).map((t) => t.slug).sort();
    assert.deepEqual(shortlist, ['circle-pop', 'focus-pull', 'framed-cover', 'slide-left', 'slide-up']);
  });

  test("Focus Pull keeps its default look; Root's 0.35s is the override", () => {
    const focus = manifest.find((t) => t.slug === 'focus-pull');
    const css = cssOf(focus);
    assert.match(css, /--segue-duration: 0\.8s;/);
    assert.match(css, /filter: blur\(16px\);/);
    assert.match(focus.override.css, /--segue-duration: 0\.35s;/);
  });
});
