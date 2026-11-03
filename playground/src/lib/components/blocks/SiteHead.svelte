<script>
  import Nav from './Nav.svelte';

  /** @type {string} Site name / logo text */
  export let siteName = 'Site Name';
  /** @type {string} Home link href */
  export let homeHref = '/';
  /** @type {{ href: string, label: string }[]} */
  export let navLinks = [];
</script>

<header class="site-head">
  <div class="wrapper">
    <div class="repel">
      <a href={homeHref} class="site-head__logo">
        {siteName}
      </a>
      <Nav label="Main" links={navLinks} />
    </div>
  </div>
</header>

<style>
  .site-head {
    padding-block: var(--space-m);
    border-block-end: var(--stroke);
  }

  .site-head__logo {
    font-weight: var(--font-black);
    font-size: var(--type-h3-size);
    line-height: var(--type-h3-leading);
    text-decoration: none;
    color: var(--color-primary);
    letter-spacing: var(--uppercase-kerning);
    text-transform: uppercase;
  }
</style>
