<script>
  import { onMount } from 'svelte';
  import LabButton from '../../shared/LabButton.svelte';
  import { isAvailable } from '../measure.js';

  /** @type {object} typography.json, for bind:typography */
  export let typography;
  /** Your site's Button component, so the tools look like the site. Takes variant (primary, secondary, ghost) and onclick */
  export let button = LabButton;

  const picks = ['candidate', 'primary', 'reserve', 'rejected'];
  let available = {};
  let mounted = false;

  $: inUse = new Set(typography.scale.map((s) => s.face));
  $: if (mounted) check(typography.candidates.map((c) => c.stack).join('|'));

  async function check() {
    const results = await Promise.all(typography.candidates.map((c) => isAvailable(c.stack)));
    available = Object.fromEntries(typography.candidates.map((c, i) => [c.id, results[i]]));
  }

  function kebab(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'face';
  }

  function add() {
    const ids = new Set(typography.candidates.map((c) => c.id));
    let id = 'new-face';
    for (let n = 2; ids.has(id); n++) id = `new-face-${n}`;
    typography.candidates = [
      ...typography.candidates,
      {
        id,
        family: 'New face',
        stack: "'New face', serif",
        role: '',
        pick: 'candidate',
        practical: '',
        running: { verdict: 'untested', notes: '' },
        sizes: { verdict: 'untested', notes: '' }
      }
    ];
  }

  // The id is what scale steps point at, so it's set once, from the first family name
  function rename(candidate) {
    if (!candidate.id.startsWith('new-face') || inUse.has(candidate.id)) return;
    const ids = new Set(typography.candidates.filter((c) => c !== candidate).map((c) => c.id));
    const id = kebab(candidate.family);
    if (!ids.has(id)) candidate.id = id;
    typography = typography;
  }

  function remove(candidate) {
    typography.candidates = typography.candidates.filter((c) => c !== candidate);
  }

  onMount(() => (mounted = true));
</script>

<div class="candidates stack">
  {#each typography.candidates as candidate (candidate)}
    <fieldset class="candidate">
      <legend>
        <span style:font-family={candidate.stack}>{candidate.family}</span>
        <code>{candidate.id}</code>
        {#if available[candidate.id] === false}
          <strong class="candidate__missing">Not installed or loaded: tests will show a fallback</strong>
        {/if}
      </legend>
      <div class="candidate__fields">
        <label>Family <input bind:value={candidate.family} on:change={() => rename(candidate)} /></label>
        <label class="candidate__wide">Stack <input bind:value={candidate.stack} /></label>
        <label>Role <input bind:value={candidate.role} /></label>
        <label>
          Pick
          <select bind:value={candidate.pick}>
            {#each picks as pick}<option>{pick}</option>{/each}
          </select>
        </label>
        <label class="candidate__wide">Licence, files, weights <input bind:value={candidate.practical} /></label>
      </div>
      {#if inUse.has(candidate.id)}
        <p class="candidate__note">Used by the scale, so it can't be removed.</p>
      {:else}
        <svelte:component this={button} variant="ghost" onclick={() => remove(candidate)}>Remove</svelte:component>
      {/if}
    </fieldset>
  {/each}
  <div><svelte:component this={button} variant="secondary" onclick={add}>Add a candidate</svelte:component></div>
</div>

<style>
  legend {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-xs);
    font-size: var(--size-step-1);
  }

  legend code {
    font-size: var(--size-step-00);
  }

  .candidate__missing {
    font-size: var(--size-step-00);
    color: var(--heading);
  }

  .candidate__fields {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
    gap: var(--space-s);
    margin-block-end: var(--space-s);
  }

  .candidate__wide {
    grid-column: span 2;
  }

  @media (max-width: 30em) {
    .candidate__wide {
      grid-column: auto;
    }
  }

  .candidate__note {
    font-size: var(--size-step-00);
    opacity: 0.75;
  }
</style>
