# Palette system plan

> A palette is a set of possibilities, not a fixed list of where each colour goes.
> Roles keep things consistent. The contrast data sets the limits. The randomiser is for discovering combinations.

## Four concepts

| Concept | What it is | Example |
|---|---|---|
| **Colours** | The colours this project has | `ground`, `olive-oil`, `clay` |
| **Roles** | The job a colour does in the interface | `surface`, `text`, `heading`, `primary` |
| **Schemes** | A set of roles chosen for one context | `default`, `inverse`, `highlight` |
| **Combinations** | One foreground on one background, with its contrast data | Olive Oil on Ground, 4.92:1 |

A combination only says that two colours *can* be used together. A scheme is a set of roles that has been checked together, including buttons and links.

---

## Audit (done)

- `generate-tokens.js` writes `--color-<name>` from `colors.json` `items`. That's all it does for colour today.
- **Bug:** five colour variables are used but never defined: `--color-primary`, `--color-dark`, `--color-dark-glare`, `--color-light` and `--color-mid`. They're left over from the starter's old palette. Because of this, Button, Nav, SkipLink, Card, SiteHead, SiteFoot, Prose, and the reel scrollbar have no colour, or fall back to a browser default.
- Raw colour names are written directly in `global-styles.css`, `variables.css` (`--stroke`), FeatureBlock (through `--feature-bg`), and the demo page.
- Both clay overrides on the demo page use `:global()`. Schemes replace those.

This bug is good evidence for the plan. Components should only use role variables, and the build should catch any colour variable that doesn't exist.

---

## 1. One config file: `colors.json`

Colours, roles and schemes go in one file, so the names they refer to can't drift apart. The build stops with an error if a role or scheme names a colour that doesn't exist.

```json
{
  "colors":  { "ground": "#332822", "olive-oil": "#B6893B", "clay": "#F7E8D6", "air": "#FFFFFF" },
  "roles":   { "surface": "ground", "text": "clay", "heading": "olive-oil",
               "primary": "olive-oil", "on-primary": "ground",
               "accent": "clay", "muted": "clay", "border": "olive-oil" },
  "schemes": {
    "inverse":   { "surface": "clay", "text": "ground", "heading": "olive-oil-dark",
                   "primary": "ground", "on-primary": "clay" },
    "highlight": { "surface": "olive-oil", "text": "clay", "heading": "clay",
                   "primary": "ground", "on-primary": "clay" }
  }
}
```

The build generates this CSS:

```css
:root { --color-ground: #332822; /* … */
        --surface: var(--color-ground); --text: var(--color-clay); /* … */ }

[data-scheme="inverse"] { --surface: var(--color-clay); /* … */ }

/* The scheme container paints itself. Variables are inherited, but the body's background is not */
:where([data-scheme]) { background: var(--surface); color: var(--text); }
```

Components only use the role variables: `var(--surface)`, `var(--heading)` and `var(--primary)`. They don't need to know which scheme they're in.

`primary` means the main brand and interactive colour, used for buttons and links. Headings get their own `heading` role.

## 2. Contrast data: `contrast.generated.json`

The build checks every **ordered** pair of colours. Order matters for APCA: it gives a different score depending on which colour is the text and which is the background. WCAG 2 gives the same ratio either way.

```json
{ "fg": "olive-oil", "bg": "ground", "ratio": 4.92, "apca": 58.1,
  "supports": { "body": true, "largeText": true, "nonText": true, "aaaBody": false } }
```

- `body` ≥ 4.5 · `largeText` ≥ 3 · `nonText` ≥ 3 (UI elements and borders) · `aaaBody` ≥ 7
- WCAG 2 decides pass or fail. APCA is shown next to it as a guide for large display type such as Rockhill.

**Checking schemes.** Each scheme has rules for which role pairs must reach which level:

| Pair | Must support |
|---|---|
| `text` on `surface` | body |
| `heading` on `surface` | largeText |
| `primary` on `surface` (links and button edge) | nonText, plus body if links sit in running text |
| `on-primary` on `primary` (button label) | body |
| `border` on `surface` | nonText |
| `focus-ring` on `surface` | nonText |

A failing pair is a build warning that names the scheme and the pair.

**When a pair fails:** the build reports it and suggests the smallest fix, such as the nearest tint that passes or an existing colour that would work. It never changes the palette by itself. Changing a colour is always a decision someone makes.

**`--focus-ring` role (to do).** At the moment `:focus-visible` uses `var(--primary)`. Not every scheme's primary colour will reach 3:1 against its surface, so the focus ring needs its own role. Add `focus-ring` to `roles` (default: the same colour as `primary`), let schemes override it, and point `:focus-visible` at `var(--focus-ring)`. This belongs in task 5, alongside the scheme checks.

**Checking for undefined variables.** The build also scans `src/` for `var(--color-*)`, and for role names that don't exist, and warns about each one. This would have caught the bug above.

## 3. `/palette`, a page for development only

Production builds return a 404 for this page: in `+page.js`, `if (!dev) error(404)`. It has three sections:

**Explore: the randomiser, mode A (combinations)**
- Shuffle (button or → key) through ordered pairs that pass
- Lock the foreground or the background
- Filter by what the pair must support: body, large text or UI elements
- Shows the WCAG ratio and the APCA score
- "Copy" puts a JSON snippet on the clipboard. The randomiser never writes to the project.

**Inspect: the full matrix, laid out like components.ai**
- One row per colour: swatch, name, the roles it fills, hex, HSL and RGB, then a chip for every other colour
- **Failing pairs are shown, faded and with their ratio.** Knowing what doesn't work is useful too.
- The same WCAG/APCA toggle as the randomiser

**Schemes**
- Every named scheme draws the **real starter components**: an h2, a paragraph, a link, a Button and a Card. No specially styled samples, so the page tests the actual design system.
- Each scheme shows its check results inline

**Later: mode B, the scheme builder.** This picks a full scheme at random (surface, text, heading, primary, on-primary, accent) from combinations that pass every rule in the table above, and previews it on the real components. "Copy as scheme" puts it on the clipboard. Build this only after the role model and scheme checks have been tested on Root.

---

## Tasks

| # | Phase | Task | Done when |
|---|---|---|---|
| 1 | Audit | ~~List current colour usage~~ | Done (see above) |
| 2 | Roles | ~~Change `colors.json` to the colours/roles/schemes format and update `generate-tokens.js`~~ | Done |
| 3 | Proof | ~~Move **one** component onto roles (Button)~~ | Done. Olive Oil changed from `#B5883A` to `#B6893B` so the label reaches AA (4.52). `:focus-visible` now uses `var(--primary)` |
| 4 | Contrast | ~~`scripts/contrast.js` (WCAG + `apca-w3`) and `contrast.generated.json` with `supports`~~ | Done. `npm run contrast` prints every pair; the JSON is written to `src/lib/palette/` on every `npm run tokens` |
| 5 | Schemes | Generate the `[data-scheme]` rules, and run the role-pair checks and the undefined-variable scan. Add the `focus-ring` role | `data-scheme="inverse"` works and the warnings appear. `highlight` should be flagged (see below) |
| 6 | Migration | Move everything else onto roles and schemes, and remove the `:global` overrides and the old variables | **Root looks the same as before.** This is a refactor, not a redesign. Screenshots before and after |
| 7 | Inspect | ~~`/palette` matrix~~, development only. **Scheme previews still to do** (after task 5) | Matrix done |
| 8 | Explore | ~~Randomiser mode A: shuffle, lock, filter, copy~~ | Done: shuffle (button or →), fix text or background, swap, filter by use, copy JSON |
| 9 | Builder | Randomiser mode B: the scheme builder | A generated scheme passes every rule |
| 10 | Docs | `CLAUDE.md`: the four concepts, the role list, the steps for setting up a new palette | A new project only needs to edit `colors.json` |

## Contrast failures to decide on

- **`highlight` scheme** (the manifesto block, Clay on Olive Oil): 2.63:1. That fails body text (4.5) and large text (3). It already failed before the Olive Oil change, at 2.67. Smallest fixes, using colours already in the palette:
  - Switch the surface to `olive-oil-dark`: Clay on it is 3.24:1. That passes for large text only, so the scheme could only hold display type
  - Switch the text and heading to `ground`: 4.52:1. That passes for everything, but the block would look different

## Decisions

- **Role list:** `surface, text, heading, primary, on-primary, secondary, accent, muted, border`. `on-primary` is added for button labels.
- **Scheme names for Root:** `default` (Ground), `inverse` (Clay) and `highlight` (Olive Oil, the manifesto block).
