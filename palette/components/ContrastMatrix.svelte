<script>
  import { uses, level, formatMetric } from '../levels.js';

  /** @type {Array} The palette colours */
  export let colors;
  /** @type {Array} Every ordered pair from contrast.generated.json */
  export let pairs;
  /** @type {Object} WCAG thresholds by use */
  export let thresholds;
  /** @type {string} Which `supports` key a chip must pass to show at full strength */
  export let use = 'body';
  /** @type {'wcag'|'apca'} Number shown on each chip */
  export let metric = 'wcag';

  const pairFor = (fg, bg) => pairs.find((p) => p.fg === fg && p.bg === bg);

  $: useLabel = uses.find((u) => u.value === use)?.label.toLowerCase();
</script>

<div class="matrix" role="region" aria-labelledby="matrix-caption" tabindex="0">
  <table>
    <caption id="matrix-caption">
      Each chip is the row colour as text on another colour. Faded, struck-through chips don’t
      pass for {useLabel}.
    </caption>
    <thead>
      <tr>
        <th scope="col">Colour</th>
        <th scope="col">Hex</th>
        <th scope="col">OKLCH</th>
        <th scope="col">HSL</th>
        <th scope="col">RGB</th>
        <th scope="col">On other palette colours</th>
        <th scope="col">On black</th>
        <th scope="col">On white</th>
      </tr>
    </thead>
    <tbody>
      {#each colors as c}
        <tr>
          <th scope="row">
            <span class="swatch" style:background={c.hex}></span>
            <span class="name">{c.name}</span>
            {#if c.roles.length}
              <span class="roles">{c.roles.join(', ')}</span>
            {/if}
          </th>
          <td><code>{c.hex}</code></td>
          <td><code>{c.oklch.css}</code></td>
          <td><code>hsl({c.hsl[0]} {c.hsl[1]}% {c.hsl[2]}%)</code></td>
          <td><code>rgb({c.rgb.join(' ')})</code></td>
          <td>
            <ul role="list" class="chips">
              {#each colors.filter((o) => o.name !== c.name) as o}
                {@const p = pairFor(c.name, o.name)}
                <li
                  class="chip"
                  data-pass={p.supports[use]}
                  style:background={o.hex}
                  style:color={c.hex}
                  title="{c.name} on {o.name}: {p.ratio}:1, Lc {p.apca} ({level(p)})"
                >
                  {formatMetric(p, metric)}<span class="visually-hidden">: {c.name} on {o.name}, {level(p)}</span>
                </li>
              {/each}
            </ul>
          </td>
          {#each [['black', '#000000', c.onBlack], ['white', '#FFFFFF', c.onWhite]] as [name, hex, ref]}
            <td>
              <span
                class="chip"
                data-pass={ref.ratio >= thresholds[use]}
                style:background={hex}
                style:color={c.hex}
                title="{c.name} on {name}: {ref.ratio}:1, Lc {ref.apca}"
              >
                {formatMetric(ref, metric)}<span class="visually-hidden">: {c.name} on {name}</span>
              </span>
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .matrix {
    overflow-x: auto;
    border-block: var(--stroke);
  }

  table {
    border-collapse: collapse;
    width: 100%;
    font-size: var(--size-step-00);
  }

  caption {
    text-align: start;
    padding-block: var(--space-s);
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
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: var(--space-s);
    align-items: center;
    font-weight: var(--font-weight-medium);
  }

  .swatch {
    grid-row: span 2;
    inline-size: 2.5rem;
    block-size: 2.5rem;
    border-radius: var(--radius-s);
    outline: 1px solid color-mix(in srgb, currentColor 30%, transparent);
  }

  .roles {
    font-weight: var(--font-weight-regular);
    opacity: 0.7;
  }

  code {
    background: none;
    padding: 0;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs);
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
