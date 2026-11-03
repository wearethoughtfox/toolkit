import { dev } from '$app/environment';
import { error, json } from '@sveltejs/kit';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { typographyErrors, typographyWarnings } from '@thoughtfox/toolkit/type/checks.js';
import { generateTokens } from '../../../../scripts/generate-tokens.js';

const path = join(process.cwd(), 'src/lib/design-tokens/typography.json');

// Development tool only: writes typography.json and regenerates the tokens
export async function POST({ request }) {
  if (!dev) error(404, 'Not found');

  const typography = await request.json();
  const errors = typographyErrors(typography);
  if (errors.length) return json({ errors }, { status: 400 });

  writeFileSync(path, JSON.stringify(typography, null, 2) + '\n');
  generateTokens();
  return json({ warnings: typographyWarnings(typography) });
}
