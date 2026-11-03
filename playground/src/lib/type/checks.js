/**
 * Checks typography.json against the rules in the thoughtfox-type skill.
 * Shared by the token script (printed as warnings) and the /type lab.
 * Nothing here changes a value: each message says what's wrong and
 * suggests the smallest fix.
 */

const namePattern = /^[a-z][a-z0-9-]*$/;
const ends = ['small', 'large'];
const round4 = (px) => Math.max(4, Math.round(px / 4) * 4);

/** Problems that would make the generated CSS wrong. These stop the build. */
export function typographyErrors(typography) {
  const errors = [];
  const { scale, candidates } = typography;
  if (!Array.isArray(scale)) return ['missing "scale" array'];
  if (!Array.isArray(candidates)) return ['missing "candidates" array'];

  const seen = new Set();
  for (const step of scale) {
    if (!namePattern.test(step.name ?? '')) errors.push(`scale: "${step.name}" must be lowercase kebab-case`);
    if (seen.has(step.name)) errors.push(`scale: "${step.name}" appears twice`);
    seen.add(step.name);
    for (const end of ends) {
      const { size, leading } = step[end] ?? {};
      if (!(size > 0 && leading > 0)) errors.push(`scale.${step.name}.${end}: needs a size and leading in px`);
    }
  }
  if (!(typography.breakpoint > 0)) errors.push('breakpoint: needs a width in px');
  if (!(typography.maxWidth > 0)) errors.push('maxWidth: needs a width in px');
  return errors;
}

/** Departures from the method. These are warnings, never errors. */
export function typographyWarnings(typography) {
  const out = [];
  const { scale, candidates } = typography;
  const faces = new Set(candidates.map((c) => c.id));
  const body = scale.find((s) => s.name === 'body');

  if (!body) out.push('No step is named "body". The body boxes and the breakpoint finder need one.');
  if (scale.length > 7) {
    out.push(`${scale.length} steps. Six or seven is usually enough: check spacing, weight and colour are doing their share before adding sizes.`);
  }

  for (const step of scale) {
    if (!faces.has(step.face)) out.push(`${step.name}: face "${step.face}" isn't one of the candidates.`);
    if (step.large.size < step.small.size) out.push(`${step.name}: gets smaller on wide screens (${step.small.size} → ${step.large.size}px).`);
    for (const end of ends) {
      const { size, leading } = step[end];
      if (leading % 4) out.push(`${step.name} (${end}): line-height ${leading}px is off the 4px rhythm. Nearest: ${round4(leading)}px.`);
      if (leading < size) out.push(`${step.name} (${end}): line-height ${leading}px is less than the ${size}px size, so lines will collide.`);
      if (body && step !== body && size > body[end].size && leading / size > 1.35) {
        out.push(`${step.name} (${end}): headline leading of ${(leading / size).toFixed(2)} is body-like, so the lines will drift apart. Try ${round4(size * 1.15)}px.`);
      }
    }
  }

  if (body && body.large.size > 20) {
    out.push(`Body is ${body.large.size}px on wide screens. Above about 20px the eye travels further and the reader scrolls more; use the extra room for layout instead.`);
  }

  for (const end of ends) {
    const sizes = [...new Set(scale.map((s) => s[end].size))].sort((a, b) => a - b);
    const smallEnd = body ? sizes.filter((s) => s <= body[end].size) : sizes;
    for (let i = 0; i + 2 < smallEnd.length; i++) {
      if (smallEnd[i + 2] - smallEnd[i] <= 2) {
        out.push(`${end}: ${smallEnd.slice(i, i + 3).join(', ')}px are three consecutive small sizes. Spread them and use weight or colour for the rest.`);
      }
    }
    for (let i = 0; i + 1 < sizes.length; i++) {
      const [a, b] = [sizes[i], sizes[i + 1]];
      if (b - a < 2 || b / a < 1.08) {
        out.push(`${end}: ${a}px and ${b}px are close enough to look like one size set inconsistently. Merge them, or separate them by weight, colour or face.`);
      }
    }
  }

  return out;
}
