# Segue bank audit

Roadmap step 6. This audit covers all 46 transitions in this folder. The verdicts were drafts for Rob to decide. The verdicts the package ships, with a one-line reason and the override for each tone-down, are in `motion/transitions/transitions.json`, and the playground's `/transitions` page shows them. The full audit record for each transition is the `audit` object in this folder's `transitions.json`: `duration`, `easing`, `reducedMotion`, `risks`, `verdict` and `note`.

**Result:** 0 keep, 15 tone down, 31 drop.

## How it was checked

- **The CSS.** I read every file for timing, easing, filters, masks, 3D and where the reduced-motion rules sit.
- **The frames.** I captured each transition in Chromium (headless, 800×560) at 40ms steps from the demo page, in three runs: forwards, backwards and reduced motion. The `measured` line in each entry comes from these frames. Each run was a same-page change from page 3 to page 4 of the demo.
- **Cross-page.** I spot-checked 8 transitions across a real navigation, then with the browser's Back button: Slide Left, Clock Wipe, Hinge Open, Deal In, Paint Over, Dots Radial, Grid Squares and Sprite Noise. All played, and segue.js tagged Back as `backwards`.
- **Not checked:** Safari, Firefox, real phones, and the frame-by-frame look in Lapse that the roadmap asks for. Do the Lapse pass on the shortlist only.

## What the bank has in common

- **Every transition is too long.** None is under 600ms as captured. The shortest take 800ms. 31 use the same 3-layer timing: an 800ms move with an 80ms gap between the lead band, the trail band and the new page, so 960ms in all. The longest are Framed Drift (1.75s), Framed Slide (1.55s), Card Flip and Cube Turn (1.5s each) and Pixel Burn (1.36s). This is why there are no plain "keep" verdicts: every possible keep needs a change to its timing.
- **The easing is good.** Most moves use ease-in-out cubic `cubic-bezier(0.65, 0, 0.35, 1)`. No transition overshoots or bounces. Pixel Burn is the only one that moves at a linear rate. Other transitions use `linear` only for a still hold or a short opacity fade.
- **Reduced motion passes in all 46.** Every animated rule is inside `@media (prefers-reduced-motion: no-preference)`. `@view-transition` is outside it, so reduced-motion users still get a crossfade. Since roadmap step 6, each file also ends with its own `prefers-reduced-motion: reduce` block: a 180ms opacity crossfade with no movement, forwards and back. Before, the fade was the browser's default (250ms). I checked all 46 in Chromium: with reduce, the only animations are the two fades; with no-preference, the animations are the same as before the block was added.
- **Going back.** 38 have a true reverse. The 8 without one replay the forward move: Clock Wipe, Fan Wipe, Swing, Dots Radial, Sprite Noise, Dither Dissolve, Pixel Burn and Sprite Shuffle. The reverse plays across pages only if segue.js is loaded, or if the SvelteKit `onNavigate` snippet sets the `backwards` type.
- **Demo colours.** The lead and trail colours are bright demo colours, such as neon cyan and magenta. On a client site, always set them to the site's palette.

## Shortlist for document-style sites

These are calm and quick once toned down, with a clean reduced-motion version. Pick one per site.

| Transition | Change | Total after | Why |
| --- | --- | --- | --- |
| **Slide Left** | Fix 1 + fix 2 | 460ms | A plain straight wipe. Its reverse plays on Back, so it gives a sense of page order without decoration. |
| **Slide Up** | Fix 1 + fix 2 | 460ms | The same as Slide Left, but vertical. It suits sites that read top to bottom, such as essays and case studies. |
| **Focus Pull** | `--segue-duration: 0.35s`, then regenerate in Segue with blur 4 and zoom 0.02 | 350ms | The nearest thing in the bank to a plain crossfade. It has no colour bands and no direction. |
| **Framed Cover** | `--segue-duration: 0.5s` | 500ms | One clear move, like a native app "push": the old page sinks back and the new page slides over it. It has a real reverse. |
| **Circle Pop** | Fix 1 + fix 2, and load segue.js | 460ms | It grows from the click, so the motion follows what the user did. Use it for a studio or portfolio site that can take a little more character. |

I checked the toned-down totals in Chromium with the overrides applied: Slide Left and Circle Pop 460ms, Framed Cover 500ms, Focus Pull 350ms.

## Summary table

"Back" means the transition plays in reverse on history back. The main risk for each transition is listed here. Each entry in `transitions.json` has the full list.

| Transition | Family | Total ms | Easing | Back | Main risk | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Slide Left | Slides | 960 | in-out | yes | Main-thread clip-path | tone down |
| Slide Right | Slides | 960 | in-out | yes | Main-thread clip-path | tone down |
| Slide Up | Slides | 960 | in-out | yes | Main-thread clip-path | tone down |
| Slide Down | Slides | 960 | in-out | yes | Main-thread clip-path | tone down |
| Diagonal Up | Slides | 960 | in-out | yes | Busier than a straight slide | tone down |
| Diagonal Down | Slides | 960 | in-out | yes | Busier than a straight slide | tone down |
| Stripes Horizontal | Stripes | 960 | in-out | yes | 27KB CSS | tone down |
| Stripes Vertical | Stripes | 960 | in-out | yes | 39KB CSS | tone down |
| Stripes Horizontal Alt | Stripes | 960 | in-out | yes | Random order flicker | drop |
| Stripes Vertical Alt | Stripes | 960 | in-out | yes | Random order flicker | drop |
| Stripes Diagonal | Stripes | 960 | in-out | yes | Busiest stripes; 66KB | drop |
| Blinds Horizontal | Blinds | 960 | in-out | yes | Strobe-like slats; 51KB | drop |
| Blinds Vertical | Blinds | 960 | in-out | yes | Strobe-like slats; 75KB | drop |
| Hinge Open | Hinges | 800 | in, in-out | yes | 3D swing, ~460ms wait | drop |
| Hinge Lift | Hinges | 800 | in, in-out | yes | 3D swing, ~460ms wait | drop |
| Circle Pop | Circles | 960 | in-out | yes | Needs segue.js for click origin | tone down |
| Circle Iris | Circles | 960 | in-out | yes | Cartoon iris-out | drop |
| Circle Corner | Circles | 960 | in-out | yes | Main-thread clip-path | tone down |
| Focus Pull | Focus | 800 | in-out | yes | 16px blur on full page | tone down |
| Diamond Iris | Polygons | 960 | in-out | yes | Strong graphic shape | drop |
| Arrow Right | Arrows | 960 | in-out | yes | Strong graphic shape | drop |
| Shutter | Splits | 960 | in-out | yes | Old page lingers in the middle | tone down |
| Doors | Splits | 960 | in-out | yes | Old page lingers in the middle | tone down |
| Framed Slide | Framed | 1550 | in-out | yes | 1.55s 3D reel | drop |
| Framed Drift | Framed | 1750 | in-out | yes | 1.75s 3D reel | drop |
| Framed Cover | Framed | 1100 | in-out | yes | 3D push, nothing new for 400ms | tone down |
| Quad Pinwheel | Pinwheels | 960 | in-out | yes | Four wipes at once | drop |
| Drop Away | Drops | 800 | in, in-out | yes | Page falls and rotates | drop |
| Clock Wipe | Radial | 960 | in-out | no | No reverse; 41KB | drop |
| Fan Wipe | Radial | 960 | in-out | no | No reverse; 40KB | drop |
| Swing | Radial | 960 | in-out | no | No reverse | drop |
| Zigzag Up | Edges | 960 | in-out | yes | Jagged edge; 57KB | drop |
| Wave Up | Edges | 960 | in-out | yes | 51KB CSS | tone down |
| Deal In | Deals | 800 | in-out, out | yes | Flies in and rotates | drop |
| Brush Lines | Brush | 960 | in-out | yes | 105KB CSS | drop |
| Paint Over | Paint | 1010 | in-out | yes | SVG markup, fixed timing | drop |
| Dots Radial | Cells | 1010 | in-out | no | 768 animated SVG rects; no reverse | drop |
| Dots Sweep | Cells | 1010 | in-out | yes | 768 animated SVG rects | drop |
| Grid Squares | Cells | 1010 | in-out | yes | 616 animated SVG rects | drop |
| Sprite Noise | Sprites | 960 | in-out | no | Stepped; no reverse | drop |
| Dither Dissolve | Sprites | 960 | in-out | no | Stepped; no reverse | drop |
| Dither Wipe | Sprites | 960 | in-out | yes | Stepped; 66KB | drop |
| Pixel Burn | Sprites | 1360 | linear | no | Linear, 1.36s, stepped | drop |
| Sprite Shuffle | Sprites | 960 | in-out | no | Colours baked in, confetti | drop |
| Card Flip | Turns | 1500 | in-out, in-out (sine) | yes | 1.5s 3D flip | drop |
| Cube Turn | Turns | 1500 | in-out, in-out (sine) | yes | 1.5s 3D turn | drop |

## Most common fixes

None of these fixes edits a transition file. Put each one in the site's own CSS, after the transition import, as the README says.

### 1. Shorten the 3-layer wipes (needed by 13 of the 15 tone-downs)

```css
:root {
  --segue-duration: 0.4s;
  --segue-gap: 0.03s;   /* thinner bands; total = duration + 2 × gap = 460ms */
  --segue-ease: cubic-bezier(0.22, 1, 0.36, 1); /* ease-out: quick start, soft landing */
}
```

To get a plain wipe with no visible bands, set `--segue-gap: 0s`.

### 2. Use the site's colours (all wipes)

```css
:root {
  --segue-lead-color: var(--surface);
  --segue-trail-color: var(--primary);
}
```

`--surface` and `--primary` are the role names the token generator writes. The overrides in `motion/transitions/transitions.json` use them.

Sprite Shuffle can't take this fix, because its colours are baked into the sprite images.

### 3. Reduced-motion fade (done in every file)

Each file now ends with a `prefers-reduced-motion: reduce` block that gives a 180ms opacity crossfade and nothing else. A site doesn't need to add anything. To change the length:

```css
:root {
  --segue-fade-duration: 200ms;
}
```

### 4. Regenerate when the timing or shape is baked in

These values can't be changed with a custom property. Change them in Segue's Tune panel and copy the new CSS:

- Focus Pull: the blur and zoom.
- Stripes: the number of stripes. Use 3–4 for a calmer version.
- Paint Over and the Cells family: all of their timing.
- Sprites: the frame count.

### 5. Load segue.js for Back

Without segue.js, or the `onNavigate` snippet in SvelteKit, cross-page Back plays the forward move. This matters most for the slides, where the direction tells the reader where they are.

## Risks behind the drops

- **Too long to tone down:** the Framed reels and the Turns (1.5–1.75s, in three or four phases). Cut to 600ms, they would feel rushed.
- **Heavy to render:** the Cells family animates 616–768 SVG rects inside full-page masks. It also needs about 100KB of markup on every page. Focus Pull's 16px blur on two full-page snapshots is the most expensive filter in the bank, which is why its fix cuts the blur to 4px.
- **Heavy CSS on every page:** Brush Lines (105KB), Blinds Vertical (75KB), Dither Wipe (66KB) and Stripes Diagonal (66KB). The generated geometry loads on every page, even though it is used only during the transition.
- **Main thread:** every clip-path wipe animates `@property` numbers. These run on the main thread, so they can stutter while a SvelteKit page hydrates. This also applies to the shortlist. Check it on a real phone during the Lapse pass.
- **Content hidden:** Hinge Open and Hinge Lift keep the new page small and dimmed for about 460ms. Framed Cover shows nothing new for 400ms, but its fix cuts this to about 180ms. Card Flip is edge-on and unreadable at its midpoint, with about 93% of the screen in the lead colour. Focus Pull's text is unreadable for about 280ms at 800ms, and for much less at 350ms.
- **Browser support:** the wipes need `clip-path: shape()` (Chrome/Edge 135+, Safari 18.4+). Older browsers get an instant cut. The four SVG-mask transitions worked across pages in Chromium, but I did not check them in Safari.

## Demo fix

`demo/index.html`: the "Next page (cross-document)" link now keeps `&t=<slug>`. Before this fix, a transition chosen from the URL (`?t=…`), or chosen with storage blocked, became Slide Left on the next page. That made cross-page testing silently wrong. This is a one-line change. `demo/catalogue.js` was not regenerated, because the demo does not read the audit data.
