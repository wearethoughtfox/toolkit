<script>
  import Region from '@thoughtfox/toolkit/layout/components/Region.svelte';
  import Wrapper from '@thoughtfox/toolkit/layout/components/Wrapper.svelte';
  import Stack from '@thoughtfox/toolkit/layout/components/Stack.svelte';
  import Button from '$lib/components/blocks/Button.svelte';
  import CandidateList from '@thoughtfox/toolkit/type/components/CandidateList.svelte';
  import RunningText from '@thoughtfox/toolkit/type/components/RunningText.svelte';
  import LineBreakTest from '@thoughtfox/toolkit/type/components/LineBreakTest.svelte';
  import BodyBoxes from '@thoughtfox/toolkit/type/components/BodyBoxes.svelte';
  import BreakpointFinder from '@thoughtfox/toolkit/type/components/BreakpointFinder.svelte';
  import ScaleEditor from '@thoughtfox/toolkit/type/components/ScaleEditor.svelte';
  import HierarchyLab from '@thoughtfox/toolkit/type/components/HierarchyLab.svelte';
  import { typographyCss } from '@thoughtfox/toolkit/type/css.js';
  import { typographyErrors } from '@thoughtfox/toolkit/type/checks.js';

  export let data;

  let typography = structuredClone(data.typography);
  let saved = JSON.stringify(data.typography);
  let status = '';
  let saving = false;

  $: current = JSON.stringify(typography);
  $: unsaved = current !== saved;
  $: invalid = typographyErrors(typography).length > 0;
  $: css = invalid ? '' : typographyCss(typography, data.viewports);

  async function save() {
    saving = true;
    try {
      const response = await fetch('/type/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: current
      });
      const result = await response.json();
      if (!response.ok) {
        status = `Not saved: ${result.errors?.join('; ') ?? response.statusText}`;
      } else {
        saved = current;
        const n = result.warnings.length;
        status = `Saved, and _type.generated.css rebuilt${n ? `, with ${n} warning${n === 1 ? '' : 's'}` : ''}.`;
      }
    } catch (e) {
      status = `Not saved: ${e.message}`;
    } finally {
      saving = false;
    }
  }

  function revert() {
    typography = JSON.parse(saved);
    status = 'Back to the last save.';
  }

  function onKey(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      if (unsaved && !invalid) save();
    }
  }

  const sections = [
    ['sample', 'Sample'],
    ['candidates', 'Candidates'],
    ['running', 'Running text'],
    ['line-breaks', 'Line breaks'],
    ['body', 'Body size'],
    ['breakpoint', 'Breakpoint'],
    ['scale', 'Scale'],
    ['hierarchy', 'Hierarchy'],
    ['output', 'Output']
  ];
</script>

<svelte:window on:keydown={onKey} />

<svelte:head>
  <title>Type</title>
</svelte:head>

<div class="type-lab">
  <Region>
    <Wrapper>
      <Stack space="var(--space-xl)">
        <Stack space="var(--space-s)">
          <h1>Type</h1>
          <p>
            Frank Chimero’s tests for choosing and setting type, as tools. The order follows the
            <code>thoughtfox-type</code> skill: candidates in running text, the line-break test, body size
            from the box, the breakpoint, the scale, then hierarchy. Everything saves to
            <code>typography.json</code>, which <code>npm run tokens</code> turns into
            <code>--type-*</code> custom properties. Nothing else in the site uses them until you choose to.
            This page only exists in development.
          </p>
          <nav aria-label="Type lab sections">
            <ul role="list" class="cluster type-lab__toc">
              {#each sections as [id, label]}<li><a href="#{id}">{label}</a></li>{/each}
            </ul>
          </nav>
        </Stack>

        <div class="type-lab__bar cluster" data-unsaved={unsaved}>
          <Button onclick={save} disabled={!unsaved || invalid || saving}>{saving ? 'Saving…' : 'Save'}</Button>
          <Button variant="ghost" onclick={revert} disabled={!unsaved}>Revert</Button>
          <p aria-live="polite">
            {#if invalid}Fix the scale errors before saving.{:else if unsaved}Unsaved changes (⌘S to save).{:else}{status || 'Everything is saved.'}{/if}
          </p>
        </div>

        <section class="stack" id="sample" aria-labelledby="sample-h">
          <h2 id="sample-h">Sample</h2>
          <p>Use the client’s own copy: real sentences, real word lengths, their names and numbers, and the longest real title. Every test below sets this text.</p>
          <div class="type-lab__fields">
            <label>Title <input bind:value={typography.sample.title} /></label>
            <label>Meta <input bind:value={typography.sample.meta} /></label>
            <label class="type-lab__full">Running text <textarea rows="6" bind:value={typography.sample.text}></textarea></label>
          </div>
        </section>

        <section class="stack" id="candidates" aria-labelledby="candidates-h">
          <h2 id="candidates-h">Candidates</h2>
          <p>Two to four per role, with the client’s existing fonts first. A face that isn’t installed or loaded is flagged, because the tests would otherwise judge its fallback.</p>
          <CandidateList bind:typography button={Button} />
        </section>

        <section class="stack" id="running" aria-labelledby="running-h">
          <h2 id="running-h">Running text</h2>
          <p>Judge faces in paragraphs, never alphabets. Text cuts often look chunky at medium sizes, so check those before planning serif headlines.</p>
          <RunningText bind:typography />
        </section>

        <section class="stack" id="line-breaks" aria-labelledby="line-breaks-h">
          <h2 id="line-breaks-h">Line breaks</h2>
          <p>For two faces that will both set running text. B is resized until the x-heights match. If most line breaks fall on the same word, their horizontal rhythm matches and they’ll sit well together. Underlined words start a line: solid where both faces break there, faint where only one does.</p>
          <LineBreakTest bind:typography button={Button} />
        </section>

        <section class="stack" id="body" aria-labelledby="body-h">
          <h2 id="body-h">Body size</h2>
          <p>Set it from the box, not the screen: 5–6 words per line in a 320px box, 10–14 in a 700px box. The large setting is usually 1–2px bigger, with leading about 5–10% looser. Squint: both blocks should be about the same grey.</p>
          <BodyBoxes bind:typography />
        </section>

        <section class="stack" id="breakpoint" aria-labelledby="breakpoint-h">
          <h2 id="breakpoint-h">Breakpoint</h2>
          <p>Drag to the column width where both settings feel slightly wrong: the small one a touch stretched, the large one a touch cramped. Switch there. Chimero’s was 600px. Word counts can’t find this point for you, because his two targets scale in proportion with the width; the counts are there to judge against.</p>
          <BreakpointFinder bind:typography button={Button} />
        </section>

        <section class="stack" id="scale" aria-labelledby="scale-h">
          <h2 id="scale-h">Scale</h2>
          <p>Six or seven sizes, line-heights on 4px, never three consecutive small sizes. The “At” columns show what a reader actually gets at the narrowest, a 700px and the widest viewport. Values off the 4px rhythm are highlighted. Line heights are saved as ratios (line height ÷ size), so they follow any element that changes its font size.</p>
          <ScaleEditor bind:typography viewports={data.viewports} button={Button} />
        </section>

        <section class="stack" id="hierarchy" aria-labelledby="hierarchy-h">
          <h2 id="hierarchy-h">Hierarchy</h2>
          <p>Start flat and add one tool at a time, in order, stopping when the header reads. The ticked tools save as this post header’s recipe.</p>
          <HierarchyLab bind:typography />
        </section>

        <section class="stack" id="output" aria-labelledby="output-h">
          <h2 id="output-h">Output</h2>
          <p>What <code>_type.generated.css</code> will contain after saving. Use the tokens in blocks, for example <code>font: var(--type-body-weight) var(--type-body-size)/var(--type-body-leading) var(--type-body-font)</code>.</p>
          {#if invalid}
            <p>Fix the scale errors to see the output.</p>
          {:else}
            <pre class="type-lab__css"><code>{css}</code></pre>
          {/if}
        </section>
      </Stack>
    </Wrapper>
  </Region>
</div>

<style>
  .type-lab__toc {
    --gutter: var(--space-xs) var(--space-m);
    font-size: var(--size-step-00);
  }

  /* Scoping adds a class, so the global a:not([class]) colour doesn't reach these */
  .type-lab__toc a {
    color: var(--primary);
    text-underline-offset: 0.2em;
  }

  .type-lab__bar {
    --gutter: var(--space-s);
    position: sticky;
    inset-block-start: 0;
    z-index: 1;
    align-items: center;
    padding-block: var(--space-xs);
    background: var(--surface);
    border-block-end: var(--stroke);
    font-size: var(--size-step-00);
  }

  /* Clear the sticky bar when jumping to a section */
  section {
    scroll-margin-block-start: var(--space-3xl);
  }

  .type-lab__bar[data-unsaved='true'] p {
    color: var(--heading);
  }

  .type-lab__fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr));
    gap: var(--space-s);
    font-size: var(--size-step-00);
  }

  .type-lab__full {
    grid-column: 1 / -1;
  }

  .type-lab__css {
    font-size: var(--size-step-00);
    max-height: 32rem;
    overflow: auto;
  }

  /* Form controls across the lab's panels. :where() keeps these weak, so
     a panel's own widths win. */
  .type-lab :global(:where(label)) {
    cursor: pointer;
  }

  .type-lab :global(:where(input:not([type='checkbox'], [type='radio'], [type='range']), select, textarea)) {
    padding: var(--space-2xs) var(--space-xs);
    font: inherit;
    color: var(--color-ground);
    background: var(--color-clay);
    border: 1px solid var(--border);
    border-radius: var(--radius-s);
  }

  .type-lab :global(:where(input:not([type='checkbox'], [type='radio'], [type='range'], [type='number']), textarea)) {
    display: block;
    inline-size: 100%;
  }

  .type-lab :global(:where(input[type='number'])) {
    inline-size: 7ch;
  }

  .type-lab :global(:where(input, select, textarea)) {
    accent-color: var(--primary);
  }

  /* Specimens show the face as it is, without the site's body settings */
  .type-lab :global(.type-sample),
  .type-lab :global(.type-sample p) {
    max-width: none;
    hyphens: manual;
    text-transform: none;
    letter-spacing: normal;
    font-size-adjust: none;
    font-variation-settings: normal;
    font-feature-settings: normal;
    font-optical-sizing: auto;
    text-wrap: wrap;
  }
</style>
