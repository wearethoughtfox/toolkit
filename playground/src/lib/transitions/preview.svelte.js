// Dev only: the transition the /transitions picker is previewing. The root
// layout's <TransitionPreview> reads this and runs it on every navigation, so
// the preview is a real page-to-page view transition on the playground's own
// pages. Kept in the playground (rule of two): no site needs a picker.

import transitions from '@thoughtfox/toolkit/motion/transitions/transitions.json';

export { transitions };

// Each transition's CSS as text, loaded when picked. Text, not a <link>, so
// the reduced-motion toggle can rewrite the file's own media queries. Dev
// only, so a production build doesn't carry 1.2MB of CSS it never loads.
const files = import.meta.env.DEV
  ? import.meta.glob('../../../../motion/transitions/*/*.css', { query: '?raw', import: 'default' })
  : {};

const fileFor = (entry) => `../../../../motion/transitions/${entry.css.replace('css/transitions/', '')}`;

export const bySlug = Object.fromEntries(transitions.map((t) => [t.slug, t]));

/**
 * slug: the transition, or null for none (plain navigation)
 * motion: 'system' follows the OS setting; 'reduce' and 'full' force one
 *   branch of the file's own @media blocks, for this preview only
 * toned: apply the entry's override after the file, where it has one
 */
export const preview = $state({ slug: null, motion: 'system', toned: true });

const KEY = 'toolkit:transition-preview';

export function restore() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    if (saved && (saved.slug === null || bySlug[saved.slug])) Object.assign(preview, saved);
  } catch {
    // Storage blocked: start with nothing picked
  }
}

export function save() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(preview));
  } catch {
    // Storage blocked: the pick lasts until the next full reload
  }
}

/** The file's text, with the reduced-motion choice and the override applied. */
export async function previewCss({ slug, motion, toned }) {
  const entry = bySlug[slug];
  if (!entry) return '';
  const load = files[fileFor(entry)];
  if (!load) return '';
  let css = await load();
  if (motion !== 'system') {
    const reduce = motion === 'reduce';
    css = css
      .replaceAll('(prefers-reduced-motion: no-preference)', reduce ? 'not all' : 'all')
      .replaceAll('(prefers-reduced-motion: reduce)', reduce ? 'all' : 'not all');
  }
  if (toned && entry.override) css += `\n/* Override (transitions.json) */\n${entry.override.css}\n`;
  return css;
}
