<script>
  // Props left unset write nothing inline, so grid.css's defaults and the
  // data-layout presets apply. A prop you set wins over the preset.
  /** @type {string|undefined} Minimum item width (CSS default 16rem) */
  export let minItemSize = undefined;
  /** @type {string} Gap between items */
  export let gap = 'var(--space-l)';
  /** @type {'auto-fill'|'auto-fit'|undefined} Grid placement mode (CSS default auto-fill) */
  export let placement = undefined;
  /** @type {string|undefined} Preset layout: '50-50' or 'thirds' */
  export let layout = undefined;
  /** @type {string|undefined} Preset layouts: row width below which they stack */
  export let threshold = undefined;
  /** @type {string} HTML element to render */
  export let as = 'div';
</script>

<svelte:element
  this={as}
  class="grid"
  data-layout={layout}
  style:--grid-min-item-size={minItemSize}
  style:--gutter={gap}
  style:--grid-placement={placement}
  style:--grid-threshold={threshold}
  {...$$restProps}
>
  <slot />
</svelte:element>
