/**
 * Reads JSON design tokens and writes _tokens.generated.css
 * plus the Tachyons-style spacing utilities in _spacing.generated.css
 * Run: npm run tokens
 * Also called automatically by Vite on dev/build start.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { generateContrast } from './contrast.js';
import { checkVars } from './check-vars.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokensDir = join(__dirname, '../src/lib/design-tokens');
const outputPath = join(__dirname, '../src/lib/css/global/_tokens.generated.css');
const spacingOutputPath = join(__dirname, '../src/lib/css/utilities/_spacing.generated.css');

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

function readToken(filename) {
  return JSON.parse(readFileSync(join(tokensDir, filename), 'utf-8'));
}

function toKebab(name) {
  return name
    .toLowerCase()
    .replace(/\s+-\s+/g, '-')   // "XS - L" → "xs-l"
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');        // collapse any double dashes
}

function clampGenerator(tokens, viewports) {
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

/**
 * colors.json has three parts: colors (name → hex), roles (role → colour
 * name) and schemes (scheme → { role → colour name }). Every reference is
 * checked here; any bad one stops the build.
 */
function validateColors({ colors, roles, schemes }) {
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
function colorLines({ colors, roles, schemes = {} }) {
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

export function generateTokens() {
  const viewports = readToken('viewports.json');
  const colors = readToken('colors.json');
  const spacing = readToken('spacing.json');
  const textSizes = readToken('text-sizes.json');
  const leading = readToken('text-leading.json');
  const weights = readToken('text-weights.json');
  const fonts = readToken('fonts.json');

  const colorErrors = validateColors(colors);
  if (colorErrors.length) {
    throw new Error(
      `colors.json has ${colorErrors.length} problem(s):\n  - ${colorErrors.join('\n  - ')}`
    );
  }
  const colorCss = colorLines(colors);

  const lines = [
    '/* AUTO-GENERATED — do not edit. Run `npm run tokens` to regenerate. */',
    ':root {'
  ];

  // Colors and roles
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
    const key = toKebab(name).replace('step-', 'step-');
    lines.push(`  --size-${key}: ${value};`);
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

  writeFileSync(outputPath, lines.join('\n') + '\n');
  console.log('✓ tokens generated →', outputPath);

  generateSpacingUtilities(spacing);
  generateContrast();
  checkVars();
}

/**
 * pa0–pa6 / mt0–mt6 etc. from each token's `step`, plus a named
 * class for every token (pa-m, mt-xs-l).
 */
function generateSpacingUtilities(spacing) {
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

  writeFileSync(spacingOutputPath, lines.join('\n') + '\n');
  console.log('✓ spacing utilities generated →', spacingOutputPath);
}

// Run directly: node scripts/generate-tokens.js (Vite calls generateTokens itself)
if (import.meta.url === pathToFileURL(process.argv[1]).href) generateTokens();
