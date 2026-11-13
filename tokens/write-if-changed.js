import { existsSync, readFileSync, writeFileSync } from 'fs';

/**
 * Writes a file only when its content would change, so a watcher on the
 * outputs (or the browser's HMR) never sees a write that did nothing.
 * Returns true when the file was written.
 */
export function writeIfChanged(path, content) {
  if (existsSync(path) && readFileSync(path, 'utf-8') === content) return false;
  writeFileSync(path, content);
  return true;
}
