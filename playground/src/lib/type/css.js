/**
 * Turns typography.json into --type-* custom properties. Shared by the
 * token script (which writes _type.generated.css) and the /type lab (which
 * previews the same output), so the preview can't drift from the file.
 *
 * Two modes:
 * - stepped (Chimero): the small setting below the breakpoint, the large
 *   one above it. Every line-height stays on the 4px rhythm.
 * - fluid: grows from viewports.min to the breakpoint, then stops. Only the
 *   two ends are on the 4px rhythm; values in between are not.
 */

const rem = (px) => `${+(px / 16).toFixed(4)}rem`;

function fluid(min, max, from, to) {
  if (min === max) return rem(min);
  const slope = (max - min) / (to - from);
  const intercept = min - slope * from;
  return `clamp(${rem(min)}, ${rem(intercept)} + ${+(slope * 100).toFixed(4)}vw, ${rem(max)})`;
}

/** Size and line-height in px for one step at a viewport width */
export function settingAt(step, viewport, typography, viewports) {
  const { small, large } = step;
  if (typography.mode !== 'fluid' || typography.breakpoint <= viewports.min) {
    return viewport < typography.breakpoint ? small : large;
  }
  const p = Math.min(1, Math.max(0, (viewport - viewports.min) / (typography.breakpoint - viewports.min)));
  const mix = (a, b) => +(a + (b - a) * p).toFixed(1);
  return { size: mix(small.size, large.size), leading: mix(small.leading, large.leading) };
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
      lines.push(`  --type-${step.name}-leading: ${fluid(step.small.leading, step.large.leading, viewports.min, breakpoint)};`);
    } else {
      lines.push(`  --type-${step.name}-size: ${rem(step.small.size)};`);
      lines.push(`  --type-${step.name}-leading: ${rem(step.small.leading)};`);
    }
  }
  lines.push('}');

  if (!isFluid) {
    lines.push(`\n@media (min-width: ${+(breakpoint / 16).toFixed(4)}em) {`, '  :root {');
    for (const step of scale) {
      lines.push(`    --type-${step.name}-size: ${rem(step.large.size)};`);
      lines.push(`    --type-${step.name}-leading: ${rem(step.large.leading)};`);
    }
    lines.push('  }', '}');
  }

  return lines.join('\n') + '\n';
}
