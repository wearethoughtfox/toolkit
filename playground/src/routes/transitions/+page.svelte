<script>
  import Region from '@thoughtfox/toolkit/layout/components/Region.svelte';
  import Wrapper from '@thoughtfox/toolkit/layout/components/Wrapper.svelte';
  import Stack from '@thoughtfox/toolkit/layout/components/Stack.svelte';
  import Button from '$lib/components/blocks/Button.svelte';
  import { transitions, bySlug, preview } from '$lib/transitions/preview.svelte.js';
  import { previewPages } from '$lib/transitions/pages.js';

  const count = (test) => transitions.filter(test).length;
  const filters = [
    { value: 'all', label: 'All', test: () => true },
    { value: 'shortlist', label: 'Shortlist', test: (t) => t.shortlist },
    { value: 'keep', label: 'Keep', test: (t) => t.verdict === 'keep' },
    { value: 'tone down', label: 'Tone down', test: (t) => t.verdict === 'tone down' },
    { value: 'drop', label: 'Drop', test: (t) => t.verdict === 'drop' }
  ].map((f) => ({ ...f, count: count(f.test) }));

  let filter = $state('all');
  const shown = $derived(transitions.filter(filters.find((f) => f.value === filter).test));

  const picked = $derived(bySlug[preview.slug]);
  const elsewhere = previewPages.filter((p) => p.href !== '/transitions');

  // For "Use it on a site": the picked transition, or the first on the shortlist
  const example = $derived(picked ?? transitions.find((t) => t.shortlist));
  const path = (t) => t.css.replace('css/transitions/', '');
  const file = (t) => path(t).split('/').pop();
  const maskName = (t) => t.masks?.split('/').pop().replace('.svelte', '');

  const facts = (t) =>
    [
      t.family,
      t.override ? `${t.durationMs}ms, ${t.override.durationMs}ms toned down` : `${t.durationMs}ms`,
      t.backwards ? 'reverse on Back' : 'no reverse on Back',
      t.masks && 'needs SVG masks'
    ]
      .filter(Boolean)
      .join(' · ');
</script>

<svelte:head>
  <title>Transitions</title>
</svelte:head>

<Region>
  <Wrapper>
    <Stack space="var(--space-xl)">
      <Stack space="var(--space-s)">
        <h1>Transitions</h1>
        <p class="measure">
          The 46 Segue view transitions in <code>motion/transitions/</code>, with the verdict for
          each from <code>transitions.json</code>. Pick one, then go to another page: the
          playground runs it the way a site does, with <code>onNavigate</code>. The browser's Back
          plays the reverse, where there is one. Every file has its own reduced-motion version: a
          180ms crossfade with no movement. This page only exists in development.
        </p>
      </Stack>

      <div class="sidebar transitions" data-reversed>
        <section class="transitions__panel" aria-labelledby="preview-heading">
          <Stack space="var(--space-s)">
            <h2 id="preview-heading">Preview</h2>
            {#if picked}
              <Stack space="var(--space-xs)">
                <p class="transitions__name">
                  <span class="b">{picked.name}</span>
                  <span class="verdict" data-verdict={picked.verdict}>{picked.verdict}</span>
                </p>
                <p>{picked.why}</p>
              </Stack>

              <fieldset>
                <legend>Motion</legend>
                <div class="cluster">
                  <label><input type="radio" bind:group={preview.motion} value="system" /> Follow the system</label>
                  <label><input type="radio" bind:group={preview.motion} value="reduce" /> Reduced</label>
                  <label><input type="radio" bind:group={preview.motion} value="full" /> Full</label>
                </div>
                <p class="transitions__hint">
                  Reduced and Full switch the file's own media queries, for this preview only.
                </p>
              </fieldset>

              {#if picked.override}
                <fieldset>
                  <legend>Version</legend>
                  <div class="cluster">
                    <label><input type="radio" bind:group={preview.toned} value={true} /> Toned down ({picked.override.durationMs}ms)</label>
                    <label><input type="radio" bind:group={preview.toned} value={false} /> As shipped ({picked.durationMs}ms)</label>
                  </div>
                </fieldset>
              {/if}

              <Stack space="var(--space-2xs)">
                <p class="b">Now go to</p>
                <div class="cluster">
                  {#each elsewhere as page}
                    <Button href={page.href} variant="secondary">{page.label}</Button>
                  {/each}
                </div>
              </Stack>

              <dl class="transitions__facts">
                <dt>Timing</dt>
                <dd>{picked.timing}</dd>
                <dt>Easing</dt>
                <dd>{picked.easingNote}</dd>
                <dt>Back</dt>
                <dd>{picked.backwards ? 'Plays in reverse.' : 'Replays the forward move.'}</dd>
                <dt>Reduced motion</dt>
                <dd>{picked.reducedMotion}</dd>
              </dl>

              {#if picked.override}
                <Stack space="var(--space-2xs)">
                  <p class="b">Override</p>
                  <pre><code>{picked.override.css}</code></pre>
                  <p class="transitions__hint">{picked.override.note}</p>
                </Stack>
              {/if}
              <p><a href="#use">Use it on a site</a></p>
              <div>
                <Button variant="ghost" onclick={() => (preview.slug = null)}>Stop previewing</Button>
              </div>
            {:else}
              <p>
                Nothing picked, so navigation is plain. Choose <span class="b">Preview</span> on a
                transition.
              </p>
            {/if}
          </Stack>
        </section>

        <section aria-labelledby="list-heading">
          <Stack space="var(--space-m)">
            <h2 id="list-heading" class="visually-hidden">All transitions</h2>
            <fieldset>
              <legend>Show</legend>
              <div class="cluster">
                {#each filters as f}
                  <label>
                    <input type="radio" bind:group={filter} value={f.value} />
                    {f.label} <span class="transitions__count">{f.count}</span>
                  </label>
                {/each}
              </div>
            </fieldset>

            {#if shown.length === 0}
              <p class="measure">
                None. Every transition is 800ms or longer as shipped, so each one worth using needs
                its override first. Those are under Tone down.
              </p>
            {:else}
              <ul role="list" class="transitions__list">
                {#each shown as t (t.slug)}
                  <li class="transitions__item" data-picked={t.slug === preview.slug}>
                    <Stack space="var(--space-2xs)">
                      <div class="repel">
                        <h3>{t.name}</h3>
                        <span class="verdict" data-verdict={t.verdict}>{t.verdict}</span>
                      </div>
                      <p class="transitions__hint">{facts(t)}{t.shortlist ? ' · shortlist' : ''}</p>
                      <p>{t.why}</p>
                      <div>
                        <Button
                          variant={t.slug === preview.slug ? 'primary' : 'secondary'}
                          aria-pressed={t.slug === preview.slug}
                          onclick={() => (preview.slug = t.slug)}
                        >
                          Preview <span class="visually-hidden">{t.name}</span>
                        </Button>
                      </div>
                    </Stack>
                  </li>
                {/each}
              </ul>
            {/if}
          </Stack>
        </section>
      </div>

      <section id="use" aria-labelledby="use-heading">
        <Stack space="var(--space-s)">
          <h2 id="use-heading">Use it on a site</h2>
          <p class="measure">
            For {example.name}{picked ? '' : ' (pick another to change these steps)'}. One
            transition per site. Never edit the file: override its custom properties instead, so
            the file can be swapped for a newer one.
          </p>
          <ol class="stack measure">
            <li>
              <p>
                Copy <code>motion/transitions/{path(example)}</code> from this repo into the site,
                as <code>src/lib/css/transitions/{file(example)}</code>. Keep the credit line at the
                top. Or skip the copy and import it from the pinned package in step 2:
              </p>
              <pre><code>{`@import '@thoughtfox/toolkit/motion/transitions/${path(example)}';`}</code></pre>
            </li>
            <li>
              <p>Import it in the site's <code>app.css</code>, and put the override after every <code>@import</code>:</p>
              <pre><code>{`@import './lib/css/transitions/${file(example)}';

${example.override?.css ?? `/* ${example.verdict}: no override. Set its colours if you use it anyway: */\n:root {\n  --segue-lead-color: var(--surface);\n}`}`}</code></pre>
            </li>
            <li>
              <p>Run it on navigation, in the root <code>+layout.svelte</code>:</p>
              <pre><code>{`import { onNavigate } from '$app/navigation';
import { segueTransitions } from '@thoughtfox/toolkit/motion';
onNavigate(segueTransitions());`}</code></pre>
            </li>
            {#if example.masks}
              <li>
                <p>
                  Render its masks once in the same layout:
                  <code>{`<${maskName(example)} />`}</code>, from <code>@thoughtfox/toolkit/motion</code>.
                </p>
              </li>
            {/if}
            <li>
              <p>
                Reduced motion needs nothing more: the file ends with its own 180ms crossfade. Set
                <code>--segue-fade-duration</code> to change the length.
              </p>
            </li>
            <li>
              <p>
                Take a snapshot before and after (<code>tools/site-snapshots</code>), and try it on a
                real phone: the clip-path wipes run on the main thread.
              </p>
            </li>
          </ol>
        </Stack>
      </section>
    </Stack>
  </Wrapper>
</Region>

<style>
  .transitions {
    --sidebar-target-width: 24rem;
    --gutter: var(--space-xl);
    align-items: flex-start;
  }

  .transitions__panel {
    padding: var(--space-m);
    background: var(--surface);
    border: var(--stroke);
    border-radius: var(--radius-m);
  }

  .transitions__panel h2 {
    font-size: var(--size-step-2);
  }

  /* Side by side (24rem panel + 50% list), the panel stays in view while the
     list scrolls. Stacked, it scrolls away with the page. */
  @media (min-width: 52rem) {
    .transitions__panel {
      position: sticky;
      inset-block-start: var(--space-s);
      max-block-size: calc(100dvh - 2 * var(--space-s) - 4rem);
      overflow-y: auto;
    }
  }

  .transitions__list {
    padding: 0;
  }

  .transitions__item {
    padding-block: var(--space-m);
    border-block-start: var(--stroke);
  }

  .transitions__item[data-picked='true'] h3 {
    color: var(--primary);
  }

  .transitions__item h3 {
    font-size: var(--size-step-1);
  }

  .transitions__name {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    align-items: baseline;
  }

  .transitions__hint,
  .transitions__count,
  .transitions__facts {
    font-size: var(--size-step-00);
  }

  .transitions__count {
    opacity: 0.8;
  }

  .transitions__facts dt {
    font-weight: var(--font-bold);
  }

  .transitions__facts dd {
    margin: 0 0 var(--space-xs);
  }

  /* The verdict is in the word; the border only groups them */
  .verdict {
    padding: 0 var(--space-2xs);
    font-size: var(--size-step-00);
    border: 1px solid currentColor;
    border-radius: var(--radius-s);
    white-space: nowrap;
  }

  .verdict[data-verdict='drop'] {
    border-style: dashed;
  }

  fieldset {
    border: var(--stroke);
    padding: var(--space-xs) var(--space-s);
  }

  fieldset .cluster {
    --gutter: var(--space-2xs) var(--space-s);
  }

  label {
    cursor: pointer;
  }

  pre {
    font-size: var(--size-step-00);
    overflow-x: auto;
  }

  /* Long paths in running text break instead of widening the page */
  p code {
    overflow-wrap: anywhere;
  }
</style>
