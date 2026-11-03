import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { settingAt, typographyCss } from './css.js';

const viewports = { min: 330, max: 1350 };

const step = (name, small, large, extra = {}) => ({
  name,
  role: `${name} role`,
  face: 'sans',
  weight: 400,
  small: { size: small[0], leading: small[1] },
  large: { size: large[0], leading: large[1] },
  ...extra
});

function typography(change = {}) {
  return {
    mode: 'stepped',
    breakpoint: 600,
    maxWidth: 700,
    candidates: [
      { id: 'sans', stack: "'Inter', 'Helvetica Neue', Arial, sans-serif" },
      { id: 'serif', stack: 'Georgia, serif' }
    ],
    scale: [
      step('label', [13, 16], [13, 16], { weight: 500 }),
      step('body', [18, 24], [20, 28]),
      step('h1', [36, 40], [52, 56], { face: 'serif', weight: 700 })
    ],
    ...change
  };
}

/** The declarations in the first `:root` block, and those in the `@media` block if there is one */
function parse(css) {
  const decls = (block) => Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const media = css.match(/@media \(min-width: ([\d.]+)em\) \{\s*:root \{([^}]*)\}\s*\}/);
  const root = css.slice(css.indexOf(':root {'), css.indexOf('}') + 1);
  return { root: decls(root), media: media ? { em: Number(media[1]), decls: decls(media[2]) } : null };
}

const px = (value) => {
  const m = value.match(/^(-?[\d.]+)rem$/);
  assert.ok(m, `"${value}" should be a rem value`);
  return Number(m[1]) * 16;
};

/**
 * Evaluates a value written by fluid() at a viewport width, with CSS's own
 * rule for clamp(MIN, VAL, MAX): max(MIN, min(VAL, MAX)), so MIN wins when
 * it's bigger than MAX.
 */
function evaluate(value, viewport) {
  const m = value.match(/^clamp\((-?[\d.]+)rem, (-?[\d.]+)rem \+ (-?[\d.]+)vw, (-?[\d.]+)rem\)$/);
  if (!m) return px(value);
  const [min, intercept, vw, max] = m.slice(1).map(Number);
  const preferred = intercept * 16 + (vw * viewport) / 100;
  return Math.max(min * 16, Math.min(preferred, max * 16));
}

const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 0.01, `${message}: ${actual} should be ${expected}`);

describe('typographyCss, stepped', () => {
  const t = typography();
  const css = typographyCss(t, viewports);
  const { root, media } = parse(css);

  test('says it is generated and which mode it is in', () => {
    assert.match(css, /^\/\* AUTO-GENERATED from typography\.json/);
    assert.match(css, /Mode: stepped, switching at 600px\./);
    assert.ok(css.endsWith('}\n'));
  });

  test('max width is in rem', () => {
    assert.equal(root['--type-max-width'], '43.75rem');
  });

  test('the small settings are in :root: sizes in rem, line heights as ratios', () => {
    assert.equal(root['--type-label-size'], '0.8125rem');
    assert.equal(root['--type-label-leading'], '1.2308');
    assert.equal(root['--type-body-size'], '1.125rem');
    assert.equal(root['--type-body-leading'], '1.3333');
    assert.equal(root['--type-h1-size'], '2.25rem');
    assert.equal(root['--type-h1-leading'], '1.1111');
  });

  test('each ratio gives back the chosen px at its setting', () => {
    for (const s of t.scale) {
      close(Number(root[`--type-${s.name}-leading`]) * s.small.size, s.small.leading, `${s.name} small`);
      close(Number(media.decls[`--type-${s.name}-leading`]) * s.large.size, s.large.leading, `${s.name} large`);
    }
  });

  test('the large settings are in a min-width media query at the breakpoint, in em', () => {
    assert.ok(media, 'there should be a media query');
    assert.equal(media.em, 37.5);
    assert.deepEqual(media.decls, {
      '--type-label-size': '0.8125rem',
      '--type-label-leading': '1.2308',
      '--type-body-size': '1.25rem',
      '--type-body-leading': '1.4',
      '--type-h1-size': '3.25rem',
      '--type-h1-leading': '1.0769'
    });
  });

  test('font and weight are only in :root', () => {
    assert.equal(root['--type-label-font'], "'Inter', 'Helvetica Neue', Arial, sans-serif");
    assert.equal(root['--type-h1-font'], 'Georgia, serif');
    assert.equal(root['--type-label-weight'], '500');
    assert.equal(root['--type-h1-weight'], '700');
    assert.ok(!('--type-h1-font' in media.decls));
  });

  test('each step has a comment with its role', () => {
    assert.match(css, /\/\* body: body role \*\//);
  });

  test('an unknown face falls back to inherit', () => {
    const scale = [step('body', [18, 24], [20, 28], { face: 'missing' })];
    assert.equal(parse(typographyCss(typography({ scale }), viewports)).root['--type-body-font'], 'inherit');
  });

  test('rem values are rounded to 4 decimals with no trailing zeros', () => {
    const scale = [step('odd', [17, 23], [17, 23])];
    const out = parse(typographyCss(typography({ scale, breakpoint: 601, maxWidth: 650 }), viewports));
    assert.equal(out.root['--type-odd-size'], '1.0625rem');
    assert.equal(out.root['--type-odd-leading'], '1.3529');
    assert.equal(out.root['--type-max-width'], '40.625rem');
    assert.equal(out.media.em, 37.5625);
  });

  test('the shipped typography.json generates', () => {
    const shipped = JSON.parse(readFileSync(new URL('../design-tokens/typography.json', import.meta.url), 'utf-8'));
    const out = parse(typographyCss(shipped, viewports));
    assert.equal(out.root['--type-body-size'], '1.125rem');
    assert.equal(out.media.decls['--type-body-size'], '1.25rem');
  });
});

describe('typographyCss, fluid', () => {
  const t = typography({ mode: 'fluid' });
  const css = typographyCss(t, viewports);
  const { root, media } = parse(css);

  test('says it is fluid and where it stops', () => {
    assert.match(css, /Mode: fluid from 330px, stopping at 600px\./);
  });

  test('has no media query', () => {
    assert.equal(media, null);
    assert.ok(!css.includes('@media'));
  });

  test('a step with the same size at both ends is a plain rem value, and its ratio is exact', () => {
    assert.equal(root['--type-label-size'], '0.8125rem');
    assert.equal(root['--type-label-leading'], '1.2308');
  });

  for (const name of ['body', 'h1']) {
    test(`${name} size is a clamp that equals the small value at viewports.min and the large value at the breakpoint`, () => {
      const value = root[`--type-${name}-size`];
      assert.match(value, /^clamp\(/);
      const s = t.scale.find((x) => x.name === name);
      close(evaluate(value, viewports.min), s.small.size, 'at viewports.min');
      close(evaluate(value, t.breakpoint), s.large.size, 'at the breakpoint');
      close(evaluate(value, 200), s.small.size, 'below viewports.min');
      close(evaluate(value, 1200), s.large.size, 'above the breakpoint');
    });

    test(`${name} leading is one ratio, the mean of the two ends, within a pixel of each`, () => {
      const value = Number(root[`--type-${name}-leading`]);
      const s = t.scale.find((x) => x.name === name);
      const mean = (s.small.leading / s.small.size + s.large.leading / s.large.size) / 2;
      assert.ok(Math.abs(value - mean) < 0.0001, `${value} should be ${mean}`);
      assert.ok(Math.abs(value * s.small.size - s.small.leading) <= 1, 'at viewports.min');
      assert.ok(Math.abs(value * s.large.size - s.large.leading) <= 1, 'at the breakpoint');
    });

    test(`${name} matches settingAt in between`, () => {
      const size = root[`--type-${name}-size`];
      const leading = Number(root[`--type-${name}-leading`]);
      const s = t.scale.find((x) => x.name === name);
      for (const w of [400, 465, 550]) {
        // settingAt rounds to 0.1px
        const at = settingAt(s, w, t, viewports);
        assert.ok(Math.abs(evaluate(size, w) - at.size) <= 0.05, `size at ${w}px`);
        assert.ok(Math.abs(evaluate(size, w) * leading - at.leading) <= 0.06, `leading at ${w}px`);
      }
    });
  }

  test('a clamp with a negative intercept still meets both ends', () => {
    const scale = [step('hero', [20, 24], [80, 84])];
    const tt = typography({ mode: 'fluid', scale });
    const value = parse(typographyCss(tt, viewports)).root['--type-hero-size'];
    assert.match(value, /clamp\([\d.]+rem, -[\d.]+rem \+/);
    close(evaluate(value, viewports.min), 20, 'at viewports.min');
    close(evaluate(value, tt.breakpoint), 80, 'at the breakpoint');
  });

  test('a size that gets smaller still goes from the small value to the large value', () => {
    // Shrinking is warned about in checks.js but it isn't an error, so
    // clamp() needs its bounds swapped (40 → 36)
    const scale = [step('h1', [40, 44], [36, 40])];
    const tt = typography({ mode: 'fluid', scale });
    const value = parse(typographyCss(tt, viewports)).root['--type-h1-size'];
    close(evaluate(value, viewports.min), 40, 'at viewports.min');
    close(evaluate(value, tt.breakpoint), 36, 'at the breakpoint');
    close(evaluate(value, 465), settingAt(scale[0], 465, tt, viewports).size, 'halfway');
  });

  for (const breakpoint of [330, 300]) {
    test(`falls back to stepped when the breakpoint (${breakpoint}) is at or below viewports.min`, () => {
      const out = typographyCss(typography({ mode: 'fluid', breakpoint }), viewports);
      assert.match(out, new RegExp(`Mode: stepped, switching at ${breakpoint}px\\.`));
      assert.ok(!out.includes('clamp('));
      const { root: r, media: m } = parse(out);
      assert.equal(r['--type-body-size'], '1.125rem');
      assert.equal(m.em, breakpoint / 16);
      assert.equal(m.decls['--type-body-size'], '1.25rem');
    });
  }
});

describe('settingAt', () => {
  const body = step('body', [18, 24], [20, 28]);

  describe('stepped', () => {
    const t = typography();
    test('below the breakpoint is the small setting', () => {
      assert.deepEqual(settingAt(body, 599, t, viewports), { size: 18, leading: 24 });
      assert.deepEqual(settingAt(body, 200, t, viewports), { size: 18, leading: 24 });
    });
    test('at the breakpoint is the large setting, as the min-width media query is', () => {
      assert.deepEqual(settingAt(body, 600, t, viewports), { size: 20, leading: 28 });
    });
    test('above the breakpoint is the large setting', () => {
      assert.deepEqual(settingAt(body, 1400, t, viewports), { size: 20, leading: 28 });
    });
  });

  describe('fluid', () => {
    const t = typography({ mode: 'fluid' });
    // The line height is what the CSS gives: the size times the mean
    // ratio, (24/18 + 28/20) / 2 = 1.3667, so within a pixel of 24 and 28
    test('at and below viewports.min is the small size', () => {
      assert.deepEqual(settingAt(body, 330, t, viewports), { size: 18, leading: 24.6 });
      assert.deepEqual(settingAt(body, 100, t, viewports), { size: 18, leading: 24.6 });
    });
    test('halfway between viewports.min and the breakpoint is halfway between the sizes', () => {
      assert.deepEqual(settingAt(body, 465, t, viewports), { size: 19, leading: 26 });
    });
    test('below the breakpoint is in between, rounded to 0.1px', () => {
      // p = (500 - 330) / 270 = 0.6296…
      assert.deepEqual(settingAt(body, 500, t, viewports), { size: 19.3, leading: 26.3 });
    });
    test('at the breakpoint is the large size', () => {
      assert.deepEqual(settingAt(body, 600, t, viewports), { size: 20, leading: 27.3 });
    });
    test('above the breakpoint stops at the large size', () => {
      assert.deepEqual(settingAt(body, 1400, t, viewports), { size: 20, leading: 27.3 });
    });
    for (const breakpoint of [330, 300]) {
      test(`falls back to stepped when the breakpoint (${breakpoint}) is at or below viewports.min`, () => {
        const tt = typography({ mode: 'fluid', breakpoint });
        assert.deepEqual(settingAt(body, breakpoint - 1, tt, viewports), { size: 18, leading: 24 });
        assert.deepEqual(settingAt(body, breakpoint, tt, viewports), { size: 20, leading: 28 });
        assert.deepEqual(settingAt(body, 1000, tt, viewports), { size: 20, leading: 28 });
      });
    }
  });
});
