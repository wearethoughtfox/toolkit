# @thoughtfox/toolkit

Shared foundations for Thought Fox SvelteKit sites: CUBE CSS compositions and
utilities (Every Layout patterns), Svelte layout primitives, and the fluid
design-token generator. Sites keep their own tokens (colours, type, spacing
values); this package holds everything brand-agnostic.

Used by [robertocarroll.com](https://robertocarroll.com) and Root Pilates & Cafe.

## Install

```sh
npm i -D github:wearethoughtfox/toolkit#v0.1.0
```

Pin a tag. Upgrade sites deliberately by bumping the tag, rebuilding, and
checking the site — never track a branch.

## This repo

Everything shared is worked on here, once. Sites get a change only when
you tag a release and bump that site's pin.

```
(top-level folders)   The package, listed below. Only these are installed
                      (see "files" in package.json)
playground/           The former sveltekit-cube-starter: demo pages, the
                      /palette and /type labs (dev only). cd playground &&
                      npm install && npm run dev
tools/site-snapshots/ Screenshots every page of each site and diffs them
                      against a baseline: run before and after a bump
tools/segue-bank/     The 46 Segue transitions with their demo page
                      (python3 -m http.server, then open demo/)
.claude/skills/       thoughtfox-redesign and thoughtfox-type. They load in
                      any Claude session in this repo, including cloud ones
ROADMAP.md            The order of work
```

To use the skills while working in a site's own repo, link them into your
user skills, from this folder:

```bash
ln -s "$PWD/.claude/skills/thoughtfox-redesign" ~/.claude/skills/thoughtfox-redesign && ln -s "$PWD/.claude/skills/thoughtfox-type" ~/.claude/skills/thoughtfox-type
```

The playground still has its own copies of the compositions, utilities and
token script. Making it use the package, and moving the palette and type
tools into the package, is roadmap step 5.

## What's inside

```
css/reset.css               Modern reset (piccalil.li)
css/compositions/*.css      stack, cluster, sidebar, grid, switcher, cover,
                            center, reel, frame, wrapper, repel, scene
css/utilities/*.css         region, text, visually-hidden, reveal
css/transitions/*/*.css     46 Segue page transitions (list: transitions.json)
components/layout/*.svelte  Prop-based wrappers for each composition
components/SkipLink.svelte  Accessible skip link (pair with #main-content)
components/ScrollScene.svelte  Scroll-scrubbed sticky scene wrapper
components/transitions/*    SVG masks for the four transitions that need them
transitions/segue.js        segueTransitions() for onNavigate, segue() helper
actions/reveal.js           IntersectionObserver scroll-reveal action
actions/scroll-scene.js     scrollScene action + lerp/phase/ease helpers
stores/motion.js            prefers-reduced-motion readable store
scripts/generate-tokens.js  Design-token JSON → CSS custom properties
```

## Usage

### CSS (in the site's `app.css`)

```css
@import '@thoughtfox/toolkit/css/reset.css';
@import '@thoughtfox/toolkit/css/compositions/stack.css';
@import '@thoughtfox/toolkit/css/utilities/region.css';
/* site-local: fonts, variables, global-styles, _tokens.generated.css */
```

### Components

```svelte
<script>
  import { Stack, Sidebar } from '@thoughtfox/toolkit';
  // or directly:
  import Stack from '@thoughtfox/toolkit/components/layout/Stack.svelte';
</script>

<Stack space="var(--space-l)">…</Stack>
```

Every prop maps to a CSS custom property; the classes work without the
components too (`<div class="stack">`).

### Scroll scenes

Scroll-scrubbed sticky sections (hero scalers, image cascades, card flips —
any movement driven by scroll progress). Import the composition CSS, then
either the `ScrollScene` component or the raw action:

```css
@import '@thoughtfox/toolkit/css/compositions/scene.css';
```

```svelte
<script>
  import { ScrollScene, lerp, phase, ease } from '@thoughtfox/toolkit';

  let image;
  function drive(p) {
    image.style.width = `${lerp(100, 70, ease.outCubic(p))}%`;
    image.style.borderRadius = `${lerp(0, 16, ease.outCubic(p))}px`;
  }
</script>

<ScrollScene length="200vh" onprogress={drive}>
  {#snippet children()}
    <div class="my-hero" bind:this={image}>…</div>
  {/snippet}
</ScrollScene>
```

Or attach `use:scrollScene` to your own `.scene` runway. Every update also
sets `--scene-progress` (0–1) on the runway for pure-CSS consumption —
always give it a fallback of 1 (`var(--scene-progress, 1)`) so no-JS shows
the finished state. Under `prefers-reduced-motion` the runway collapses and
progress pins at 1, so build markup whose resting state is the readable end
state. `phase(p, start, end)` remaps scene progress into sub-ranges so one
scene drives several overlapping movements. Worked examples of the five
effect recipes live in the animation-experiments repo
(`toolkit-animations/demo.html`).

### Page transitions

46 view transitions from [Segue](https://jhey.dev/prototypes/2026/segue/)
(slides, stripes, circles, cells, sprites, card flips…), one self-contained
CSS file each. Pick one per site and import it in `app.css`:

```css
@import '@thoughtfox/toolkit/css/transitions/circles/circle-pop.css';
```

Then wrap navigations in the root `+layout.svelte`:

```svelte
<script>
  import { onNavigate } from '$app/navigation';
  import { segueTransitions } from '@thoughtfox/toolkit';
  onNavigate(segueTransitions());
</script>
```

Going back plays the reverse (38 of the 46 have one; `backwards` in
`css/transitions/transitions.json`), and pointer-origin transitions grow from
the click. For same-page changes, `segue(() => update(), { back })`.

Paint Over, Dots Radial, Dots Sweep and Grid Squares also need their masks
rendered once in the layout: `<DotsRadialMasks />` and so on.

Give the transition the site's colours by overriding its custom properties
after the import. Don't edit the file. The `:root` block at the top of each
file lists what it exposes:

```css
:root {
  --segue-lead-color: var(--color-primary);
  --segue-trail-color: var(--color-dark);
  --segue-duration: 0.6s;
}
```

Reduced-motion users get the default crossfade, and browsers without view
transitions navigate normally. To try them all, use the demo in
`CSS-course-picalli/segue-transitions/demo/`.

### Design tokens

Sites keep token JSON in `src/lib/design-tokens/` and generate
`src/lib/css/global/_tokens.generated.css`:

```sh
npm run tokens
# each site defines: "tokens": "node node_modules/@thoughtfox/toolkit/scripts/generate-tokens.js"
```

Regenerate automatically on dev/build in `vite.config.js`:

```js
import { generateTokens } from '@thoughtfox/toolkit/scripts/generate-tokens.js';

plugins: [
  sveltekit(),
  { name: 'tokens', buildStart: () => generateTokens() }
]
```

## Conventions

- Compositions are plain classes configured by custom properties; exceptions
  use data attributes (`.grid[data-layout='50-50']`).
- `--gutter` is the shared spacing hook across cluster/grid/switcher/wrapper.
- Blocks (buttons, cards, navs) stay in each site — they carry the brand.
- Rule of two: nothing enters this package until at least two sites need it.

## Releasing a change

1. Make the change here.
2. Build every consuming site against it locally (`file:` link or bump).
3. Tag: `git tag v0.x.y && git push --tags`.
4. Bump the tag in each site's `package.json` as you're ready.

## Credits

Layout patterns follow [Every Layout](https://every-layout.dev) (Heydon
Pickering & Andy Bell) and the CUBE CSS conventions from
[Piccalilli](https://piccalil.li) / [Set Studio](https://set.studio) —
see [buildexcellentwebsit.es](https://buildexcellentwebsit.es). The reset and
visually-hidden utility are from Piccalilli articles (linked in each file).
The page transitions are generated with [Segue](https://jhey.dev/prototypes/2026/segue/)
by Jhey Tompkins (credited in each file). Segue states no licence, so ask
him before republishing them outside Thought Fox sites.
