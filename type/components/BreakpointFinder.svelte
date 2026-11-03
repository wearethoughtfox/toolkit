<script>
  import LabButton from '../../shared/LabButton.svelte';
  import Measured from './Measured.svelte';
  import { targetAt } from '../measure.js';

  /** @type {object} typography.json, for bind:typography */
  export let typography;
  /** Your site's Button component, so the tools look like the site. Takes variant (primary, secondary, ghost) and onclick */
  export let button = LabButton;

  let width = typography.breakpoint;
  let smallStats = null;
  let largeStats = null;

  $: body = typography.scale.find((s) => s.name === 'body');
  $: face = typography.candidates.find((c) => c.id === body?.face);
  $: font = face?.stack ?? 'inherit';
</script>

{#if body}
  <div class="stack">
    <div class="cluster finder__controls">
      <label class="finder__slider">
        Column width <strong>{width}px</strong>
        <input type="range" min="320" max="700" step="5" bind:value={width} />
      </label>
      <svelte:component this={button} variant="secondary" onclick={() => (typography.breakpoint = width)}>Use {width}px as the breakpoint</svelte:component>
    </div>

    <p class="finder__status" aria-live="polite">
      Breakpoint now <strong>{typography.breakpoint}px</strong>.
      At {width}px, Chimero's targets give about {targetAt(width).toFixed(1)} words per line.
    </p>

    <label class="finder__max">
      Maximum text width
      <input type="number" min="400" max="1000" step="10" bind:value={typography.maxWidth} /> px
    </label>

    <div class="finder__scroll stack">
      <figure class="stack">
        <figcaption>
          Small setting, {body.small.size}/{body.small.leading}{#if smallStats}: {smallStats.average.toFixed(1)} words per line{/if}
        </figcaption>
        <Measured text={typography.sample.text} {width} {font} size={body.small.size} leading={body.small.leading} weight={body.weight} bind:stats={smallStats} />
      </figure>
      <figure class="stack">
        <figcaption>
          Large setting, {body.large.size}/{body.large.leading}{#if largeStats}: {largeStats.average.toFixed(1)} words per line{/if}
        </figcaption>
        <Measured text={typography.sample.text} {width} {font} size={body.large.size} leading={body.large.leading} weight={body.weight} bind:stats={largeStats} />
      </figure>
    </div>
  </div>
{/if}

<style>
  .finder__controls {
    --gutter: var(--space-s) var(--space-m);
    align-items: center;
    font-size: var(--size-step-00);
  }

  .finder__slider {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-xs);
  }

  .finder__slider input {
    width: min(24rem, 70vw);
  }

  .finder__status,
  .finder__max,
  figcaption {
    font-size: var(--size-step-00);
  }

  .finder__scroll {
    --stack-space: var(--space-l);
    overflow-x: auto;
    padding: var(--space-xs);
  }

  figure {
    --stack-space: var(--space-s);
    margin: 0;
  }
</style>
