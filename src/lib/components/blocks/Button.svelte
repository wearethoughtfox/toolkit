<script>
  /** @type {'button'|'submit'|'reset'} */
  export let type = 'button';
  /** @type {'primary'|'secondary'|'ghost'} */
  export let variant = 'primary';
  /** @type {string|undefined} Renders as an <a> when provided */
  export let href = undefined;
</script>

{#if href}
  <a {href} class="button" data-variant={variant} {...$$restProps}>
    <slot />
  </a>
{:else}
  <button {type} class="button" data-variant={variant} {...$$restProps}>
    <slot />
  </button>
{/if}

<style>
  .button {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-m);
    border-radius: var(--radius-s);
    border: 2px solid transparent;
    font-weight: var(--font-bold);
    font-size: var(--size-step-0);
    line-height: var(--leading-flat);
    text-decoration: none;
    cursor: pointer;
    transition:
      background-color var(--transition-base),
      color var(--transition-base),
      border-color var(--transition-base),
      transform var(--transition-movement);
  }

  .button:active {
    transform: scale(0.98);
  }

  .button[data-variant='primary'] {
    background: var(--primary);
    color: var(--on-primary);
    border-color: var(--primary);
  }

  .button[data-variant='primary']:hover {
    background: transparent;
    color: var(--primary);
  }

  .button[data-variant='secondary'] {
    background: transparent;
    color: var(--primary);
    border-color: var(--primary);
  }

  .button[data-variant='secondary']:hover {
    background: var(--primary);
    color: var(--on-primary);
  }

  .button[data-variant='ghost'] {
    background: transparent;
    color: var(--text);
    border-color: transparent;
    padding-inline: 0;
  }

  .button[data-variant='ghost']:hover {
    color: var(--primary);
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .button {
      transition: none;
    }
  }
</style>
