<script>
  import Button from '$lib/components/blocks/Button.svelte';
  import Cluster from '@thoughtfox/toolkit/layout/components/Cluster.svelte';
  import Cover from '@thoughtfox/toolkit/layout/components/Cover.svelte';
  import Frame from '@thoughtfox/toolkit/layout/components/Frame.svelte';
  import Stack from '@thoughtfox/toolkit/layout/components/Stack.svelte';
  import Wrapper from '@thoughtfox/toolkit/layout/components/Wrapper.svelte';

  const serviceLinks = ['Section one', 'Section two', 'Section three', 'Section four'];
</script>

{#snippet patternHeader(number, title, primitive, purpose, slots)}
  <header class="pattern-header">
    <Stack space="var(--space-xs)">
      <p class="pattern-header__meta">{number} / {primitive}</p>
      <h2>{title}</h2>
      <p>{purpose}</p>
      <p class="pattern-header__slots">Slots: {slots}</p>
    </Stack>
  </header>
{/snippet}

<svelte:head>
  <title>Hero layouts | Playground patterns</title>
  <meta
    name="description"
    content="Reusable hero layouts built from the toolkit's layout primitives."
  />
</svelte:head>

<div class="pattern-page">
  <Cover minHeight="62svh" padding="var(--space-l)">
    <Wrapper>
      <Stack space="var(--space-l)" data-cover-centred>
        <p class="kicker">Pattern library</p>
        <h1>Hero layouts</h1>
        <p class="intro">
          Page openers built from the same primitives as the section layouts. Judge the layout here, not
          the colour: the playground has no brand of its own.
        </p>
      </Stack>
    </Wrapper>
  </Cover>

  <Wrapper>
    <Stack space="var(--space-2xl)">
      <section class="pattern-section">
        {@render patternHeader(
          '01',
          'Default service opener',
          'CSS Grid + Frame',
          'The reliable page opener for service, product and offer pages.',
          'eyebrow, h1, intro, primary CTA, secondary action, supporting image'
        )}
        <div class="service-split">
          <div class="service-split__content">
            <Stack space="var(--space-l)">
              <Stack space="var(--space-s)">
                <p class="kicker">Eyebrow</p>
                <h2>A headline of about six words.</h2>
              </Stack>
              <p class="hero-copy">
                Use this when the visitor needs to understand the offer quickly, then choose a
                clear next action without being pulled into a big brand moment.
              </p>
              <Cluster>
                <Button href="#">Primary action</Button>
                <Button href="#" variant="ghost">Tertiary action</Button>
              </Cluster>
            </Stack>
          </div>
          <div class="service-split__media">
            <div class="media-fill"></div>
          </div>
        </div>
      </section>

      <section class="pattern-section">
        {@render patternHeader(
          '02',
          'Brand statement hero',
          'Cover + Stack',
          'A high-level opener for a homepage or a campaign-style page.',
          'brand line, large statement, support copy, one or two primary paths'
        )}
        <div class="statement-hero">
          <Cover minHeight="34rem" padding="var(--space-xl)">
            <Stack space="var(--space-l)" data-cover-centred>
              <p class="kicker">Eyebrow</p>
              <h2>Three short phrases. One line each.</h2>
              <p>
                Best when the page needs to set the mood before it asks for a practical decision.
              </p>
              <Cluster justify="center">
                <Button href="#">Primary action</Button>
                <Button href="#" variant="secondary">Secondary action</Button>
              </Cluster>
            </Stack>
          </Cover>
        </div>
      </section>

      <section class="pattern-section">
        {@render patternHeader(
          '03',
          'Editorial place hero',
          'CSS Grid + Frame',
          'An image-led opener for about, story or place-based pages.',
          'atmospheric image, h1, short story line, CTA, optional strapline'
        )}
        <div class="place-split">
          <Frame ratio="1/1">
            <div class="media-fill media-fill--alt"></div>
          </Frame>
          <div class="place-split__panel" data-scheme="highlight">
            <Stack space="var(--space-l)">
              <div class="place-split__mark" aria-hidden="true">Mark</div>
              <Stack space="var(--space-m)">
                <p class="kicker">Eyebrow</p>
                <h2>Two short sentences. One idea.</h2>
                <p>
                  Use this when the place, the people or the atmosphere need to do some of the
                  explaining before the visitor reads the detail.
                </p>
                <Button href="#" variant="secondary">Secondary action</Button>
              </Stack>
              <p class="place-split__strapline">A strapline of about six words.</p>
            </Stack>
          </div>
        </div>
      </section>

      <section class="pattern-section">
        {@render patternHeader(
          '04',
          'Compact utility hero',
          'Wrapper + Stack',
          'A restrained opener for practical pages where clarity matters more than ceremony.',
          'eyebrow, h1, one-line intro, optional quick links'
        )}
        <div class="compact-hero">
          <Stack space="var(--space-m)">
            <p class="kicker">Eyebrow</p>
            <h2>A longer headline that runs to two lines.</h2>
            <p>
              Use this for timetable, contact, workshop listings or any page that should get out
              of the way quickly.
            </p>
            <Cluster>
              {#each serviceLinks as link}
                <a href="/timetable/">{link}</a>
              {/each}
            </Cluster>
          </Stack>
        </div>
      </section>
      <section class="pattern-section">
        {@render patternHeader(
          '05',
          'Full-bleed immersive hero',
          'CSS Grid',
          'For the homepage, a campaign, or any moment where the image should speak before the page does.',
          'full-viewport image, minimal headline, single CTA, optional scroll prompt'
        )}
        <div class="fullbleed-hero">
          <div class="fullbleed-hero__image media-fill media-fill--alt" aria-hidden="true"></div>
          <div class="fullbleed-hero__content">
            <Stack space="var(--space-m)">
              <h2 class="fullbleed-hero__headline">A short statement.</h2>
              <p class="fullbleed-hero__caption">Caption or location line</p>
              <Button href="#" variant="secondary">Secondary action</Button>
            </Stack>
          </div>
          <span class="fullbleed-hero__scroll" aria-hidden="true">↓</span>
        </div>
      </section>
    </Stack>
  </Wrapper>
</div>

<style>
  .pattern-page {
    overflow-x: clip;
    padding-block-end: var(--space-2xl);
  }

  .intro {
    font-size: var(--size-step-2);
    max-width: 52ch;
  }

  .kicker {
    font-size: var(--size-step-00);
    font-weight: var(--font-medium);
    letter-spacing: 0.12em;
    max-width: unset;
    text-transform: uppercase;
  }

  .pattern-section {
    border-top: var(--stroke);
    padding-block-start: var(--space-l);
  }

  .pattern-header {
    margin-block-end: var(--space-l);
  }

  .pattern-header__meta {
    color: var(--primary);
    font-size: var(--size-step-00);
    font-weight: var(--font-medium);
    letter-spacing: 0.08em;
    max-width: unset;
    text-transform: uppercase;
  }

  .pattern-header p {
    max-width: 58ch;
  }

  .pattern-header__slots {
    color: var(--accent);
    font-size: var(--size-step-00);
    font-weight: var(--font-medium);
    max-width: 72ch;
  }

  .pattern-header h2,
  .statement-hero h2 {
    font-size: var(--size-step-7);
  }

  .pattern-header h2 {
    font-size: var(--size-step-4);
  }

  .hero-copy {
    font-size: var(--size-step-1);
  }

  .media-fill {
    min-height: 100%;
    border: var(--stroke-solid);
    background:
      linear-gradient(135deg, transparent 0 48%, var(--border) 48% 52%, transparent 52%),
      var(--surface-raised);
  }

  .media-fill--alt {
    background:
      linear-gradient(225deg, transparent 0 48%, var(--border) 48% 52%, transparent 52%),
      var(--surface-raised);
  }

  .statement-hero {
    background: var(--primary);
    color: var(--on-primary);
    text-align: center;
  }

  .statement-hero h2,
  .statement-hero p {
    color: var(--on-primary);
    margin-inline: auto;
  }

  .statement-hero h2 {
    max-width: 15ch;
  }

  /* the band is --primary, so an outlined button needs the on-primary side */
  .statement-hero :global(.button[data-variant='secondary']) {
    --button-shadow: var(--on-primary);

    border-color: var(--on-primary);
    color: var(--on-primary);
  }

  .statement-hero :global(.cluster) {
    justify-content: center;
  }

  .service-split {
    align-items: stretch;
    display: grid;
    grid-template-columns: minmax(18rem, 1fr) minmax(22rem, 44vw);
    margin-inline-end: calc((100vw - 100%) / -2);
    min-block-size: clamp(34rem, 72svh, 48rem);
    width: calc(100% + ((100vw - 100%) / 2));
  }

  .service-split__content {
    align-self: center;
    padding-block: var(--space-xl);
    padding-inline-end: var(--space-xl);
  }

  .service-split__content h2 {
    font-size: var(--size-step-6);
  }

  .service-split__media {
    min-block-size: 100%;
  }

  .service-split__media .media-fill,
  .place-split .media-fill {
    block-size: 100%;
  }

  .place-split {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    min-block-size: clamp(34rem, 78svh, 52rem);
  }

  .place-split :global(.frame) {
    aspect-ratio: auto;
    block-size: 100%;
  }

  .place-split__panel {
    --button-shadow: var(--text);

    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    min-inline-size: 0;
    padding: var(--space-l);
  }

  .place-split__panel :global(.stack) {
    min-inline-size: 0;
  }

  .place-split__panel h2 {
    color: var(--primary);
    font-size: var(--size-step-7);
    max-width: 11ch;
  }

  .place-split__panel p {
    color: var(--text);
    max-inline-size: min(100%, 58ch);
  }

  .place-split__panel :global(.button[data-variant='secondary']) {
    border-color: var(--text);
    color: var(--text);
  }

  .place-split__mark,
  .place-split__strapline {
    font-size: var(--size-step-00);
    font-weight: var(--font-medium);
    letter-spacing: 0.12em;
    max-width: unset;
    text-transform: uppercase;
  }

  .place-split__mark {
    align-self: flex-end;
    color: color-mix(in srgb, var(--text) 62%, transparent);
  }

  .place-split__strapline {
    border-block-start: 1px solid color-mix(in srgb, var(--text) 35%, transparent);
    padding-block-start: var(--space-m);
  }

  .compact-hero {
    border: var(--stroke-solid);
    padding: var(--space-l);
  }

  .compact-hero {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
  }

  .compact-hero h2 {
    font-size: var(--size-step-4);
    max-width: 18ch;
  }

  .compact-hero a {
    color: var(--primary);
    font-size: var(--size-step-00);
    font-weight: var(--font-bold);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .fullbleed-hero {
    display: grid;
    min-height: 80svh;
    overflow: hidden;
  }

  .fullbleed-hero > * {
    grid-area: 1 / 1;
  }

  .fullbleed-hero::after {
    background: linear-gradient(
      to top,
      color-mix(in srgb, var(--surface) 92%, transparent) 0%,
      color-mix(in srgb, var(--surface) 20%, transparent) 45%,
      transparent 70%
    );
    content: '';
    grid-area: 1 / 1;
    z-index: 1;
  }

  .fullbleed-hero__content {
    align-self: end;
    color: var(--text);
    padding: var(--space-xl);
    z-index: 2;
  }

  .fullbleed-hero__headline {
    color: var(--text);
    font-size: var(--size-step-9);
    max-width: 10ch;
  }

  .fullbleed-hero__caption {
    color: color-mix(in srgb, var(--text) 70%, transparent);
    font-size: var(--size-step-1);
    max-width: unset;
  }

  .fullbleed-hero :global(.button[data-variant='secondary']) {
    --button-shadow: var(--text);
    border-color: var(--text);
    color: var(--text);
  }

  .fullbleed-hero__scroll {
    align-self: end;
    color: color-mix(in srgb, var(--text) 70%, transparent);
    font-size: var(--size-step-2);
    justify-self: center;
    padding-block-end: var(--space-l);
    z-index: 2;
  }

  @media (max-width: 48rem) {
    .service-split,
    .place-split {
      grid-template-columns: 1fr;
      margin-inline: 0;
      min-block-size: auto;
      width: 100%;
    }

    .service-split__content {
      padding-inline-end: 0;
    }

    .service-split__media,
    .place-split :global(.frame) {
      min-block-size: 24rem;
    }

    .place-split__panel {
      min-block-size: 28rem;
    }

  }
</style>
