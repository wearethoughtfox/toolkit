<script>
  import '../app.css';
  import { afterNavigate } from '$app/navigation';
  import { dev } from '$app/environment';
  import { onMount } from 'svelte';
  import SkipLink from '$lib/components/blocks/SkipLink.svelte';
  import SiteHead from '$lib/components/blocks/SiteHead.svelte';
  import SiteFoot from '$lib/components/blocks/SiteFoot.svelte';

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    // Development-only tools
    ...(dev ? [{ href: '/palette', label: 'Palette' }] : [])
  ];

  onMount(() => {
    afterNavigate(() => {
      const heading = document.querySelector('main h1');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: false });
      }
    });
  });
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
