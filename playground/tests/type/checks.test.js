import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { typographyErrors, typographyWarnings } from '@thoughtfox/toolkit/type/checks.js';

const shipped = JSON.parse(readFileSync(new URL('../../src/lib/design-tokens/typography.json', import.meta.url), 'utf-8'));

const step = (name, small, large = small, extra = {}) => ({
  name,
  role: name,
  face: 'sans',
  weight: 400,
  small: { size: small[0], leading: small[1] },
  large: { size: large[0], leading: large[1] },
  ...extra
});

/** A scale that passes every check: Chimero's body with a small spread of sizes around it */
function valid() {
  return {
    mode: 'stepped',
    breakpoint: 600,
    maxWidth: 700,
    candidates: [
      { id: 'sans', stack: "'Inter', sans-serif" },
      { id: 'serif', stack: 'Georgia, serif' }
    ],
    scale: [
      step('label', [13, 16]),
      step('small', [15, 20]),
      step('body', [18, 24], [20, 28]),
      step('h2', [24, 28], [28, 32], { face: 'serif' }),
      step('h1', [32, 36], [40, 44], { face: 'serif' })
    ]
  };
}

/** valid() with the named step changed */
function withStep(name, change) {
  const t = valid();
  const s = t.scale.find((x) => x.name === name);
  change(s);
  return t;
}

const matching = (messages, pattern) => messages.filter((m) => pattern.test(m));

describe('the fixtures', () => {
  test('valid() has no errors and no warnings', () => {
    assert.deepEqual(typographyErrors(valid()), []);
    assert.deepEqual(typographyWarnings(valid()), []);
  });

  test('the shipped typography.json has no errors and no warnings', () => {
    assert.deepEqual(typographyErrors(shipped), []);
    assert.deepEqual(typographyWarnings(shipped), []);
  });
});

describe('typographyErrors', () => {
  test('a missing scale array stops at once', () => {
    const t = valid();
    delete t.scale;
    assert.deepEqual(typographyErrors(t), ['missing "scale" array']);
    assert.deepEqual(typographyErrors({ ...valid(), scale: {} }), ['missing "scale" array']);
  });

  test('a missing candidates array stops at once', () => {
    const t = valid();
    delete t.candidates;
    assert.deepEqual(typographyErrors(t), ['missing "candidates" array']);
  });

  for (const bad of ['Body', 'h 1', '1st', '-body', 'body_text', '', undefined]) {
    test(`a step named ${JSON.stringify(bad)} is not kebab-case`, () => {
      const errors = typographyErrors(withStep('body', (s) => (s.name = bad)));
      assert.equal(matching(errors, /must be lowercase kebab-case/).length, 1, errors.join('\n'));
    });
  }

  for (const good of ['label', 'h3', 'small-caps', 'x2-large']) {
    test(`a step named "${good}" is accepted`, () => {
      assert.deepEqual(typographyErrors(withStep('label', (s) => (s.name = good))), []);
    });
  }

  test('a duplicate name is reported once per repeat', () => {
    const t = valid();
    t.scale.push(step('body', [18, 24]));
    assert.deepEqual(typographyErrors(t), ['scale: "body" appears twice']);
  });

  for (const end of ['small', 'large']) {
    test(`a missing ${end} end is reported`, () => {
      const errors = typographyErrors(withStep('h1', (s) => delete s[end]));
      assert.deepEqual(errors, [`scale.h1.${end}: needs a size and leading in px`]);
    });

    test(`a missing or zero ${end} size is reported`, () => {
      assert.deepEqual(typographyErrors(withStep('h1', (s) => delete s[end].size)), [`scale.h1.${end}: needs a size and leading in px`]);
      assert.deepEqual(typographyErrors(withStep('h1', (s) => (s[end].size = 0))), [`scale.h1.${end}: needs a size and leading in px`]);
    });

    test(`a missing, negative or non-numeric ${end} leading is reported`, () => {
      for (const leading of [undefined, -4, 'abc']) {
        const errors = typographyErrors(withStep('h1', (s) => (s[end].leading = leading)));
        assert.deepEqual(errors, [`scale.h1.${end}: needs a size and leading in px`], `leading ${leading}`);
      }
    });
  }

  // Question: a scale entry that isn't an object (null, a string) throws a
  // TypeError instead of returning an error message. The token script stops
  // either way, but the save endpoint returns a 500 instead of the list.
  test.todo('a scale entry that is not an object is reported as an error');

  test('a missing breakpoint and max width are reported', () => {
    const t = valid();
    delete t.breakpoint;
    t.maxWidth = 0;
    assert.deepEqual(typographyErrors(t), ['breakpoint: needs a width in px', 'maxWidth: needs a width in px']);
  });

  test('several problems are all listed', () => {
    const t = valid();
    t.scale.push(step('Body', [18, 24]), step('h1', [0, 0]));
    assert.equal(typographyErrors(t).length, 4);
  });
});

describe('typographyWarnings', () => {
  describe('4px rhythm', () => {
    test('a line-height off the rhythm is reported per end, with the nearest multiple of 4', () => {
      const warnings = typographyWarnings(withStep('body', (s) => (s.large.leading = 30)));
      assert.deepEqual(matching(warnings, /4px rhythm/), ['body (large): line-height 30px is off the 4px rhythm. Nearest: 32px.']);
    });

    for (const [leading, nearest] of [
      [21, 20],
      [23, 24],
      [25, 24],
      [26.5, 28],
      [2, 4]
    ]) {
      test(`${leading}px suggests ${nearest}px`, () => {
        const warnings = typographyWarnings(withStep('label', (s) => (s.small.leading = leading)));
        assert.ok(warnings.some((w) => w.includes(`line-height ${leading}px is off the 4px rhythm. Nearest: ${nearest}px.`)), warnings.join('\n'));
      });
    }

    test('a half-way value rounds up (22 → 24)', () => {
      const warnings = typographyWarnings(withStep('small', (s) => (s.small.leading = 22)));
      assert.ok(warnings.includes('small (small): line-height 22px is off the 4px rhythm. Nearest: 24px.'));
    });
  });

  test('a line-height less than the size is reported', () => {
    const warnings = typographyWarnings(withStep('h1', (s) => (s.large = { size: 40, leading: 36 })));
    assert.deepEqual(warnings, ['h1 (large): line-height 36px is less than the 40px size, so lines will collide.']);
  });

  test('a line-height equal to the size is allowed', () => {
    assert.deepEqual(typographyWarnings(withStep('h1', (s) => (s.large = { size: 40, leading: 40 }))), []);
  });

  describe('headline leading', () => {
    test('above 1.35 on a step bigger than body is body-like, with a suggestion at about 1.15', () => {
      const warnings = typographyWarnings(withStep('h1', (s) => (s.large = { size: 40, leading: 56 })));
      assert.deepEqual(warnings, ['h1 (large): headline leading of 1.40 is body-like, so the lines will drift apart. Try 48px.']);
    });

    test('exactly 1.35 is allowed', () => {
      // 1.35 × 80 = 108, on the rhythm
      assert.deepEqual(typographyWarnings(withStep('h1', (s) => (s.large = { size: 80, leading: 108 }))), []);
    });

    test('a step smaller than body can have loose leading', () => {
      // 13/20 is 1.54, but labels aren't headlines
      assert.deepEqual(typographyWarnings(withStep('label', (s) => (s.small.leading = s.large.leading = 20))), []);
    });

    test('body itself is never reported as a headline', () => {
      assert.deepEqual(typographyWarnings(withStep('body', (s) => (s.large = { size: 20, leading: 32 }))), []);
    });

    test('each end is compared with body at the same end', () => {
      // 19px is bigger than body's 18 below the breakpoint but smaller than its 20 above it
      const t = valid();
      t.scale.splice(3, 0, step('lead', [19, 28], [19, 28]));
      // 19 is also within 1.08 of body at both ends; only the headline rule matters here
      const headline = matching(typographyWarnings(t), /headline leading/);
      assert.deepEqual(headline, ['lead (small): headline leading of 1.47 is body-like, so the lines will drift apart. Try 20px.']);
    });

    test('nothing is compared when there is no body step', () => {
      const t = valid();
      t.scale = t.scale.filter((s) => s.name !== 'body');
      t.scale.find((s) => s.name === 'h1').large = { size: 40, leading: 60 };
      assert.deepEqual(matching(typographyWarnings(t), /headline leading/), []);
    });
  });

  test('a step that shrinks on wide screens is reported', () => {
    const warnings = typographyWarnings(withStep('h2', (s) => (s.large = { size: 22, leading: 28 })));
    assert.ok(warnings.includes('h2: gets smaller on wide screens (24 → 22px).'), warnings.join('\n'));
  });

  test('a step that stays the same size is not reported as shrinking', () => {
    assert.deepEqual(matching(typographyWarnings(valid()), /gets smaller/), []);
  });

  test('body over 20px on wide screens is reported', () => {
    const warnings = typographyWarnings(withStep('body', (s) => (s.large = { size: 21, leading: 28 })));
    assert.deepEqual(matching(warnings, /Body is/), [
      'Body is 21px on wide screens. Above about 20px the eye travels further and the reader scrolls more; use the extra room for layout instead.'
    ]);
  });

  test('body at exactly 20px is allowed', () => {
    assert.deepEqual(matching(typographyWarnings(valid()), /Body is/), []);
  });

  describe('three consecutive small sizes', () => {
    test('13, 14, 15 below body is reported', () => {
      const t = valid();
      t.scale.splice(1, 0, step('meta', [14, 20]));
      const warnings = matching(typographyWarnings(t), /three consecutive/);
      assert.deepEqual(warnings, [
        'small: 13, 14, 15px are three consecutive small sizes. Spread them and use weight or colour for the rest.',
        'large: 13, 14, 15px are three consecutive small sizes. Spread them and use weight or colour for the rest.'
      ]);
    });

    test('the run can end at the body size', () => {
      const t = valid();
      t.scale = [step('label', [16, 20]), step('meta', [17, 24]), step('body', [18, 24])];
      assert.deepEqual(matching(typographyWarnings(t), /three consecutive/), [
        'small: 16, 17, 18px are three consecutive small sizes. Spread them and use weight or colour for the rest.',
        'large: 16, 17, 18px are three consecutive small sizes. Spread them and use weight or colour for the rest.'
      ]);
    });

    test('13, 15, 16 (the skill’s spread) is not reported', () => {
      const t = valid();
      t.scale.splice(2, 0, step('meta', [16, 20]));
      assert.deepEqual(matching(typographyWarnings(t), /three consecutive/), []);
    });

    test('the same run above body is not a small-size problem', () => {
      const t = valid();
      t.scale.push(step('d1', [40, 44]), step('d2', [41, 48]), step('d3', [42, 48]));
      assert.deepEqual(matching(typographyWarnings(t), /three consecutive/), []);
    });
  });

  describe('sizes too close', () => {
    test('two sizes under 2px apart are reported', () => {
      const t = valid();
      t.scale.splice(1, 0, step('meta', [14, 20]));
      const warnings = matching(typographyWarnings(t), /close enough/);
      assert.ok(warnings.includes('small: 13px and 14px are close enough to look like one size set inconsistently. Merge them, or separate them by weight, colour or face.'));
      assert.ok(warnings.includes('small: 14px and 15px are close enough to look like one size set inconsistently. Merge them, or separate them by weight, colour or face.'));
    });

    test('two sizes 2px or more apart but under a 1.08 ratio are reported', () => {
      // 40 → 43 is 3px but only 1.075
      const t = valid();
      t.scale.push(step('display', [43, 48]));
      const warnings = matching(typographyWarnings(t), /close enough/);
      assert.deepEqual(warnings, [
        'large: 40px and 43px are close enough to look like one size set inconsistently. Merge them, or separate them by weight, colour or face.'
      ]);
    });

    test('a 1.08 ratio exactly is allowed', () => {
      // 25 → 27 is 2px and exactly 1.08
      const t = valid();
      t.scale = [step('body', [18, 24]), step('h2', [25, 32]), step('h1', [27, 32])];
      assert.deepEqual(typographyWarnings(t), []);
    });

    test('two steps with the same size count as one size, not as two too close', () => {
      // Hierarchy by weight before size: same size, different weight
      const t = valid();
      t.scale.splice(1, 0, step('label-strong', [13, 16], [13, 16], { weight: 700 }));
      assert.deepEqual(typographyWarnings(t), []);
    });
  });

  test('more than 7 steps is reported; 7 is not', () => {
    const t = valid();
    t.scale.push(step('h0', [48, 52], [56, 60], { face: 'serif' }), step('hero', [60, 64], [72, 76], { face: 'serif' }));
    assert.deepEqual(typographyWarnings(t), []);
    t.scale.push(step('mega', [80, 84], [96, 100], { face: 'serif' }));
    assert.deepEqual(typographyWarnings(t), [
      '8 steps. Six or seven is usually enough: check spacing, weight and colour are doing their share before adding sizes.'
    ]);
  });

  test('a missing body step is reported', () => {
    const t = valid();
    t.scale = t.scale.filter((s) => s.name !== 'body');
    assert.deepEqual(matching(typographyWarnings(t), /"body"/), ['No step is named "body". The body boxes and the breakpoint finder need one.']);
  });

  test('without a body step, all sizes count as the small end', () => {
    const t = valid();
    t.scale = [step('a', [30, 36]), step('b', [31, 36]), step('c', [32, 36])];
    assert.ok(typographyWarnings(t).some((w) => w.startsWith('small: 30, 31, 32px are three consecutive small sizes')));
  });

  test('an unknown face is reported', () => {
    const warnings = typographyWarnings(withStep('h1', (s) => (s.face = 'futura')));
    assert.deepEqual(warnings, ['h1: face "futura" isn\'t one of the candidates.']);
  });
});
