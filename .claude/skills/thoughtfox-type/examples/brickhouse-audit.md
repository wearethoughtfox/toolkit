# Brick House: type audit (test run of `thoughtfox-type`)

A test of the skill on a real site, read from the code (`brickhouse-site/src/lib/design-tokens`, `global-styles.css`, `Prose.svelte`). Nothing in the site has been changed. The numbers are calculated from the tokens, not measured in a browser.

## Aims

There's no brief with aims for Brick House, so the skill's first step stops here. These are drafted from the October port and are **placeholders until Rob confirms them**:

- **The client's own:** their gold, the logo grey and Georgia, as on the Jekyll site.
- **Craft and care:** a conservation studio; the type should feel considered, not decorated.
- **Lightness:** no web fonts to load (the current deliberate choice).

## Roles and faces

| Role | Face now | Notes |
| --- | --- | --- |
| Headings h1–h3, site name | Georgia | Client's font, kept from the Jekyll site |
| Body, interface, captions | System sans (`-apple-system` first) | Renders as SF on Apple, Segoe on Windows, Roboto on Android |
| Long reading (`Prose`) | System sans at weight 300 | |

## Findings

**1. Georgia is set at display sizes, which Chimero names as its weak spot.** In post 02 he finds Georgia blunt and dull above 18px, because its forms were simplified for 1990s low-resolution screens. Brick House sets it from 22px (h3, mobile) to 68px (h1, wide). It's the client's font, so it stays unless Rob decides otherwise. Options, smallest first:
- Keep it, and tighten the h1 and h2 tracking a little more at large sizes.
- Use Georgia only up to h3 and set h1 and h2 in a related display design, such as Carter's Miller. That has a licence cost (Chimero notes its webfont licence is billed yearly), and it ends the "no web fonts" aim.

**2. The body face changes with the visitor's platform.** The system stack means the text's atmosphere is SF, Segoe or Roboto depending on the device. That suits the lightness aim, but nobody can test "running text in the client's face", because there are three of them. Worth a conscious yes from Rob.

**3. Long reading is set light and loose.** `Prose` uses weight 300 at line-height 1.65 (28.9px at 17.5px; 33.8px at 20.5px). That's the light-colour end Chimero thinks is overused on screens, and a 300 weight with the system stack makes it lighter still. Possible fix: 400 weight at 28px on mobile and 32px on wide screens (about 1.6 and 1.56).

**4. Line heights are off the 4px grid.**

| Step | 330px wide | 700px | 1350px |
| --- | --- | --- | --- |
| 0 (body UI) | 16 / 24.8 | 16.7 / 25.9 | 18 / 27.9 |
| 1 (prose) | 17.5 / 28.9 | 18.6 / 30.7 | 20.5 / 33.8 |
| 3 (h3) | 22 / 24.2 | 24.5 / 27.0 | 29 / 31.9 |
| 5 (h2) | 30 / 33 | 37.3 / 41 | 50 / 55 |
| 6 (h1) | 36 / 39.6 | 47.6 / 52.4 | 68 / 74.8 |

Every heading shares `line-height: 1.1`, and body text uses the global 1.55. The smallest fix is per-role line heights that land on 24/28 (body) and 28/32 (prose), with the headings rounded to 4px at both ends. That's a change to global tokens, so it needs Rob's go-ahead.

**5. Body text grows all the way to 1350px.** The fluid range runs 330→1350, so prose is about 18.6px at 700px and only reaches 20.5px on wide screens. Chimero would set the size at the 320 and 700 boxes and stop at a breakpoint around 600px. The generator can't end type at `viewports.mid` yet. Flagged for the type lab (roadmap step 3).

**6. The scale is within limits.** It uses seven steps (00, 0, 1, 2, 3, 5, 6). The weak spot is body UI (16) next to prose (17.5) on mobile: two body sizes 1.5px apart read as one size set inconsistently. Either merge them, or separate them clearly by weight or face.

**7. What's already good:** `text-wrap` isn't the issue here, the measure is capped (`--measure: 64ch`), and the sizes stop at seven.

## What the test showed about the skill

- The skill had no branch for **auditing an existing site**: it assumed a new choice of faces. It's now added. In audit mode it measures the current setup against the rules and lists findings with the smallest fixes, and it doesn't propose new faces unless one fails a test.
- Without a brief, step 1 had nothing to cite. The skill should allow placeholder aims for audits, marked as such. This is now added too.
- The 4px rule needs numbers at both ends of the fluid range to be checkable. The table above is now part of the required output.
