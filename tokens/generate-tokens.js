#!/usr/bin/env node
/**
 * Reads JSON design tokens and writes CSS custom properties.
 *
 * Paths resolve from the consuming project's root (process.cwd()):
 *   input:  src/lib/design-tokens/*.json
 *   output: src/lib/css/global/_tokens.generated.css
 *
 * More output switches on when the token files ask for it, so a site that
 * doesn't use a feature gets exactly what v0.1.0 wrote:
 *
 *   spacing.json items have a `step`   → Tachyons spacing utilities
 *                                         (src/lib/css/utilities/_spacing.generated.css)
 *   colors.json has colors/roles/schemes → roles, [data-scheme] blocks, and
 *                                         the undefined-variable check over src/
 *
 * Pass a path to move an output, or false to turn it off. checkVars takes
 * the folders to scan (default: src):
 *   generateTokens({ spacingOutput: false, checkVars: ['src', '../shared'] })
 *
 * Run from a site root:  npm run tokens
 *   ("tokens": "node node_modules/@thoughtfox/toolkit/tokens/generate-tokens.js")
 *
 * Or call from vite.config.js so tokens regenerate on dev/build start:
 *   import { generateTokens } from '@thoughtfox/toolkit/tokens/generate-tokens.js';
 *   plugins: [{ name: 'tokens', buildStart: () => generateTokens() }]
 */

import { readFileSync, writeFileSync, realpathSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { checkVars as runCheckVars } from './check-vars.js';

// Tachyons spacing prefixes → logical properties
const spacingProperties = {
  pa: 'padding',
  pv: 'padding-block',
  ph: 'padding-inline',
  pt: 'padding-block-start',
  pb: 'padding-block-end',
  pl: 'padding-inline-start',
  pr: 'padding-inline-end',
  ma: 'margin',
  mv: 'margin-block',
  mh: 'margin-inline',
  mt: 'margin-block-start',
  mb: 'margin-block-end',
  ml: 'margin-inline-start',
  mr: 'margin-inline-end'
};

export function toKebab(name) {
  return name
    .toLowerCase()
    .replace(/\s+-\s+/g, '-')   // "XS - L" → "xs-l"
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');        // collapse any double dashes
}

export function clampGenerator(tokens, viewports) {
  const rootSize = 16;
  const minViewport = viewports.min / rootSize;
  const maxViewport = viewports.max / rootSize;

  return tokens.map(({ name, min, max }) => {
    if (min === max) {
      return { name, value: `${min / rootSize}rem` };
    }
    const minRem = min / rootSize;
    const maxRem = max / rootSize;
    const slope = (maxRem - minRem) / (maxViewport - minViewport);
    const intersection = -1 * minViewport * slope + minRem;
    return {
      name,
      value: `clamp(${minRem}rem, ${intersection.toFixed(2)}rem + ${(slope * 100).toFixed(2)}vw, ${maxRem}rem)`
    };
  });
}

/** v0.1.0 colors.json: { items: [{ name, value }] }. Roles format: { colors, roles, schemes }. */
export function usesRoles(colors) {
  return !Array.isArray(colors.items);
}

/**
 * colors.json (roles format) has three parts: colors (name → hex), roles
 * (role → colour name) and schemes (scheme → { role → colour name }).
 * Every reference is checked here; any bad one stops the build.
 */
export function validateColors({ colors, roles, schemes }) {
  const errors = [];
  const namePattern = /^[a-z][a-z0-9-]*$/;
  const hexPattern = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

  if (!colors || typeof colors !== 'object') errors.push('missing "colors" object');
  if (!roles || typeof roles !== 'object') errors.push('missing "roles" object');
  if (errors.length) return errors;

  for (const [name, hex] of Object.entries(colors)) {
    if (!namePattern.test(name)) errors.push(`colors.${name}: name must be lowercase kebab-case`);
    if (!hexPattern.test(hex)) errors.push(`colors.${name}: "${hex}" is not a hex colour`);
  }

  for (const [role, color] of Object.entries(roles)) {
    if (!namePattern.test(role)) errors.push(`roles.${role}: name must be lowercase kebab-case`);
    if (!(color in colors)) errors.push(`roles.${role}: unknown colour "${color}"`);
  }

  for (const [scheme, overrides] of Object.entries(schemes ?? {})) {
    if (!namePattern.test(scheme)) errors.push(`schemes.${scheme}: name must be lowercase kebab-case`);
    if (scheme === 'default') errors.push('schemes.default: reserved — the default scheme is "roles"');
    for (const [role, color] of Object.entries(overrides)) {
      if (!(role in roles)) errors.push(`schemes.${scheme}.${role}: unknown role (add it to "roles" first)`);
      if (!(color in colors)) errors.push(`schemes.${scheme}.${role}: unknown colour "${color}"`);
    }
  }

  return errors;
}

/**
 * Raw colours and roles go inside :root. Schemes are written as separate
 * [data-scheme] blocks. Each scheme lists every role, so a scheme nested
 * inside another one doesn't pick up its parent's colours.
 */
function roleColorLines({ colors, roles, schemes = {} }) {
  const root = ['\n  /* Colors — the palette. Only roles and schemes should use these */'];
  for (const [name, hex] of Object.entries(colors)) {
    root.push(`  --color-${name}: ${hex};`);
  }

  root.push('\n  /* Roles — what each colour does. Components use these */');
  for (const [role, color] of Object.entries(roles)) {
    root.push(`  --${role}: var(--color-${color});`);
  }

  const after = [
    '\n/* Schemes — put data-scheme="name" on a section to switch its colours */',
    ':where([data-scheme]) {\n  background: var(--surface);\n  color: var(--text);\n}'
  ];
  for (const [scheme, overrides] of Object.entries({ default: {}, ...schemes })) {
    after.push(`\n[data-scheme="${scheme}"] {`);
    for (const role of Object.keys(roles)) {
      after.push(`  --${role}: var(--color-${overrides[role] ?? roles[role]});`);
    }
    after.push('}');
  }

  return { root, after };
}

// v0.1.0 colours: one --color-* per item, nothing else
function itemColorLines({ items }) {
  const root = ['\n  /* Colors */'];
  for (const { name, value } of items) {
    root.push(`  --color-${toKebab(name)}: ${value};`);
  }
  return { root, after: [] };
}

/**
 * pa0–pa6 / mt0–mt6 etc. from each token's `step`, plus a named
 * class for every token (pa-m, mt-xs-l).
 */
export function spacingUtilitiesCss(spacing) {
  const sizes = [{ suffix: '0', value: '0' }];
  const numbered = spacing.items
    .filter((item) => item.step !== undefined)
    .sort((a, b) => a.step - b.step);
  for (const { name, step } of numbered) {
    sizes.push({ suffix: String(step), value: `var(--space-${toKebab(name)})` });
  }
  for (const { name } of spacing.items) {
    sizes.push({ suffix: `-${toKebab(name)}`, value: `var(--space-${toKebab(name)})` });
  }

  const lines = [
    '/* AUTO-GENERATED — do not edit. Run `npm run tokens` to regenerate.',
    '   Tachyons-style spacing mapped onto the --space-* tokens.',
    '   Numbered steps come from `step` in spacing.json. */'
  ];

  for (const [prefix, property] of Object.entries(spacingProperties)) {
    lines.push('');
    for (const { suffix, value } of sizes) {
      lines.push(`.${prefix}${suffix} { ${property}: ${value}; }`);
    }
  }

  lines.push('');
  lines.push('.ml-auto { margin-inline-start: auto; }');
  lines.push('.mr-auto { margin-inline-end: auto; }');

  return lines.join('\n') + '\n';
}

// undefined → decided by the token files; false → off; anything else → use it
function pick(option, auto, fallback) {
  if (option === false) return false;
  if (option !== undefined) return option;
  return auto ? fallback : false;
}

export function generateTokens({
  tokensDir = join(process.cwd(), 'src/lib/design-tokens'),
  output = join(process.cwd(), 'src/lib/css/global/_tokens.generated.css'),
  spacingOutput,
  checkVars
} = {}) {
  const readToken = (filename) => JSON.parse(readFileSync(join(tokensDir, filename), 'utf-8'));

  const viewports = readToken('viewports.json');
  const colors = readToken('colors.json');
  const spacing = readToken('spacing.json');
  const textSizes = readToken('text-sizes.json');
  const leading = readToken('text-leading.json');
  const weights = readToken('text-weights.json');
  const fonts = readToken('fonts.json');

  const roles = usesRoles(colors);
  if (roles) {
    const colorErrors = validateColors(colors);
    if (colorErrors.length) {
      throw new Error(
        `colors.json has ${colorErrors.length} problem(s):\n  - ${colorErrors.join('\n  - ')}`
      );
    }
  }
  const colorCss = roles ? roleColorLines(colors) : itemColorLines(colors);

  const lines = [
    '/* AUTO-GENERATED — do not edit. Run `npm run tokens` to regenerate. */',
    ':root {'
  ];

  // Colors (and roles)
  lines.push(...colorCss.root);

  // Spacing (fluid clamp values)
  lines.push('\n  /* Spacing */');
  for (const { name, value } of clampGenerator(spacing.items, viewports)) {
    lines.push(`  --space-${toKebab(name)}: ${value};`);
  }

  // Type sizes (fluid clamp values)
  lines.push('\n  /* Type sizes */');
  for (const { name, value } of clampGenerator(textSizes.items, viewports)) {
    // "Step 000" → "step-000", "Step 0" → "step-0"
    lines.push(`  --size-${toKebab(name)}: ${value};`);
  }

  // Leading
  lines.push('\n  /* Leading */');
  for (const { name, value } of leading.items) {
    lines.push(`  --leading-${toKebab(name)}: ${value};`);
  }

  // Font weights
  lines.push('\n  /* Font weights */');
  for (const { name, value } of weights.items) {
    lines.push(`  --font-weight-${toKebab(name)}: ${value};`);
    // Short aliases used in global-styles.css
    lines.push(`  --font-${toKebab(name)}: ${value};`);
  }

  // Font stacks
  lines.push('\n  /* Font stacks */');
  for (const { name, value } of fonts.items) {
    lines.push(`  --font-${toKebab(name)}: ${value};`);
  }

  lines.push('}');

  // Schemes (outside :root)
  lines.push(...colorCss.after);

  writeFileSync(output, lines.join('\n') + '\n');
  console.log('✓ tokens generated →', output);

  const spacingPath = pick(
    spacingOutput,
    spacing.items.some((item) => item.step !== undefined),
    join(process.cwd(), 'src/lib/css/utilities/_spacing.generated.css')
  );
  if (spacingPath) {
    writeFileSync(spacingPath, spacingUtilitiesCss(spacing));
    console.log('✓ spacing utilities generated →', spacingPath);
  }

  const checkDirs = pick(checkVars, roles, 'src');
  if (checkDirs) runCheckVars({ srcDir: checkDirs });
}

// Run when executed directly (node .../generate-tokens.js), but not when
// imported from vite.config.js.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  generateTokens();
}
