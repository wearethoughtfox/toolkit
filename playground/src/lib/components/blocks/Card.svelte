<script>
  /** @type {string|undefined} Link destination — wraps the card */
  export let href = undefined;
  /** @type {string|undefined} Image source */
  export let image = undefined;
  /** @type {string} Image alt text */
  export let imageAlt = '';
</script>

<article class="card">
  {#if image}
    <div class="card__media frame" data-ratio="16/9">
      <img src={image} alt={imageAlt} loading="lazy" />
    </div>
  {/if}
  <div class="card__body stack" style:--stack-space="var(--space-xs)">
    {#if href}
      <a {href} class="card__link">
        <slot name="heading"><slot /></slot>
      </a>
    {:else}
      <slot name="heading"><slot /></slot>
    {/if}
    <slot name="body" />
    <slot name="footer" />
  </div>
</article>

<style>
  .card {
    background: var(--surface-raised);
    border-radius: var(--radius-m);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .card__media {
    flex-shrink: 0;
  }

  .card__body {
    padding: var(--space-m);
    flex: 1;
  }

  .card__link {
    color: inherit;
    text-decoration: none;
    font-weight: var(--font-bold);
    font-size: var(--type-h3-size);
    line-height: var(--type-h3-leading);
  }

  .card__link::after {
    content: '';
    position: absolute;
    inset: 0;
  }

  .card {
    position: relative;
  }

  .card__link:hover {
    color: var(--primary);
  }

  @media (prefers-reduced-motion: no-preference) {
    .card {
      transition: transform var(--transition-movement);
    }

    .card:has(.card__link:hover) {
      transform: translateY(-2px);
    }
  }
</style>
