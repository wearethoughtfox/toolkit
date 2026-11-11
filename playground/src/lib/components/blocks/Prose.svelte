<script>
  /** @type {string} HTML element to render */
  export let as = 'div';
</script>

<svelte:element this={as} class="prose flow" {...$$restProps}>
  <slot />
</svelte:element>

<style>
  .prose {
    --measure: var(--type-max-width);
    --flow-space: var(--space-m);
  }

  .prose :global(h2) {
    --flow-space: var(--space-l);
  }

  .prose :global(h3) {
    --flow-space: var(--space-m);
  }

  .prose :global(a) {
    color: var(--primary);
    text-underline-offset: 0.2em;
  }

  .prose :global(a:hover) {
    text-decoration: none;
  }

  .prose :global(blockquote) {
    border-inline-start: 4px solid var(--border);
    padding-inline-start: var(--space-m);
    font-size: var(--type-h3-size);
    line-height: var(--type-h3-leading);
    font-style: italic;
  }

  .prose :global(img) {
    border-radius: var(--radius-m);
  }

  .prose :global(hr) {
    border: none;
    border-block-start: var(--stroke);
    margin-block: var(--space-l);
  }
</style>
