# CSS Methodology — SvelteKit CUBE CSS Starter

This project uses **CUBE CSS** (Composition Utility Block Exception) with **Every Layout** primitives and a **fluid design token** system.

## Architecture

### Where CSS lives

| Layer | Location | Rule |
|---|---|---|
| Normalize | `modern-normalize` (npm), first import in `app.css` | Cross-browser fixes — update with npm |
| Reset | `@thoughtfox/toolkit/layout/reset.css` | Global, never override |
| Tokens (generated) | `src/lib/css/global/_tokens.generated.css` | Never edit — run `npm run tokens` |
| Type tokens (generated) | `src/lib/css/global/_type.generated.css` | Never edit — made from `typography.json` |
| Variables | `src/lib/css/global/variables.css` | Manual additions on top of tokens |
| Global styles | `src/lib/css/global/global-styles.css` | Low-specificity, element selectors |
| Compositions | `@thoughtfox/toolkit/layout/compositions/*.css` | Every Layout patterns — plain class names |
| Utilities | `@thoughtfox/toolkit/layout/utilities/*.css`, `@thoughtfox/toolkit/type/utilities/text.css`, plus `src/lib/css/utilities/widths.css` and `debug.css` | Single-purpose classes, Tachyons names |
| Spacing utilities (generated) | `src/lib/css/utilities/_spacing.generated.css` | Never edit — run `npm run tokens` |
| Blocks | Scoped `<style>` in `.svelte` files | Component-specific styles |

### CUBE layers summary

- **C — Composition**: layout primitives (`.stack`, `.cluster`, `.grid`, `.sidebar`, `.switcher`, `.cover`, `.reel`, `.frame`, `.wrapper`, `.repel`)
- **U — Utility**: single-purpose helpers (`.region`, `.visually-hidden`, `.b`, `.lh-copy`, `.ttu`, `.pb1`, `.mt-l`)
- **B — Block**: component styles scoped inside Svelte files (`Button.svelte`, `Card.svelte`, etc.)
- **E — Exception**: data-attribute modifiers (`.grid[data-layout="50-50"]`, `.sidebar[data-reversed]`)

## Design Tokens

Edit JSON files in `src/lib/design-tokens/`, then regenerate:

```
npm run tokens
```

This writes `_tokens.generated.css` with all `--color-*`, `--space-*`, `--size-step-*`, `--leading-*`, `--font-*` custom properties, and `_spacing.generated.css` with the spacing utilities.

The generator is the toolkit package's (`@thoughtfox/toolkit/tokens/generate-tokens.js`); `scripts/generate-tokens.js` only adds the toolkit folders to the undefined-variable check. The `/palette` and `/type` routes are here, but their components and checks are in the package (`palette/` and `type/` at the repo root). Each route passes this playground's `Button` to the tools as `button={Button}`.

Token files:
- `colors.json` — colours, roles and schemes (see `PALETTE-PLAN.md`). Blocks and global styles use the roles (`--surface`, `--text`, `--heading`, `--primary`, `--on-primary`, `--accent`, `--border`, `--focus-ring`), never `--color-*`, so `data-scheme="…"` switches them. `--surface-raised` (in `global-styles.css`) is a panel mixed from `--text` and `--surface`, for cards and demo boxes. `npm run check:vars` lists any variable that is used but never defined
- `spacing.json` — fluid spacing scale (min/max px → clamp())
- `text-sizes.json` — fluid type scale
- `text-leading.json` — line-height values
- `text-weights.json` — font-weight values
- `fonts.json` — font stacks
- `viewports.json` — min/max viewport for clamp() calculations
- `typography.json` — the type method's results: candidates and test notes, body size, breakpoint, a scale on a 4px rhythm, hierarchy recipes. Edit it in the `/type` lab (dev only), which saves the file and regenerates. It becomes `--type-<step>-font`, `-weight`, `-size` and `-leading`, plus `--type-max-width`. The playground's `global-styles.css` and blocks use these (h1–h3 their own steps, h4–h6 `label`, `small` the small step, `--measure` the max width). `text-sizes.json` (`--size-step-*`) is older; only the `/palette` and `/type` tools still use it. Bad structure stops the build; departures from the method print as warnings.

## Utilities (Tachyons names)

Utility class names follow Tachyons, mapped onto the tokens. Renames from the old names are in `UTILITY-RENAMES.md`.

| Group | Classes | Source |
|---|---|---|
| Spacing | `pa ph pv pt pb pl pr`, `ma mh mv mt mb ml mr` + `0–6` or token name (`pb1`, `mv3`, `pa-m`, `mt-xs-l`), `ml-auto`, `mr-auto` | `--space-*`; numbers set by `step` in `spacing.json` |
| Weight | `.normal` `.b` `.fw4` `.fw5` `.fw7` `.fw9` | `--font-weight-*` |
| Line height | `.lh-micro` `.lh-solid` `.lh-title` `.lh-copy` `.lh-loose` | `--leading-*` |
| Tracking | `.tracked` `.tracked-tight` `.tracked-mega` | `--tracking*` in `variables.css` |
| Transform | `.ttu` (with kerning) `.ttc` `.ttl` `.ttn` `.small-caps` | — |
| Align | `.tl` `.tc` `.tr` `.tj` (logical start/end) | — |
| Widths | `.w1–.w5`, `.w-10–.w-100`, `.w-third`, `.w-two-thirds`, `.w-auto`, `.mw-100`, `.mw-none` | — |
| Measure | `.measure` `.measure-narrow` `.measure-wide` | `--measure*` in `variables.css` |
| Debug | `.debug` (outlines children), `.debug-grid` | dev only |

Spacing uses logical properties (`mt` = `margin-block-start`). Utilities load after compositions, so `.mt0` on a `.stack` child overrides the stack gap. Prefer Stack/Cluster/Region for layout spacing; use these for one-offs. There is no Tachyons `.center` — that name is the Every Layout Center composition.

## Every Layout Compositions

Each layout pattern is both:
1. A plain CSS class — use directly in markup: `<div class="cluster">`
2. A Svelte component — use for prop-based configuration: `<Cluster gap="var(--space-l)">`

Both come from the toolkit package at the repo root, which the playground installs as `@thoughtfox/toolkit` (`file:..`). Import components from `@thoughtfox/toolkit/layout/components/<Name>.svelte`, and change them in the package, not here.

The components set CSS custom properties via `style:--prop={value}`. The CSS class defines the behaviour; the custom property overrides the default.

### Composition reference

| Component | Class | Key prop | Custom property |
|---|---|---|---|
| `Stack` | `.stack` | `space` | `--stack-space` |
| `Cluster` | `.cluster` | `gap` | `--gutter` |
| `Sidebar` | `.sidebar` | `sideWidth`, `contentMin` | `--sidebar-target-width` |
| `Grid` | `.grid` | `minItemSize` | `--grid-min-item-size` |
| `Switcher` | `.switcher` | `threshold` | `--switcher-target-container-width` |
| `Cover` | `.cover` | `minHeight` | `--cover-min-height` |
| `Reel` | `.reel` | `itemWidth` | `--reel-item-width` |
| `Frame` | `.frame` | `ratio` | `--frame-ratio` |
| `Wrapper` | `.wrapper` | `maxWidth` | `--wrapper-max-width` |
| `Region` | `.region` | `space` | `--region-space` |
| `Repel` | `.repel` | — | `--repel-vertical-alignment` |

## Accessibility conventions

- `SkipLink` is the first element in `+layout.svelte`
- Every `<nav>` has a unique `aria-label`
- Focus moves to `<h1>` on route change (via `afterNavigate` in `+layout.svelte`)
- `<ul>` and `<ol>` with list styles removed use `role="list"`
- Interactive elements are always `<button>` (action) or `<a>` (navigation) — never divs
- Color contrast: minimum 4.5:1 for body text

## Animations

- Import `prefersReducedMotion` from `@thoughtfox/toolkit/motion/reduced-motion.js` to gate Svelte transitions
- CSS transitions go inside `@media (prefers-reduced-motion: no-preference)` blocks in scoped styles
- Use the `reveal` action from `@thoughtfox/toolkit/motion/reveal.js` (with `motion/utilities/reveal.css`) for scroll-triggered reveals

## Starting a new project

1. Clone this repo
2. Edit `src/lib/design-tokens/colors.json` and `fonts.json`
3. Add woff2 font files to `src/fonts/`
4. Uncomment and update the `@font-face` rules in `src/lib/css/global/fonts.css`
5. Uncomment the `<link rel="preload">` in `src/app.html`
6. Run `npm run tokens`
7. Delete demo content in `src/routes/+page.svelte`
8. Update site name and nav links in `src/routes/+layout.svelte`
9. Run `npm run dev`
