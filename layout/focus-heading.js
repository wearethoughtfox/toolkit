/**
 * Moves keyboard and screen-reader focus to the new page's heading after a
 * client-side navigation, so the next Tab starts at the top of the content
 * instead of wherever the clicked link was.
 *
 * Usage (root +layout.svelte, at the top level of the script):
 *   import { afterNavigate } from '$app/navigation';
 *   import { focusHeading } from '@thoughtfox/toolkit/layout';
 *   afterNavigate(focusHeading());
 *
 * Call afterNavigate at the top level, never inside onMount: a lifecycle
 * function registered from inside onMount is dropped without an error, which
 * is how this stopped working on every site that copied the old snippet.
 *
 * It does nothing on the first load (focus stays where the browser put it)
 * or when the URL has a #hash (SvelteKit focuses and scrolls to that
 * element). It never scrolls, so Back still restores the scroll position.
 */
export function focusHeading({ selector = 'main h1', fallback = 'main' } = {}) {
  return ({ from, to }) => {
    if (!from || to?.url.hash) return;
    const target = document.querySelector(selector) ?? document.querySelector(fallback);
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  };
}
