import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import { readFileSync } from 'fs';
import { join } from 'path';

const tokensDir = join(process.cwd(), 'src/lib/design-tokens');
const read = (file) => JSON.parse(readFileSync(join(tokensDir, file), 'utf-8'));

// Development tool only — production builds return 404.
// Read from disk rather than imported, so saving doesn't reload the page.
export function load() {
  if (!dev) error(404, 'Not found');
  return { typography: read('typography.json'), viewports: read('viewports.json') };
}
