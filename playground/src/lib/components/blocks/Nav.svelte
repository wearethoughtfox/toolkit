<script>
  /** @type {string} Accessible label (required — every nav needs one) */
  export let label = 'Main';
  /** @type {{ href: string, label: string }[]} */
  export let links = [];
</script>

<nav aria-label={label} class="nav">
  <ul role="list" class="cluster nav__list">
    {#each links as link}
      <li>
        <a href={link.href} class="nav__link">
          {link.label}
        </a>
      </li>
    {/each}
    <slot />
  </ul>
</nav>

<style>
  .nav__list {
    --gutter: var(--space-m);
  }

  .nav__link {
    color: inherit;
    text-decoration: none;
    font-weight: var(--font-medium);
    padding-block: var(--space-xs);
    border-block-end: 2px solid transparent;
    transition: border-color var(--transition-base), color var(--transition-base);
  }

  .nav__link:hover,
  .nav__link[aria-current='page'] {
    color: var(--primary);
    border-block-end-color: var(--primary);
  }

  @media (prefers-reduced-motion: reduce) {
    .nav__link {
      transition: none;
    }
  }
</style>
