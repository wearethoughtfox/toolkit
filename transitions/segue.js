/**
 * Page transitions for the Segue CSS in css/transitions/.
 *
 * SvelteKit navigates client-side, so the CSS's @view-transition rule never
 * fires; this wraps each navigation in a view transition instead. The CSS
 * decides what it looks like.
 *
 * Usage (root +layout.svelte):
 *   import { onNavigate } from '$app/navigation';
 *   import { segueTransitions } from '@thoughtfox/toolkit';
 *   onNavigate(segueTransitions());
 *
 * Going back (history traverse) tags the transition "backwards", so
 * transitions that have a reverse play it. Each click sets --segue-x /
 * --segue-y on <html>, so pointer-origin transitions grow from the click.
 * Browsers without view transitions just navigate.
 */
export function segueTransitions() {
  if (typeof window !== 'undefined') trackOrigin();

  return (navigation) => {
    if (!document.startViewTransition) return;
    if (navigation.from?.url.href === navigation.to?.url.href) return;

    const back = (navigation.delta ?? 0) < 0;
    return new Promise((resolve) => {
      segue(async () => {
        resolve();
        await navigation.complete;
      }, { back });
    });
  };
}

/**
 * Same-page transition: segue(() => swapContent(), { back: true }).
 * Runs the update without animation where view transitions aren't supported.
 */
export function segue(update, { back = false } = {}) {
  if (!document.startViewTransition) {
    update();
    return;
  }
  try {
    return document.startViewTransition({ update, types: [back ? 'backwards' : 'forwards'] });
  } catch {
    // View transitions without types: no reverse, but still animates
    return document.startViewTransition(update);
  }
}

let tracking = false;

function trackOrigin() {
  if (tracking) return;
  tracking = true;

  const root = document.documentElement;
  const setOrigin = (x, y) => {
    root.style.setProperty('--segue-x', `${x}px`);
    root.style.setProperty('--segue-y', `${y}px`);
  };

  addEventListener('pointerdown', (e) => setOrigin(e.clientX, e.clientY), true);

  // Keyboard activation: grow from the middle of the focused control
  addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const box = document.activeElement?.getBoundingClientRect?.();
    if (box?.width) setOrigin(box.x + box.width / 2, box.y + box.height / 2);
  }, true);
}
