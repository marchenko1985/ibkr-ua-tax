// Ported from optionslab app/stats/lib/metrics/constants.ts

export type SampleSize = "solid" | "small" | "noisy";

const SOLID_SHARE = 0.1;
const SOLID_MIN = 5;
const SOLID_MAX = 30;
const SMALL_SHARE = 0.03;
const SMALL_MIN = 3;

/**
 * Is a bucket big enough to trust, so 3-position buckets are not read as an edge. Thresholds scale
 * with the total: solid is 10% of setups bounded to 5..30, small is 3% but at least 3.
 */
export function classifySampleSize(bucketCount: number, totalCount: number): SampleSize {
  if (totalCount === 0) {
    return "noisy";
  }
  if (bucketCount >= Math.max(SOLID_MIN, Math.min(SOLID_MAX, Math.ceil(totalCount * SOLID_SHARE)))) {
    return "solid";
  }
  if (bucketCount >= Math.max(SMALL_MIN, Math.ceil(totalCount * SMALL_SHARE))) {
    return "small";
  }
  return "noisy";
}
