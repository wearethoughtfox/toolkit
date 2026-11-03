<script>
  import '../app.css';
  import { afterNavigate } from '$app/navigation';
  import { dev } from '$app/environment';
  import { onMount } from 'svelte';
  import SkipLink from '@thoughtfox/toolkit/layout/components/SkipLink.svelte';
  import SiteHead from '$lib/components/blocks/SiteHead.svelte';
  import SiteFoot from '$lib/components/blocks/SiteFoot.svelte';

  // Dev only: import.meta.env.DEV is replaced at build time, so a production
  // build drops the preview and its masks completely
  const transitionPreview = import.meta.env.DEV
    ? import('$lib/transitions/TransitionPreview.svelte')
    : null;

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    // Development-only tools
    ...(dev
      ? [
          { href: '/palette', label: 'Palette' },
          { href: '/type', label: 'Type' },
          { href: '/transitions', label: 'Transitions' }
        ]
      : [])
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

<!-- Dev only: runs the transition picked on /transitions -->
{#if transitionPreview}
  {#await transitionPreview then { default: TransitionPreview }}
    <TransitionPreview />
  {/await}
{/if}

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
