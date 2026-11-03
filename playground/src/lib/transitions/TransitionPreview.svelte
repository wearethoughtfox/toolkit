<!--
  Dev only, rendered once in the root +layout.svelte. Runs the transition
  picked on /transitions on every navigation, the same way a site does
  (onNavigate + segueTransitions), and shows a bar with pages to go to.
  With nothing picked, navigation is plain.
-->
<script>
  import { onMount } from 'svelte';
  import { onNavigate } from '$app/navigation';
  import { segueTransitions } from '@thoughtfox/toolkit/motion/segue.js';
  import PaintOverMasks from '@thoughtfox/toolkit/motion/components/PaintOverMasks.svelte';
  import DotsRadialMasks from '@thoughtfox/toolkit/motion/components/DotsRadialMasks.svelte';
  import DotsSweepMasks from '@thoughtfox/toolkit/motion/components/DotsSweepMasks.svelte';
  import GridSquaresMasks from '@thoughtfox/toolkit/motion/components/GridSquaresMasks.svelte';
  import { preview, bySlug, restore, save, previewCss } from './preview.svelte.js';
  import { previewPages, motionLabel } from './pages.js';

  const masks = {
    'paint-over': PaintOverMasks,
    'dots-radial': DotsRadialMasks,
    'dots-sweep': DotsSweepMasks,
    'grid-squares': GridSquaresMasks
  };

  const run = segueTransitions();
  onNavigate((navigation) => (preview.slug ? run(navigation) : undefined));

  let mounted = $state(false);
  /** @type {HTMLStyleElement} */
  let style;

  onMount(() => {
    restore();
    style = document.createElement('style');
    style.dataset.transitionPreview = '';
    document.head.append(style);
    mounted = true;
    return () => style.remove();
  });

  // Keep the <style> in step with the pick. A slow load can't overwrite a newer pick.
  $effect(() => {
    if (!mounted) return;
    const choice = { slug: preview.slug, motion: preview.motion, toned: preview.toned };
    save();
    let stale = false;
    previewCss(choice).then((css) => {
      if (!stale) style.textContent = css;
    });
    return () => {
      stale = true;
    };
  });

  const entry = $derived(mounted ? bySlug[preview.slug] : undefined);
  const Masks = $derived(entry ? masks[entry.slug] : undefined);
  const toned = $derived(Boolean(entry?.override && preview.toned));
</script>

{#if Masks}
  <Masks />
{/if}

{#if entry}
  <aside class="transition-preview" aria-label="Transition preview">
    <div class="wrapper">
      <div class="transition-preview__inner cluster">
        <p>
          <span class="b">{entry.name}</span>
          {toned ? `toned down, ${entry.override.durationMs}ms` : `as shipped, ${entry.durationMs}ms`}
          · {motionLabel[preview.motion]}
        </p>
        <nav aria-label="Preview pages">
          <ul role="list" class="cluster">
            {#each previewPages as page}
              <li><a href={page.href}>{page.label}</a></li>
            {/each}
          </ul>
        </nav>
        <button type="button" onclick={() => (preview.slug = null)}>Stop</button>
      </div>
    </div>
  </aside>
{/if}

<style>
  /* Sticky at the end of the page, so it never covers the footer */
  .transition-preview {
    position: sticky;
    inset-block-end: 0;
    z-index: 2;
    padding-block: var(--space-xs);
    background: var(--color-clay);
    color: var(--color-ground);
    font-size: var(--size-step-00);
  }

  .transition-preview__inner {
    --gutter: var(--space-2xs) var(--space-m);
    align-items: center;
  }

  .transition-preview ul {
    --gutter: var(--space-s);
  }

  .transition-preview a {
    color: inherit;
    text-underline-offset: 0.2em;
  }

  .transition-preview button {
    margin-inline-start: auto;
    padding: var(--space-2xs) var(--space-xs);
    font: inherit;
    color: inherit;
    background: transparent;
    border: 1px solid currentColor;
    border-radius: var(--radius-s);
    cursor: pointer;
  }
</style>
