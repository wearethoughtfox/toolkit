// Motion: scroll scenes, scroll reveal, page transitions, reduced motion.
// CSS: motion/compositions/scene.css, motion/utilities/reveal.css,
// motion/transitions/*/*.css (pick one)

// Scroll scenes (pair with motion/compositions/scene.css)
export { default as ScrollScene } from './components/ScrollScene.svelte';
export { scrollScene, lerp, phase, clamp01, ease } from './scroll-scene.js';

// Page transitions (pair with one motion/transitions/*/*.css)
export { segueTransitions, segue } from './segue.js';
export { default as PaintOverMasks } from './components/PaintOverMasks.svelte';
export { default as DotsRadialMasks } from './components/DotsRadialMasks.svelte';
export { default as DotsSweepMasks } from './components/DotsSweepMasks.svelte';
export { default as GridSquaresMasks } from './components/GridSquaresMasks.svelte';

// Scroll reveal (pair with motion/utilities/reveal.css)
export { reveal } from './reveal.js';

// prefers-reduced-motion as a readable store
export { prefersReducedMotion } from './reduced-motion.js';
