<script>
  /**
   * A rounded feature section with a CTA bubble that grows from the bottom edge.
   * Two sibling divs — main block and bubble block — share the same background colour,
   * so the bubble reads as an organic extension of the block.
   * Based on the pattern used by Dirt (dirt.fyi).
   */

  export let label = undefined;
  export let ctaText = 'Learn more';
  export let ctaHref = '/';
  export let bg = 'var(--color-olive-oil)';
  export let color = 'var(--color-ground)';
  /** Should match the PAGE background so the CTA button camouflages when hovered */
  export let ctaBg = 'var(--color-ground)';
  export let ctaColor = 'var(--color-clay)';
</script>

<div
  class="feature-block"
  style:--feature-bg={bg}
  style:--feature-color={color}
  style:--cta-bg={ctaBg}
  style:--cta-color={ctaColor}
>
  <!-- Main rounded block -->
  <div class="feature-block__main">
    <div class="feature-block__inner sidebar" style:--sidebar-target-width="22rem" style:--gutter="var(--space-l)">
      <div class="feature-block__content stack" style:--stack-space="var(--space-m)">
        {#if label}
          <p class="feature-block__label ttu">{label}</p>
        {/if}
        <slot name="body" />
      </div>
      <slot name="media" />
    </div>
  </div>

  <!-- Bubble block — sibling, same colour, sits flush below -->
  <div class="feature-block__bubble">
    <a href={ctaHref} class="feature-block__cta">
      <span>{ctaText}</span>
      <span class="feature-block__arrow" aria-hidden="true">→</span>
    </a>
  </div>
</div>

<style>
  .feature-block {
    color: var(--feature-color, var(--color-ground));
  }

  /* ---- Main block ---- */
  .feature-block__main {
    background: var(--feature-bg, var(--color-olive-oil));
    border-radius: var(--radius-l);
    padding: var(--space-l);
  }

  .feature-block__label {
    font-family: var(--type-label-font);
    font-size: var(--type-label-size);
    font-weight: var(--type-label-weight);
    line-height: var(--type-label-leading);
    max-width: unset;
  }

  /* ---- Bubble block ---- */
  .feature-block__bubble {
    /* Same colour as main — reads as one organic shape */
    background: var(--feature-bg, var(--color-olive-oil));
    border-radius: 0 0 var(--radius-l) var(--radius-l);
    width: fit-content;
    /* Centered on mobile — sits within the main block's content area */
    margin-inline: auto;
    padding: var(--space-s) var(--space-s) var(--space-s) var(--space-xs);
  }

  @media (min-width: 40rem) {
    .feature-block__bubble {
      /* Left-aligned on wider screens */
      margin-inline-start: var(--space-l);
      margin-inline-end: 0;
    }
  }

  /* ---- CTA button ---- */
  .feature-block__cta {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    background: var(--cta-bg, var(--color-ground));
    color: var(--cta-color, var(--color-clay));
    padding: var(--space-xs) var(--space-m);
    border-radius: var(--radius-l);
    font-weight: var(--font-weight-bold);
    font-size: var(--type-body-size);
    text-decoration: none;
    transition: background var(--transition-base), color var(--transition-base);
  }

  .feature-block__cta:hover {
    background: var(--color-clay);
    color: var(--color-ground);
  }

  .feature-block__arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5em;
    height: 1.5em;
    border-radius: 50%;
    background: color-mix(in srgb, var(--cta-color, var(--color-clay)) 15%, transparent);
    flex-shrink: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .feature-block__cta {
      transition: none;
    }
  }
</style>
