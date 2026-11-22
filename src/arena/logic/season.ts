export function seasonLabel(start: string): string {
  const [y, m] = start.split('-').map(Number);
  const first = m >= 8 ? y : y - 1;
  return `${first}\u2013${String((first + 1) % 100).padStart(2, '0')}`;
}
