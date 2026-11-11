<script>
  import '../app.css';
  import { afterNavigate } from '$app/navigation';
  import { dev } from '$app/environment';
  import { SkipLink, focusHeading } from '@thoughtfox/toolkit/layout';
  import SiteHead from '$lib/components/blocks/SiteHead.svelte';
  import SiteFoot from '$lib/components/blocks/SiteFoot.svelte';

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    // Development-only tools
    ...(dev
      ? [
          { href: '/palette', label: 'Palette' },
          { href: '/type', label: 'Type' }
        ]
      : [])
  ];

  afterNavigate(focusHeading());
</script>

<SkipLink />
<SiteHead siteName="My Site" {navLinks} />

<main id="main-content" tabindex="-1">
  <slot />
</main>

<SiteFoot siteName="My Site" />

<style>
  :global(body) {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  main {
    flex: 1;
  }

  main:focus {
    outline: none;
  }
</style>
