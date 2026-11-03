<script>
	/**
	 * Scroll-scrubbed sticky scene (Svelte 5).
	 *
	 * Renders the runway + sticky frame from motion/compositions/scene.css and
	 * wires up the scrollScene action. Two ways to consume progress:
	 *
	 *   1. CSS only (cheapest — no re-renders):
	 *      <ScrollScene length="400vh">
	 *        {#snippet children()}
	 *          <div class="my-thing">…</div>   <!-- style with var(--scene-progress) -->
	 *        {/snippet}
	 *      </ScrollScene>
	 *
	 *   2. JS-driven (lerp/phase recipes):
	 *      <ScrollScene onprogress={(p) => { … imperative style updates … }}>
	 *      or bind:progress / use the snippet argument for reactive markup.
	 *
	 * Prefer onprogress + direct style writes for per-frame work; the snippet
	 * argument re-renders on every frame, which is fine for text (progress
	 * counters, state labels) but wasteful for transforms.
	 */
	import { scrollScene } from '../scroll-scene.js';

	let {
		/** Runway height — how much scroll the scene costs (default 300vh). */
		length = '300vh',
		/** Bindable scene progress, 0–1. */
		progress = $bindable(0),
		/** Per-frame callback (progress, node) — no re-render cost. */
		onprogress,
		/** 'skip' (default) pins progress at 1 under prefers-reduced-motion. */
		reducedMotion = 'skip',
		children,
		...rest
	} = $props();

	function handleProgress(p, node) {
		progress = p;
		onprogress?.(p, node);
	}
</script>

<section
	class="scene"
	style:--scene-length={length}
	use:scrollScene={{ onProgress: handleProgress, reducedMotion }}
	{...rest}
>
	<div class="scene__frame">
		{@render children?.(progress)}
	</div>
</section>
