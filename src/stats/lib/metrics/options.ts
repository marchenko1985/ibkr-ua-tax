import type { Setup } from "../setups";

// Ported from optionslab app/stats/lib/metrics/options.ts

export interface HoldingAsPctDteStats {
  sampleSize: number;
  meanRatio: number | null;
  medianRatio: number | null;
  meanHoldingDays: number | null;
  meanDteAtOpen: number | null;
}

/** holdingDays / DTE at open: did the trader let theta work or exit early? Setups opened on expiration day are skipped */
export function holdingAsPctDteStats(setups: readonly Setup[]): HoldingAsPctDteStats {
  const comparable = setups.filter((s) => s.dteAtOpenMin > 0);
  const ratios = comparable.map((s) => s.holdingDays / s.dteAtOpenMin);
  const count = comparable.length;
  return {
    sampleSize: count,
    meanRatio: count > 0 ? sum(ratios) / count : null,
    medianRatio: median(ratios),
    meanHoldingDays: count > 0 ? sum(comparable.map((s) => s.holdingDays)) / count : null,
    meanDteAtOpen: count > 0 ? sum(comparable.map((s) => s.dteAtOpenMin)) / count : null,
  };
}

export interface SingleMultiExpiryStats {
  singleCount: number;
  singlePnl: number;
  singleWinRate: number | null;
  multiCount: number;
  multiPnl: number;
  multiWinRate: number | null;
}

/** Single-expiry setups vs multi-expiry ones (calendars, diagonals) */
export function singleMultiExpiryStats(setups: readonly Setup[]): SingleMultiExpiryStats {
  const single = setups.filter((s) => s.singleExpiry);
  const multi = setups.filter((s) => !s.singleExpiry);
  return {
    singleCount: single.length,
    singlePnl: sum(single.map((s) => s.realizedPnl)),
    singleWinRate: single.length > 0 ? single.filter((s) => s.isWinner).length / single.length : null,
    multiCount: multi.length,
    multiPnl: sum(multi.map((s) => s.realizedPnl)),
    multiWinRate: multi.length > 0 ? multi.filter((s) => s.isWinner).length / multi.length : null,
  };
}

function sum(values: readonly number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle] ?? 0;
  return sorted.length % 2 === 0 ? ((sorted[middle - 1] ?? 0) + upper) / 2 : upper;
}
