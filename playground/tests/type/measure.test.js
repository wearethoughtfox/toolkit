// Only the pure parts of measure.js. lineStats, isAvailable and
// xHeightRatio need a DOM or a canvas and are tested by eye in the /type lab.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { boxes, familyOf, targetAt, verdict } from '@thoughtfox/toolkit/type/measure.js';

describe('boxes', () => {
  test("are Chimero's: 5–6 words at 320px, 10–14 at 700px", () => {
    assert.deepEqual(boxes, [
      { width: 320, words: [5, 6] },
      { width: 700, words: [10, 14] }
    ]);
  });
});

describe('verdict', () => {
  test('inside the target, including both ends, is on target', () => {
    for (const average of [5, 5.5, 6]) assert.equal(verdict(average, [5, 6]), 'on target', `${average}`);
    for (const average of [10, 12, 14]) assert.equal(verdict(average, [10, 14]), 'on target', `${average}`);
  });

  test('below the target is too few', () => {
    assert.equal(verdict(4.9, [5, 6]), 'too few');
    assert.equal(verdict(0, [5, 6]), 'too few');
  });

  test('above the target is too many', () => {
    assert.equal(verdict(6.1, [5, 6]), 'too many');
    assert.equal(verdict(20, [10, 14]), 'too many');
  });

  test('the average is rounded to 0.1 first, as the lab shows it', () => {
    assert.equal(verdict(4.96, [5, 6]), 'on target');
    assert.equal(verdict(4.94, [5, 6]), 'too few');
    assert.equal(verdict(6.04, [5, 6]), 'on target');
    assert.equal(verdict(6.06, [5, 6]), 'too many');
  });
});

describe('targetAt', () => {
  test('is 5.5 at 320px and 12 at 700px', () => {
    assert.equal(targetAt(320), 5.5);
    assert.equal(targetAt(700), 12);
  });

  test('is a straight line between and beyond the boxes', () => {
    assert.equal(targetAt(510), 8.75);
    assert.equal(targetAt(600), 5.5 + (280 * 6.5) / 380);
    assert.equal(targetAt(1080), 18.5);
    assert.equal(targetAt(130), 2.25);
  });
});

describe('familyOf', () => {
  for (const [stack, family] of [
    ["'Inter', 'Helvetica Neue', Arial, sans-serif", 'Inter'],
    ['"Rockhill Sans Rough", Inter, sans-serif', 'Rockhill Sans Rough'],
    ['Georgia, serif', 'Georgia'],
    ['system-ui, sans-serif', 'system-ui'],
    ['  Inter  ,serif', 'Inter'],
    ['serif', 'serif']
  ]) {
    test(`${JSON.stringify(stack)} → ${family}`, () => {
      assert.equal(familyOf(stack), family);
    });
  }
});
