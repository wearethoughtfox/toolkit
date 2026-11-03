<script>
  import Region from '$lib/components/layout/Region.svelte';
  import Wrapper from '$lib/components/layout/Wrapper.svelte';
  import Stack from '$lib/components/layout/Stack.svelte';
  import PairExplorer from '$lib/components/palette/PairExplorer.svelte';
  import ContrastMatrix from '$lib/components/palette/ContrastMatrix.svelte';
  import SchemePreview from '$lib/components/palette/SchemePreview.svelte';
  import Grid from '$lib/components/layout/Grid.svelte';
  import data from '$lib/palette/contrast.generated.json';
  import { uses } from '$lib/palette/levels.js';

  let use = 'body';
  let metric = 'wcag';

  $: passing = data.pairs.filter((p) => p.supports[use]).length;
</script>

<svelte:head>
  <title>Palette</title>
</svelte:head>

<Region>
  <Wrapper>
    <Stack space="var(--space-xl)">
      <Stack space="var(--space-s)">
        <h1>Palette</h1>
        <p>
          Every colour in <code>colors.json</code> as text on every other. WCAG 2 decides pass or
          fail; the APCA score is shown as a guide, and changes with which colour is the text.
          This page only exists in development. Run <code>npm run contrast</code> for the same data
          in the terminal.
        </p>
      </Stack>

      <div class="controls cluster">
        <fieldset>
          <legend>Check for</legend>
          <div class="cluster">
            {#each uses as u}
              <label>
                <input type="radio" bind:group={use} value={u.value} />
                {u.label} <span class="controls__min">{u.min}</span>
              </label>
            {/each}
          </div>
        </fieldset>
        <fieldset>
          <legend>Show</legend>
          <div class="cluster">
            <label><input type="radio" bind:group={metric} value="wcag" /> WCAG ratio</label>
            <label><input type="radio" bind:group={metric} value="apca" /> APCA Lc</label>
          </div>
        </fieldset>
      </div>

      <section class="stack" aria-labelledby="explore">
        <h2 id="explore">Explore</h2>
        <p>Shuffle through pairs that pass, using the button or the → key. Fix the text or background colour to see only its partners.</p>
        <PairExplorer pairs={data.pairs} colors={data.colors} {use} />
      </section>

      <section class="stack" aria-labelledby="inspect">
        <h2 id="inspect">Inspect</h2>
        <p>{passing} of {data.pairs.length} pairs pass. Failing pairs are kept on show: knowing what doesn’t work is useful too.</p>
        <ContrastMatrix
          colors={data.colors}
          pairs={data.pairs}
          thresholds={data.thresholds}
          {use}
          {metric}
        />
      </section>

      <section class="stack" aria-labelledby="schemes">
        <h2 id="schemes">Schemes</h2>
        <p>
          Each scheme in <code>colors.json</code> on the real components, with every role pair it
          uses checked. The same checks print as warnings on <code>npm run tokens</code>. Fixes are
          suggestions only; nothing changes until you edit <code>colors.json</code>.
        </p>
        <Grid minItemSize="22rem">
          {#each Object.entries(data.schemeChecks) as [name, checks]}
            <SchemePreview {name} {checks} />
          {/each}
        </Grid>
      </section>
    </Stack>
  </Wrapper>
</Region>

<style>
  .controls {
    --gutter: var(--space-l);
    align-items: flex-start;
  }

  fieldset {
    border: var(--stroke);
    border-radius: var(--radius-s);
    padding: var(--space-s) var(--space-m);
    font-size: var(--size-step-00);
  }

  legend {
    padding-inline: var(--space-2xs);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    cursor: pointer;
  }

  input {
    accent-color: var(--primary);
  }

  .controls__min {
    opacity: 0.7;
  }
</style>
