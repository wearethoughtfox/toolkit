<script>
  import LabButton from '../../shared/LabButton.svelte';
  import { typographyErrors, typographyWarnings } from '../checks.js';
  import { settingAt } from '../css.js';

  /** @type {object} typography.json, for bind:typography */
  export let typography;
  /** @type {object} viewports.json */
  export let viewports;
  /** Your site's Button component, so the tools look like the site. Takes variant (primary, secondary, ghost) and onclick */
  export let button = LabButton;

  let preview = 'small';

  $: errors = typographyErrors(typography);
  $: warnings = errors.length ? [] : typographyWarnings(typography);
  $: stacks = Object.fromEntries(typography.candidates.map((c) => [c.id, c.stack]));
  $: widths = [viewports.min, 700, viewports.max];

  function add() {
    const names = new Set(typography.scale.map((s) => s.name));
    let name = 'step';
    for (let n = 2; names.has(name); n++) name = `step-${n}`;
    typography.scale = [
      ...typography.scale,
      { name, role: '', face: typography.candidates[0]?.id, weight: 400, small: { size: 16, leading: 20 }, large: { size: 16, leading: 20 } }
    ];
  }

  function remove(step) {
    typography.scale = typography.scale.filter((s) => s !== step);
  }

  function sort() {
    typography.scale = [...typography.scale].sort((a, b) => a.small.size - b.small.size);
  }
</script>

<div class="stack">
  <div class="cluster scale__controls">
    <label>
      Mode
      <select bind:value={typography.mode}>
        <option value="stepped">Stepped: switch at the breakpoint</option>
        <option value="fluid">Fluid: grow from {viewports.min}px, stop at the breakpoint</option>
      </select>
    </label>
    <svelte:component this={button} variant="ghost" onclick={sort}>Sort by size</svelte:component>
    <svelte:component this={button} variant="secondary" onclick={add}>Add a step</svelte:component>
  </div>

  <div class="scale__scroll">
    <table class="scale__table">
      <caption class="visually-hidden">Type scale</caption>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Role</th>
          <th scope="col">Face</th>
          <th scope="col">Weight</th>
          <th scope="col">Small size / line</th>
          <th scope="col">Large size / line</th>
          {#each widths as w}<th scope="col" class="scale__at">At {w}px</th>{/each}
          <th scope="col"><span class="visually-hidden">Remove</span></th>
        </tr>
      </thead>
      <tbody>
        {#each typography.scale as step (step)}
          <tr>
            <td><input class="scale__name" bind:value={step.name} aria-label="Name" /></td>
            <td><input bind:value={step.role} aria-label="Role of {step.name}" /></td>
            <td>
              <select bind:value={step.face} aria-label="Face of {step.name}">
                {#each typography.candidates as c}<option value={c.id}>{c.family}</option>{/each}
              </select>
            </td>
            <td><input type="number" min="100" max="900" step="100" bind:value={step.weight} aria-label="Weight of {step.name}" /></td>
            {#each ['small', 'large'] as end}
              <td class="scale__pair">
                <input type="number" min="8" max="200" step="0.5" bind:value={step[end].size} aria-label="{end} size of {step.name}" />
                <input type="number" min="4" max="240" step="4" bind:value={step[end].leading} aria-label="{end} line-height of {step.name}" data-off={step[end].leading % 4 !== 0} />
              </td>
            {/each}
            {#each widths as w}
              {@const at = settingAt(step, w, typography, viewports)}
              <td class="scale__at" data-off={at.leading % 4 !== 0}>{at.size}/{at.leading}</td>
            {/each}
            <td>
              {#if step.name !== 'body'}<svelte:component this={button} variant="ghost" onclick={() => remove(step)}>Remove</svelte:component>{/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if errors.length}
    <div class="scale__messages" role="alert">
      <p><strong>These would stop <code>npm run tokens</code>:</strong></p>
      <ul>{#each errors as e}<li>{e}</li>{/each}</ul>
    </div>
  {:else if warnings.length}
    <div class="scale__messages">
      <p><strong>{warnings.length} departure{warnings.length === 1 ? '' : 's'} from the method.</strong> Nothing is changed for you.</p>
      <ul>{#each warnings as w}<li>{w}</li>{/each}</ul>
    </div>
  {:else}
    <p class="scale__messages">The scale passes every check: line-heights on 4px, sizes clearly apart, body no bigger than 20px.</p>
  {/if}

  <fieldset class="scale__toggle">
    <legend>Preview</legend>
    <label><input type="radio" bind:group={preview} value="small" /> Small setting</label>
    <label><input type="radio" bind:group={preview} value="large" /> Large setting</label>
  </fieldset>

  <div class="scale__preview stack">
    {#each typography.scale as step (step)}
      <div class="scale__row">
        <p class="scale__label">{step.name} · {step[preview].size}/{step[preview].leading}</p>
        <p
          class="type-sample"
          style:font-family={stacks[step.face]}
          style:font-weight={step.weight}
          style:font-size="{step[preview].size}px"
          style:line-height="{step[preview].leading}px"
          style:max-width="{typography.maxWidth}px"
        >
          {step.name === 'body' ? typography.sample.text : typography.sample.title}
        </p>
      </div>
    {/each}
  </div>
</div>

<style>
  .scale__controls {
    --gutter: var(--space-s) var(--space-m);
    align-items: center;
    font-size: var(--size-step-00);
  }

  .scale__scroll {
    overflow-x: auto;
  }

  .scale__table {
    border-collapse: collapse;
    font-size: var(--size-step-00);
  }

  .scale__table :is(th, td) {
    padding: var(--space-2xs) var(--space-xs) var(--space-2xs) 0;
    text-align: start;
    border-block-end: var(--stroke);
    white-space: nowrap;
  }

  .scale__table input {
    width: 9rem;
  }

  .scale__name {
    font-family: var(--font-mono);
  }

  .scale__at {
    font-variant-numeric: tabular-nums;
  }

  [data-off='true'] {
    color: var(--heading);
    font-weight: var(--font-bold);
  }

  .scale__messages {
    font-size: var(--size-step-00);
  }

  .scale__messages ul {
    padding-inline-start: 2ch;
    list-style: disc;
  }

  .scale__toggle {
    border: var(--stroke);
    border-radius: var(--radius-s);
    padding: var(--space-xs) var(--space-s);
    font-size: var(--size-step-00);
    display: flex;
    gap: var(--space-m);
  }

  .scale__preview {
    --stack-space: var(--space-m);
  }

  .scale__row {
    display: grid;
    gap: var(--space-2xs);
  }

  .scale__label {
    font-size: var(--size-step-00);
    opacity: 0.75;
  }
</style>
