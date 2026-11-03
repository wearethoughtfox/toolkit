/**
 * The playground's token run: the package's generator, then the steps for
 * the /type and /palette labs, which still live here.
 * Run: npm run tokens
 * Also called automatically by Vite on dev/build start.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { pathToFileURL } from 'url';
import { join } from 'path';
import { generateTokens as generatePackageTokens } from '@thoughtfox/toolkit/tokens/generate-tokens.js';
import { checkVars } from '@thoughtfox/toolkit/tokens/check-vars.js';
import { generateContrast } from './contrast.js';
import { typographyCss } from '../src/lib/type/css.js';
import { typographyErrors, typographyWarnings } from '../src/lib/type/checks.js';

const tokensDir = join(process.cwd(), 'src/lib/design-tokens');
const typeOutputPath = join(process.cwd(), 'src/lib/css/global/_type.generated.css');

function readToken(filename) {
  return JSON.parse(readFileSync(join(tokensDir, filename), 'utf-8'));
}

// The toolkit CSS and components the playground uses are checked too
export const checkedDirs = ['src', '../layout', '../type/utilities'];

export function generateTokens() {
  generatePackageTokens({ checkVars: false });
  generateTypography(readToken('viewports.json'));
  generateContrast();
  checkVars({ srcDir: checkedDirs });
}

/**
 * typography.json (from the /type lab) → --type-* custom properties.
 * Bad structure stops the build; departures from the method are warnings.
 * Without the file, an empty stylesheet keeps the import in variables.css working.
 */
function generateTypography(viewports) {
  if (!existsSync(join(tokensDir, 'typography.json'))) {
    writeFileSync(typeOutputPath, '/* AUTO-GENERATED — no typography.json yet. Make one in the /type lab. */\n');
    return;
  }
  const typography = readToken('typography.json');
  const errors = typographyErrors(typography);
  if (errors.length) {
    throw new Error(`typography.json has ${errors.length} problem(s):\n  - ${errors.join('\n  - ')}`);
  }
  writeFileSync(typeOutputPath, typographyCss(typography, viewports));
  console.log('✓ typography generated →', typeOutputPath);

  const warnings = typographyWarnings(typography);
  if (warnings.length) {
    console.warn(`⚠ typography.json: ${warnings.length} departure(s) from the type method:`);
    for (const warning of warnings) console.warn(`    ${warning}`);
  }
}

// Run directly: node scripts/generate-tokens.js (Vite calls generateTokens itself)
if (import.meta.url === pathToFileURL(process.argv[1]).href) generateTokens();
