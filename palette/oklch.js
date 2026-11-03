/**
 * sRGB hex ↔ OKLCH, and fixed-hue tonal ramps.
 *
 * The conversion is Björn Ottosson's OKLab (https://bottosson.github.io/posts/oklab/),
 * with the sRGB → LMS matrices as published there and in CSS Color 4. No dependency:
 * palette/contrast.js uses this to write OKLCH and ramps into contrast.generated.json.
 *
 * Hex stays the source of truth. OKLCH is derived from it, for reading and exploring.
 */

const toLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toGamma = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function linearToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
}

function oklabToLinear([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ];
}

/** Unrounded OKLCH: l 0–1, c ≥ 0, h in degrees (0 for greys) */
export function hexToOklch(hex) {
  const [L, a, b] = linearToOklab(hexToRgb(hex).map((v) => toLinear(v / 255)));
  const c = Math.hypot(a, b);
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return { l: L, c, h: h < 0 ? h + 360 : h };
}

function oklchToLinear({ l, c, h }) {
  const rad = (h * Math.PI) / 180;
  return oklabToLinear([l, c * Math.cos(rad), c * Math.sin(rad)]);
}

const EPSILON = 1e-6;
const inGamut = (rgb) => rgb.every((v) => v >= -EPSILON && v <= 1 + EPSILON);

export function oklchToHex(lch) {
  const channels = oklchToLinear(lch).map((v) => {
    const byte = Math.round(toGamma(Math.min(1, Math.max(0, v))) * 255);
    return byte.toString(16).padStart(2, '0');
  });
  return `#${channels.join('')}`;
}

/**
 * Below this chroma the hue is noise, so it's shown as `none` (CSS Color 4's
 * missing hue). Pure greys convert to about 0.00000004.
 */
const GREY = 0.0005;

/** Rounded for display and JSON: L as a percentage to 1 dp, C to 3 dp, H to 1 dp */
export function roundOklch({ l, c, h }) {
  const grey = c < GREY;
  const out = {
    l: Math.round(l * 1000) / 10,
    c: grey ? 0 : Math.round(c * 1000) / 1000,
    h: grey ? null : Math.round(h * 10) / 10
  };
  // Fixed decimals in the string, so values line up in a column
  out.css = `oklch(${out.l.toFixed(1)}% ${grey ? 0 : out.c.toFixed(3)} ${grey ? 'none' : out.h.toFixed(1)})`;
  return out;
}

/** The highest chroma (up to `c`) that stays inside sRGB at this lightness and hue */
function fitChroma(l, c, h) {
  if (inGamut(oklchToLinear({ l, c, h }))) return c;
  let lo = 0;
  let hi = c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinear({ l, c: mid, h }))) lo = mid;
    else hi = mid;
  }
  return lo;
}

/**
 * Lightness of each ramp step, light to dark. Every colour uses the same
 * steps, so ramps line up by row and step 500 means the same lightness in each.
 */
export const rampSteps = [
  { step: 50, l: 0.97 },
  { step: 100, l: 0.93 },
  { step: 200, l: 0.86 },
  { step: 300, l: 0.78 },
  { step: 400, l: 0.7 },
  { step: 500, l: 0.62 },
  { step: 600, l: 0.54 },
  { step: 700, l: 0.46 },
  { step: 800, l: 0.38 },
  { step: 900, l: 0.3 },
  { step: 950, l: 0.22 }
];

/**
 * A fixed-hue ramp for one colour: keep its hue and chroma, step the
 * lightness, and pull the chroma in where that would leave sRGB. Each step's
 * OKLCH is re-read from its rounded hex, so the numbers match the colour shown.
 * `nearest` marks the step closest in lightness to the colour itself.
 */
export function ramp(hex) {
  const source = hexToOklch(hex);
  let nearest = 0;
  const steps = rampSteps.map(({ step, l }, i) => {
    if (Math.abs(l - source.l) < Math.abs(rampSteps[nearest].l - source.l)) nearest = i;
    const c = fitChroma(l, source.c, source.h);
    const stepHex = oklchToHex({ l, c, h: source.h });
    return {
      step,
      hex: stepHex,
      oklch: roundOklch(hexToOklch(stepHex)),
      clipped: c < source.c - 0.0005
    };
  });
  return { steps, nearest: rampSteps[nearest].step };
}
