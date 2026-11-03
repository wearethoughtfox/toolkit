<script>
  import { onMount, tick } from 'svelte';
  import { lineStats } from '../measure.js';

  /** @type {string} The running text */
  export let text;
  /** @type {number} Box width in px */
  export let width;
  /** @type {string} Font stack */
  export let font;
  /** @type {number} Font size in px */
  export let size;
  /** @type {number} Line-height in px */
  export let leading;
  /** @type {number} */
  export let weight = 400;
  /** Line stats from lineStats(), for bind:stats */
  export let stats = null;
  /** @type {Record<number, 'same'|'differ'>} Marks line-starting words (line-break test) */
  export let marks = {};
  /** @type {boolean} Blur the block to compare its colour */
  export let squint = false;

  let el;

  $: words = text.trim().split(/\s+/);
  $: if (el) measure(words, width, font, size, leading, weight);

  async function measure() {
    await tick();
    if (el) stats = lineStats(el);
  }

  // Web fonts can arrive after the first measure
  onMount(() => {
    const again = () => measure();
    document.fonts.ready.then(again);
    document.fonts.addEventListener('loadingdone', again);
    return () => document.fonts.removeEventListener('loadingdone', again);
  });
</script>

<div
  class="measured type-sample"
  class:squint
  bind:this={el}
  style:width="{width}px"
  style:font-family={font}
  style:font-size="{size}px"
  style:line-height="{leading}px"
  style:font-weight={weight}
>
  {#each words as word, i}<span data-word={i} data-mark={marks[i]}>{word}</span>{' '}{/each}
</div>

<style>
  .measured {
    position: relative;
    max-width: none;
    outline: 1px dashed color-mix(in oklab, currentColor 35%, transparent);
    outline-offset: var(--space-2xs);
  }

  .squint {
    filter: blur(2.5px);
  }

  [data-mark='same'] {
    box-shadow: inset 0 -0.15em var(--primary);
  }

  [data-mark='differ'] {
    box-shadow: inset 0 -0.15em color-mix(in oklab, currentColor 40%, transparent);
  }
</style>
