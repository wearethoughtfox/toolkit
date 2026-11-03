/**
 * Turns typography.json into --type-* custom properties. Shared by the
 * token script (which writes _type.generated.css) and the /type lab (which
 * previews the same output), so the preview can't drift from the file.
 *
 * Sizes are written in rem. Line heights are written as unitless ratios
 * (leading ÷ size), so they follow any element that changes its font size.
 * The 4px rhythm is how you choose the px values in the lab, not what ships.
 *
 * Two modes:
 * - stepped (Chimero): the small setting below the breakpoint, the large
 *   one above it. The ratio gives exactly the chosen px at both settings.
 * - fluid: the size grows from viewports.min to the breakpoint, then stops.
 *   A ratio can't be fluid, so the line height is the mean of the two
 *   ends' ratios: within a pixel or so of the chosen px at each end.
 */

const rem = (px) => `${+(px / 16).toFixed(4)}rem`;
const ratio = ({ size, leading }) => +(leading / size).toFixed(4);
const meanRatio = (step) => +((ratio(step.small) + ratio(step.large)) / 2).toFixed(4);

function fluid(min, max, from, to) {
  if (min === max) return rem(min);
  const slope = (max - min) / (to - from);
  const intercept = min - slope * from;
  // clamp() takes its bounds in order. A value that gets smaller (a
  // line-height that tightens as the size grows) has its ends swapped, or
  // CSS would keep it at the small end's value.
  const [lower, upper] = min < max ? [min, max] : [max, min];
  return `clamp(${rem(lower)}, ${rem(intercept)} + ${+(slope * 100).toFixed(4)}vw, ${rem(upper)})`;
}

/** Size and line-height in px for one step at a viewport width */
export function settingAt(step, viewport, typography, viewports) {
  const { small, large } = step;
  if (typography.mode !== 'fluid' || typography.breakpoint <= viewports.min) {
    return viewport < typography.breakpoint ? small : large;
  }
  const p = Math.min(1, Math.max(0, (viewport - viewports.min) / (typography.breakpoint - viewports.min)));
  const size = small.size + (large.size - small.size) * p;
  // What the generated CSS gives: the fluid size times the one ratio
  return { size: +size.toFixed(1), leading: +(size * meanRatio(step)).toFixed(1) };
}

export function typographyCss(typography, viewports) {
  const { scale, candidates, breakpoint, maxWidth, mode } = typography;
  const stacks = Object.fromEntries(candidates.map((c) => [c.id, c.stack]));
  const isFluid = mode === 'fluid' && breakpoint > viewports.min;

  const lines = [
    '/* AUTO-GENERATED from typography.json — do not edit. Run `npm run tokens` to regenerate.',
    `   Mode: ${isFluid ? `fluid from ${viewports.min}px, stopping at ${breakpoint}px` : `stepped, switching at ${breakpoint}px`}.`,
    '   Edit it in the /type lab (development only). */',
    ':root {',
    `  --type-max-width: ${rem(maxWidth)};`
  ];

  for (const step of scale) {
    lines.push(`\n  /* ${step.name}: ${step.role} */`);
    lines.push(`  --type-${step.name}-font: ${stacks[step.face] ?? 'inherit'};`);
    lines.push(`  --type-${step.name}-weight: ${step.weight};`);
    if (isFluid) {
      lines.push(`  --type-${step.name}-size: ${fluid(step.small.size, step.large.size, viewports.min, breakpoint)};`);
      lines.push(`  --type-${step.name}-leading: ${meanRatio(step)};`);
    } else {
      lines.push(`  --type-${step.name}-size: ${rem(step.small.size)};`);
      lines.push(`  --type-${step.name}-leading: ${ratio(step.small)};`);
    }
  }
  lines.push('}');

  if (!isFluid) {
    lines.push(`\n@media (min-width: ${+(breakpoint / 16).toFixed(4)}em) {`, '  :root {');
    for (const step of scale) {
      lines.push(`    --type-${step.name}-size: ${rem(step.large.size)};`);
      lines.push(`    --type-${step.name}-leading: ${ratio(step.large)};`);
    }
    lines.push('  }', '}');
  }

  return lines.join('\n') + '\n';
}
