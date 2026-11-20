/**
 * Options for `npm run tokens`, so the command line and vite.config.js can
 * never generate different CSS from the same token files.
 *
 * A site with options keeps them in one file at its root:
 *
 *   // tokens.config.js
 *   export default { clampPrecision: 4 };
 *
 *   // vite.config.js
 *   import tokenOptions from './tokens.config.js';
 *   plugins: [tokensPlugin(tokenOptions), sveltekit()]
 *
 * `npm run tokens` reads the same file by itself. A named `tokenOptions`
 * export works too. Flags on the command line win over the file:
 *
 *   npm run tokens -- --clamp-precision=4
 *
 * A site with neither gets the defaults, exactly as before.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

const CONFIG_FILES = ['tokens.config.js', 'tokens.config.mjs'];

export function parseTokenArgs(argv = []) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const [flag, inline] = arg.split('=');
    if (flag !== '--clamp-precision') {
      throw new Error(`Unknown option ${arg}. The only one is --clamp-precision=<0-10>`);
    }
    const raw = inline ?? argv[++i];
    const value = Number(raw);
    if (raw === undefined || raw === '' || !Number.isInteger(value)) {
      throw new Error(`--clamp-precision needs a whole number, got ${JSON.stringify(raw)}`);
    }
    options.clampPrecision = value;
  }
  return options;
}

export async function loadTokenConfig(root = process.cwd()) {
  for (const name of CONFIG_FILES) {
    const path = join(root, name);
    if (!existsSync(path)) continue;
    const module = await import(pathToFileURL(path).href);
    const options = module.default ?? module.tokenOptions;
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      throw new Error(`${name} must export the options object, as its default export or as tokenOptions`);
    }
    return options;
  }
  return {};
}

export async function loadTokenOptions({ root = process.cwd(), argv = [] } = {}) {
  return { ...(await loadTokenConfig(root)), ...parseTokenArgs(argv) };
}
