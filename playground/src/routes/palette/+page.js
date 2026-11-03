import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';

// Development tool only — production builds return 404
export function load() {
  if (!dev) error(404, 'Not found');
}
