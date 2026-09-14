export function sum(values: readonly number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

export function mean(values: readonly number[]): number | null {
  return values.length > 0 ? sum(values) / values.length : null;
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle] ?? 0;
  return sorted.length % 2 === 0 ? ((sorted[middle - 1] ?? 0) + upper) / 2 : upper;
}
