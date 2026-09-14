import type { Setup } from "../setups";

// Ported from optionslab app/stats/lib/metrics/distributions.ts

export interface CdfPoint {
  pnl: number;
  /** share of setups with P/L <= pnl */
  fraction: number;
}

/** Empirical CDF of setup P/L: at x = 0 the curve shows the loss rate */
export function pnlCdf(setups: readonly Setup[]): CdfPoint[] {
  const sorted = setups.map((s) => s.realizedPnl).sort((a, b) => a - b);
  return sorted.map((pnl, index) => ({ pnl, fraction: (index + 1) / sorted.length }));
}

export interface HistogramBucket {
  /** inclusive */
  from: number;
  /** exclusive, except the last bucket */
  to: number;
  count: number;
}

/** Equal-width P/L buckets, width rounded to 1, 2.5 or 5 × 10ⁿ, so axis labels read cleanly */
export function pnlHistogram(setups: readonly Setup[], targetBuckets: number): HistogramBucket[] {
  const values = setups.map((s) => s.realizedPnl);
  if (values.length === 0) {
    return [];
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return [{ from: min, to: max, count: values.length }];
  }
  return histogram(values, niceWidth((max - min) / targetBuckets));
}

/** return on risk is clipped to ±200%, rare blowups pile into the edge bucket instead of stretching the chart */
const ROC_CLIP = 2;

/** Return on open value per setup in buckets of `width` (0.1 = 10%) */
export function rocDistribution(setups: readonly Setup[], width: number): HistogramBucket[] {
  const values: number[] = [];
  for (const setup of setups) {
    if (setup.returnOnOpenNetValue !== null) {
      values.push(Math.max(-ROC_CLIP, Math.min(ROC_CLIP, setup.returnOnOpenNetValue)));
    }
  }
  return histogram(values, width);
}

/** 0.3 / 0.1 is 2.9999999999999996 in floating point, nudge before flooring */
const EPSILON = 1e-9;

/** buckets aligned to multiples of width, from the one holding the smallest value to the one holding the largest */
function histogram(values: readonly number[], width: number): HistogramBucket[] {
  if (values.length === 0) {
    return [];
  }
  const first = Math.floor(Math.min(...values) / width + EPSILON);
  const last = Math.floor(Math.max(...values) / width + EPSILON);
  const buckets: HistogramBucket[] = [];
  for (let step = first; step <= last; step += 1) {
    buckets.push({ from: step * width, to: (step + 1) * width, count: 0 });
  }
  for (const value of values) {
    const bucket = buckets[Math.floor(value / width + EPSILON) - first];
    if (bucket) {
      bucket.count += 1;
    }
  }
  return buckets;
}

const QUARTER = 2.5;
const HALF = 5;
const WHOLE = 10;
const NICE_STEPS = [1, QUARTER, HALF, WHOLE];

/** smallest 1, 2.5, 5 or 10 × 10ⁿ not less than raw */
function niceWidth(raw: number): number {
  const base = 10 ** Math.floor(Math.log10(raw));
  const nice = NICE_STEPS.find((step) => raw / base <= step) ?? 1;
  return nice * base;
}
