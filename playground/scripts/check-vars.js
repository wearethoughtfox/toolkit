/**
 * Warns about custom properties that are used but never defined, e.g. a
 * var(--color-primary) left over from an old palette. An undefined var()
 * makes its property act as `unset`, so the mistake is silent in the browser.
 *
 * var(--x, fallback) is skipped: a fallback means the gap is intentional.
 * Run: npm run check:vars   (also runs with npm run tokens)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join, relative, extname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcDir = join(root, 'src');
const extensions = new Set(['.css', '.svelte', '.js']);

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return extensions.has(extname(name)) ? [path] : [];
  });
}

/**
 * Blank out CSS comments (keeping line breaks, so line numbers stay right).
 * Only in CSS: in markup or JS, text like "tokens/*.json" isn't a comment.
 */
function stripCssComments(text, ext) {
  const blank = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  if (ext === '.css') return blank(text);
  if (ext === '.svelte') return text.replace(/<style[\s\S]*?<\/style>/g, blank);
  return text;
}

export function findUndefinedVars() {
  const defined = new Set();
  const used = [];

  for (const file of files(srcDir)) {
    const text = stripCssComments(readFileSync(file, 'utf-8'), extname(file));
    // Declarations (--x: …), including inline style="--x: …", and Svelte style:--x={…}
    for (const [, name] of text.matchAll(/(--[a-z0-9-]+)\s*:/gi)) defined.add(name);
    for (const [, name] of text.matchAll(/style:(--[a-z0-9-]+)/gi)) defined.add(name);

    text.split('\n').forEach((line, i) => {
      for (const [, name, fallback] of line.matchAll(/var\(\s*(--[a-z0-9-]+)\s*(,)?/gi)) {
        if (!fallback) used.push({ name, file: relative(root, file), line: i + 1 });
      }
    });
  }

  const missing = new Map();
  for (const use of used.filter((u) => !defined.has(u.name))) {
    if (!missing.has(use.name)) missing.set(use.name, []);
    missing.get(use.name).push(`${use.file}:${use.line}`);
  }
  return missing;
}

export function checkVars() {
  const missing = findUndefinedVars();
  if (!missing.size) {
    console.log('✓ no undefined custom properties');
    return missing;
  }
  console.warn(`⚠ ${missing.size} custom properties are used but never defined:`);
  for (const [name, places] of missing) {
    console.warn(`    ${name} (${places.length}×): ${places.join(', ')}`);
  }
  return missing;
}

// Run directly: node scripts/check-vars.js
if (import.meta.url === pathToFileURL(process.argv[1]).href) checkVars();
