/**
 * The playground's token run: the package's generator, with the variable
 * check also covering the toolkit folders the playground uses.
 * Run: npm run tokens
 * Also called by Vite on dev/build start, and by the /type lab's save.
 */

import { realpathSync } from 'fs';
import { pathToFileURL } from 'url';
import { generateTokens as generate } from '@thoughtfox/toolkit/tokens/generate-tokens.js';

export const checkedDirs = ['src', '../layout', '../palette', '../shared', '../type'];

export function generateTokens() {
  generate({ checkVars: checkedDirs });
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) generateTokens();
