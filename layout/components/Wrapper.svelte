<script>
  // Left unset, nothing is written inline, so the site's --wrapper-max-width
  // (or wrapper.css's 1360px) applies. The old default referenced the
  // property from itself, which CSS treats as invalid, so the site's value
  // was ignored and the wrapper was always 1360px.
  /** @type {string|undefined} Maximum content width */
  export let maxWidth = undefined;
  /** @type {string} HTML element to render */
  export let as = 'div';
</script>

<svelte:element
  this={as}
  class="wrapper"
  style:--wrapper-max-width={maxWidth}
  {...$$restProps}
>
  <slot />
</svelte:element>
