#!/usr/bin/env node
/**
 * Reads JSON design tokens and writes _tokens.generated.css
 *
 * Paths resolve from the consuming project's root (process.cwd()):
 *   input:  src/lib/design-tokens/*.json
 *   output: src/lib/css/global/_tokens.generated.css
 *
 * Run from a site root:  npm run tokens
 *   ("tokens": "node node_modules/@thoughtfox/toolkit/scripts/generate-tokens.js")
 *
 * Or call from vite.config.js so tokens regenerate on dev/build start:
 *   import { generateTokens } from '@thoughtfox/toolkit/scripts/generate-tokens.js';
 *   plugins: [{ name: 'tokens', buildStart: () => generateTokens() }]
 */

import { readFileSync, writeFileSync, realpathSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

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

export function generateTokens({
  tokensDir = join(process.cwd(), 'src/lib/design-tokens'),
  output = join(process.cwd(), 'src/lib/css/global/_tokens.generated.css')
} = {}) {
  const readToken = (filename) => JSON.parse(readFileSync(join(tokensDir, filename), 'utf-8'));

  const viewports = readToken('viewports.json');
  const colors = readToken('colors.json');
  const spacing = readToken('spacing.json');
  const textSizes = readToken('text-sizes.json');
  const leading = readToken('text-leading.json');
  const weights = readToken('text-weights.json');
  const fonts = readToken('fonts.json');

  const lines = [
    '/* AUTO-GENERATED — do not edit. Run `npm run tokens` to regenerate. */',
    ':root {'
  ];

  // Colors
  lines.push('\n  /* Colors */');
  for (const { name, value } of colors.items) {
    lines.push(`  --color-${toKebab(name)}: ${value};`);
  }

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

  writeFileSync(output, lines.join('\n') + '\n');
  console.log('✓ tokens generated →', output);
}

// Run when executed directly (node .../generate-tokens.js or the toolkit-tokens bin),
// but not when imported from vite.config.js.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  generateTokens();
}
