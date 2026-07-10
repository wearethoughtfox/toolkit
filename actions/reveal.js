/**
 * Svelte action: sets data-revealed="true" when the element enters the viewport.
 * CSS handles all animation — no component state needed.
 *
 * Usage:
 *   <div use:reveal>...</div>
 *   <div use:reveal={{ delay: 150 }}>...</div>   ← staggered
 *
 * Progressive enhancement: without JS no data-revealed attribute is set,
 * so elements display normally. CSS only hides/animates when the attribute exists.
 */
export function reveal(node, { threshold = 0.12, rootMargin = '0px 0px -40px 0px', delay = 0 } = {}) {
  node.dataset.revealed = 'false';

  if (delay) {
    node.style.setProperty('--reveal-delay', `${delay}ms`);
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        node.dataset.revealed = 'true';
        observer.disconnect();
      }
    },
    { threshold, rootMargin }
  );

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    }
  };
}
