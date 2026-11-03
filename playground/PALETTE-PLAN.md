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
| 5 | Schemes | ~~Generate the `[data-scheme]` rules, and run the role-pair checks and the undefined-variable scan. Add the `focus-ring` role~~ | Done. `npm run tokens` warns about failing scheme pairs (with smallest fixes) and undefined variables; `npm run check:vars` runs the scan alone; `/palette` shows each scheme on the real components |
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

---

## What happens next: the toolkit

The aim is one shared thing that gets better with each project, without every site having to keep up. A feature is built once (in the playground, or prompted by one site), released as a toolkit version, and each site chooses when to install it and check it.

**The model: a parent theme with no look of its own.** The toolkit gives each site features and structure: layout, colour tools, motion, forms. Each site is like a child theme, fully in charge of its own design. Three rules follow:

- **Nothing about how a site looks goes in the toolkit.** No brand colours, fonts or page designs. If a feature only makes sense for one site's design, it stays in that site.
- **Sites customise through settings, never by copying toolkit files.** That means tokens, roles, CSS variables and props. A copied file silently misses every later update.
- **Sites choose when to update.** Unlike WordPress, nothing updates on its own. Each site moves to a new version deliberately, and is then checked.

### How the pieces relate today

| Layer | What it is | Who uses it |
|---|---|---|
| Starter (this repo) | The workshop. Local only, never deployed | Nobody. It's where ideas are built |
| `@thoughtfox/toolkit` | The brand-neutral parts, copied out of the starter. On GitHub, pinned by tag | Root, robertocarroll.com (both on `v0.1.0`) |
| Copied sites | One-off copies of the starter, with no toolkit | Ashbright, Brick House, Clubs, We Are Thought Fox |

The starter and the toolkit each have their own copy of the compositions, and they've already drifted apart. The toolkit has `scene.css` and `ScrollScene`. The starter has the Tachyons utilities, `modern-normalize` and the palette system.

### Decision: one package, organised by area

Don't split colour, motion, forms and so on into separate packages. They depend on each other (forms need tokens and the focus ring, the palette needs the generator), so separate packages would mean keeping several versions in step. Instead, use folders inside one package, and let sites import only what they use:

```
@thoughtfox/toolkit
├── tokens/    generator, roles, schemes, contrast and variable checks
├── layout/    compositions + Svelte components
├── motion/    reveal, scroll-scene, reduced-motion
├── forms/     (when it exists)
└── palette/   the /palette tools
```

Split something out only if it gets a different audience, such as a non-Svelte project.

### Ground rules

1. **Pin a version, and upgrade only when working on a site anyway.** Being several versions behind is fine.
2. **Add, don't break.** Existing setups keep working: for example, the generator keeps accepting the old `items` format. A breaking change means a major version bump and a short "how to upgrade" note.
3. **Promote on the second use.** Build it inside a project first, and move it into the toolkit when a second project wants it.
4. **Keep a changelog** that says what's new and whether upgrading needs any work.

### Steps (after task 10, as a separate piece of work)

| # | Step | Done when |
|---|---|---|
| T1 | Turn the toolkit into a SvelteKit library repo. `src/lib/` is the package (built with `svelte-package`); `src/routes/` is a playground for development only | `npm run package` builds the package, and `npm run dev` shows the playground |
| T2 | Move the starter's brand-neutral work in: palette system, scripts, Tachyons utilities, `modern-normalize`, the fixed Sidebar. Merge it with the toolkit's own additions (`scene.css`, `ScrollScene`) | One copy of every composition |
| T3 | Move the demo page and `/palette` into the playground, with neutral demo colours (not Root's) | The pattern library and palette tools run from the toolkit repo |
| T4 | Add the changelog, and release `v0.2.0` with the generator still accepting `items` | Root still builds on `v0.2.0` without any changes |
| T5 | Replace the starter with a small new-project skeleton: `app.css`, `colors.json`, the toolkit installed | A new site is set up in a few minutes |
| T6 | Sites upgrade when they next get attention: Root on its own branch, checked against `root-baseline-2026-10-21/` | No site is forced to upgrade |
| T7 | Pilot the workflow on one copied site (Brick House or We Are Thought Fox): adopt the toolkit, then install one new feature, such as page transitions | A feature built centrally is consciously installed and checked on a second site |

The four copied sites stay as they are. Each could move onto the toolkit the next time it needs real work, if that's worth it.
