// Shared labels for the /palette tools. Pass/fail is always WCAG 2.

export const uses = [
  { value: 'body', label: 'Body text', min: '4.5:1' },
  { value: 'largeText', label: 'Large text', min: '3:1' },
  { value: 'nonText', label: 'UI and graphics', min: '3:1' },
  { value: 'aaaBody', label: 'Body text, AAA', min: '7:1' }
];

export function level({ supports }) {
  if (supports.aaaBody) return 'AAA';
  if (supports.body) return 'AA';
  if (supports.largeText) return 'AA large';
  return 'Fail';
}

export function formatMetric(pair, metric) {
  return metric === 'apca' ? `Lc ${Math.round(pair.apca)}` : pair.ratio.toFixed(2);
}
