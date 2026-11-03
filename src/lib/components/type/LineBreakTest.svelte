<script>
  import { onMount } from 'svelte';
  import Button from '$lib/components/blocks/Button.svelte';
  import Measured from './Measured.svelte';
  import { familyOf, xHeightRatio } from '$lib/type/measure.js';

  /** @type {object} typography.json, for bind:typography */
  export let typography;

  let aId = typography.candidates[0]?.id;
  let bId = typography.candidates[1]?.id;
  let width = 320;
  let statsA = null;
  let statsB = null;
  let ratios = {};
  let mounted = false;

  $: body = typography.scale.find((s) => s.name === 'body') ?? typography.scale[0];
  $: a = typography.candidates.find((c) => c.id === aId);
  $: b = typography.candidates.find((c) => c.id === bId);
  $: if (mounted && a && b) measureRatios(a.stack, b.stack);

  async function measureRatios(...stacks) {
    await Promise.all(stacks.map((s) => document.fonts.load(`16px "${familyOf(s)}"`).catch(() => {})));
    ratios = Object.fromEntries(stacks.map((s) => [s, xHeightRatio(s)]));
  }

  // B is resized until its x-height matches A's
  $: sizeA = body.small.size;
  $: sizeB = a && b && ratios[a.stack] && ratios[b.stack]
    ? +((sizeA * ratios[a.stack]) / ratios[b.stack]).toFixed(1)
    : sizeA;

  // Line starts after the first line are the breaks
  $: breaksA = new Set(statsA?.starts.slice(1) ?? []);
  $: breaksB = new Set(statsB?.starts.slice(1) ?? []);
  $: same = [...breaksA].filter((i) => breaksB.has(i));
  $: marksA = mark(breaksA, breaksB);
  $: marksB = mark(breaksB, breaksA);

  function mark(own, other) {
    return Object.fromEntries([...own].map((i) => [i, other.has(i) ? 'same' : 'differ']));
  }

  function record() {
    typography.lineBreakTests = [
      ...typography.lineBreakTests,
      {
        a: a.id,
        b: b.id,
        width,
        sizeA,
        sizeB,
        same: same.length,
        breaks: Math.max(breaksA.size, breaksB.size),
        date: new Date().toISOString().slice(0, 10)
      }
    ];
  }

  function remove(test) {
    typography.lineBreakTests = typography.lineBreakTests.filter((t) => t !== test);
  }

  const name = (id) => typography.candidates.find((c) => c.id === id)?.family ?? id;

  onMount(() => (mounted = true));
</script>

<div class="stack">
  <div class="cluster linebreak__controls">
    <label>
      Face A
      <select bind:value={aId}>
        {#each typography.candidates as c}<option value={c.id}>{c.family}</option>{/each}
      </select>
    </label>
    <label>
      Face B
      <select bind:value={bId}>
        {#each typography.candidates as c}<option value={c.id}>{c.family}</option>{/each}
      </select>
    </label>
    <label>
      Measure
      <input type="number" min="200" max="700" step="10" bind:value={width} /> px
    </label>
  </div>

  {#if a && b}
    <p class="linebreak__result" aria-live="polite">
      <strong>{same.length} of {Math.max(breaksA.size, breaksB.size)}</strong> line breaks fall on the same word.
      {#if statsA && statsB && statsA.lines !== statsB.lines}
        B sets {statsB.lines} lines to A's {statsA.lines}, so the horizontal rhythm differs.
      {/if}
      x-heights matched: {a.family} at {sizeA}px, {b.family} at {sizeB}px.
    </p>

    <div class="linebreak__pair">
      <figure class="stack">
        <figcaption>{a.family}, {sizeA}px</figcaption>
        <Measured text={typography.sample.text} {width} font={a.stack} size={sizeA} leading={body.small.leading} marks={marksA} bind:stats={statsA} />
      </figure>
      <figure class="stack">
        <figcaption>{b.family}, {sizeB}px</figcaption>
        <Measured text={typography.sample.text} {width} font={b.stack} size={sizeB} leading={body.small.leading} marks={marksB} bind:stats={statsB} />
      </figure>
    </div>

    <div><Button variant="secondary" onclick={record}>Record this result</Button></div>
  {/if}

  {#if typography.lineBreakTests.length}
    <table class="linebreak__log">
      <caption class="visually-hidden">Recorded line-break tests</caption>
      <thead>
        <tr><th scope="col">Pair</th><th scope="col">Measure</th><th scope="col">Sizes</th><th scope="col">Same breaks</th><th scope="col">Date</th><th scope="col"><span class="visually-hidden">Remove</span></th></tr>
      </thead>
      <tbody>
        {#each typography.lineBreakTests as test}
          <tr>
            <td>{name(test.a)} / {name(test.b)}</td>
            <td>{test.width}px</td>
            <td>{test.sizeA} / {test.sizeB}px</td>
            <td>{test.same} of {test.breaks}</td>
            <td>{test.date}</td>
            <td><Button variant="ghost" onclick={() => remove(test)}>Remove</Button></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .linebreak__controls {
    --gutter: var(--space-m);
    font-size: var(--size-step-00);
  }

  .linebreak__pair {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xl);
    overflow-x: auto;
    padding: var(--space-2xs);
  }

  figure {
    --stack-space: var(--space-s);
    margin: 0;
  }

  figcaption,
  .linebreak__log {
    font-size: var(--size-step-00);
  }

  .linebreak__log {
    border-collapse: collapse;
  }

  .linebreak__log :is(th, td) {
    padding: var(--space-2xs) var(--space-s) var(--space-2xs) 0;
    text-align: start;
    border-block-end: var(--stroke);
  }
</style>
