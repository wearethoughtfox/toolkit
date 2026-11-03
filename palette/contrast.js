/**
 * Contrast data for every ordered pair of colours in colors.json.
 * WCAG 2 ratio decides pass/fail; APCA Lc is shown alongside as a guide
 * (it is polarity-sensitive, so fg/bg order matters).
 *
 * Also adds each colour's OKLCH (derived from its hex, which stays the source
 * of truth) and a fixed-hue tonal ramp per colour, checked against every
 * scheme's surface. Ramps are for exploring only: they are not written to tokens.
 *
 * Reads colors.json in the roles format (colors, roles, schemes) and writes
 * src/lib/palette/contrast.generated.json for the palette tools. Paths
 * resolve from the project root (process.cwd()). generate-tokens.js runs it
 * when colors.json uses roles.
 *
 * Run from a site root (prints every pair and scheme check):
 *   "contrast": "node node_modules/@thoughtfox/toolkit/palette/contrast.js"
 */

import { readFileSync, writeFileSync, mkdirSync, realpathSync } from 'fs';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { hexToOklch, roundOklch, ramp } from './oklch.js';

/**
 * apca-w3 is a dependency of the package. When the package is linked rather
 * than installed (the playground's "file:.."), npm puts it in the project's
 * node_modules, so look there too. Loaded on first use: sites that don't use
 * roles never need it.
 */
let apca;
function loadApca() {
  if (apca) return apca;
  for (const base of [import.meta.url, join(process.cwd(), 'package.json')]) {
    try {
      return (apca = createRequire(base)('apca-w3'));
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') throw error;
    }
  }
  throw new Error('The contrast check needs apca-w3. Run: npm install');
}

// WCAG 2 thresholds, by what the pair is used for
export const thresholds = {
  body: 4.5,
  largeText: 3,
  nonText: 3,
  aaaBody: 7
};

// What each role pair in a scheme must pass. Pairs whose roles don't exist are skipped.
export const schemeRules = [
  { fg: 'text', bg: 'surface', use: 'body', why: 'body text' },
  { fg: 'heading', bg: 'surface', use: 'largeText', why: 'headings (large text only)' },
  { fg: 'primary', bg: 'surface', use: 'body', why: 'links in running text' },
  { fg: 'on-primary', bg: 'primary', use: 'body', why: 'button labels' },
  { fg: 'border', bg: 'surface', use: 'nonText', why: 'borders that mark out controls' },
  { fg: 'accent', bg: 'surface', use: 'nonText', why: 'accents' },
  { fg: 'focus-ring', bg: 'surface', use: 'nonText', why: 'keyboard focus ring' }
];

export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

// Unrounded: h in degrees, s and l as 0–1
function rgbToHslExact([r, g, b]) {
  [r, g, b] = [r, g, b].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function rgbToHsl(rgb) {
  const [h, s, l] = rgbToHslExact(rgb);
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
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
  const { APCAcontrast, sRGBtoY } = loadApca();
  return APCAcontrast(sRGBtoY(hexToRgb(fgHex)), sRGBtoY(hexToRgb(bgHex)));
}

export function supports(ratio) {
  return Object.fromEntries(Object.entries(thresholds).map(([use, min]) => [use, ratio >= min]));
}

/**
 * The nearest tint of `hex` that reaches `min` against `otherHex`: keep the
 * hue and saturation, and step the lightness away from the other colour.
 * Returns null if no tint gets there.
 */
function nearestTint(hex, otherHex, min) {
  const [h, s, l] = rgbToHslExact(hexToRgb(hex));
  const step = luminance(hexToRgb(hex)) >= luminance(hexToRgb(otherHex)) ? 0.002 : -0.002;
  for (let next = l; next >= 0 && next <= 1; next += step) {
    const tint = hslToHex(h, s, next);
    const ratio = wcagRatio(tint, otherHex);
    if (ratio >= min) return { hex: tint, ratio: Math.round(ratio * 100) / 100 };
  }
  return null;
}

/**
 * Smallest corrections for a failing pair, for either side: the closest
 * existing palette colour that passes, then the nearest tint. Suggestions
 * only: nothing is changed.
 */
function suggestFixes(rule, fgName, bgName, colors, min) {
  const fixes = [];
  const round = (ratio) => Math.round(ratio * 100) / 100;
  const distance = (a, b) => Math.hypot(...hexToRgb(a).map((v, i) => v - hexToRgb(b)[i]));

  for (const [role, from, other] of [
    [rule.fg, fgName, bgName],
    [rule.bg, bgName, fgName]
  ]) {
    const alternative = Object.keys(colors)
      .filter((name) => name !== from && name !== other)
      .filter((name) => wcagRatio(colors[name], colors[other]) >= min)
      .sort((a, b) => distance(colors[a], colors[from]) - distance(colors[b], colors[from]))[0];
    if (alternative) {
      const ratio = round(wcagRatio(colors[alternative], colors[other]));
      fixes.push({ kind: 'palette', role, from, to: alternative, ratio });
    }

    const tint = nearestTint(colors[from], colors[other], min);
    if (tint) fixes.push({ kind: 'tint', role, from, to: tint.hex, ratio: tint.ratio });
  }

  return fixes;
}

// Every scheme (roles = "default") checked against schemeRules
export function checkSchemes({ colors, roles, schemes = {} }) {
  const all = { default: roles };
  for (const [name, overrides] of Object.entries(schemes)) all[name] = { ...roles, ...overrides };

  return Object.fromEntries(
    Object.entries(all).map(([scheme, map]) => [
      scheme,
      schemeRules
        .filter((rule) => rule.fg in map && rule.bg in map)
        .map((rule) => {
          const fg = map[rule.fg];
          const bg = map[rule.bg];
          const min = thresholds[rule.use];
          const ratio = wcagRatio(colors[fg], colors[bg]);
          const pass = ratio >= min;
          return {
            ...rule,
            fgColor: fg,
            bgColor: bg,
            ratio: Math.round(ratio * 100) / 100,
            apca: Math.round(apcaLc(colors[fg], colors[bg]) * 10) / 10,
            min,
            pass,
            fixes: pass ? [] : suggestFixes(rule, fg, bg, colors, min)
          };
        })
    ])
  );
}

export function schemeWarnings(checks) {
  const lines = [];
  for (const [scheme, results] of Object.entries(checks)) {
    for (const r of results.filter((r) => !r.pass)) {
      const fixes = r.fixes.map(
        (f) =>
          `${f.role}: ${f.from} → ${f.kind === 'tint' ? `tint ${f.to}` : f.to} (${f.ratio.toFixed(2)})`
      );
      lines.push(
        `scheme "${scheme}": ${r.fg} (${r.fgColor}) on ${r.bg} (${r.bgColor}) is ${r.ratio.toFixed(2)}:1, ` +
          `needs ${r.min} for ${r.why}.\n    ` +
          (fixes.length ? `Smallest fixes: ${fixes.join(' · ')}` : 'No palette colour or tint fixes it.')
      );
    }
  }
  return lines;
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
      oklch: roundOklch(hexToOklch(colors[name])),
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

  const schemeChecks = checkSchemes({ colors, roles, schemes });

  // One surface per scheme, for checking ramp steps against
  const surfaces = Object.entries({ default: roles, ...schemes })
    .map(([scheme, map]) => ({ scheme, color: map.surface ?? roles.surface }))
    .filter((s) => s.color in colors)
    .map((s) => ({ ...s, hex: colors[s.color] }));

  const ramps = names.map((name) => {
    const { steps, nearest } = ramp(colors[name]);
    return {
      name,
      hex: colors[name],
      nearest,
      steps: steps.map((step) => ({
        ...step,
        on: Object.fromEntries(
          surfaces.map((s) => {
            const ratio = wcagRatio(step.hex, s.hex);
            return [
              s.scheme,
              {
                ratio: Math.round(ratio * 100) / 100,
                apca: Math.round(apcaLc(step.hex, s.hex) * 10) / 10,
                supports: supports(ratio)
              }
            ];
          })
        )
      }))
    };
  });

  return { thresholds, colors: colorList, roles, schemes, pairs, schemeChecks, surfaces, ramps };
}

export function generateContrast({
  colorsPath = join(process.cwd(), 'src/lib/design-tokens/colors.json'),
  output = join(process.cwd(), 'src/lib/palette/contrast.generated.json')
} = {}) {
  const data = buildContrast(JSON.parse(readFileSync(colorsPath, 'utf-8')));
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(data, null, 2) + '\n');
  console.log('✓ contrast generated →', output);
  for (const line of schemeWarnings(data.schemeChecks)) console.warn(`⚠ ${line}`);
  return data;
}

// Run directly: print every pair, best first
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const { pairs, schemeChecks } = generateContrast();
  const label = ({ supports: s }) =>
    s.aaaBody ? 'AAA' : s.body ? 'AA' : s.largeText ? 'AA large / UI' : 'fail';
  console.log('\nPairs');
  for (const p of [...pairs].sort((a, b) => b.ratio - a.ratio)) {
    console.log(
      `${p.ratio.toFixed(2).padStart(6)}  Lc ${String(p.apca).padStart(6)}  ${label(p).padEnd(13)}  ${p.fg} on ${p.bg}`
    );
  }
  for (const [scheme, results] of Object.entries(schemeChecks)) {
    console.log(`\nScheme: ${scheme}`);
    for (const r of results) {
      console.log(
        `  ${r.pass ? '✓' : '✗'} ${r.ratio.toFixed(2).padStart(6)} (needs ${r.min})  ${r.fg} (${r.fgColor}) on ${r.bg} (${r.bgColor}) — ${r.why}`
      );
    }
  }
}
