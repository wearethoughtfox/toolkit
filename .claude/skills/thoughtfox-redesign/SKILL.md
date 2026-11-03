---
name: thoughtfox-redesign
description: "The Thought Fox process for building or refreshing a client website: snapshot first, place it on the document/app spectrum, write wants and needs from the client's own words, audit the content, take a motif from the client's identity, then hand type, colour and motion to their own processes and check the result. Use when starting, refreshing, sprucing up, restyling or porting a client site, writing a design brief, or deciding a site's direction. Triggers on: redesign, refresh, spruce up, restyle, new client site, design direction, brief, wants and needs, port to SvelteKit, adopt the toolkit."
---

# Thought Fox redesign

A redesign goes wrong in a predictable way. Every decision falls back on the most common pattern, and the site ends up looking like every other site. This process stops that by tying each decision to something that belongs to the client: their words, their content, their logo. The steps are in order. Each one gives the next its criteria.

## 0. Snapshot

If the site exists, take a baseline before changing anything:

```bash
cd CSS-course-picalli/toolkit/tools/site-snapshots && npm run baseline -- <site>
```

Claude's sandbox can't run this, so ask Rob to run it. After the work, `npm run compare -- <site>` shows everything that moved. Why: "design unchanged" and "only the hero changed" become claims you can check, not hopes.

## 1. Where on the spectrum

Websites sit between **documents** (content known and visible: writing, records, portfolios) and **apps** (states, flows, variable content). Nearly every Thought Fox client site is a document, so the work is mainly typographic: faces, hierarchy, the text block, where blocks go, and how they change across widths. Treat it as a document unless it has real states or flows (forms, bookings, logged-in views), and say which parts are app-like. (Chimero, `chimero-redesign/01`.)

## 2. Wants and needs

Write 3–5 aims. Each is a short phrase plus one line saying what it means in practice. Chimero's: good fit, modest elegance, lightness, whim.

- **Take them from the client's own words:** the brief, their old site, their emails, how they describe themselves. Quote them. Invented aims turn into invented design.
- **Make them testable:** "lightness: no JavaScript beyond the form, shallow hierarchy" can be checked; "clean and modern" can't.
- **Include one aim that stops it being austere** (whim, warmth, play). Restraint alone turns into the generic premium look.

Show the aims to Rob before designing. Every later choice cites them by name.

## 3. Content audit

Click through the current site (or the content files) and list every kind of content and how much of it there is: long reading, project pages, lists, people, contact, forms. Each kind becomes a role for type and layout. Real content decides the layout: one important project gets a full-width treatment, a dozen small ones get a list, and unequal content gets unequal space. Use the longest real title and the emptiest real page when checking layouts.

## 4. Motif from the client

Before choosing anything, look at the logo, existing colours, fonts and photography, and find one graphic device to build from. For Brick House it was a gold frame around the whole viewport and the grey "brick" square on the hero photo, both taken from the logo.

- Use the client's palette and fonts as the starting point. Keep their exact copy. Flag every word you add, with a note that it's placeholder.
- Rob likes long vertical hairlines, lines that cross past image edges, and staggered grids. Use them where the content supports them, not by default.

## 5. Materials, each with its own process

- **Type:** the `thoughtfox-type` skill. It produces `TYPOGRAPHY.md`.
- **Colour:** the palette system in the toolkit's `playground/PALETTE-PLAN.md`:
  - colours (what the client has)
  - roles (the job a colour does)
  - schemes (a set of roles checked together)
  - combinations (one pair, with its contrast)

  Run the contrast check after every change. A failing pair gets reported with its ratio, the threshold and the smallest fix as an option; never change palette values or scheme mappings silently. `emil-color` covers the OKLCH and APCA mechanics.
- **Motion:** at most one page transition, chosen from the Segue bank (the toolkit's `tools/segue-bank/`), with a reduced-motion version that keeps a fade and drops movement. Small UI motion follows `emil-animations`. Never add scroll-triggered fade-ins by default.

## 6. Build in the house style

- CUBE CSS with Every Layout compositions, tokens from the JSON files (`npm run tokens`), Tachyons utility names (`pb1`, `mt2`, `lh-copy`, `ttu`), and blocks scoped in Svelte components. Read the site's `CLAUDE.md` for its layers.
- A site that uses `@thoughtfox/toolkit` customises it through tokens, roles, CSS variables and props, never by copying toolkit files. The toolkit has no look of its own.

## 7. Check

1. `npm run compare -- <site>` and look at every changed screenshot against what you meant to change.
2. An `emil-unslop-design` pass: what here would make a designer suspect a model built it?
3. `emil-ui-review` on the diff.
4. Before launch, `emil-prep-for-prod` on the whole site.

## Never

These are the generic AI-editorial look Rob has rejected on client work:

- cream paper with Cormorant Garamond and Inter
- tiny tracked uppercase eyebrow labels over every heading
- numbered 01–04 cards, "→" arrow links, an italic "Trusted by" strip
- invented headlines or taglines
- indigo or purple that the client's identity didn't supply, gradient text, glass cards, an emoji feature grid
- a centred hero with a pill badge and two buttons, when the content wanted something else
