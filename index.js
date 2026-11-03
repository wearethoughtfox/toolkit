// Client-safe exports only. The token generator (Node-only) lives at
// '@thoughtfox/toolkit/scripts/generate-tokens.js' — import it directly
// in vite.config.js, never from here.

// Every Layout primitives
export { default as Center } from './components/layout/Center.svelte';
export { default as Cluster } from './components/layout/Cluster.svelte';
export { default as Cover } from './components/layout/Cover.svelte';
export { default as Frame } from './components/layout/Frame.svelte';
export { default as Grid } from './components/layout/Grid.svelte';
export { default as Reel } from './components/layout/Reel.svelte';
export { default as Region } from './components/layout/Region.svelte';
export { default as Sidebar } from './components/layout/Sidebar.svelte';
export { default as Stack } from './components/layout/Stack.svelte';
export { default as Switcher } from './components/layout/Switcher.svelte';
export { default as Wrapper } from './components/layout/Wrapper.svelte';

// Blocks
export { default as SkipLink } from './components/SkipLink.svelte';

// Scroll scenes (pair with css/compositions/scene.css)
export { default as ScrollScene } from './components/ScrollScene.svelte';
export { scrollScene, lerp, phase, clamp01, ease } from './actions/scroll-scene.js';

// Page transitions (pair with one css/transitions/*/*.css)
export { segueTransitions, segue } from './transitions/segue.js';
export { default as PaintOverMasks } from './components/transitions/PaintOverMasks.svelte';
export { default as DotsRadialMasks } from './components/transitions/DotsRadialMasks.svelte';
export { default as DotsSweepMasks } from './components/transitions/DotsSweepMasks.svelte';
export { default as GridSquaresMasks } from './components/transitions/GridSquaresMasks.svelte';

// Actions & stores
export { reveal } from './actions/reveal.js';
export { prefersReducedMotion } from './stores/motion.js';
