<script>
  import LabButton from '../../shared/LabButton.svelte';

  /** @type {string} Scheme name, as used in data-scheme */
  export let name;
  /** @type {Array} This scheme's results from schemeChecks */
  export let checks;
  /** Your site's Button component, so the tools look like the site. Takes variant (primary, secondary, ghost) and onclick */
  export let button = LabButton;

  $: failing = checks.filter((c) => !c.pass).length;
</script>

<article class="scheme stack" aria-labelledby="scheme-{name}">
  <h3 id="scheme-{name}" class="scheme__name">
    data-scheme="{name}"
    <span class="scheme__summary" data-pass={failing === 0}>
      {failing === 0 ? 'All checks pass' : `${failing} failing`}
    </span>
  </h3>

  <div class="scheme__preview stack" data-scheme={name}>
    <p class="scheme__label ttu tracked">Label text</p>
    <h2>Good food. Good people.</h2>
    <p>
      Body text on this surface, with <a class="scheme__link" href="#schemes">a link</a> in the
      middle of the sentence.
    </p>
    <div class="cluster">
      <svelte:component this={button}>Primary</svelte:component>
      <svelte:component this={button} variant="secondary">Secondary</svelte:component>
    </div>
    <div class="scheme__border">Bordered box, with an <span class="scheme__accent">accent</span></div>
  </div>

  <table class="scheme__checks">
    <caption class="visually-hidden">Contrast checks for {name}</caption>
    <thead>
      <tr>
        <th scope="col"><span class="visually-hidden">Result</span></th>
        <th scope="col">Pair</th>
        <th scope="col">Ratio</th>
        <th scope="col">Needs</th>
      </tr>
    </thead>
    <tbody>
      {#each checks as c}
        <tr data-pass={c.pass}>
          <td>{c.pass ? '✓' : '✗'}<span class="visually-hidden">{c.pass ? 'Pass' : 'Fail'}</span></td>
          <td>
            <span class="b">{c.fg}</span> on {c.bg}
            <span class="scheme__colors">{c.fgColor} on {c.bgColor} · {c.why}</span>
            {#if c.fixes.length}
              <span class="scheme__fixes">
                Smallest fixes:
                {#each c.fixes as f, i}
                  {i ? ' · ' : ''}{f.role}: {f.from} → {f.kind === 'tint' ? `tint ${f.to}` : f.to} ({f.ratio.toFixed(2)})
                {/each}
              </span>
            {/if}
          </td>
          <td>{c.ratio.toFixed(2)}</td>
          <td>{c.min}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</article>

<style>
  .scheme__name {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-xs);
    text-transform: none;
    letter-spacing: 0;
    font-family: var(--font-mono);
  }

  .scheme__summary {
    font-family: var(--font-base);
    font-weight: var(--font-weight-regular);
  }

  .scheme__summary[data-pass='false'] {
    text-decoration: underline wavy;
    text-underline-offset: 0.25em;
  }

  .scheme__preview {
    padding: var(--space-m);
    border-radius: var(--radius-m);
    outline: 1px solid color-mix(in srgb, currentColor 20%, transparent);
  }

  /* Global heading colours aren't on roles yet (task 6),
     so point them at the scheme's heading role here */
  .scheme__preview :global(h2) {
    color: var(--heading);
    font-size: var(--size-step-5);
  }

  .scheme__label {
    font-size: var(--size-step-00);
  }

  .scheme__link {
    color: var(--primary);
    text-underline-offset: 0.2em;
  }

  .scheme__border {
    padding: var(--space-s);
    border: 2px solid var(--border);
    border-radius: var(--radius-s);
    font-size: var(--size-step-00);
  }

  .scheme__accent {
    border-block-end: 3px solid var(--accent);
  }

  .scheme__checks {
    border-collapse: collapse;
    width: 100%;
    font-size: var(--size-step-00);
  }

  .scheme__checks th,
  .scheme__checks td {
    text-align: start;
    vertical-align: top;
    padding: var(--space-2xs) var(--space-xs);
    border-block-end: var(--stroke);
  }

  .scheme__checks td:nth-child(3),
  .scheme__checks td:nth-child(4) {
    font-variant-numeric: tabular-nums;
  }

  .scheme__checks tr[data-pass='false'] td:first-child {
    font-weight: var(--font-weight-bold);
  }

  .scheme__colors,
  .scheme__fixes {
    display: block;
    opacity: 0.75;
  }

  .scheme__fixes {
    opacity: 1;
    margin-block-start: var(--space-2xs);
  }
</style>
