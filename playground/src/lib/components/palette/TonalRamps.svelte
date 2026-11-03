<script>
  import { uses, level, formatMetric } from '$lib/palette/levels.js';

  /** @type {Array} One ramp per palette colour, from contrast.generated.json */
  export let ramps;
  /** @type {Array} Each scheme's surface colour: { scheme, color, hex } */
  export let surfaces;
  /** @type {string} Which `supports` key a chip must pass to show at full strength */
  export let use = 'body';
  /** @type {'wcag'|'apca'} Number shown on each chip */
  export let metric = 'wcag';

  /** @type {string} The colour whose ramp is shown in detail first */
  export let start = ramps[0]?.name;

  let chosen = start;

  $: detail = ramps.find((r) => r.name === chosen);
  $: useLabel = uses.find((u) => u.value === use)?.label.toLowerCase();

  // Dark label on light steps, light label on dark ones (OKLCH L as %)
  const ink = (step) => (step.oklch.l >= 60 ? '#000000' : '#FFFFFF');
</script>

<div class="ramps stack">
  <ul role="list" class="ramps__list stack">
    {#each ramps as r}
      <li class="ramp">
        <p class="ramp__name">
          <span class="b">{r.name}</span>
          <code>{r.hex}</code>
        </p>
        <ol role="list" class="ramp__steps">
          {#each r.steps as s}
            <li
              class="ramp__step"
              data-nearest={s.step === r.nearest}
              style:background={s.hex}
              style:color={ink(s)}
              title="{r.name} {s.step}: {s.hex}, {s.oklch.css}"
            >
              <span class="ramp__label">{s.step}</span>
              <span class="ramp__hex">{s.hex}</span>
            </li>
          {/each}
        </ol>
      </li>
    {/each}
  </ul>

  <label class="ramps__choose">
    Details for
    <select bind:value={chosen}>
      {#each ramps as r}
        <option value={r.name}>{r.name}</option>
      {/each}
    </select>
  </label>

  {#if detail}
    <p class="ramps__key">
      Each chip is the step as text on a scheme’s surface. Faded, struck-through chips don’t pass
      for {useLabel}. ◆ marks the step closest in lightness to {detail.name} itself
      ({detail.hex}).
    </p>
    <div class="ramps__table" role="region" aria-labelledby="ramp-caption" tabindex="0">
      <table>
        <caption id="ramp-caption" class="visually-hidden">The {detail.name} ramp</caption>
        <thead>
          <tr>
            <th scope="col">Step</th>
            <th scope="col">Hex</th>
            <th scope="col">OKLCH</th>
            {#each surfaces as surface}
              <th scope="col">
                On {surface.scheme}
                <span class="ramps__surface">{surface.color}</span>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each detail.steps as s}
            <tr>
              <th scope="row">
                <span class="ramps__step">
                  <span class="swatch" style:background={s.hex}></span>
                  {s.step}{#if s.step === detail.nearest}<span aria-hidden="true"> ◆</span><span class="visually-hidden">, closest to {detail.name}</span>{/if}
                </span>
              </th>
              <td><code>{s.hex}</code></td>
              <td>
                <code>{s.oklch.css}</code>
                {#if s.clipped}
                  <span class="ramps__clipped" title="Chroma pulled in to stay inside sRGB">
                    C fitted to sRGB
                  </span>
                {/if}
              </td>
              {#each surfaces as surface}
                {@const p = s.on[surface.scheme]}
                <td>
                  <span
                    class="chip"
                    data-pass={p.supports[use]}
                    style:background={surface.hex}
                    style:color={s.hex}
                    title="{detail.name} {s.step} on {surface.color}: {p.ratio}:1, Lc {p.apca} ({level(p)})"
                  >
                    {formatMetric(p, metric)}<span class="visually-hidden">: on {surface.color}, {level(p)}</span>
                  </span>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .ramps__list {
    --stack-space: var(--space-s);
  }

  /* Rows are layout, not running text: no measure cap */
  .ramp,
  .ramp__step {
    max-width: none;
  }

  .ramp {
    display: grid;
    grid-template-columns: minmax(8rem, 10rem) 1fr;
    gap: var(--space-s);
    align-items: center;
  }

  @media (max-width: 40em) {
    .ramp {
      grid-template-columns: 1fr;
    }
  }

  .ramp__name {
    display: flex;
    flex-direction: column;
    font-size: var(--size-step-00);
  }

  .ramp__name code {
    opacity: 0.7;
  }

  code {
    background: none;
    padding: 0;
  }

  .ramp__steps {
    container-type: inline-size;
    display: grid;
    grid-template-columns: repeat(11, minmax(0, 1fr));
    overflow: hidden;
    border-radius: var(--radius-s);
  }

  .ramp__step {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-block-size: 4.5rem;
    padding: var(--space-2xs);
    font-size: var(--size-step-00);
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }

  .ramp__step[data-nearest='true'] {
    box-shadow: inset 0 0 0 2px currentColor;
  }

  .ramp__label {
    font-weight: var(--font-weight-bold);
  }

  .ramp__hex {
    font-family: var(--font-mono);
    font-size: 0.75em;
    white-space: nowrap;
  }

  /* Too narrow for a hex per step: the table below has them */
  @container (max-width: 52rem) {
    .ramp__hex {
      display: none;
    }
  }

  @container (max-width: 30rem) {
    .ramp__label {
      font-size: 0.75em;
    }
  }

  .ramps__choose {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--size-step-00);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .ramps__table {
    overflow-x: auto;
    border-block: var(--stroke);
  }

  table {
    border-collapse: collapse;
    width: 100%;
    font-size: var(--size-step-00);
  }

  .ramps__key {
    font-size: var(--size-step-00);
  }

  th,
  td {
    text-align: start;
    vertical-align: middle;
    padding: var(--space-xs) var(--space-s);
    border-block-end: var(--stroke);
    white-space: nowrap;
  }

  thead th {
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  th[scope='row'] {
    font-weight: var(--font-weight-medium);
    font-variant-numeric: tabular-nums;
  }

  .ramps__step {
    display: flex;
    align-items: center;
    gap: var(--space-s);
  }

  .ramps__surface,
  .ramps__clipped {
    display: block;
    font-weight: var(--font-weight-regular);
    text-transform: none;
    letter-spacing: 0;
    opacity: 0.7;
  }

  .swatch {
    inline-size: 2rem;
    block-size: 2rem;
    border-radius: var(--radius-s);
    outline: 1px solid color-mix(in srgb, currentColor 30%, transparent);
  }

  .chip {
    display: inline-block;
    min-inline-size: 4.5rem;
    padding: var(--space-2xs) var(--space-xs);
    border-radius: var(--radius-s);
    font-size: var(--size-step-0);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
    text-align: center;
    outline: 1px solid color-mix(in srgb, currentColor 25%, transparent);
  }

  .chip[data-pass='false'] {
    opacity: 0.35;
    text-decoration: line-through;
  }
</style>
