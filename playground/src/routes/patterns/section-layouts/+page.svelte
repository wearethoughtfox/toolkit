<script>
  import Button from '$lib/components/blocks/Button.svelte';
  import FeatureBlock from '$lib/components/blocks/FeatureBlock.svelte';
  import Cluster from '@thoughtfox/toolkit/layout/components/Cluster.svelte';
  import Cover from '@thoughtfox/toolkit/layout/components/Cover.svelte';
  import Frame from '@thoughtfox/toolkit/layout/components/Frame.svelte';
  import Grid from '@thoughtfox/toolkit/layout/components/Grid.svelte';
  import Reel from '@thoughtfox/toolkit/layout/components/Reel.svelte';
  import Sidebar from '@thoughtfox/toolkit/layout/components/Sidebar.svelte';
  import Stack from '@thoughtfox/toolkit/layout/components/Stack.svelte';
  import Switcher from '@thoughtfox/toolkit/layout/components/Switcher.svelte';
  import Wrapper from '@thoughtfox/toolkit/layout/components/Wrapper.svelte';

  const fourPoints = ['One', 'Two', 'Three', 'Four'];
  const cards = ['Card one', 'Card two', 'Card three', 'Card four'];
  const reelItems = ['Item one', 'Item two', 'Item three', 'Item four', 'Item five'];
  const featureTiles = [
    {
      title: 'Tile one',
      body: 'A sentence of body copy, long enough to wrap onto a second line.',
      imageClass: 'feature-image--one'
    },
    {
      title: 'Tile two',
      body: 'A sentence of body copy, long enough to wrap onto a second line.',
      imageClass: 'feature-image--two'
    },
    {
      title: 'Tile three',
      body: 'A sentence of body copy, long enough to wrap onto a second line.',
      imageClass: 'feature-image--three'
    },
    {
      title: 'Tile four',
      body: 'A sentence of body copy, long enough to wrap onto a second line.',
      imageClass: 'feature-image--four'
    }
  ];
  const steps = [
    { heading: 'Step one', body: 'A sentence describing what happens at this step.' },
    { heading: 'Step two', body: 'A sentence describing what happens at this step.' },
    { heading: 'Step three', body: 'A sentence describing what happens at this step.' }
  ];
  const exercises = [
    { label: 'Item one', description: 'A short supporting line.' },
    { label: 'Item two', description: 'A short supporting line.' },
    { label: 'Item three', description: 'A short supporting line.' },
    { label: 'Item four', description: 'A short supporting line.' },
    { label: 'Item five', description: 'A short supporting line.' }
  ];
  const perks = [
    { tag: 'Tag', heading: 'Heading one', body: 'A sentence of supporting copy for this item.' },
    { tag: 'Tag', heading: 'Heading two', body: 'A sentence of supporting copy for this item.' },
    { tag: 'Tag', heading: 'Heading three', body: 'A sentence of supporting copy for this item.' },
    { tag: 'Tag', heading: 'Heading four', body: 'A sentence of supporting copy for this item.' }
  ];
</script>

{#snippet patternHeader(number, title, primitive)}
  <header class="pattern-header">
    <Stack space="var(--space-xs)">
      <p class="pattern-header__meta">{number} / {primitive}</p>
      <h2>{title}</h2>
    </Stack>
  </header>
{/snippet}

<svelte:head>
  <title>Section layouts | Playground patterns</title>
  <meta
    name="description"
    content="A local pattern-library page exploring reusable section layouts with CUBE CSS and Every Layout primitives."
  />
</svelte:head>

<div class="pattern-page">
  <Cover minHeight="62svh" padding="var(--space-l)">
    <Wrapper>
      <Stack space="var(--space-l)" data-cover-centred>
        <p class="kicker">Pattern library</p>
        <h1>Section layouts</h1>
        <p class="intro">
          Section layouts built with the toolkit's layout primitives:
          Stack, Cluster, Grid, Sidebar, Switcher, Reel, Cover, Frame and Wrapper.
        </p>
      </Stack>
    </Wrapper>
  </Cover>

  <Wrapper>
    <Stack space="var(--space-2xl)">
      <section class="pattern-section">
        {@render patternHeader('01', 'Two column essential points', 'Sidebar')}
        <Sidebar side="right" sideWidth="44%" contentMin="48%" gap="var(--space-xl)">
          <Frame ratio="4/3">
            <div class="media-fill"></div>
          </Frame>
          <Stack space="var(--space-m)">
            <Stack space="var(--space-s)">
              <p class="kicker">Eyebrow</p>
              <h2>A headline of about six words.</h2>
            </Stack>
            <p>
              Use this when the left side carries the point and the right side explains it.
              It is good for service intros, values, and any section that should not become a
              wall of cards.
            </p>
            <Cluster>
              <Button href="#">Primary action</Button>
              <Button href="/contact" variant="ghost">Ask a question</Button>
            </Cluster>
          </Stack>
        </Sidebar>
      </section>

      <section class="pattern-section">
        {@render patternHeader('02', 'Four quick pillars', 'Grid')}
        <Grid layout="thirds" gap="var(--space-m)">
          {#each fourPoints as point}
            <article class="tile tile--media">
              <Frame ratio="3/2">
                <div class="media-fill"></div>
              </Frame>
              <div class="tile__body">
                <Stack space="var(--space-xs)">
                  <h3>{point}</h3>
                  <p>Short, scannable copy for a point that should feel equal to the others.</p>
                </Stack>
              </div>
            </article>
          {/each}
        </Grid>
      </section>

      <section class="pattern-section">
        {@render patternHeader('03', 'Grid with additional row', 'Grid + Stack')}
        <Stack space="var(--space-m)">
          <Grid layout="50-50" gap="var(--space-m)">
            <article class="tile tile--large">
              <Stack space="var(--space-s)">
                <p class="kicker">Eyebrow</p>
                <h2>Two short sentences. One idea.</h2>
              </Stack>
            </article>
            <article class="tile">
              <p>
                A strong feature block beside a quieter panel. Good for a crossover
                sections.
              </p>
            </article>
          </Grid>
          <Grid layout="thirds" gap="var(--space-m)">
            {#each ['One', 'Two', 'Three'] as item}
              <article class="mini-tile">{item}</article>
            {/each}
          </Grid>
        </Stack>
      </section>

      <section class="pattern-section pattern-section--bleed">
        {@render patternHeader('04', 'Small section slider', 'Reel')}
        <Reel itemWidth="18rem" gap="var(--space-m)">
          {#each reelItems as item}
            <article class="reel-card">
              <Frame ratio="4/3">
                <div class="media-fill"></div>
              </Frame>
              <Stack space="var(--space-xs)">
                <h3>{item}</h3>
                <p>Let the next item trail off the edge so the scroll affordance is visible.</p>
              </Stack>
            </article>
          {/each}
        </Reel>
      </section>

      <section class="pattern-section">
        {@render patternHeader('05', 'Image with numbered steps', 'Sidebar + Frame')}
        <Sidebar side="right" sideWidth="42%" contentMin="48%" gap="var(--space-xl)">
          <Frame ratio="3/4">
            <div class="media-fill media-fill--alt"></div>
          </Frame>
          <Stack space="var(--space-m)">
            <Stack space="var(--space-s)">
              <p class="kicker">How it works</p>
              <h2>Three steps, numbered.</h2>
            </Stack>
            <ol class="step-list" role="list">
              {#each steps as step, i}
                <li class="step-list__item">
                  <span class="step-number">0{i + 1}</span>
                  <Stack space="var(--space-xs)">
                    <h3>{step.heading}</h3>
                    <p>{step.body}</p>
                  </Stack>
                </li>
              {/each}
            </ol>
          </Stack>
        </Sidebar>
      </section>

      <section class="pattern-section">
        {@render patternHeader('06', 'Centered manifesto', 'Cover + Stack')}
        <Cover minHeight="28rem" padding="var(--space-xl)">
          <div class="manifesto" data-cover-centred>
            <Stack space="var(--space-m)">
              <p class="kicker">Manifesto</p>
              <h2>Three short phrases. One line each.</h2>
              <p>Use sparingly. This is for brand rhythm between more practical sections.</p>
            </Stack>
          </div>
        </Cover>
      </section>

      <section class="pattern-section">
        {@render patternHeader('07', 'Grid beside copy lead', 'Sidebar + Grid')}
        <Sidebar side="right" sideWidth="36%" contentMin="50%" gap="var(--space-xl)">
          <Stack space="var(--space-m)">
            <Stack space="var(--space-s)">
              <p class="kicker">Eyebrow</p>
              <h2>A headline of about four words.</h2>
            </Stack>
            <p>Find the practice that suits where you are right now. All levels welcome.</p>
            <Button href="/timetable/">View timetable</Button>
          </Stack>
          <Grid minItemSize="12rem" gap="var(--space-m)">
            {#each cards as card}
              <article class="tile">
                <Stack space="var(--space-xs)">
                  <h3>{card}</h3>
                  <p>A repeatable card that can later become a proper link.</p>
                </Stack>
              </article>
            {/each}
          </Grid>
        </Sidebar>
      </section>

      <section class="pattern-section">
        {@render patternHeader('08', 'Split decision', 'Switcher')}
        <Switcher threshold="44rem">
          <article class="choice">
            <Stack space="var(--space-m)">
              <p class="kicker">Eyebrow</p>
              <h2>First choice</h2>
              <p>For people arriving with movement intent.</p>
              <Button href="/timetable/">Timetable</Button>
            </Stack>
          </article>
          <article class="choice choice--light" data-scheme="highlight">
            <Stack space="var(--space-m)">
              <p class="kicker">Eyebrow</p>
              <h2>Second choice</h2>
              <p>A sentence of supporting copy for the second choice.</p>
              <Button href="#" variant="secondary">Secondary action</Button>
            </Stack>
          </article>
        </Switcher>
      </section>

      <section class="pattern-section">
        {@render patternHeader('09', 'Editorial offset', 'Grid + Frame')}
        <div class="editorial-offset">
          <Frame ratio="1/1">
            <div class="media-fill"></div>
          </Frame>
          <div class="editorial-offset__copy" data-scheme="inverse">
            <Stack space="var(--space-m)">
              <p class="kicker">Story block</p>
              <h2>An offset panel over the image.</h2>
              <p>
                A deliberately less regular composition for journal excerpts, special events,
                or sections that need energy without relying on decoration.
              </p>
            </Stack>
          </div>
        </div>
      </section>

      <section class="pattern-section">
        {@render patternHeader('10', 'Data strip', 'Cluster')}
        <div class="stat-strip">
          <Cluster justify="space-between" gap="var(--space-l)">
            {#each ['Stat one', 'Stat two', 'Stat three', 'Stat four'] as stat}
              <div class="stat">
                <p>{stat}</p>
              </div>
            {/each}
          </Cluster>
        </div>
      </section>

      <section class="pattern-section">
        {@render patternHeader('11', 'Call-to-action band', 'Repel-style cluster')}
        <div class="cta-band" data-scheme="highlight">
          <Stack space="var(--space-s)">
            <p class="kicker">Next action</p>
            <h2>A call to action across the band.</h2>
          </Stack>
          <Cluster>
            <Button href="#">Primary action</Button>
            <Button href="/contact" variant="secondary">Contact</Button>
          </Cluster>
        </div>
      </section>

      <section class="pattern-section">
        {@render patternHeader('12', 'Image grid with copy', 'Sidebar + Grid')}
        <Sidebar side="right" sideWidth="36%" contentMin="48%" gap="var(--space-xl)">
          <Stack space="var(--space-l)">
            <Stack space="var(--space-m)">
              <h2>A headline of about five words.</h2>
              <p>
                A compact pattern for introducing several offers at once while keeping the main
                message and CTA clear. Useful for a homepage mid-section or a pillar page.
              </p>
            </Stack>
            <Button href="#">Primary action</Button>
            <Stack space="var(--space-s)">
              <p class="follow-label">Follow us</p>
              <Cluster gap="var(--space-s)">
                <a class="social-link" href="/" aria-label="Facebook">f</a>
                <a class="social-link" href="/" aria-label="Instagram">ig</a>
                <a class="social-link" href="/" aria-label="Newsletter">in</a>
              </Cluster>
            </Stack>
          </Stack>

          <div class="feature-grid" aria-hidden="true">
            {#each featureTiles as tile, i}
              <Frame ratio="1/1">
                <div class="media-fill {i % 2 !== 0 ? 'media-fill--alt' : ''}"></div>
              </Frame>
            {/each}
          </div>
        </Sidebar>
      </section>
      <section class="pattern-section">
        {@render patternHeader('14', 'Asymmetric image grid', 'CSS Grid')}
        <div class="asymmetric-grid">
          <div class="side-card">
            <Frame ratio="3/2"><div class="media-fill"></div></Frame>
            <Stack space="var(--space-xs)">
              <h3>{exercises[0].label}</h3>
              <p>{exercises[0].description}</p>
            </Stack>
          </div>

          <div class="asymmetric-grid__center">
            <div class="asymmetric-fill media-fill media-fill--alt"></div>
          </div>

          <div class="side-card">
            <Frame ratio="3/2"><div class="media-fill"></div></Frame>
            <Stack space="var(--space-xs)">
              <h3>{exercises[1].label}</h3>
              <p>{exercises[1].description}</p>
            </Stack>
          </div>

          <div class="side-card">
            <Frame ratio="3/2"><div class="media-fill media-fill--alt"></div></Frame>
            <Stack space="var(--space-xs)">
              <h3>{exercises[2].label}</h3>
              <p>{exercises[2].description}</p>
            </Stack>
          </div>

          <div class="side-card">
            <Frame ratio="3/2"><div class="media-fill"></div></Frame>
            <Stack space="var(--space-xs)">
              <h3>{exercises[3].label}</h3>
              <p>{exercises[3].description}</p>
            </Stack>
          </div>
        </div>
      </section>

      <section class="pattern-section">
        {@render patternHeader('13', 'One image, four text', 'Sidebar')}
        <Sidebar sideWidth="52%" contentMin="42%" gap="var(--space-xl)">
          <Frame ratio="4/5">
            <div class="media-fill media-fill--alt"></div>
          </Frame>
          <Stack space="var(--space-l)">
            <Stack space="var(--space-s)">
              <p class="kicker">What you get</p>
              <h2>A headline of about four words.</h2>
            </Stack>
            <div class="perk-grid">
              {#each perks as perk}
                <div class="perk-item">
                  <Stack space="var(--space-xs)">
                    <span class="perk-tag">{perk.tag}</span>
                    <h3>{perk.heading}</h3>
                    <p>{perk.body}</p>
                  </Stack>
                </div>
              {/each}
            </div>
          </Stack>
        </Sidebar>
      </section>
      <section class="pattern-section">
        {@render patternHeader('15', 'Satellite image grid', 'CSS Grid')}
        <div class="satellite-layout">

          <div class="satellite-header">
            <Stack space="var(--space-s)">
              <p class="kicker">The method</p>
              <h2>Three nouns, one headline.</h2>
              <p class="satellite-intro">No fuss. No ceremony. Simply arrive and begin.</p>
            </Stack>
          </div>

          <div class="satellite-left">
            {#each exercises.slice(0, 2) as ex}
              <div class="satellite-item">
                <span class="satellite-icon" aria-hidden="true"></span>
                <Stack space="var(--space-xs)">
                  <h3>{ex.label}</h3>
                  <p>{ex.description}</p>
                </Stack>
              </div>
            {/each}
          </div>

          <div class="satellite-image">
            <Frame ratio="1/1">
              <div class="media-fill media-fill--alt"></div>
            </Frame>
          </div>

          <div class="satellite-right">
            {#each exercises.slice(2, 4) as ex}
              <div class="satellite-item">
                <span class="satellite-icon" aria-hidden="true"></span>
                <Stack space="var(--space-xs)">
                  <h3>{ex.label}</h3>
                  <p>{ex.description}</p>
                </Stack>
              </div>
            {/each}
          </div>

          <div class="satellite-fifth">
            <div class="satellite-item">
              <span class="satellite-icon" aria-hidden="true"></span>
              <Stack space="var(--space-xs)">
                <h3>{exercises[4].label}</h3>
                <p>{exercises[4].description}</p>
              </Stack>
            </div>
          </div>

          <div class="satellite-action">
            <Button href="/timetable/">Book a class</Button>
          </div>

        </div>
      </section>

      <section class="pattern-section">
        {@render patternHeader('16', 'Homepage feature bubble', 'FeatureBlock')}
        <div class="feature-bubble-pattern">
          <FeatureBlock label="Feature label">
            <svelte:fragment slot="body">
              <p class="feature-bubble-copy">
                A sentence of body copy inside the feature block.
              </p>
            </svelte:fragment>

            <svelte:fragment slot="media">
              <div class="feature-bubble-media">
                <Frame ratio="4/3">
                  <div class="feature-bubble-illustration" aria-hidden="true">
                    <span class="shop-awning"></span>
                    <span class="shop-window shop-window--one"></span>
                    <span class="shop-window shop-window--two"></span>
                    <span class="shop-door"></span>
                    <span class="shop-sign">Sign</span>
                  </div>
                </Frame>
              </div>
            </svelte:fragment>

            <svelte:fragment slot="cta">
              <Button href="#">Primary action</Button>
            </svelte:fragment>
          </FeatureBlock>
        </div>
      </section>
    </Stack>
  </Wrapper>
</div>

<style>
  .pattern-page {
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

  .pattern-section--bleed {
    margin-inline-end: calc(var(--gutter) * -1);
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

  .pattern-header h2,
  .tile--large h2,
  .choice h2,
  .cta-band h2 {
    font-size: var(--size-step-4);
  }

  .tile,
  .mini-tile,
  .reel-card,
  .choice {
    background: var(--surface-raised);
    border: var(--stroke-solid);
    padding: var(--space-m);
  }

  .tile--media {
    overflow: hidden;
    padding: 0;
  }

  .tile__body {
    padding: var(--space-m);
  }

  .tile h3,
  .reel-card h3 {
    color: var(--primary);
    font-family: var(--font-base);
    font-size: var(--size-step-1);
    letter-spacing: 0;
    text-transform: none;
  }

  .step-list {
    display: grid;
    gap: 0;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .step-list__item {
    border-top: var(--stroke);
    display: grid;
    gap: var(--space-s);
    grid-template-columns: 2.5rem 1fr;
    padding-block: var(--space-m);
  }

  .step-number {
    color: var(--primary);
    font-size: var(--size-step-00);
    font-weight: var(--font-medium);
    letter-spacing: 0.08em;
    padding-block-start: 0.2em;
  }

  .step-list__item h3 {
    color: var(--heading);
    font-family: var(--font-base);
    font-size: var(--size-step-1);
    letter-spacing: 0;
    text-transform: none;
  }

  .mini-tile {
    color: var(--primary);
    font-weight: var(--font-bold);
    text-transform: uppercase;
  }

  .reel-card {
    display: grid;
    flex-shrink: 0;
    gap: var(--space-m);
    width: 18rem;
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

  .manifesto {
    background: var(--primary);
    color: var(--on-primary);
    padding: var(--space-xl);
    text-align: center;
  }

  .manifesto h2 {
    color: var(--on-primary);
    max-width: unset;
  }

  .choice--light {
    --button-shadow: var(--text);

    background: var(--surface);
  }

  .choice--light h2 {
    color: var(--primary);
  }

  .choice--light :global(.button[data-variant='secondary']) {
    color: var(--text);
    border-color: var(--text);
  }

  .editorial-offset {
    display: grid;
    gap: var(--space-l);
    grid-template-columns: minmax(0, 0.85fr) minmax(16rem, 1fr);
    align-items: center;
  }

  .editorial-offset__copy {
    border: var(--stroke-solid);
    margin-inline-start: calc(var(--space-xl) * -1);
    padding: var(--space-l);
    z-index: 1;
  }

  .stat-strip {
    border-block: var(--stroke);
    padding-block: var(--space-l);
  }

  .stat p {
    color: var(--primary);
    font-family: var(--font-display);
    font-size: var(--size-step-3);
    line-height: var(--leading-fine);
    max-width: unset;
    text-transform: uppercase;
  }

  .cta-band {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-l);
    align-items: center;
    justify-content: space-between;
    padding: var(--space-l);
  }

  .cta-band h2 {
    color: var(--primary);
  }

  .cta-band :global(.button[data-variant='secondary']) {
    --button-shadow: var(--text);

    color: var(--text);
    border-color: var(--text);
  }

  .feature-grid {
    display: grid;
    gap: var(--space-m);
    grid-template-columns: repeat(2, 1fr);
  }

  .follow-label {
    color: var(--primary);
    font-size: var(--size-step-00);
    font-weight: var(--font-medium);
    letter-spacing: 0.08em;
    max-width: unset;
    text-transform: uppercase;
  }

  .social-link {
    aspect-ratio: 1;
    border: var(--stroke-solid);
    color: var(--primary);
    display: inline-grid;
    font-size: var(--size-step-00);
    font-weight: var(--font-bold);
    inline-size: 2rem;
    place-items: center;
    text-decoration: none;
    text-transform: uppercase;
  }

  .asymmetric-grid {
    align-items: start;
    display: grid;
    gap: var(--space-m);
    grid-template-columns: 1fr 1.6fr 1fr;
  }

  .asymmetric-grid__center {
    align-self: stretch;
    grid-column: 2;
    grid-row: 1 / 3;
  }

  .asymmetric-fill {
    height: 100%;
    min-height: 20rem;
  }

  .side-card {
    display: grid;
    gap: var(--space-s);
  }

  .side-card h3 {
    color: var(--primary);
    font-family: var(--font-base);
    font-size: var(--size-step-1);
    letter-spacing: 0;
    text-transform: none;
  }

  .perk-grid {
    display: grid;
    gap: var(--space-m);
    grid-template-columns: repeat(2, 1fr);
  }

  .perk-item {
    border-top: var(--stroke);
    padding-block-start: var(--space-m);
  }

  .perk-tag {
    background: color-mix(in srgb, var(--primary) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--primary) 35%, transparent);
    color: var(--primary);
    display: inline-block;
    font-size: var(--size-step-000);
    font-weight: var(--font-medium);
    letter-spacing: 0.1em;
    padding: 0.15em 0.5em;
    text-transform: uppercase;
  }

  .perk-item h3 {
    color: var(--heading);
    font-family: var(--font-base);
    font-size: var(--size-step-1);
    letter-spacing: 0;
    text-transform: none;
  }

  .satellite-layout {
    display: grid;
    gap: var(--space-l);
    grid-template-areas:
      'header header header'
      'left   image  right'
      '.      fifth  .'
      '.      action .';
    grid-template-columns: 1fr 1.4fr 1fr;
    text-align: center;
  }

  .satellite-header {
    grid-area: header;
  }

  .satellite-header h2 {
    margin-inline: auto;
    max-width: 18ch;
  }
  .satellite-image  { grid-area: image; }
  .satellite-fifth  { grid-area: fifth; }

  .satellite-left,
  .satellite-right {
    align-self: stretch;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
  }

  .satellite-left  { grid-area: left; }
  .satellite-right { grid-area: right; }

  .satellite-action {
    display: flex;
    grid-area: action;
    justify-content: center;
  }


  .satellite-intro {
    font-size: var(--size-step-1);
    margin-inline: auto;
  }

  .satellite-item {
    display: grid;
    gap: var(--space-xs);
    justify-items: center;
  }

  .satellite-item h3 {
    color: var(--primary);
    font-family: var(--font-base);
    font-size: var(--size-step-00);
    letter-spacing: 0.08em;
    max-width: unset;
    text-transform: uppercase;
  }

  .satellite-item p {
    margin-inline: auto;
    max-width: 22ch;
  }

  .satellite-icon {
    border: 1px solid var(--primary);
    border-radius: 50%;
    display: block;
    height: 2rem;
    opacity: 0.6;
    width: 2rem;
  }

  .feature-bubble-copy {
    font-family: var(--font-display);
    font-size: var(--size-step-5);
    line-height: var(--leading-fine);
    max-width: 18ch;
    text-transform: uppercase;
  }

  .feature-bubble-pattern :global(.feature-block__main) {
    border-radius: clamp(2rem, 6vw, 4.5rem);
    padding: var(--space-xl);
  }

  .feature-bubble-pattern :global(.feature-block__inner) {
    align-items: stretch;
    min-block-size: clamp(22rem, 34vw, 30rem);
  }

  .feature-bubble-pattern :global(.feature-block__content) {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-block-size: clamp(17rem, 26vw, 23rem);
  }

  .feature-bubble-pattern :global(.feature-block__label) {
    color: var(--on-primary);
    letter-spacing: 0.12em;
  }

  .feature-bubble-pattern :global(.feature-block__bubble) {
    border-radius: 0 0 3rem 3rem;
    margin-inline-start: clamp(4rem, 9vw, 7rem);
    margin-inline-end: auto;
    margin-block-start: -1px;
    padding: var(--space-s) var(--space-l) var(--space-m);
    position: relative;
  }

  .feature-bubble-pattern :global(.feature-block__bubble .button) {
    --button-shadow: var(--text);
  }

  .feature-bubble-pattern :global(.feature-block__cta) {
    border-radius: 999px;
    color: var(--surface);
    font-family: var(--font-base);
    font-weight: var(--font-bold);
    letter-spacing: 0.06em;
    position: relative;
    text-transform: uppercase;
    z-index: 1;
  }

  .feature-bubble-media {
    inline-size: min(100%, 24rem);
    justify-self: end;
    place-self: center end;
  }

  .feature-bubble-illustration {
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--text) 18%, transparent) 1px, transparent 1px) 0 0 / 3rem 2.2rem,
      linear-gradient(color-mix(in srgb, var(--text) 18%, transparent) 1px, transparent 1px) 0 0 / 3rem 2.2rem,
      color-mix(in srgb, var(--accent) 62%, var(--text));
    block-size: 100%;
    border: 3px solid var(--text);
    min-block-size: 13rem;
    overflow: hidden;
    position: relative;
  }

  .shop-awning {
    background:
      repeating-linear-gradient(
        90deg,
        var(--text) 0 2rem,
        var(--primary) 2rem 3.2rem
      );
    block-size: 4.5rem;
    border-block-end: 3px solid var(--text);
    display: block;
    inset-block-start: 0;
    inset-inline: 0;
    position: absolute;
  }

  .shop-window,
  .shop-door {
    background: var(--surface);
    border: 3px solid var(--text);
    position: absolute;
  }

  .shop-window {
    block-size: 4rem;
    inset-block-end: 2rem;
    inline-size: 28%;
  }

  .shop-window--one {
    inset-inline-start: 8%;
  }

  .shop-window--two {
    inset-inline-start: 41%;
  }

  .shop-door {
    block-size: 7rem;
    inset-block-end: 2rem;
    inset-inline-end: 8%;
    inline-size: 18%;
  }

  .shop-sign {
    color: var(--surface);
    font-family: var(--font-display);
    font-size: var(--size-step-3);
    inset-block-start: 4.8rem;
    inset-inline: 0;
    letter-spacing: 0.05em;
    position: absolute;
    text-align: center;
    text-transform: uppercase;
  }

  @media (max-width: 48rem) {
    .editorial-offset {
      grid-template-columns: 1fr;
    }

    .editorial-offset__copy {
      margin-inline-start: 0;
    }

    .feature-bubble-media {
      inline-size: min(100%, 20rem);
      justify-self: start;
    }

    .feature-bubble-pattern :global(.feature-block__inner),
    .feature-bubble-pattern :global(.feature-block__content) {
      min-block-size: auto;
    }

    .feature-bubble-pattern :global(.feature-block__bubble) {
      margin-inline: auto;
    }

  }
</style>
