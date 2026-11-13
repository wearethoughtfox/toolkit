# @thoughtfox/toolkit

Shared foundations for Thought Fox SvelteKit sites: CUBE CSS compositions and
utilities (Every Layout patterns), Svelte layout primitives, motion, the fluid
design-token generator, and the palette and type tools. Sites keep their own
tokens (colours, type, spacing values); this package holds everything
brand-agnostic.

Used by [robertocarroll.com](https://robertocarroll.com) and Root Pilates & Cafe.

## Install

```sh
npm i -D github:wearethoughtfox/toolkit#v0.2.2
```

Pin a tag. Upgrade sites deliberately by bumping the tag, rebuilding, and
checking the site — never track a branch.

For the 11 November audit assessment and implementation status, see
[the review response](IMPLEMENTATION-2026-11-11.md).

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

The playground installs the package from this folder
(`"@thoughtfox/toolkit": "file:.."`) and imports it the way a site does, so a
change to the package shows in the playground at once. Its own `src/` holds
only what a site would hold: tokens, blocks, pages and the `/palette` and
`/type` routes.

## What's inside

One folder per area. Each has an entry for its Svelte components and
functions (`@thoughtfox/toolkit/layout`, `/motion`, `/palette`, `/type`,
and `/tokens` for Node); CSS and single files are imported by path.

```
tokens/generate-tokens.js     Design-token JSON → CSS custom properties (Node)
tokens/check-vars.js          Finds var(--x) that nothing defines (Node)

layout/reset.css              Modern reset (piccalil.li)
layout/compositions/*.css     stack, cluster, sidebar, grid, switcher, cover,
                              center, reel, frame, wrapper, repel
layout/utilities/*.css        region, visually-hidden
layout/components/*.svelte    Prop-based wrappers for each composition, and
                              SkipLink (pair with #main-content)
layout/focus-heading.js       focusHeading() for afterNavigate: focus the new
                              page's h1 after a client-side navigation

motion/compositions/scene.css Scroll-scene runway
motion/utilities/reveal.css   Scroll reveal (pair with reveal.js)
motion/transitions/*/*.css    46 Segue page transitions (list: transitions.json)
motion/components/*.svelte    ScrollScene, and the SVG masks for the four
                              transitions that need them
motion/segue.js               segueTransitions() for onNavigate, segue() helper
motion/reveal.js              IntersectionObserver scroll-reveal action
motion/scroll-scene.js        scrollScene action + lerp/phase/ease helpers
motion/reduced-motion.js      prefers-reduced-motion readable store

palette/contrast.js           WCAG + APCA contrast data, OKLCH, tonal ramps (Node)
palette/oklch.js, levels.js   Colour maths and labels shared by the tools
palette/components/*.svelte   The /palette tools: PairExplorer, ContrastMatrix,
                              TonalRamps, SchemePreview

type/utilities/text.css       Text utilities, Tachyons names
type/utilities/text-legacy.css  The v0.1.0 text utilities (old names)
type/checks.js, css.js        typography.json checks and --type-* CSS
type/measure.js               Browser-only measuring for the /type lab
type/components/*.svelte      The /type lab: CandidateList, RunningText,
                              LineBreakTest, BodyBoxes, BreakpointFinder,
                              ScaleEditor, HierarchyLab, Measured

shared/LabButton.svelte       The tools' default button (no look of its own)
scripts/generate-tokens.js    The v0.1.0 path of the token generator
```

## Usage

### CSS (in the site's `app.css`)

```css
@import '@thoughtfox/toolkit/layout/reset.css';
@import '@thoughtfox/toolkit/layout/compositions/stack.css';
@import '@thoughtfox/toolkit/layout/utilities/region.css';
@import '@thoughtfox/toolkit/type/utilities/text.css';
/* site-local: fonts, variables, global-styles, _tokens.generated.css */
```

### Components

```svelte
<script>
  import { Stack, Sidebar } from '@thoughtfox/toolkit/layout';
  // or directly:
  import Stack from '@thoughtfox/toolkit/layout/components/Stack.svelte';
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
@import '@thoughtfox/toolkit/motion/compositions/scene.css';
```

```svelte
<script>
  import { ScrollScene, lerp, phase, ease } from '@thoughtfox/toolkit/motion';

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
@import '@thoughtfox/toolkit/motion/transitions/circles/circle-pop.css';
```

Then wrap navigations in the root `+layout.svelte`:

```svelte
<script>
  import { onNavigate } from '$app/navigation';
  import { segueTransitions } from '@thoughtfox/toolkit/motion';
  onNavigate(segueTransitions());
</script>
```

Going back plays the reverse (38 of the 46 have one; `backwards` in
`motion/transitions/transitions.json`), and pointer-origin transitions grow from
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

Reduced-motion users get a 180ms crossfade with no movement: each file ends
with its own `prefers-reduced-motion: reduce` block (set
`--segue-fade-duration` to change it). Browsers without view transitions
navigate normally.

`transitions.json` has each transition's duration, easing and verdict
(keep, tone down or drop) with a reason, and the override for each
tone-down. Nothing is "keep" as shipped: all are 800ms or longer. Start
from the shortlist (`"shortlist": true`) and put its `override.css` after
the import. To try them, run the playground and open `/transitions`: it
previews any one between the playground's pages, with a reduced-motion
toggle. `tools/segue-bank/demo/` has them all on a plain page.

### Design tokens

Sites keep token JSON in `src/lib/design-tokens/` and generate
`src/lib/css/global/_tokens.generated.css`:

```sh
npm run tokens
# each site defines: "tokens": "node node_modules/@thoughtfox/toolkit/tokens/generate-tokens.js"
```

Regenerate automatically on dev/build in `vite.config.js`:

```js
import { generateTokens } from '@thoughtfox/toolkit/tokens/generate-tokens.js';

plugins: [
  sveltekit(),
  { name: 'tokens', buildStart: () => generateTokens() }
]
```

The generator always writes `_tokens.generated.css`. It writes more only
when the token files ask for it, so a site that uses none of these gets
exactly the v0.1.0 output:

| When | It also writes |
|---|---|
| `colors.json` has `colors`, `roles` and `schemes` (not the v0.1.0 `items` list) | the roles and `[data-scheme]` blocks in `_tokens.generated.css`, `src/lib/palette/contrast.generated.json` (with warnings for failing scheme pairs), and the undefined-variable check over `src/` |
| an item in `spacing.json` has a `step` | `src/lib/css/utilities/_spacing.generated.css` (Tachyons `pa1`, `mt-l` …) |
| `src/lib/design-tokens/typography.json` exists (the `/type` lab saves it) | `src/lib/css/global/_type.generated.css` (`--type-*`) |

Each output takes a path to move it, or `false` to turn it off:
`generateTokens({ spacingOutput, typographyOutput, contrastOutput, checkVars })`.
`checkVars` takes the folders to scan (default `'src'`). Run the check alone
with `node node_modules/@thoughtfox/toolkit/tokens/check-vars.js [folder …]`.

#### Named viewport limits

A fluid spacing or text-size token can set `"maxViewport": "mid"` to stop growing
at `viewports.mid` instead of `viewports.max`. The named viewport must exceed
`viewports.min`. Constant-size tokens do not need a viewport range.

`generateTokens({ clampPrecision: 4 })` uses four decimal places for fluid
coefficients, matching Brick House's generator. The default remains two to
preserve existing output. Compare screenshots when changing precision.

### Palette and type tools

The `/palette` and `/type` labs are routes in the playground, built from the
package's components, so a site can have them too. Copy the routes from
`playground/src/routes/palette/` and `playground/src/routes/type/` (each page
is dev only, and `type/save/+server.js` should import `generateTokens` from
`@thoughtfox/toolkit/tokens/generate-tokens.js`). Then pass the site's own
Button so the tools look like the site:

```svelte
<script>
  import { PairExplorer, SchemePreview } from '@thoughtfox/toolkit/palette';
  import Button from '$lib/components/blocks/Button.svelte';
  import data from '$lib/palette/contrast.generated.json';
</script>

<PairExplorer pairs={data.pairs} colors={data.colors} button={Button} />
```

`button` is any component that takes `variant` (`primary`, `secondary`,
`ghost`) and `onclick`. Without it the tools use a plain
`<button class="button" data-variant="…">`. The palette tools need
`colors.json` in the roles format; the contrast script uses `apca-w3`, which
the package installs.

## Conventions

- Compositions are plain classes configured by custom properties; exceptions
  use data attributes (`.grid[data-layout='50-50']`).
- `--gutter` is the shared spacing hook across cluster/grid/switcher/wrapper.
- Package files only use variables every site has, or give a fallback:
  `var(--x, …)`. SkipLink uses the `--primary` / `--on-primary` roles,
  else the system colours; set `--skip-link-bg` and `--skip-link-text` to
  style it.
- Blocks (buttons, cards, navs) stay in each site — they carry the brand.
- Rule of two: nothing enters this package until at least two sites need it.

## v0.3.0

**Transitions.** Each of the 46 files in `motion/transitions/` now ends
with a reduced-motion block: a 180ms crossfade, no movement. With reduced
motion off, nothing changes. `transitions.json` gains `slug`,
`durationMs`, `timing`, `easing`, `reducedMotion`, `verdict`, `why`,
`shortlist` and `override`; the existing fields are unchanged.

**Check after bumping:** with reduced motion on, page changes are a
180ms crossfade instead of the browser's 250ms. Root (Focus Pull at
0.35s) looks the same with reduced motion off.

**New: shared SEO helpers (`@thoughtfox/toolkit/seo`).** The head tags, the
sitemap, robots.txt and llms.txt, which every site had grown its own
near-copy of. The decisions are plain tested functions; `Head.svelte` only
prints what `buildHead()` returns.

```svelte
<script>
  import Head from '@thoughtfox/toolkit/seo/Head.svelte';
  import { site } from '$lib/content/site.js';
  let props = $props();
</script>

<Head {site} trailingSlash="always" twitterCard="summary" {...props} />
```

`site` is `{ url, name, description, ogImage, homeTitle?, locale? }`. Each
site states its own policy as props rather than inheriting one by accident:
title wording (`titles`), slash policy (`trailingSlash`, SvelteKit's own
values), share card size (`twitterCard`) and whether the build may be indexed
at all (`indexable`, for previews and branch deploys).

`site.url` must be an http(s) origin and says so when it isn't.
`absoluteUrl()` refuses other schemes, and `escapeXml()` and `jsonLdScript()`
escape so no title or description can break out of the XML or end the script
element. `sitemapXml()` takes a `lastmod` only where a page has a real date,
so index pages no longer claim to have changed on every build.

**Check after bumping:** compare the head tags, robots.txt and the sitemap
before and after. A site that was stamping today's date on its index pages
will lose those `lastmod` lines, which is the point. Confirm the slash policy
you pass matches the site's `trailingSlash` page option, or its canonicals
will move.

**New: `tokensPlugin()`.** Replaces each site's hand-rolled `buildStart`
hook, and regenerates in dev when a token file changes, appears or
disappears:

```js
import { tokensPlugin } from '@thoughtfox/toolkit/tokens/vite-plugin.js';
export default defineConfig({ plugins: [tokensPlugin(), sveltekit()] });
```

It watches the `.json` files in the token folder and nothing else. Outputs are
excluded explicitly and `writeIfChanged()` leaves a file alone when its
content would not change, so a regeneration cannot trigger itself and the
browser never sees an empty HMR update. A failure in dev prints to the
terminal and the browser overlay and the server keeps running; a failure at
build start still stops the build.

`generateTokens()` now takes a `root`, so the plugin can give it Vite's root
instead of relying on the working directory. Every default path and the
undefined-variable check resolve against it. Token output is unchanged.

**New: `tools/forms/`.** PocketBase hooks to replace Netlify Forms, with the
reasons and the setup in that folder's own README. A repo tool, not part of
the package, so bumping the tag doesn't bring it into a site. Brick House's
contact form is the first one lined up for it, when its DNS moves.

**Playground: on `--type-*` and the colour roles.** Its `global-styles.css`
and blocks now use the type lab's tokens instead of the old `--size-step-*`
scale, and the roles (`--surface`, `--text`, `--primary` and the rest) instead
of leftover `--color-*` references, so `data-scheme` switches everything.
Playground-only: no site is affected. `--size-step-*` stays for the
`/palette` and `/type` tools.

**Correction to the v0.2.3 note on `focusHeading()`.** That note said the
copied `onMount(() => afterNavigate(...))` snippet "never registers", and the
11 November review concluded the opposite. The installed SvelteKit source
settles it: `afterNavigate` itself calls `onMount` internally, so the copied
snippet calls `onMount` from inside a mount callback, after the mount phase
has run. The v0.2.3 note was right and the review was wrong. This is read from
the source, not yet confirmed in a browser, and the first site to swap in
`focusHeading()` should test navigation to be sure.


## v0.2.3

**Fix: Wrapper ignored the site's width.** `<Wrapper>` wrote
`--wrapper-max-width: var(--wrapper-max-width, 1360px)` inline. A custom
property that refers to itself is invalid, so the site's
`--wrapper-max-width` was dropped and every `<Wrapper>` was 1360px wide. It
now writes nothing inline unless you pass `maxWidth`. The `.wrapper` class
was never affected.

**Check after bumping:** a site whose `--wrapper-max-width` isn't 1360px
and which uses the `<Wrapper>` component gets narrower (or wider) pages:
they finally follow the variable. Root sets 1360px, so nothing moves there.
robertocarroll.com uses the class, not the component.

**New: named viewport limits.** A fluid token can set `"maxViewport": "mid"` to stop growing at a named viewport, and `generateTokens({ clampPrecision: 4 })` sets the decimals in `clamp()`. The default stays at two, so existing output doesn't change (see "Design tokens").

**New: `focusHeading()`.** After a client-side navigation it moves focus to
the new page's `h1`. Every site's layout had this as a copied snippet that
called `afterNavigate` inside `onMount`, where it never registers, so it has
not been running anywhere. In the root `+layout.svelte`, at the top level:

```svelte
<script>
  import { afterNavigate } from '$app/navigation';
  import { focusHeading } from '@thoughtfox/toolkit/layout';
  afterNavigate(focusHeading());
</script>
```

Delete the old `onMount(() => { afterNavigate(...) })` block when you add it.

## v0.2.2

**Fix: Grid presets.** `<Grid layout="thirds">` and `layout="50-50"` never
applied, because the component wrote its default `minItemSize` and
`placement` inline, which beat the preset. On a wide row "thirds" made four
columns and left one empty; around 768px it showed two plus one.

- `Grid` now writes nothing inline for props you leave unset, so the CSS
  defaults (16rem, auto-fill) and the presets apply. A prop you set still
  wins.
- `thirds` is three equal columns, or one when the row is narrower than
  52rem. `50-50` is two, or one below 34rem. Change the switch point with
  the `threshold` prop or `--grid-threshold`.
- A `<Grid>` without `layout` gives exactly what it did before.

**Check after bumping:** any page that uses `layout="thirds"` or
`layout="50-50"` changes. Root: the pattern pages. The playground: the
50-50 demo on its home page.

## v0.2.1

**Fixes.** SkipLink, Reel and Sidebar used variables from the old starter
palette that most sites don't define. They now fall back to something that
works everywhere (see "Conventions"). A site that didn't set those variables
sees one change: its skip link, when focused, is white on black (or its
`--primary` / `--on-primary` roles) instead of having no background. No code
changes needed.

## v0.2.0

**Upgrading needs no code changes.** Bump the pin to `#v0.2.0`, run
`npm install`, build and check with the snapshots. Every v0.1.0 import path
still works and gives the same code (a few files differ only in comments),
and the token generator gives the same output for v0.1.0 token files.

**New**

- The package is grouped by area: `tokens/`, `layout/`, `motion/`,
  `palette/`, `type/` (see "What's inside"), with an entry per area:
  `@thoughtfox/toolkit/layout`, `/motion`, `/palette`, `/type`, `/tokens`.
  The root entry still exports the same layout and motion names.
- The token generator takes over the playground's version: the roles and
  schemes format for `colors.json` (with checks), Tachyons spacing
  utilities, `--type-*` from `typography.json`, contrast data, and the
  undefined-variable check. Each turns on only when the token files use it
  (see "Design tokens").
- `type/utilities/text.css`: the text utilities with Tachyons names (`.b`,
  `.lh-copy`, `.ttu`, `.tc`, `.tracked` …).
- The `/palette` and `/type` tools: `@thoughtfox/toolkit/palette` and
  `@thoughtfox/toolkit/type`, with a `button` prop for the site's Button.
- `tokens/check-vars.js` and `palette/contrast.js` as scripts.
- Dependency: `apca-w3` (for the contrast data; loaded only when it runs,
  which needs Node 22.12 or later).

**Upgrade notes: changed paths**

The old paths are kept in `package.json` `exports`, so nothing breaks. Move
to the new path when you next work on a site; the old ones may go in v1.0.0.

| v0.1.0 path (still works) | New path |
|---|---|
| `@thoughtfox/toolkit/css/reset.css` | `@thoughtfox/toolkit/layout/reset.css` |
| `…/css/compositions/<name>.css` | `…/layout/compositions/<name>.css` |
| `…/css/compositions/scene.css` | `…/motion/compositions/scene.css` |
| `…/css/utilities/region.css`, `visually-hidden.css` | `…/layout/utilities/region.css`, `visually-hidden.css` |
| `…/css/utilities/reveal.css` | `…/motion/utilities/reveal.css` |
| `…/css/utilities/text.css` | `…/type/utilities/text-legacy.css` (same file). For the Tachyons names, use `…/type/utilities/text.css` and rename the classes: see `playground/UTILITY-RENAMES.md` |
| `…/css/transitions/<group>/<name>.css`, `transitions.json` | `…/motion/transitions/<group>/<name>.css`, `transitions.json` |
| `…/components/layout/<Name>.svelte` | `…/layout/components/<Name>.svelte` |
| `…/components/SkipLink.svelte` | `…/layout/components/SkipLink.svelte` |
| `…/components/ScrollScene.svelte` | `…/motion/components/ScrollScene.svelte` |
| `…/components/transitions/<Name>Masks.svelte` | `…/motion/components/<Name>Masks.svelte` |
| `…/actions/reveal.js` | `…/motion/reveal.js` |
| `…/actions/scroll-scene.js` | `…/motion/scroll-scene.js` |
| `…/stores/motion.js` | `…/motion/reduced-motion.js` |
| `…/transitions/segue.js` | `…/motion/segue.js` |
| `…/scripts/generate-tokens.js` (import or `node node_modules/…`) | `…/tokens/generate-tokens.js` |
| `import { … } from '@thoughtfox/toolkit'` | unchanged; or `'@thoughtfox/toolkit/layout'` / `'/motion'` |

**Not kept:** reading package files by their place on disk, such as
`node_modules/@thoughtfox/toolkit/css/reset.css` in a `<link>` or a plain
postcss-import setup outside Vite. Only `scripts/generate-tokens.js` is
still a real file at its old place, because sites run it with `node`. Vite
resolves `@thoughtfox/toolkit/…` through `exports`, so imports in CSS,
Svelte and JS are not affected. Neither Root nor robertocarroll.com reads
files this way.

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
