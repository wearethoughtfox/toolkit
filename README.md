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

## What's inside

```
css/reset.css               Modern reset (piccalil.li)
css/compositions/*.css      stack, cluster, sidebar, grid, switcher, cover,
                            center, reel, frame, wrapper, repel
css/utilities/*.css         region, text, visually-hidden, reveal
components/layout/*.svelte  Prop-based wrappers for each composition
components/SkipLink.svelte  Accessible skip link (pair with #main-content)
actions/reveal.js           IntersectionObserver scroll-reveal action
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
