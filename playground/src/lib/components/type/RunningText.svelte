<script>
  /** @type {object} typography.json, for bind:typography */
  export let typography;

  const verdicts = ['untested', 'pass', 'fail'];
  const medium = { size: 24, leading: 28 };
  const display = { size: 48, leading: 52 };

  $: body = typography.scale.find((s) => s.name === 'body') ?? typography.scale[0];
  $: sample = typography.sample;
</script>

<div class="running">
  {#each typography.candidates as candidate (candidate)}
    <article class="running__card stack" aria-labelledby="running-{candidate.id}">
      <h3 id="running-{candidate.id}" class="running__name">{candidate.family}</h3>

      <div class="type-sample stack" style:font-family={candidate.stack}>
        <p style:font-size="{body.small.size}px" style:line-height="{body.small.leading}px">{sample.text}</p>
        <p style:font-size="{medium.size}px" style:line-height="{medium.leading}px">{sample.title}</p>
        <p style:font-size="{display.size}px" style:line-height="{display.leading}px">{sample.title}</p>
      </div>

      <p class="running__sizes">
        Body {body.small.size}/{body.small.leading}, medium {medium.size}/{medium.leading}, display {display.size}/{display.leading}
      </p>

      <div class="running__verdicts">
        <label>
          Running text
          <select bind:value={candidate.running.verdict}>
            {#each verdicts as v}<option>{v}</option>{/each}
          </select>
        </label>
        <label>
          Three sizes
          <select bind:value={candidate.sizes.verdict}>
            {#each verdicts as v}<option>{v}</option>{/each}
          </select>
        </label>
        <label class="running__notes">
          What you saw
          <textarea rows="2" bind:value={candidate.running.notes}></textarea>
        </label>
        <label class="running__notes">
          At medium and display sizes
          <textarea rows="2" bind:value={candidate.sizes.notes}></textarea>
        </label>
      </div>
    </article>
  {/each}
</div>

<style>
  .running {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(22rem, 100%), 1fr));
    gap: var(--space-l);
  }

  .running__card {
    --stack-space: var(--space-s);
    border-block-start: var(--stroke-solid);
    padding-block-start: var(--space-s);
  }

  .running__name {
    text-transform: none;
    letter-spacing: normal;
  }

  .running__sizes {
    font-size: var(--size-step-00);
    opacity: 0.75;
  }

  .running__verdicts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-xs) var(--space-s);
    font-size: var(--size-step-00);
  }

  .running__notes {
    grid-column: 1 / -1;
  }
</style>
