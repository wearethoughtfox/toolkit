/**
 * Browser-only measuring for the /type lab. Text is rendered with one span
 * per word ([data-word] holding its index), so lines can be read back from
 * the layout instead of estimated from character counts.
 */

/** Chimero's targets: 5–6 words per line in a 320px box, 10–14 in a 700px box */
export const boxes = [
  { width: 320, words: [5, 6] },
  { width: 700, words: [10, 14] }
];

export function lineStats(el) {
  const lines = [];
  let top = -Infinity;
  for (const word of el.querySelectorAll('[data-word]')) {
    if (word.offsetTop > top + 2) {
      lines.push([]);
      top = word.offsetTop;
    }
    lines.at(-1).push(Number(word.dataset.word));
  }
  if (!lines.length) return { lines: 0, average: 0, starts: [] };
  // The last line is usually short, so it's left out of the average
  const full = lines.length > 1 ? lines.slice(0, -1) : lines;
  const average = full.reduce((sum, line) => sum + line.length, 0) / full.length;
  return { lines: lines.length, average, starts: lines.map((line) => line[0]) };
}

/** How a words-per-line average compares with a [min, max] target */
export function verdict(average, [min, max]) {
  const rounded = Math.round(average * 10) / 10;
  if (rounded < min) return 'too few';
  if (rounded > max) return 'too many';
  return 'on target';
}

/**
 * Chimero's two targets drawn as a straight line: about 5.5 words per line
 * at 320px and 12 at 700px. The line is close to proportional, so word
 * counts can't find the breakpoint on their own; it's a judgement by eye.
 * This gives the count to judge against at any width.
 */
export function targetAt(width) {
  const [a, b] = boxes.map((box) => ({ width: box.width, words: (box.words[0] + box.words[1]) / 2 }));
  return a.words + ((width - a.width) * (b.words - a.words)) / (b.width - a.width);
}

let canvas;
function context() {
  canvas ??= document.createElement('canvas');
  return canvas.getContext('2d');
}

export function familyOf(stack) {
  return stack.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
}

const generic = new Set(['serif', 'sans-serif', 'monospace', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'cursive', 'fantasy']);

/**
 * Whether the first family in a stack is really rendering, or the browser
 * is showing a fallback. Loads @font-face fonts first, then compares widths
 * against two generic fallbacks: if both match, the family isn't there.
 */
export async function isAvailable(stack) {
  const family = familyOf(stack);
  if (generic.has(family)) return true;
  try {
    await document.fonts.load(`16px "${family}"`);
  } catch {
    // A bad family name just means it isn't available
  }
  const ctx = context();
  const sample = 'mmmmmmmmmmlli WQ@#0123';
  return ['monospace', 'serif'].some((fallback) => {
    ctx.font = `72px ${fallback}`;
    const without = ctx.measureText(sample).width;
    ctx.font = `72px "${family}", ${fallback}`;
    return ctx.measureText(sample).width !== without;
  });
}

/** x-height as a fraction of the font size */
export function xHeightRatio(stack, weight = 400) {
  const ctx = context();
  ctx.font = `${weight} 100px ${stack}`;
  return ctx.measureText('x').actualBoundingBoxAscent / 100;
}
