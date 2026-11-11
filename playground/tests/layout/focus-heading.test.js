import { test } from 'node:test';
import assert from 'node:assert/strict';
import { focusHeading } from '@thoughtfox/toolkit/layout/focus-heading.js';

test('initial load and hash navigation do not access the document', () => {
  const focus = focusHeading();
  focus({ from: null, to: { url: new URL('https://example.com/') } });
  focus({ from: {}, to: { url: new URL('https://example.com/about#details') } });
});

test('navigation focuses the heading without scrolling and preserves existing tabindex', (t) => {
  const calls = [];
  let tabindex;
  const heading = {
    hasAttribute: () => tabindex !== undefined,
    setAttribute: (name, value) => { calls.push([name, value]); tabindex = value; },
    focus: (options) => calls.push(options)
  };
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', {
    configurable: true, value: { querySelector: (selector) => selector === 'main h1' ? heading : null }
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'document', original);
    else delete globalThis.document;
  });
  const navigate = focusHeading();
  navigate({ from: {}, to: { url: new URL('https://example.com/about') } });
  assert.deepEqual(calls, [['tabindex', '-1'], { preventScroll: true }]);
  calls.length = 0;
  tabindex = '0';
  navigate({ from: {}, to: { url: new URL('https://example.com/contact') } });
  assert.deepEqual(calls, [{ preventScroll: true }]);
});
