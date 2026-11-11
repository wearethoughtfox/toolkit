# Roadmap

See the [11 November review response and implementation plan](IMPLEMENTATION-2026-11-11.md) for the proposed order, qualifications and completed generator prerequisite. The historical checklist below remains intact.

The order of work across the toolkit and the client sites, agreed on 3 November 2026. Each step makes the next one safer or easier.

**How it fits together:** everything shared lives in this one repo. That's the package (the top-level folders), the playground (`playground/`, which was the starter), the tools (`tools/`), the Thought Fox skills (`.claude/skills/`) and this roadmap. Work happens here once. Each site gets it only when you tag a release and bump that site's pin (`github:wearethoughtfox/toolkit#vX.Y.Z`), then check it with the snapshots. Nothing updates a site on its own.

## 1. Safety net (done)

- [x] `tools/site-snapshots/`: screenshots every page of every site and diffs against a baseline
- [x] Baselines for Ashbright, Brick House, Clubs, WATF and the starter (327 screenshots, 3 November)
- [x] Baselines for Root and robertocarroll.com (Edge, 3 November)
- [x] Commit everything and gather it into this repo (3 November): ScrollScene, the starter as `playground/` with its history, the snapshots, the Segue bank and the skills. robertocarroll.com's redesign is pushed to its own repo

## 2. Thought Fox method skills (done)

`.claude/skills/` has `thoughtfox-redesign` and `thoughtfox-type`, with the Brick House type audit as the type skill's example. They load in any session in this repo, including cloud sessions; to use them in a site's repo too, see the README. The palette part gets its own skill in step 4, once the OKLCH upgrade settles how it works.

- **Typography** from Frank Chimero's redesign series (`CSS-course-picalli/chimero-redesign/` on Rob's Mac, not in the repo):
  - wants and needs
  - atmosphere
  - a content audit into roles
  - typeface criteria
  - candidates tested in running text
  - the line-break smoke test
  - body size at 320 and 700px wide
  - the breakpoint of mild mutual discomfort
  - hierarchy tools before size
  - a small scale on a 4px rhythm
- **Colour** from the palette plan: colours, roles, schemes and combinations, with contrast failures flagged, never silently fixed
- **Client first:** start from the client's logo, palette and copy; avoid the generic AI look

## 3. Type lab (built and committed 3 November)

`/type` in `playground/` (dev only, next to `/palette`) turns Chimero's tests into tools:

- [x] candidates side by side in running text, flagged when a face isn't installed or loaded, with a verdict and notes per test
- [x] the line-break test with x-heights matched (measured from the fonts), counting the breaks that fall on the same word, with a log of results
- [x] words-per-line counts in the 320 and 700px boxes, and a squint toggle
- [x] the breakpoint finder: both settings at any column width, with Chimero's target count for that width
- [x] a scale editor with the 4px, small-end and "body over 20px" checks, and the px values at 330, 700 and 1350px
- [x] the hierarchy tools added one at a time to a post header, saved as a recipe
- [x] saves `typography.json` → `npm run tokens` → `_type.generated.css` (`--type-*`), stepped (Chimero) or fluid stopping at the breakpoint
- [x] line heights ship as unitless ratios, not rem lengths (Rob, 3 November): the 4px rhythm guides the choice, the ratio is what sites get
- [x] tests: `cd playground && npm test`
- [ ] Rob: try it on a real choice (Root, or the Brick House audit)
- [x] Adopt `--type-*` in the playground's own `global-styles.css` and blocks, instead of the old `--size-step-*` scale (3 November). The `/palette` and `/type` tools still use `--size-step-*`

There's no automatic breakpoint estimate. Chimero's targets (5.5 words at 320px, 12 at 700px) scale in proportion with the width, so word counts can't find his breakpoint. It's a judgement by eye, and the lab gives the counts to judge against.

## 4. Palette upgrades

From `emil-color`: generate OKLCH alongside hex, add APCA scores next to the WCAG ratios, and add fixed-hue tonal ramps. These go in the playground first, then steps T1–T6 in `playground/PALETTE-PLAN.md`.

- [x] OKLCH alongside hex in `contrast.generated.json` and on `/palette` (worked out from the hex, which stays the source of truth)
- [x] APCA Lc next to the WCAG ratio (was already there; checked against the APCA reference values)
- [x] Fixed-hue tonal ramps on `/palette`: 11 steps per colour, each checked against every scheme's surface. For exploring only, not written to tokens
- [ ] The palette skill, once Rob has used the ramps on a real choice

## 5. Toolkit restructure (done 3 November, v0.2.0 tagged)

The pieces are now in one repo, but the playground still has its own copies of the compositions, utilities and token script. Group the package by area (tokens, layout, motion, palette, type). Make the playground import the package instead of its copies, and move the palette and type tools (`src/lib/palette`, `src/lib/type`, their components and scripts) into the package so sites can use them. Then release v0.2.0, and check it with `tools/site-snapshots` against Root and robertocarroll.com before bumping either.

- [x] The package grouped by area: `tokens/`, `layout/`, `motion/`, `palette/`, `type/`, with an entry per area. Every v0.1.0 path still works (`exports` in `package.json`, and `scripts/generate-tokens.js` as a real file)
- [x] The playground imports the package (`file:..`) instead of its copies. Its built CSS is the same, apart from Svelte scope hashes for components that are now in the package
- [x] The palette and type tools in the package (`@thoughtfox/toolkit/palette`, `/type`); the `/palette` and `/type` routes stay in the playground and pass its Button as `button={Button}`
- [x] v0.2.0 release notes and upgrade notes in the README
- [x] Rob: tag v0.2.0 after merging (`git tag v0.2.0 && git push --tags`)
- [x] Root is on `#v0.2.2`
- [ ] robertocarroll.com is on `#v0.2.0` in a local commit that isn't pushed (checked 11 November). Push it, or bump straight to the next tag

## 6. Transitions bank

Audit all 46 Segue transitions in `tools/segue-bank/` (the CSS is the same as the package's `motion/transitions/`). The audit is written up with draft verdicts in `tools/segue-bank/AUDIT.md` (0 keep, 15 tone down, 31 drop); the Lapse pass on the shortlist, Rob's verdicts and the picker are still to do:

- duration and easing
- a reduced-motion version that keeps a fade and drops the movement
- a frame-by-frame look in Lapse

Then record a verdict for each in `transitions.json` (keep, tone down or drop), and make a picker that previews them on a client's own pages.

## Ongoing

- Move a copied site (Brick House, WATF, Ashbright, Clubs) onto the toolkit only when it's next being worked on, with a snapshot baseline first
- Run `emil-prep-for-prod` before each launch
