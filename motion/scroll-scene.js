/**
 * Svelte action: scroll-scrubbed sticky scene.
 *
 * Attach to a tall "runway" section that contains a sticky frame (see
 * motion/compositions/scene.css). As the user scrolls through the runway the
 * action computes progress 0→1 and:
 *   - sets the `--scene-progress` custom property on the node (pure-CSS use)
 *   - calls `onProgress(progress, node)` (JS-driven recipes: lerp, phases…)
 *
 * Usage:
 *   <section class="scene" use:scrollScene={{ onProgress }}>
 *     <div class="scene__frame">…</div>
 *   </section>
 *
 * Also callable from vanilla JS (it's just a function of (node, options)
 * returning { update, destroy }) — the demo page uses it that way.
 *
 * Progressive enhancement / reduced motion: without JS nothing animates and
 * the markup shows its resting state. With prefers-reduced-motion, progress
 * jumps straight to 1 and no scroll listener is attached — so recipes MUST
 * treat progress = 1 as the fully-revealed, readable end state.
 */
export function scrollScene(node, options = {}) {
  if (typeof window === 'undefined') return {};

  let { onProgress, setVar = true, reducedMotion = 'skip' } = options;

  let listening = false;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

  function setProgress(progress) {
    if (setVar) node.style.setProperty('--scene-progress', String(progress));
    onProgress?.(progress, node);
  }

  function update() {
    const rect = node.getBoundingClientRect();
    const distance = node.offsetHeight - window.innerHeight;
    // Runway no taller than the viewport (e.g. collapsed by the
    // reduced-motion CSS): treat the scene as finished.
    if (distance < 1) {
      setProgress(1);
      return;
    }
    setProgress(clamp01(-rect.top / distance));
  }

  // Scroll events are frame-aligned in modern browsers and update() is a
  // handful of arithmetic + style writes, so it runs directly in the
  // (passive) listener — no rAF indirection needed.
  function listen() {
    if (listening) return;
    listening = true;
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
  }

  function unlisten() {
    if (!listening) return;
    listening = false;
    window.removeEventListener('scroll', update);
    window.removeEventListener('resize', update);
  }

  function apply() {
    if (mq.matches && reducedMotion !== 'ignore') {
      unlisten();
      setProgress(1);
    } else {
      listen();
      update();
    }
  }

  mq.addEventListener('change', apply);
  apply();

  return {
    update(next = {}) {
      ({ onProgress, setVar = true, reducedMotion = 'skip' } = next);
      apply();
    },
    destroy() {
      mq.removeEventListener('change', apply);
      unlisten();
    }
  };
}

/* ---- Timeline helpers ----------------------------------------------------
 * The small maths every scroll recipe repeats.
 */

/** Clamp to the 0–1 range. */
export const clamp01 = (t) => Math.max(0, Math.min(1, t));

/** Linear interpolation from a to b by t (t is clamped). */
export const lerp = (a, b, t) => a + (b - a) * clamp01(t);

/**
 * Remap overall scene progress to a sub-range, clamped to 0–1.
 * e.g. phase(p, 0.4, 0.85) is 0 until 40% through the scene,
 * 1 from 85% onward, linear in between. This is how a single
 * scene progress drives several overlapping movements.
 */
export const phase = (progress, start, end) =>
  clamp01((progress - start) / (end - start));

/** Easing curves for use with lerp(a, b, ease(t)). */
export const ease = {
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
};
