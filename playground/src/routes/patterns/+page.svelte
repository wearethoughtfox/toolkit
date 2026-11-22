<script>
  import Stack from '@thoughtfox/toolkit/layout/components/Stack.svelte';
  import Grid from '@thoughtfox/toolkit/layout/components/Grid.svelte';
  import Wrapper from '@thoughtfox/toolkit/layout/components/Wrapper.svelte';
  import Button from '$lib/components/blocks/Button.svelte';

  const pages = [
    {
      href: '/patterns/hero-layouts',
      title: 'Hero layouts',
      body: 'Five page openers: a default service opener, a brand statement, an editorial place hero, a compact utility hero and a full-bleed immersive hero.'
    },
    {
      href: '/patterns/section-layouts',
      title: 'Section layouts',
      body: 'Sixteen section patterns built from Sidebar, Grid, Reel, Switcher, Cluster, Cover and Frame, from two-column points to a call-to-action band.'
    }
  ];
</script>

<svelte:head>
  <title>Patterns | Playground</title>
  <meta
    name="description"
    content="Hero and section layout patterns built from the toolkit's layout primitives."
  />
</svelte:head>

<Wrapper>
  <Stack space="var(--space-xl)">
    <Stack space="var(--space-s)">
      <p class="kicker">Playground</p>
      <h1>Patterns</h1>
      <p class="intro">
        Layout patterns built from the toolkit primitives. They carry no brand: colours come from
        the roles, so what you are judging here is the layout and the spacing.
      </p>
    </Stack>

    <Grid minItemSize="20rem">
      {#each pages as page}
        <article class="pattern-card" data-scheme="highlight">
          <Stack space="var(--space-s)">
            <h2>{page.title}</h2>
            <p>{page.body}</p>
            <Button href={page.href}>View {page.title}</Button>
          </Stack>
        </article>
      {/each}
    </Grid>
  </Stack>
</Wrapper>

<style>
  .kicker {
    color: var(--primary);
    font-size: var(--size-step-00);
    font-weight: var(--font-medium);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .intro {
    font-size: var(--size-step-1);
    max-width: 58ch;
  }

  .pattern-card {
    border: var(--stroke-solid);
    padding: var(--space-l);
  }
</style>
