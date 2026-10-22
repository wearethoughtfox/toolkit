/**
 * Contrast data for every ordered pair of colours in colors.json.
 * WCAG 2 ratio decides pass/fail; APCA Lc is shown alongside as a guide
 * (it is polarity-sensitive, so fg/bg order matters).
 *
 * Writes src/lib/palette/contrast.generated.json for the /palette page.
 * Run: npm run contrast   (prints a summary; also runs with npm run tokens)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { APCAcontrast, sRGBtoY } from 'apca-w3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const colorsPath = join(__dirname, '../src/lib/design-tokens/colors.json');
const outputPath = join(__dirname, '../src/lib/palette/contrast.generated.json');

// WCAG 2 thresholds, by what the pair is used for
export const thresholds = {
  body: 4.5,
  largeText: 3,
  nonText: 3,
  aaaBody: 7
};

export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function rgbToHsl([r, g, b]) {
  [r, g, b] = [r, g, b].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)];
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function wcagRatio(fgHex, bgHex) {
  const [a, b] = [luminance(hexToRgb(fgHex)), luminance(hexToRgb(bgHex))].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

export function apcaLc(fgHex, bgHex) {
  return APCAcontrast(sRGBtoY(hexToRgb(fgHex)), sRGBtoY(hexToRgb(bgHex)));
}

export function supports(ratio) {
  return Object.fromEntries(Object.entries(thresholds).map(([use, min]) => [use, ratio >= min]));
}

export function buildContrast({ colors, roles, schemes = {} }) {
  const names = Object.keys(colors);

  // Reference columns: this colour as text on pure black / pure white
  const against = (hex, bg) => ({
    ratio: Math.round(wcagRatio(hex, bg) * 100) / 100,
    apca: Math.round(apcaLc(hex, bg) * 10) / 10
  });

  const colorList = names.map((name) => {
    const rgb = hexToRgb(colors[name]);
    return {
      name,
      hex: colors[name],
      rgb,
      hsl: rgbToHsl(rgb),
      roles: Object.keys(roles).filter((role) => roles[role] === name),
      onBlack: against(colors[name], '#000000'),
      onWhite: against(colors[name], '#FFFFFF')
    };
  });

  const pairs = [];
  for (const fg of names) {
    for (const bg of names) {
      if (fg === bg) continue;
      const ratio = wcagRatio(colors[fg], colors[bg]);
      pairs.push({
        fg,
        bg,
        ratio: Math.round(ratio * 100) / 100,
        apca: Math.round(apcaLc(colors[fg], colors[bg]) * 10) / 10,
        supports: supports(ratio)
      });
    }
  }

  return { thresholds, colors: colorList, roles, schemes, pairs };
}

export function generateContrast() {
  const data = buildContrast(JSON.parse(readFileSync(colorsPath, 'utf-8')));
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(data, null, 2) + '\n');
  console.log('✓ contrast generated →', outputPath);
  return data;
}

// Run directly: print every pair, best first
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { pairs } = generateContrast();
  const label = ({ supports: s }) =>
    s.aaaBody ? 'AAA' : s.body ? 'AA' : s.largeText ? 'AA large / UI' : 'fail';
  for (const p of [...pairs].sort((a, b) => b.ratio - a.ratio)) {
    console.log(
      `${p.ratio.toFixed(2).padStart(6)}  Lc ${String(p.apca).padStart(6)}  ${label(p).padEnd(13)}  ${p.fg} on ${p.bg}`
    );
  }
}
