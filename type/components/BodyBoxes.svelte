<script>
  import Measured from './Measured.svelte';
  import { boxes, verdict } from '../measure.js';

  /** @type {object} typography.json, for bind:typography */
  export let typography;

  let squint = false;
  let stats = [null, null];

  $: body = typography.scale.find((s) => s.name === 'body');
  $: face = typography.candidates.find((c) => c.id === body?.face);
  $: settings = body ? [body.small, body.large] : [];
</script>

{#if !body}
  <p>Add a step named <code>body</code> to the scale first.</p>
{:else}
  <div class="stack">
    <div class="cluster boxes__controls">
      <label>
        Face
        <select bind:value={body.face}>
          {#each typography.candidates as c}<option value={c.id}>{c.family}</option>{/each}
        </select>
      </label>
      <label>
        Weight
        <input type="number" min="100" max="900" step="100" bind:value={body.weight} />
      </label>
      <label><input type="checkbox" bind:checked={squint} /> Squint</label>
    </div>

    {#each boxes as box, i}
      {@const setting = settings[i]}
      {@const result = stats[i] ? verdict(stats[i].average, box.words) : null}
      <section class="box stack" aria-labelledby="box-{box.width}">
        <div class="cluster box__head">
          <h3 id="box-{box.width}" class="box__title">{box.width}px box, {i === 0 ? 'small' : 'large'} setting</h3>
          <label>Size <input type="number" min="10" max="32" step="0.5" bind:value={setting.size} /> px</label>
          <label>Line-height <input type="number" min="4" max="64" step="4" bind:value={setting.leading} /> px</label>
          <span class="box__ratio">{(setting.leading / setting.size).toFixed(2)}</span>
        </div>
        <p class="box__count" data-result={result} aria-live="polite">
          {#if stats[i]}
            <strong>{stats[i].average.toFixed(1)} words per line</strong>, target {box.words[0]}–{box.words[1]}: {result}
          {/if}
        </p>
        <div class="box__scroll">
          <Measured
            text={typography.sample.text}
            width={box.width}
            font={face?.stack ?? 'inherit'}
            size={setting.size}
            leading={setting.leading}
            weight={body.weight}
            {squint}
            bind:stats={stats[i]}
          />
        </div>
      </section>
    {/each}
  </div>
{/if}

<style>
  .boxes__controls,
  .box__head {
    --gutter: var(--space-s) var(--space-m);
    font-size: var(--size-step-00);
    align-items: baseline;
  }

  .box {
    --stack-space: var(--space-s);
  }

  .box__title {
    text-transform: none;
    letter-spacing: normal;
    font-size: var(--size-step-0);
  }

  .box__ratio {
    opacity: 0.75;
  }

  .box__count {
    font-size: var(--size-step-00);
  }

  .box__count[data-result='on target'] strong {
    color: var(--heading);
  }

  .box__scroll {
    overflow-x: auto;
    padding: var(--space-xs);
  }
</style>
