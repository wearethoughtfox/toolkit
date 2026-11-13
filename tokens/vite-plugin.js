/**
 * Vite plugin: generate the design tokens at build start and regenerate
 * them in dev whenever a token file changes, appears or disappears.
 *
 *   // vite.config.js
 *   import { tokensPlugin } from '@thoughtfox/toolkit/tokens/vite-plugin.js';
 *   plugins: [tokensPlugin(), sveltekit()]
 *
 * Options are the generateTokens() options (clampPrecision, output, …),
 * plus:
 *   root      project root (default: Vite's root)
 *   tokensDir token folder (default: <root>/src/lib/design-tokens)
 *   debounce  ms to wait for a burst of saves to settle (default 50)
 *   generate  the function to run (default: generateTokens); for tests
 *
 * What it watches: .json files inside tokensDir, and nothing else. Outputs
 * are never watched, and the generator leaves a file alone when its content
 * would not change, so a regeneration cannot trigger itself.
 *
 * A failure in dev is reported (terminal and browser overlay) and the dev
 * server keeps running; saving a fixed file recovers. A failure at build
 * start stops the build.
 */

import { basename, extname, isAbsolute, relative, resolve } from 'path';
import { generateTokens } from './generate-tokens.js';

const NAME = 'thoughtfox-tokens';
const OUTPUT_OPTIONS = ['output', 'spacingOutput', 'typographyOutput', 'contrastOutput'];
const EVENTS = ['add', 'change', 'unlink'];

export function tokensPlugin({ debounce = 50, generate = generateTokens, ...options } = {}) {
  let root = options.root;
  let timer;
  let failed = false;
  let server;
  let listener;

  const tokensDir = () => resolve(root, options.tokensDir ?? 'src/lib/design-tokens');
  const run = () => generate({ ...options, root });

  function isTokenFile(file) {
    if (extname(file) !== '.json' || basename(file).includes('.generated.')) return false;
    const path = resolve(root, file);
    const outputs = OUTPUT_OPTIONS.map((key) => options[key]).filter((value) => typeof value === 'string');
    if (outputs.some((output) => resolve(root, output) === path)) return false;
    const inside = relative(tokensDir(), path);
    return inside !== '' && !inside.startsWith('..') && !isAbsolute(inside);
  }

  function regenerate() {
    try {
      run();
    } catch (error) {
      failed = true;
      const message = `Token generation failed: ${error.message}`;
      server.config.logger.error(`[${NAME}] ${message}`, { timestamp: true });
      server.ws.send({
        type: 'error',
        err: { message, stack: error.stack ?? '', plugin: NAME }
      });
      return;
    }
    if (failed) {
      failed = false;
      server.config.logger.info(`[${NAME}] tokens regenerated`, { timestamp: true });
      // The outputs may be byte-identical to the last good run, which sends
      // no update to the browser; a reload clears the error overlay.
      server.ws.send({ type: 'full-reload' });
    }
  }

  return {
    name: NAME,

    configResolved(config) {
      root = resolve(options.root ?? config.root);
    },

    buildStart() {
      run();
    },

    configureServer(devServer) {
      server = devServer;
      server.watcher.add(tokensDir());
      listener = (file) => {
        if (!isTokenFile(file)) return;
        clearTimeout(timer);
        timer = setTimeout(regenerate, debounce);
      };
      for (const event of EVENTS) server.watcher.on(event, listener);
    },

    closeBundle() {
      clearTimeout(timer);
      if (server && listener) {
        for (const event of EVENTS) server.watcher.off(event, listener);
      }
    }
  };
}
