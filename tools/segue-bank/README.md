# Segue transitions

All 46 page transitions from [Segue](https://jhey.dev/prototypes/2026/segue/) by Jhey Tompkins, as plain CSS, captured with their default settings on 2026-10-30. They use the View Transitions API, so they need no framework and almost no JS.

## Use one in a project

1. Copy one file from `transitions/<family>/<name>.css` into the site and load it on **every page** (it contains `@view-transition { navigation: auto; }`, which opts same-origin page navigations in).
2. Optional: copy `segue.js` and load it in `<head>` as a plain blocking script:
   ```html
   <link rel="stylesheet" href="/transitions/circles/circle-pop.css">
   <script src="/segue.js"></script>
   ```
   It plays transitions in reverse on history back, makes pointer-origin transitions (Circle Pop) grow from the click, even across pages, and gives you `segue(update, { back })` for same-page changes.
3. Four transitions also need an inline SVG of masks pasted anywhere in `<body>` on every page: **Paint Over**, **Dots Radial**, **Dots Sweep** and **Grid Squares**. That markup is the `.html` file next to the CSS.

That's it for a static site. For a SvelteKit site, see the note below.

### Same-page changes

```js
segue(() => swapContent())                 // forwards
segue(() => swapContent(), { back: true }) // reverse, where supported
```

## Customise

Each file sets its colours and timing as custom properties on `:root`. Override them after the import rather than editing the file:

```css
:root {
  --segue-lead-color: var(--color-primary);
  --segue-trail-color: var(--color-dark);
  --segue-duration: 0.6s;
}
```

Which properties exist varies by family (look at the `:root` block at the top of each file). The sizes, counts and angles are baked into the generated geometry. For a tuned variant (more stripes, another angle), change it in Segue's **Tune** panel and use its **Copy** button.

## Files

- `transitions/<family>/<name>.css`: one self-contained transition per file
- `transitions/<family>/<name>.html`: SVG mask markup (only the four above)
- `transitions.json`: manifest of name, family, file paths, `markup` and `backwards` (38 of 46 have a reverse for going back; the rest replay forwards), plus an `audit` object on each entry (draft verdicts)
- `AUDIT.md`: the audit summary, the shortlist for document-style sites and the common fixes
- `segue.js`: optional helper
- `demo/`: picker for trying every transition, same-page and cross-page

## Run the demo

Cross-page view transitions need http, not `file://`. From this folder:

```bash
python3 -m http.server 5182
```

Then open http://localhost:5182/demo/. It's also `segue-demo` in this repo's `.claude/launch.json`.

## Browser support

Same-page transitions work in current Chrome, Edge, Safari and Firefox. Cross-page (`@view-transition`) works in Chrome/Edge 126+ and Safari 18.2+. Other browsers just navigate normally. The `shape()` clip paths and the `types` used for going backwards need recent engines too. Older browsers fall back to an instant change. Reduced-motion users get the default crossfade.

## SvelteKit

SvelteKit routes client-side, so `@view-transition` doesn't fire. Use `onNavigate` instead and the same CSS applies:

```js
import { onNavigate } from '$app/navigation'
onNavigate((nav) => {
  if (!document.startViewTransition) return
  return new Promise((resolve) => {
    document.startViewTransition({
      update: async () => { resolve(); await nav.complete },
      types: [nav.delta < 0 ? 'backwards' : 'forwards'],
    })
  })
})
```

## Credit

The code is Jhey Tompkins'. Segue offers it for copying into projects, but the page states no licence. Keep the credit line at the top of each file, and ask before republishing the collection itself.
