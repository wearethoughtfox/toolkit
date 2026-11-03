#!/usr/bin/env node
/**
 * Moved to tokens/generate-tokens.js in v0.2.0. This file stays so that
 * v0.1.0 sites keep working without changes:
 *   "tokens": "node node_modules/@thoughtfox/toolkit/scripts/generate-tokens.js"
 *   import { generateTokens } from '@thoughtfox/toolkit/scripts/generate-tokens.js';
 */

import { realpathSync } from 'fs';
import { pathToFileURL } from 'url';
import { generateTokens } from '../tokens/generate-tokens.js';

export * from '../tokens/generate-tokens.js';

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  generateTokens();
}
