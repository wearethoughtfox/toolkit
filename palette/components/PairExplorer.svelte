<script>
  import { onMount } from 'svelte';
  import LabButton from '../../shared/LabButton.svelte';
  import { uses } from '../levels.js';

  /** @type {Array} Every ordered pair from contrast.generated.json */
  export let pairs;
  /** @type {Array} The palette colours */
  export let colors;
  /** @type {string} Which `supports` key a pair must pass */
  export let use = 'body';
  /** Your site's Button component, so the tools look like the site. Takes variant (primary, secondary, ghost) and onclick */
  export let button = LabButton;

  // '' means any colour
  let fgChoice = '';
  let bgChoice = '';
  let current = null;
  let status = '';

  const hexOf = Object.fromEntries(colors.map((c) => [c.name, c.hex]));

  $: pool = pairs.filter(
    (p) => p.supports[use] && (!fgChoice || p.fg === fgChoice) && (!bgChoice || p.bg === bgChoice)
  );

  // Keep the current pair while it still fits the filters
  $: if (!current || !pool.includes(current)) current = pool[0] ?? null;

  $: useLabel = uses.find((u) => u.value === use)?.label.toLowerCase();

  function shuffle() {
    const others = pool.filter((p) => p !== current);
    if (!others.length) return;
    current = others[Math.floor(Math.random() * others.length)];
    status = '';
  }

  // WCAG is symmetric, so the swapped pair passes for the same uses
  function swap() {
    [fgChoice, bgChoice] = [bgChoice, fgChoice];
    current = pairs.find((p) => p.fg === current.bg && p.bg === current.fg);
    status = '';
  }

  async function copy() {
    const { fg, bg, ratio, apca } = current;
    try {
      await navigator.clipboard.writeText(JSON.stringify({ fg, bg, ratio, apca }));
      status = 'Copied to clipboard';
    } catch {
      status = 'Copy failed';
    }
  }

  function onKey(event) {
    if (event.key !== 'ArrowRight') return;
    if (event.target instanceof Element && event.target.closest('input, select, textarea, [contenteditable]')) return;
    shuffle();
  }

  onMount(shuffle);
</script>

<svelte:window on:keydown={onKey} />

<div class="explorer stack">
  <div class="cluster explorer__controls">
    <label>
      Text
      <select bind:value={fgChoice}>
        <option value="">Any</option>
        {#each colors as c}
          <option value={c.name}>{c.name}</option>
        {/each}
      </select>
    </label>
    <label>
      Background
      <select bind:value={bgChoice}>
        <option value="">Any</option>
        {#each colors as c}
          <option value={c.name}>{c.name}</option>
        {/each}
      </select>
    </label>
    <svelte:component this={button} onclick={shuffle} disabled={pool.length < 2}>Shuffle →</svelte:component>
    <svelte:component this={button} variant="secondary" onclick={swap} disabled={!current}>Swap</svelte:component>
    <svelte:component this={button} variant="ghost" onclick={copy} disabled={!current}>Copy JSON</svelte:component>
  </div>

  <p class="explorer__status" aria-live="polite">
    {pool.length} {pool.length === 1 ? 'pair passes' : 'pairs pass'} for {useLabel}.
    {status}
  </p>

  {#if current}
    <div
      class="preview stack"
      data-scheme="preview"
      style:--surface={hexOf[current.bg]}
      style:--text={hexOf[current.fg]}
      style:--heading={hexOf[current.fg]}
      style:--primary={hexOf[current.fg]}
      style:--on-primary={hexOf[current.bg]}
    >
      <p class="preview__label ttu tracked">{current.fg} on {current.bg}</p>
      <h2>Move well. Eat well.</h2>
      <p>
        Body copy in the real type styles, so the pair is judged at the sizes it will be used.
        Here is <a class="preview__link" href="#explore">a link</a> in running text.
      </p>
      <div class="cluster">
        <svelte:component this={button}>Primary</svelte:component>
        <svelte:component this={button} variant="secondary">Secondary</svelte:component>
      </div>
    </div>

    <div class="readout cluster">
      <p class="readout__metric"><span>WCAG 2</span> {current.ratio.toFixed(2)}:1</p>
      <p class="readout__metric"><span>APCA</span> Lc {current.apca}</p>
      <ul role="list" class="cluster">
        {#each uses as u}
          <li class="badge" data-pass={current.supports[u.value]}>
            {current.supports[u.value] ? '✓' : '✗'}
            {u.label} <span class="badge__min">{u.min}</span>
          </li>
        {/each}
      </ul>
    </div>
  {:else}
    <p>
      No pairs in the palette pass for {useLabel} with these choices. Set Text or Background
      back to “Any”, or choose a less strict use.
    </p>
  {/if}
</div>

<style>
  .explorer__controls label {
    display: inline-flex;
    flex-direction: column;
    gap: var(--space-2xs);
    font-size: var(--size-step-00);
  }

  .explorer__controls select {
    font: inherit;
    font-size: var(--size-step-0);
    padding: var(--space-2xs) var(--space-xs);
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }

  .explorer__status {
    font-size: var(--size-step-00);
  }

  .preview {
    padding: var(--space-l);
    border-radius: var(--radius-m);
    border: 1px solid var(--border);
  }

  /* Global heading and link colours aren't on roles yet (task 6),
     so point them at the preview's roles here */
  .preview :global(:is(h1, h2, h3)) {
    color: var(--heading);
  }

  .preview__link {
    color: var(--primary);
    text-underline-offset: 0.2em;
  }

  .preview__label {
    font-size: var(--size-step-00);
  }

  .readout {
    --gutter: var(--space-m);
    font-size: var(--size-step-00);
  }

  .readout__metric {
    font-size: var(--size-step-1);
    font-variant-numeric: tabular-nums;
  }

  .readout__metric span {
    display: block;
    font-size: var(--size-step-00);
    opacity: 0.7;
  }

  .badge {
    padding: var(--space-2xs) var(--space-xs);
    border: 1px solid currentColor;
    border-radius: var(--radius-s);
  }

  .badge[data-pass='false'] {
    opacity: 0.6;
    text-decoration: line-through;
  }

  .badge__min {
    opacity: 0.7;
  }
</style>
