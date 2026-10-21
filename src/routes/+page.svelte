<script>
  import Stack from '$lib/components/layout/Stack.svelte';
  import Cluster from '$lib/components/layout/Cluster.svelte';
  import Grid from '$lib/components/layout/Grid.svelte';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import Switcher from '$lib/components/layout/Switcher.svelte';
  import Cover from '$lib/components/layout/Cover.svelte';
  import Reel from '$lib/components/layout/Reel.svelte';
  import Wrapper from '$lib/components/layout/Wrapper.svelte';
  import Region from '$lib/components/layout/Region.svelte';
  import Button from '$lib/components/blocks/Button.svelte';
  import Card from '$lib/components/blocks/Card.svelte';
  import Prose from '$lib/components/blocks/Prose.svelte';
  import FeatureBlock from '$lib/components/blocks/FeatureBlock.svelte';
</script>

<svelte:head>
  <title>Design System</title>
</svelte:head>

<!-- TYPOGRAPHY TEST: article length -->
<Region>
  <Wrapper>
    <Stack space="var(--space-l)">
      <Stack space="var(--space-m)">
        <Stack space="var(--space-s)">
          <h3>Pilates · Café · Community</h3>
          <h1>Move well.<br>Eat well.<br>Stay a while.</h1>
        </Stack>
        <p>Root is a place to move and eat without having to choose between doing it properly and enjoying it. The classes are real. The food is made here. The people stay longer than they planned to, which is usually a good sign.</p>
      </Stack>

      <h2>What we do</h2>
      <Stack space="var(--space-m)">
        <p>The reformer Pilates classes at Root are small — deliberately so. Sam keeps them to eight people because she'd rather teach eight people well than sixteen people adequately. The method is precise, the instructors know what they're doing, and you'll notice the difference in your body faster than you expect.</p>
        <p>The cafe runs alongside the studio, not as an afterthought. Everything on the menu is made here. The sourdough is baked in-house. The eggs are properly poached. The coffee is taken seriously. It's the kind of place where you come in for a post-class flat white and find yourself still there an hour later, which we take as a compliment.</p>
        <p>We're not trying to optimise you. We're not going to sell you a supplement stack or tell you that your morning routine needs an overhaul. Root exists for people who want to move well and eat well without it becoming a personality. You come in, you work hard, you sit down, you eat something good. That's the whole thing.</p>
        <p>The community that has formed around Root is the part that's hardest to describe on a website. It tends to happen gradually — you recognise someone from Tuesday's class, you end up at the same table, you find out they work two streets away. It's the kind of connection that comes from sharing a physical space rather than a feed, which is rarer than it used to be and probably more valuable because of it.</p>
      </Stack>
    </Stack>
  </Wrapper>
</Region>

<!-- CLAY SECTION TEST -->
<div class="clay-section">
  <Region>
    <Wrapper>
      <Stack space="var(--space-l)">
        <Stack space="var(--space-s)">
          <h3>Our café</h3>
          <h2>Food that moves you</h2>
        </Stack>
        <p>Everything on the menu is made here. The sourdough is baked in-house. The eggs are properly poached. The coffee is taken seriously. It's the kind of place where you come in for a post-class flat white and find yourself still there an hour later, which we take as a compliment.</p>
      </Stack>
    </Wrapper>
  </Region>
</div>

<!-- COPY PREVIEW: manifesto lines in two treatments -->
<Region>
  <Wrapper>
    <Stack space="var(--space-2xl)">

      <!-- Treatment A: current — big, tight tracking, Rockhill -->
      <div class="stack" style="--stack-space: var(--space-m)">
        <p class="label-tag">Treatment A — big, tight</p>
        <h2>Move well, eat well, stay a while.</h2>
        <h2>A place to move, eat and belong.</h2>
      </div>

      <!-- Treatment B: previous — Rockhill, looser tracking, mid size -->
      <div class="manifesto-block stack" style="--stack-space: var(--space-xl)">
        <p class="label-tag">Treatment B — mid, open</p>
        <p class="manifesto-line">Everything we serve, we make.<br>Everything we teach, we live.</p>
        <p class="manifesto-line">Move with purpose. Eat with pleasure.</p>
        <p class="manifesto-line">Move well, eat well, stay a while.</p>
        <p class="manifesto-line">A place to move, eat and belong.</p>
      </div>

    </Stack>
  </Wrapper>
</Region>

<!-- FEATURE BLOCK -->
<Region>
  <Wrapper>
    <FeatureBlock
      label="Move well, eat well, stay a while"
      ctaText="See our classes"
      ctaHref="/classes"
    >
      <svelte:fragment slot="body">
        <p style="font-family: var(--font-display); font-size: var(--size-step-6); line-height: var(--leading-fine); text-transform: uppercase; letter-spacing: -0.01em; max-width: 16ch;">
          Good food. Good movement. Good people.
        </p>
      </svelte:fragment>
      <svelte:fragment slot="media">
        <div class="frame" data-ratio="1/1" style="border-radius: var(--radius-m); overflow: hidden; background: var(--color-ground); min-width: 12rem;">
        </div>
      </svelte:fragment>
    </FeatureBlock>
  </Wrapper>
</Region>

<!-- TYPOGRAPHY -->
<Region>
  <Wrapper>
    <Stack space="var(--space-xl)">
      <h2>Typography</h2>

      <!-- Display scale: Rockhill Sans Rough -->
      <Stack space="var(--space-m)">
        <h3>Display — Rockhill Sans Rough</h3>
        <Stack space="var(--space-s)">
          {#each [
            ['Step 9 — h1', 'var(--size-step-9)', '43–93px'],
            ['Step 7 — h2', 'var(--size-step-7)', '34–65px'],
            ['Step 6', 'var(--size-step-6)', '30–54px'],
            ['Step 5', 'var(--size-step-5)', '27–45px'],
            ['Step 4', 'var(--size-step-4)', '24–37px'],
          ] as [label, size, range]}
            <div class="type-specimen-row">
              <code class="type-label">{label} · {range}</code>
              <p class="display-specimen" style="font-size: {size};">Move well. Eat well.</p>
            </div>
          {/each}
        </Stack>
      </Stack>

      <!-- Body scale: Inter -->
      <Stack space="var(--space-m)">
        <h3>Body — Inter variable</h3>
        <Prose>
          <p>Body copy uses a fluid type scale from <strong>Step 0</strong> (15–18px) upward. The scale is generated from design tokens using <code>clamp()</code> values, so everything scales smoothly across viewport sizes.</p>
          <p>Measure is constrained to <code>66ch</code> on prose elements. Longer text wraps cleanly without the lines becoming unreadably wide.</p>
          <blockquote>
            <p>Good typography is invisible. You notice bad typography immediately.</p>
          </blockquote>
          <ul>
            <li>Lists inherit spacing from the flow composition</li>
            <li>Marker styles are controlled per list type</li>
            <li>Nested lists work correctly</li>
          </ul>
        </Prose>
      </Stack>

    </Stack>
  </Wrapper>
</Region>

<!-- COMPOSITIONS: GRID -->
<Region>
  <Wrapper>
    <Stack space="var(--space-l)">
      <h2>Grid</h2>
      <p class="fw5">Auto-fill grid — items find their own minimum width (16rem).</p>
      <Grid>
        {#each ['Card one', 'Card two', 'Card three', 'Card four', 'Card five', 'Card six'] as title}
          <Card>
            <svelte:fragment slot="heading">{title}</svelte:fragment>
            <svelte:fragment slot="body">
              <p>A simple card demonstrating the grid composition.</p>
            </svelte:fragment>
          </Card>
        {/each}
      </Grid>

      <p class="fw5">50/50 grid.</p>
      <Grid layout="50-50">
        <Card>
          <svelte:fragment slot="heading">Left</svelte:fragment>
          <svelte:fragment slot="body"><p>Switches to stacked below ~33rem.</p></svelte:fragment>
        </Card>
        <Card>
          <svelte:fragment slot="heading">Right</svelte:fragment>
          <svelte:fragment slot="body"><p>Both items share space equally.</p></svelte:fragment>
        </Card>
      </Grid>
    </Stack>
  </Wrapper>
</Region>

<!-- COMPOSITIONS: SIDEBAR -->
<Region>
  <Wrapper>
    <Stack space="var(--space-l)">
      <h2>Sidebar</h2>
      <Sidebar>
        <aside style="background: var(--color-dark-glare); padding: var(--space-m); border-radius: var(--radius-m);">
          <Stack space="var(--space-s)">
            <h3>Sidebar</h3>
            <p>Fixed-width (20rem). Stacks when the viewport is too narrow for both panes.</p>
          </Stack>
        </aside>
        <div style="background: var(--color-dark-glare); padding: var(--space-m); border-radius: var(--radius-m);">
          <Stack space="var(--space-s)">
            <h3>Main content</h3>
            <p>This pane grows to fill available space, with a minimum width of 50% before stacking.</p>
          </Stack>
        </div>
      </Sidebar>
    </Stack>
  </Wrapper>
</Region>

<!-- COMPOSITIONS: SWITCHER -->
<Region>
  <Wrapper>
    <Stack space="var(--space-l)">
      <h2>Switcher</h2>
      <Switcher threshold="32rem">
        <div style="background: var(--color-dark-glare); padding: var(--space-m); border-radius: var(--radius-m);">Item A — switches to stacked below 32rem</div>
        <div style="background: var(--color-dark-glare); padding: var(--space-m); border-radius: var(--radius-m);">Item B</div>
      </Switcher>
    </Stack>
  </Wrapper>
</Region>

<!-- COMPOSITIONS: REEL -->
<Region>
  <Wrapper>
    <Stack space="var(--space-l)">
      <h2>Reel</h2>
      <Reel itemWidth="16rem">
        {#each Array(8) as _, i}
          <div style="
            background: var(--color-dark-glare);
            padding: var(--space-m);
            border-radius: var(--radius-m);
            flex-shrink: 0;
            width: 16rem;
          ">
            Reel item {i + 1}
          </div>
        {/each}
      </Reel>
    </Stack>
  </Wrapper>
</Region>

<!-- BUTTONS -->
<Region>
  <Wrapper>
    <Stack space="var(--space-l)">
      <h2>Buttons</h2>
      {#each ['default', 'inverse'] as scheme}
        <div data-scheme={scheme} data-button-test={scheme} class="pa-m">
          <Cluster>
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button href="/">Link button</Button>
            <Button disabled>Disabled</Button>
          </Cluster>
        </div>
      {/each}
    </Stack>
  </Wrapper>
</Region>

<!-- TOKENS -->
<Region>
  <Wrapper>
    <Stack space="var(--space-l)">
      <h2>Design tokens</h2>
      <p>Edit <code>src/lib/design-tokens/*.json</code> and run <code>npm run tokens</code> to regenerate all CSS custom properties.</p>

      <h3>Colour palette</h3>
      <Cluster>
        {#each [
          ['Dark', 'var(--color-dark)', 'var(--color-light)'],
          ['Dark glare', 'var(--color-dark-glare)', 'var(--color-light)'],
          ['Mid', 'var(--color-mid)', 'var(--color-dark)'],
          ['Light', 'var(--color-light)', 'var(--color-dark)'],
          ['Primary', 'var(--color-primary)', 'var(--color-dark)'],
        ] as [name, bg, fg]}
          <div style="
            background: {bg};
            color: {fg};
            padding: var(--space-s) var(--space-m);
            border-radius: var(--radius-s);
            font-size: var(--size-step-00);
            font-weight: var(--font-bold);
          ">{name}</div>
        {/each}
      </Cluster>

      <h3>Spacing scale</h3>
      <Stack space="var(--space-xs)">
        {#each [
          ['XS', 'var(--space-xs)'],
          ['S', 'var(--space-s)'],
          ['M', 'var(--space-m)'],
          ['L', 'var(--space-l)'],
          ['XL', 'var(--space-xl)'],
          ['2XL', 'var(--space-2xl)'],
        ] as [name, val]}
          <div style="display: flex; align-items: center; gap: var(--space-m);">
            <div style="
              background: var(--color-primary);
              height: 1rem;
              width: {val};
              border-radius: var(--radius-s);
              flex-shrink: 0;
            "></div>
            <code style="font-size: var(--size-step-00);">{name} — {val}</code>
          </div>
        {/each}
      </Stack>
    </Stack>
  </Wrapper>
</Region>

<style>
  .clay-section {
    background: var(--color-clay);
    color: var(--color-ground);
  }

  /* Override heading colours inside clay section */
  .clay-section :global(h1),
  .clay-section :global(h2) {
    color: var(--color-teal);
  }

  .clay-section :global(h3) {
    color: var(--color-ground);
  }

  .type-specimen-row {
    border-top: 1px solid var(--color-clay);
    padding-top: var(--space-xs);
  }

  .type-label {
    display: block;
    font-size: var(--size-step-00);
    opacity: 0.5;
    margin-block-end: var(--space-2xs, 0.25rem);
    background: none;
    padding: 0;
  }

  .display-specimen {
    font-family: var(--font-display);
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: -0.01em;
    line-height: var(--leading-fine);
    color: var(--color-olive-oil);
    max-width: unset;
  }

  .label-tag {
    font-size: var(--size-step-00);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    opacity: 0.5;
  }

  /* Treatment B: mid-size Rockhill, open tracking — matches brand manifesto style */
  .manifesto-block {
    background: var(--color-olive-oil);
    padding: var(--space-xl);
    text-align: center;
  }

  .manifesto-line {
    font-family: var(--font-display);
    font-size: var(--size-step-5);
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    line-height: 1.15;
    color: var(--color-clay);
    max-width: unset;
  }
</style>

