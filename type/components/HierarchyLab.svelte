<script>
  /** @type {object} typography.json, for bind:typography */
  export let typography;

  // Chimero's order: the cheapest, quietest tools first
  const tools = [
    { id: 'spacing', label: 'Spacing', does: 'sets the meta apart and puts room before the intro' },
    { id: 'weight', label: 'Weight', does: 'makes the title bold' },
    { id: 'colour', label: 'Colour', does: 'heading colour on the title, muted meta' },
    { id: 'size', label: 'Size', does: 'title at the largest step, meta at the smallest' },
    { id: 'face', label: 'Typeface or style switch', does: "title in the largest step's face" },
    { id: 'accent', label: 'Accent', does: 'a short rule above the header' }
  ];

  let setting = 'small';

  $: typography.hierarchy['post-header'] ??= { tools: [], metaFirst: false, notes: '' };
  $: recipe = typography.hierarchy['post-header'];
  $: on = new Set(recipe.tools);

  $: body = typography.scale.find((s) => s.name === 'body') ?? typography.scale[0];
  $: bySize = [...typography.scale].sort((a, b) => a[setting].size - b[setting].size);
  $: largest = bySize.at(-1);
  $: smallest = bySize[0];
  $: stackOf = (step) => typography.candidates.find((c) => c.id === step.face)?.stack ?? 'inherit';

  $: skipped = on.has('size') ? ['spacing', 'weight', 'colour'].filter((id) => !on.has(id)) : [];
  $: intro = typography.sample.text.split(/(?<=[.!?])\s+/)[0];

  // Keep the saved list in the method's order, whatever order they were ticked in
  function toggle(id) {
    const next = new Set(on);
    next.has(id) ? next.delete(id) : next.add(id);
    recipe.tools = tools.map((t) => t.id).filter((t) => next.has(t));
    typography = typography;
  }
</script>

<div class="hierarchy">
  <div class="stack hierarchy__tools">
    <fieldset>
      <legend>Add one tool at a time</legend>
      <ol role="list" class="stack">
        {#each tools as tool, i}
          <li>
            <label>
              <input type="checkbox" checked={on.has(tool.id)} on:change={() => toggle(tool.id)} />
              <span><strong>{i + 1}. {tool.label}</strong>: {tool.does}</span>
            </label>
          </li>
        {/each}
      </ol>
    </fieldset>
    <label><input type="checkbox" bind:checked={recipe.metaFirst} /> Meta above the title</label>
    <label>
      Setting
      <select bind:value={setting}>
        <option value="small">Small</option>
        <option value="large">Large</option>
      </select>
    </label>
    {#if skipped.length}
      <p class="hierarchy__warn" role="status">
        Size is on without {skipped.join(' and ')}. Size is the loudest tool; see whether the quieter ones were enough first.
      </p>
    {/if}
    <label>
      Notes
      <textarea rows="3" bind:value={recipe.notes}></textarea>
    </label>
  </div>

  <header
    class="post type-sample"
    class:spacing={on.has('spacing')}
    class:weight={on.has('weight')}
    class:colour={on.has('colour')}
    class:size={on.has('size')}
    class:face={on.has('face')}
    class:accent={on.has('accent')}
    class:meta-first={recipe.metaFirst}
    style:--body-font={stackOf(body)}
    style:--body-size="{body[setting].size}px"
    style:--body-leading="{body[setting].leading}px"
    style:--title-font={stackOf(largest)}
    style:--title-size="{largest[setting].size}px"
    style:--title-leading="{largest[setting].leading}px"
    style:--meta-size="{smallest[setting].size}px"
    style:--meta-leading="{smallest[setting].leading}px"
    style:max-width="{typography.maxWidth}px"
  >
    <p class="post__title">{typography.sample.title}</p>
    <p class="post__meta">{typography.sample.meta}</p>
    <p class="post__intro">{intro}</p>
  </header>
</div>

<style>
  .hierarchy {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(20rem, 100%), 1fr));
    gap: var(--space-xl);
    align-items: start;
  }

  .hierarchy__tools {
    --stack-space: var(--space-s);
    font-size: var(--size-step-00);
  }

  fieldset {
    border: var(--stroke);
    border-radius: var(--radius-s);
    padding: var(--space-s) var(--space-m);
  }

  ol {
    --stack-space: var(--space-xs);
  }

  label {
    display: flex;
    gap: var(--space-xs);
    align-items: baseline;
  }

  .hierarchy__warn {
    color: var(--heading);
  }

  /* Flat: every part set as body text, nothing between them */
  .post {
    display: flex;
    flex-direction: column;
    font-family: var(--body-font);
    font-size: var(--body-size);
    line-height: var(--body-leading);
    font-weight: 400;
  }

  .post > * {
    margin: 0;
  }

  .meta-first .post__meta {
    order: -1;
  }

  .spacing .post__meta {
    margin-block: var(--space-2xs);
  }

  .spacing .post__intro {
    margin-block-start: var(--space-m);
  }

  .weight .post__title {
    font-weight: 700;
  }

  .colour .post__title {
    color: var(--heading);
  }

  .colour .post__meta {
    color: color-mix(in oklab, currentColor 70%, transparent);
  }

  .size .post__title {
    font-size: var(--title-size);
    line-height: var(--title-leading);
  }

  .size .post__meta {
    font-size: var(--meta-size);
    line-height: var(--meta-leading);
  }

  .face .post__title {
    font-family: var(--title-font);
  }

  .accent::before {
    content: '';
    inline-size: 3rem;
    border-block-start: 2px solid var(--primary);
    margin-block-end: var(--space-s);
    order: -2;
  }
</style>
