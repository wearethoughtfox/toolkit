# Utility renames — old names → Tachyons names

The text utilities switched to Tachyons names. Use this list to update older projects built from this starter.

| Old class | New class | Notes |
|---|---|---|
| `.font-regular` | `.normal` or `.fw4` | |
| `.font-medium` | `.fw5` | |
| `.font-bold` | `.b` or `.fw7` | |
| `.font-black` | `.fw9` | |
| `.leading-micro` | `.lh-micro` | 0.85 — not in Tachyons, kept |
| `.leading-flat` | `.lh-solid` | 1 |
| `.leading-fine` | `.lh-title` | 1.2 |
| `.leading-standard` | `.lh-copy` | 1.55 |
| `.leading-loose` | `.lh-loose` | 1.7 — not in Tachyons, kept |
| `.uppercase` | `.ttu` | Still adds `--uppercase-kerning` |
| `.text-center` | `.tc` | |
| `.text-right` | `.tr` | Still `text-align: end` |
| `.truncate` | `.truncate` | Unchanged |

Only the class names changed. Custom properties (`--font-bold`, `--leading-fine`, `--uppercase-kerning`) are the same, so `var(...)` in scoped styles needs no changes.

## Checking a repo

Run from the repo root to find old class names in markup:

```bash
grep -rnwE 'font-(regular|medium|bold|black)|leading-(micro|flat|fine|standard|loose)|uppercase|text-(center|right)' src --include='*.svelte' --include='*.html' | grep -v 'var(--\|text-transform'
```

Then replace `src/lib/css/utilities/text.css` with this starter's version and copy across `widths.css`, `debug.css`, the updated `scripts/generate-tokens.js`, `spacing.json` (`step` fields and the 2XS token) and the new variables in `variables.css`. Also `npm install -D modern-normalize` and add `@import 'modern-normalize/modern-normalize.css';` as the first line of `app.css`.

### Status (checked 15 Oct 2026)

| Repo | Old classes in markup | Old `text.css` |
|---|---|---|
| ashbright-site | none | yes — replace |
| clubs-site | none | yes — replace |
| wearethoughtfox-site | none | no |

## New in this version

- **Spacing:** `pa ph pv pt pb pl pr` / `ma mh mv mt mb ml mr`, with numbers `0–6` (`pb1`, `mt2`, `mv3`, `ph5`) or token names (`pa-m`, `mt-xs-l`). Generated from `spacing.json`.
- **Tracking:** `.tracked`, `.tracked-tight`, `.tracked-mega`
- **Transform:** `.ttc`, `.ttl`, `.ttn`, `.small-caps`
- **Align:** `.tl`, `.tj`
- **Widths:** `.w1–.w5`, `.w-10–.w-100`, `.w-third`, `.w-two-thirds`, `.w-auto`, `.mw-100`, `.mw-none`, `.measure`, `.measure-narrow`, `.measure-wide`
- **Misc:** `.i`, `.fs-normal`, `.nowrap`, `.debug`, `.debug-grid`
