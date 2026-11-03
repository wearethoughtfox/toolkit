---
name: thoughtfox-type
description: "The Thought Fox way of choosing and setting type for a client site, built on Frank Chimero's 2020 redesign method: atmosphere and content roles first, candidates judged in running text, body size set from the text box, hierarchy built with spacing before size, and a small scale on a 4px rhythm, then mapped onto the CUBE starter's fluid tokens. Use when picking or pairing typefaces, setting body size, line-height or a type scale, auditing a site's typography, or working on the type step of a redesign. Triggers on: typeface, font, pairing, type scale, body size, line-height, leading, hierarchy, typography audit, text-sizes.json, text-leading.json, fonts.json, TYPOGRAPHY.md, /type."
---

# Thought Fox type

Most Thought Fox sites are documents, not apps: the content is in front of you, so the design problem is mostly typographic. Which faces? How do they show hierarchy? How is the text block set? Where do the blocks go, and how does that change across widths? This skill is the process for answering those questions in order. Its source is Frank Chimero's redesign series, saved as text in `CSS-course-picalli/chimero-redesign/` (posts 01–05) on Rob's Mac. They're Chimero's writing, so they aren't in this repo. When they're there, read the relevant post if a step needs more than the rule here; otherwise the rules here stand on their own.

Other skills cover mechanics this one doesn't: `emil-typography` for CSS details (woff2, `font-synthesis`, `text-wrap`, OpenType features) and `web-typography-skill-main` for Bringhurst-level detail. This skill decides **what** and **in what order**; those decide **how to write it**.

## New choice or audit?

- **Choosing type** (new site, or Rob has asked for new faces) → walk "The order" below.
- **Auditing an existing site** → read the tokens and CSS, measure the setup against every rule in this skill, and write findings, each with the smallest fix as an option. Propose a new face only for a role whose current face fails a test. If there's no brief, draft placeholder aims from what the site already does, mark them as placeholders, and carry on. Example: `examples/brickhouse-audit.md` next to this skill.

## The order

Never skip ahead. Each step's output is the next step's criteria, and a face picked before the aims exist gets argued for afterwards instead of chosen.

1. **Aims.** Take the 3–5 aims from the redesign brief (see `thoughtfox-redesign`). If there aren't any, stop and get them. Every later choice is argued against them by name.
2. **Content roles.** Click through the site and list the kinds of text and what each one needs:
   - extended reading
   - lists and data to skim
   - labels and metadata
   - headlines
   - interface (navigation, buttons, forms)

   Write one line per role on its typographic association ("readerly", "skimmable", "card catalogue"). The roles decide how many faces you need, usually a serif, a sans and maybe a mono. Fewer is better.
3. **Criteria per face.** For each face, write its classification family, the size range it must be good at, and the practical contexts it has to survive: numerals in tables, narrow mobile columns, dense interface text, and medium sizes if it will set headlines. Brand faces are chosen for tone and then fail in the dull places. Choose for both. (Chimero's National 2 example, post 03.)
4. **Candidates.** 2–4 per role. The client's existing fonts are always the first candidates. Replace one only if it fails a test below, and then flag it to Rob as an option with the evidence, never as a done change.
5. **Tests.** Run every candidate through all of the tests below.
6. **Pick a primary and a reserve per role.** The reserve should differ on the axis most likely to cause trouble, usually width: a narrower face in case the primary fights narrow columns. Rob makes the final pick among candidates that pass. Your job is a solid pool with evidence, and you never present one face as the only possible answer.
7. **Body size, breakpoint, leading, scale, hierarchy**, as below.
8. **Write it down** in the site's `TYPOGRAPHY.md`, then change tokens.

## Tests

- **Running text, never specimens.** Set a real paragraph of the client's own copy at body size. Quirks in single letters disappear at text sizes; proportion, colour and width set a face's voice. A face that looks quirky in an alphabet can read plainer in a paragraph than a "normal" one (Basis vs Avenir, post 04).
- **Three sizes.** Body, medium (20–36px) and display. Text cuts often look chunky at medium sizes because of their low contrast, wide fit and long ascenders. Check this before planning serif headlines or "flipped" pages with serif headings over sans body. Use the face's Display or Headline cut, or `font-optical-sizing: auto`, if it has one.
- **Line-break smoke test.** For two faces that will both set running text, set them side by side at a narrow measure with their x-heights matched (adjust one size until they match). If the line breaks mostly fall in the same places, their horizontal rhythm matches and they'll sit well together. (Post 02.)
- **Practicalities.** Licence terms (Chimero refused a yearly-billed webfont licence; check what the client is willing to pay for), file weight (every weight and style is another file, so weight-based hierarchy has a byte cost), and whether a variable version exists.

## Body size: set it from the box, not the screen

1. **Small box:** a 320px-wide text block. Find the size that gives **5–6 words per line**.
2. **Large box:** a 700px-wide block. Usually 1–2px bigger, with line-height about 5–10% looser, giving **10–14 words per line**. The text block's maximum width is about 700px.
3. **Judge both** on an even rag (the ragged right edge) and similar colour: squint, and both blocks should be about the same grey.
4. **Breakpoint:** find the column width where both sizes feel slightly wrong, with the small one a touch stretched and the large one a touch cramped. Switch there. Chimero's was 600px.
5. **Stop growing.** Body text rarely goes above about 20px unless the reader sets it larger. Use extra space on big screens for layout, not bigger body text. Why: reading distance sets the right size, not screen size, and oversized body text makes the eye travel further and the reader scroll more.

Chimero's result: 18/24 below 600px, 20/28 above it, max width 700px.

## Leading

- Choose line heights on **multiples of 4px**. Nudge by a pixel to get there. Half pixels don't exist, and 1px visibly changes a block at 16–20px.
- **Ship them as unitless ratios** (line height ÷ size, so 28px on 20px is `1.4`), never as px or rem lengths. A length is inherited as it is, so every element that changes its font size would also have to set its line height. Rob's call (2026-11-03): the exact rhythm isn't worth that complexity. With fixed breakpoints a ratio gives exactly the chosen px. With fluid type it's within a pixel or so, which is fine.
- Pick the text colour on purpose. Digital designers default to light colour at 140–160% line-height; editorial designers prefer darker colour at 120–130%. Chimero thinks most screen text is set too loose, especially on mobile. Say which way you're going and why, against the aims.
- Headlines never inherit body leading. 150% on a big headline makes the lines drift apart.

## Hierarchy: size last

Start from the flat, unstyled content and add one tool at a time, in this order:

1. **Spacing**, vertical or horizontal (a second column)
2. **Weight**
3. **Colour**
4. **Size**
5. **Typeface or style switch** (italic, small caps, the other face)
6. **Accent** (a mark, a rule, a symbol)

Each tool can also push things back: a date can be smaller and lighter. Stronger tools free up content order; with colour, a date can sit above the title and still read as secondary. Check that a lower-level heading still reads as that level on a page where the higher ones don't appear. Be restrained: hierarchy is contrast, and contrast depends on context.

## Scale

- **6–7 sizes in use per site.** If you need more, either the content is genuinely complex or the other hierarchy tools are being under-used. Find out which before adding a size.
- The two body sizes sit in the middle. Sizes above them keep line heights in 4px steps. Sizes below them only need to look clearly different.
- **Never three consecutive pixel sizes** in the small end (13, 14, 15). Spread them (13, 15, 16) and use weight or colour for the rest. Interfaces clog the small end fastest.
- Ratio-based (musical) scales are optional. What matters is baselines lining up and every pair of sizes looking clearly different.

## The lab: `/type` in the playground

The toolkit's `playground/` (the former starter) has a dev-only `/type` route that runs these tests: running text, the line-break count with x-heights matched, words per line in the 320 and 700px boxes, the breakpoint slider, the scale checks and the hierarchy tools. Use it instead of judging by hand, and quote its numbers in `TYPOGRAPHY.md`. It saves `playground/src/lib/design-tokens/typography.json`, and `npm run tokens` turns that into `--type-<step>-font`, `-weight`, `-size` and `-leading`. Its checks (`playground/src/lib/type/checks.js`) are the rules in this skill, so the warnings it prints are findings to report.

For a client site, copy the route, `src/lib/type/` and `src/lib/components/type/` from the playground until the toolkit package carries them (roadmap step 5).

## Mapping onto the CUBE starter tokens

There are two type systems in the playground. `text-sizes.json` is the older fluid Utopia scale (15 steps), stretched from `viewports.min` to `viewports.max` (330→1350px). `typography.json` is this method's scale.

- **Prefer `typography.json`** for anything set with this skill. Its `stepped` mode is Chimero's: the small setting below the breakpoint, the large one above it, and each line-height ratio gives exactly the chosen px. Its `fluid` mode grows the size from `viewports.min` and stops at the breakpoint, with one line-height ratio (the mean of the two ends), so it lands within a pixel or so of the chosen px.
- **On a site still using `text-sizes.json`:** the body step's `min` is the small-box size and its `max` the large-box size. Stretching to 1350px means body type keeps growing on wide screens. Flag that in `TYPOGRAPHY.md` and to Rob, with moving to `--type-*` as the fix. Never edit the generator or `viewports.json` silently.
- **Steps in use:** list the 6–7 steps the site actually uses in `TYPOGRAPHY.md`. Unused steps can stay in the JSON but never appear in markup.
- **Leading:** `text-leading.json` holds a few global ratios. Check each step's size × leading at both ends against the 4px rule. If one is more than about a pixel out, propose a different ratio for that role and show the numbers. Don't turn line heights into lengths to hit the rhythm exactly, and don't change the global token without Rob's go-ahead.
- **Utilities:** use the Tachyons names already in the project (`.lh-copy`, `.lh-title`, `.measure`, `.b`, `.fw5`, `.ttu`, `.tracked`).

## Output: `TYPOGRAPHY.md` in the site root

Write this before touching tokens, and show it to Rob:

1. **Aims**, quoted from the brief.
2. **Roles to faces:** primary and reserve per role, one line of reasoning each, citing the aims.
3. **Test results:** pass or fail per candidate, with what was seen.
4. **Body:** small and large size and line-height in px, words per line at 320 and 700, the breakpoint, and the max width.
5. **Scale table:** for each step in use, size / line-height in px at the narrowest, a mid (700px) and the widest viewport, plus the role that uses it. Fluid values can only be checked against the 4px rule as numbers, so calculate them; don't eyeball them.
6. **Hierarchy recipes:** for each content type (post header, list item, card), the tools used, in order.
7. **Flags:** anything that departs from the client's existing fonts, the generator, or the global tokens.

## Never

- Inter (or any face) by default. A default isn't a choice.
- Cormorant Garamond with Inter, tiny tracked uppercase labels everywhere, or a display face chosen for "premium". These are the generic AI-editorial look Rob has rejected.
- Judging a face from an alphabet or a specimen image.
- Body text that keeps scaling on big screens.
- Fixing hierarchy by adding a size before trying spacing, weight and colour.
